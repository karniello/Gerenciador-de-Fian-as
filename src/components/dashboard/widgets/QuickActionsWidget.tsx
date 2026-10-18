import React from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Target,
  Database,
  Calendar,
  Layers,
  Coins,
} from 'lucide-react';

export const QuickActionsWidget: React.FC = () => {
  const {
    openNewTransactionModal,
    setActiveTab,
    generateSqlDump,
    addToast,
  } = useFinanceStore();

  const handleDownloadSql = () => {
    try {
      const dump = generateSqlDump();
      const blob = new Blob([dump], { type: 'application/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sqlite_backup_${new Date().toISOString().slice(0, 10)}.sql`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Backup SQL gerado e baixado com sucesso!', 'success');
    } catch (e) {
      addToast('Erro ao exportar banco de dados', 'error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => openNewTransactionModal('expense')}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-left transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-200 group-hover:text-rose-300">Nova Despesa</div>
            <div className="text-[10px] text-slate-400">Registrar saída</div>
          </div>
        </button>

        <button
          onClick={() => openNewTransactionModal('income')}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 text-left transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">Nova Receita</div>
            <div className="text-[10px] text-slate-400">Registrar entrada</div>
          </div>
        </button>

        <button
          onClick={() => openNewTransactionModal('transfer')}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-sky-500/10 border border-slate-800 hover:border-sky-500/30 text-left transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300">Transferência</div>
            <div className="text-[10px] text-slate-400">Entre contas / Câmbio</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('currencies')}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/30 text-left transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
            <Coins className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">Câmbio & Moedas</div>
            <div className="text-[10px] text-slate-400">Remessas e cotações</div>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handleDownloadSql}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Exportar Dump SQLite</span>
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors cursor-pointer"
        >
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>Metas e Tetos</span>
        </button>
      </div>
    </div>
  );
};
