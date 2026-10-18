import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { BankProviderId } from '../../types';
import {
  Landmark,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface BankPreset {
  id: BankProviderId;
  name: string;
  fullName: string;
  color: string;
  bgGradient: string;
  popular: boolean;
  defaultCreditLimit: number;
}

const SUPPORTED_BANKS: BankPreset[] = [
  { id: 'nubank', name: 'Nubank', fullName: 'Nu Pagamentos S.A.', color: '#8b5cf6', bgGradient: 'from-purple-900 to-purple-950', popular: true, defaultCreditLimit: 15000 },
  { id: 'itau', name: 'Itaú Unibanco', fullName: 'Itaú Unibanco Holding S.A.', color: '#ea580c', bgGradient: 'from-orange-950 to-slate-950', popular: true, defaultCreditLimit: 30000 },
  { id: 'inter', name: 'Banco Inter', fullName: 'Banco Inter S.A.', color: '#f97316', bgGradient: 'from-orange-900 to-slate-950', popular: true, defaultCreditLimit: 20000 },
  { id: 'xp', name: 'XP Investimentos', fullName: 'Banco XP S.A.', color: '#eab308', bgGradient: 'from-amber-950 to-slate-950', popular: true, defaultCreditLimit: 50000 },
  { id: 'c6', name: 'C6 Bank', fullName: 'Banco C6 S.A.', color: '#334155', bgGradient: 'from-slate-800 to-slate-950', popular: true, defaultCreditLimit: 18000 },
  { id: 'bradesco', name: 'Bradesco', fullName: 'Banco Bradesco S.A.', color: '#dc2626', bgGradient: 'from-red-950 to-slate-950', popular: true, defaultCreditLimit: 25000 },
  { id: 'santander', name: 'Santander', fullName: 'Banco Santander Brasil', color: '#ef4444', bgGradient: 'from-rose-950 to-slate-950', popular: true, defaultCreditLimit: 22000 },
  { id: 'bb', name: 'Banco do Brasil', fullName: 'Banco do Brasil S.A.', color: '#facc15', bgGradient: 'from-yellow-950 to-slate-950', popular: true, defaultCreditLimit: 20000 },
  { id: 'btg', name: 'BTG Pactual', fullName: 'Banco BTG Pactual S.A.', color: '#0284c7', bgGradient: 'from-sky-950 to-slate-950', popular: false, defaultCreditLimit: 40000 },
  { id: 'caixa', name: 'Caixa Econômica', fullName: 'Caixa Econômica Federal', color: '#2563eb', bgGradient: 'from-blue-950 to-slate-950', popular: false, defaultCreditLimit: 12000 },
  { id: 'wise', name: 'Wise (TransferWise)', fullName: 'Wise Payments Ltd', color: '#10b981', bgGradient: 'from-emerald-950 to-slate-950', popular: false, defaultCreditLimit: 0 },
  { id: 'revolut', name: 'Revolut Brasil', fullName: 'Revolut Tecnologia Brasil', color: '#06b6d4', bgGradient: 'from-cyan-950 to-slate-950', popular: false, defaultCreditLimit: 10000 },
];

export const LinkBankModal: React.FC = () => {
  const { isLinkBankModalOpen, closeLinkBankModal, linkNewBankConnection } = useFinanceStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBank, setSelectedBank] = useState<BankPreset | null>(null);
  const [createChecking, setCreateChecking] = useState(true);
  const [createCreditCard, setCreateCreditCard] = useState(true);
  const [creditLimit, setCreditLimit] = useState(15000);
  const [cardClosingDay, setCardClosingDay] = useState(20);
  const [cardDueDay, setCardDueDay] = useState(28);
  const [searchBank, setSearchBank] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  if (!isLinkBankModalOpen) return null;

  const filteredBanks = SUPPORTED_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(searchBank.toLowerCase()) ||
      b.fullName.toLowerCase().includes(searchBank.toLowerCase())
  );

  const handleSelectBank = (bank: BankPreset) => {
    setSelectedBank(bank);
    setCreditLimit(bank.defaultCreditLimit);
    setStep(2);
  };

  const handleConfirmConsent = () => {
    if (!selectedBank) return;
    setIsAuthorizing(true);

    // Simulação do handshake criptografado de autorização Open Finance Brasil
    setTimeout(() => {
      setIsAuthorizing(false);
      setStep(3);

      setTimeout(() => {
        linkNewBankConnection(
          {
            institutionId: selectedBank.id,
            institutionName: selectedBank.name,
            color: selectedBank.color,
            bgGradient: selectedBank.bgGradient,
            status: 'connected',
            autoSyncEnabled: true,
            consentExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
            accountIds: [],
            cards: createCreditCard
              ? [
                  {
                    id: `card-${Date.now()}`,
                    name: `${selectedBank.name} Cartão de Crédito`,
                    last4: `${Math.floor(1000 + Math.random() * 9000)}`,
                    type: 'credit',
                    brand: 'Mastercard',
                    limit: creditLimit,
                    usedLimit: 450,
                    closingDay: cardClosingDay,
                    dueDay: cardDueDay,
                  },
                ]
              : [],
          },
          {
            createCheckingAccount: createChecking,
            createCreditCard: createCreditCard,
            checkingName: `${selectedBank.name} Conta Corrente`,
            creditCardName: `${selectedBank.name} Cartão de Crédito`,
            creditLimit: creditLimit,
          }
        );

        // Reset
        setStep(1);
        setSelectedBank(null);
      }, 900);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Conectar Conta Bancária & Open Finance
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                  Oficial
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sincronize extratos, cartões de crédito e débito com catalogação automática
              </p>
            </div>
          </div>
          <button
            onClick={closeLinkBankModal}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Passo 1: Selecionar Banco */}
        {step === 1 && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Escolha sua Instituição Financeira:
              </label>
              <input
                type="text"
                placeholder="Buscar por Nubank, Itaú, Bradesco, Inter, XP..."
                value={searchBank}
                onChange={(e) => setSearchBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Bancos e Fintechs Suportados ({filteredBanks.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => handleSelectBank(bank)}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
                        style={{ backgroundColor: bank.color }}
                      >
                        {bank.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                          {bank.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {bank.fullName}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300">Conexão Criptografada Padrão Banco Central:</strong> Seus
                dados são lidos de forma segura em modo leitura para auto-catalogação de despesas, sem
                permissão para movimentações financeiras.
              </div>
            </div>
          </div>
        )}

        {/* Passo 2: Configurar Produtos a Sincronizar */}
        {step === 2 && selectedBank && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: selectedBank.color }}
              >
                {selectedBank.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">{selectedBank.name}</div>
                <div className="text-[11px] text-slate-400">{selectedBank.fullName}</div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Selecione os produtos que deseja vincular:
              </label>

              {/* Conta Corrente / Débito */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={createChecking}
                  onChange={(e) => setCreateChecking(e.target.checked)}
                  className="mt-1 accent-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-sky-400" />
                    Conta Corrente & Débito em Conta
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Movimentações da conta corrente, compras no cartão de débito, PIX e débitos automáticos
                    (contas de consumo, concessionárias, condomínio).
                  </p>
                </div>
              </label>

              {/* Cartão de Crédito */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={createCreditCard}
                  onChange={(e) => setCreateCreditCard(e.target.checked)}
                  className="mt-1 accent-emerald-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                    Cartão de Crédito (Fatura & Compras)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Compras realizadas por cartão de crédito (físico e virtual), assinaturas recorrentes
                    (Netflix, Spotify) e parcelamentos.
                  </p>

                  {createCreditCard && (
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Limite Total (R$):</label>
                        <input
                          type="number"
                          value={creditLimit}
                          onChange={(e) => setCreditLimit(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Dia Fechamento:</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={cardClosingDay}
                          onChange={(e) => setCardClosingDay(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Dia Vencimento:</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={cardDueDay}
                          onChange={(e) => setCardDueDay(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Destaque da Catalogação Automática */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Catalogação Automática Ativada
                </div>
                <p className="text-[11px] text-slate-300">
                  Cada gasto importado será classificado automaticamente em categorias (Alimentação, Transporte,
                  Habitação, Assinaturas), detectando o canal de pagamento e identificando despesas recorrentes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Voltar
              </button>

              <button
                onClick={handleConfirmConsent}
                disabled={isAuthorizing || (!createChecking && !createCreditCard)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isAuthorizing ? (
                  <>
                    <Lock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Autenticando Open Finance...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Autorizar & Sincronizar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Passo 3: Sucesso */}
        {step === 3 && (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Instituição Conectada com Sucesso!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              As contas foram criadas e as despesas estão sendo catalogadas automaticamente no seu Livro Caixa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
