export type AccountType = 'wallet' | 'checking' | 'credit_card' | 'investment' | 'savings';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionStatus = 'cleared' | 'pending' | 'void';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type PaymentMethod =
  | 'credit_card' // Cartão de Crédito
  | 'debit_card' // Cartão de Débito
  | 'account_debit' // Débito em Conta / Débito Automático
  | 'pix' // PIX Débito / Transferência
  | 'bank_slip' // Boleto Bancário
  | 'cash' // Dinheiro físico
  | 'transfer'; // Transferência TED/DOC/Interna

export type TransactionOrigin = 'manual' | 'bank_sync' | 'bank_import' | 'open_finance';

export type BankProviderId =
  | 'nubank'
  | 'itau'
  | 'bradesco'
  | 'santander'
  | 'inter'
  | 'c6'
  | 'bb'
  | 'caixa'
  | 'xp'
  | 'btg'
  | 'wise'
  | 'revolut'
  | 'other';

export interface BankCardInfo {
  id: string;
  name: string;
  last4: string;
  type: 'credit' | 'debit' | 'multiple';
  brand: 'Mastercard' | 'Visa' | 'Elo' | 'Amex' | 'Outro';
  limit?: number;
  usedLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface BankConnection {
  id: string;
  institutionId: BankProviderId;
  institutionName: string;
  institutionLogo?: string;
  color: string;
  bgGradient: string;
  status: 'connected' | 'syncing' | 'needs_reauth' | 'disconnected';
  connectedAt: string;
  lastSyncAt: string;
  autoSyncEnabled: boolean;
  consentExpiresAt: string;
  accountIds: string[];
  cards: BankCardInfo[];
  detectedRecurringCount?: number;
  syncedTransactionsCount?: number;
}

export interface AutoCategorizationRule {
  id: string;
  name: string;
  pattern: string; // Ex: "ifood", "uber", "enel", "netflix", "condominio"
  matchField: 'payee' | 'notes' | 'any';
  categoryId: string;
  paymentMethod?: PaymentMethod;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  tags?: string[];
  familyMemberId?: string;
  isActive: boolean;
  matchesCount: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rateToBase: number; // 1.0 for Base currency, e.g. 5.65 BRL per 1 USD
  isBase: boolean;
  flag?: string;
  lastUpdated?: string;
  source?: 'api' | 'manual';
  change24h?: number;
}

export interface ExchangeRateLog {
  id: string;
  timestamp: string;
  currencyCode: string;
  rate: number;
  source: 'api' | 'manual';
  previousRate?: number;
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
  // Integração Bancária & Cartões
  isBankLinked?: boolean;
  bankConnectionId?: string;
  bankProvider?: BankProviderId;
  creditLimit?: number;
  creditUsed?: number;
  cardClosingDay?: number;
  cardDueDay?: number;
  cardLast4?: string;
  lastSyncedAt?: string;
  syncStatus?: 'connected' | 'syncing' | 'needs_reauth' | 'disconnected';
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
  targetAmount?: number; // valor creditado na conta de destino após conversão
  exchangeRate?: number; // taxa de câmbio aplicada na conversão
  fee?: number; // taxa ou IOF cobrado na conversão
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
  // Campos de Integração Bancária & Catalogação Automática
  paymentMethod?: PaymentMethod;
  origin?: TransactionOrigin;
  isAutoCategorized?: boolean;
  autoCategoryRule?: string;
  cardLast4?: string;
  bankSyncId?: string;
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

export type ReminderUrgency = 'overdue' | 'due_today' | 'upcoming' | 'future_recurring';

export interface ReminderSettings {
  enabled: boolean;
  nativeNotificationsEnabled: boolean;
  daysInAdvance: number; // 0 = no dia, 1 = 1 dia antes, 2 = 2 dias antes, 3 = 3 dias antes, 7 = 7 dias antes
  notifyPendingExpenses: boolean;
  notifyPendingIncomes: boolean;
  notifyRecurring: boolean;
  soundEnabled: boolean;
  lastCheckedDate?: string;
}

export interface ReminderItem {
  id: string;
  transaction: Transaction;
  dueDate: string;
  daysRemaining: number; // negativo se vencida, 0 se hoje, positivo se nos próximos dias
  urgency: ReminderUrgency;
  isOverdue: boolean;
  isToday: boolean;
  isScheduledRecurring: boolean;
}

export type DashboardWidgetId =
  | 'net_worth_summary'
  | 'bank_sync_summary'
  | 'recent_transactions'
  | 'monthly_budget_health'
  | 'category_expenses'
  | 'family_expenses'
  | 'cash_flow_summary'
  | 'currency_rates'
  | 'quick_actions';

export type DashboardLayoutPreset = 'default' | 'budget_focus' | 'minimalist' | 'multi_currency';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  description: string;
  visible: boolean;
  order: number;
  colSpan?: 1 | 2 | 3; // span no grid responsivo (1 coluna, 2 colunas ou largura total)
}

