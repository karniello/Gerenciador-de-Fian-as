/**
 * @file src/db/schema.ts
 * @description Schema do Banco de Dados SQLite utilizando Drizzle ORM
 * Inspirado na arquitetura relacional de alta performance do Alzex Finance Pro.
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ----------------------------------------------------
// 1. Tabela de Moedas (Currencies)
// ----------------------------------------------------
export const currencies = sqliteTable('currencies', {
  code: text('code', { length: 3 }).primaryKey(), // ex: 'BRL', 'USD', 'EUR'
  name: text('name').notNull(),
  symbol: text('symbol', { length: 5 }).notNull(),
  rateToBase: real('rate_to_base').notNull().default(1.0), // Cotação em relação à moeda base
  isBase: integer('is_base', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// ----------------------------------------------------
// 2. Tabela de Contas (Accounts)
// ----------------------------------------------------
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['wallet', 'checking', 'credit_card', 'investment', 'savings'] }).notNull(),
  initialBalance: real('initial_balance').notNull().default(0.0),
  currentBalance: real('current_balance').notNull().default(0.0),
  currencyCode: text('currency_code').notNull().references(() => currencies.code),
  color: text('color').notNull().default('#0ea5e9'),
  icon: text('icon').notNull().default('Wallet'),
  notes: text('notes'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  typeIdx: index('idx_accounts_type').on(table.type),
  currencyIdx: index('idx_accounts_currency').on(table.currencyCode),
}));

// ----------------------------------------------------
// 3. Tabela de Categorias e Subcategorias Hierárquicas
// ----------------------------------------------------
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  parentId: text('parent_id'), // Auto-relacionamento para níveis infinitos de subcategorias
  type: text('type', { enum: ['expense', 'income'] }).notNull(),
  icon: text('icon').notNull().default('Folder'),
  color: text('color').notNull().default('#64748b'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  parentIdx: index('idx_categories_parent').on(table.parentId),
  typeIdx: index('idx_categories_type').on(table.type),
}));

// ----------------------------------------------------
// 4. Tabela de Membros da Família (Family Members)
// ----------------------------------------------------
export const familyMembers = sqliteTable('family_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(), // ex: 'Pai', 'Mãe', 'Filho', 'Conjuge'
  avatar: text('avatar').notNull().default('User'),
  color: text('color').notNull().default('#3b82f6'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ----------------------------------------------------
// 5. Tabela de Projetos (Projects)
// ----------------------------------------------------
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#8b5cf6'),
  budgetLimit: real('budget_limit'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ----------------------------------------------------
// 6. Tabela de Tags / Rótulos
// ----------------------------------------------------
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#10b981'),
});

// ----------------------------------------------------
// 7. Tabela Principal de Transações (Transactions)
// ----------------------------------------------------
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // Formato ISO 'YYYY-MM-DD'
  type: text('type', { enum: ['expense', 'income', 'transfer'] }).notNull(),
  amount: real('amount').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  toAccountId: text('to_account_id').references(() => accounts.id), // Para transferências
  categoryId: text('category_id').references(() => categories.id), // Nulo se for split ou transferência
  familyMemberId: text('family_member_id').references(() => familyMembers.id),
  projectId: text('project_id').references(() => projects.id),
  status: text('status', { enum: ['cleared', 'pending', 'void'] }).notNull().default('cleared'),
  payee: text('payee').notNull(), // Beneficiário ou Origem
  notes: text('notes'),
  currencyCode: text('currency_code').notNull().references(() => currencies.code),
  exchangeRate: real('exchange_rate').notNull().default(1.0),
  isSplit: integer('is_split', { mode: 'boolean' }).notNull().default(false),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
  recurrenceRule: text('recurrence_rule'), // ex: 'monthly', 'weekly', etc.
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  dateIdx: index('idx_transactions_date').on(table.date),
  accountIdx: index('idx_transactions_account').on(table.accountId),
  categoryIdx: index('idx_transactions_category').on(table.categoryId),
  memberIdx: index('idx_transactions_member').on(table.familyMemberId),
  projectIdx: index('idx_transactions_project').on(table.projectId),
  typeIdx: index('idx_transactions_type').on(table.type),
}));

// ----------------------------------------------------
// 8. Tabela de Transações Divididas (Transaction Splits)
// Permite ratear 1 despesa em várias categorias e/ou membros da família
// ----------------------------------------------------
export const transactionSplits = sqliteTable('transaction_splits', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  familyMemberId: text('family_member_id').references(() => familyMembers.id),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
}, (table) => ({
  transactionIdx: index('idx_splits_transaction').on(table.transactionId),
  categoryIdx: index('idx_splits_category').on(table.categoryId),
}));

// ----------------------------------------------------
// 9. Associação Muitos-para-Muitos: Transações e Tags
// ----------------------------------------------------
export const transactionTags = sqliteTable('transaction_tags', {
  transactionId: text('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: index('idx_trans_tag_pk').on(table.transactionId, table.tagId),
}));

// ----------------------------------------------------
// 10. Tabela de Orçamentos (Budgets)
// ----------------------------------------------------
export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  period: text('period', { enum: ['monthly', 'yearly'] }).notNull().default('monthly'),
  amount: real('amount').notNull(),
  currencyCode: text('currency_code').notNull().references(() => currencies.code),
  alertThreshold: real('alert_threshold').notNull().default(0.80), // Alerta em 80%
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ----------------------------------------------------
// Relacionamentos Drizzle (Relations) para queries tipadas
// ----------------------------------------------------
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  currency: one(currencies, {
    fields: [accounts.currencyCode],
    references: [currencies.code],
  }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_subcategories',
  }),
  subcategories: many(categories, {
    relationName: 'category_subcategories',
  }),
  transactions: many(transactions),
  splits: many(transactionSplits),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  familyMember: one(familyMembers, {
    fields: [transactions.familyMemberId],
    references: [familyMembers.id],
  }),
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  splits: many(transactionSplits),
  tags: many(transactionTags),
}));

export const transactionSplitsRelations = relations(transactionSplits, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionSplits.transactionId],
    references: [transactions.id],
  }),
  category: one(categories, {
    fields: [transactionSplits.categoryId],
    references: [categories.id],
  }),
  familyMember: one(familyMembers, {
    fields: [transactionSplits.familyMemberId],
    references: [familyMembers.id],
  }),
}));
