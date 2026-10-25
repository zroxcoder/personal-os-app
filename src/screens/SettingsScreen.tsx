// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Switch,
  Modal, ScrollView, TextInput, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft, Trash2, Bell, Shield, Info, HelpCircle, Mail,
  Download, Upload, X, CheckCircle2, Folder, Wallet,
} from 'lucide-react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTaskStore } from '../store/useTaskStore';
import { useNoteStore } from '../store/useNoteStore';
import { useProjectStore } from '../store/useProjectStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { usePasswordStore } from '../store/usePasswordStore';
import { useProfileStore } from '../store/useProfileStore';
import { useStreakStore } from '../store/useStreakStore';
import { cancelAllNotifications } from '../utils/notifications';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';

type InfoModal = 'none' | 'about' | 'privacy' | 'help' | 'contact' | 'export' | 'import';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const settings = useSettingsStore();
  const taskStore = useTaskStore();
  const noteStore = useNoteStore();
  const projectStore = useProjectStore();
  const expenseStore = useExpenseStore();
  const passwordStore = usePasswordStore();
  const profileStore = useProfileStore();
  const streakStore = useStreakStore();

  const [activeModal, setActiveModal] = useState<InfoModal>('none');
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');

  // ---- Clear All Data ----
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete:\n\n• All tasks, notes, projects\n• All bills & transactions\n• All passwords\n• Profile info\n• Settings\n• Streak & pet progress\n\nThis cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything', style: 'destructive',
          onPress: async () => {
            try {
              // 1. Cancel all scheduled notifications (OS-level)
              await cancelAllNotifications();

              // 2. Wipe persisted storage
              await AsyncStorage.clear();

              // 3. Reset in-memory stores so UI updates immediately
              useSettingsStore.setState({
                taskRemindersEnabled: true,
                billRemindersEnabled: true,
                projectRemindersEnabled: true,
                soundEnabled: true,
                vibrationEnabled: true,
              });
              useTaskStore.setState({ tasks: [] });
              useNoteStore.setState({
                notes: [],
                categories: ['General', 'Study', 'Work', 'Personal', 'Ideas'],
              });
              useProjectStore.setState({ projects: [] });
              useExpenseStore.setState({
                transactions: [],
                currency: 'USD',
                monthlyBudget: 1000,
              });
              usePasswordStore.setState({ passwords: [] });
              useProfileStore.setState({
                name: 'Write Your Name',
                email: 'Email address',
                bio: 'Welcome to Personal OS! This is your profile. You can edit it anytime.',
                avatarColor: '#2E4A35',
                avatarEmoji: '🚀',
                joinedAt: new Date().toISOString(),
              });

              // 4. Reset streak (also cancels the streak pet state)
              useStreakStore.getState().reset();

              Alert.alert(
                'Data Cleared',
                'All data has been deleted. Please restart the app for a completely clean state.',
                [{ text: 'OK' }]
              );
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  // ---- Export ----
  const handleExport = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        tasks: taskStore.tasks,
        notes: noteStore.notes,
        noteCategories: noteStore.categories,
        projects: projectStore.projects,
        transactions: expenseStore.transactions,
        currency: expenseStore.currency,
        monthlyBudget: expenseStore.monthlyBudget,
        passwords: passwordStore.passwords,
        profile: {
          name: profileStore.name,
          email: profileStore.email,
          bio: profileStore.bio,
          avatarColor: profileStore.avatarColor,
          avatarEmoji: profileStore.avatarEmoji,
          joinedAt: profileStore.joinedAt,
        },
        settings: {
          taskRemindersEnabled: settings.taskRemindersEnabled,
          billRemindersEnabled: settings.billRemindersEnabled,
          projectRemindersEnabled: settings.projectRemindersEnabled,
          soundEnabled: settings.soundEnabled,
          vibrationEnabled: settings.vibrationEnabled,
        },
        // ✅ NEW: Streak included in backup
        streak: {
          currentStreak: streakStore.currentStreak,
          longestStreak: streakStore.longestStreak,
          lastOpenDate: streakStore.lastOpenDate,
          totalDaysOpened: streakStore.totalDaysOpened,
        },
      },
    };
    const json = JSON.stringify(payload, null, 2);
    setExportJson(json);
    setActiveModal('export');
  };

  const handleShareExport = async () => {
    try {
      await Share.share({
        message: exportJson,
        title: 'Personal OS Backup',
      });
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  };

  // ---- Import ----
  const handleImport = () => {
    setImportJson('');
    setActiveModal('import');
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Backup',
      'This will OVERWRITE all current data with the backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore', style: 'destructive',
          onPress: async () => {
            try {
              const parsed = JSON.parse(importJson);
              const d = parsed.data;
              if (!d) throw new Error('Invalid backup format.');

              if (d.tasks) useTaskStore.setState({ tasks: d.tasks });
              if (d.notes) useNoteStore.setState({ notes: d.notes });
              if (d.noteCategories) useNoteStore.setState({ categories: d.noteCategories });
              if (d.projects) useProjectStore.setState({ projects: d.projects });
              if (d.transactions) useExpenseStore.setState({ transactions: d.transactions });
              if (d.currency) useExpenseStore.setState({ currency: d.currency });
              if (typeof d.monthlyBudget === 'number') useExpenseStore.setState({ monthlyBudget: d.monthlyBudget });
              if (d.passwords) usePasswordStore.setState({ passwords: d.passwords });
              if (d.profile) useProfileStore.setState(d.profile);
              if (d.settings) useSettingsStore.setState(d.settings);
              // ✅ NEW: Restore streak from backup
              if (d.streak) useStreakStore.setState(d.streak);

              setActiveModal('none');
              Alert.alert('Restored', 'Backup restored successfully.');
            } catch (e: any) {
              Alert.alert('Import Failed', e.message || 'Invalid backup.');
            }
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
            <ArrowLeft color={COLORS.textDark} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* ── Notifications ── */}
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <GlassCard style={styles.section}>
            <ToggleRow
              icon={<Bell color={COLORS.primary} size={20} />}
              label="Task Reminders"
              sublabel="15 min before due time"
              value={settings.taskRemindersEnabled}
              onToggle={settings.toggleTaskReminders}
            />
            <ToggleRow
              icon={<Wallet color={COLORS.primary} size={20} />}
              label="Bill Reminders"
              sublabel="1 week, 3 days, night before & on due"
              value={settings.billRemindersEnabled}
              onToggle={settings.toggleBillReminders}
            />
            <ToggleRow
              icon={<Folder color={COLORS.primary} size={20} />}
              label="Project Deadlines"
              sublabel="Reminders before project deadlines"
              value={settings.projectRemindersEnabled}
              onToggle={settings.toggleProjectReminders}
            />
            <ToggleRow
              icon={<Bell color={COLORS.primary} size={20} />}
              label="Sound"
              value={settings.soundEnabled}
              onToggle={settings.toggleSound}
              noBorder
            />
          </GlassCard>

          {/* ── Data ── */}
          <Text style={styles.sectionLabel}>DATA</Text>
          <GlassCard style={styles.section}>
            <TouchableOpacity style={styles.row} onPress={handleExport}>
              <View style={styles.rowLeft}>
                <Download color={COLORS.primary} size={20} />
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.rowText}>Export Backup</Text>
                  <Text style={styles.rowSub}>Save as JSON</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleImport}>
              <View style={styles.rowLeft}>
                <Upload color={COLORS.primary} size={20} />
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.rowText}>Import Backup</Text>
                  <Text style={styles.rowSub}>Restore from JSON</Text>
                </View>
              </View>
            </TouchableOpacity>
          </GlassCard>

          {/* ── About / Privacy / Help / Contact ── */}
          <Text style={styles.sectionLabel}>MORE</Text>
          <GlassCard style={styles.section}>
            <InfoRow icon={<Info color={COLORS.primary} size={20} />} label="About" onPress={() => setActiveModal('about')} />
            <InfoRow icon={<Shield color={COLORS.primary} size={20} />} label="Privacy" onPress={() => setActiveModal('privacy')} />
            <InfoRow icon={<HelpCircle color={COLORS.primary} size={20} />} label="Help & FAQ" onPress={() => setActiveModal('help')} />
            <InfoRow icon={<Mail color={COLORS.primary} size={20} />} label="Contact" onPress={() => setActiveModal('contact')} noBorder />
          </GlassCard>

          {/* ── Danger Zone ── */}
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData} activeOpacity={0.85}>
            <Trash2 color="#FF6B6B" size={20} />
            <Text style={styles.dangerText}>Clear All App Data</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Personal OS v1.0.0</Text>
        </ScrollView>

        {/* ── Info / Privacy / Help / Contact Modals ── */}
        <Modal visible={['about', 'privacy', 'help', 'contact'].includes(activeModal)} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {activeModal === 'about' ? 'About' :
                   activeModal === 'privacy' ? 'Privacy' :
                   activeModal === 'help' ? 'Help & FAQ' : 'Contact'}
                </Text>
                <TouchableOpacity onPress={() => setActiveModal('none')}>
                  <X color={COLORS.textDark} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={styles.modalBody}>
                  {activeModal === 'about' && (
                    `Personal OS v1.0.0\n\nYour all-in-one productivity companion.\n\nBuilt with:\n• React Native & Expo\n• TypeScript\n• Zustand for state\n• Fully offline\n\nNo data ever leaves your device.`
                  )}
                  {activeModal === 'privacy' && (
                    `Your privacy is guaranteed.\n\n• All data is stored ONLY on your device\n• No servers, no accounts, no tracking\n• No ads, no analytics\n• Nothing is ever sent to the internet\n\nBackups are encrypted only if you password-protect them when sharing.`
                  )}
                  {activeModal === 'help' && (
                    `FAQ\n\n▪ How do I add a task?\nTap Tasks → + button.\n\n▪ How do reminders work?\nTask reminders: 15 min before due.\nBill/Project reminders: 1 week, 3 days, night before & day of.\n\n▪ Can I sync across devices?\nNot yet — but you can export a backup and import it on another phone.\n\n▪ Lost data?\nAlways export a backup from Settings → Data → Export Backup.`
                  )}
                  {activeModal === 'contact' && (
                    `Get in touch\n\n📧 Email: support@personalos.app\n🐙 GitHub: github.com/personalos\n🐦 Twitter: @personalos_app\n\nWe read every message!\n\nFor bug reports, please include:\n• What you were doing\n• App version (v1.0.0)`
                  )}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Export Modal ── */}
        <Modal visible={activeModal === 'export'} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Export Backup</Text>
                <TouchableOpacity onPress={() => setActiveModal('none')}>
                  <X color={COLORS.textDark} size={24} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Save this JSON somewhere safe. Use it later to restore your data.</Text>
              <TextInput
                style={styles.jsonBox}
                value={exportJson}
                editable={false}
                multiline
                selectTextOnFocus
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleShareExport}>
                <Download color="#FFF" size={18} />
                <Text style={styles.primaryBtnText}>Share / Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Import Modal ── */}
        <Modal visible={activeModal === 'import'} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Import Backup</Text>
                <TouchableOpacity onPress={() => setActiveModal('none')}>
                  <X color={COLORS.textDark} size={24} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Paste your JSON backup below. This will REPLACE all current data.</Text>
              <TextInput
                style={styles.jsonBox}
                value={importJson}
                onChangeText={setImportJson}
                multiline
                placeholder='{"version":1,"data":{...}}'
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#FF6B6B' }]}
                onPress={handleRestore}
              >
                <CheckCircle2 color="#FFF" size={18} />
                <Text style={styles.primaryBtnText}>Restore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

// ── Reusable small rows ──
function ToggleRow({ icon, label, sublabel, value, onToggle, noBorder }: any) {
  return (
    <View style={[styles.row, noBorder && { borderBottomWidth: 0 }]}>
      <View style={styles.rowLeft}>
        {icon}
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.rowText}>{label}</Text>
          {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
        thumbColor="#FFF"
      />
    </View>
  );
}

function InfoRow({ icon, label, onPress, noBorder }: any) {
  return (
    <TouchableOpacity style={[styles.row, noBorder && { borderBottomWidth: 0 }]} onPress={onPress}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={[styles.rowText, { marginLeft: 15 }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textLight,
    marginTop: 10, marginBottom: 8, marginLeft: 5, letterSpacing: 1,
  },
  section: { paddingHorizontal: 15, marginBottom: 15 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowText: { fontSize: 15, color: COLORS.textDark, fontWeight: '600' },
  rowSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  dangerButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255, 229, 229, 0.9)',
    padding: 15, borderRadius: 12, marginTop: 15,
    borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  dangerText: { color: '#FF6B6B', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

  version: { textAlign: 'center', color: COLORS.textLight, marginTop: 30, fontSize: 12, fontWeight: '500' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 25, borderTopRightRadius: 25,
    padding: 20, maxHeight: '85%', minHeight: '40%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  modalBody: { fontSize: 15, color: COLORS.textDark, lineHeight: 24 },

  hint: { fontSize: 13, color: COLORS.textLight, marginBottom: 12, lineHeight: 18 },
  jsonBox: {
    backgroundColor: COLORS.background, borderRadius: 10, padding: 12,
    fontSize: 11, fontFamily: 'monospace', color: COLORS.textDark,
    height: 200, marginBottom: 15,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    padding: 14, borderRadius: 12,
  },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
});