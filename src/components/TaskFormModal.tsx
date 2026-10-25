// src/components/TaskFormModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task } from '../store/useTaskStore';
import { COLORS } from '../theme/colors';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  initialTask?: Task | null;
  initialDate?: string;
}

export default function TaskFormModal({ visible, onClose, onSave, initialTask, initialDate }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialTask) {
        setTitle(initialTask.title);
        setPriority(initialTask.priority);
        const [year, month, day] = initialTask.date.split('-').map(Number);
        const [time, modifier] = initialTask.time.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        setDate(new Date(year, month - 1, day, hours, minutes));
      } else {
        setTitle('');
        setPriority('Medium');
        const baseDate = initialDate ? new Date(initialDate) : new Date();
        setDate(baseDate);
      }
    }
  }, [visible, initialTask, initialDate]);

  const handleSave = () => {
    if (!title.trim()) return;

    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;

    onSave({ title, priority, date: formattedDate, time: formattedTime });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{initialTask ? 'Edit Task' : 'Add New Task'}</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="What needs to be done?"
            placeholderTextColor={COLORS.textLight}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.pickerLabel}>Date</Text>
              <Text style={styles.pickerValue}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.pickerLabel}>Time</Text>
              <Text style={styles.pickerValue}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pickerLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['Low', 'Medium', 'High'] as const).map(p => (
              <TouchableOpacity 
                key={p}
                style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityBtnText, priority === p && styles.priorityTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Native Pickers - using onChange (correct API for @react-native-community/datetimepicker v9.1.0) */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (selectedTime) setDate(selectedTime);
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: COLORS.textDark },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15, color: COLORS.textDark },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  pickerButton: { flex: 1, backgroundColor: COLORS.background, padding: 10, borderRadius: 10, marginHorizontal: 4 },
  pickerLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 4, fontWeight: '600' },
  pickerValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
  priorityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  priorityBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 8, marginHorizontal: 4 },
  priorityBtnActive: { backgroundColor: COLORS.primary },
  priorityBtnText: { color: COLORS.textLight, fontWeight: '600' },
  priorityTextActive: { color: '#FFF' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelButton: { padding: 10, marginRight: 10 },
  cancelText: { color: COLORS.textLight, fontSize: 16 },
  saveButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});