import React from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency } from '../../../utils/formatters';
import { Target, AlertCircle, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

export const BudgetHealthWidget: React.FC = () => {
  const { budgets, categories, transactions, activeCurrencyCode, setActiveTab } = useFinanceStore();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const currentMonthTransactions = transactions.filter((t) => {
    if (t.status === 'void' || t.type !== 'expense') return false;
    const [year, month] = t.date.split('-').map(Number);
    return year === currentYear && month === currentMonth;
  });

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Acompanhamento do teto mensal de gastos planejados
        </span>
        <button
          onClick={() => setActiveTab('budgets')}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
        >
          Gerenciar Metas
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2.5">
        {budgets.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Nenhuma meta de orçamento cadastrada.
          </div>
        ) : (
          budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const spent = categoryExpenses[b.categoryId] || 0;
            const percent = Math.round((spent / b.amount) * 100);
            const isExceeded = percent >= 100;
            const isWarning = percent >= b.alertThreshold * 100;

            return (
              <div
                key={b.id}
                className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{cat?.name || 'Orçamento'}</span>
                  <span className="font-mono text-slate-300">
                    <span
                      className={
                        isExceeded
                          ? 'text-rose-400 font-bold'
                          : isWarning
                          ? 'text-amber-400 font-bold'
                          : 'text-slate-200'
                      }
                    >
                      {formatCurrency(spent, activeCurrencyCode)}
                    </span>{' '}
                    / {formatCurrency(b.amount, activeCurrencyCode)}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span
                    className={`flex items-center gap-1 ${
                      isExceeded
                        ? 'text-rose-400 font-bold'
                        : isWarning
                        ? 'text-amber-400 font-bold'
                        : 'text-emerald-400'
                    }`}
                  >
                    {isExceeded && <AlertCircle className="w-3 h-3" />}
                    {isExceeded
                      ? 'Meta Estourada!'
                      : isWarning
                      ? 'Atenção ao Teto'
                      : 'Dentro do Planejado'}
                  </span>
                  <span className="text-slate-400 font-mono">{percent}% utilizado</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
