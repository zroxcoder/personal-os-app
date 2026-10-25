// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const s = useSettingsStore.getState();
    return {
      shouldPlaySound: s.soundEnabled,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (Platform.OS === 'android') {
      const s = useSettingsStore.getState();
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: s.vibrationEnabled ? [0, 250, 250, 250] : undefined,
        lightColor: '#FF231F7C',
      });
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleTaskNotification(title: string, dateStr: string, timeStr: string) {
  try {
    // ✅ Respect user preference
    if (!useSettingsStore.getState().taskRemindersEnabled) return null;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const deadlineDate = new Date(year, month - 1, day, hours, minutes);
    const triggerDate = new Date(deadlineDate.getTime() - 15 * 60000);
    if (triggerDate.getTime() <= Date.now()) return null;

    const secondsUntil = Math.max(1, Math.floor((triggerDate.getTime() - Date.now()) / 1000));

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Task Reminder ⏰',
        body: `Your task "${title}" is due in 15 minutes!`,
      },
      trigger: { type: 'timeInterval', seconds: secondsUntil, repeats: false, channelId: 'default' } as any,
    });
  } catch { return null; }
}

const REMINDER_SCHEDULE = [
  { daysBefore: 7, hour: 9,  minute: 0,  label: 'in 1 week' },
  { daysBefore: 3, hour: 9,  minute: 0,  label: 'in 3 days' },
  { daysBefore: 1, hour: 23, minute: 59, label: 'tomorrow' },
  { daysBefore: 0, hour: 9,  minute: 0,  label: 'today' },
];

async function scheduleMultipleReminders(
  dueDateStr: string,
  contentFor: (label: string, isFinal: boolean) => { title: string; body: string }
): Promise<string[]> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return [];

    const [year, month, day] = dueDateStr.split('-').map(Number);
    const ids: string[] = [];

    for (const r of REMINDER_SCHEDULE) {
      const target = new Date(year, month - 1, day - r.daysBefore, r.hour, r.minute, 0);
      if (target.getTime() <= Date.now()) continue;

      try {
        const content = contentFor(r.label, r.daysBefore === 0);
        const secondsUntil = Math.max(1, Math.floor((target.getTime() - Date.now()) / 1000));
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: 'timeInterval', seconds: secondsUntil, repeats: false, channelId: 'default' } as any,
        });
        ids.push(id);
      } catch {}
    }
    return ids;
  } catch { return []; }
}

export async function scheduleBillReminders(
  title: string,
  dueDateStr: string,
  type: 'income' | 'expense'
): Promise<string[]> {
  // ✅ Respect user preference
  if (!useSettingsStore.getState().billRemindersEnabled) return [];
  const verb = type === 'expense' ? 'pay' : 'receive';
  const noun = type === 'expense' ? 'Payment' : 'Income';
  return scheduleMultipleReminders(dueDateStr, (label, isFinal) => ({
    title: `${noun} Reminder ${isFinal ? '🔔' : '⏰'}`,
    body: `Don't forget to ${verb} "${title}" ${label}!`,
  }));
}

export async function scheduleProjectDeadlineReminders(
  projectTitle: string,
  deadlineStr: string
): Promise<string[]> {
  // ✅ Respect user preference
  if (!useSettingsStore.getState().projectRemindersEnabled) return [];
  return scheduleMultipleReminders(deadlineStr, (label, isFinal) => ({
    title: `Project Deadline ${isFinal ? '🔔' : '⏰'}`,
    body: `Project "${projectTitle}" is due ${label}!`,
  }));
}

export async function cancelNotification(notificationId: string) {
  try {
    if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
}

export async function cancelMultipleNotifications(ids: string[] | undefined) {
  if (!ids || ids.length === 0) return;
  for (const id of ids) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  }
}

// ✅ Cancel ALL scheduled notifications (used by Clear All Data)
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}