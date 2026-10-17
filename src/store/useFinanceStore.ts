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
} from '../types';
import {
  initialAccounts,
  initialBudgets,
  initialCategories,
  initialCurrencies,
  initialFamilyMembers,
  initialProjects,
  initialTags,
  initialTransactions,
} from '../data/initialData';

const STORAGE_KEY = 'alzex_finance_pro_state_v1';

export type ActiveTab = 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'recurring' | 'architecture';

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
  searchQuery: string;

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
  addProject: (proj: Omit<Project, 'id'>) => void;

  // Utilitários de Dados & SQLite
  generateSqlDump: () => string;
  exportJsonData: () => string;
  importJsonData: (jsonStr: string) => boolean;
  resetToSampleData: () => void;
  recalculateBalances: () => void;
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
  searchQuery: '',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveCurrencyCode: (code) => set({ activeCurrencyCode: code }),
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
      return { transactions: updated };
    });
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

    set((state) => ({
      budgets: isNew ? [...state.budgets, budget] : state.budgets.map((b) => (b.id === bId ? budget : b)),
      isBudgetModalOpen: false,
    }));
  },

  deleteBudget: (id) => {
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
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
    set((state) => ({ categories: [...state.categories, newCat] }));
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
          balance += tx.amount;
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
        })
      );
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
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
      return true;
    } catch (e) {
      console.error('Falha ao importar JSON:', e);
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
  },
}));
