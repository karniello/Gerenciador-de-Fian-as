import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Target, 
  TrendingDown, 
  ReceiptText, 
  Sparkles,
  Calendar,
  SlidersHorizontal,
  ArrowUpRight
} from 'lucide-react';
import { Budget } from '../../types';

export const BudgetManager: React.FC = () => {
  const { 
    budgets, 
    categories, 
    transactions, 
    saveBudget, 
    deleteBudget, 
    activeCurrencyCode,
    setFilters,
    setActiveTab,
    addToast
  } = useFinanceStore();

  // Estados de Controle do Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [amount, setAmount] = useState<number>(1500);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [alertThreshold, setAlertThreshold] = useState<number>(0.8);

  // Filtro de status na tela principal
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'warning' | 'exceeded'>('all');

  // Mês Atual e Dias do Mês para Projeções em Tempo Real
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
  const remainingDaysInMonth = Math.max(1, daysInCurrentMonth - currentDay);

  // Gastos reais do mês atual agrupados por categoria (incluindo splits)
  const categoryExpenses: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type !== 'expense' || t.status === 'void') return;
    const [y, m] = t.date.split('-').map(Number);
    if (y !== currentYear || m !== currentMonth) return;

    if (t.isSplit && t.splits && t.splits.length > 0) {
      t.splits.forEach((s) => {
        categoryExpenses[s.categoryId] = (categoryExpenses[s.categoryId] || 0) + s.amount;
      });
    } else if (t.categoryId) {
      categoryExpenses[t.categoryId] = (categoryExpenses[t.categoryId] || 0) + t.amount;
    }
  });

  // Totais consolidados
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpentInBudgets = budgets.reduce((sum, b) => sum + (categoryExpenses[b.categoryId] || 0), 0);
  const totalAvailable = totalBudgeted - totalSpentInBudgets;
  const overallConsumedPercent = totalBudgeted > 0 ? Math.round((totalSpentInBudgets / totalBudgeted) * 100) : 0;

  // Cálculos em tempo real para o modal de criação/edição
  const modalSelectedCatExpense = categoryExpenses[selectedCatId] || 0;
  const modalSpentPercent = amount > 0 ? Math.round((modalSelectedCatExpense / amount) * 100) : 0;
  const modalRemaining = amount - modalSelectedCatExpense;
  const modalProjectedTotal = currentDay > 0 ? Math.round((modalSelectedCatExpense / currentDay) * daysInCurrentMonth) : modalSelectedCatExpense;

  const openCreateModal = () => {
    setEditingBudgetId(null);
    // Selecionar uma categoria de despesa que ainda não tenha orçamento (se houver)
    const availableCat = categories.find((c) => c.type === 'expense' && !budgets.some((b) => b.categoryId === c.id));
    setSelectedCatId(availableCat ? availableCat.id : categories.find((c) => c.type === 'expense')?.id || categories[0]?.id || '');
    setAmount(1500);
    setPeriod('monthly');
    setAlertThreshold(0.8);
    setIsModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setSelectedCatId(budget.categoryId);
    setAmount(budget.amount);
    setPeriod(budget.period);
    setAlertThreshold(budget.alertThreshold || 0.8);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      addToast('O limite de gastos deve ser maior que zero.', 'warning');
      return;
    }

    saveBudget({
      id: editingBudgetId || undefined,
      categoryId: selectedCatId,
      amount: Number(amount),
      period,
      currencyCode: activeCurrencyCode,
      alertThreshold: Number(alertThreshold),
    });

    setIsModalOpen(false);
  };

  // Filtragem dos orçamentos para exibição nos cards
  const filteredBudgets = budgets.filter((b) => {
    const spent = categoryExpenses[b.categoryId] || 0;
    const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    const isExceeded = percent >= 100;
    const isWarning = percent >= (b.alertThreshold * 100) && percent < 100;
    const isSafe = percent < (b.alertThreshold * 100);

    if (statusFilter === 'safe') return isSafe;
    if (statusFilter === 'warning') return isWarning;
    if (statusFilter === 'exceeded') return isExceeded;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950 select-none">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Metas de Gastos Mensais & Orçamentos
          </h2>
          <p className="text-xs text-slate-400">
            Defina limites de valor por categoria e acompanhe a porcentagem gasta e previsões de estouro em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Meta de Gastos</span>
        </button>
      </div>

      {/* 3 Cards de Resumo Consolidado de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Teto Total Planejado (Mês)</span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {budgets.length} categorias
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-2">
            {formatCurrency(totalBudgeted, activeCurrencyCode)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Soma de todos os limites mensais ativos
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Gasto Executado até Hoje</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              overallConsumedPercent >= 100 ? 'bg-rose-500/20 text-rose-400' :
              overallConsumedPercent >= 80 ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {overallConsumedPercent}% da meta geral
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-2">
            {formatCurrency(totalSpentInBudgets, activeCurrencyCode)}
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallConsumedPercent >= 100 ? 'bg-rose-500' : overallConsumedPercent >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallConsumedPercent)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Saldo Restante Disponível</span>
            <span className="text-[10px] font-mono text-slate-500">
              {remainingDaysInMonth} dias restantes no mês
            </span>
          </div>
          <div className={`text-xl font-bold font-mono mt-2 ${totalAvailable >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalAvailable, activeCurrencyCode)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            {totalAvailable >= 0 
              ? `Média de ${formatCurrency(totalAvailable / remainingDaysInMonth, activeCurrencyCode)}/dia até o fim do mês`
              : 'Teto geral estourado no mês!'}
          </p>
        </div>
      </div>

      {/* Barra de Filtros por Estado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas as Metas ({budgets.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('safe')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'safe'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dentro da Meta (&lt;80%)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('warning')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'warning'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Em Alerta (80% - 99%)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('exceeded')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'exceeded'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Estouradas (&ge;100%)
          </button>
        </div>
      </div>

      {/* Grid de Cartões de Orçamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBudgets.map((b) => {
          const category = categories.find((c) => c.id === b.categoryId);
          const spent = categoryExpenses[b.categoryId] || 0;
          const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
          const remaining = b.amount - spent;
          const isOver = percent >= 100;
          const isWarn = percent >= (b.alertThreshold * 100) && !isOver;

          // Projeção de fim de mês baseada na velocidade diária
          const dailyBurn = currentDay > 0 ? spent / currentDay : 0;
          const projectedEnd = Math.round(dailyBurn * daysInCurrentMonth);
          const dailyAllowance = remaining > 0 ? remaining / remainingDaysInMonth : 0;

          return (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors group"
            >
              <div>
                {/* Header do Card com Ícone da Categoria e Ações */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: category?.color || '#3b82f6' }}
                    >
                      <IconRenderer name={category?.icon || 'Folder'} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{category?.name || 'Categoria'}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Meta Mensal</span>
                    </div>
                  </div>

                  {/* Ações: Editar e Excluir */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(b)}
                      className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                      title="Editar Limite e Parâmetros"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir a meta de orçamento de "${category?.name}"?`)) {
                          deleteBudget(b.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Porcentagem Gasta & Valores */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Gasto Atual:</span>
                    <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-200 font-semibold'}>
                      {formatCurrency(spent, activeCurrencyCode)} / <span className="text-slate-400">{formatCurrency(b.amount, activeCurrencyCode)}</span>
                    </span>
                  </div>

                  {/* Barra de Progresso em Tempo Real */}
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
                    {/* Marcador do Limite de Alerta Preventivo */}
                    <div 
                      className="absolute top-0 bottom-0 w-[2px] bg-amber-400/80 z-10"
                      style={{ left: `${Math.round(b.alertThreshold * 100)}%` }}
                      title={`Alerta em ${Math.round(b.alertThreshold * 100)}%`}
                    />

                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  {/* Porcentagem e Saldo Restante */}
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={`font-bold ${isOver ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-slate-300'}`}>
                      {percent}% consumido
                    </span>
                    <span className={remaining >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-bold'}>
                      {remaining >= 0 ? `Restam ${formatCurrency(remaining, activeCurrencyCode)}` : `Estouro de ${formatCurrency(Math.abs(remaining), activeCurrencyCode)}`}
                    </span>
                  </div>
                </div>

                {/* Bloco de Projeção em Tempo Real */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[10px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Projeção Fim de Mês:</span>
                    <span className={projectedEnd > b.amount ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {formatCurrency(projectedEnd, activeCurrencyCode)}
                    </span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Teto diário restante:</span>
                      <span className="text-slate-300 font-semibold">{formatCurrency(dailyAllowance, activeCurrencyCode)}/dia</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé com Link Direto para o Livro de Transações */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  {isOver ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Teto Estourado
                    </span>
                  ) : isWarn ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Alerta ({Math.round(b.alertThreshold * 100)}%)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dentro da Meta
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFilters({ categoryId: b.categoryId });
                    setActiveTab('transactions');
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Ver transações lançadas nesta categoria"
                >
                  <ReceiptText className="w-3 h-3" />
                  <span>Ver Lançamentos →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE META COM CÁLCULO E PREVIEW EM TEMPO REAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header do Modal */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {editingBudgetId ? 'Ajustar Meta de Gastos' : 'Criar Nova Meta de Gastos Mensais'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Defina o teto por categoria e acompanhe o percentual consumido em tempo real.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Seleção de Categoria */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria de Despesa *
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  {categories
                    .filter((c) => c.type === 'expense')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parentId ? `↳ ${cat.name}` : `📁 ${cat.name}`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Valor do Limite + Presets Rápidos */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Limite Máximo de Gastos ({activeCurrencyCode}) *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Teto Mensal</span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">
                    {activeCurrencyCode === 'USD' ? 'US$' : activeCurrencyCode === 'EUR' ? '€' : 'R$'}
                  </span>
                  <input
                    type="number"
                    step="50"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 2500"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-base font-bold rounded-lg pl-12 pr-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Botões Rápidos de Ajuste de Limite */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[500, 1000, 1500, 2500, 4000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        amount === preset
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {activeCurrencyCode} {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* CAIXA DE PREVIEW E CÁLCULO DA PORCENTAGEM GASTA EM TEMPO REAL */}
              <div className="p-3.5 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Cálculo & Simulação em Tempo Real
                  </span>
                  <span className={`font-mono font-bold text-xs ${
                    modalSpentPercent >= 100 ? 'text-rose-400' :
                    modalSpentPercent >= 80 ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {modalSpentPercent}% gasto
                  </span>
                </div>

                {/* Barra do Preview em tempo real */}
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      modalSpentPercent >= 100 ? 'bg-rose-500' :
                      modalSpentPercent >= (alertThreshold * 100) ? 'bg-amber-400' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, modalSpentPercent)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-400">
                  <div>
                    <span>Gasto real até hoje: </span>
                    <span className="text-slate-200 font-bold">{formatCurrency(modalSelectedCatExpense, activeCurrencyCode)}</span>
                  </div>
                  <div className="text-right">
                    <span>Disponível restante: </span>
                    <span className={modalRemaining >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {formatCurrency(modalRemaining, activeCurrencyCode)}
                    </span>
                  </div>
                  <div>
                    <span>Projeção ao fim do mês: </span>
                    <span className={modalProjectedTotal > amount ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {formatCurrency(modalProjectedTotal, activeCurrencyCode)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span>Status previsto: </span>
                    <span className={modalSpentPercent >= 100 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {modalSpentPercent >= 100 ? 'Estourado' : 'Dentro do Teto'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Limiar de Alerta */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notificação de Alerta Preventivo
                </label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value={0.7}>Alertar ao consumir 70% da meta</option>
                  <option value={0.8}>Alertar ao consumir 80% da meta (Padrão)</option>
                  <option value={0.9}>Alertar ao consumir 90% da meta</option>
                  <option value={1.0}>Alertar somente ao atingir 100%</option>
                </select>
              </div>

              {/* Rodapé com Ações */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingBudgetId ? 'Salvar Alterações' : 'Criar Meta de Orçamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
