import React from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import { 
  Minus, 
  Square, 
  X, 
  Search, 
  Plus, 
  ArrowRightLeft, 
  TrendingDown, 
  TrendingUp, 
  Database,
  Coins
} from 'lucide-react';

export const DesktopTitlebar: React.FC = () => {
  const { 
    accounts, 
    activeCurrencyCode, 
    currencies, 
    setActiveCurrencyCode, 
    openNewTransactionModal,
    searchQuery,
    setSearchQuery,
    setActiveTab,
    activeTab
  } = useFinanceStore();

  // Calcular Patrimônio Líquido Total convertido para a moeda ativa
  const activeCurrency = currencies.find(c => c.code === activeCurrencyCode) || currencies[0];

  const netWorth = accounts.reduce((acc, account) => {
    const accCurrency = currencies.find(c => c.code === account.currencyCode) || currencies[0];
    // Converter para base (BRL) e depois para a moeda ativa
    const inBrl = account.currentBalance * (accCurrency.rateToBase || 1.0);
    const inActiveCurrency = inBrl / (activeCurrency.rateToBase || 1.0);
    return acc + inActiveCurrency;
  }, 0);

  const handleMinimize = () => {
    // @ts-ignore
    if (window.alzexApi?.window?.minimize) {
      // @ts-ignore
      window.alzexApi.window.minimize();
    }
  };

  const handleMaximize = () => {
    // @ts-ignore
    if (window.alzexApi?.window?.maximize) {
      // @ts-ignore
      window.alzexApi.window.maximize();
    }
  };

  const handleClose = () => {
    // @ts-ignore
    if (window.alzexApi?.window?.close) {
      // @ts-ignore
      window.alzexApi.window.close();
    }
  };

  return (
    <header className="h-12 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-3 select-none z-40 sticky top-0">
      {/* Esquerda: Identidade do App + Arquivo Ativo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-sm">
            A
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-tight text-slate-100">ALZEX FINANCE</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-1.5 py-0.2 rounded border border-emerald-500/20">PRO</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              familia_silva.db (SQLite WAL)
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="h-5 w-[1px] bg-slate-800 mx-1"></div>

        {/* Patrimônio Líquido em Destaque */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 px-2.5 py-1 rounded-md">
          <span className="text-[11px] text-slate-400 font-medium">Patrimônio Líquido:</span>
          <span className={`text-xs font-bold font-mono ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netWorth, activeCurrencyCode)}
          </span>
        </div>
      </div>

      {/* Centro: Busca Rápida + Seletor de Moeda */}
      <div className="flex items-center gap-2 max-w-md w-full mx-4">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por beneficiário, notas, tags ou valor..."
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-md pl-8 pr-3 py-1.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Seletor de Moeda */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-md p-0.5">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setActiveCurrencyCode(curr.code)}
              className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                activeCurrencyCode === curr.code
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`${curr.name} (1 ${curr.code} = ${(1 / curr.rateToBase).toFixed(2)} BRL)`}
            >
              {curr.code}
            </button>
          ))}
        </div>
      </div>

      {/* Direita: Ações Rápidas + Controles Desktop */}
      <div className="flex items-center gap-2">
        {/* Botão + Despesa */}
        <button
          onClick={() => openNewTransactionModal('expense')}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
          title="Nova Despesa (Ctrl+D)"
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Despesa</span>
        </button>

        {/* Botão + Receita */}
        <button
          onClick={() => openNewTransactionModal('income')}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
          title="Nova Receita (Ctrl+R)"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Receita</span>
        </button>

        {/* Botão Transferência */}
        <button
          onClick={() => openNewTransactionModal('transfer')}
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
          title="Transferência entre Contas"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Transferir</span>
        </button>

        {/* Botão Arquitetura & SQLite */}
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
            activeTab === 'architecture'
              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
          }`}
          title="Ver Schema Drizzle, Electron IPC & Dump SQLite"
        >
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden xl:inline">Arquitetura & SQLite</span>
        </button>

        {/* Controles de Janela Nativos do Desktop */}
        <div className="flex items-center gap-1 ml-1 border-l border-slate-800 pl-2">
          <button
            onClick={handleMinimize}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Minimizar Janela"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Maximizar Janela"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-rose-600 hover:text-white transition-colors"
            title="Fechar Aplicativo (Executa Auto-Backup)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
