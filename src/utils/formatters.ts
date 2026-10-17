export const formatCurrency = (amount: number, currencyCode: string = 'BRL'): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';
  if (currencyCode === 'USD') {
    formatted = `US$ ${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currencyCode === 'EUR') {
    formatted = `€ ${absAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    // Padrão BRL
    formatted = `R$ ${absAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return isNegative ? `-${formatted}` : formatted;
};

export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
};

export const formatRelativeDate = (dateString: string): string => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dateString === today) return 'Hoje';
  if (dateString === yesterday) return 'Ontem';
  return formatDateDisplay(dateString);
};
