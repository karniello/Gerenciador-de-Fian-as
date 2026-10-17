import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FolderGit2, 
  Calendar,
  Layers
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { 
    transactions, 
    categories, 
    familyMembers, 
    projects, 
    accounts,
    activeCurrencyCode 
  } = useFinanceStore();

  const [activeReportTab, setActiveReportTab] = useState<'categories' | 'cashflow' | 'members' | 'projects'>('categories');

  // Mês Atual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Total Despesas por Categoria
  const categoryTotals: Record<string, number> = {};
  let totalExpenses = 0;
  let totalIncomes = 0;

  transactions.forEach((t) => {
    if (t.status === 'void') return;

    if (t.type === 'income') {
      totalIncomes += t.amount;
    } else if (t.type === 'expense') {
      totalExpenses += t.amount;

      if (t.isSplit && t.splits) {
        t.splits.forEach((s) => {
          categoryTotals[s.categoryId] = (categoryTotals[s.categoryId] || 0) + s.amount;
        });
      } else if (t.categoryId) {
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
      }
    }
  });

  const sortedCatList = Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const category = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: category?.name || 'Outros',
        color: category?.color || '#94a3b8',
        icon: category?.icon || 'Folder',
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // SVG Donut Chart Paths calculation
  let cumulativeAngle = 0;
  const donutSlices = sortedCatList.map((item) => {
    const sliceAngle = (item.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += sliceAngle;

    // Converter para coordenadas SVG
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (cumulativeAngle - 90) * (Math.PI / 180);

    const x1 = 100 + 75 * Math.cos(startRad);
    const y1 = 100 + 75 * Math.sin(startRad);
    const x2 = 100 + 75 * Math.cos(endRad);
    const y2 = 100 + 75 * Math.sin(endRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
    const pathData = `M 100 100 L ${x1} ${y1} A 75 75 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      pathData,
    };
  });

  // Gastos por Membro da Família
  const memberExpenses: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type !== 'expense' || t.status === 'void') return;
    if (t.isSplit && t.splits) {
      t.splits.forEach((s) => {
        const mId = s.familyMemberId || t.familyMemberId || 'fm-4';
        memberExpenses[mId] = (memberExpenses[mId] || 0) + s.amount;
      });
    } else {
      const mId = t.familyMemberId || 'fm-4';
      memberExpenses[mId] = (memberExpenses[mId] || 0) + t.amount;
    }
  });

  // Gastos por Projeto
  const projectExpenses: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type !== 'expense' || t.status === 'void' || !t.projectId) return;
    projectExpenses[t.projectId] = (projectExpenses[t.projectId] || 0) + t.amount;
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950">
      {/* Topbar com Abas de Relatórios */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Relatórios e Análise Financeira
          </h2>
          <p className="text-xs text-slate-400">
            Visão analítica de despesas, fluxo de caixa e contribuição por membro familiar.
          </p>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
          <button
            onClick={() => setActiveReportTab('categories')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeReportTab === 'categories'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Por Categoria
          </button>
          <button
            onClick={() => setActiveReportTab('cashflow')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeReportTab === 'cashflow'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fluxo de Caixa
          </button>
          <button
            onClick={() => setActiveReportTab('members')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeReportTab === 'members'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Por Membro
          </button>
          <button
            onClick={() => setActiveReportTab('projects')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeReportTab === 'projects'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Projetos Especiais
          </button>
        </div>
      </div>

      {/* ABA 1: POR CATEGORIA */}
      {activeReportTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico Donut SVG */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 self-start">
              Distribuição Visual de Despesas
            </h3>

            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {donutSlices.map((slice, i) => (
                  <path
                    key={slice.id || i}
                    d={slice.pathData}
                    fill={slice.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <title>{`${slice.name}: ${formatCurrency(slice.amount, activeCurrencyCode)} (${slice.percentage.toFixed(1)}%)`}</title>
                  </path>
                ))}
                {/* Buraco do Donut no centro */}
                <circle cx="100" cy="100" r="48" fill="#0f172a" />
              </svg>

              {/* Informação no centro do Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase">Despesas</span>
                <span className="text-xs font-bold font-mono text-rose-400">
                  {formatCurrency(totalExpenses, activeCurrencyCode)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-4 text-center">
              Passe o mouse sobre os setores para visualizar valores absolutos e percentuais.
            </p>
          </div>

          {/* Lista Detalhada das Categorias */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tabela de Despesas por Categoria
            </h3>

            <div className="space-y-3">
              {sortedCatList.map((cat) => (
                <div key={cat.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-200">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-slate-400 text-[11px]">{cat.percentage.toFixed(1)}%</span>
                      <span className="font-bold text-slate-100">
                        {formatCurrency(cat.amount, activeCurrencyCode)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: FLUXO DE CAIXA */}
      {activeReportTab === 'cashflow' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Balanço Consolidado de Fluxo de Caixa</h3>
              <p className="text-xs text-slate-400">Total de Entradas vs Saídas acumuladas</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Saldo Líquido Acumulado:</span>
              <div className={`text-base font-bold font-mono ${totalIncomes - totalExpenses >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(totalIncomes - totalExpenses, activeCurrencyCode)}
              </div>
            </div>
          </div>

          {/* Gráfico de Barras Comparativo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold">Total de Entradas</span>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    +{formatCurrency(totalIncomes, activeCurrencyCode)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-rose-500/20 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold">Total de Saídas</span>
                  <div className="text-lg font-bold font-mono text-rose-400">
                    -{formatCurrency(totalExpenses, activeCurrencyCode)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: MEMBROS DA FAMÍLIA */}
      {activeReportTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {familyMembers.map((member) => {
            const spent = memberExpenses[member.id] || 0;
            const pct = totalExpenses > 0 ? ((spent / totalExpenses) * 100).toFixed(1) : '0';

            return (
              <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{member.name}</h4>
                    <span className="text-xs text-slate-400">{member.role}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Total Gasto:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {formatCurrency(spent, activeCurrencyCode)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Participação:</span>
                    <span className="font-mono text-slate-300">{pct}% das despesas</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ABA 4: PROJETOS ESPECIAIS */}
      {activeReportTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const spent = projectExpenses[proj.id] || 0;
            const limit = proj.budgetLimit || 10000;
            const pct = Math.round((spent / limit) * 100);

            return (
              <div key={proj.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.color }}></span>
                    <h4 className="text-sm font-bold text-slate-100">{proj.name}</h4>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{proj.description || 'Sem descrição'}</p>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Gasto Atual:</span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(spent, activeCurrencyCode)} / {formatCurrency(limit, activeCurrencyCode)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, pct)}%`, backgroundColor: proj.color }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono text-right">{pct}% do limite atingido</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
