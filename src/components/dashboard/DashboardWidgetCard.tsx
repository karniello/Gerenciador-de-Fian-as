import React, { useState } from 'react';
import { GripVertical, EyeOff, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { DashboardWidgetId } from '../../types';
import { useFinanceStore } from '../../store/useFinanceStore';

interface DashboardWidgetCardProps {
  id: DashboardWidgetId;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  colSpanClass?: string;
  children: React.ReactNode;
  index: number;
  totalWidgets: number;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isOver?: boolean;
}

export const DashboardWidgetCard: React.FC<DashboardWidgetCardProps> = ({
  id,
  title,
  subtitle,
  icon,
  headerAction,
  colSpanClass = 'col-span-1',
  children,
  index,
  totalWidgets,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
  isOver = false,
}) => {
  const { toggleWidgetVisibility, moveWidget } = useFinanceStore();
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  return (
    <div
      onDragOver={(e) => onDragOver?.(e, index)}
      onDrop={(e) => onDrop?.(e, index)}
      className={`group bg-slate-900 border border-slate-800 rounded-xl shadow-sm transition-all duration-200 flex flex-col overflow-hidden ${colSpanClass} ${
        isDragging ? 'opacity-30 border-dashed border-emerald-500 scale-[0.99]' : 'hover:border-slate-700/80'
      } ${isOver ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950 bg-emerald-500/5' : ''}`}
    >
      {/* Barra de Título do Widget com Drag Handle e Controles Rápidos */}
      <div
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Alça de Arraste (Drag Handle) */}
          <div
            draggable
            onDragStart={(e) => onDragStart?.(e, index)}
            onDragEnd={onDragEnd}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-emerald-400 p-1 -ml-1 rounded hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Arraste para reordenar este widget"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {icon && <div className="flex-shrink-0 text-slate-400">{icon}</div>}

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate -mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {headerAction}

          {/* Controles de ordenação rápida ao passar o mouse ou focar */}
          <div
            className={`flex items-center gap-0.5 bg-slate-800/70 rounded-lg p-0.5 border border-slate-700/50 transition-opacity duration-150 ${
              isHeaderHovered ? 'opacity-100' : 'opacity-0 md:opacity-40 hover:opacity-100'
            }`}
          >
            <button
              onClick={() => moveWidget(id, 'up')}
              disabled={index === 0}
              className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20 hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Mover widget para cima"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveWidget(id, 'down')}
              disabled={index === totalWidgets - 1}
              className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20 hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Mover widget para baixo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-slate-700 mx-0.5" />
            <button
              onClick={() => toggleWidgetVisibility(id)}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Ocultar este widget do painel"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo do Widget */}
      <div className="p-5 flex-1 flex flex-col justify-between">{children}</div>
    </div>
  );
};
