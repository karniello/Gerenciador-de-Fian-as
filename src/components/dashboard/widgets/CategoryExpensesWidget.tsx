import React from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency } from '../../../utils/formatters';
import { IconRenderer } from '../../common/IconRenderer';
import { ExternalLink } from 'lucide-react';

export const CategoryExpensesWidget: React.FC = () => {
  const { categories, transactions, activeCurrencyCode, setActiveTab } = useFinanceStore();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const currentMonthTransactions = transactions.filter((t) => {
    if (t.status === 'void' || t.type !== 'expense') return false;
    const [year, month] = t.date.split('-').map(Number);
    return year === currentYear && month === currentMonth;
  });

  const monthExpense = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryExpenses: Record<string, number> = {};
  currentMonthTransactions.forEach((t) => {
    if (t.isSplit && t.splits && t.splits.length > 0) {
      t.splits.forEach((s) => {
        categoryExpenses[s.categoryId] = (categoryExpenses[s.categoryId] || 0) + s.amount;
      });
    } else if (t.categoryId) {
      categoryExpenses[t.categoryId] = (categoryExpenses[t.categoryId] || 0) + t.amount;
    }
  });

  const sortedCategories = Object.entries(categoryExpenses)
    .map(([catId, total]) => {
      const category = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: category?.name || 'Geral',
        color: category?.color || '#94a3b8',
        icon: category?.icon || 'Folder',
        total,
        percentage: monthExpense > 0 ? Math.round((total / monthExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Detalhamento dos gastos do mês corrente por centro de custo
        </span>
        <button
          onClick={() => setActiveTab('reports')}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
        >
          Relatório Completo
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3 pt-1">
        {sortedCategories.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Nenhuma despesa registrada neste mês.
          </div>
        ) : (
          sortedCategories.slice(0, 6).map((cat) => (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconRenderer name={cat.icon} className="w-3 h-3" />
                  </div>
                  <span className="font-semibold text-slate-200">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400 text-[11px]">{cat.percentage}%</span>
                  <span className="font-bold text-slate-100">
                    {formatCurrency(cat.total, activeCurrencyCode)}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
