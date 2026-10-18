import React, { useState } from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency } from '../../../utils/formatters';
import {
  Coins,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  ExternalLink,
} from 'lucide-react';

export const CurrencyRatesWidget: React.FC = () => {
  const {
    currencies,
    fetchLiveExchangeRates,
    isFetchingRates,
    lastRatesFetchTime,
    setActiveTab,
  } = useFinanceStore();

  const [convertAmount, setConvertAmount] = useState<number>(100);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('USD');

  const baseCurrency = currencies.find((c) => c.isBase) || currencies[0];
  const targetCurrency = currencies.find((c) => c.code === selectedCurrencyCode) || currencies[1] || currencies[0];

  const popularCurrencies = currencies.filter((c) => !c.isBase).slice(0, 4);

  // Conversão de 100 [selectedCurrency] para Base (BRL)
  const convertedToBase = convertAmount * (targetCurrency.rateToBase || 1.0);

  return (
    <div className="space-y-4">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Moeda Base: <strong className="text-slate-200">{baseCurrency.name} ({baseCurrency.code})</strong>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fetchLiveExchangeRates()}
            disabled={isFetchingRates}
            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50 cursor-pointer"
            title="Atualizar cotações online agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
          >
            Módulo Câmbio
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Grid de Cotações Rápidas */}
      <div className="grid grid-cols-2 gap-2">
        {popularCurrencies.map((c) => {
          const isPositive = (c.change24h || 0) >= 0;
          return (
            <div
              key={c.code}
              onClick={() => setSelectedCurrencyCode(c.code)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                selectedCurrencyCode === c.code
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{c.flag || '🌐'}</span>
                  <span className="text-xs font-bold text-slate-200">{c.code}</span>
                </div>
                <div
                  className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isPositive ? '+' : ''}
                  {c.change24h || 0}%
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-slate-100">
                {baseCurrency.symbol} {c.rateToBase.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Conversor Integrado */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
          <span>Simulador de Conversão:</span>
          <span>1 {targetCurrency.code} = {baseCurrency.symbol} {targetCurrency.rateToBase.toFixed(4)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-slate-900 border border-slate-750 rounded px-2 py-1">
            <span className="text-xs text-slate-400 mr-1.5">{targetCurrency.symbol}</span>
            <input
              type="number"
              value={convertAmount}
              onChange={(e) => setConvertAmount(Number(e.target.value) || 0)}
              className="w-full bg-transparent text-xs font-mono font-bold text-slate-100 outline-none"
            />
          </div>

          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />

          <div className="flex-1 bg-slate-900 border border-slate-750 rounded px-2 py-1 text-right">
            <span className="text-xs font-mono font-bold text-emerald-400">
              {formatCurrency(convertedToBase, baseCurrency.code)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
