/**
 * @file src/components/transactions/TransactionModal.tsx
 * @description Componente Central de Transação com suporte a:
 * - Tipo (Despesa, Receita, Transferência)
 * - Autocomplete de Beneficiário (Payee)
 * - Transação Dividida (Split Transaction) com cálculo dinâmico de saldo restante
 * - Atribuição por Membro da Família e Projeto
 */

import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { 
  TransactionType, 
  TransactionStatus, 
  TransactionSplit, 
  RecurrenceFrequency,
  PaymentMethod,
} from '../../types';
import { 
  X, 
  Plus, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  Ban, 
  Layers, 
  User, 
  Tag as TagIcon,
  CreditCard,
  Landmark,
  Sparkles,
  Calendar,
  Coins,
  Globe,
  Calculator
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const TransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    editingTransaction,
    closeTransactionModal,
    saveTransaction,
    accounts,
    categories,
    familyMembers,
    projects,
    tags,
    transactions,
    currencies,
    activeCurrencyCode,
  } = useFinanceStore();

  // Estados do Formulário
  const [type, setType] = useState<TransactionType>(editingTransaction?.type || 'expense');
  const [amount, setAmount] = useState<number>(editingTransaction?.amount || 0);
  const [targetAmount, setTargetAmount] = useState<number>(editingTransaction?.targetAmount || 0);
  const [exchangeRate, setExchangeRate] = useState<number>(editingTransaction?.exchangeRate || 1);
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);
  const [date, setDate] = useState<string>(editingTransaction?.date || new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>(editingTransaction?.accountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(editingTransaction?.toAccountId || accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState<string>(editingTransaction?.categoryId || categories[0]?.id || '');
  const [familyMemberId, setFamilyMemberId] = useState<string>(editingTransaction?.familyMemberId || familyMembers[0]?.id || '');
  const [projectId, setProjectId] = useState<string>(editingTransaction?.projectId || '');
  const [status, setStatus] = useState<TransactionStatus>(editingTransaction?.status || 'cleared');
  const [payee, setPayee] = useState<string>(editingTransaction?.payee || '');
  const [notes, setNotes] = useState<string>(editingTransaction?.notes || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(editingTransaction?.tags || []);
  
  // Split Transaction State
  const [isSplit, setIsSplit] = useState<boolean>(editingTransaction?.isSplit || false);
  const [splits, setSplits] = useState<TransactionSplit[]>(
    editingTransaction?.splits || [
      { id: 'sp-1', categoryId: categories[0]?.id || '', amount: 0, familyMemberId: familyMembers[0]?.id },
    ]
  );

  // Recorrência
  const [isRecurring, setIsRecurring] = useState<boolean>(editingTransaction?.isRecurring || false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    editingTransaction?.recurrenceFrequency || 'monthly'
  );

  // Autocomplete de Payee baseado no histórico existente
  const [payeeSuggestions, setPayeeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount);
      setDate(editingTransaction.date);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || accounts[1]?.id || '');
      setCategoryId(editingTransaction.categoryId || categories[0]?.id || '');
      setFamilyMemberId(editingTransaction.familyMemberId || familyMembers[0]?.id || '');
      setProjectId(editingTransaction.projectId || '');
      setStatus(editingTransaction.status);
      setPayee(editingTransaction.payee);
      setNotes(editingTransaction.notes || '');
      setSelectedTags(editingTransaction.tags || []);
      setIsSplit(editingTransaction.isSplit || false);
      setSplits(editingTransaction.splits && editingTransaction.splits.length > 0 ? editingTransaction.splits : [
        { id: 'sp-1', categoryId: categories[0]?.id || '', amount: editingTransaction.amount, familyMemberId: editingTransaction.familyMemberId }
      ]);
      setIsRecurring(editingTransaction.isRecurring || false);
      setRecurrenceFrequency(editingTransaction.recurrenceFrequency || 'monthly');
      if (editingTransaction.targetAmount) {
        setTargetAmount(editingTransaction.targetAmount);
        setIsCustomRate(true);
      }
      if (editingTransaction.exchangeRate) {
        setExchangeRate(editingTransaction.exchangeRate);
      }
    }
  }, [editingTransaction]);

  const sourceAccount = accounts.find((a) => a.id === accountId);
  const targetAccount = accounts.find((a) => a.id === toAccountId);
  const isCrossCurrency = type === 'transfer' && !!sourceAccount && !!targetAccount && sourceAccount.currencyCode !== targetAccount.currencyCode;

  const srcCurrency = currencies.find((c) => c.code === sourceAccount?.currencyCode) || currencies[0];
  const destCurrency = currencies.find((c) => c.code === targetAccount?.currencyCode) || currencies[0];
  const standardRate = ((srcCurrency?.rateToBase || 1.0) / (destCurrency?.rateToBase || 1.0));

  useEffect(() => {
    if (isCrossCurrency && !isCustomRate) {
      setExchangeRate(standardRate);
      setTargetAmount(Math.round(amount * standardRate * 100) / 100);
    }
  }, [amount, accountId, toAccountId, isCrossCurrency, standardRate, isCustomRate]);

  // Histórico único de beneficiários para autocomplete
  const uniquePayees = Array.from(new Set(transactions.map((t) => t.payee).filter(Boolean)));

  const handlePayeeChange = (value: string) => {
    setPayee(value);
    if (value.trim().length > 0) {
      const filtered = uniquePayees.filter((p) => p.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
      setPayeeSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectPayeeSuggestion = (selected: string) => {
    setPayee(selected);
    setShowSuggestions(false);

    // Auto-preencher categoria recente para este payee se for nova transação
    if (!editingTransaction) {
      const pastTx = transactions.find((t) => t.payee.toLowerCase() === selected.toLowerCase());
      if (pastTx) {
        if (pastTx.categoryId) setCategoryId(pastTx.categoryId);
        if (pastTx.familyMemberId) setFamilyMemberId(pastTx.familyMemberId);
        if (pastTx.type) setType(pastTx.type);
      }
    }
  };

  // Cálculo de Splits
  const totalSplitsAmount = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const remainingSplitAmount = Math.round((amount - totalSplitsAmount) * 100) / 100;

  const handleAddSplitRow = () => {
    setSplits([
      ...splits,
      {
        id: `sp-${Date.now()}`,
        categoryId: categories[0]?.id || '',
        amount: remainingSplitAmount > 0 ? remainingSplitAmount : 0,
        familyMemberId: familyMemberId || familyMembers[0]?.id,
        notes: '',
      },
    ]);
  };

  const handleRemoveSplitRow = (index: number) => {
    const updated = splits.filter((_, i) => i !== index);
    setSplits(updated);
  };

  const handleUpdateSplit = (index: number, field: keyof TransactionSplit, value: any) => {
    const updated = [...splits];
    updated[index] = { ...updated[index], [field]: value };
    setSplits(updated);
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!payee.trim()) {
      alert('Por favor, informe o beneficiário/pagador da transação.');
      return;
    }

    if (amount <= 0) {
      alert('O valor da transação deve ser maior que zero.');
      return;
    }

    if (isSplit && remainingSplitAmount !== 0) {
      alert(`A soma dos itens divididos (${formatCurrency(totalSplitsAmount)}) deve ser exatamente igual ao valor total (${formatCurrency(amount)}). Diferença: ${formatCurrency(remainingSplitAmount)}.`);
      return;
    }

    const currentAccount = accounts.find((a) => a.id === accountId);

    saveTransaction({
      id: editingTransaction?.id,
      type,
      amount: Number(amount),
      targetAmount: isCrossCurrency ? Number(targetAmount) : undefined,
      exchangeRate: isCrossCurrency ? Number(exchangeRate) : undefined,
      date,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      categoryId: type === 'transfer' ? undefined : isSplit ? undefined : categoryId,
      familyMemberId,
      projectId: projectId || undefined,
      status,
      payee: payee.trim(),
      notes: notes.trim(),
      currencyCode: currentAccount?.currencyCode || activeCurrencyCode,
      isSplit,
      splits: isSplit ? splits : undefined,
      tags: selectedTags,
      isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
    });
  };

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  if (!isTransactionModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              type === 'expense' ? 'bg-rose-500/20 text-rose-400' :
              type === 'income' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-sky-500/20 text-sky-400'
            }`}>
              {type === 'expense' && <TrendingDown className="w-5 h-5" />}
              {type === 'income' && <TrendingUp className="w-5 h-5" />}
              {type === 'transfer' && <ArrowRightLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {editingTransaction ? `ID: ${editingTransaction.id}` : 'Inserção rápida no banco SQLite'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTransactionModal}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas de Tipo (Despesa, Receita, Transferência) */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 gap-1">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Receita
          </button>
          <button
            type="button"
            onClick={() => {
              setType('transfer');
              setIsSplit(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'transfer'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transferência
          </button>
        </div>

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Linha 1: Valor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Valor ({activeCurrencyCode}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">
                  {activeCurrencyCode === 'USD' ? 'US$' : activeCurrencyCode === 'EUR' ? '€' : 'R$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-base font-bold rounded-lg pl-12 pr-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Data da Transação *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Linha 2: Contas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {type === 'transfer' ? 'Conta de Origem *' : 'Conta Debitada/Creditada *'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.currentBalance, acc.currencyCode)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Conta de Destino *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.currentBalance, acc.currencyCode)})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Categoria {isSplit && '(Rateado nos Splits)'}
                  </label>
                  {type === 'expense' && (
                    <button
                      type="button"
                      onClick={() => setIsSplit(!isSplit)}
                      className={`text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        isSplit ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      {isSplit ? 'Desativar Split' : '+ Dividir em Categorias (Split)'}
                    </button>
                  )}
                </div>

                {!isSplit ? (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parentId ? `↳ ${cat.name}` : cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 flex items-center justify-between">
                    <span>Modo Transação Dividida Ativado</span>
                    <span className="font-mono font-bold">
                      {splits.length} itens rateados
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PAINEL DE CONVERSÃO DE CÂMBIO MULTI-MOEDA */}
          {type === 'transfer' && isCrossCurrency && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-950/80 to-sky-950/40 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Conversão de Câmbio entre Contas</span>
                </div>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-mono font-medium">
                  1 {sourceAccount?.currencyCode} = {exchangeRate.toFixed(4)} {targetAccount?.currencyCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Débito na Origem ({sourceAccount?.currencyCode})
                  </label>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-rose-300 flex items-center justify-between">
                    <span>-{formatCurrency(amount, sourceAccount?.currencyCode)}</span>
                    <span className="text-[10px] text-slate-500">{sourceAccount?.name}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-slate-300">
                      Crédito no Destino ({targetAccount?.currencyCode}) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomRate(!isCustomRate)}
                      className="text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1"
                    >
                      <Calculator className="w-3 h-3" />
                      {isCustomRate ? 'Usar Taxa Padrão' : 'Personalizar Taxa'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={targetAmount || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setTargetAmount(val);
                        setIsCustomRate(true);
                        if (amount > 0) {
                          setExchangeRate(val / amount);
                        }
                      }}
                      className="w-full bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
                <span>Taxa Efetiva: 1 {targetAccount?.currencyCode} = {(exchangeRate > 0 ? 1 / exchangeRate : 0).toFixed(4)} {sourceAccount?.currencyCode}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Saldo atualizado nas duas moedas
                </span>
              </div>
            </div>
          )}

          {/* SEÇÃO SPLIT TRANSACTIONS (DIVISÃO DE ITENS) */}
          {isSplit && type === 'expense' && (
            <div className="p-3 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">Rateio por Categoria / Membro</span>
                </div>
                <div className="text-xs font-mono">
                  <span className="text-slate-400">Restante: </span>
                  <span className={`font-bold ${remainingSplitAmount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(remainingSplitAmount, activeCurrencyCode)}
                  </span>
                </div>
              </div>

              {/* Tabela de Splits */}
              <div className="space-y-2">
                {splits.map((split, idx) => (
                  <div key={split.id || idx} className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <div className="flex-1 min-w-[140px]">
                      <select
                        value={split.categoryId}
                        onChange={(e) => handleUpdateSplit(idx, 'categoryId', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1.5 focus:outline-none"
                      >
                        {categories.filter((c) => c.type === 'expense').map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.parentId ? `↳ ${cat.name}` : cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={split.amount || ''}
                        onChange={(e) => handleUpdateSplit(idx, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-[11px] font-bold rounded px-2 py-1.5 focus:outline-none"
                      />
                    </div>

                    <div className="w-28">
                      <select
                        value={split.familyMemberId || ''}
                        onChange={(e) => handleUpdateSplit(idx, 'familyMemberId', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1.5 focus:outline-none"
                      >
                        {familyMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {splits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplitRow(idx)}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddSplitRow}
                className="w-full py-1.5 border border-dashed border-slate-700 hover:border-amber-500/50 text-slate-400 hover:text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Outra Divisão de Categoria
              </button>
            </div>
          )}

          {/* Linha 3: Beneficiário (Payee) com Autocomplete */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Beneficiário / Estabelecimento / Origem *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={payee}
                onChange={(e) => handlePayeeChange(e.target.value)}
                onFocus={() => payee.length > 0 && setShowSuggestions(true)}
                placeholder="Ex: Pão de Açúcar, Posto Shell, Netflix, Salário..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <Sparkles className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Dropdown de Sugestões de Autocomplete */}
            {showSuggestions && payeeSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/60 border-b border-slate-800">
                  Sugestões do Histórico SQLite
                </div>
                {payeeSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => selectPayeeSuggestion(sug)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-400 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{sug}</span>
                    <span className="text-[10px] text-slate-500">Auto-preencher</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Linha 4: Membro da Família e Projeto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-sky-400" />
                Membro da Família Atribuído
              </label>
              <select
                value={familyMemberId}
                onChange={(e) => setFamilyMemberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Projeto Associado (Opcional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Nenhum Projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 5: Status da Transação & Recorrência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Status de Liquidação
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setStatus('cleared')}
                  className={`py-1 text-[11px] font-semibold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    status === 'cleared' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Liquidada
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`py-1 text-[11px] font-semibold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('void')}
                  className={`py-1 text-[11px] font-semibold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    status === 'void' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'
                  }`}
                >
                  <Ban className="w-3 h-3" />
                  Cancelada
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                />
                <span className="text-xs text-slate-200 font-medium">Transação Recorrente / Agendada</span>
              </label>

              {isRecurring && (
                <select
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                  <option value="monthly">Mensal (Padrão)</option>
                  <option value="yearly">Anual</option>
                </select>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <TagIcon className="w-3 h-3 text-slate-400" />
              Rótulos / Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.name)}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações / Notas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Observações / Detalhes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de nota fiscal, detalhes da compra, motivo..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Rodapé com Botões de Ação */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingTransaction ? 'Atualizar Transação' : 'Gravar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
