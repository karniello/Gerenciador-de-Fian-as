import React from 'react';
import { useFinanceStore } from '../../../store/useFinanceStore';
import { formatCurrency } from '../../../utils/formatters';
import { Users, Sparkles } from 'lucide-react';

export const FamilyExpensesWidget: React.FC = () => {
  const { familyMembers, transactions, activeCurrencyCode } = useFinanceStore();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const currentMonthTransactions = transactions.filter((t) => {
    if (t.status === 'void' || t.type !== 'expense') return false;
    const [year, month] = t.date.split('-').map(Number);
    return year === currentYear && month === currentMonth;
  });

  const monthExpense = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const memberExpenses: Record<string, number> = {};
  currentMonthTransactions.forEach((t) => {
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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {familyMembers.map((member) => {
          const totalSpent = memberExpenses[member.id] || 0;
          const memberPercent = monthExpense > 0 ? Math.round((totalSpent / monthExpense) * 100) : 0;

          return (
            <div key={member.id} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">{member.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{member.role}</div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {formatCurrency(totalSpent, activeCurrencyCode)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{memberPercent}%</div>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${memberPercent}%`,
                    backgroundColor: member.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
        <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-400" />
        <span>Rateio atualizado com base nos lançamentos e divisões por membro.</span>
      </div>
    </div>
  );
};
