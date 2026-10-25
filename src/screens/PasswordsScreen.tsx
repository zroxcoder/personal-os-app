// src/screens/PasswordsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, Plus, Lock, Eye, EyeOff, Trash2, Pencil, X,
  Copy, Globe, User as UserIcon, ShieldCheck, ShieldAlert, Shield,
} from 'lucide-react-native';
import { usePasswordStore, PasswordEntry, PasswordCategory } from '../store/usePasswordStore';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';

const CATEGORIES: PasswordCategory[] = ['Social', 'Work', 'Finance', 'Email', 'Other'];
const FILTERS = ['All', ...CATEGORIES] as const;

// ---- Password strength calculator ----
function getStrength(pwd: string): { level: 'weak' | 'medium' | 'strong'; score: number } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 2) return { level: 'weak', score };
  if (score <= 3) return { level: 'medium', score };
  return { level: 'strong', score };
}

export default function PasswordsScreen() {
  const navigation = useNavigation();
  const { passwords, addPassword, updatePassword, deletePassword } = usePasswordStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('All');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);

  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<PasswordCategory>('Other');
  const [showPwdInModal, setShowPwdInModal] = useState(false);

  useEffect(() => {
    if (modalVisible) {
      if (editingEntry) {
        setTitle(editingEntry.title);
        setUsername(editingEntry.username);
        setPassword(editingEntry.password);
        setWebsite(editingEntry.website || '');
        setNotes(editingEntry.notes || '');
        setCategory(editingEntry.category);
      } else {
        setTitle('');
        setUsername('');
        setPassword('');
        setWebsite('');
        setNotes('');
        setCategory('Other');
      }
      setShowPwdInModal(false);
    }
  }, [modalVisible, editingEntry]);

  const openNew = () => {
    setEditingEntry(null);
    setModalVisible(true);
  };

  const openEdit = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Title and password are required.');
      return;
    }

    if (editingEntry) {
      updatePassword(editingEntry.id, {
        title, username, password, website, notes, category,
      });
    } else {
      const entry: PasswordEntry = {
        id: Date.now().toString(),
        title, username, password, website, notes, category,
        createdAt: Date.now(),
      };
      addPassword(entry);
    }

    setModalVisible(false);
    setEditingEntry(null);
  };

  const handleDelete = (entry: PasswordEntry) => {
    Alert.alert(
      'Delete Password',
      `Delete credentials for "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => deletePassword(entry.id),
        },
      ]
    );
  };

  const copyToClipboard = async (label: string, value: string) => {
  if (!value) return;

  // Lazy-load expo-clipboard so the app doesn't crash on old dev builds
  let ClipboardModule: any = null;
  try {
    ClipboardModule = require('expo-clipboard');
  } catch (e) {
    Alert.alert(
      'Copy Unavailable',
      'The copy feature will work after your final APK build. For now, you can long-press the password to select and copy it manually.',
      [{ text: 'Got it' }]
    );
    return;
  }

  try {
    await ClipboardModule.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  } catch (e) {
    Alert.alert('Copy Failed', 'Could not copy to clipboard.');
  }
};

  const toggleVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter
  const filtered = passwords
    .filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.website || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeFilter === 'All' || p.category === activeFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  // ---- Card ----
  const renderPassword = ({ item }: { item: PasswordEntry }) => {
    const isVisible = visiblePasswords[item.id];
    const strength = getStrength(item.password);
    const StrengthIcon = strength.level === 'strong' ? ShieldCheck
      : strength.level === 'medium' ? Shield : ShieldAlert;
    const strengthColor = strength.level === 'strong' ? '#4CAF50'
      : strength.level === 'medium' ? '#FFB020' : '#FF6B6B';

    return (
      <View style={styles.card}>
        {/* Top row: title + actions */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBox}>
              <Lock color={COLORS.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <StrengthIcon color={strengthColor} size={11} />
                <Text style={[styles.cardCategory, { color: strengthColor }]}>
                  {item.category} · {strength.level}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => openEdit(item)} style={{ marginRight: 12 }}>
              <Pencil color={COLORS.textLight} size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Trash2 color={COLORS.textLight} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Username row */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => copyToClipboard('Username', item.username)}
          disabled={!item.username}
        >
          <UserIcon color={COLORS.textLight} size={14} />
          <Text style={styles.fieldLabel}>User</Text>
          <Text style={styles.fieldValue} numberOfLines={1}>
            {item.username || '—'}
          </Text>
          {item.username ? <Copy color={COLORS.textLight} size={14} /> : null}
        </TouchableOpacity>

        {/* Password row */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => toggleVisibility(item.id)}
        >
          <Lock color={COLORS.textLight} size={14} />
          <Text style={styles.fieldLabel}>Pass</Text>
          <Text style={styles.fieldValueMono} numberOfLines={1}>
            {isVisible ? item.password : '••••••••••'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => copyToClipboard('Password', item.password)}
              style={{ marginRight: 10 }}
            >
              <Copy color={COLORS.textLight} size={14} />
            </TouchableOpacity>
            {isVisible ? <EyeOff color={COLORS.textLight} size={16} /> : <Eye color={COLORS.textLight} size={16} />}
          </View>
        </TouchableOpacity>

        {/* Website row */}
        {item.website ? (
          <View style={styles.fieldRow}>
            <Globe color={COLORS.textLight} size={14} />
            <Text style={styles.fieldLabel}>Web</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>{item.website}</Text>
          </View>
        ) : null}

        {/* Notes */}
        {item.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
              <ArrowLeft color={COLORS.textDark} size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Passwords</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openNew}>
            <Plus color="#FFF" size={24} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <GlassCard style={styles.searchContainer}>
          <TextInput
            placeholder="Search by title, user or website..."
            style={styles.searchInput}
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </GlassCard>

        {/* Category filter */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setActiveFilter(f)}>
              <GlassCard
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                intensity={activeFilter === f ? 90 : 40}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPassword}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {passwords.length === 0 ? 'No passwords yet. Tap + to add one.' : 'No matches found.'}
            </Text>
          }
        />

        {/* Add/Edit Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingEntry ? 'Edit Password' : 'New Password'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X color={COLORS.textDark} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Service title (e.g. GitHub)"
                  placeholderTextColor={COLORS.textLight}
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Username / Email"
                  placeholderTextColor={COLORS.textLight}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <View style={styles.pwdRow}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPwdInModal}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPwdInModal(!showPwdInModal)}
                    style={styles.eyeBtn}
                  >
                    {showPwdInModal ? <EyeOff color={COLORS.textLight} size={20} /> : <Eye color={COLORS.textLight} size={20} />}
                  </TouchableOpacity>
                </View>

                {/* Live strength indicator */}
                {password.length > 0 && (() => {
                  const s = getStrength(password);
                  const color = s.level === 'strong' ? '#4CAF50'
                    : s.level === 'medium' ? '#FFB020' : '#FF6B6B';
                  return (
                    <View style={styles.strengthBar}>
                      <View style={[styles.strengthFill, {
                        width: `${(s.score / 5) * 100}%`,
                        backgroundColor: color,
                      }]} />
                    </View>
                  );
                })()}

                <TextInput
                  style={styles.modalInput}
                  placeholder="Website (optional)"
                  placeholderTextColor={COLORS.textLight}
                  value={website}
                  onChangeText={setWebsite}
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.modalInput, { height: 70 }]}
                  placeholder="Notes (optional)"
                  placeholderTextColor={COLORS.textLight}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />

                {/* Category */}
                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catBtn, category === c && styles.catBtnActive]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.catBtnText, category === c && styles.catBtnTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveText}>{editingEntry ? 'Update' : 'Save'}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  addButton: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // Search & filter
  searchContainer: { borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  searchInput: { height: 45, color: COLORS.textDark },
  filterRow: { flexDirection: 'row', marginBottom: 15, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  filterChipActive: { backgroundColor: 'rgba(46, 74, 53, 0.85)' },
  filterText: { color: COLORS.textDark, fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#FFF' },

  // ---- Solid white card (readable credentials) ----
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(46, 74, 53, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  cardCategory: { fontSize: 11, marginLeft: 4, fontWeight: '600', textTransform: 'capitalize' },
  cardActions: { flexDirection: 'row', alignItems: 'center' },

  // Field rows
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textLight,
    width: 42, textTransform: 'uppercase', marginLeft: 8,
  },
  fieldValue: { flex: 1, fontSize: 13, color: COLORS.textDark, fontWeight: '500' },
  fieldValueMono: { flex: 1, fontSize: 13, color: COLORS.textDark, letterSpacing: 1.5, fontWeight: '600' },

  notesBox: {
    marginTop: 8, padding: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  notesText: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic' },

  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textLight, fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 10, padding: 15, fontSize: 15, marginBottom: 15, color: COLORS.textDark },
  pwdRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 15 },
  strengthBar: { height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2, marginBottom: 15, overflow: 'hidden' },
  strengthFill: { height: 4, borderRadius: 2 },
  label: { fontSize: 12, color: COLORS.textLight, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, marginRight: 8, marginBottom: 8 },
  catBtnActive: { backgroundColor: COLORS.primary },
  catBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  catBtnTextActive: { color: '#FFF' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 },
  cancelButton: { padding: 10, marginRight: 10 },
  cancelText: { color: COLORS.textLight, fontSize: 16 },
  saveButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});