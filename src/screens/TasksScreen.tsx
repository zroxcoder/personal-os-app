// src/screens/TasksScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CheckCircle2, Circle, Clock, Trash2, Pencil } from 'lucide-react-native';
import { useTaskStore, Task } from '../store/useTaskStore';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import TaskFormModal from '../components/TaskFormModal';
import { scheduleTaskNotification, cancelNotification } from '../utils/notifications';

export default function TasksScreen() {
  const { tasks, addTask, updateTask, toggleTask, deleteTask } = useTaskStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'All' | 'Today' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDeleteTask = async (task: Task) => {
    try {
      if (task.notificationId) await cancelNotification(task.notificationId);
    } catch (e) {
      console.log('Cancel notification failed:', e);
    }
    deleteTask(task.id);
  };

  const handleToggleTask = async (task: Task) => {
    try {
      if (!task.completed && task.notificationId) {
        await cancelNotification(task.notificationId);
      }
    } catch (e) {
      console.log('Cancel notification failed:', e);
    }
    toggleTask(task.id);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'Completed') return task.completed;
    if (filter === 'Today') return task.date === new Date().toISOString().split('T')[0];
    return true;
  });

  const renderTask = ({ item }: { item: Task }) => (
    <GlassCard style={styles.taskCard}>
      <TouchableOpacity onPress={() => handleToggleTask(item)} style={styles.taskLeft}>
        {item.completed ? <CheckCircle2 color={COLORS.accent} size={24} /> : <Circle color={COLORS.textLight} size={24} />}
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>{item.title}</Text>
          <View style={styles.taskTimeRow}>
            <Clock color={COLORS.textLight} size={12} />
            <Text style={styles.taskTime}>{item.date} at {item.time}</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.taskRight}>
        <View style={[styles.priorityBadge, item.priority === 'High' ? styles.bgHigh : item.priority === 'Medium' ? styles.bgMedium : styles.bgLow]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <TouchableOpacity onPress={() => { setEditingTask(item); setModalVisible(true); }} style={{ marginRight: 15 }}>
            <Pencil color={COLORS.textLight} size={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteTask(item)}>
             <Trash2 color={COLORS.textLight} size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>{filteredTasks.length} total</Text>
        </View>

        <GlassCard style={styles.searchContainer}>
          <TextInput placeholder="Search tasks..." placeholderTextColor={COLORS.textLight} style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
        </GlassCard>

        <View style={styles.filterRow}>
          {(['All', 'Today', 'Completed'] as const).map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}>
              <GlassCard style={[styles.filterChip, filter === f && styles.filterChipActive]} intensity={filter === f ? 90 : 40}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No tasks found.</Text>}
        />

        <TouchableOpacity style={styles.fab} onPress={() => { setEditingTask(null); setModalVisible(true); }}>
          <Plus color="#FFF" size={30} />
        </TouchableOpacity>

        <TaskFormModal 
          visible={modalVisible} 
          onClose={() => { setModalVisible(false); setEditingTask(null); }} 
          onSave={handleSaveTask}
          initialTask={editingTask}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 10, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4, fontWeight: '500' },
  searchContainer: { borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  searchInput: { height: 45, color: COLORS.textDark },
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: 'rgba(46, 74, 53, 0.8)' },
  filterText: { color: COLORS.textDark, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, marginBottom: 12 },
  taskLeft: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  taskInfo: { marginLeft: 12, flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: COLORS.textLight },
  taskTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  taskTime: { fontSize: 12, color: COLORS.textLight, marginLeft: 4 },
  taskRight: { alignItems: 'flex-end', justifyContent: 'center' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bgHigh: { backgroundColor: 'rgba(255, 107, 107, 0.2)' },
  bgMedium: { backgroundColor: 'rgba(255, 176, 32, 0.2)' },
  bgLow: { backgroundColor: 'rgba(33, 150, 243, 0.2)' },
  priorityText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textDark },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textLight },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
});