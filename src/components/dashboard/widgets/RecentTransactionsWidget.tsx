import React from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay } from '../../../utils/formatters';
import { TrendingDown, TrendingUp, ArrowUpRight, Plus, ExternalLink, Calendar } from 'lucide-react';

export const RecentTransactionsWidget: React.FC = () => {
  const { transactions, categories, activeCurrencyCode, openNewTransactionModal, setActiveTab } = useFinanceStore();

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Últimos 6 lançamentos registrados no livro caixa
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openNewTransactionModal()}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Novo Lançamento
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            Ver Livro Caixa
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Nenhuma transação registrada até o momento.
          </div>
        ) : (
          recentTransactions.map((tx) => {
            const category = categories.find((c) => c.id === tx.categoryId);
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2.5 bg-slate-950/50 hover:bg-slate-800/50 rounded-lg border border-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0 ${
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

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 truncate">{tx.payee}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 truncate">
                      <span>{formatDateDisplay(tx.date)}</span>
                      <span>•</span>
                      <span className="truncate">{tx.isSplit ? 'Divisão em Splits' : category?.name || 'Geral'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-xs flex-shrink-0 ml-3">
                  <span
                    className={
                      tx.type === 'expense'
                        ? 'text-rose-400'
                        : tx.type === 'income'
                        ? 'text-emerald-400'
                        : 'text-sky-400'
                    }
                  >
                    {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : '↔'}
                    {formatCurrency(tx.amount, tx.currencyCode || activeCurrencyCode)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
