import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { DashboardLayoutPreset, DashboardWidgetId } from '../../types';
import {
  GripVertical,
  Check,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  X,
  LayoutGrid,
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

const WIDGET_ICONS: Record<DashboardWidgetId, React.ReactNode> = {
  net_worth_summary: <PiggyBank className="w-4 h-4 text-emerald-400" />,
  bank_sync_summary: <Landmark className="w-4 h-4 text-emerald-400" />,
  recent_transactions: <History className="w-4 h-4 text-sky-400" />,
  monthly_budget_health: <Target className="w-4 h-4 text-amber-400" />,
  category_expenses: <PieChart className="w-4 h-4 text-purple-400" />,
  family_expenses: <Users className="w-4 h-4 text-rose-400" />,
  currency_rates: <Coins className="w-4 h-4 text-yellow-400" />,
  cash_flow_summary: <TrendingUp className="w-4 h-4 text-teal-400" />,
  quick_actions: <Zap className="w-4 h-4 text-orange-400" />,
};

export const CustomizeDashboardModal: React.FC = () => {
  const {
    dashboardWidgets,
    isCustomizingDashboard,
    setIsCustomizingDashboard,
    toggleWidgetVisibility,
    setWidgetVisibility,
    moveWidget,
    reorderWidgets,
    applyDashboardPreset,
    resetDashboardWidgets,
  } = useFinanceStore();

  const [draggedWidgetIndex, setDraggedWidgetIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!isCustomizingDashboard) return null;

  // Ordenar widgets por order
  const sortedWidgets = [...dashboardWidgets].sort((a, b) => a.order - b.order);
  const visibleCount = sortedWidgets.filter((w) => w.visible).length;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedWidgetIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedWidgetIndex === null || draggedWidgetIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedWidgetIndex === null) return;
    if (draggedWidgetIndex !== targetIndex) {
      reorderWidgets(draggedWidgetIndex, targetIndex);
    }
    setDraggedWidgetIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Personalizar Dashboard</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {visibleCount} de {sortedWidgets.length} visíveis
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Arraste os blocos ou use os controles para reordenar, adicionar e ocultar widgets.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomizingDashboard(false)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Presets Rápidos */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Modelos Rápidos:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => applyDashboardPreset('default')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Padrão Completo
              </button>
              <button
                onClick={() => applyDashboardPreset('budget_focus')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Foco em Orçamento
              </button>
              <button
                onClick={() => applyDashboardPreset('minimalist')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Visão Minimalista
              </button>
              <button
                onClick={() => applyDashboardPreset('multi_currency')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Multi-Moedas
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Widgets Ordenáveis e Toggáveis */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1 bg-slate-950/20">
          {sortedWidgets.map((widget, index) => {
            const isDragging = draggedWidgetIndex === index;
            const isOver = dragOverIndex === index;

            return (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 ${
                  widget.visible
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                } ${isDragging ? 'opacity-40 border-dashed border-emerald-500 scale-[0.98]' : ''} ${
                  isOver ? 'border-t-2 border-t-emerald-500 bg-emerald-500/5' : ''
                }`}
              >
                {/* Lado Esquerdo: Grip Handle, Ícone e Textos */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-colors flex-shrink-0"
                    title="Arraste para reordenar"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center flex-shrink-0">
                    {WIDGET_ICONS[widget.id] || <LayoutGrid className="w-4 h-4 text-slate-400" />}
                  </div>

                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {widget.title}
                      </span>
                      {widget.visible ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Visível
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          Oculto
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {widget.description}
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Setas de Ordem e Toggle de Visibilidade */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Botões Mover para Cima e Mover para Baixo */}
                  <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
                    <button
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveWidget(widget.id, 'down')}
                      disabled={index === sortedWidgets.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle de Visibilidade */}
                  <button
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      widget.visible
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {widget.visible ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Exibindo</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Oculto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com Ações */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={resetDashboardWidgets}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            onClick={() => setIsCustomizingDashboard(false)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Concluir Personalização</span>
          </button>
        </div>
      </div>
    </div>
  );
};
