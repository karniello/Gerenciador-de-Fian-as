export const formatCurrency = (amount: number, currencyCode: string = 'BRL', customSymbol?: string): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount || 0);

  let formatted = '';
  switch (currencyCode) {
    case 'USD':
      formatted = `US$ ${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'EUR':
      formatted = `€ ${absAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'GBP':
      formatted = `£ ${absAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'JPY':
      formatted = `¥ ${absAmount.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      break;
    case 'CAD':
      formatted = `C$ ${absAmount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'CHF':
      formatted = `CHF ${absAmount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'ARS':
      formatted = `ARS$ ${absAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'BRL':
      formatted = `R$ ${absAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    default:
      try {
        formatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(absAmount);
      } catch {
        const sym = customSymbol || currencyCode;
        formatted = `${sym} ${absAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      break;
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
