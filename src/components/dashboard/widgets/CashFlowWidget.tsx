import React from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency } from '../../../utils/formatters';
import { TrendingUp, TrendingDown, Calendar, Flame, Wallet } from 'lucide-react';

export const CashFlowWidget: React.FC = () => {
  const { transactions, activeCurrencyCode } = useFinanceStore();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysRemaining = daysInMonth - currentDay;

  const currentMonthTransactions = transactions.filter((t) => {
    if (t.status === 'void') return false;
    const [year, month] = t.date.split('-').map(Number);
    return year === currentYear && month === currentMonth;
  });

  const monthIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = monthIncome - monthExpense;
  const isNetPositive = netBalance >= 0;

  // Queima diária de caixa (Burn Rate diário)
  const dailyBurn = currentDay > 0 ? monthExpense / currentDay : 0;
  // Projeção de despesas até o fim do mês
  const projectedTotalExpense = monthExpense + dailyBurn * daysRemaining;

  return (
    <div className="space-y-4">
      {/* Resumo do Balanço Líquido do Mês */}
      <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Resultado Operacional do Mês</div>
          <div
            className={`text-lg font-bold font-mono mt-0.5 ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}
            {formatCurrency(netBalance, activeCurrencyCode)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isNetPositive ? 'Superávit acumulado no período' : 'Déficit acumulado no período'}
          </div>
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isNetPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}
        >
          {isNetPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Métricas de Queima Diária e Projeção */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Média Diária</span>
          </div>
          <div className="text-sm font-mono font-bold text-slate-100">
            {formatCurrency(dailyBurn, activeCurrencyCode)}
            <span className="text-[10px] text-slate-400 font-normal"> /dia</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Dias Restantes</span>
          </div>
          <div className="text-sm font-mono font-bold text-slate-100">
            {daysRemaining} <span className="text-[10px] text-slate-400 font-normal">dias no mês</span>
          </div>
        </div>
      </div>

      {/* Barra de Proporção Entradas vs Saídas */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-emerald-400">Entradas: {formatCurrency(monthIncome, activeCurrencyCode)}</span>
          <span className="text-rose-400">Saídas: {formatCurrency(monthExpense, activeCurrencyCode)}</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{
              width: `${
                monthIncome + monthExpense > 0
                  ? (monthIncome / (monthIncome + monthExpense)) * 100
                  : 50
              }%`,
            }}
          />
          <div
            className="bg-rose-500 h-full transition-all"
            style={{
              width: `${
                monthIncome + monthExpense > 0
                  ? (monthExpense / (monthIncome + monthExpense)) * 100
                  : 50
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
