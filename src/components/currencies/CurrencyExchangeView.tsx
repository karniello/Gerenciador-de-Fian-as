import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { Currency } from '../../types';
import {
  Coins,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Globe,
  Landmark,
  Calculator,
  Percent,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  PieChart,
  ShieldCheck,
  Search,
  ExternalLink,
} from 'lucide-react';

interface PresetCurrency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToBase: number;
}

const POPULAR_CURRENCIES: PresetCurrency[] = [
  { code: 'USD', name: 'Dólar Americano', symbol: 'US$', flag: '🇺🇸', rateToBase: 5.65 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToBase: 6.15 },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧', rateToBase: 7.35 },
  { code: 'CAD', name: 'Dólar Canadense', symbol: 'C$', flag: '🇨🇦', rateToBase: 4.12 },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥', flag: '🇯🇵', rateToBase: 0.038 },
  { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF', flag: '🇨🇭', rateToBase: 6.48 },
  { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$', flag: '🇦🇺', rateToBase: 3.75 },
  { code: 'ARS', name: 'Peso Argentino', symbol: 'ARS$', flag: '🇦🇷', rateToBase: 0.0058 },
  { code: 'CLP', name: 'Peso Chileno', symbol: 'CLP$', flag: '🇨🇱', rateToBase: 0.006 },
  { code: 'CNY', name: 'Yuan Chinês', symbol: '¥', flag: '🇨🇳', rateToBase: 0.79 },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '⚡', rateToBase: 385000.0 },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', flag: '🔷', rateToBase: 15200.0 },
];

export const CurrencyExchangeView: React.FC = () => {
  const {
    currencies,
    accounts,
    rateLogs,
    isFetchingRates,
    lastRatesFetchTime,
    updateExchangeRate,
    saveCurrency,
    deleteCurrency,
    setBaseCurrency,
    fetchLiveExchangeRates,
    convertCurrency,
    executeMultiCurrencyTransfer,
    activeCurrencyCode,
    setActiveCurrencyCode,
    addToast,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'rates' | 'transfer' | 'portfolio'>('rates');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados do Modal de Edição/Criação de Moeda
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formFlag, setFormFlag] = useState('');
  const [formRate, setFormRate] = useState<number>(1.0);
  const [formIsBase, setFormIsBase] = useState(false);

  // Estados do Conversor & Transferência entre Contas
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(
    accounts.find((a) => a.id !== accounts[0]?.id)?.id || accounts[1]?.id || ''
  );
  const [transferAmount, setTransferAmount] = useState<number>(1000);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [isCustomRateActive, setIsCustomRateActive] = useState(false);
  const [iofPercent, setIofPercent] = useState<number>(1.1); // Padrão transferência mesma titularidade internacional
  const [spreadPercent, setSpreadPercent] = useState<number>(1.5); // Spread bancário comercial
  const [transferPayee, setTransferPayee] = useState('Remessa Internacional de Câmbio');
  const [transferNotes, setTransferNotes] = useState('');

  // Estados do Conversor Livre
  const [freeFromCode, setFreeFromCode] = useState('USD');
  const [freeToCode, setFreeToCode] = useState('BRL');
  const [freeAmount, setFreeAmount] = useState<number>(100);

  // Moeda Base Atual
  const baseCurrency = currencies.find((c) => c.isBase) || currencies[0];

  // Contas Selecionadas
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const fromCurr = currencies.find((c) => c.code === fromAccount?.currencyCode) || currencies[0];
  const toCurr = currencies.find((c) => c.code === toAccount?.currencyCode) || currencies[0];

  // Taxa de Câmbio Oficial entre as duas contas:
  // 1 fromCurr = ((fromCurr.rateToBase || 1) / (toCurr.rateToBase || 1)) toCurr
  const nominalRate = (fromCurr?.rateToBase || 1.0) / (toCurr?.rateToBase || 1.0);
  const effectiveNominalRate = isCustomRateActive && customRate && customRate > 0 ? customRate : nominalRate;

  // Cálculo com IOF e Spread
  // Se for conversão com spread bancário: taxa efetiva líquida
  const spreadMultiplier = 1 - spreadPercent / 100;
  const effectiveRateWithSpread = effectiveNominalRate * spreadMultiplier;
  const iofCost = transferAmount * (iofPercent / 100);
  const convertedTargetAmount = Math.round(transferAmount * effectiveRateWithSpread * 100) / 100;

  // Filtragem de Moedas na Tabela
  const filteredCurrencies = currencies.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  // Abertura do Modal de Moeda
  const handleOpenNewCurrencyModal = () => {
    setEditingCurrency(null);
    setFormCode('');
    setFormName('');
    setFormSymbol('');
    setFormFlag('🌐');
    setFormRate(1.0);
    setFormIsBase(false);
    setIsCurrencyModalOpen(true);
  };

  const handleOpenEditCurrencyModal = (curr: Currency) => {
    setEditingCurrency(curr);
    setFormCode(curr.code);
    setFormName(curr.name);
    setFormSymbol(curr.symbol);
    setFormFlag(curr.flag || '🌐');
    setFormRate(curr.rateToBase);
    setFormIsBase(curr.isBase);
    setIsCurrencyModalOpen(true);
  };

  const handleApplyPreset = (preset: PresetCurrency) => {
    setFormCode(preset.code);
    setFormName(preset.name);
    setFormSymbol(preset.symbol);
    setFormFlag(preset.flag);
    setFormRate(preset.rateToBase);
  };

  const handleSaveCurrencyForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      addToast('O código da moeda (ex: USD) é obrigatório.', 'error');
      return;
    }
    if (!formName.trim()) {
      addToast('O nome da moeda é obrigatório.', 'error');
      return;
    }
    if (formRate <= 0) {
      addToast('A cotação em relação à moeda base deve ser maior que zero.', 'error');
      return;
    }

    saveCurrency({
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      symbol: formSymbol.trim() || formCode.trim().toUpperCase(),
      flag: formFlag.trim() || '🌐',
      rateToBase: Number(formRate),
      isBase: formIsBase,
      source: 'manual',
      lastUpdated: new Date().toISOString(),
    });

    setIsCurrencyModalOpen(false);
  };

  // Efetivar Transferência Multi-Moeda
  const handleExecuteTransfer = () => {
    if (!fromAccount || !toAccount) {
      addToast('Selecione contas de origem e destino válidas.', 'error');
      return;
    }
    if (fromAccount.id === toAccount.id) {
      addToast('A conta de origem e destino devem ser diferentes.', 'error');
      return;
    }
    if (transferAmount <= 0) {
      addToast('Informe um valor de transferência maior que zero.', 'error');
      return;
    }

    const totalDebit = transferAmount + iofCost;
    if (fromAccount.currentBalance < totalDebit) {
      const confirmProceed = window.confirm(
        `Atenção: O saldo da conta ${fromAccount.name} (${formatCurrency(fromAccount.currentBalance, fromAccount.currencyCode)}) é menor que o débito total (${formatCurrency(totalDebit, fromAccount.currencyCode)}). Deseja continuar mesmo assim?`
      );
      if (!confirmProceed) return;
    }

    executeMultiCurrencyTransfer({
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      fromAmount: transferAmount,
      toAmount: convertedTargetAmount,
      exchangeRate: effectiveRateWithSpread,
      feeAmount: iofCost > 0 ? Math.round(iofCost * 100) / 100 : undefined,
      date: new Date().toISOString().split('T')[0],
      payee: transferPayee.trim() || `Câmbio ${fromAccount.name} ➔ ${toAccount.name}`,
      notes: `${transferNotes ? `${transferNotes}\n` : ''}Câmbio Realizado: ${transferAmount} ${fromAccount.currencyCode} ➔ ${convertedTargetAmount} ${toAccount.currencyCode}\nTaxa Nominal: ${effectiveNominalRate.toFixed(4)} | Spread: ${spreadPercent}% | IOF (${iofPercent}%): ${iofCost.toFixed(2)} ${fromAccount.currencyCode}`,
    });
  };

  // Conversor Livre
  const freeConverted = convertCurrency(freeAmount, freeFromCode, freeToCode);
  const freeRate = convertCurrency(1, freeFromCode, freeToCode);

  // Patrimônio Consolidado Multi-Moeda
  const totalNetWorthInActive = accounts.reduce((acc, account) => {
    const accCurr = currencies.find((c) => c.code === account.currencyCode) || currencies[0];
    const inBase = account.currentBalance * (accCurr.rateToBase || 1.0);
    const refCurr = currencies.find((c) => c.code === activeCurrencyCode) || currencies[0];
    const inActive = inBase / (refCurr.rateToBase || 1.0);
    return acc + inActive;
  }, 0);

  // Agrupamento de Saldo por Moeda
  const balancesByCurrency = currencies.map((curr) => {
    const matchedAccounts = accounts.filter((a) => a.currencyCode === curr.code);
    const nativeTotal = matchedAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const inBase = nativeTotal * (curr.rateToBase || 1.0);
    const refCurr = currencies.find((c) => c.code === activeCurrencyCode) || currencies[0];
    const convertedToActive = inBase / (refCurr.rateToBase || 1.0);

    return {
      currency: curr,
      accountsCount: matchedAccounts.length,
      nativeTotal,
      convertedToActive,
    };
  }).filter((b) => b.accountsCount > 0 || b.currency.isBase);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Header do Módulo */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-amber-500/10 text-white font-bold">
            <Coins className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Câmbio, Cotações Diárias & Multi-Moedas
              </h1>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                Moeda Base: {baseCurrency.code} ({baseCurrency.name})
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Taxas de câmbio comerciais diárias, transferências com conversão entre contas e patrimônio global.
            </p>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchLiveExchangeRates()}
            disabled={isFetchingRates}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isFetchingRates
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-600/20'
            }`}
            title="Buscar cotações online atualizadas de APIs de câmbio"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin' : ''}`} />
            <span>{isFetchingRates ? 'Buscando Cotações...' : 'Atualizar Cotações Online'}</span>
          </button>

          <button
            onClick={handleOpenNewCurrencyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nova Moeda</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Navegação entre Sub-Abas */}
      <div className="px-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'rates'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Cotações do Mercado ({currencies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transfer')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'transfer'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Conversor & Transferência entre Contas</span>
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'portfolio'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Patrimônio Global Consolidado</span>
          </button>
        </div>

        {/* Última atualização */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Última atualização:</span>
          <span className="font-mono text-slate-300">
            {lastRatesFetchTime ? formatDateDisplay(lastRatesFetchTime.split('T')[0]) + ' ' + (lastRatesFetchTime.split('T')[1] || '').substring(0, 5) : 'Hoje'}
          </span>
        </div>
      </div>

      {/* 3. Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ============================================================== */}
        {/* ABA 1: TABELA DE COTAÇÕES E GERENCIAMENTO DE MOEDAS */}
        {/* ============================================================== */}
        {activeTab === 'rates' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* KPI Cards Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 font-medium">Moeda Base do Sistema</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl">{baseCurrency.flag || '🇧🇷'}</span>
                  <span className="text-sm font-bold text-slate-100">{baseCurrency.code}</span>
                  <span className="text-xs text-slate-400 font-mono">({baseCurrency.symbol})</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                  <Check className="w-3 h-3" /> 1 {baseCurrency.code} = 1.0000 Base
                </span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 font-medium">Moedas no Catálogo</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-slate-100">{currencies.length} Moedas Ativas</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {currencies.filter((c) => c.source === 'api').length} automáticas / {currencies.filter((c) => c.source !== 'api').length} manuais
                </span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 font-medium">Contas com Moeda Estrangeira</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-slate-100">
                    {accounts.filter((a) => a.currencyCode !== baseCurrency.code).length} Contas
                  </span>
                  <span className="text-xs text-slate-400">
                    ({accounts.map((a) => a.currencyCode).filter((v, i, arr) => arr.indexOf(v) === i).length} moedas em uso)
                  </span>
                </div>
                <span className="text-[10px] text-sky-400 mt-1 block font-mono">
                  Nomad Global USD, etc.
                </span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 font-medium">Provedor de Câmbio Online</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-200">Open Exchange / Banco Central</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Sem taxas • API pública gratuita
                </span>
              </div>
            </div>

            {/* Barra de Filtro e Busca */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por código (USD, EUR...), nome ou símbolo..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Visualizar Cotações em relação a:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {currencies.slice(0, 4).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setBaseCurrency(c.code)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        c.isBase
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c.flag} {c.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid / Tabela de Cotações */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Cotações Diárias de Câmbio
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {filteredCurrencies.length} moedas listadas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Moeda</th>
                      <th className="py-2.5 px-3">Código / Símbolo</th>
                      <th className="py-2.5 px-3 text-right">Cotação ({baseCurrency.code})</th>
                      <th className="py-2.5 px-3 text-right">Cotação Inversa</th>
                      <th className="py-2.5 px-3 text-center">Variação 24h</th>
                      <th className="py-2.5 px-3">Fonte</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {filteredCurrencies.map((curr) => {
                      const isBase = curr.isBase;
                      // 1 curr = curr.rateToBase baseCurrency
                      const rateToBase = curr.rateToBase || 1.0;
                      // 1 baseCurrency = 1 / curr.rateToBase curr
                      const inverseRate = rateToBase > 0 ? 1 / rateToBase : 0;
                      const change = curr.change24h || 0;

                      return (
                        <tr
                          key={curr.code}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isBase ? 'bg-emerald-950/15' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-sans font-medium text-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xl select-none">{curr.flag || '🌐'}</span>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                                  {curr.name}
                                  {isBase && (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                                      BASE
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {curr.code}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-200">{curr.code}</span>
                            <span className="text-slate-400 ml-1.5 text-[11px]">({curr.symbol})</span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-slate-100">
                              1 {curr.code} = {rateToBase.toFixed(4)} {baseCurrency.code}
                            </div>
                            <span className="text-[10px] text-slate-500 font-sans">
                              {formatCurrency(rateToBase, baseCurrency.code)}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right text-slate-400">
                            1 {baseCurrency.code} = {inverseRate.toFixed(4)} {curr.code}
                          </td>

                          <td className="py-3 px-3 text-center">
                            {isBase ? (
                              <span className="text-slate-500 text-[11px]">—</span>
                            ) : change > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                <TrendingUp className="w-3 h-3" />
                                +{change.toFixed(2)}%
                              </span>
                            ) : change < 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                <TrendingDown className="w-3 h-3" />
                                {change.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                                0.00%
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-sans">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                curr.source === 'api'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                              }`}
                            >
                              {curr.source === 'api' ? 'API Online' : 'Manual'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isBase && (
                                <button
                                  onClick={() => setBaseCurrency(curr.code)}
                                  className="text-[10px] font-semibold text-slate-400 hover:text-emerald-300 hover:bg-slate-800 px-2 py-1 rounded transition-colors cursor-pointer"
                                  title="Tornar esta moeda a referência base do sistema"
                                >
                                  Tornar Base
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditCurrencyModal(curr)}
                                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                title="Editar cotação manualmente"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {!isBase && (
                                <button
                                  onClick={() => deleteCurrency(curr.code)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                  title="Excluir moeda do catálogo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Histórico Recente de Atualizações de Câmbio (Rate Logs) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold text-slate-200">
                    Registro de Alterações de Câmbio (Audit Log)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {rateLogs?.length || 0} registros gravados
                </span>
              </div>

              <div className="p-3 overflow-x-auto">
                {rateLogs && rateLogs.length > 0 ? (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-2">Data / Hora</th>
                        <th className="py-1.5 px-2">Moeda</th>
                        <th className="py-1.5 px-2 text-right">Nova Cotação</th>
                        <th className="py-1.5 px-2 text-right">Cotação Anterior</th>
                        <th className="py-1.5 px-2 text-center">Origem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {rateLogs.slice(0, 6).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="py-2 px-2 text-slate-400">
                            {formatDateDisplay(log.timestamp.split('T')[0])} {log.timestamp.split('T')[1]?.substring(0, 8)}
                          </td>
                          <td className="py-2 px-2 font-bold text-slate-100">{log.currencyCode}</td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-400">
                            {Number(log.rate).toFixed(4)} {baseCurrency.code}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-400">
                            {log.previousRate ? Number(log.previousRate).toFixed(4) : '—'}
                          </td>
                          <td className="py-2 px-2 text-center font-sans">
                            <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                              {log.source === 'api' ? 'API Online' : 'Manual'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Nenhuma alteração recente registrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 2: CONVERSOR & TRANSFERÊNCIA ENTRE CONTAS */}
        {/* ============================================================== */}
        {activeTab === 'transfer' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Bloco 1: Transferência Real entre Contas com Conversão */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">
                      Transferência com Conversão entre Contas
                    </h2>
                    <p className="text-xs text-slate-400">
                      Debite o valor na moeda de origem e credite o valor convertido na conta de destino em SQLite.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono font-semibold">
                  1 {fromCurr.code} = {effectiveRateWithSpread.toFixed(4)} {toCurr.code}
                </span>
              </div>

              {/* Grid Contas Origem e Destino */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Conta Origem */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      Conta de Origem (Débito)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Saldo: {formatCurrency(fromAccount?.currentBalance || 0, fromAccount?.currencyCode)}
                    </span>
                  </div>

                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — {formatCurrency(acc.currentBalance, acc.currencyCode)} ({acc.currencyCode})
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Valor a Enviar ({fromAccount?.currencyCode})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">
                        {fromCurr.symbol}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={transferAmount || ''}
                        onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm font-mono font-bold rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Conta Destino */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Conta de Destino (Crédito)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Saldo: {formatCurrency(toAccount?.currentBalance || 0, toAccount?.currencyCode)}
                    </span>
                  </div>

                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  >
                    {accounts
                      .filter((a) => a.id !== fromAccountId)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} — {formatCurrency(acc.currentBalance, acc.currencyCode)} ({acc.currencyCode})
                        </option>
                      ))}
                  </select>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Valor a Receber Convertido ({toAccount?.currencyCode})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">
                        {toCurr.symbol}
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={convertedTargetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        className="w-full bg-slate-900/60 border border-emerald-500/40 text-emerald-300 text-sm font-mono font-bold rounded-lg pl-9 pr-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulador de Spread e Tarifas / IOF */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    Parâmetros de Câmbio, Spread e IOF
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomRateActive(!isCustomRateActive)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                  >
                    {isCustomRateActive ? 'Usar Cotação Oficial' : 'Personalizar Taxa de Câmbio'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Taxa Nominal */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Cotação Nominal (1 {fromCurr.code})
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      disabled={!isCustomRateActive}
                      value={isCustomRateActive ? (customRate ?? nominalRate) : nominalRate}
                      onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
                      className={`w-full text-xs font-mono rounded-lg px-2.5 py-1.5 border ${
                        isCustomRateActive
                          ? 'bg-slate-900 border-sky-500 text-sky-300'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300'
                      }`}
                    />
                  </div>

                  {/* Spread Bancário */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Spread Bancário / Margem
                    </label>
                    <select
                      value={spreadPercent}
                      onChange={(e) => setSpreadPercent(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                    >
                      <option value={0}>0.0% (Câmbio Comercial Puro)</option>
                      <option value={1.0}>1.0% (Fintech / Nomad / Wise)</option>
                      <option value={1.5}>1.5% (Padrão de Mercado)</option>
                      <option value={2.0}>2.0% (Bancos Tradicionais)</option>
                      <option value={3.5}>3.5% (Cartão de Crédito)</option>
                    </select>
                  </div>

                  {/* IOF */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Alíquota IOF (Imposto Financeiro)
                    </label>
                    <select
                      value={iofPercent}
                      onChange={(e) => setIofPercent(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                    >
                      <option value={0}>0.0% (Isento / Entre Contas Nacionais)</option>
                      <option value={1.1}>1.1% (Mesma Titularidade no Exterior)</option>
                      <option value={0.38}>0.38% (Outra Titularidade / Investimentos)</option>
                      <option value={4.38}>4.38% (Compras Internacionais / Cartão)</option>
                    </select>
                  </div>
                </div>

                {/* Resumo da Operação de Câmbio */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900/90 rounded-lg text-xs font-mono border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Débito Total na Origem</span>
                    <span className="font-bold text-rose-400">
                      {formatCurrency(transferAmount + iofCost, fromAccount?.currencyCode)}
                    </span>
                    {iofCost > 0 && (
                      <span className="text-[10px] text-slate-500 block">
                        (Inclui {formatCurrency(iofCost, fromAccount?.currencyCode)} de IOF)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">Crédito Líquido no Destino</span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(convertedTargetAmount, toAccount?.currencyCode)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">VET (Valor Efetivo Total)</span>
                    <span className="font-bold text-slate-200">
                      1 {fromCurr.code} = {effectiveRateWithSpread.toFixed(4)} {toCurr.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações Complementares da Transação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Descrição / Beneficiário
                  </label>
                  <input
                    type="text"
                    value={transferPayee}
                    onChange={(e) => setTransferPayee(e.target.value)}
                    placeholder="Ex: Aporte Nomad Global / Compra de Dólares"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Notas da Transação (Opcional)
                  </label>
                  <input
                    type="text"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Ex: Cotação para viagem ou reserva internacional"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Botão de Execução */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Efetivar Transferência Multi-Moeda</span>
                </button>
              </div>
            </div>

            {/* Bloco 2: Calculadora Rápida Livre de Conversão */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Calculator className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Calculadora Rápida Multi-Moeda
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Valor</label>
                  <input
                    type="number"
                    min="1"
                    value={freeAmount || ''}
                    onChange={(e) => setFreeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono font-bold rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">De (Moeda Origem)</label>
                  <select
                    value={freeFromCode}
                    onChange={(e) => setFreeFromCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center sm:pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = freeFromCode;
                      setFreeFromCode(freeToCode);
                      setFreeToCode(temp);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                    title="Inverter moedas"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Para (Moeda Destino)</label>
                  <select
                    value={freeToCode}
                    onChange={(e) => setFreeToCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resultado da Calculadora Livre */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono">
                <div>
                  <span className="text-[11px] text-slate-400">Resultado da Conversão:</span>
                  <div className="text-lg font-bold text-emerald-400">
                    {formatCurrency(freeConverted, freeToCode)}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Cotação Direta: 1 {freeFromCode} = {freeRate.toFixed(4)} {freeToCode}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 3: PATRIMÔNIO GLOBAL CONSOLIDADO */}
        {/* ============================================================== */}
        {activeTab === 'portfolio' && (
          <div className="max-w-5xl mx-auto space-y-5">
            {/* Card Principal de Patrimônio */}
            <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-2xl shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Patrimônio Líquido Global Consolidado
                  </span>
                  <div className="text-2xl font-black text-slate-100 font-mono mt-1">
                    {formatCurrency(totalNetWorthInActive, activeCurrencyCode)}
                  </div>
                </div>

                {/* Seletor de Moeda de Referência para Visualização */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 px-2">Ver em:</span>
                  {currencies.slice(0, 4).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setActiveCurrencyCode(c.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeCurrencyCode === c.code
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c.flag} {c.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barra de Distribuição de Patrimônio */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Alocação por Moeda</span>
                  <span>100% dos Ativos Rastreados</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  {balancesByCurrency.map((b, idx) => {
                    const pct = totalNetWorthInActive > 0 ? (Math.max(0, b.convertedToActive) / totalNetWorthInActive) * 100 : 0;
                    if (pct <= 0) return null;
                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                    return (
                      <div
                        key={b.currency.code}
                        style={{ width: `${pct}%` }}
                        className={`${colors[idx % colors.length]} transition-all`}
                        title={`${b.currency.name}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cards de Moedas e Contas Vinculadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {balancesByCurrency.map((item) => {
                const accountsInCurr = accounts.filter((a) => a.currencyCode === item.currency.code);
                const pct = totalNetWorthInActive > 0 ? (Math.max(0, item.convertedToActive) / totalNetWorthInActive) * 100 : 0;

                return (
                  <div
                    key={item.currency.code}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.currency.flag || '🌐'}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">
                            {item.currency.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.currency.code} ({item.currency.symbol})
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {pct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-1 font-mono">
                      <span className="text-[10px] text-slate-500 block">Saldo Nativo:</span>
                      <div className="text-sm font-bold text-slate-200">
                        {formatCurrency(item.nativeTotal, item.currency.code)}
                      </div>
                      {item.currency.code !== activeCurrencyCode && (
                        <div className="text-[11px] text-slate-400">
                          ≈ {formatCurrency(item.convertedToActive, activeCurrencyCode)}
                        </div>
                      )}
                    </div>

                    {/* Contas Vinculadas */}
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Contas ({accountsInCurr.length}):
                      </span>
                      {accountsInCurr.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between text-xs text-slate-300 py-0.5"
                        >
                          <span className="truncate max-w-[150px]">{acc.name}</span>
                          <span className="font-mono text-slate-400">
                            {formatCurrency(acc.currentBalance, acc.currencyCode)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL DE ADICIONAR / EDITAR MOEDA */}
      {/* ============================================================== */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  {editingCurrency ? `Editar Moeda ${editingCurrency.code}` : 'Cadastrar Nova Moeda'}
                </h3>
              </div>
              <button
                onClick={() => setIsCurrencyModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Presets Rápidos */}
            {!editingCurrency && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  Sugestões Rápidas:
                </span>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_CURRENCIES.filter(
                    (p) => !currencies.some((c) => c.code === p.code)
                  ).slice(0, 6).map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono transition-colors"
                    >
                      {preset.flag} {preset.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveCurrencyForm} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Código ISO (3 Letras) *
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="USD"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono font-bold rounded-lg px-3 py-2 uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Bandeira / Emoji *
                  </label>
                  <input
                    type="text"
                    value={formFlag}
                    onChange={(e) => setFormFlag(e.target.value)}
                    placeholder="🇺🇸"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                  Nome da Moeda *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Dólar Americano"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Símbolo *
                  </label>
                  <input
                    type="text"
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value)}
                    placeholder="US$"
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Cotação p/ 1 {baseCurrency.code} *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.000001"
                    value={formRate || ''}
                    onChange={(e) => setFormRate(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkBase"
                  checked={formIsBase}
                  onChange={(e) => setFormIsBase(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="chkBase" className="text-xs text-slate-300 cursor-pointer">
                  Definir como moeda base de referência (Base 1.0)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCurrencyModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Salvar Moeda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
