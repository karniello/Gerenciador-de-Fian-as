import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  Plus, 
  Trash2, 
  PieChart, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  TrendingDown,
  Target
} from 'lucide-react';
import { Budget } from '../../types';

export const BudgetManager: React.FC = () => {
  const { 
    budgets, 
    categories, 
    transactions, 
    saveBudget, 
    deleteBudget, 
    activeCurrencyCode 
  } = useFinanceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [amount, setAmount] = useState<number>(1000);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [alertThreshold, setAlertThreshold] = useState<number>(0.8);

  // Mês Atual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Gastos reais agrupados por categoria
  const categoryExpenses: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type !== 'expense' || t.status === 'void') return;
    const [y, m] = t.date.split('-').map(Number);
    if (y !== currentYear || m !== currentMonth) return;

    if (t.isSplit && t.splits) {
      t.splits.forEach((s) => {
        categoryExpenses[s.categoryId] = (categoryExpenses[s.categoryId] || 0) + s.amount;
      });
    } else if (t.categoryId) {
      categoryExpenses[t.categoryId] = (categoryExpenses[t.categoryId] || 0) + t.amount;
    }
  });

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpentInBudgets = budgets.reduce((sum, b) => sum + (categoryExpenses[b.categoryId] || 0), 0);
  const totalAvailable = totalBudgeted - totalSpentInBudgets;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    saveBudget({
      categoryId: selectedCatId,
      amount,
      period,
      currencyCode: activeCurrencyCode,
      alertThreshold,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Metas e Orçamentos Familiares
          </h2>
          <p className="text-xs text-slate-400">
            Controle de teto de gastos mensais por categoria com alertas de estouro em tempo real.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Orçamento</span>
        </button>
      </div>

      {/* Cards de Resumo Consolidado de Orçamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Total Planejado (Mês)</span>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {formatCurrency(totalBudgeted, activeCurrencyCode)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{budgets.length} categorias orçadas</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Executado até Hoje</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalSpentInBudgets, activeCurrencyCode)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {totalBudgeted > 0 ? Math.round((totalSpentInBudgets / totalBudgeted) * 100) : 0}% consumido
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Saldo Restante Disponível</span>
          <div className={`text-xl font-bold font-mono mt-1 ${totalAvailable >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {formatCurrency(totalAvailable, activeCurrencyCode)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {totalAvailable >= 0 ? 'Margem segura' : 'Orçamento estourado'}
          </span>
        </div>
      </div>

      {/* Grid de Cartões de Orçamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const category = categories.find((c) => c.id === b.categoryId);
          const spent = categoryExpenses[b.categoryId] || 0;
          const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
          const remaining = b.amount - spent;
          const isOver = percent >= 100;
          const isWarn = percent >= b.alertThreshold * 100;

          return (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: category?.color || '#3b82f6' }}
                    >
                      <IconRenderer name={category?.icon || 'Folder'} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{category?.name || 'Categoria'}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Mensal</span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteBudget(b.id)}
                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    title="Excluir Orçamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Gasto:</span>
                    <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-200 font-semibold'}>
                      {formatCurrency(spent, activeCurrencyCode)} / {formatCurrency(b.amount, activeCurrencyCode)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">{percent}% gasto</span>
                    <span className={remaining >= 0 ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                      {remaining >= 0 ? `Restam ${formatCurrency(remaining, activeCurrencyCode)}` : `Estouro de ${formatCurrency(Math.abs(remaining), activeCurrencyCode)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  {isOver ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Teto Ultrapassado
                    </span>
                  ) : isWarn ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Limite Próximo ({Math.round(b.alertThreshold * 100)}%)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dentro da Meta
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar Novo Orçamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Definir Novo Orçamento
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria de Despesa *
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  {categories
                    .filter((c) => c.type === 'expense')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parentId ? `↳ ${cat.name}` : cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teto de Gastos ({activeCurrencyCode}) *
                </label>
                <input
                  type="number"
                  step="10"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Percentual de Alerta Preventivo
                </label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value={0.7}>Avisar ao atingir 70%</option>
                  <option value={0.8}>Avisar ao atingir 80% (Padrão)</option>
                  <option value={0.9}>Avisar ao atingir 90%</option>
                </select>
              </div>

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
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md cursor-pointer"
                >
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
