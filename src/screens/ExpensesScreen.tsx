// src/screens/ExpensesScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, Plus, Utensils, Car, ShoppingBag, MoreHorizontal,
  Trash2, Pencil, X, TrendingUp, TrendingDown, Wallet, Download,
  Briefcase, Laptop, Gift, DollarSign, Calendar as CalendarIcon,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useExpenseStore, Transaction, CURRENCIES, getCurrency,
  ExpenseCategory, IncomeCategory,
} from '../store/useExpenseStore';
import { COLORS } from '../theme/colors';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { scheduleBillReminders, cancelMultipleNotifications } from '../utils/notifications';

const PDF_MODULES_AVAILABLE = true;    // ← Change to this

const EXPENSE_CATEGORIES: { name: ExpenseCategory; icon: any; color: string }[] = [
  { name: 'Food', icon: Utensils, color: '#FF6B6B' },
  { name: 'Transport', icon: Car, color: '#4CAF50' },
  { name: 'Shopping', icon: ShoppingBag, color: '#9C27B0' },
  { name: 'Others', icon: MoreHorizontal, color: '#607D8B' },
];

const INCOME_CATEGORIES: { name: IncomeCategory; icon: any; color: string }[] = [
  { name: 'Salary', icon: Briefcase, color: '#2196F3' },
  { name: 'Freelance', icon: Laptop, color: '#00BCD4' },
  { name: 'Investment', icon: TrendingUp, color: '#4CAF50' },
  { name: 'Gift', icon: Gift, color: '#E91E63' },
  { name: 'Other', icon: DollarSign, color: '#607D8B' },
];

type ModalType = 'none' | 'transaction' | 'budget' | 'currency' | 'export';

export default function ExpensesScreen() {
  const navigation = useNavigation();
  const {
    transactions, currency, monthlyBudget,
    setCurrency, setMonthlyBudget,
    addTransaction, updateTransaction, deleteTransaction,
  } = useExpenseStore();
  
  const cur = getCurrency(currency);
  
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState<any>('Food');
  const [txDate, setTxDate] = useState(new Date());
  const [txIsPending, setTxIsPending] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));
  const [exportRange, setExportRange] = useState<'week' | 'month' | 'custom'>('month');
  const [exportFrom, setExportFrom] = useState(new Date());
  const [exportTo, setExportTo] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const budgetUsed = totalExpense;
  const budgetPercent = monthlyBudget > 0 ? (budgetUsed / monthlyBudget) * 100 : 0;
  
  const filteredTxs = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openNewTx = () => {
    setEditingTx(null);
    setTxTitle('');
    setTxAmount('');
    setTxType('expense');
    setTxCategory('Food');
    setTxDate(new Date());
    setTxIsPending(false);
    setActiveModal('transaction');
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxTitle(tx.title);
    setTxAmount(String(tx.amount));
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxDate(new Date(tx.date));
    setTxIsPending(!!tx.isPending);
    setActiveModal('transaction');
  };

  // ✅ UPDATED: Uses scheduleBillReminders and notificationIds array
  const handleSaveTx = async () => {
      if (!txTitle.trim() || !txAmount.trim()) return;
    
    const formattedDate = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
    
    // Schedule 4 reminders: 1 week, 3 days, night-before 11:59, same day 9:00
    let notificationIds: string[] = [];
    if (txIsPending) {
      try {
        notificationIds = await scheduleBillReminders(txTitle, formattedDate, txType);
            } catch (e) { console.log('Bill reminder failed:', e); }
    }
    
    const data = {
      title: txTitle,
      amount: parseFloat(txAmount) || 0,
      type: txType,
      category: txCategory,
      date: formattedDate,
      isPending: txIsPending,
      notificationIds,
    };
    
    if (editingTx) {
      // Cancel all old reminders before saving new ones
      try { await cancelMultipleNotifications(editingTx.notificationIds); } catch (e) {}
      updateTransaction(editingTx.id, data);
    } else {
      addTransaction({ id: Date.now().toString(), ...data });
    }
    
    setActiveModal('none');
    setEditingTx(null);
  };

  // ✅ UPDATED: Cancels all reminders for this transaction
  const handleDeleteTx = (tx: Transaction) => {
    Alert.alert('Delete Transaction', `Delete "${tx.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await cancelMultipleNotifications(tx.notificationIds); } catch (e) {}
        deleteTransaction(tx.id);
      }},
    ]);
  };

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount >= 0) setMonthlyBudget(amount);
    setActiveModal('none');
  };

  const handleExport = async () => {
    if (!PDF_MODULES_AVAILABLE) {
      Alert.alert(
        'Rebuild Required',
        'PDF export needs a rebuild to work.\n\nYour data is safe. Once you run:\n\nnpx expo install expo-print expo-sharing\neas build --profile development --platform android\n\nThen change PDF_MODULES_AVAILABLE to true in ExpensesScreen.tsx.',
        [{ text: 'Got it' }]
      );
      setActiveModal('none');
      return;
    }
    
    let Print: any = null;
    let Sharing: any = null;
    try {
      Print = require('expo-print');
      Sharing = require('expo-sharing');
    } catch (e) {
      Alert.alert('Rebuild Required', 'Native PDF modules not found. Please rebuild the app.');
      setActiveModal('none');
      return;
    }
    
    let fromDate = new Date();
    let toDate = new Date();
    if (exportRange === 'week') fromDate.setDate(fromDate.getDate() - 7);
    else if (exportRange === 'month') fromDate.setMonth(fromDate.getMonth() - 1);
    else { fromDate = exportFrom; toDate = exportTo; }
    
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];
    
    const txs = transactions.filter(t => t.date >= fromStr && t.date <= toStr);
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    const html = `
      <html><head><style>
        body { font-family: Helvetica, Arial, sans-serif; padding: 30px; color: #222; }
        h1 { color: #2E4A35; margin-bottom: 4px; }
        .sub { color: #666; font-size: 14px; margin-bottom: 24px; }
        .summary { background: #f4f6f4; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8e8e8; }
        .row:last-child { border-bottom: none; }
        .income { color: #2E7D32; font-weight: bold; }
        .expense { color: #C62828; font-weight: bold; }
        .total { font-size: 20px; font-weight: bold; margin-top: 10px; }
        h2 { color: #2E4A35; margin-top: 30px; }
        .tx { padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .tx-title { font-weight: 600; }
        .tx-meta { color: #999; font-size: 12px; }
      </style></head><body>
        <h1>Financial Statement</h1>
        <div class="sub">Period: ${fromStr} to ${toStr} · Currency: ${cur.code}</div>
        <div class="summary">
          <div class="row"><span>Total Income</span><span class="income">${cur.symbol}${income.toFixed(2)}</span></div>
          <div class="row"><span>Total Expenses</span><span class="expense">${cur.symbol}${expense.toFixed(2)}</span></div>
          <div class="row total"><span>Balance</span><span>${cur.symbol}${(income - expense).toFixed(2)}</span></div>
        </div>
        <h2>Transactions (${txs.length})</h2>
        ${txs.map(t => `
          <div class="tx">
            <div><div class="tx-title">${t.title}</div>
            <div class="tx-meta">${t.category} · ${t.date}${t.isPending ? ' · PENDING' : ''}</div></div>
            <div class="${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? '+' : '-'}${cur.symbol}${t.amount.toFixed(2)}</div>
          </div>`).join('')}
      </body></html>
    `;
    
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Statement' });
      } else {
        Alert.alert('Saved', `PDF saved to: ${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Something went wrong');
    }
    setActiveModal('none');
  };

  const categories = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const renderTx = ({ item }: { item: Transaction }) => {
    const catList = item.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const cat = catList.find(c => c.name === item.category) || catList[0];
    const Icon = cat.icon;
    
    return (
      <GlassCard style={styles.txCard}>
        <View style={[styles.txIconBox, { backgroundColor: `${cat.color}20` }]}>
          <Icon color={cat.color} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.txTitle}>{item.title}</Text>
          <Text style={styles.txMeta}>{item.category} · {item.date}{item.isPending ? ' · Pending' : ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.txAmount, { color: item.type === 'income' ? '#4CAF50' : '#FF6B6B' }]}>
            {item.type === 'income' ? '+' : '-'}{cur.symbol}{item.amount.toFixed(2)}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            <TouchableOpacity onPress={() => openEditTx(item)} style={{ marginRight: 12 }}>
              <Pencil color={COLORS.textLight} size={16} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteTx(item)}>
              <Trash2 color={COLORS.textLight} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
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
            <Text style={styles.title}>Wallet</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.currencyBtn} onPress={() => setActiveModal('currency')}>
              <Text style={styles.currencyText}>{cur.flag} {cur.code}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={() => setActiveModal('export')}>
              <Download color={COLORS.primary} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={filteredTxs}
          keyExtractor={(item) => item.id}
          renderItem={renderTx}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <GlassCard style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>{cur.symbol}{balance.toFixed(2)}</Text>
                <View style={styles.balanceRow}>
                  <View style={styles.balanceStat}>
                    <TrendingUp color="#4CAF50" size={14} />
                    <Text style={styles.balanceStatLabel}>Income</Text>
                    <Text style={[styles.balanceStatValue, { color: '#4CAF50' }]}>{cur.symbol}{totalIncome.toFixed(2)}</Text>
                  </View>
                  <View style={styles.balanceStat}>
                    <TrendingDown color="#FF6B6B" size={14} />
                    <Text style={styles.balanceStatLabel}>Expenses</Text>
                    <Text style={[styles.balanceStatValue, { color: '#FF6B6B' }]}>{cur.symbol}{totalExpense.toFixed(2)}</Text>
                  </View>
                </View>
              </GlassCard>

              <TouchableOpacity onPress={() => { setBudgetInput(String(monthlyBudget)); setActiveModal('budget'); }}>
                <GlassCard style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Wallet color={COLORS.primary} size={18} />
                      <Text style={styles.budgetLabel}>Monthly Budget</Text>
                    </View>
                    <Pencil color={COLORS.textLight} size={14} />
                  </View>
                  <Text style={styles.budgetAmount}>
                    {cur.symbol}{budgetUsed.toFixed(2)} <Text style={styles.budgetTotal}>/ {cur.symbol}{monthlyBudget.toFixed(2)}</Text>
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, {
                      width: `${Math.min(budgetPercent, 100)}%`,
                      backgroundColor: budgetPercent > 100 ? '#FF6B6B' : budgetPercent > 80 ? '#FFB020' : '#4CAF50',
                    }]} />
                  </View>
                  <Text style={styles.budgetPercent}>{budgetPercent.toFixed(0)}% used</Text>
                </GlassCard>
              </TouchableOpacity>

              <View style={styles.filterRow}>
                {(['all', 'income', 'expense'] as const).map(f => (
                  <TouchableOpacity key={f} onPress={() => setFilter(f)}>
                    <GlassCard style={[styles.filterChip, filter === f && styles.filterChipActive]} intensity={filter === f ? 90 : 40}>
                      <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Transactions</Text>
            </>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet.</Text>}
        />

        <TouchableOpacity style={styles.fab} onPress={openNewTx}>
          <Plus color="#FFF" size={30} />
        </TouchableOpacity>

        {/* TRANSACTION MODAL */}
        <Modal visible={activeModal === 'transaction'} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingTx ? 'Edit Transaction' : 'New Transaction'}</Text>
                <TouchableOpacity onPress={() => setActiveModal('none')}><X color={COLORS.textDark} size={24} /></TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.typeToggle}>
                  <TouchableOpacity style={[styles.typeBtn, txType === 'expense' && styles.typeBtnExpense]} onPress={() => { setTxType('expense'); setTxCategory('Food'); }}>
                    <TrendingDown color={txType === 'expense' ? '#FFF' : COLORS.textLight} size={16} />
                    <Text style={[styles.typeBtnText, txType === 'expense' && { color: '#FFF' }]}>Expense</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.typeBtn, txType === 'income' && styles.typeBtnIncome]} onPress={() => { setTxType('income'); setTxCategory('Salary'); }}>
                    <TrendingUp color={txType === 'income' ? '#FFF' : COLORS.textLight} size={16} />
                    <Text style={[styles.typeBtnText, txType === 'income' && { color: '#FFF' }]}>Income</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.modalInput} placeholder="Title (e.g., Groceries)" placeholderTextColor={COLORS.textLight} value={txTitle} onChangeText={setTxTitle} />
                <TextInput style={styles.modalInput} placeholder={`Amount (${cur.symbol})`} placeholderTextColor={COLORS.textLight} value={txAmount} onChangeText={setTxAmount} keyboardType="numeric" />
                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {categories.map((c: any) => {
                    const Icon = c.icon;
                    return (
                      <TouchableOpacity key={c.name} style={[styles.catBtn, txCategory === c.name && { backgroundColor: c.color }]} onPress={() => setTxCategory(c.name)}>
                        <Icon color={txCategory === c.name ? '#FFF' : c.color} size={18} />
                        <Text style={[styles.catBtnText, txCategory === c.name && { color: '#FFF' }]}>{c.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.label}>{txIsPending ? 'Due Date' : 'Date'}</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <CalendarIcon color={COLORS.primary} size={16} />
                  <Text style={styles.dateBtnText}>{txDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pendingRow} onPress={() => setTxIsPending(!txIsPending)}>
                  <View style={[styles.checkbox, txIsPending && styles.checkboxActive]}>
                    {txIsPending && <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingLabel}>Set as Pending</Text>
                    <Text style={styles.pendingSub}>Get reminders 1 week, 3 days, night before, and on the date</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveModal('none')}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveTx}>
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* BUDGET MODAL */}
        <Modal visible={activeModal === 'budget'} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: 'auto' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Monthly Budget</Text>
                <TouchableOpacity onPress={() => setActiveModal('none')}><X color={COLORS.textDark} size={24} /></TouchableOpacity>
              </View>
              <TextInput style={styles.modalInput} placeholder={`Budget (${cur.symbol})`} placeholderTextColor={COLORS.textLight} value={budgetInput} onChangeText={setBudgetInput} keyboardType="numeric" autoFocus />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveModal('none')}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveBudget}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* CURRENCY MODAL */}
        <Modal visible={activeModal === 'currency'} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Currency</Text>
                <TouchableOpacity onPress={() => setActiveModal('none')}><X color={COLORS.textDark} size={24} /></TouchableOpacity>
              </View>
              <FlatList
                data={CURRENCIES}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.currencyRow, currency === item.code && styles.currencyRowActive]} onPress={() => { setCurrency(item.code); setActiveModal('none'); }}>
                    <Text style={styles.currencyRowText}>{item.flag} {item.code} ({item.symbol})</Text>
                    {currency === item.code && <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>✓</Text>}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* EXPORT MODAL */}
        <Modal visible={activeModal === 'export'} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: 'auto' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Export Statement</Text>
                <TouchableOpacity onPress={() => setActiveModal('none')}><X color={COLORS.textDark} size={24} /></TouchableOpacity>
              </View>
              <Text style={styles.label}>Range</Text>
              <View style={styles.rangeRow}>
                {(['week', 'month', 'custom'] as const).map(r => (
                  <TouchableOpacity key={r} style={[styles.rangeBtn, exportRange === r && styles.rangeBtnActive]} onPress={() => setExportRange(r)}>
                    <Text style={[styles.rangeBtnText, exportRange === r && { color: '#FFF' }]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {exportRange === 'custom' && (
                <>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
                    <CalendarIcon color={COLORS.primary} size={16} />
                    <Text style={styles.dateBtnText}>From: {exportFrom.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
                    <CalendarIcon color={COLORS.primary} size={16} />
                    <Text style={styles.dateBtnText}>To: {exportTo.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveModal('none')}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleExport}><Text style={styles.saveText}>Export PDF</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {showDatePicker && (
          <DateTimePicker value={txDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setTxDate(d); }} />
        )}
        {showFromPicker && (
          <DateTimePicker value={exportFrom} mode="date" display="default" onChange={(e, d) => { setShowFromPicker(Platform.OS === 'ios'); if (d) setExportFrom(d); }} />
        )}
        {showToPicker && (
          <DateTimePicker value={exportTo} mode="date" display="default" onChange={(e, d) => { setShowToPicker(Platform.OS === 'ios'); if (d) setExportTo(d); }} />
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
  currencyBtn: { backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  currencyText: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  exportBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' },
  balanceCard: { padding: 20, marginBottom: 15 },
  balanceLabel: { fontSize: 13, color: COLORS.textLight, fontWeight: '500', marginBottom: 4 },
  balanceAmount: { fontSize: 34, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceStat: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  balanceStatLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 4, fontWeight: '600' },
  balanceStatValue: { fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  budgetCard: { padding: 18, marginBottom: 20 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginLeft: 8 },
  budgetAmount: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  budgetTotal: { fontSize: 14, fontWeight: '500', color: COLORS.textLight },
  progressBarBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 4, marginBottom: 8 },
  progressBarFill: { height: 8, borderRadius: 4 },
  budgetPercent: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: 'rgba(46, 74, 53, 0.8)' },
  filterText: { color: COLORS.textDark, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 12 },
  txCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10 },
  txIconBox: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  txMeta: { fontSize: 11, color: COLORS.textLight, marginTop: 3 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 30, color: COLORS.textLight },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 10, padding: 15, fontSize: 15, marginBottom: 12, color: COLORS.textDark },
  label: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, marginTop: 5 },
  typeToggle: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 12, padding: 4, marginBottom: 15 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center' },
  typeBtnExpense: { backgroundColor: '#FF6B6B' },
  typeBtnIncome: { backgroundColor: '#4CAF50' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight, marginLeft: 6 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  catBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, marginRight: 8, marginBottom: 8 },
  catBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight, marginLeft: 6 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: 15, borderRadius: 10, marginBottom: 12 },
  dateBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginLeft: 10 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255, 176, 32, 0.1)', borderRadius: 10, marginBottom: 15 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.textLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pendingLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  pendingSub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  currencyRow: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  currencyRowActive: { backgroundColor: 'rgba(46, 74, 53, 0.1)' },
  currencyRowText: { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  rangeRow: { flexDirection: 'row', marginBottom: 15 },
  rangeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 10, marginRight: 8 },
  rangeBtnActive: { backgroundColor: COLORS.primary },
  rangeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  cancelButton: { padding: 10, marginRight: 10 },
  cancelText: { color: COLORS.textLight, fontSize: 16 },
  saveButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});