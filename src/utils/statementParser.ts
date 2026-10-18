import { Transaction, PaymentMethod, AutoCategorizationRule } from '../types';
import { autoCategorizeTransaction } from './autoCategorization';

export interface ParsedStatementItem {
  id: string;
  date: string;
  payee: string;
  amount: number;
  type: 'expense' | 'income';
  rawMemo: string;
  suggestedPaymentMethod: PaymentMethod;
  suggestedCategoryId?: string;
  isRecurring: boolean;
  ruleMatched?: string;
}

/**
 * Converte data de formatos comuns (DD/MM/YYYY, YYYY-MM-DD, YYYYMMDD) para ISO 'YYYY-MM-DD'
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  const trimmed = dateStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD/MM/YYYY
  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYYMMDD (OFX DTPOSTED: 20261016120000)
  const ofxMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofxMatch) {
    return `${ofxMatch[1]}-${ofxMatch[2]}-${ofxMatch[3]}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Extrai valor numérico de strings em formatos BRL (-1.250,50 ou -1250.50 ou 150,00 D)
 */
export function parseAmount(valStr: string): number {
  if (!valStr) return 0;
  let clean = valStr.trim();
  const isNegative = clean.includes('-') || clean.toUpperCase().endsWith('D');

  clean = clean.replace(/[^\d.,]/g, '');

  if (clean.includes(',') && clean.includes('.')) {
    // 1.250,50
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // 250,50
    clean = clean.replace(',', '.');
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : Math.abs(num);
}

/**
 * Parser de arquivos OFX (Open Financial Exchange) padrão de bancos brasileiros e internacionais
 */
export function parseOFX(ofxContent: string, customRules: AutoCategorizationRule[] = []): ParsedStatementItem[] {
  const items: ParsedStatementItem[] = [];

  // Localizar blocos <STMTTRN>
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = trnRegex.exec(ofxContent)) !== null) {
    const block = match[1];

    const fitidMatch = block.match(/<FITID>(.*?)(?:[\r\n<]|$)/i);
    const dateMatch = block.match(/<DTPOSTED>(.*?)(?:[\r\n<]|$)/i);
    const amtMatch = block.match(/<TRNAMT>(.*?)(?:[\r\n<]|$)/i);
    const memoMatch = block.match(/<MEMO>(.*?)(?:[\r\n<]|$)/i);
    const nameMatch = block.match(/<NAME>(.*?)(?:[\r\n<]|$)/i);

    const rawMemo = (memoMatch ? memoMatch[1] : nameMatch ? nameMatch[1] : 'Lançamento bancário').trim();
    const rawAmt = amtMatch ? amtMatch[1].trim() : '0';
    const amountVal = parseAmount(rawAmt);
    const dateVal = normalizeDate(dateMatch ? dateMatch[1] : '');
    const id = fitidMatch ? fitidMatch[1].trim() : `ofx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const isExpense = amountVal < 0;
    const finalAmount = Math.abs(amountVal);

    // Auto-catalogação inteligente
    const autoCat = autoCategorizeTransaction({ payee: rawMemo, notes: rawMemo }, customRules);

    items.push({
      id,
      date: dateVal,
      payee: rawMemo,
      amount: finalAmount,
      type: isExpense ? 'expense' : 'income',
      rawMemo,
      suggestedPaymentMethod: autoCat.paymentMethod,
      suggestedCategoryId: autoCat.categoryId,
      isRecurring: autoCat.isRecurring,
      ruleMatched: autoCat.ruleMatched,
    });
  }

  return items;
}

/**
 * Parser de extrato bancário em CSV
 */
export function parseCSV(csvContent: string, customRules: AutoCategorizationRule[] = []): ParsedStatementItem[] {
  const items: ParsedStatementItem[] = [];
  const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) return items;

  // Identificar delimitador (, ou ;)
  const firstLine = lines[0];
  const delim = firstLine.includes(';') ? ';' : ',';

  // Pular cabeçalho se houver
  const hasHeader = /data|date|historico|valor|descricao|docto/i.test(firstLine);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    // Split simples respeitando aspas
    const parts = line.split(delim).map((p) => p.replace(/^["']|["']$/g, '').trim());

    if (parts.length < 2) continue;

    // Detectar colunas prováveis
    let dateStr = '';
    let memoStr = '';
    let amtStr = '';

    for (const part of parts) {
      if (!dateStr && (/^\d{4}-\d{2}-\d{2}$/.test(part) || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(part))) {
        dateStr = part;
      } else if (!amtStr && /^-?[\d.,]+$/.test(part.replace(/[^\d.,-]/g, '')) && part.length > 0) {
        amtStr = part;
      } else if (!memoStr && part.length > 2 && !/^\d+$/.test(part)) {
        memoStr = part;
      }
    }

    if (!memoStr && parts[1]) memoStr = parts[1];
    if (!amtStr && parts[2]) amtStr = parts[2];

    const amountVal = parseAmount(amtStr);
    const dateVal = normalizeDate(dateStr);
    const finalMemo = memoStr || `Lançamento ${i + 1}`;
    const isExpense = amountVal <= 0;

    const autoCat = autoCategorizeTransaction({ payee: finalMemo, notes: finalMemo }, customRules);

    items.push({
      id: `csv-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      date: dateVal,
      payee: finalMemo,
      amount: Math.abs(amountVal) || 50,
      type: isExpense ? 'expense' : 'income',
      rawMemo: finalMemo,
      suggestedPaymentMethod: autoCat.paymentMethod,
      suggestedCategoryId: autoCat.categoryId,
      isRecurring: autoCat.isRecurring,
      ruleMatched: autoCat.ruleMatched,
    });
  }

  return items;
}

/**
 * Parser de texto livre colado de extrato bancário
 */
export function parsePlainText(text: string, customRules: AutoCategorizationRule[] = []): ParsedStatementItem[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedStatementItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ex: "15/10/2026 - R$ 45,90 - IFOOD *PEDIDO 8812"
    // Ou: "UBER *TRIP R$ 32,50 14/10"
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})/);
    const amtMatch = line.match(/(?:R\$|-)?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})/);

    let payee = line;
    if (dateMatch) payee = payee.replace(dateMatch[0], '');
    if (amtMatch) payee = payee.replace(amtMatch[0], '');
    payee = payee.replace(/[-–|:;]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!payee) payee = 'Compra com Cartão';

    const amtStr = amtMatch ? amtMatch[0] : '0';
    const amountVal = parseAmount(amtStr);
    const dateVal = normalizeDate(dateMatch ? dateMatch[0] : '');

    const autoCat = autoCategorizeTransaction({ payee, notes: line }, customRules);

    items.push({
      id: `txt-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      date: dateVal,
      payee,
      amount: Math.abs(amountVal) || 45.0,
      type: 'expense',
      rawMemo: line,
      suggestedPaymentMethod: autoCat.paymentMethod,
      suggestedCategoryId: autoCat.categoryId,
      isRecurring: autoCat.isRecurring,
      ruleMatched: autoCat.ruleMatched,
    });
  }

  return items;
}

/**
 * Gerador de lote de transações autênticas para simulação de Open Finance
 * Cria transações ricas em cartões de crédito, débito, débito em conta e recorrências
 */
export function generateMockBankSyncTransactions(
  accountId: string,
  currencyCode: string = 'BRL',
  customRules: AutoCategorizationRule[] = []
): Transaction[] {
  const today = new Date();
  const formatDateOffset = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  const seedEntries: Array<{
    payee: string;
    amount: number;
    type: 'expense' | 'income';
    daysAgo: number;
    notes: string;
    cardLast4?: string;
  }> = [
    // Cartão de Crédito
    { payee: 'iFood *Restaurante Paris 6', amount: 142.8, type: 'expense', daysAgo: 0, notes: 'Compra Cartão de Crédito', cardLast4: '4290' },
    { payee: 'Uber *Viagem Aeroporto GRU', amount: 89.4, type: 'expense', daysAgo: 1, notes: 'Cartão de Crédito Online', cardLast4: '4290' },
    { payee: 'Amazon.com.br Livros & Tech', amount: 219.9, type: 'expense', daysAgo: 2, notes: 'Compra Parcelada 1/3', cardLast4: '4290' },
    { payee: 'Posto Shell Rodoanel', amount: 235.0, type: 'expense', daysAgo: 3, notes: 'Combustível Cartão de Crédito', cardLast4: '4290' },
    { payee: 'Droga Raia Farmácia', amount: 94.5, type: 'expense', daysAgo: 4, notes: 'Medicamentos e Higiene', cardLast4: '4290' },
    { payee: 'Drogasil Shopping Center', amount: 68.2, type: 'expense', daysAgo: 6, notes: 'Vitaminas e Cuidados', cardLast4: '4290' },

    // Assinaturas Recorrentes (Cartão)
    { payee: 'Netflix.com Brasil', amount: 55.9, type: 'expense', daysAgo: 2, notes: 'Assinatura Mensal 4K', cardLast4: '4290' },
    { payee: 'Spotify Premium Família', amount: 34.9, type: 'expense', daysAgo: 5, notes: 'Cobrança Recorrente Música', cardLast4: '4290' },
    { payee: 'Smart Fit Academia Mensalidade', amount: 129.9, type: 'expense', daysAgo: 7, notes: 'Débito Recorrente Plano Black', cardLast4: '4290' },

    // Cartão de Débito
    { payee: 'Padaria Belas Artes', amount: 38.5, type: 'expense', daysAgo: 0, notes: 'Compra Débito Chip e Senha', cardLast4: '1088' },
    { payee: 'Pão de Açúcar Mercado Express', amount: 112.3, type: 'expense', daysAgo: 3, notes: 'Compra Cartão de Débito', cardLast4: '1088' },
    { payee: 'Café Havanna Café Espresso', amount: 22.0, type: 'expense', daysAgo: 4, notes: 'Débito Aproximação NFC', cardLast4: '1088' },

    // Débitos na Conta / Débito Automático
    { payee: 'Enel Distribuição São Paulo', amount: 284.15, type: 'expense', daysAgo: 2, notes: 'Débito Automático Conta de Luz' },
    { payee: 'Sabesp Saneamento Básico', amount: 118.4, type: 'expense', daysAgo: 3, notes: 'Débito em Conta - Água/Esgoto' },
    { payee: 'Claro Fibra 500 Mega + TV', amount: 189.9, type: 'expense', daysAgo: 5, notes: 'Débito Automático Telecom' },
    { payee: 'Condomínio Residencial Edifício', amount: 1250.0, type: 'expense', daysAgo: 6, notes: 'Débito Autorizado em Conta DDA' },
    { payee: 'Bradesco Saúde Empresarial', amount: 980.0, type: 'expense', daysAgo: 8, notes: 'Mensalidade Plano de Saúde' },
  ];

  return seedEntries.map((entry, idx) => {
    const autoCat = autoCategorizeTransaction({ payee: entry.payee, notes: entry.notes }, customRules);

    return {
      id: `sync-tx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      date: formatDateOffset(entry.daysAgo),
      type: entry.type,
      amount: entry.amount,
      accountId,
      categoryId: autoCat.categoryId,
      status: 'cleared',
      payee: entry.payee,
      notes: entry.notes,
      currencyCode,
      isRecurring: autoCat.isRecurring,
      recurrenceFrequency: autoCat.recurrenceFrequency,
      tags: [...autoCat.tags, 'Open Finance'],
      paymentMethod: autoCat.paymentMethod,
      origin: 'bank_sync',
      isAutoCategorized: !!autoCat.categoryId,
      autoCategoryRule: autoCat.ruleMatched,
      cardLast4: entry.cardLast4,
      createdAt: new Date().toISOString(),
    };
  });
}
