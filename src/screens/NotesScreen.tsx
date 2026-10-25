// src/screens/NotesScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, FileText, Trash2, Pin, Pencil, X, Check } from 'lucide-react-native'; // <-- Added Check
import { useNoteStore, Note } from '../store/useNoteStore';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';

const NOTE_COLORS = [
  '#FFFFFF', // White/Glass
  '#E8F5E9', // Soft Green
  '#E3F2FD', // Soft Blue
  '#FFFDE7', // Soft Yellow
  '#F3E5F5', // Soft Purple
  '#FFF3E0', // Soft Orange
  '#FCE4EC', // Soft Pink
  '#E0F2F1', // Soft Teal
];

export default function NotesScreen() {
  const { notes, categories, addNote, updateNote, deleteNote, togglePin, addCategory } = useNoteStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('General');
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [tagsInput, setTagsInput] = useState('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');

  useEffect(() => {
    if (modalVisible) {
      if (editingNote) {
        setTitle(editingNote.title);
        setContent(editingNote.content);
        setCategory(editingNote.category);
        setColor(editingNote.color);
        setTagsInput(editingNote.tags.join(', '));
      } else {
        setTitle('');
        setContent('');
        setCategory(categories[0] || 'General');
        setColor(NOTE_COLORS[0]);
        setTagsInput('');
      }
      setIsAddingCategory(false);
      setNewCategoryText('');
    }
  }, [modalVisible, editingNote]);

  const handleSaveNote = () => {
    if (!title.trim()) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t !== '');

    if (editingNote) {
      updateNote(editingNote.id, { title, content, category, color, tags });
    } else {
      const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const newNote: Note = {
        id: Date.now().toString(),
        title,
        content,
        category,
        color,
        isPinned: false,
        tags,
        date: new Date().toLocaleDateString('en-US', dateOptions),
        createdAt: Date.now(),
      };
      addNote(newNote);
    }
    
    setModalVisible(false);
    setEditingNote(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNote(id) }
    ]);
  };

  const handleAddCustomCategory = () => {
    if (newCategoryText.trim()) {
      addCategory(newCategoryText.trim());
      setCategory(newCategoryText.trim());
      setIsAddingCategory(false);
      setNewCategoryText('');
    }
  };

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || note.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });

  const renderNote = ({ item }: { item: Note }) => (
    <View style={[styles.noteWrapper, { backgroundColor: item.color }]}>
      <View style={styles.noteHeader}>
        <View style={styles.noteIconTitle}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
             <FileText color={COLORS.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.noteCategory}>{item.category} • {item.date}</Text>
          </View>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity onPress={() => togglePin(item.id)} style={{ marginRight: 10 }}>
            <Pin color={item.isPinned ? COLORS.primary : COLORS.textLight} size={18} fill={item.isPinned ? COLORS.primary : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEditingNote(item); setModalVisible(true); }} style={{ marginRight: 10 }}>
            <Pencil color={COLORS.textLight} size={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Trash2 color={COLORS.textLight} size={18} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.noteContent} numberOfLines={3}>
        {item.content || 'No additional content...'}
      </Text>
      
      {item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tagBadge}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notes</Text>
        </View>

        <GlassCard style={styles.searchContainer}>
          <TextInput 
            placeholder="Search title or tags..." 
            style={styles.searchInput}
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </GlassCard>

        <View style={{ marginBottom: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            <TouchableOpacity onPress={() => setActiveCategory('All')}>
              <GlassCard style={[styles.filterChip, activeCategory === 'All' && styles.filterChipActive]} intensity={activeCategory === 'All' ? 90 : 40}>
                <Text style={[styles.filterText, activeCategory === 'All' && styles.filterTextActive]}>All</Text>
              </GlassCard>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}>
                <GlassCard style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]} intensity={activeCategory === cat ? 90 : 40}>
                  <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>{cat}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No notes found.</Text>}
        />

        <TouchableOpacity style={styles.fab} onPress={() => { setEditingNote(null); setModalVisible(true); }}>
          <Plus color="#FFF" size={30} />
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingNote ? 'Edit Note' : 'Create Note'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X color={COLORS.textDark} size={24} />
                </TouchableOpacity>
              </View>
              
              {/* ScrollView added here so color picker is always visible */}
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <TextInput style={styles.modalInput} placeholder="Note Title" value={title} onChangeText={setTitle} placeholderTextColor={COLORS.textLight} />
                <TextInput style={[styles.modalInput, styles.modalTextArea]} placeholder="Write your thoughts here..." value={content} onChangeText={setContent} multiline textAlignVertical="top" placeholderTextColor={COLORS.textLight} />
                <TextInput style={styles.modalInput} placeholder="Tags (comma separated, e.g. react, code)" value={tagsInput} onChangeText={setTagsInput} placeholderTextColor={COLORS.textLight} />

                {/* Color Picker (Updated) */}
                <Text style={styles.label}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                  {NOTE_COLORS.map((c) => (
                    <TouchableOpacity 
                      key={c} 
                      style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchActive]} 
                      onPress={() => setColor(c)}
                    >
                      {/* Show a checkmark if selected */}
                      {color === c && <Check color={COLORS.primary} size={20} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Category Picker */}
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                  {categories.map(cat => (
                    <TouchableOpacity key={cat} style={[styles.catButton, category === cat && styles.catButtonActive]} onPress={() => setCategory(cat)}>
                      <Text style={[styles.catButtonText, category === cat && styles.catButtonTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                  {!isAddingCategory ? (
                    <TouchableOpacity style={[styles.catButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary }]} onPress={() => setIsAddingCategory(true)}>
                      <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+ Add</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput style={styles.inlineInput} placeholder="New cat..." value={newCategoryText} onChangeText={setNewCategoryText} autoFocus />
                      <TouchableOpacity onPress={handleAddCustomCategory} style={{ marginLeft: 5 }}><Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>OK</Text></TouchableOpacity>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
                    <Text style={styles.saveText}>Save Note</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 10, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  
  searchContainer: { borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  searchInput: { height: 45, color: COLORS.textDark },
  
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: 'rgba(46, 74, 53, 0.8)' },
  filterText: { color: COLORS.textDark, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  
  noteWrapper: { padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  noteIconTitle: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  noteTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  noteCategory: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  noteActions: { flexDirection: 'row', alignItems: 'center' },
  noteContent: { fontSize: 14, color: COLORS.textDark, lineHeight: 20, marginBottom: 10, opacity: 0.8 },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: 10, color: COLORS.textDark, fontWeight: '600' },

  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textLight },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15, color: COLORS.textDark },
  modalTextArea: { height: 80 },
  label: { fontSize: 12, color: COLORS.textLight, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' },
  
  // --- UPDATED COLOR SWATCH STYLES ---
  colorSwatch: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    marginRight: 12, 
    borderWidth: 1.5, 
    borderColor: 'rgba(0,0,0,0.15)', // Subtle border so white is visible
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchActive: { 
    borderWidth: 3, 
    borderColor: COLORS.primary, 
    transform: [{ scale: 1.1 }] 
  },
  
  catButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, marginRight: 8 },
  catButtonActive: { backgroundColor: COLORS.primary },
  catButtonText: { color: COLORS.textLight, fontWeight: '600' },
  catButtonTextActive: { color: '#FFF' },
  inlineInput: { backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: 10, height: 35, width: 100, fontSize: 12 },

  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelButton: { padding: 10, marginRight: 10 },
  cancelText: { color: COLORS.textLight, fontSize: 16 },
  saveButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});