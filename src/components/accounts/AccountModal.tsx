import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account, AccountType } from '../../types';
import { X, Check, Wallet, Landmark, CreditCard, TrendingUp, PiggyBank, Sparkles } from 'lucide-react';
import { IconRenderer } from '../common/IconRenderer';

const COLOR_PALETTE = [
  '#10b981', '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', 
  '#f59e0b', '#ef4444', '#059669', '#6366f1', '#0f172a'
];

const ICONS_LIST = ['Wallet', 'Landmark', 'Building2', 'CreditCard', 'TrendingUp', 'BarChart3', 'Globe', 'PiggyBank'];

export const AccountModal: React.FC = () => {
  const { 
    isAccountModalOpen, 
    editingAccount, 
    closeAccountModal, 
    saveAccount, 
    currencies, 
    activeCurrencyCode 
  } = useFinanceStore();

  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState<AccountType>(editingAccount?.type || 'checking');
  const [initialBalance, setInitialBalance] = useState<number>(editingAccount?.initialBalance || 0);
  const [currencyCode, setCurrencyCode] = useState<string>(editingAccount?.currencyCode || activeCurrencyCode || 'BRL');
  const [color, setColor] = useState(editingAccount?.color || '#0ea5e9');
  const [icon, setIcon] = useState(editingAccount?.icon || 'Landmark');
  const [notes, setNotes] = useState(editingAccount?.notes || '');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setInitialBalance(editingAccount.initialBalance);
      setCurrencyCode(editingAccount.currencyCode);
      setColor(editingAccount.color);
      setIcon(editingAccount.icon);
      setNotes(editingAccount.notes || '');
    }
  }, [editingAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveAccount({
      id: editingAccount?.id,
      name: name.trim(),
      type,
      initialBalance: Number(initialBalance),
      currentBalance: editingAccount ? editingAccount.currentBalance : Number(initialBalance),
      currencyCode,
      color,
      icon,
      notes: notes.trim(),
    });
  };

  if (!isAccountModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
              <IconRenderer name={icon} className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              {editingAccount ? 'Editar Conta Financeira' : 'Nova Conta Financeira'}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeAccountModal}
            className="text-slate-400 hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome da Conta *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank Principal, XP Infinite, Carteira..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Conta *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="wallet">Carteira (Dinheiro)</option>
                <option value="checking">Conta Corrente</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="investment">Investimento / Reserva</option>
                <option value="savings">Poupança</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Moeda
              </label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Saldo Inicial ({currencyCode}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={initialBalance}
              onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Seletor de Cores */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de Ícones */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ícone da Conta
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ICONS_LIST.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                    icon === ic
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <IconRenderer name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de agência, limites, regras..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeAccountModal}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md cursor-pointer"
            >
              Salvar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
