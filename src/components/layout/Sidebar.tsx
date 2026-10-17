import React, { useState } from 'react';
import { useFinanceStore, ActiveTab } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import { IconRenderer } from '../common/IconRenderer';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PieChart, 
  BarChart3, 
  CalendarClock, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Layers, 
  Wallet, 
  CreditCard, 
  Landmark, 
  TrendingUp,
  FolderGit2,
  Check
} from 'lucide-react';
import { Account, AccountType } from '../../types';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    accounts, 
    familyMembers, 
    projects,
    selectedAccountId, 
    setSelectedAccountId,
    selectedFamilyMemberId,
    setSelectedFamilyMemberId,
    selectedProjectId,
    setSelectedProjectId,
    openNewAccountModal,
    activeCurrencyCode
  } = useFinanceStore();

  const [isAccountsExpanded, setIsAccountsExpanded] = useState(true);
  const [isFamilyExpanded, setIsFamilyExpanded] = useState(true);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  // Agrupamento de contas por tipo
  const accountGroups: { type: AccountType; label: string; icon: string }[] = [
    { type: 'wallet', label: 'Carteiras & Dinheiro', icon: 'Wallet' },
    { type: 'checking', label: 'Contas Correntes', icon: 'Landmark' },
    { type: 'credit_card', label: 'Cartões de Crédito', icon: 'CreditCard' },
    { type: 'investment', label: 'Investimentos & Reserva', icon: 'TrendingUp' },
  ];

  const navItems: { id: ActiveTab; label: string; icon: any; count?: number }[] = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'transactions', label: 'Livro de Transações', icon: ReceiptText },
    { id: 'budgets', label: 'Metas e Orçamentos', icon: PieChart },
    { id: 'reports', label: 'Relatórios & Gráficos', icon: BarChart3 },
    { id: 'recurring', label: 'Agendadas & Recorrentes', icon: CalendarClock },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-3rem)] select-none">
      {/* Navegação Principal */}
      <div className="p-3 border-b border-slate-800 space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Módulos</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Árvore de Contas com Rolagem Suave */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Seção: Contas Financeiras */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <button
              onClick={() => setIsAccountsExpanded(!isAccountsExpanded)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              {isAccountsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Contas & Carteiras</span>
            </button>
            <button
              onClick={openNewAccountModal}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
              title="Nova Conta"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAccountsExpanded && (
            <div className="space-y-3">
              {/* Opção "Todas as Contas" */}
              <button
                onClick={() => setSelectedAccountId(null)}
                className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedAccountId === null
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Todas as Contas</span>
                </div>
                {selectedAccountId === null && <Check className="w-3 h-3 text-emerald-400" />}
              </button>

              {accountGroups.map((group) => {
                const groupAccounts = accounts.filter((a) => a.type === group.type);
                if (groupAccounts.length === 0) return null;

                const groupTotal = groupAccounts.reduce((acc, a) => acc + a.currentBalance, 0);

                return (
                  <div key={group.type} className="space-y-0.5">
                    <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-slate-400 font-medium">
                      <span>{group.label}</span>
                      <span className="font-mono text-slate-400">
                        {formatCurrency(groupTotal, activeCurrencyCode)}
                      </span>
                    </div>

                    {groupAccounts.map((account) => {
                      const isSelected = selectedAccountId === account.id;
                      return (
                        <button
                          key={account.id}
                          onClick={() => setSelectedAccountId(isSelected ? null : account.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-800 text-emerald-300 font-semibold border-l-2 border-emerald-500'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: account.color }}
                            />
                            <span className="truncate">{account.name}</span>
                          </div>
                          <span className={`text-[11px] font-mono ml-2 flex-shrink-0 ${account.currentBalance < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {formatCurrency(account.currentBalance, account.currencyCode)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Seção: Membros da Família */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <button
              onClick={() => setIsFamilyExpanded(!isFamilyExpanded)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              {isFamilyExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Membros da Família</span>
            </button>
            <Users className="w-3 h-3 text-slate-400" />
          </div>

          {isFamilyExpanded && (
            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedFamilyMemberId(null)}
                className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedFamilyMemberId === null
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span>Todos os Membros</span>
                {selectedFamilyMemberId === null && <Check className="w-3 h-3 text-emerald-400" />}
              </button>

              {familyMembers.map((member) => {
                const isSelected = selectedFamilyMemberId === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedFamilyMemberId(isSelected ? null : member.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-sky-300 font-semibold border-l-2 border-sky-500'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span>{member.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{member.role.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Seção: Projetos */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <button
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              {isProjectsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Projetos Especiais</span>
            </button>
            <FolderGit2 className="w-3 h-3 text-slate-400" />
          </div>

          {isProjectsExpanded && (
            <div className="space-y-0.5">
              {projects.map((proj) => {
                const isSelected = selectedProjectId === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProjectId(isSelected ? null : proj.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-purple-300 font-semibold border-l-2 border-purple-500'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }}></span>
                      <span className="truncate">{proj.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rodapé da Barra Lateral: Informações da Sessão */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] flex items-center justify-between text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Modo Offline-First
        </span>
        <span>v1.2.0</span>
      </div>
    </aside>
  );
};
