import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { DashboardWidgetId } from '../../types';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { CustomizeDashboardModal } from './CustomizeDashboardModal';
import { NetWorthSummaryWidget } from './widgets/NetWorthSummaryWidget';
import { RecentTransactionsWidget } from './widgets/RecentTransactionsWidget';
import { BudgetHealthWidget } from './widgets/BudgetHealthWidget';
import { CategoryExpensesWidget } from './widgets/CategoryExpensesWidget';
import { FamilyExpensesWidget } from './widgets/FamilyExpensesWidget';
import { CurrencyRatesWidget } from './widgets/CurrencyRatesWidget';
import { CashFlowWidget } from './widgets/CashFlowWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { BankSyncWidget } from './widgets/BankSyncWidget';
import {
  SlidersHorizontal,
  LayoutGrid,
  Sparkles,
  RotateCcw,
  Plus,
  PiggyBank,
  History,
  Target,
  PieChart,
  Users,
  Coins,
  TrendingUp,
  Zap,
  Landmark,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    dashboardWidgets,
    reorderWidgets,
    setIsCustomizingDashboard,
    resetDashboardWidgets,
    applyDashboardPreset,
    activeCurrencyCode,
  } = useFinanceStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Ordenar e filtrar apenas widgets visíveis
  const visibleWidgets = [...dashboardWidgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (draggedIndex !== targetIndex) {
      // Encontrar os índices reais no array completo do store
      const sourceWidget = visibleWidgets[draggedIndex];
      const targetWidget = visibleWidgets[targetIndex];

      const fullSourceIdx = dashboardWidgets.findIndex((w) => w.id === sourceWidget.id);
      const fullTargetIdx = dashboardWidgets.findIndex((w) => w.id === targetWidget.id);

      if (fullSourceIdx !== -1 && fullTargetIdx !== -1) {
        reorderWidgets(fullSourceIdx, fullTargetIdx);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const renderWidgetContent = (id: DashboardWidgetId) => {
    switch (id) {
      case 'net_worth_summary':
        return <NetWorthSummaryWidget />;
      case 'bank_sync_summary':
        return <BankSyncWidget />;
      case 'recent_transactions':
        return <RecentTransactionsWidget />;
      case 'monthly_budget_health':
        return <BudgetHealthWidget />;
      case 'category_expenses':
        return <CategoryExpensesWidget />;
      case 'family_expenses':
        return <FamilyExpensesWidget />;
      case 'currency_rates':
        return <CurrencyRatesWidget />;
      case 'cash_flow_summary':
        return <CashFlowWidget />;
      case 'quick_actions':
        return <QuickActionsWidget />;
      default:
        return null;
    }
  };

  const getWidgetIcon = (id: DashboardWidgetId) => {
    switch (id) {
      case 'net_worth_summary':
        return <PiggyBank className="w-4 h-4 text-emerald-400" />;
      case 'bank_sync_summary':
        return <Landmark className="w-4 h-4 text-emerald-400" />;
      case 'recent_transactions':
        return <History className="w-4 h-4 text-sky-400" />;
      case 'monthly_budget_health':
        return <Target className="w-4 h-4 text-amber-400" />;
      case 'category_expenses':
        return <PieChart className="w-4 h-4 text-purple-400" />;
      case 'family_expenses':
        return <Users className="w-4 h-4 text-rose-400" />;
      case 'currency_rates':
        return <Coins className="w-4 h-4 text-yellow-400" />;
      case 'cash_flow_summary':
        return <TrendingUp className="w-4 h-4 text-teal-400" />;
      case 'quick_actions':
        return <Zap className="w-4 h-4 text-orange-400" />;
      default:
        return <LayoutGrid className="w-4 h-4 text-slate-400" />;
    }
  };

  const getColSpanClass = (id: DashboardWidgetId) => {
    switch (id) {
      case 'net_worth_summary':
      case 'bank_sync_summary':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 'category_expenses':
        return 'col-span-1 md:col-span-2 lg:col-span-2';
      case 'recent_transactions':
        return 'col-span-1 md:col-span-2 lg:col-span-2';
      case 'family_expenses':
      case 'monthly_budget_health':
      case 'currency_rates':
      case 'cash_flow_summary':
      case 'quick_actions':
      default:
        return 'col-span-1';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950">
      {/* Barra Superior do Dashboard com Controle de Layout e Personalização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-100">Painel Geral</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Moeda: {activeCurrencyCode}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão consolidada das suas finanças familiares, orçamentos e câmbio
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão Personalizar Dashboard */}
          <button
            onClick={() => setIsCustomizingDashboard(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Personalizar Dashboard</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-mono">
              {visibleWidgets.length}/{dashboardWidgets.length}
            </span>
          </button>
        </div>
      </div>

      {/* Grid Dinâmico de Widgets Ordenáveis e Toggáveis */}
      {visibleWidgets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">Nenhum widget ativo no painel</h3>
            <p className="text-xs text-slate-400 mt-1">
              Todos os blocos do dashboard foram ocultados nas configurações.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCustomizingDashboard(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Escolher Widgets
            </button>
            <button
              onClick={resetDashboardWidgets}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              Restaurar Layout Padrão
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleWidgets.map((widget, index) => {
            const isDragging = draggedIndex === index;
            const isOver = dragOverIndex === index;

            return (
              <DashboardWidgetCard
                key={widget.id}
                id={widget.id}
                title={widget.title}
                subtitle={widget.description}
                icon={getWidgetIcon(widget.id)}
                colSpanClass={getColSpanClass(widget.id)}
                index={index}
                totalWidgets={visibleWidgets.length}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={isDragging}
                isOver={isOver}
              >
                {renderWidgetContent(widget.id)}
              </DashboardWidgetCard>
            );
          })}
        </div>
      )}

      {/* Modal de Personalização do Dashboard */}
      <CustomizeDashboardModal />
    </div>
  );
};
