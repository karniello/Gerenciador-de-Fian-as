/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useFinanceStore } from './store/useFinanceStore';
import { DesktopTitlebar } from './components/layout/DesktopTitlebar';
import { Sidebar } from './components/layout/Sidebar';
import { TransactionGrid } from './components/transactions/TransactionGrid';
import { DashboardView } from './components/dashboard/DashboardView';
import { BudgetManager } from './components/budgets/BudgetManager';
import { ReportsView } from './components/reports/ReportsView';
import { RecurringView } from './components/recurring/RecurringView';
import { ArchitectureView } from './components/electron-view/ArchitectureView';
import { CategoryManager } from './components/categories/CategoryManager';
import { FinancialCalendarView } from './components/calendar/FinancialCalendarView';
import { CurrencyExchangeView } from './components/currencies/CurrencyExchangeView';
import { BankConnectionsView } from './components/banking/BankConnectionsView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { AccountModal } from './components/accounts/AccountModal';
import { ReminderModal } from './components/reminders/ReminderModal';
import { ToastContainer } from './components/common/ToastContainer';

export default function App() {
  const { activeTab, checkAndSendReminders, reminderSettings } = useFinanceStore();

  // Rotina em segundo plano para monitoramento automático de transações vencidas ou próximas
  useEffect(() => {
    // Verificação inicial após inicialização
    const timer = setTimeout(() => {
      checkAndSendReminders(false);
    }, 2000);

    // Verificação periódica a cada 30 minutos
    const interval = setInterval(() => {
      if (reminderSettings.enabled) {
        checkAndSendReminders(false);
      }
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkAndSendReminders, reminderSettings.enabled]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Barra de Título Desktop Estilo Electron */}
      <DesktopTitlebar />

      {/* 2. Área de Trabalho Principal (Sidebar + Conteúdo Ativo) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Barra Lateral com Árvore de Contas e Membros */}
        <Sidebar />

        {/* Visão Ativa do Sistema */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'transactions' && <TransactionGrid />}
          {activeTab === 'open_banking' && <BankConnectionsView />}
          {activeTab === 'calendar' && <FinancialCalendarView />}
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'currencies' && <CurrencyExchangeView />}
          {activeTab === 'budgets' && <BudgetManager />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'recurring' && <RecurringView />}
          {activeTab === 'architecture' && <ArchitectureView />}
        </main>
      </div>

      {/* 3. Modais Globais de Lançamento e Configuração */}
      <TransactionModal />
      <AccountModal />
      <ReminderModal />

      {/* 4. Notificações Toast do Sistema */}
      <ToastContainer />
    </div>
  );
}
