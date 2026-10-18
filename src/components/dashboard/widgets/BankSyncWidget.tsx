import React from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency } from '../../../utils/formatters';
import {
  Landmark,
  CreditCard,
  RefreshCw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  ArrowUpRight,
} from 'lucide-react';

export const BankSyncWidget: React.FC = () => {
  const {
    bankConnections,
    accounts,
    transactions,
    isSyncingBanks,
    syncAllBankConnections,
    setActiveTab,
    openLinkBankModal,
  } = useFinanceStore();

  const linkedAccounts = accounts.filter((a) => a.isBankLinked);
  const creditCards = linkedAccounts.filter((a) => a.type === 'credit_card');

  // Transações sincronizadas recentemente
  const syncedTransactions = transactions.filter(
    (t) => t.origin === 'bank_sync' || t.origin === 'open_finance' || t.isAutoCategorized
  );

  const autoCategorizedCount = transactions.filter((t) => t.isAutoCategorized).length;
  const recurringCount = transactions.filter((t) => t.isRecurring).length;

  return (
    <div className="space-y-4">
      {/* Barra de Status e Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">Open Finance Brasil</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" /> {bankConnections.length} Conexões Ativas
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {linkedAccounts.length} contas e cartões com sincronização e catalogação automática
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => syncAllBankConnections()}
            disabled={isSyncingBanks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Sincronizar lançamentos recentes de todos os bancos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBanks ? 'animate-spin' : ''}`} />
            <span>{isSyncingBanks ? 'Sincronizando...' : 'Sincronizar Bancos'}</span>
          </button>

          <button
            onClick={() => setActiveTab('open_banking')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>Central Bancária</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Grid de Cartões de Crédito e Contas Vinculadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {linkedAccounts.length === 0 ? (
          <div className="col-span-full p-6 text-center bg-slate-900/40 rounded-lg border border-dashed border-slate-800">
            <CreditCard className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-medium">Nenhuma conta bancária vinculada</p>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
              Vincule Nubank, Itaú, XP ou outros bancos para catalogar gastos automaticamente.
            </p>
            <button
              onClick={openLinkBankModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Vincular Conta Bancária
            </button>
          </div>
        ) : (
          linkedAccounts.slice(0, 3).map((acc) => {
            const isCC = acc.type === 'credit_card';
            const limit = acc.creditLimit || 15000;
            const used = Math.abs(acc.currentBalance < 0 ? acc.currentBalance : acc.creditUsed || 0);
            const usagePercent = Math.min(100, Math.round((used / limit) * 100));

            return (
              <div
                key={acc.id}
                className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                        {acc.name}
                      </span>
                    </div>
                    {acc.cardLast4 && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        •••• {acc.cardLast4}
                      </span>
                    )}
                  </div>

                  {isCC ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-slate-400">Fatura Atual:</span>
                        <span className="text-sm font-bold text-rose-400 font-mono">
                          {formatCurrency(used, acc.currencyCode)}
                        </span>
                      </div>

                      {/* Barra de Limite */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            usagePercent > 85
                              ? 'bg-rose-500'
                              : usagePercent > 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>{usagePercent}% do limite</span>
                        <span>Disp: {formatCurrency(Math.max(0, limit - used), acc.currencyCode)}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-slate-400">Saldo Disponível:</span>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        {formatCurrency(acc.currentBalance, acc.currencyCode)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-800/80 mt-3">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sincronizado
                  </span>
                  {acc.cardClosingDay && (
                    <span>Fecha dia {acc.cardClosingDay}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resumo da Catalogação Automática de Gastos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Lançamentos Catalogados</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {autoCategorizedCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Categorizados por inteligência</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Cartão de Crédito & Débito</div>
            <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">
              {transactions.filter((t) => t.paymentMethod === 'credit_card' || t.paymentMethod === 'debit_card').length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Compras identificadas por cartão</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Débito em Conta & Recorrentes</div>
            <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">
              {recurringCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Assinaturas e contas fixas</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
