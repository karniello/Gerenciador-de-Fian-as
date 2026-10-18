import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  CalendarPlus,
  Volume2,
  VolumeX,
  Settings,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Info,
  Check,
  CalendarClock,
  Flame,
} from 'lucide-react';
import {
  requestNativeNotificationPermission,
  getNativeNotificationPermission,
  isNativeNotificationSupported,
} from '../../utils/notifications';
import { ReminderUrgency } from '../../types';

export const ReminderModal: React.FC = () => {
  const {
    isReminderModalOpen,
    closeReminderModal,
    transactions,
    accounts,
    categories,
    familyMembers,
    activeCurrencyCode,
    reminderSettings,
    updateReminderSettings,
    markTransactionAsCleared,
    postponeTransaction,
    openEditTransactionModal,
    getReminderItems,
    checkAndSendReminders,
    addToast,
  } = useFinanceStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'settings'>('all');
  const [nativePermission, setNativePermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isReminderModalOpen) {
      setNativePermission(getNativeNotificationPermission());
    }
  }, [isReminderModalOpen]);

  if (!isReminderModalOpen) return null;

  const reminderItems = getReminderItems();

  const overdueItems = reminderItems.filter((i) => i.isOverdue);
  const todayItems = reminderItems.filter((i) => i.isToday);
  const upcomingItems = reminderItems.filter((i) => i.urgency === 'upcoming');
  const futureRecurringItems = reminderItems.filter((i) => i.urgency === 'future_recurring');

  const filteredItems = reminderItems.filter((item) => {
    if (activeFilter === 'overdue') return item.isOverdue;
    if (activeFilter === 'today') return item.isToday;
    if (activeFilter === 'upcoming') return item.urgency === 'upcoming';
    return true; // 'all'
  });

  const handleRequestPermission = async () => {
    const result = await requestNativeNotificationPermission();
    setNativePermission(result);
    if (result === 'granted') {
      updateReminderSettings({ nativeNotificationsEnabled: true });
      addToast('Permissão concedida! Notificações nativas ativadas.', 'success');
      // Envia notificação de confirmação
      checkAndSendReminders(true);
    } else if (result === 'denied') {
      updateReminderSettings({ nativeNotificationsEnabled: false });
      addToast('Notificações nativas foram bloqueadas no navegador ou sistema.', 'warning');
    }
  };

  const handleTestNotification = async () => {
    setIsChecking(true);
    try {
      await checkAndSendReminders(true);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Bell className="w-5 h-5 animate-bounce duration-1000" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Lembretes & Notificações de Vencimento
                </h2>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                  {reminderItems.length} ITENS PENDENTES
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acompanhe vencimentos de contas, faturas e receba avisos nativos antes da data de expiração.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestNotification}
              disabled={isChecking}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Dispara notificação de teste nativa no sistema operacional"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Testar Notificação SO</span>
            </button>

            <button
              onClick={closeReminderModal}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas e Métricas de Vencimento */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Todos ({reminderItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('overdue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'overdue'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Atrasadas</span>
              {overdueItems.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {overdueItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Vence Hoje</span>
              {todayItems.length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {todayItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('upcoming')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'upcoming'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-sky-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Próximos {reminderSettings.daysInAdvance} Dias</span>
              {upcomingItems.length > 0 && (
                <span className="bg-sky-500/30 text-sky-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {upcomingItems.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setActiveFilter(activeFilter === 'settings' ? 'all' : 'settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeFilter === 'settings'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Regras de Notificação</span>
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Seção de Configurações das Notificações Nativas do Sistema */}
          {activeFilter === 'settings' ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Banner de Status da Permissão Nativa */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    nativePermission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      Notificações Nativas do Sistema Operacional (Desktop & OS)
                    </h3>
                    <p className="text-xs text-slate-400">
                      {nativePermission === 'granted'
                        ? 'Permissão ativa. O Alzex Finance Pro pode emitir avisos na Central de Ações do Windows/macOS.'
                        : 'Permissão necessária para exibir notificações flutuantes na área de trabalho mesmo minimizado.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {nativePermission !== 'granted' ? (
                    <button
                      onClick={handleRequestPermission}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Habilitar Notificações do SO</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-semibold">
                      <Check className="w-4 h-4" />
                      Ativo no Sistema
                    </span>
                  )}
                </div>
              </div>

              {/* Parâmetros de Antecedência e Regras */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Parâmetros de Alerta e Antecedência
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Dias de Antecedência */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Avisar com antecedência de:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { days: 0, label: 'No Dia' },
                        { days: 1, label: '1 Dia Antes' },
                        { days: 2, label: '2 Dias Antes' },
                        { days: 3, label: '3 Dias Antes' },
                        { days: 5, label: '5 Dias Antes' },
                        { days: 7, label: '7 Dias Antes' },
                      ].map((item) => (
                        <button
                          key={item.days}
                          type="button"
                          onClick={() => updateReminderSettings({ daysInAdvance: item.days })}
                          className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                            reminderSettings.daysInAdvance === item.days
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      As transações pendentes acionarão alerta visual e sonoro a partir deste intervalo.
                    </span>
                  </div>

                  {/* Efeitos e Tipos de Transação */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Opções de Disparo
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-850">
                      <div className="flex items-center gap-2.5">
                        <Volume2 className="w-4 h-4 text-sky-400" />
                        <div>
                          <span className="text-xs font-semibold text-slate-200 block">Sons de Alerta (Chime Suave)</span>
                          <span className="text-[11px] text-slate-500">Reproduz sino harmônico ao notificar</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderSettings.soundEnabled}
                        onChange={(e) => updateReminderSettings({ soundEnabled: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-850">
                      <div className="flex items-center gap-2.5">
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                        <div>
                          <span className="text-xs font-semibold text-slate-200 block">Contas a Pagar & Despesas</span>
                          <span className="text-[11px] text-slate-500">Lembrar boletos, faturas e contas pendentes</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderSettings.notifyPendingExpenses}
                        onChange={(e) => updateReminderSettings({ notifyPendingExpenses: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-850">
                      <div className="flex items-center gap-2.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs font-semibold text-slate-200 block">Receitas Agendadas & Salários</span>
                          <span className="text-[11px] text-slate-500">Avisar recebimento previsto de proventos</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderSettings.notifyPendingIncomes}
                        onChange={(e) => updateReminderSettings({ notifyPendingIncomes: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-850">
                      <div className="flex items-center gap-2.5">
                        <CalendarClock className="w-4 h-4 text-purple-400" />
                        <div>
                          <span className="text-xs font-semibold text-slate-200 block">Regras Recorrentes Agendadas</span>
                          <span className="text-[11px] text-slate-500">Monitorar assinaturas mensais programadas</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderSettings.notifyRecurring}
                        onChange={(e) => updateReminderSettings({ notifyRecurring: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Salvar e Ver Lembretes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Lista de Transações com Alertas de Vencimento */
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Nenhum vencimento pendente nesta categoria!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Todas as suas despesas e receitas agendadas estão liquidadas ou fora da janela de alerta.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const tx = item.transaction;
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const member = familyMembers.find((m) => m.id === tx.familyMemberId);

                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        item.isOverdue
                          ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                          : item.isToday
                          ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Lado Esquerdo: Badges e Dados */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: `${cat?.color || (isExpense ? '#ef4444' : '#10b981')}20`,
                            color: cat?.color || (isExpense ? '#ef4444' : '#10b981'),
                          }}
                        >
                          <IconRenderer name={cat?.icon || (isExpense ? 'TrendingDown' : 'TrendingUp')} size={20} />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Badge de Urgência */}
                            {item.isOverdue && (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                                <Flame className="w-3 h-3" />
                                ATRASADA ({Math.abs(item.daysRemaining)}d atrás)
                              </span>
                            )}
                            {item.isToday && (
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                                <Clock className="w-3 h-3" />
                                VENCE HOJE
                              </span>
                            )}
                            {item.urgency === 'upcoming' && (
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                <Calendar className="w-3 h-3" />
                                Vence em {item.daysRemaining} {item.daysRemaining === 1 ? 'dia' : 'dias'}
                              </span>
                            )}
                            {item.isScheduledRecurring && (
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                                Recorrente Mensal
                              </span>
                            )}

                            <span className="text-xs font-bold text-slate-100">{tx.payee}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              Data: <strong className="text-slate-300">{formatDateDisplay(tx.date)}</strong>
                            </span>
                            <span>•</span>
                            <span>{cat?.name || 'Geral'}</span>
                            <span>•</span>
                            <span className="text-slate-400">{acc?.name || 'Conta'}</span>
                            {member && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400">@{member.name}</span>
                              </>
                            )}
                          </div>

                          {tx.notes && (
                            <p className="text-[11px] text-slate-500 italic">
                              "{tx.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lado Direito: Valor e Botões de Ação Rápida */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                        <div className="text-right sm:mr-2">
                          <span className={`text-base font-bold font-mono block ${
                            isExpense ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {isExpense ? '-' : '+'}
                            {formatCurrency(tx.amount, tx.currencyCode || activeCurrencyCode)}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            {tx.status === 'pending' ? 'Pendente de Quitação' : 'Agendada'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Liquidar / Pagar Agora */}
                          <button
                            onClick={() => markTransactionAsCleared(tx.id)}
                            className="flex items-center gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                            title="Marcar como liquidada/compensada no saldo"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Pagar</span>
                          </button>

                          {/* Adiar +3 dias */}
                          <button
                            onClick={() => postponeTransaction(tx.id, 3)}
                            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                            title="Adiar vencimento em +3 dias"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                            <span>+3d</span>
                          </button>

                          {/* Editar no modal completo */}
                          <button
                            onClick={() => {
                              closeReminderModal();
                              openEditTransactionModal(tx);
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                            title="Abrir detalhes da transação"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Resumo Financeiro de Vencimentos */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Total a Pagar Pendente:{' '}
              <strong className="text-rose-400 font-mono">
                {formatCurrency(
                  reminderItems
                    .filter((i) => i.transaction.type === 'expense')
                    .reduce((sum, i) => sum + i.transaction.amount, 0),
                  activeCurrencyCode
                )}
              </strong>
            </span>
            <span>•</span>
            <span>
              Total a Receber Agendado:{' '}
              <strong className="text-emerald-400 font-mono">
                {formatCurrency(
                  reminderItems
                    .filter((i) => i.transaction.type === 'income')
                    .reduce((sum, i) => sum + i.transaction.amount, 0),
                  activeCurrencyCode
                )}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              {reminderSettings.nativeNotificationsEnabled
                ? 'Notificações Nativas do SO Ativas'
                : 'Notificações Nativas Desativadas'}
            </span>
            <button
              onClick={closeReminderModal}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
