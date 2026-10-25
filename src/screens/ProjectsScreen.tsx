// src/screens/ProjectsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Platform, ScrollView, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Folder, Trash2, Pencil, X, Calendar, CheckCircle2, Circle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProjectStore, Project } from '../store/useProjectStore';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { scheduleProjectDeadlineReminders, cancelMultipleNotifications } from '../utils/notifications';

const FILTERS = ['All', 'Active', 'Completed'] as const;
const CATEGORIES = ['Development', 'Design', 'Marketing', 'Personal', 'Other'];

export default function ProjectsScreen() {
  const navigation = useNavigation();
  const { projects, addProject, updateProject, deleteProject, toggleSubtask } = useProjectStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('All');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [startDate, setStartDate] = useState(new Date());
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [subtasksInput, setSubtasksInput] = useState('');
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  useEffect(() => {
    if (modalVisible) {
      if (editingProject) {
        setTitle(editingProject.title);
        setDescription(editingProject.description);
        setTagsInput(editingProject.tags.join(', '));
        setCategory(editingProject.category);
        setStartDate(new Date(editingProject.startDate));
        setDeadlineDate(new Date(editingProject.deadlineDate));
        setSubtasksInput(editingProject.subtasks.map(s => s.title).join('\n'));
      } else {
        setTitle('');
        setDescription('');
        setTagsInput('');
        setCategory(CATEGORIES[0]);
        setStartDate(new Date());
        setDeadlineDate(new Date());
        setSubtasksInput('');
      }
    }
  }, [modalVisible, editingProject]);

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const displayDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ✅ UPDATED: Schedules deadline reminders
  const handleSaveProject = async () => {
    if (!title.trim()) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t !== '');
    const subtaskTitles = subtasksInput.split('\n').map(s => s.trim()).filter(s => s !== '');
    
    const newSubtasks = subtaskTitles.map((subTitle, index) => {
      if (editingProject) {
        const existing = editingProject.subtasks.find(s => s.title === subTitle);
        if (existing) return existing;
      }
      return { id: Date.now().toString() + index, title: subTitle, completed: false };
    });

    const deadlineStr = formatDate(deadlineDate);

    // Cancel old reminders if editing
    if (editingProject) {
      try { await cancelMultipleNotifications(editingProject.notificationIds); } catch (e) {}
    }

    // Schedule 4 reminders for the new deadline
    let notificationIds: string[] = [];
    try {
      notificationIds = await scheduleProjectDeadlineReminders(title, deadlineStr);
        } catch (e) { console.log('Project reminder failed:', e); }

    const projectData = {
      title, description, tags, category,
      startDate: formatDate(startDate),
      deadlineDate: deadlineStr,
      subtasks: newSubtasks,
      notificationIds,
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject({ id: Date.now().toString(), ...projectData });
    }
    
    setModalVisible(false);
    setEditingProject(null);
  };

  // ✅ UPDATED: Cancels reminders before deleting
  const handleDelete = (id: string) => {
    Alert.alert("Delete Project", "Are you sure? All subtasks will be lost.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const proj = projects.find(p => p.id === id);
        try { await cancelMultipleNotifications(proj?.notificationIds); } catch (e) {}
        deleteProject(id);
      }}
    ]);
  };

  // ✅ NEW: Auto-cancel reminders when all subtasks complete
  const handleToggleSubtask = async (project: Project, subtaskId: string) => {
    toggleSubtask(project.id, subtaskId);
    
    const updatedSubs = project.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const allDone = updatedSubs.length > 0 && updatedSubs.every(s => s.completed);
    
    if (allDone && project.notificationIds && project.notificationIds.length > 0) {
      try {
        await cancelMultipleNotifications(project.notificationIds);
        updateProject(project.id, { notificationIds: [] });
      } catch (e) {}
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const total = project.subtasks.length;
    const completed = project.subtasks.filter(s => s.completed).length;
    const isCompleted = total > 0 && completed === total;
    const isActive = total > 0 && completed > 0 && completed < total;

    const matchesFilter = activeFilter === 'All' || 
                          (activeFilter === 'Active' && isActive) ||
                          (activeFilter === 'Completed' && isCompleted);
    return matchesSearch && matchesFilter;
  });

  const renderProject = ({ item }: { item: Project }) => {
    const total = item.subtasks.length;
    const completed = item.subtasks.filter(s => s.completed).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    let status = 'Not Started';
    if (total > 0 && completed === total) status = 'Completed';
    else if (completed > 0) status = 'In Progress';

    return (
      <View style={styles.solidProjectCard}>
        <View style={styles.projectHeader}>
          <View style={styles.projectIconContainer}>
            <Folder color={COLORS.primary} size={24} />
          </View>
          <View style={styles.projectInfo}>
            <View style={styles.projectTitleRow}>
              <Text style={styles.projectTitle}>{item.title}</Text>
              <View style={[styles.statusBadge, status === 'In Progress' ? styles.bgActive : status === 'Completed' ? styles.bgCompleted : styles.bgNotStarted]}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
            </View>
            
            <Text style={styles.projectCategory}>{item.category}</Text>
            {item.description ? <Text style={styles.projectDesc} numberOfLines={2}>{item.description}</Text> : null}
            
            <View style={styles.dateRow}>
              <Calendar color={COLORS.textLight} size={12} />
              <Text style={styles.dateText}>{displayDate(item.startDate)} - {displayDate(item.deadlineDate)}</Text>
            </View>

            <View style={styles.progressHeader}>
              <Text style={styles.projectSub}>{completed}/{total} subtasks</Text>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        {item.subtasks.length > 0 && (
          <View style={styles.subtasksContainer}>
            {item.subtasks.map(sub => (
              <TouchableOpacity key={sub.id} style={styles.subtaskRow} onPress={() => handleToggleSubtask(item, sub.id)}>
                {sub.completed ? <CheckCircle2 color={COLORS.accent} size={18} /> : <Circle color={COLORS.textLight} size={18} />}
                <Text style={[styles.subtaskText, sub.completed && styles.subtaskTextCompleted]}>{sub.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.projectFooter}>
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => { setEditingProject(item); setModalVisible(true); }} style={{ marginRight: 15 }}>
              <Pencil color={COLORS.textLight} size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Trash2 color={COLORS.textLight} size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
              <ArrowLeft color={COLORS.textDark} size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Projects</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => { setEditingProject(null); setModalVisible(true); }}>
            <Plus color="#FFF" size={24} />
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.searchContainer}>
          <TextInput placeholder="Search projects..." style={styles.searchInput} placeholderTextColor={COLORS.textLight} value={searchQuery} onChangeText={setSearchQuery} />
        </GlassCard>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setActiveFilter(f)}>
              <GlassCard style={[styles.filterChip, activeFilter === f && styles.filterChipActive]} intensity={activeFilter === f ? 90 : 40}>
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={renderProject}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No projects found.</Text>}
        />

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingProject ? 'Edit Project' : 'Create Project'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><X color={COLORS.textDark} size={24} /></TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
                <TextInput style={styles.modalInput} placeholder="Project Title" placeholderTextColor={COLORS.textLight} value={title} onChangeText={setTitle} />
                <TextInput style={[styles.modalInput, { height: 80 }]} placeholder="Description (Optional)" placeholderTextColor={COLORS.textLight} value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
                <TextInput style={styles.modalInput} placeholder="Tags (comma separated)" placeholderTextColor={COLORS.textLight} value={tagsInput} onChangeText={setTagsInput} />

                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} style={[styles.catButton, category === cat && styles.catButtonActive]} onPress={() => setCategory(cat)}>
                      <Text style={[styles.catButtonText, category === cat && styles.catButtonTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.row}>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartPicker(true)}>
                    <Text style={styles.label}>Start Date</Text>
                    <Text style={styles.pickerValue}>{displayDate(formatDate(startDate))}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDeadlinePicker(true)}>
                    <Text style={styles.label}>Deadline</Text>
                    <Text style={styles.pickerValue}>{displayDate(formatDate(deadlineDate))}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Subtasks (One per line)</Text>
                <TextInput 
                  style={[styles.modalInput, { height: 120, marginBottom: 20 }]} 
                  placeholder={"Design UI\nCode logic\nTest app"} 
                  placeholderTextColor={COLORS.textLight}
                  value={subtasksInput} 
                  onChangeText={setSubtasksInput} 
                  multiline 
                  textAlignVertical="top" 
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProject}>
                    <Text style={styles.saveText}>Save Project</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {showStartPicker && (
          <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, d) => { setShowStartPicker(Platform.OS === 'ios'); if(d) setStartDate(d); }} />
        )}
        {showDeadlinePicker && (
          <DateTimePicker value={deadlineDate} mode="date" display="default" onChange={(e, d) => { setShowDeadlinePicker(Platform.OS === 'ios'); if(d) setDeadlineDate(d); }} />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  addButton: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  searchInput: { height: 45, color: COLORS.textDark },
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: 'rgba(46, 74, 53, 0.8)' },
  filterText: { color: COLORS.textDark, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  solidProjectCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  projectHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  projectIconContainer: { width: 45, height: 45, borderRadius: 10, backgroundColor: 'rgba(46, 74, 53, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  projectInfo: { flex: 1 },
  projectTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  projectTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  projectCategory: { fontSize: 11, color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  projectDesc: { fontSize: 13, color: COLORS.textDark, marginBottom: 8, opacity: 0.8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateText: { fontSize: 11, color: COLORS.textLight, marginLeft: 5, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  bgActive: { backgroundColor: 'rgba(33, 150, 243, 0.15)' },
  bgCompleted: { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
  bgNotStarted: { backgroundColor: 'rgba(0,0,0,0.05)' },
  statusText: { fontSize: 10, fontWeight: '700', color: COLORS.textDark },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  projectSub: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  progressPercent: { fontSize: 12, color: COLORS.textDark, fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, marginBottom: 15 },
  progressBarFill: { height: 6, backgroundColor: COLORS.accent, borderRadius: 3 },
  subtasksContainer: { backgroundColor: 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 10, marginBottom: 15 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  subtaskText: { fontSize: 13, color: COLORS.textDark, marginLeft: 10 },
  subtaskTextCompleted: { textDecorationLine: 'line-through', color: COLORS.textLight },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  tagBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: 10, color: COLORS.textDark, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 10, padding: 15, fontSize: 14, marginBottom: 12, color: COLORS.textDark },
  label: { fontSize: 12, color: COLORS.textLight, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  pickerButton: { flex: 1, backgroundColor: COLORS.background, padding: 12, borderRadius: 10, marginHorizontal: 4 },
  pickerValue: { fontSize: 13, color: COLORS.textDark, fontWeight: '600' },
  catButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, marginRight: 8 },
  catButtonActive: { backgroundColor: COLORS.primary },
  catButtonText: { color: COLORS.textLight, fontWeight: '600', fontSize: 12 },
  catButtonTextActive: { color: '#FFF' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelButton: { padding: 10, marginRight: 10 },
  cancelText: { color: COLORS.textLight, fontSize: 16 },
  saveButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});