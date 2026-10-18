import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay, formatRelativeDate } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { LinkBankModal } from './LinkBankModal';
import { ImportStatementModal } from './ImportStatementModal';
import { RuleModal } from './RuleModal';
import { AutoCategorizationRule, PaymentMethod, Transaction } from '../../types';
import {
  Landmark,
  CreditCard,
  RefreshCw,
  Sparkles,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRightLeft,
  Sliders,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const BankConnectionsView: React.FC = () => {
  const {
    bankConnections,
    accounts,
    transactions,
    categories,
    autoCategorizationRules,
    isSyncingBanks,
    syncBankConnection,
    syncAllBankConnections,
    unlinkBankConnection,
    openLinkBankModal,
    openImportStatementModal,
    deleteAutoCategorizationRule,
    reclassifyTransactionCategory,
    approveAutoCategorization,
    activeCurrencyCode,
  } = useFinanceStore();

  const [activeSubTab, setActiveSubTab] = useState<
    'all' | 'credit' | 'debit' | 'account_debit' | 'recurring' | 'rules'
  >('all');

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoCategorizationRule | null>(null);
  const [reclassifyingTxId, setReclassifyingTxId] = useState<string | null>(null);

  // Contas vinculadas
  const linkedAccounts = accounts.filter((a) => a.isBankLinked);
  const creditCardAccounts = linkedAccounts.filter((a) => a.type === 'credit_card');
  const checkingAccounts = linkedAccounts.filter((a) => a.type === 'checking');

  // Totais
  const totalCheckingBalance = checkingAccounts.reduce((acc, a) => acc + a.currentBalance, 0);
  const totalCreditLimit = creditCardAccounts.reduce((acc, a) => acc + (a.creditLimit || 0), 0);
  const totalCreditUsed = creditCardAccounts.reduce(
    (acc, a) => acc + Math.abs(a.currentBalance < 0 ? a.currentBalance : a.creditUsed || 0),
    0
  );

  // Transações bancárias sincronizadas ou importadas
  const bankTransactions = transactions.filter(
    (t) =>
      t.origin === 'bank_sync' ||
      t.origin === 'bank_import' ||
      t.isAutoCategorized ||
      t.paymentMethod === 'credit_card' ||
      t.paymentMethod === 'debit_card' ||
      t.paymentMethod === 'account_debit'
  );

  // Filtro por sub-aba
  const filteredTransactions = bankTransactions.filter((t) => {
    if (activeSubTab === 'credit') return t.paymentMethod === 'credit_card';
    if (activeSubTab === 'debit') return t.paymentMethod === 'debit_card';
    if (activeSubTab === 'account_debit') return t.paymentMethod === 'account_debit';
    if (activeSubTab === 'recurring') return t.isRecurring;
    return true;
  });

  const autoCategorizedCount = transactions.filter((t) => t.isAutoCategorized).length;
  const recurringExpenses = transactions.filter((t) => t.isRecurring && t.type === 'expense');

  const handleOpenEditRule = (rule: AutoCategorizationRule) => {
    setEditingRule(rule);
    setIsRuleModalOpen(true);
  };

  const handleOpenNewRule = () => {
    setEditingRule(null);
    setIsRuleModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950">
      {/* 1. Header do Módulo Bancário */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-100">Bancos & Open Finance</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {bankConnections.length} Conexões Ativas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vincule suas contas bancárias para gerenciar e catalogar automaticamente gastos com cartões,
            débitos em conta e assinaturas recorrentes.
          </p>
        </div>

        {/* Ações Globais */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => syncAllBankConnections()}
            disabled={isSyncingBanks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBanks ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncingBanks ? 'Sincronizando...' : 'Sincronizar Tudo'}</span>
          </button>

          <button
            onClick={() => openImportStatementModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
            <span>Importar Extrato</span>
          </button>

          <button
            onClick={openLinkBankModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Vincular Conta ou Cartão</span>
          </button>
        </div>
      </div>

      {/* 2. Cartões de Resumo e Métricas Financeiras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Contas Correntes */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Saldo Contas Conectadas</span>
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">
            {formatCurrency(totalCheckingBalance, activeCurrencyCode)}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> {checkingAccounts.length} contas correntes ativas
          </span>
        </div>

        {/* Fatura e Limite de Cartões */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Faturas de Cartões</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-rose-400 font-mono">
            {formatCurrency(totalCreditUsed, activeCurrencyCode)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Limite total: {formatCurrency(totalCreditLimit, activeCurrencyCode)}
          </span>
        </div>

        {/* Gastos Catalogados por IA */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Catalogados Automaticamente</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono">{autoCategorizedCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Classificados por regras e IA
          </span>
        </div>

        {/* Gastos Recorrentes & Débito em Conta */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Recorrentes & Débitos</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-sky-400 font-mono">
            {recurringExpenses.length} despesas
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {formatCurrency(
              recurringExpenses.reduce((sum, t) => sum + t.amount, 0),
              activeCurrencyCode
            )}{' '}
            projetados/mês
          </span>
        </div>
      </div>

      {/* 3. Seção de Instituições Vinculadas (Cartões Visuais) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Instituições e Contas Conectadas
          </h2>
          <span className="text-xs text-slate-400">
            Última sincronização geral: há poucos minutos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankConnections.map((conn) => {
            const connAccounts = accounts.filter((a) => conn.accountIds.includes(a.id));
            const isSyncing = conn.status === 'syncing';

            return (
              <div
                key={conn.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Topo do Card da Instituição */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow"
                        style={{ backgroundColor: conn.color }}
                      >
                        {conn.institutionName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">{conn.institutionName}</h3>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Conexão Ativa (Open Finance)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => syncBankConnection(conn.id)}
                      disabled={isSyncing}
                      className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                      title="Sincronizar agora"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                  </div>

                  {/* Detalhes dos Cartões e Contas desta conexão */}
                  <div className="space-y-2 py-2 border-y border-slate-800/80">
                    {conn.cards && conn.cards.length > 0 ? (
                      conn.cards.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-950/60"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-slate-200 font-medium truncate max-w-[150px]">
                              {card.name}
                            </span>
                          </div>
                          <span className="font-mono text-slate-400 text-[11px]">•••• {card.last4}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        {connAccounts.length} conta(s) vinculada(s)
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé com Ações */}
                <div className="flex items-center justify-between pt-3 mt-3 text-[11px] text-slate-400">
                  <span>Sincronizado: {formatRelativeDate(conn.lastSyncAt.split('T')[0])}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openImportStatementModal(conn.accountIds[0])}
                      className="text-sky-400 hover:underline cursor-pointer"
                    >
                      Extrato
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      onClick={() => unlinkBankConnection(conn.id)}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Desvincular
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Abas de Gastos e Catalogação */}
      <div className="space-y-4">
        {/* Navegação entre Sub-abas */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Todos os Gastos Bancários', count: bankTransactions.length },
            {
              id: 'credit',
              label: '💳 Cartão de Crédito',
              count: bankTransactions.filter((t) => t.paymentMethod === 'credit_card').length,
            },
            {
              id: 'debit',
              label: '💳 Cartão de Débito',
              count: bankTransactions.filter((t) => t.paymentMethod === 'debit_card').length,
            },
            {
              id: 'account_debit',
              label: '🏦 Débitos em Conta',
              count: bankTransactions.filter((t) => t.paymentMethod === 'account_debit').length,
            },
            { id: 'recurring', label: '🔄 Assinaturas & Recorrentes', count: recurringExpenses.length },
            { id: 'rules', label: '⚙️ Regras de Catalogação', count: autoCategorizationRules.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Conteúdo da Aba Selecionada */}
        {activeSubTab === 'rules' ? (
          /* Gerenciador de Regras */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Regras Ativas de Catalogação Automática
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quando uma transação importada contém esses termos, ela é classificada e marcada
                  automaticamente.
                </p>
              </div>
              <button
                onClick={handleOpenNewRule}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Regra</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {autoCategorizationRules.map((rule) => {
                const cat = categories.find((c) => c.id === rule.categoryId);
                return (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{rule.name}</span>
                        {rule.isRecurring && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                            Recorrente ({rule.recurrenceFrequency || 'mensal'})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Padrão: <span className="text-amber-300 font-semibold">{rule.pattern}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className="text-slate-400">Atribui:</span>
                        <span className="text-emerald-400 font-medium">
                          {cat?.name || 'Categoria'}
                        </span>
                        {rule.paymentMethod && (
                          <span className="text-slate-500">
                            • {rule.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : rule.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditRule(rule)}
                        className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAutoCategorizationRule(rule.id)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Tabela de Lançamentos Bancários Catalogados */
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Estabelecimento / Histórico</th>
                    <th className="py-2.5 px-3">Canal / Cartão</th>
                    <th className="py-2.5 px-3">Categoria & Catalogação</th>
                    <th className="py-2.5 px-3">Conta Vinculada</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                        Nenhum lançamento identificado nesta categoria. Sincronize suas contas ou
                        importe um extrato bancário.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const category = categories.find((c) => c.id === tx.categoryId);
                      const account = accounts.find((a) => a.id === tx.accountId);

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Data */}
                          <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {formatDateDisplay(tx.date)}
                          </td>

                          {/* Estabelecimento & Descrição */}
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-200">{tx.payee}</span>
                              {tx.notes && (
                                <span className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {tx.notes}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Canal / Método de Pagamento */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {tx.paymentMethod === 'credit_card' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                <CreditCard className="w-3 h-3" />
                                Cartão Crédito {tx.cardLast4 ? `*${tx.cardLast4}` : ''}
                              </span>
                            )}
                            {tx.paymentMethod === 'debit_card' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                <CreditCard className="w-3 h-3" />
                                Cartão Débito {tx.cardLast4 ? `*${tx.cardLast4}` : ''}
                              </span>
                            )}
                            {tx.paymentMethod === 'account_debit' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Landmark className="w-3 h-3" />
                                Débito em Conta (DDA)
                              </span>
                            )}
                            {tx.paymentMethod === 'pix' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                PIX
                              </span>
                            )}
                            {tx.isRecurring && (
                              <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                🔄 Recorrente
                              </span>
                            )}
                          </td>

                          {/* Categoria com Selo Auto */}
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              {category ? (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-4 h-4 rounded flex items-center justify-center text-white"
                                    style={{ backgroundColor: category.color }}
                                  >
                                    <IconRenderer name={category.icon} className="w-2.5 h-2.5" />
                                  </div>
                                  <span className="font-medium text-slate-200">{category.name}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Pendente de Categoria</span>
                              )}

                              {tx.isAutoCategorized && (
                                <span
                                  className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5"
                                  title={tx.autoCategoryRule || 'Catalogado por motor inteligente'}
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Catalogado Automaticamente</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Conta */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                            {account?.name || 'Conta Bancária'}
                          </td>

                          {/* Valor */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                            <span
                              className={
                                tx.type === 'expense'
                                  ? 'text-rose-400'
                                  : tx.type === 'income'
                                  ? 'text-emerald-400'
                                  : 'text-sky-400'
                              }
                            >
                              {tx.type === 'expense' ? '- ' : '+ '}
                              {formatCurrency(tx.amount, tx.currencyCode)}
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {/* Reclassificar / Criar Regra */}
                              <select
                                value={tx.categoryId || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    reclassifyTransactionCategory(tx.id, e.target.value, true);
                                  }
                                }}
                                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                                title="Reclassificar categoria e criar regra"
                              >
                                <option value="" disabled>
                                  Alterar Categoria...
                                </option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modais de Banco, Importação e Regras */}
      <LinkBankModal />
      <ImportStatementModal />
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        initialRule={editingRule}
      />
    </div>
  );
};
