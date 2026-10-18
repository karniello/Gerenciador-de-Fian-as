import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  ArrowRightLeft, 
  Layers, 
  Calendar,
  Sparkles,
  X,
  Clock
} from 'lucide-react';
import { Transaction } from '../../types';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const FinancialCalendarView: React.FC = () => {
  const { 
    transactions, 
    categories, 
    accounts, 
    familyMembers, 
    activeCurrencyCode,
    openNewTransactionModal,
    openEditTransactionModal
  } = useFinanceStore();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed (0 = Jan, 9 = Out)
  const [viewMode, setViewMode] = useState<'month_grid' | 'year_matrix'>('month_grid');

  // Dia selecionado para exibir o painel lateral com as transações da data
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);

  // Filtrar transações válidas do ano selecionado
  const yearTransactions = transactions.filter((t) => {
    if (t.status === 'void') return false;
    const [y] = t.date.split('-').map(Number);
    return y === selectedYear;
  });

  // Métricas anuais consolidadas
  const totalAnnualIncome = yearTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAnnualExpense = yearTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const annualNetBalance = totalAnnualIncome - totalAnnualExpense;

  // Cálculos por mês para a matriz anual de 12 meses
  const monthlyStats = Array.from({ length: 12 }, (_, monthIdx) => {
    const monthNum = monthIdx + 1;
    const monthTxs = yearTransactions.filter((t) => {
      const [, m] = t.date.split('-').map(Number);
      return m === monthNum;
    });

    const income = monthTxs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;

    return {
      monthIdx,
      name: MONTH_NAMES[monthIdx],
      income,
      expense,
      net,
      count: monthTxs.length,
    };
  });

  // Geração da grade de dias para o mês selecionado
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Domingo
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Transações do mês selecionado agrupadas por dia YYYY-MM-DD
  const dailyTransactionsMap: Record<string, { income: number; expense: number; txs: Transaction[] }> = {};

  yearTransactions.forEach((t) => {
    const [y, m] = t.date.split('-').map(Number);
    if (y === selectedYear && m === selectedMonth + 1) {
      if (!dailyTransactionsMap[t.date]) {
        dailyTransactionsMap[t.date] = { income: 0, expense: 0, txs: [] };
      }
      dailyTransactionsMap[t.date].txs.push(t);
      if (t.type === 'income') dailyTransactionsMap[t.date].income += t.amount;
      if (t.type === 'expense') dailyTransactionsMap[t.date].expense += t.amount;
    }
  });

  // Transações do dia selecionado
  const activeDayTransactions = selectedDayString ? dailyTransactionsMap[selectedDayString]?.txs || [] : [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none">
      {/* Barra de Controle Superior do Calendário */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Calendário Financeiro Anual & Mensal</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                {selectedYear}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Acompanhe dias de vencimento, datas de recebimento e fluxo diário do ano.
            </p>
          </div>
        </div>

        {/* Seletor de Ano & Alternador de Modo */}
        <div className="flex items-center gap-3">
          {/* Seletor de Ano com Chevrons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
              title="Ano Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-bold text-xs text-slate-200">{selectedYear}</span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
              title="Próximo Ano"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Alternador de Modo (Grid Mensal vs Matriz 12 Meses) */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('month_grid')}
              className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                viewMode === 'month_grid' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grade do Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('year_matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                viewMode === 'year_matrix' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Painel 12 Meses
            </button>
          </div>
        </div>
      </div>

      {/* Faixa com Balanço Consolidado do Ano */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 rounded-md border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Receitas no Ano ({selectedYear}):
          </span>
          <span className="font-mono font-bold text-emerald-400">
            +{formatCurrency(totalAnnualIncome, activeCurrencyCode)}
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 rounded-md border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Total Despesas no Ano ({selectedYear}):
          </span>
          <span className="font-mono font-bold text-rose-400">
            -{formatCurrency(totalAnnualExpense, activeCurrencyCode)}
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 rounded-md border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Saldo Anual Acumulado:
          </span>
          <span className={`font-mono font-bold ${annualNetBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(annualNetBalance, activeCurrencyCode)}
          </span>
        </div>
      </div>

      {/* MODO 1: GRADE MENSAL DETALHADA COM DIAS DO MÊS */}
      {viewMode === 'month_grid' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Lado Esquerdo: Seletor de Meses + Calendário de Dias */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-3">
            {/* Abas dos 12 Meses */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {MONTH_NAMES.map((mName, idx) => {
                const isSelected = selectedMonth === idx;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(idx);
                      setSelectedDayString(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>

            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase py-1 bg-slate-900/60 rounded-lg">
              {WEEK_DAYS.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            {/* Grade de Células dos Dias */}
            <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr">
              {/* Espaçadores para o primeiro dia do mês */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-950/30 rounded-lg border border-slate-900 opacity-40 min-h-[75px]" />
              ))}

              {/* Dias do Mês */}
              {Array.from({ length: totalDaysInMonth }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1;
                const formattedDay = dayNum.toString().padStart(2, '0');
                const formattedMonth = (selectedMonth + 1).toString().padStart(2, '0');
                const dateKey = `${selectedYear}-${formattedMonth}-${formattedDay}`;

                const dayData = dailyTransactionsMap[dateKey];
                const hasIncome = dayData && dayData.income > 0;
                const hasExpense = dayData && dayData.expense > 0;
                const hasRecurring = dayData && dayData.txs.some((t) => t.isRecurring);
                const isSelected = selectedDayString === dateKey;

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDayString(dateKey)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between min-h-[78px] ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Número do Dia + Indicador Recorrente */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {dayNum}
                      </span>
                      {hasRecurring && (
                        <span title="Transação Recorrente / Agendada" className="text-sky-400">
                          <Clock className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Badges de Entradas e Saídas do Dia */}
                    <div className="space-y-0.5 mt-1 font-mono text-[10px]">
                      {hasIncome && (
                        <div className="bg-emerald-500/15 text-emerald-400 px-1 py-0.2 rounded font-semibold truncate border border-emerald-500/20">
                          +{formatCurrency(dayData.income, activeCurrencyCode)}
                        </div>
                      )}
                      {hasExpense && (
                        <div className="bg-rose-500/15 text-rose-400 px-1 py-0.2 rounded font-semibold truncate border border-rose-500/20">
                          -{formatCurrency(dayData.expense, activeCurrencyCode)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lado Direito: Gaveta de Transações do Dia Selecionado */}
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100">
                  {selectedDayString ? formatDateDisplay(selectedDayString) : 'Selecione um Dia'}
                </h3>
              </div>
              {selectedDayString && (
                <button
                  type="button"
                  onClick={() => setSelectedDayString(null)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedDayString ? (
                <>
                  <button
                    type="button"
                    onClick={() => openNewTransactionModal('expense')}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Lançar Transação Neste Dia</span>
                  </button>

                  {activeDayTransactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      Nenhum lançamento financeiro registrado nesta data.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Lançamentos ({activeDayTransactions.length})
                      </span>
                      {activeDayTransactions.map((tx) => {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const member = familyMembers.find((m) => m.id === tx.familyMemberId);

                        return (
                          <div
                            key={tx.id}
                            onClick={() => openEditTransactionModal(tx)}
                            className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-100 truncate">{tx.payee}</span>
                              <span
                                className={`font-mono text-xs font-bold ${
                                  tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {tx.type === 'expense' ? '-' : '+'}
                                {formatCurrency(tx.amount, tx.currencyCode || activeCurrencyCode)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 truncate">
                                {cat ? cat.name : tx.isSplit ? 'Divisão em Splits' : 'Geral'}
                              </span>
                              {member && (
                                <span className="text-[10px] text-sky-400 font-medium">
                                  {member.name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <CalendarDays className="w-8 h-8 text-slate-700" />
                  <span>Clique em qualquer dia do calendário para visualizar ou adicionar transações.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODO 2: PAINEL ANUAL CONSOLIDADO COM 12 MESES */}
      {viewMode === 'year_matrix' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthlyStats.map((m) => {
              const isPositive = m.net >= 0;
              return (
                <div
                  key={m.monthIdx}
                  onClick={() => {
                    setSelectedMonth(m.monthIdx);
                    setViewMode('month_grid');
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 shadow-sm space-y-3 cursor-pointer transition-all hover:scale-[1.02] group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {m.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {m.count} {m.count === 1 ? 'movimento' : 'movimentos'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-emerald-400">
                      <span className="text-slate-400 font-sans">Receitas:</span>
                      <span className="font-bold">+{formatCurrency(m.income, activeCurrencyCode)}</span>
                    </div>

                    <div className="flex items-center justify-between text-rose-400">
                      <span className="text-slate-400 font-sans">Despesas:</span>
                      <span className="font-bold">-{formatCurrency(m.expense, activeCurrencyCode)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
                      <span className="text-slate-300 font-sans">Resultado:</span>
                      <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCurrency(m.net, activeCurrencyCode)}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center pt-1 group-hover:text-emerald-400 font-semibold transition-colors">
                    Ver dias deste mês →
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
