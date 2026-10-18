import React from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency } from '../../../utils/formatters';
import { PiggyBank, TrendingUp, TrendingDown, Sparkles, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

export const NetWorthSummaryWidget: React.FC = () => {
  const { accounts, transactions, currencies, activeCurrencyCode } = useFinanceStore();

  const activeCurrency = currencies.find((c) => c.code === activeCurrencyCode) || currencies[0];

  // Calcular Patrimônio Líquido multi-moedas
  const netWorth = accounts.reduce((acc, account) => {
    const accCurrency = currencies.find((c) => c.code === account.currencyCode) || currencies[0];
    const inBrl = account.currentBalance * (accCurrency.rateToBase || 1.0);
    return acc + inBrl / (activeCurrency.rateToBase || 1.0);
  }, 0);

  // Mês Atual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

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

  const savingsRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Patrimônio Líquido */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Patrimônio Líquido Consolidado</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className={`text-xl font-bold font-mono ${netWorth >= 0 ? 'text-slate-100' : 'text-rose-400'}`}>
            {formatCurrency(netWorth, activeCurrencyCode)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {accounts.length} contas sincronizadas
          </p>
        </div>
      </div>

      {/* Card 2: Receitas do Mês */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Entradas do Mês</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            +{formatCurrency(monthIncome, activeCurrencyCode)}
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Salários e rendimentos
          </p>
        </div>
      </div>

      {/* Card 3: Despesas do Mês */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Saídas do Mês</span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-rose-400">
            -{formatCurrency(monthExpense, activeCurrencyCode)}
          </div>
          <p className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Gastos essenciais e lazer
          </p>
        </div>
      </div>

      {/* Card 4: Taxa de Poupança */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Taxa de Poupança</span>
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-sky-400">
            {savingsRate}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
