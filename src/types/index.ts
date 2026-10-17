export type AccountType = 'wallet' | 'checking' | 'credit_card' | 'investment' | 'savings';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionStatus = 'cleared' | 'pending' | 'void';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rateToBase: number; // 1.0 for BRL base
  isBase: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  currencyCode: string;
  color: string;
  icon: string;
  notes?: string;
  isArchived?: boolean;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  type: 'expense' | 'income';
  icon: string;
  color: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  budgetLimit?: number;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TransactionSplit {
  id: string;
  categoryId: string;
  amount: number;
  familyMemberId?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO date 'YYYY-MM-DD'
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId?: string; // used for transfer
  categoryId?: string; // optional if split or transfer
  familyMemberId?: string;
  projectId?: string;
  status: TransactionStatus;
  payee: string; // Beneficiário / Pagador
  notes?: string;
  currencyCode: string;
  isSplit?: boolean;
  splits?: TransactionSplit[];
  tags?: string[];
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  period: 'monthly' | 'yearly';
  amount: number;
  currencyCode: string;
  alertThreshold: number; // e.g., 0.8 for 80%
}

export interface FilterState {
  search: string;
  accountId?: string;
  familyMemberId?: string;
  projectId?: string;
  categoryId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  dateRange: 'this_month' | 'last_month' | 'this_year' | 'all';
}
