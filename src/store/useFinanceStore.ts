import { create } from 'zustand';
import {
  Account,
  Category,
  Currency,
  FamilyMember,
  FilterState,
  Project,
  Tag,
  Transaction,
  Budget,
  TransactionType,
  ReminderSettings,
  ReminderItem,
  ExchangeRateLog,
  DashboardWidgetConfig,
  DashboardWidgetId,
  DashboardLayoutPreset,
  BankConnection,
  AutoCategorizationRule,
  PaymentMethod,
  BankProviderId,
} from '../types';
import {
  sendNativeNotification,
  getDaysDiffFromToday,
  addDaysToDate,
  playNotificationSound,
} from '../utils/notifications';
import {
  initialAccounts,
  initialBudgets,
  initialCategories,
  initialCurrencies,
  initialFamilyMembers,
  initialProjects,
  initialTags,
  initialTransactions,
  initialDashboardWidgets,
  initialBankConnections,
  initialAutoCategorizationRules,
} from '../data/initialData';
import {
  generateMockBankSyncTransactions,
  parseOFX,
  parseCSV,
  parsePlainText,
} from '../utils/statementParser';
import { autoCategorizeTransaction } from '../utils/autoCategorization';

const STORAGE_KEY = 'alzex_finance_pro_state_v1';

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'reports'
  | 'recurring'
  | 'calendar'
  | 'categories'
  | 'architecture'
  | 'currencies'
  | 'open_banking';

interface FinanceStoreState {
  // Entidades
  accounts: Account[];
  categories: Category[];
  familyMembers: FamilyMember[];
  projects: Project[];
  tags: Tag[];
  transactions: Transaction[];
  budgets: Budget[];
  currencies: Currency[];

  // Configurações e Navegação
  activeTab: ActiveTab;
  activeCurrencyCode: string;
  selectedAccountId: string | null;
  selectedFamilyMemberId: string | null;
  selectedProjectId: string | null;

  // Filtros ativos do livro caixa
  filters: FilterState;

  // Modais e Estados de UI
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  isAccountModalOpen: boolean;
  editingAccount: Account | null;
  isBudgetModalOpen: boolean;
  isReminderModalOpen: boolean;
  searchQuery: string;

  // Lembretes & Notificações Nativas
  reminderSettings: ReminderSettings;
  openReminderModal: () => void;
  closeReminderModal: () => void;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  markTransactionAsCleared: (id: string) => void;
  postponeTransaction: (id: string, days: number) => void;
  getReminderItems: () => ReminderItem[];
  checkAndSendReminders: (forceManual?: boolean) => Promise<{ notifiedCount: number; dueItems: ReminderItem[] }>;

  // Toasts de Notificação
  toasts: { id: string; message: string; type: 'success' | 'info' | 'error' | 'warning' }[];
  addToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;

  // Ações
  setActiveTab: (tab: ActiveTab) => void;
  setActiveCurrencyCode: (code: string) => void;
  setSelectedAccountId: (id: string | null) => void;
  setSelectedFamilyMemberId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Operações de Transação
  openNewTransactionModal: (defaultType?: TransactionType, defaultAccountId?: string) => void;
  openEditTransactionModal: (tx: Transaction) => void;
  closeTransactionModal: () => void;
  saveTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteTransaction: (id: string) => void;
  duplicateTransaction: (id: string) => void;

  // Operações de Conta
  openNewAccountModal: () => void;
  openEditAccountModal: (acc: Account) => void;
  closeAccountModal: () => void;
  saveAccount: (acc: Omit<Account, 'id'> & { id?: string }) => void;
  deleteAccount: (id: string) => void;

  // Operações de Orçamento
  openNewBudgetModal: () => void;
  closeBudgetModal: () => void;
  saveBudget: (b: Omit<Budget, 'id'> & { id?: string }) => void;
  deleteBudget: (id: string) => void;

  // Membros & Categorias
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  saveCategory: (cat: Omit<Category, 'id'> & { id?: string }) => void;
  deleteCategory: (id: string) => boolean;
  addProject: (proj: Omit<Project, 'id'>) => void;

  // Utilitários de Dados & SQLite
  generateSqlDump: () => string;
  exportJsonData: () => string;
  importJsonData: (jsonStr: string) => boolean;
  resetToSampleData: () => void;
  recalculateBalances: () => void;

  // Câmbio & Multi-Moedas
  rateLogs: ExchangeRateLog[];
  isFetchingRates: boolean;
  lastRatesFetchTime: string | null;
  updateExchangeRate: (code: string, rateToBase: number, source?: 'api' | 'manual') => void;
  saveCurrency: (currency: Currency) => void;
  deleteCurrency: (code: string) => boolean;
  setBaseCurrency: (code: string) => void;
  fetchLiveExchangeRates: () => Promise<{ success: boolean; updatedCount: number; error?: string }>;
  convertCurrency: (amount: number, fromCode: string, toCode: string) => number;
  executeMultiCurrencyTransfer: (params: {
    fromAccountId: string;
    toAccountId: string;
    fromAmount: number;
    toAmount: number;
    exchangeRate: number;
    feeAmount?: number;
    date: string;
    payee?: string;
    notes?: string;
  }) => void;

  // Personalização do Dashboard (Drag & Drop e Toggles)
  dashboardWidgets: DashboardWidgetConfig[];
  isCustomizingDashboard: boolean;
  setIsCustomizingDashboard: (isOpen: boolean) => void;
  toggleWidgetVisibility: (id: DashboardWidgetId) => void;
  setWidgetVisibility: (id: DashboardWidgetId, visible: boolean) => void;
  reorderWidgets: (startIndex: number, endIndex: number) => void;
  moveWidget: (id: DashboardWidgetId, direction: 'up' | 'down') => void;
  applyDashboardPreset: (preset: DashboardLayoutPreset) => void;
  resetDashboardWidgets: () => void;

  // Bancos, Open Finance e Catalogação Automática
  bankConnections: BankConnection[];
  autoCategorizationRules: AutoCategorizationRule[];
  isSyncingBanks: boolean;
  isLinkBankModalOpen: boolean;
  isImportStatementModalOpen: boolean;
  selectedImportAccountId: string | null;
  openLinkBankModal: () => void;
  closeLinkBankModal: () => void;
  openImportStatementModal: (accountId?: string) => void;
  closeImportStatementModal: () => void;
  linkNewBankConnection: (
    connection: Omit<BankConnection, 'id' | 'connectedAt' | 'lastSyncAt'>,
    options?: {
      createCheckingAccount?: boolean;
      createCreditCard?: boolean;
      checkingName?: string;
      creditCardName?: string;
      creditLimit?: number;
    }
  ) => void;
  unlinkBankConnection: (connectionId: string) => void;
  syncBankConnection: (connectionId: string) => Promise<{ newTransactionsCount: number }>;
  syncAllBankConnections: () => Promise<void>;
  importStatementTransactions: (
    accountId: string,
    rawText: string,
    format: 'ofx' | 'csv' | 'text'
  ) => { importedCount: number; autoCategorizedCount: number };
  addAutoCategorizationRule: (rule: Omit<AutoCategorizationRule, 'id' | 'matchesCount'>) => void;
  updateAutoCategorizationRule: (id: string, updates: Partial<AutoCategorizationRule>) => void;
  deleteAutoCategorizationRule: (id: string) => void;
  reclassifyTransactionCategory: (txId: string, newCategoryId: string, createRule?: boolean) => void;
  approveAutoCategorization: (txId: string) => void;
}

// Carregar estado prévio se existir no navegador
const loadSavedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (e) {
    console.error('Falha ao carregar localStorage:', e);
  }
  return null;
};

const saved = loadSavedState();

export const useFinanceStore = create<FinanceStoreState>((set, get) => ({
  accounts: saved?.accounts || initialAccounts,
  categories: saved?.categories || initialCategories,
  familyMembers: saved?.familyMembers || initialFamilyMembers,
  projects: saved?.projects || initialProjects,
  tags: saved?.tags || initialTags,
  transactions: saved?.transactions || initialTransactions,
  budgets: saved?.budgets || initialBudgets,
  currencies: saved?.currencies || initialCurrencies,

  activeTab: 'dashboard',
  activeCurrencyCode: 'BRL',
  selectedAccountId: null,
  selectedFamilyMemberId: null,
  selectedProjectId: null,

  filters: {
    search: '',
    dateRange: 'all',
  },

  isTransactionModalOpen: false,
  editingTransaction: null,
  isAccountModalOpen: false,
  editingAccount: null,
  isBudgetModalOpen: false,
  isReminderModalOpen: false,
  searchQuery: '',

  reminderSettings: saved?.reminderSettings || {
    enabled: true,
    nativeNotificationsEnabled: false,
    daysInAdvance: 3,
    notifyPendingExpenses: true,
    notifyPendingIncomes: true,
    notifyRecurring: true,
    soundEnabled: true,
  },
  openReminderModal: () => set({ isReminderModalOpen: true }),
  closeReminderModal: () => set({ isReminderModalOpen: false }),
  updateReminderSettings: (newSettings) =>
    set((state) => {
      const updated = { ...state.reminderSettings, ...newSettings };
      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast('Preferências de lembretes salvas com sucesso!', 'success');
      return { reminderSettings: updated };
    }),

  // Câmbio & Multi-Moedas State
  rateLogs: saved?.rateLogs || [
    { id: 'log-1', timestamp: '2026-10-17T12:00:00Z', currencyCode: 'USD', rate: 5.65, source: 'manual', previousRate: 5.62 },
    { id: 'log-2', timestamp: '2026-10-17T12:00:00Z', currencyCode: 'EUR', rate: 6.15, source: 'manual', previousRate: 6.18 },
    { id: 'log-3', timestamp: '2026-10-17T12:00:00Z', currencyCode: 'GBP', rate: 7.35, source: 'manual', previousRate: 7.32 },
  ],
  isFetchingRates: false,
  lastRatesFetchTime: saved?.lastRatesFetchTime || '2026-10-17T12:00:00Z',

  // Personalização do Dashboard
  dashboardWidgets: saved?.dashboardWidgets || initialDashboardWidgets,
  isCustomizingDashboard: false,

  // Conexões Bancárias & Open Finance
  bankConnections: saved?.bankConnections || initialBankConnections,
  autoCategorizationRules: saved?.autoCategorizationRules || initialAutoCategorizationRules,
  isSyncingBanks: false,
  isLinkBankModalOpen: false,
  isImportStatementModalOpen: false,
  selectedImportAccountId: null,

  openLinkBankModal: () => set({ isLinkBankModalOpen: true }),
  closeLinkBankModal: () => set({ isLinkBankModalOpen: false }),
  openImportStatementModal: (accountId) =>
    set({ isImportStatementModalOpen: true, selectedImportAccountId: accountId || null }),
  closeImportStatementModal: () =>
    set({ isImportStatementModalOpen: false, selectedImportAccountId: null }),

  toasts: [],
  addToast: (message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveCurrencyCode: (code) => {
    set({ activeCurrencyCode: code });
    get().addToast(`Moeda ativa alterada para ${code}`, 'info');
  },
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
  setSelectedFamilyMemberId: (id) => set({ selectedFamilyMemberId: id }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () =>
    set({
      filters: { search: '', dateRange: 'all' },
      selectedAccountId: null,
      selectedFamilyMemberId: null,
      selectedProjectId: null,
      searchQuery: '',
    }),

  openNewTransactionModal: (defaultType = 'expense', defaultAccountId) =>
    set({
      editingTransaction: null,
      isTransactionModalOpen: true,
      selectedAccountId: defaultAccountId || get().selectedAccountId,
    }),

  openEditTransactionModal: (tx) =>
    set({
      editingTransaction: tx,
      isTransactionModalOpen: true,
    }),

  closeTransactionModal: () =>
    set({
      editingTransaction: null,
      isTransactionModalOpen: false,
    }),

  saveTransaction: (txData) => {
    const isNew = !txData.id;
    const txId = txData.id || `tx-${Date.now()}`;
    const createdAt = txData.id
      ? get().transactions.find((t) => t.id === txData.id)?.createdAt || new Date().toISOString()
      : new Date().toISOString();

    const fullTx: Transaction = {
      ...txData,
      id: txId,
      createdAt,
    };

    set((state) => {
      let updatedTransactions: Transaction[];
      if (isNew) {
        updatedTransactions = [fullTx, ...state.transactions];
      } else {
        updatedTransactions = state.transactions.map((t) => (t.id === txId ? fullTx : t));
      }

      // Salva no localStorage e recalcula saldos
      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(isNew ? 'Transação gravada com sucesso!' : 'Transação atualizada com sucesso!', 'success');
      return {
        transactions: updatedTransactions,
        isTransactionModalOpen: false,
        editingTransaction: null,
      };
    });
  },

  deleteTransaction: (id) => {
    set((state) => {
      const updated = state.transactions.filter((t) => t.id !== id);
      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast('Transação excluída do registro.', 'info');
      return { transactions: updated };
    });
  },

  duplicateTransaction: (id) => {
    const original = get().transactions.find((t) => t.id === id);
    if (!original) return;

    const duplicated: Transaction = {
      ...original,
      id: `tx-${Date.now()}`,
      payee: `${original.payee} (Cópia)`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [duplicated, ...state.transactions];
      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(`Transação "${original.payee}" duplicada!`, 'success');
      return { transactions: updated };
    });
  },

  markTransactionAsCleared: (id) => {
    set((state) => {
      const tx = state.transactions.find((t) => t.id === id);
      if (!tx) return state;
      const updated = state.transactions.map((t) =>
        t.id === id ? { ...t, status: 'cleared' as const } : t
      );
      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(`Transação "${tx.payee}" liquidada e compensada!`, 'success');
      return { transactions: updated };
    });
  },

  postponeTransaction: (id, days) => {
    set((state) => {
      const tx = state.transactions.find((t) => t.id === id);
      if (!tx) return state;
      const newDate = addDaysToDate(tx.date, days);
      const updated = state.transactions.map((t) =>
        t.id === id ? { ...t, date: newDate } : t
      );
      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(`Vencimento de "${tx.payee}" adiado para ${newDate}.`, 'info');
      return { transactions: updated };
    });
  },

  getReminderItems: () => {
    const { transactions, reminderSettings } = get();
    if (!reminderSettings.enabled) return [];

    const items: ReminderItem[] = [];

    transactions.forEach((tx) => {
      if (tx.status === 'void') return;
      if (tx.type === 'expense' && !reminderSettings.notifyPendingExpenses) return;
      if (tx.type === 'income' && !reminderSettings.notifyPendingIncomes) return;

      const diff = getDaysDiffFromToday(tx.date);
      const isPending = tx.status === 'pending';
      const isRecurring = !!tx.isRecurring;

      if (!isPending && !isRecurring) return;

      let urgency: 'overdue' | 'due_today' | 'upcoming' | 'future_recurring';
      let isOverdue = false;
      let isToday = false;

      if (isPending && diff < 0) {
        urgency = 'overdue';
        isOverdue = true;
      } else if (isPending && diff === 0) {
        urgency = 'due_today';
        isToday = true;
      } else if (isPending && diff > 0 && diff <= reminderSettings.daysInAdvance) {
        urgency = 'upcoming';
      } else if (isRecurring && reminderSettings.notifyRecurring && diff >= 0 && diff <= reminderSettings.daysInAdvance) {
        urgency = diff === 0 ? 'due_today' : 'upcoming';
        isToday = diff === 0;
      } else if (isRecurring && diff > reminderSettings.daysInAdvance) {
        urgency = 'future_recurring';
      } else {
        return;
      }

      items.push({
        id: `rem-${tx.id}`,
        transaction: tx,
        dueDate: tx.date,
        daysRemaining: diff,
        urgency,
        isOverdue,
        isToday,
        isScheduledRecurring: isRecurring,
      });
    });

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  },

  checkAndSendReminders: async (forceManual = false) => {
    const state = get();
    const { reminderSettings } = state;
    if (!reminderSettings.enabled && !forceManual) {
      return { notifiedCount: 0, dueItems: [] };
    }

    const reminderItems = state.getReminderItems();
    const urgentItems = reminderItems.filter(
      (item) => item.urgency === 'overdue' || item.urgency === 'due_today' || item.urgency === 'upcoming'
    );

    if (urgentItems.length === 0) {
      if (forceManual) {
        state.addToast('Nenhum vencimento pendente no período configurado.', 'info');
      }
      return { notifiedCount: 0, dueItems: [] };
    }

    const overdueCount = urgentItems.filter((i) => i.isOverdue).length;
    const todayCount = urgentItems.filter((i) => i.isToday).length;
    const upcomingCount = urgentItems.filter((i) => i.urgency === 'upcoming').length;

    const totalAmount = urgentItems.reduce((sum, item) => sum + item.transaction.amount, 0);

    const summaryParts: string[] = [];
    if (overdueCount > 0) summaryParts.push(`${overdueCount} atrasada(s)`);
    if (todayCount > 0) summaryParts.push(`${todayCount} vence(m) hoje`);
    if (upcomingCount > 0) summaryParts.push(`${upcomingCount} nos próximos ${reminderSettings.daysInAdvance} dias`);

    const title = 'Alzex Finance Pro - Lembrete de Vencimentos';
    const body = `Atenção: ${summaryParts.join(', ')}. Total: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    if (reminderSettings.nativeNotificationsEnabled || forceManual) {
      await sendNativeNotification(title, body, {
        playChime: reminderSettings.soundEnabled,
        onClick: () => {
          state.openReminderModal();
        },
      });
    }

    if (forceManual) {
      state.addToast(`Notificação disparada: ${urgentItems.length} transações requerem atenção!`, 'warning');
    }

    return { notifiedCount: urgentItems.length, dueItems: urgentItems };
  },

  openNewAccountModal: () =>
    set({
      editingAccount: null,
      isAccountModalOpen: true,
    }),

  openEditAccountModal: (acc) =>
    set({
      editingAccount: acc,
      isAccountModalOpen: true,
    }),

  closeAccountModal: () =>
    set({
      editingAccount: null,
      isAccountModalOpen: false,
    }),

  saveAccount: (accData) => {
    const isNew = !accData.id;
    const accId = accData.id || `acc-${Date.now()}`;

    const fullAccount: Account = {
      id: accId,
      name: accData.name,
      type: accData.type,
      initialBalance: accData.initialBalance,
      currentBalance: accData.currentBalance ?? accData.initialBalance,
      currencyCode: accData.currencyCode || 'BRL',
      color: accData.color || '#0ea5e9',
      icon: accData.icon || 'Wallet',
      notes: accData.notes || '',
      isArchived: accData.isArchived ?? false,
    };

    set((state) => {
      const updated = isNew
        ? [...state.accounts, fullAccount]
        : state.accounts.map((a) => (a.id === accId ? fullAccount : a));

      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(isNew ? `Conta "${fullAccount.name}" criada!` : `Conta "${fullAccount.name}" atualizada!`, 'success');
      return { accounts: updated, isAccountModalOpen: false, editingAccount: null };
    });
  },

  deleteAccount: (id) => {
    set((state) => {
      const updatedAccounts = state.accounts.filter((a) => a.id !== id);
      const updatedTransactions = state.transactions.filter(
        (t) => t.accountId !== id && t.toAccountId !== id
      );
      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast('Conta e registros associados removidos.', 'info');
      return { accounts: updatedAccounts, transactions: updatedTransactions };
    });
  },

  openNewBudgetModal: () => set({ isBudgetModalOpen: true }),
  closeBudgetModal: () => set({ isBudgetModalOpen: false }),

  saveBudget: (bData) => {
    const isNew = !bData.id;
    const bId = bData.id || `b-${Date.now()}`;
    const budget: Budget = {
      ...bData,
      id: bId,
    };

    set((state) => {
      get().addToast('Meta de orçamento salva com sucesso!', 'success');
      return {
        budgets: isNew ? [...state.budgets, budget] : state.budgets.map((b) => (b.id === bId ? budget : b)),
        isBudgetModalOpen: false,
      };
    });
  },

  deleteBudget: (id) => {
    set((state) => {
      get().addToast('Orçamento excluído.', 'info');
      return {
        budgets: state.budgets.filter((b) => b.id !== id),
      };
    });
  },

  addFamilyMember: (member) => {
    const newMember: FamilyMember = {
      ...member,
      id: `fm-${Date.now()}`,
    };
    set((state) => ({ familyMembers: [...state.familyMembers, newMember] }));
  },

  addCategory: (cat) => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    set((state) => {
      const updated = [...state.categories, newCat];
      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(`Categoria "${newCat.name}" criada com sucesso!`, 'success');
      return { categories: updated };
    });
  },

  saveCategory: (catData) => {
    const isNew = !catData.id;
    const catId = catData.id || `cat-${Date.now()}`;
    const category: Category = {
      ...catData,
      id: catId,
      parentId: catData.parentId || null,
      icon: catData.icon || 'Folder',
      color: catData.color || '#64748b',
    };

    set((state) => {
      const updated = isNew
        ? [...state.categories, category]
        : state.categories.map((c) => (c.id === catId ? category : c));

      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(
        isNew ? `Categoria "${category.name}" adicionada!` : `Categoria "${category.name}" atualizada!`,
        'success'
      );
      return { categories: updated };
    });
  },

  deleteCategory: (id) => {
    const state = get();
    const catToDelete = state.categories.find((c) => c.id === id);
    if (!catToDelete) return false;

    // Verificar se há subcategorias vinculadas
    const subcats = state.categories.filter((c) => c.parentId === id);

    // Desassociar transações ou splits dessa categoria (ou subcategorias)
    const updatedCategories = state.categories
      .filter((c) => c.id !== id && c.parentId !== id);

    const updatedBudgets = state.budgets.filter((b) => b.categoryId !== id);

    set({
      categories: updatedCategories,
      budgets: updatedBudgets,
    });

    setTimeout(() => get().recalculateBalances(), 0);
    get().addToast(`Categoria "${catToDelete.name}" ${subcats.length > 0 ? `e ${subcats.length} subcategorias ` : ''}removida com sucesso!`, 'info');
    return true;
  },

  addProject: (proj) => {
    const newProj: Project = {
      ...proj,
      id: `proj-${Date.now()}`,
    };
    set((state) => ({ projects: [...state.projects, newProj] }));
  },

  recalculateBalances: () => {
    const state = get();
    const updatedAccounts = state.accounts.map((account) => {
      let balance = account.initialBalance;

      for (const tx of state.transactions) {
        if (tx.status === 'void') continue;

        if (tx.accountId === account.id) {
          if (tx.type === 'expense') {
            balance -= tx.amount;
          } else if (tx.type === 'income') {
            balance += tx.amount;
          } else if (tx.type === 'transfer') {
            balance -= tx.amount;
          }
        }

        // Se for destino de uma transferência
        if (tx.type === 'transfer' && tx.toAccountId === account.id) {
          // Se houver targetAmount especificado (transferência multi-moeda com valor já convertido)
          if (tx.targetAmount !== undefined && tx.targetAmount !== null) {
            balance += tx.targetAmount;
          } else {
            // Verificar se as contas de origem e destino possuem moedas distintas
            const sourceAcc = state.accounts.find((a) => a.id === tx.accountId);
            if (sourceAcc && sourceAcc.currencyCode !== account.currencyCode) {
              const srcCurr = state.currencies.find((c) => c.code === sourceAcc.currencyCode) || state.currencies[0];
              const destCurr = state.currencies.find((c) => c.code === account.currencyCode) || state.currencies[0];
              const inBase = tx.amount * (srcCurr?.rateToBase || 1.0);
              const converted = inBase / (destCurr?.rateToBase || 1.0);
              balance += converted;
            } else {
              balance += tx.amount;
            }
          }
        }
      }

      return {
        ...account,
        currentBalance: Math.round(balance * 100) / 100,
      };
    });

    set({ accounts: updatedAccounts });

    // Salvar estado atualizado no localStorage
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accounts: updatedAccounts,
          categories: state.categories,
          familyMembers: state.familyMembers,
          projects: state.projects,
          tags: state.tags,
          transactions: state.transactions,
          budgets: state.budgets,
          currencies: state.currencies,
          reminderSettings: state.reminderSettings,
          rateLogs: state.rateLogs,
          lastRatesFetchTime: state.lastRatesFetchTime,
          dashboardWidgets: state.dashboardWidgets,
          bankConnections: state.bankConnections,
          autoCategorizationRules: state.autoCategorizationRules,
        })
      );
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  },

  updateExchangeRate: (code, rateToBase, source = 'manual') => {
    set((state) => {
      const prevCurrency = state.currencies.find((c) => c.code === code);
      const previousRate = prevCurrency ? prevCurrency.rateToBase : undefined;
      const change24h = previousRate && previousRate > 0
        ? Math.round(((rateToBase - previousRate) / previousRate) * 10000) / 100
        : prevCurrency?.change24h || 0;

      const updatedCurrencies = state.currencies.map((c) =>
        c.code === code
          ? {
              ...c,
              rateToBase: Number(rateToBase),
              source,
              lastUpdated: new Date().toISOString(),
              change24h,
            }
          : c
      );

      const newLog: ExchangeRateLog = {
        id: `rate-${Date.now()}-${code}`,
        timestamp: new Date().toISOString(),
        currencyCode: code,
        rate: Number(rateToBase),
        source,
        previousRate,
      };

      const updatedLogs = [newLog, ...(state.rateLogs || [])].slice(0, 50);

      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(`Cotação de ${code} atualizada para ${Number(rateToBase).toFixed(4)}!`, 'success');

      return {
        currencies: updatedCurrencies,
        rateLogs: updatedLogs,
      };
    });
  },

  saveCurrency: (curr) => {
    set((state) => {
      const exists = state.currencies.some((c) => c.code === curr.code);
      let updatedCurrencies: Currency[];
      if (curr.isBase) {
        const remapped = state.currencies.map((c) => ({
          ...c,
          isBase: c.code === curr.code,
        }));
        if (exists) {
          updatedCurrencies = remapped.map((c) => (c.code === curr.code ? { ...c, ...curr, rateToBase: 1.0, isBase: true } : c));
        } else {
          updatedCurrencies = [...remapped, { ...curr, rateToBase: 1.0, isBase: true }];
        }
      } else {
        if (exists) {
          updatedCurrencies = state.currencies.map((c) => (c.code === curr.code ? { ...c, ...curr } : c));
        } else {
          updatedCurrencies = [
            ...state.currencies,
            { ...curr, lastUpdated: new Date().toISOString(), source: curr.source || 'manual' },
          ];
        }
      }

      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(`Moeda ${curr.code} (${curr.name}) salva com sucesso!`, 'success');
      return { currencies: updatedCurrencies };
    });
  },

  deleteCurrency: (code) => {
    const state = get();
    const curr = state.currencies.find((c) => c.code === code);
    if (!curr) return false;

    if (curr.isBase) {
      get().addToast('Não é possível excluir a moeda base do sistema.', 'error');
      return false;
    }

    const inUseByAccount = state.accounts.some((a) => a.currencyCode === code);
    if (inUseByAccount) {
      get().addToast(`A moeda ${code} está em uso por contas ativas e não pode ser excluída.`, 'error');
      return false;
    }

    const inUseByTx = state.transactions.some((t) => t.currencyCode === code);
    if (inUseByTx) {
      get().addToast(`A moeda ${code} possui transações associadas e não pode ser excluída.`, 'error');
      return false;
    }

    set({
      currencies: state.currencies.filter((c) => c.code !== code),
    });
    setTimeout(() => get().recalculateBalances(), 0);
    get().addToast(`Moeda ${code} removida com sucesso.`, 'info');
    return true;
  },

  setBaseCurrency: (code) => {
    const state = get();
    const target = state.currencies.find((c) => c.code === code);
    if (!target) return;
    if (target.isBase) return;

    const oldBaseRate = target.rateToBase || 1.0;

    const updatedCurrencies = state.currencies.map((c) => {
      if (c.code === code) {
        return { ...c, rateToBase: 1.0, isBase: true, lastUpdated: new Date().toISOString() };
      }
      const newRate = oldBaseRate > 0 ? (c.rateToBase || 1.0) / oldBaseRate : c.rateToBase;
      return {
        ...c,
        isBase: false,
        rateToBase: Math.round(newRate * 10000) / 10000,
        lastUpdated: new Date().toISOString(),
      };
    });

    set({
      currencies: updatedCurrencies,
      activeCurrencyCode: code,
    });
    setTimeout(() => get().recalculateBalances(), 0);
    get().addToast(`Moeda base alterada para ${code}! Todas as cotações foram recalculadas.`, 'success');
  },

  fetchLiveExchangeRates: async () => {
    const state = get();
    set({ isFetchingRates: true });

    const baseCurr = state.currencies.find((c) => c.isBase) || state.currencies[0];
    const baseCode = baseCurr.code;

    try {
      let ratesData: Record<string, number> | null = null;
      let apiProvider = 'Open Exchange Rates (er-api)';

      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${baseCode}`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.rates) {
            ratesData = json.rates;
          }
        }
      } catch (err) {
        console.warn('Falha na API primária open.er-api:', err);
      }

      if (!ratesData) {
        try {
          const resFallback = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCode}`);
          if (resFallback.ok) {
            const jsonFallback = await resFallback.json();
            if (jsonFallback && jsonFallback.rates) {
              ratesData = jsonFallback.rates;
              apiProvider = 'ExchangeRate-API';
            }
          }
        } catch (err2) {
          console.warn('Falha no fallback:', err2);
        }
      }

      if (!ratesData) {
        throw new Error('Não foi possível conectar aos servidores de cotação online. Verifique sua conexão.');
      }

      let updatedCount = 0;
      const now = new Date().toISOString();
      const newLogs: ExchangeRateLog[] = [];

      const updatedCurrencies = state.currencies.map((curr) => {
        if (curr.isBase) {
          return { ...curr, rateToBase: 1.0, lastUpdated: now, source: 'api' as const };
        }

        const rawRate = ratesData![curr.code];
        if (rawRate && rawRate > 0) {
          // A API retorna unidades de curr.code por 1 unidade de baseCode.
          // Logo, 1 unidade de curr.code = (1 / rawRate) unidades de baseCode.
          const newRateToBase = Math.round((1 / rawRate) * 10000) / 10000;
          const prev = curr.rateToBase;
          const change24h = prev > 0 ? Math.round(((newRateToBase - prev) / prev) * 10000) / 100 : 0;

          updatedCount++;
          newLogs.push({
            id: `rate-${Date.now()}-${curr.code}`,
            timestamp: now,
            currencyCode: curr.code,
            rate: newRateToBase,
            source: 'api',
            previousRate: prev,
          });

          return {
            ...curr,
            rateToBase: newRateToBase,
            lastUpdated: now,
            source: 'api' as const,
            change24h,
          };
        }

        return curr;
      });

      const mergedLogs = [...newLogs, ...(state.rateLogs || [])].slice(0, 50);

      set({
        currencies: updatedCurrencies,
        rateLogs: mergedLogs,
        isFetchingRates: false,
        lastRatesFetchTime: now,
      });

      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast(`Cotações online atualizadas via ${apiProvider} (${updatedCount} moedas sincronizadas)!`, 'success');
      return { success: true, updatedCount };
    } catch (error: any) {
      set({ isFetchingRates: false });
      const errorMsg = error?.message || 'Falha ao buscar cotações online.';
      get().addToast(errorMsg, 'error');
      return { success: false, updatedCount: 0, error: errorMsg };
    }
  },

  convertCurrency: (amount, fromCode, toCode) => {
    if (fromCode === toCode) return amount;
    const { currencies } = get();
    const from = currencies.find((c) => c.code === fromCode) || currencies[0];
    const to = currencies.find((c) => c.code === toCode) || currencies[0];

    const inBase = amount * (from?.rateToBase || 1.0);
    const result = inBase / (to?.rateToBase || 1.0);
    return Math.round(result * 100) / 100;
  },

  executeMultiCurrencyTransfer: (params) => {
    const { accounts, addToast } = get();
    const fromAcc = accounts.find((a) => a.id === params.fromAccountId);
    const toAcc = accounts.find((a) => a.id === params.toAccountId);

    if (!fromAcc || !toAcc) {
      addToast('Contas de origem e destino inválidas para transferência.', 'error');
      return;
    }

    const txDate = params.date || new Date().toISOString().split('T')[0];
    const txId = `tx-transfer-${Date.now()}`;

    const defaultNotes = `Conversão de Câmbio: ${fromAcc.currencyCode} ➔ ${toAcc.currencyCode} | Taxa: ${params.exchangeRate.toFixed(4)}${
      params.feeAmount ? ` | Tarifa/IOF: ${params.feeAmount.toFixed(2)} ${fromAcc.currencyCode}` : ''
    }${params.notes ? `\n${params.notes}` : ''}`;

    // 1. Criar transação de transferência multi-moeda
    const transferTx: Transaction = {
      id: txId,
      date: txDate,
      type: 'transfer',
      amount: Number(params.fromAmount),
      targetAmount: Number(params.toAmount),
      exchangeRate: Number(params.exchangeRate),
      fee: params.feeAmount ? Number(params.feeAmount) : 0,
      accountId: params.fromAccountId,
      toAccountId: params.toAccountId,
      currencyCode: fromAcc.currencyCode,
      status: 'cleared',
      payee: params.payee || `Transferência Câmbio ${fromAcc.currencyCode} ➔ ${toAcc.currencyCode}`,
      notes: defaultNotes,
      createdAt: new Date().toISOString(),
    };

    const newTransactions = [transferTx];

    // 2. Se houver tarifa/IOF cobrado na moeda de origem, registrar despesa correspondente
    if (params.feeAmount && params.feeAmount > 0) {
      const feeTx: Transaction = {
        id: `tx-fee-${Date.now()}`,
        date: txDate,
        type: 'expense',
        amount: Number(params.feeAmount),
        accountId: params.fromAccountId,
        currencyCode: fromAcc.currencyCode,
        status: 'cleared',
        payee: 'Tarifa / IOF de Câmbio',
        notes: `IOF e taxas bancárias vinculadas à transferência ${txId}`,
        createdAt: new Date().toISOString(),
      };
      newTransactions.push(feeTx);
    }

    set((state) => ({
      transactions: [...newTransactions, ...state.transactions],
    }));

    setTimeout(() => get().recalculateBalances(), 0);
    addToast(
      `Transferência de câmbio realizada: Débito de ${params.fromAmount.toFixed(2)} ${fromAcc.currencyCode} e Crédito de ${params.toAmount.toFixed(2)} ${toAcc.currencyCode}!`,
      'success'
    );
  },

  generateSqlDump: () => {
    const { accounts, categories, familyMembers, projects, tags, transactions, budgets, currencies } = get();

    let sql = `-- ====================================================\n`;
    sql += `-- ALZEX FINANCE PRO - SQL DUMP E DDL DEFINITION\n`;
    sql += `-- Gerado em: ${new Date().toISOString()}\n`;
    sql += `-- Motor: SQLite 3.x (WAL Mode & Foreign Keys ON)\n`;
    sql += `-- ====================================================\n\n`;

    sql += `PRAGMA foreign_keys = ON;\nPRAGMA journal_mode = WAL;\n\n`;

    // Tabelas DDL
    sql += `-- 1. Currencies\n`;
    sql += `CREATE TABLE IF NOT EXISTS currencies (\n`;
    sql += `  code TEXT PRIMARY KEY,\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  symbol TEXT NOT NULL,\n`;
    sql += `  rate_to_base REAL NOT NULL DEFAULT 1.0,\n`;
    sql += `  is_base INTEGER NOT NULL DEFAULT 0\n`;
    sql += `);\n\n`;

    sql += `-- 2. Accounts\n`;
    sql += `CREATE TABLE IF NOT EXISTS accounts (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  type TEXT NOT NULL CHECK(type IN ('wallet', 'checking', 'credit_card', 'investment', 'savings')),\n`;
    sql += `  initial_balance REAL NOT NULL DEFAULT 0.0,\n`;
    sql += `  current_balance REAL NOT NULL DEFAULT 0.0,\n`;
    sql += `  currency_code TEXT NOT NULL REFERENCES currencies(code),\n`;
    sql += `  color TEXT NOT NULL,\n`;
    sql += `  icon TEXT NOT NULL,\n`;
    sql += `  notes TEXT,\n`;
    sql += `  is_archived INTEGER DEFAULT 0\n`;
    sql += `);\n\n`;

    sql += `-- 3. Categories\n`;
    sql += `CREATE TABLE IF NOT EXISTS categories (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  parent_id TEXT REFERENCES categories(id),\n`;
    sql += `  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),\n`;
    sql += `  icon TEXT NOT NULL,\n`;
    sql += `  color TEXT NOT NULL\n`;
    sql += `);\n\n`;

    sql += `-- 4. Family Members\n`;
    sql += `CREATE TABLE IF NOT EXISTS family_members (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  role TEXT NOT NULL,\n`;
    sql += `  avatar TEXT NOT NULL,\n`;
    sql += `  color TEXT NOT NULL\n`;
    sql += `);\n\n`;

    sql += `-- 5. Transactions\n`;
    sql += `CREATE TABLE IF NOT EXISTS transactions (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  date TEXT NOT NULL,\n`;
    sql += `  type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),\n`;
    sql += `  amount REAL NOT NULL,\n`;
    sql += `  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,\n`;
    sql += `  to_account_id TEXT REFERENCES accounts(id),\n`;
    sql += `  category_id TEXT REFERENCES categories(id),\n`;
    sql += `  family_member_id TEXT REFERENCES family_members(id),\n`;
    sql += `  status TEXT NOT NULL DEFAULT 'cleared',\n`;
    sql += `  payee TEXT NOT NULL,\n`;
    sql += `  notes TEXT,\n`;
    sql += `  currency_code TEXT NOT NULL,\n`;
    sql += `  is_split INTEGER DEFAULT 0\n`;
    sql += `);\n\n`;

    sql += `-- 6. Splits\n`;
    sql += `CREATE TABLE IF NOT EXISTS transaction_splits (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,\n`;
    sql += `  category_id TEXT NOT NULL REFERENCES categories(id),\n`;
    sql += `  amount REAL NOT NULL,\n`;
    sql += `  family_member_id TEXT REFERENCES family_members(id),\n`;
    sql += `  notes TEXT\n`;
    sql += `);\n\n`;

    // INSERT SEED DATA
    sql += `-- ====================================================\n`;
    sql += `-- INSERTS DE REGISTROS ATUAIS\n`;
    sql += `-- ====================================================\n`;
    currencies.forEach((c) => {
      sql += `INSERT OR REPLACE INTO currencies (code, name, symbol, rate_to_base, is_base) VALUES ('${c.code}', '${c.name}', '${c.symbol}', ${c.rateToBase}, ${c.isBase ? 1 : 0});\n`;
    });

    accounts.forEach((a) => {
      sql += `INSERT OR REPLACE INTO accounts (id, name, type, initial_balance, current_balance, currency_code, color, icon, notes, is_archived) VALUES ('${a.id}', '${a.name.replace(/'/g, "''")}', '${a.type}', ${a.initialBalance}, ${a.currentBalance}, '${a.currencyCode}', '${a.color}', '${a.icon}', '${(a.notes || '').replace(/'/g, "''")}', ${a.isArchived ? 1 : 0});\n`;
    });

    categories.forEach((c) => {
      sql += `INSERT OR REPLACE INTO categories (id, name, parent_id, type, icon, color) VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', ${c.parentId ? `'${c.parentId}'` : 'NULL'}, '${c.type}', '${c.icon}', '${c.color}');\n`;
    });

    familyMembers.forEach((m) => {
      sql += `INSERT OR REPLACE INTO family_members (id, name, role, avatar, color) VALUES ('${m.id}', '${m.name.replace(/'/g, "''")}', '${m.role.replace(/'/g, "''")}', '${m.avatar}', '${m.color}');\n`;
    });

    transactions.forEach((t) => {
      sql += `INSERT OR REPLACE INTO transactions (id, date, type, amount, account_id, to_account_id, category_id, family_member_id, status, payee, notes, currency_code, is_split) VALUES ('${t.id}', '${t.date}', '${t.type}', ${t.amount}, '${t.accountId}', ${t.toAccountId ? `'${t.toAccountId}'` : 'NULL'}, ${t.categoryId ? `'${t.categoryId}'` : 'NULL'}, ${t.familyMemberId ? `'${t.familyMemberId}'` : 'NULL'}, '${t.status}', '${t.payee.replace(/'/g, "''")}', '${(t.notes || '').replace(/'/g, "''")}', '${t.currencyCode}', ${t.isSplit ? 1 : 0});\n`;

      if (t.splits && t.splits.length > 0) {
        t.splits.forEach((s) => {
          sql += `  INSERT OR REPLACE INTO transaction_splits (id, transaction_id, category_id, amount, family_member_id, notes) VALUES ('${s.id}', '${t.id}', '${s.categoryId}', ${s.amount}, ${s.familyMemberId ? `'${s.familyMemberId}'` : 'NULL'}, '${(s.notes || '').replace(/'/g, "''")}');\n`;
        });
      }
    });

    return sql;
  },

  exportJsonData: () => {
    const state = get();
    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          accounts: state.accounts,
          categories: state.categories,
          familyMembers: state.familyMembers,
          projects: state.projects,
          tags: state.tags,
          transactions: state.transactions,
          budgets: state.budgets,
          currencies: state.currencies,
        },
      },
      null,
      2
    );
  },

  importJsonData: (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.data || parsed;
      if (!data.accounts || !data.transactions) return false;

      set({
        accounts: data.accounts || [],
        categories: data.categories || [],
        familyMembers: data.familyMembers || [],
        projects: data.projects || [],
        tags: data.tags || [],
        transactions: data.transactions || [],
        budgets: data.budgets || [],
        currencies: data.currencies || initialCurrencies,
      });

      setTimeout(() => get().recalculateBalances(), 0);
      get().addToast('Backup JSON restaurado com sucesso!', 'success');
      return true;
    } catch (e) {
      console.error('Falha ao importar JSON:', e);
      get().addToast('Falha ao importar arquivo JSON: formato inválido', 'error');
      return false;
    }
  },

  resetToSampleData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      accounts: initialAccounts,
      categories: initialCategories,
      familyMembers: initialFamilyMembers,
      projects: initialProjects,
      tags: initialTags,
      transactions: initialTransactions,
      budgets: initialBudgets,
      currencies: initialCurrencies,
    });
    setTimeout(() => get().recalculateBalances(), 0);
    get().addToast('Base de dados restaurada para o padrão de demonstração!', 'info');
  },

  // Personalização do Dashboard (Drag & Drop e Toggles)
  setIsCustomizingDashboard: (isOpen: boolean) => set({ isCustomizingDashboard: isOpen }),

  toggleWidgetVisibility: (id: DashboardWidgetId) => {
    set((state) => {
      const updated = state.dashboardWidgets.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w
      );
      const target = updated.find((w) => w.id === id);
      const msg = target?.visible
        ? `Widget "${target.title}" ativado no painel`
        : `Widget "${target?.title}" ocultado do painel`;
      get().addToast(msg, 'info');
      setTimeout(() => get().recalculateBalances(), 0);
      return { dashboardWidgets: updated };
    });
  },

  setWidgetVisibility: (id: DashboardWidgetId, visible: boolean) => {
    set((state) => {
      const updated = state.dashboardWidgets.map((w) =>
        w.id === id ? { ...w, visible } : w
      );
      setTimeout(() => get().recalculateBalances(), 0);
      return { dashboardWidgets: updated };
    });
  },

  reorderWidgets: (startIndex: number, endIndex: number) => {
    set((state) => {
      const result = Array.from(state.dashboardWidgets);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      const updated = result.map((item, index) => ({ ...item, order: index }));
      setTimeout(() => get().recalculateBalances(), 0);
      return { dashboardWidgets: updated };
    });
  },

  moveWidget: (id: DashboardWidgetId, direction: 'up' | 'down') => {
    set((state) => {
      const currentIndex = state.dashboardWidgets.findIndex((w) => w.id === id);
      if (currentIndex === -1) return {};
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= state.dashboardWidgets.length) return {};

      const result = Array.from(state.dashboardWidgets);
      const [moved] = result.splice(currentIndex, 1);
      result.splice(targetIndex, 0, moved);
      const updated = result.map((item, index) => ({ ...item, order: index }));
      setTimeout(() => get().recalculateBalances(), 0);
      return { dashboardWidgets: updated };
    });
  },

  applyDashboardPreset: (preset: DashboardLayoutPreset) => {
    set((state) => {
      let updated: DashboardWidgetConfig[] = [];
      if (preset === 'default') {
        updated = initialDashboardWidgets.map((w, idx) => ({ ...w, order: idx }));
      } else if (preset === 'budget_focus') {
        // Foco em Orçamento: Net worth, budget health, category expenses, recent transactions, cash flow
        const activeIds: DashboardWidgetId[] = [
          'net_worth_summary',
          'monthly_budget_health',
          'category_expenses',
          'recent_transactions',
          'cash_flow_summary',
        ];
        updated = state.dashboardWidgets.map((w) => {
          const isAct = activeIds.includes(w.id);
          const orderIdx = activeIds.indexOf(w.id);
          return {
            ...w,
            visible: isAct,
            order: isAct ? orderIdx : 99,
          };
        }).sort((a, b) => a.order - b.order).map((w, idx) => ({ ...w, order: idx }));
      } else if (preset === 'minimalist') {
        // Minimalista: Net worth + Recent transactions
        const activeIds: DashboardWidgetId[] = ['net_worth_summary', 'recent_transactions'];
        updated = state.dashboardWidgets.map((w) => {
          const isAct = activeIds.includes(w.id);
          const orderIdx = activeIds.indexOf(w.id);
          return {
            ...w,
            visible: isAct,
            order: isAct ? orderIdx : 99,
          };
        }).sort((a, b) => a.order - b.order).map((w, idx) => ({ ...w, order: idx }));
      } else if (preset === 'multi_currency') {
        // Multi-Moedas: Net worth + Currency rates + Recent transactions + Quick actions
        const activeIds: DashboardWidgetId[] = [
          'net_worth_summary',
          'currency_rates',
          'recent_transactions',
          'quick_actions',
        ];
        updated = state.dashboardWidgets.map((w) => {
          const isAct = activeIds.includes(w.id);
          const orderIdx = activeIds.indexOf(w.id);
          return {
            ...w,
            visible: isAct,
            order: isAct ? orderIdx : 99,
          };
        }).sort((a, b) => a.order - b.order).map((w, idx) => ({ ...w, order: idx }));
      }
      get().addToast(`Layout "${preset}" aplicado com sucesso!`, 'success');
      setTimeout(() => get().recalculateBalances(), 0);
      return { dashboardWidgets: updated };
    });
  },

  resetDashboardWidgets: () => {
    set(() => {
      get().addToast('Layout do Dashboard redefinido para o padrão', 'info');
      setTimeout(() => get().recalculateBalances(), 0);
      return { dashboardWidgets: initialDashboardWidgets.map((w, idx) => ({ ...w, order: idx })) };
    });
  },

  // --- Módulo de Bancos, Open Finance e Catalogação Automática ---

  linkNewBankConnection: (connectionData, options) => {
    const connId = `conn-${Date.now()}`;
    const newAccounts: Account[] = [];
    const accountIds: string[] = [];

    // Se solicitado, criar automaticamente as contas no sistema
    if (options?.createCheckingAccount) {
      const chkId = `acc-${Date.now()}-chk`;
      accountIds.push(chkId);
      newAccounts.push({
        id: chkId,
        name: options.checkingName || `${connectionData.institutionName} - Conta Corrente`,
        type: 'checking',
        initialBalance: 2500.0,
        currentBalance: 2500.0,
        currencyCode: 'BRL',
        color: connectionData.color || '#3b82f6',
        icon: 'Landmark',
        notes: 'Conta vinculada via Open Finance',
        isBankLinked: true,
        bankConnectionId: connId,
        bankProvider: connectionData.institutionId,
        cardLast4: '3819',
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'connected',
      });
    }

    if (options?.createCreditCard) {
      const ccId = `acc-${Date.now()}-cc`;
      accountIds.push(ccId);
      newAccounts.push({
        id: ccId,
        name: options.creditCardName || `${connectionData.institutionName} - Cartão de Crédito`,
        type: 'credit_card',
        initialBalance: -850.0,
        currentBalance: -850.0,
        currencyCode: 'BRL',
        color: connectionData.color || '#8b5cf6',
        icon: 'CreditCard',
        notes: 'Cartão de crédito sincronizado em tempo real',
        isBankLinked: true,
        bankConnectionId: connId,
        bankProvider: connectionData.institutionId,
        creditLimit: options.creditLimit || 15000.0,
        creditUsed: 850.0,
        cardClosingDay: 20,
        cardDueDay: 28,
        cardLast4: '9041',
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'connected',
      });
    }

    const finalAccountIds = [...(connectionData.accountIds || []), ...accountIds];

    const fullConnection: BankConnection = {
      ...connectionData,
      id: connId,
      accountIds: finalAccountIds,
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      status: 'connected',
      detectedRecurringCount: 3,
      syncedTransactionsCount: 15,
    };

    set((state) => ({
      bankConnections: [fullConnection, ...state.bankConnections],
      accounts: newAccounts.length > 0 ? [...state.accounts, ...newAccounts] : state.accounts,
      isLinkBankModalOpen: false,
    }));

    get().addToast(`Instituição "${connectionData.institutionName}" vinculada com sucesso!`, 'success');

    // Simular importação inicial das primeiras transações
    if (finalAccountIds.length > 0) {
      setTimeout(() => {
        get().syncBankConnection(connId);
      }, 600);
    } else {
      setTimeout(() => get().recalculateBalances(), 0);
    }
  },

  unlinkBankConnection: (connectionId) => {
    set((state) => {
      const conn = state.bankConnections.find((c) => c.id === connectionId);
      const connName = conn?.institutionName || 'Instituição';

      const updatedAccounts = state.accounts.map((acc) =>
        acc.bankConnectionId === connectionId
          ? { ...acc, isBankLinked: false, syncStatus: 'disconnected' as const }
          : acc
      );

      const updatedConns = state.bankConnections.filter((c) => c.id !== connectionId);

      get().addToast(`Conexão com ${connName} desvinculada.`, 'info');
      setTimeout(() => get().recalculateBalances(), 0);

      return {
        bankConnections: updatedConns,
        accounts: updatedAccounts,
      };
    });
  },

  syncBankConnection: async (connectionId) => {
    const state = get();
    const conn = state.bankConnections.find((c) => c.id === connectionId);
    if (!conn) return { newTransactionsCount: 0 };

    set({ isSyncingBanks: true });

    // Atualizar status da conexão para sincronizando
    set((s) => ({
      bankConnections: s.bankConnections.map((c) =>
        c.id === connectionId ? { ...c, status: 'syncing' as const } : c
      ),
    }));

    // Simulação assíncrona do protocolo Open Finance (OAuth / mTLS)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Contas vinculadas a este banco
    const targetAccountIds = conn.accountIds.length > 0
      ? conn.accountIds
      : state.accounts.filter((a) => a.bankConnectionId === connectionId).map((a) => a.id);

    const mainAccId = targetAccountIds[0] || state.accounts[0]?.id || 'acc-2';
    const mainAcc = state.accounts.find((a) => a.id === mainAccId);
    const currency = mainAcc?.currencyCode || 'BRL';

    // Gerar novas transações simuladas autênticas com auto-catalogação
    const generated = generateMockBankSyncTransactions(mainAccId, currency, state.autoCategorizationRules);

    // Filtrar apenas transações que ainda não existem
    const existingSignatures = new Set(
      state.transactions.map((t) => `${t.date}-${t.payee}-${t.amount}`)
    );

    const freshTransactions = generated.filter(
      (g) => !existingSignatures.has(`${g.date}-${g.payee}-${g.amount}`)
    );

    const autoCatCount = freshTransactions.filter((t) => t.isAutoCategorized).length;
    const recurringCount = freshTransactions.filter((t) => t.isRecurring).length;

    set((s) => {
      const nowIso = new Date().toISOString();
      const updatedConns = s.bankConnections.map((c) =>
        c.id === connectionId
          ? {
              ...c,
              status: 'connected' as const,
              lastSyncAt: nowIso,
              syncedTransactionsCount: (c.syncedTransactionsCount || 0) + freshTransactions.length,
              detectedRecurringCount: (c.detectedRecurringCount || 0) + recurringCount,
            }
          : c
      );

      const updatedAccounts = s.accounts.map((acc) =>
        targetAccountIds.includes(acc.id)
          ? { ...acc, lastSyncedAt: nowIso, syncStatus: 'connected' as const }
          : acc
      );

      return {
        transactions: [...freshTransactions, ...s.transactions],
        bankConnections: updatedConns,
        accounts: updatedAccounts,
        isSyncingBanks: false,
      };
    });

    if (freshTransactions.length > 0) {
      get().addToast(
        `${conn.institutionName}: ${freshTransactions.length} gastos sincronizados (${autoCatCount} catalogados automaticamente)!`,
        'success'
      );
    } else {
      get().addToast(`${conn.institutionName}: Tudo em dia! Nenhuma transação pendente.`, 'info');
    }

    setTimeout(() => get().recalculateBalances(), 0);
    return { newTransactionsCount: freshTransactions.length };
  },

  syncAllBankConnections: async () => {
    const state = get();
    if (state.bankConnections.length === 0) {
      get().addToast('Nenhum banco ou cartão vinculado para sincronizar.', 'info');
      return;
    }

    set({ isSyncingBanks: true });
    get().addToast('Sincronizando todas as contas bancárias e faturas via Open Finance...', 'info');

    let totalNew = 0;
    for (const conn of state.bankConnections) {
      const res = await get().syncBankConnection(conn.id);
      totalNew += res.newTransactionsCount;
    }

    set({ isSyncingBanks: false });
    get().addToast(`Sincronização global concluída! ${totalNew} novos gastos catalogados.`, 'success');
  },

  importStatementTransactions: (accountId, rawText, format) => {
    const state = get();
    const account = state.accounts.find((a) => a.id === accountId);
    const currency = account?.currencyCode || 'BRL';

    let parsedItems;
    if (format === 'ofx') {
      parsedItems = parseOFX(rawText, state.autoCategorizationRules);
    } else if (format === 'csv') {
      parsedItems = parseCSV(rawText, state.autoCategorizationRules);
    } else {
      parsedItems = parsePlainText(rawText, state.autoCategorizationRules);
    }

    if (parsedItems.length === 0) {
      get().addToast('Nenhuma transação identificada no conteúdo informado.', 'error');
      return { importedCount: 0, autoCategorizedCount: 0 };
    }

    let autoCatCount = 0;
    const newTxList: Transaction[] = parsedItems.map((item) => {
      if (item.suggestedCategoryId) autoCatCount++;

      return {
        id: `import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: item.date,
        type: item.type,
        amount: item.amount,
        accountId,
        categoryId: item.suggestedCategoryId,
        status: 'cleared',
        payee: item.payee,
        notes: `Importado de extrato (${format.toUpperCase()})`,
        currencyCode: currency,
        paymentMethod: item.suggestedPaymentMethod,
        origin: 'bank_import',
        isAutoCategorized: !!item.suggestedCategoryId,
        autoCategoryRule: item.ruleMatched,
        isRecurring: item.isRecurring,
        recurrenceFrequency: item.isRecurring ? 'monthly' : undefined,
        tags: ['Extrato Bancário', ...(item.isRecurring ? ['Recorrente'] : [])],
        createdAt: new Date().toISOString(),
      };
    });

    set((s) => ({
      transactions: [...newTxList, ...s.transactions],
      isImportStatementModalOpen: false,
      selectedImportAccountId: null,
    }));

    get().addToast(
      `Extrato importado com sucesso: ${newTxList.length} lançamentos (${autoCatCount} catalogados automaticamente)!`,
      'success'
    );

    setTimeout(() => get().recalculateBalances(), 0);
    return { importedCount: newTxList.length, autoCategorizedCount: autoCatCount };
  },

  addAutoCategorizationRule: (ruleData) => {
    const newRule: AutoCategorizationRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
      matchesCount: 0,
    };

    set((state) => ({
      autoCategorizationRules: [newRule, ...state.autoCategorizationRules],
    }));

    get().addToast(`Regra de catalogação "${newRule.name}" criada com sucesso!`, 'success');
    setTimeout(() => get().recalculateBalances(), 0);
  },

  updateAutoCategorizationRule: (id, updates) => {
    set((state) => ({
      autoCategorizationRules: state.autoCategorizationRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
    get().addToast('Regra de catalogação atualizada.', 'info');
    setTimeout(() => get().recalculateBalances(), 0);
  },

  deleteAutoCategorizationRule: (id) => {
    set((state) => ({
      autoCategorizationRules: state.autoCategorizationRules.filter((r) => r.id !== id),
    }));
    get().addToast('Regra de catalogação removida.', 'info');
    setTimeout(() => get().recalculateBalances(), 0);
  },

  reclassifyTransactionCategory: (txId, newCategoryId, createRule = false) => {
    const state = get();
    const tx = state.transactions.find((t) => t.id === txId);
    if (!tx) return;

    const cat = state.categories.find((c) => c.id === newCategoryId);

    set((s) => ({
      transactions: s.transactions.map((t) =>
        t.id === txId
          ? {
              ...t,
              categoryId: newCategoryId,
              isAutoCategorized: false,
              autoCategoryRule: `Reclassificado manualmente para ${cat?.name || 'Categoria'}`,
            }
          : t
      ),
    }));

    if (createRule && tx.payee) {
      const cleanPattern = tx.payee
        .split(/[*0-9-]/)[0]
        .trim()
        .toLowerCase();

      get().addAutoCategorizationRule({
        name: `Sempre categorizar "${cleanPattern || tx.payee}"`,
        pattern: cleanPattern || tx.payee.toLowerCase(),
        matchField: 'payee',
        categoryId: newCategoryId,
        paymentMethod: tx.paymentMethod || 'credit_card',
        isRecurring: tx.isRecurring,
        recurrenceFrequency: tx.recurrenceFrequency,
        isActive: true,
      });
    }

    get().addToast(`Transação reclassificada para "${cat?.name || 'Categoria'}"!`, 'success');
    setTimeout(() => get().recalculateBalances(), 0);
  },

  approveAutoCategorization: (txId) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === txId ? { ...t, isAutoCategorized: true } : t
      ),
    }));
    get().addToast('Catalogação confirmada!', 'success');
  },
}));
