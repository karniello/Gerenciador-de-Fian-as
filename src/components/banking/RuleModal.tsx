import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { AutoCategorizationRule, PaymentMethod, RecurrenceFrequency } from '../../types';
import { X, Sparkles, Plus, Check } from 'lucide-react';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRule?: AutoCategorizationRule | null;
}

export const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, initialRule }) => {
  const { categories, addAutoCategorizationRule, updateAutoCategorizationRule } = useFinanceStore();

  const [name, setName] = useState(initialRule?.name || '');
  const [pattern, setPattern] = useState(initialRule?.pattern || '');
  const [matchField, setMatchField] = useState<'payee' | 'notes' | 'any'>(
    initialRule?.matchField || 'any'
  );
  const [categoryId, setCategoryId] = useState(
    initialRule?.categoryId || categories[0]?.id || 'cat-food-restaurant'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialRule?.paymentMethod || 'credit_card'
  );
  const [isRecurring, setIsRecurring] = useState(initialRule?.isRecurring ?? false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    initialRule?.recurrenceFrequency || 'monthly'
  );
  const [tagsInput, setTagsInput] = useState(initialRule?.tags?.join(', ') || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pattern.trim() || !categoryId) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (initialRule) {
      updateAutoCategorizationRule(initialRule.id, {
        name: name.trim(),
        pattern: pattern.trim(),
        matchField,
        categoryId,
        paymentMethod,
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
        tags,
      });
    } else {
      addAutoCategorizationRule({
        name: name.trim(),
        pattern: pattern.trim(),
        matchField,
        categoryId,
        paymentMethod,
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
        tags,
        isActive: true,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {initialRule ? 'Editar Regra de Catalogação' : 'Nova Regra de Catalogação Automática'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nome da Regra:
            </label>
            <input
              type="text"
              placeholder="Ex: iFood Compras e Delivery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Padrão / Termos na Descrição:
              </label>
              <input
                type="text"
                placeholder="Ex: ifood|rappi|delivery"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Suporta regex ou palavras separadas por |
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Campo de Busca:
              </label>
              <select
                value={matchField}
                onChange={(e) => setMatchField(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="any">Qualquer Campo (Histórico ou Memo)</option>
                <option value="payee">Apenas Beneficiário</option>
                <option value="notes">Apenas Observações</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Atribuir Categoria:
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'expense' ? '🔴' : '🟢'} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Canal / Método de Pagamento:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="credit_card">💳 Cartão de Crédito</option>
                <option value="debit_card">💳 Cartão de Débito</option>
                <option value="account_debit">🏦 Débito em Conta / Débito Automático</option>
                <option value="pix">⚡ PIX</option>
                <option value="bank_slip">📄 Boleto Bancário</option>
                <option value="transfer">🔁 Transferência Bancária</option>
              </select>
            </div>
          </div>

          {/* Recorrente */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="accent-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-200">
                Marcar automaticamente como Gasto Recorrente / Assinatura
              </span>
            </label>

            {isRecurring && (
              <div className="flex items-center gap-2 pt-1 pl-5">
                <span className="text-[11px] text-slate-400">Frequência:</span>
                <select
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Tags Automáticas (separadas por vírgula):
            </label>
            <input
              type="text"
              placeholder="Ex: Assinaturas, Lazer, Delivery"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{initialRule ? 'Salvar Alterações' : 'Criar Regra'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
