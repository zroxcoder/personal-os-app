// src/store/useExpenseStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransactionType = 'income' | 'expense';
export type ExpenseCategory = 'Food' | 'Transport' | 'Shopping' | 'Others';
export type IncomeCategory = 'Salary' | 'Freelance' | 'Investment' | 'Gift' | 'Other';
export type Category = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
  isPending?: boolean;
  notificationIds?: string[];   // ← Changed from string to array
}

interface ExpenseState {
  transactions: Transaction[];
  currency: string;
  monthlyBudget: number;
  setCurrency: (code: string) => void;
  setMonthlyBudget: (amount: number) => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

const today = new Date().toISOString().split('T')[0];

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      transactions: [
        { id: '1', title: 'Groceries', amount: 85.00, type: 'expense', category: 'Food', date: today },
        { id: '2', title: 'Bus Pass', amount: 60.00, type: 'expense', category: 'Transport', date: today },
        { id: '3', title: 'Monthly Salary', amount: 2500.00, type: 'income', category: 'Salary', date: today },
        { id: '4', title: 'Freelance Work', amount: 500.00, type: 'income', category: 'Freelance', date: today },
      ],
      currency: 'USD',
      monthlyBudget: 1000,
      setCurrency: (code) => set({ currency: code }),
      setMonthlyBudget: (amount) => set({ monthlyBudget: amount }),
      addTransaction: (t) => set((state) => ({ transactions: [t, ...state.transactions] })),
      updateTransaction: (id, t) => set((state) => ({
        transactions: state.transactions.map(tr => tr.id === id ? { ...tr, ...t } : tr)
      })),
      deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),
    }),
    { name: 'personal-os-expenses', storage: createJSONStorage(() => AsyncStorage) }
  )
);

export const CURRENCIES = [
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'SEK', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NZD', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'SGD', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NOK', symbol: 'kr', flag: '🇳🇴' },
  { code: 'KRW', symbol: '₩', flag: '🇰🇷' },
  { code: 'TRY', symbol: '₺', flag: '🇹🇷' },
  { code: 'RUB', symbol: '₽', flag: '🇷🇺' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ZAR', symbol: 'R', flag: '🇿🇦' },
  { code: 'MXN', symbol: '$', flag: '🇲🇽' },
  { code: 'AED', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼', flag: '🇸🇦' },
  { code: 'THB', symbol: '฿', flag: '🇹🇭' },
  { code: 'IDR', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'MYR', symbol: 'RM', flag: '🇲🇾' },
  { code: 'PHP', symbol: '₱', flag: '🇵🇭' },
  { code: 'PKR', symbol: '₨', flag: '🇵🇰' },
  { code: 'BDT', symbol: '৳', flag: '🇧🇩' },
  { code: 'VND', symbol: '₫', flag: '🇻🇳' },
  { code: 'EGP', symbol: 'E£', flag: '🇪🇬' },
  { code: 'NGN', symbol: '₦', flag: '🇳🇬' },
  { code: 'ILS', symbol: '₪', flag: '🇮🇱' },
  { code: 'DKK', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', symbol: 'Ft', flag: '🇭🇺' },
  { code: 'NPR', symbol: 'रु', flag: '🇳🇵' },
];

export const getCurrency = (code: string) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];