// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, Save } from 'lucide-react-native';
import { useProfileStore } from '../store/useProfileStore';
import { useTaskStore } from '../store/useTaskStore';
import { useNoteStore } from '../store/useNoteStore';
import { useProjectStore } from '../store/useProjectStore';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';

// Avatar customization options
const AVATAR_COLORS = [
  '#2E4A35', '#4CAF50', '#2196F3', '#FF6B6B',
  '#9C27B0', '#FFB020', '#00BCD4', '#E91E63',
];
const AVATAR_EMOJIS = ['🚀', '🎯', '💡', '🔥', '🌱', '⚡', '🎨', '📚'];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { name, email, bio, avatarColor, avatarEmoji, joinedAt, updateProfile } = useProfileStore();

  const { tasks } = useTaskStore();
  const { notes } = useNoteStore();
  const { projects } = useProjectStore();

  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editBio, setEditBio] = useState(bio);
  const [editColor, setEditColor] = useState(avatarColor);
  const [editEmoji, setEditEmoji] = useState(avatarEmoji);
  const [isSaved, setIsSaved] = useState(false);

  // Sync form when store changes externally
  useEffect(() => {
    setEditName(name);
    setEditEmail(email);
    setEditBio(bio);
    setEditColor(avatarColor);
    setEditEmoji(avatarEmoji);
  }, [name, email, bio, avatarColor, avatarEmoji]);

  const handleSave = () => {
    if (!editName.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      bio: editBio.trim(),
      avatarColor: editColor,
      avatarEmoji: editEmoji,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Stats
  const tasksDone = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const activeProjects = projects.filter(p => {
    const total = p.subtasks.length;
    const done = p.subtasks.filter(s => s.completed).length;
    return total > 0 && done < total;
  }).length;
  const totalNotes = notes.length;

  // Formatted join date
  const joinDate = new Date(joinedAt).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
            <ArrowLeft color={COLORS.textDark} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Avatar Preview */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: editColor }]}>
                <Text style={styles.avatarEmoji}>{editEmoji}</Text>
              </View>
              <Text style={styles.previewName}>{editName || 'Your Name'}</Text>
              <Text style={styles.memberSince}>Member since {joinDate}</Text>
            </View>

            {/* Color Picker */}
            <Text style={styles.pickerLabel}>Avatar Color</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    editColor === c && styles.colorSwatchActive,
                  ]}
                  onPress={() => setEditColor(c)}
                >
                  {editColor === c && <Check color="#FFF" size={16} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Emoji Picker */}
            <Text style={styles.pickerLabel}>Avatar Emoji</Text>
            <View style={styles.emojiRow}>
              {AVATAR_EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, editEmoji === e && styles.emojiBtnActive]}
                  onPress={() => setEditEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats Card */}
            <GlassCard style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{tasksDone}</Text>
                <Text style={styles.statLabel}>Tasks Done</Text>
                <Text style={styles.statSub}>of {totalTasks}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{activeProjects}</Text>
                <Text style={styles.statLabel}>Active</Text>
                <Text style={styles.statSub}>Projects</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalNotes}</Text>
                <Text style={styles.statLabel}>Notes</Text>
                <Text style={styles.statSub}>Saved</Text>
              </View>
            </GlassCard>

            {/* Form */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <GlassCard style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textLight}
                />
              </GlassCard>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <GlassCard style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textLight}
                />
              </GlassCard>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <GlassCard style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { height: 100, paddingTop: 12 }]}
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                  textAlignVertical="top"
                  placeholder="A short bio about you..."
                  placeholderTextColor={COLORS.textLight}
                />
              </GlassCard>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Save color="#FFF" size={18} />
              <Text style={styles.saveBtnText}>{isSaved ? 'Saved!' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },

  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  avatarEmoji: { fontSize: 44 },
  previewName: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  memberSince: { fontSize: 12, color: COLORS.textLight, marginTop: 4, fontWeight: '500' },

  pickerLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 10, marginTop: 5, textTransform: 'uppercase' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  colorSwatch: {
    width: 38, height: 38, borderRadius: 19,
    marginRight: 10, marginBottom: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorSwatchActive: { borderColor: COLORS.textDark, transform: [{ scale: 1.1 }] },

  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 12,
    marginRight: 8, marginBottom: 8,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 2, borderColor: 'transparent',
  },
  emojiBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(46,74,53,0.15)' },
  emojiText: { fontSize: 22 },

  statsCard: { flexDirection: 'row', padding: 15, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textDark, marginTop: 2 },
  statSub: { fontSize: 10, color: COLORS.textLight, marginTop: 1 },
  statDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 5 },

  formGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 },
  inputContainer: { borderRadius: 12, paddingHorizontal: 15 },
  input: { height: 50, fontSize: 15, color: COLORS.textDark },

  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    padding: 15, borderRadius: 12, marginTop: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});