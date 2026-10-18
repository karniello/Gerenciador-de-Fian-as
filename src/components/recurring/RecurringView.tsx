import React from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  CalendarClock, 
  Plus, 
  Repeat, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Bell,
  AlertTriangle,
  Send,
  ArrowRight,
  Flame
} from 'lucide-react';

export const RecurringView: React.FC = () => {
  const { 
    transactions, 
    accounts, 
    categories, 
    familyMembers, 
    openNewTransactionModal, 
    activeCurrencyCode,
    openReminderModal,
    getReminderItems,
    checkAndSendReminders,
  } = useFinanceStore();

  const reminderItems = getReminderItems();
  const urgentReminders = reminderItems.filter(
    (i) => i.isOverdue || i.isToday || i.urgency === 'upcoming'
  );

  const recurringTransactions = transactions.filter((t) => t.isRecurring);

  const totalMonthlyCommitments = recurringTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMonthlyIncomeCommitments = recurringTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-emerald-400" />
            Transações Agendadas e Recorrentes
          </h2>
          <p className="text-xs text-slate-400">
            Previsão e controle de despesas e receitas automáticas (Salários, Contas de Consumo, Assinaturas).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openReminderModal}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              urgentReminders.length > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Lembretes & Alertas</span>
            {urgentReminders.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {urgentReminders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => openNewTransactionModal()}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Regra Recorrente</span>
          </button>
        </div>
      </div>

      {/* Banner de Lembretes se houver itens urgentes */}
      {urgentReminders.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300">
                Atenção: Existem {urgentReminders.length} transações pendentes ou agendadas requerendo atenção!
              </h4>
              <p className="text-[11px] text-slate-400">
                {urgentReminders.filter(i => i.isOverdue).length} conta(s) atrasada(s) e {urgentReminders.filter(i => i.isToday).length} vencendo no dia de hoje.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => checkAndSendReminders(true)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Notificar SO</span>
            </button>
            <button
              onClick={openReminderModal}
              className="text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Gerenciar Lembretes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Cards de Comprometimento Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Receitas Fixas Agendadas</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            +{formatCurrency(totalMonthlyIncomeCommitments, activeCurrencyCode)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Salários e proventos garantidos</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Despesas Fixas Comprometidas</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            -{formatCurrency(totalMonthlyCommitments, activeCurrencyCode)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{recurringTransactions.filter(t => t.type === 'expense').length} contratos ativos</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Margem Livre Projetada</span>
          <div className="text-xl font-bold font-mono text-sky-400 mt-1">
            {formatCurrency(totalMonthlyIncomeCommitments - totalMonthlyCommitments, activeCurrencyCode)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Saldo operacional antes de gastos variáveis</span>
        </div>
      </div>

      {/* Lista de Recorrências */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Recorrências Cadastradas no SQLite
          </h3>
          <span className="text-xs text-slate-500 font-mono">{recurringTransactions.length} registros</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recurringTransactions.map((t) => {
            const acc = accounts.find((a) => a.id === t.accountId);
            const cat = categories.find((c) => c.id === t.categoryId);
            const member = familyMembers.find((m) => m.id === t.familyMemberId);

            return (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      t.type === 'expense' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{t.payee}</span>
                      <span className="text-[10px] font-mono bg-slate-800 text-sky-400 px-1.5 py-0.2 rounded border border-slate-700">
                        {t.recurrenceFrequency === 'yearly' ? 'Anual' : t.recurrenceFrequency === 'weekly' ? 'Semanal' : 'Mensal'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Conta: {acc?.name}</span>
                      <span>•</span>
                      <span>Categoria: {cat?.name || 'Geral'}</span>
                      {member && (
                        <>
                          <span>•</span>
                          <span>{member.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-mono font-bold ${
                      t.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {t.type === 'expense' ? '-' : '+'}
                    {formatCurrency(t.amount, t.currencyCode || activeCurrencyCode)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Próxima: dia {t.date.split('-')[2]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
