// src/screens/PlannerScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Circle, Plus, Trash2, Pencil } from 'lucide-react-native';
import { useTaskStore, Task } from '../store/useTaskStore';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import TaskFormModal from '../components/TaskFormModal';
import { scheduleTaskNotification, cancelNotification } from '../utils/notifications';

export default function PlannerScreen() {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  
  const todayString = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayString);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const markedDates: any = {};
  tasks.forEach(task => {
    markedDates[task.date] = { marked: true, dotColor: COLORS.primary };
  });
  markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: COLORS.primary };

  const tasksForSelectedDate = tasks.filter(task => task.date === selectedDate);

  const handleSaveTask = async (taskData: Partial<Task>) => {
    // ✅ Wrap notification in try/catch so a failure doesn't block saving
    let notificationId: string | null = null;
    try {
      if (taskData.title && taskData.date && taskData.time) {
        notificationId = await scheduleTaskNotification(taskData.title, taskData.date, taskData.time);
      }
    } catch (e) {
      console.log('Notification scheduling failed:', e);
    }

    if (editingTask) {
      try {
        if (editingTask.notificationId) await cancelNotification(editingTask.notificationId);
      } catch (e) {
        console.log('Cancel notification failed:', e);
      }
      updateTask(editingTask.id, { ...taskData, notificationId });
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title!,
        time: taskData.time!,
        priority: taskData.priority!,
        completed: false,
        date: taskData.date!,
        notificationId,
      };
      addTask(newTask);
    }
    setModalVisible(false);
    setEditingTask(null);
  };

  const handleDelete = async (task: Task) => {
    try {
      if (task.notificationId) await cancelNotification(task.notificationId);
    } catch (e) {
      console.log('Cancel notification failed:', e);
    }
    deleteTask(task.id);
  };

  const renderTask = ({ item }: { item: Task }) => (
    <GlassCard style={styles.taskCard}>
      <View style={styles.taskTimeContainer}>
        <View style={[styles.dot, { backgroundColor: item.completed ? COLORS.accent : COLORS.primary }]} />
        <Text style={styles.taskTime}>{item.time}</Text>
      </View>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>{item.title}</Text>
        <Text style={styles.taskPriority}>{item.priority} Priority</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => { setEditingTask(item); setModalVisible(true); }} style={{ marginRight: 15 }}>
          <Pencil color={COLORS.textLight} size={18} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Trash2 color={COLORS.textLight} size={18} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Planner</Text>
          <GlassCard style={styles.todayBadge} intensity={80}>
            <Text style={styles.todayText}>Today</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.calendarWrapper}>
          <Calendar
            current={todayString}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            style={{ backgroundColor: 'transparent' }}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: COLORS.textLight,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.textDark,
              textDisabledColor: 'rgba(0,0,0,0.2)',
              dotColor: COLORS.primary,
              selectedDotColor: '#ffffff',
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.textDark,
              indicatorColor: COLORS.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
            }}
          />
        </GlassCard>

        <View style={styles.eventsSection}>
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>{selectedDate === todayString ? "Today's Events" : `Events on ${selectedDate}`}</Text>
            <Text style={styles.eventsCount}>{tasksForSelectedDate.length} tasks</Text>
          </View>

          <FlatList
            data={tasksForSelectedDate}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Circle color={COLORS.textLight} size={40} />
                <Text style={styles.emptyText}>No events planned for this day.</Text>
              </View>
            }
          />
        </View>

        <TouchableOpacity style={styles.fab} onPress={() => { setEditingTask(null); setModalVisible(true); }}>
          <Plus color="#FFF" size={30} />
        </TouchableOpacity>

        <TaskFormModal 
          visible={modalVisible} 
          onClose={() => { setModalVisible(false); setEditingTask(null); }} 
          onSave={handleSaveTask}
          initialTask={editingTask}
          initialDate={selectedDate}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  todayBadge: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  todayText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  calendarWrapper: { marginHorizontal: 15, marginBottom: 20, padding: 5 },
  eventsSection: { flex: 1, paddingHorizontal: 20 },
  eventsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  eventsTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  eventsCount: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  taskCard: { flexDirection: 'row', padding: 15, marginBottom: 12, justifyContent: 'space-between', alignItems: 'center' },
  taskTimeContainer: { width: 80, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.1)', paddingRight: 10, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 5 },
  taskTime: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  taskContent: { flex: 1, paddingLeft: 15, justifyContent: 'center' },
  taskTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 4 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: COLORS.textLight },
  taskPriority: { fontSize: 11, color: COLORS.textLight },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textLight, marginTop: 10, fontSize: 14 },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
});