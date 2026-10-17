import React from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  Layers, 
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    accounts, 
    transactions, 
    categories, 
    familyMembers, 
    budgets, 
    activeCurrencyCode,
    currencies,
    openNewTransactionModal,
    setActiveTab,
    setSelectedAccountId
  } = useFinanceStore();

  const activeCurrency = currencies.find(c => c.code === activeCurrencyCode) || currencies[0];

  // Calcular Patrimônio Líquido
  const netWorth = accounts.reduce((acc, account) => {
    const accCurrency = currencies.find(c => c.code === account.currencyCode) || currencies[0];
    const inBrl = account.currentBalance * (accCurrency.rateToBase || 1.0);
    return acc + (inBrl / (activeCurrency.rateToBase || 1.0));
  }, 0);

  // Mês Atual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const currentMonthTransactions = transactions.filter(t => {
    if (t.status === 'void') return false;
    const [year, month] = t.date.split('-').map(Number);
    return year === currentYear && month === currentMonth;
  });

  const monthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0;

  // Total de Despesas por Categoria para o Gráfico
  const categoryExpenses: Record<string, number> = {};
  currentMonthTransactions.forEach(t => {
    if (t.type !== 'expense') return;

    if (t.isSplit && t.splits && t.splits.length > 0) {
      t.splits.forEach(s => {
        categoryExpenses[s.categoryId] = (categoryExpenses[s.categoryId] || 0) + s.amount;
      });
    } else if (t.categoryId) {
      categoryExpenses[t.categoryId] = (categoryExpenses[t.categoryId] || 0) + t.amount;
    }
  });

  const sortedCategories = Object.entries(categoryExpenses)
    .map(([catId, total]) => {
      const category = categories.find(c => c.id === catId);
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

  // Gastos por Membro da Família
  const memberExpenses: Record<string, number> = {};
  currentMonthTransactions.forEach(t => {
    if (t.type !== 'expense') return;

    if (t.isSplit && t.splits) {
      t.splits.forEach(s => {
        const mId = s.familyMemberId || t.familyMemberId || 'fm-4';
        memberExpenses[mId] = (memberExpenses[mId] || 0) + s.amount;
      });
    } else {
      const mId = t.familyMemberId || 'fm-4';
      memberExpenses[mId] = (memberExpenses[mId] || 0) + t.amount;
    }
  });

  // Recent Transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950">
      {/* 4 Cards Métricas do Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patrimônio Líquido */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Patrimônio Líquido</span>
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Entradas (Outubro)</span>
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Saídas (Outubro)</span>
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

        {/* Card 4: Taxa de Poupança / Saldo */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
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

      {/* Seção Principal: Distribuição de Despesas & Membros da Família */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: Gráfico Visual de Categorias do Mês */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Maiores Despesas por Categoria</span>
                <span className="text-[11px] font-normal text-slate-400">({currentMonthTransactions.filter(t => t.type === 'expense').length} lançamentos)</span>
              </h3>
              <p className="text-xs text-slate-400">Detalhamento dos gastos do mês corrente com suporte a subcategorias</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              Ver Relatório Completo →
            </button>
          </div>

          {/* Barras de Despesas por Categoria */}
          <div className="space-y-3 pt-2">
            {sortedCategories.slice(0, 6).map((cat) => (
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
            ))}
          </div>
        </div>

        {/* Coluna 3: Gastos por Membro da Família */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-400" />
                Membros da Família
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Rateio de gastos pessoais e familiares</p>

            <div className="space-y-3">
              {familyMembers.map((member) => {
                const totalSpent = memberExpenses[member.id] || 0;
                const memberPercent = monthExpense > 0 ? Math.round((totalSpent / monthExpense) * 100) : 0;

                return (
                  <div key={member.id} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{member.name}</div>
                          <div className="text-[10px] text-slate-400">{member.role}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-200">
                          {formatCurrency(totalSpent, activeCurrencyCode)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{memberPercent}%</div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${memberPercent}%`,
                          backgroundColor: member.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Mantenha o rateio atualizado lançando transações divididas (splits) para compras compartilhadas.</span>
          </div>
        </div>
      </div>

      {/* Linha Inferior: Últimas Transações & Status dos Orçamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Transações */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Transações Recentes</h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              Abrir Livro Caixa →
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/50 hover:bg-slate-800/50 rounded-lg border border-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${
                        tx.type === 'expense'
                          ? 'bg-rose-500/10 text-rose-400'
                          : tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-sky-500/10 text-sky-400'
                      }`}
                    >
                      {tx.type === 'expense' && <TrendingDown className="w-4 h-4" />}
                      {tx.type === 'income' && <TrendingUp className="w-4 h-4" />}
                      {tx.type === 'transfer' && <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-100">{tx.payee}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{formatDateDisplay(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.isSplit ? 'Divisão em Splits' : category?.name || 'Geral'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-xs">
                    <span className={tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}>
                      {tx.type === 'expense' ? '-' : '+'}
                      {formatCurrency(tx.amount, tx.currencyCode || activeCurrencyCode)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metas de Orçamento Ativas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Alerta de Orçamentos do Mês</h3>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              Gerenciar Metas →
            </button>
          </div>

          <div className="space-y-3">
            {budgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              const spent = categoryExpenses[b.categoryId] || 0;
              const percent = Math.round((spent / b.amount) * 100);
              const isExceeded = percent >= 100;
              const isWarning = percent >= b.alertThreshold * 100;

              return (
                <div key={b.id} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat?.name || 'Orçamento'}</span>
                    <span className="font-mono text-slate-300">
                      <span className={isExceeded ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                        {formatCurrency(spent, activeCurrencyCode)}
                      </span>{' '}
                      / {formatCurrency(b.amount, activeCurrencyCode)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className={isExceeded ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {isExceeded ? 'Meta Estourada!' : isWarning ? 'Atenção ao Teto' : 'Dentro do Planejado'}
                    </span>
                    <span className="text-slate-400 font-mono">{percent}% utilizado</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
