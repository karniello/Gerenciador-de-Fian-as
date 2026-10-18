import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay, formatRelativeDate } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  TrendingDown, 
  TrendingUp, 
  ArrowRightLeft, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Ban, 
  Plus, 
  Filter, 
  X,
  FileSpreadsheet,
  Sparkles,
  CreditCard,
  Landmark
} from 'lucide-react';
import { Transaction } from '../../types';

export const TransactionGrid: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    familyMembers,
    projects,
    selectedAccountId,
    selectedFamilyMemberId,
    selectedProjectId,
    setSelectedAccountId,
    setSelectedFamilyMemberId,
    setSelectedProjectId,
    openNewTransactionModal,
    openEditTransactionModal,
    deleteTransaction,
    duplicateTransaction,
    markTransactionAsCleared,
    searchQuery,
    setSearchQuery,
    activeCurrencyCode,
  } = useFinanceStore();

  const [dateFilter, setDateFilter] = useState<'this_month' | 'last_month' | 'this_year' | 'all'>('this_month');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedSplits, setExpandedSplits] = useState<Record<string, boolean>>({});

  const toggleSplitExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSplits((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtragem de Transações
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const filteredTransactions = transactions.filter((t) => {
    // Filtro de Conta
    if (selectedAccountId && t.accountId !== selectedAccountId && t.toAccountId !== selectedAccountId) {
      return false;
    }

    // Filtro de Membro da Família
    if (selectedFamilyMemberId && t.familyMemberId !== selectedFamilyMemberId) {
      // Se for split, verificar se algum split pertence ao membro
      const hasMemberSplit = t.splits?.some((s) => s.familyMemberId === selectedFamilyMemberId);
      if (!hasMemberSplit) return false;
    }

    // Filtro de Projeto
    if (selectedProjectId && t.projectId !== selectedProjectId) {
      return false;
    }

    // Filtro de Tipo
    if (typeFilter !== 'all' && t.type !== typeFilter) {
      return false;
    }

    // Filtro de Período
    const [tYear, tMonth] = t.date.split('-').map(Number);
    if (dateFilter === 'this_month') {
      if (tYear !== currentYear || tMonth !== currentMonth) return false;
    } else if (dateFilter === 'last_month') {
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      if (tYear !== lastMonthYear || tMonth !== lastMonth) return false;
    } else if (dateFilter === 'this_year') {
      if (tYear !== currentYear) return false;
    }

    // Filtro de Busca de Texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPayee = t.payee?.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchAmount = t.amount.toString().includes(q);
      const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!matchPayee && !matchNotes && !matchAmount && !matchTags) return false;
    }

    return true;
  });

  // Totais do Filtro
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income' && t.status !== 'void')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense' && t.status !== 'void')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const selectedMember = familyMembers.find((m) => m.id === selectedFamilyMemberId);
  const selectedProj = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Barra de Filtros e Controles Superiores */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Filtros de Período & Tipo */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
            <button
              onClick={() => setDateFilter('this_month')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                dateFilter === 'this_month' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setDateFilter('last_month')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                dateFilter === 'last_month' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mês Passado
            </button>
            <button
              onClick={() => setDateFilter('this_year')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                dateFilter === 'this_year' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ano Atual
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                dateFilter === 'all' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas
            </button>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
                typeFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
                typeFilter === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
                typeFilter === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
              }`}
            >
              Receitas
            </button>
            <button
              onClick={() => setTypeFilter('transfer')}
              className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer ${
                typeFilter === 'transfer' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
              }`}
            >
              Transferências
            </button>
          </div>

          {/* Chips de Filtros Ativos da Barra Lateral */}
          {(selectedAccount || selectedMember || selectedProj) && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              {selectedAccount && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-emerald-400 border border-slate-700">
                  Conta: {selectedAccount.name}
                  <button onClick={() => setSelectedAccountId(null)} className="hover:text-rose-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedMember && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-sky-400 border border-slate-700">
                  Membro: {selectedMember.name}
                  <button onClick={() => setSelectedFamilyMemberId(null)} className="hover:text-rose-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedProj && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-purple-400 border border-slate-700">
                  Projeto: {selectedProj.name}
                  <button onClick={() => setSelectedProjectId(null)} className="hover:text-rose-400 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Botão de Ação Rápida */}
        <button
          onClick={() => openNewTransactionModal()}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Transação</span>
        </button>
      </div>

      {/* Grid de Transações Estilo Alzex Desktop */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs select-none">
          <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider backdrop-blur-md">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">Tipo</th>
              <th className="py-2.5 px-3 w-28">Data</th>
              <th className="py-2.5 px-3">Beneficiário / Detalhes</th>
              <th className="py-2.5 px-3">Categoria</th>
              <th className="py-2.5 px-3">Conta</th>
              <th className="py-2.5 px-3">Membro</th>
              <th className="py-2.5 px-3 text-center w-24">Status</th>
              <th className="py-2.5 px-3 text-right w-32">Valor</th>
              <th className="py-2.5 px-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">Nenhuma transação encontrada</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Ajuste os filtros de data e contas acima ou adicione uma nova transação clicando em "+ Lançar Transação".
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const account = accounts.find((a) => a.id === tx.accountId);
                const toAccount = accounts.find((a) => a.id === tx.toAccountId);
                const category = categories.find((c) => c.id === tx.categoryId);
                const member = familyMembers.find((m) => m.id === tx.familyMemberId);
                const project = projects.find((p) => p.id === tx.projectId);
                const isExpanded = expandedSplits[tx.id];

                return (
                  <React.Fragment key={tx.id}>
                    <tr
                      onClick={() => openEditTransactionModal(tx)}
                      className={`hover:bg-slate-900/80 transition-colors cursor-pointer group ${
                        tx.status === 'void' ? 'opacity-40 line-through' : ''
                      }`}
                    >
                      {/* Tipo Icon */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center">
                          {tx.type === 'expense' && (
                            <span className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
                              <TrendingDown className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {tx.type === 'income' && (
                            <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {tx.type === 'transfer' && (
                            <span className="w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 flex items-center justify-center">
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Data */}
                      <td className="py-2 px-3 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDateDisplay(tx.date)}</span>
                          <span className="text-[10px] text-slate-400">{formatRelativeDate(tx.date)}</span>
                        </div>
                      </td>

                      {/* Beneficiário & Detalhes */}
                      <td className="py-2 px-3">
                        <div className="flex flex-col max-w-xs md:max-w-md">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-100 truncate">{tx.payee}</span>

                            {/* Canal / Método de Pagamento */}
                            {tx.paymentMethod === 'credit_card' && (
                              <span className="text-[9px] font-semibold bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30 flex items-center gap-0.5">
                                <CreditCard className="w-2.5 h-2.5" />
                                Crédito{tx.cardLast4 ? ` *${tx.cardLast4}` : ''}
                              </span>
                            )}
                            {tx.paymentMethod === 'debit_card' && (
                              <span className="text-[9px] font-semibold bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded border border-sky-500/30 flex items-center gap-0.5">
                                <CreditCard className="w-2.5 h-2.5" />
                                Débito
                              </span>
                            )}
                            {tx.paymentMethod === 'account_debit' && (
                              <span className="text-[9px] font-semibold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                                <Landmark className="w-2.5 h-2.5" />
                                Débito em Conta
                              </span>
                            )}
                            {tx.isRecurring && (
                              <span className="text-[9px] font-semibold bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/30">
                                🔄 Recorrente
                              </span>
                            )}

                            {tx.isSplit && (
                              <button
                                onClick={(e) => toggleSplitExpand(tx.id, e)}
                                className="flex items-center gap-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/30 transition-colors cursor-pointer"
                                title="Ver divisão em categorias"
                              >
                                <Layers className="w-2.5 h-2.5" />
                                <span>{tx.splits?.length || 2} splits</span>
                                {isExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                              </button>
                            )}
                          </div>
                          {tx.notes && <span className="text-[11px] text-slate-400 truncate">{tx.notes}</span>}
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {tx.tags.map((tag) => (
                                <span key={tag} className="text-[9px] text-slate-400 font-mono bg-slate-900 px-1 py-0.2 rounded border border-slate-800">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-2 px-3">
                        {tx.type === 'transfer' ? (
                          <span className="text-slate-400 italic">Transferência</span>
                        ) : tx.isSplit ? (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Múltiplas Categorias
                          </span>
                        ) : category ? (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center text-white"
                              style={{ backgroundColor: category.color }}
                            >
                              <IconRenderer name={category.icon} className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-slate-200">{category.name}</span>
                                {tx.isAutoCategorized && (
                                  <span title={tx.autoCategoryRule || 'Catalogado Automaticamente'}>
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Sem Categoria</span>
                        )}
                      </td>

                      {/* Conta */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {tx.type === 'transfer' ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-300 font-medium">{account?.name}</span>
                            <ArrowRightLeft className="w-3 h-3 text-sky-400" />
                            <span className="text-slate-300 font-medium">{toAccount?.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: account?.color || '#94a3b8' }}
                            />
                            <span className="text-slate-300">{account?.name || 'Conta'}</span>
                          </div>
                        )}
                      </td>

                      {/* Membro & Projeto */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          {member && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ backgroundColor: member.color }}
                              >
                                {member.name.charAt(0)}
                              </div>
                              <span className="text-slate-300 text-[11px]">{member.name}</span>
                            </div>
                          )}
                          {project && (
                            <span className="text-[10px] text-purple-400 font-medium flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                              {project.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        {tx.status === 'cleared' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Liquidada
                          </span>
                        )}
                        {tx.status === 'pending' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markTransactionAsCleared(tx.id);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 hover:bg-emerald-500/20 text-amber-300 hover:text-emerald-300 border border-amber-500/30 hover:border-emerald-500/30 transition-all cursor-pointer"
                            title="Clique para liquidar / marcar como compensada"
                          >
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            Pendente (Pagar)
                          </button>
                        )}
                        {tx.status === 'void' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <Ban className="w-2.5 h-2.5" />
                            Cancelada
                          </span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-sm">
                        <span
                          className={
                            tx.type === 'expense'
                              ? 'text-rose-400'
                              : tx.type === 'income'
                              ? 'text-emerald-400'
                              : 'text-sky-400'
                          }
                        >
                          {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                          {formatCurrency(tx.amount, tx.currencyCode || activeCurrencyCode)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {tx.status === 'pending' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markTransactionAsCleared(tx.id);
                              }}
                              className="p-1 text-amber-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                              title="Liquidar e Compensar Transação"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditTransactionModal(tx);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                            title="Editar Transação"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateTransaction(tx.id);
                            }}
                            className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                            title="Duplicar Transação"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Deseja excluir a transação "${tx.payee}"?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Excluir Transação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Sub-linhas de Transação Dividida (Split Subrows) */}
                    {tx.isSplit && isExpanded && tx.splits && (
                      <tr className="bg-slate-900/40">
                        <td colSpan={9} className="py-2 px-8">
                          <div className="bg-slate-950/80 border border-amber-500/20 rounded-lg p-2.5 space-y-1.5 ml-6 shadow-inner">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 mb-1 flex items-center gap-1.5">
                              <Layers className="w-3 h-3" />
                              Detalhamento do Rateio de Categorias (Splits):
                            </div>
                            {tx.splits.map((s, idx) => {
                              const splitCat = categories.find((c) => c.id === s.categoryId);
                              const splitMem = familyMembers.find((m) => m.id === s.familyMemberId);
                              return (
                                <div
                                  key={s.id || idx}
                                  className="flex items-center justify-between text-xs py-1 px-2 bg-slate-900/60 rounded border border-slate-800/80"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px]"
                                      style={{ backgroundColor: splitCat?.color || '#64748b' }}
                                    >
                                      <IconRenderer name={splitCat?.icon || 'Folder'} className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="font-medium text-slate-200">
                                      {splitCat?.name || 'Categoria'}
                                    </span>
                                    {s.notes && (
                                      <span className="text-[11px] text-slate-400 italic">
                                        - {s.notes}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4">
                                    {splitMem && (
                                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: splitMem.color }}
                                        />
                                        {splitMem.name}
                                      </span>
                                    )}
                                    <span className="font-mono font-bold text-rose-400">
                                      -{formatCurrency(s.amount, tx.currencyCode || activeCurrencyCode)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Faixa Inferior de Resumo Financeiro (Alzex Style) */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Registros:</span>
            <span className="text-slate-100 font-bold">{filteredTransactions.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Receitas:</span>
            <span className="text-emerald-400 font-bold">
              +{formatCurrency(totalIncome, activeCurrencyCode)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Despesas:</span>
            <span className="text-rose-400 font-bold">
              -{formatCurrency(totalExpense, activeCurrencyCode)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
          <span className="text-slate-300 font-sans font-semibold">Resultado Líquido:</span>
          <span className={`font-bold ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netBalance, activeCurrencyCode)}
          </span>
        </div>
      </div>
    </div>
  );
};
