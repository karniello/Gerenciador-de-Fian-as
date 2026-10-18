import { AutoCategorizationRule, PaymentMethod, RecurrenceFrequency, Transaction } from '../types';

export interface AutoCategorizeResult {
  categoryId?: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  tags: string[];
  ruleMatched?: string;
  confidence: 'high' | 'medium' | 'low';
}

// Catálogo interno robusto com mais de 70 padrões reais de estabelecimentos,
// cartões de crédito/débito, débito automático em conta e assinaturas
export const BUILT_IN_AUTO_RULES: Omit<AutoCategorizationRule, 'id' | 'matchesCount'>[] = [
  // --- 1. Assinaturas & Streaming (Cartão de Crédito ou Débito em Conta - Recorrentes) ---
  {
    name: 'Netflix Brasil',
    pattern: 'netflix',
    matchField: 'any',
    categoryId: 'cat-leisure-subs',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Assinaturas', 'Streaming', 'Lazer'],
    isActive: true,
  },
  {
    name: 'Spotify Premium',
    pattern: 'spotify',
    matchField: 'any',
    categoryId: 'cat-leisure-subs',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Assinaturas', 'Streaming', 'Música'],
    isActive: true,
  },
  {
    name: 'Amazon Prime / Prime Video',
    pattern: 'prime video|amazon prime|amazon digital',
    matchField: 'any',
    categoryId: 'cat-leisure-subs',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Assinaturas', 'Streaming'],
    isActive: true,
  },
  {
    name: 'YouTube Premium / Google',
    pattern: 'google *youtube|youtube premium|google play',
    matchField: 'any',
    categoryId: 'cat-leisure-subs',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Assinaturas', 'Google'],
    isActive: true,
  },
  {
    name: 'Apple Services & iCloud',
    pattern: 'apple.com/bill|itunes|apple services',
    matchField: 'any',
    categoryId: 'cat-leisure-subs',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Assinaturas', 'Apple'],
    isActive: true,
  },
  {
    name: 'Disney+ / HBO Max',
    pattern: 'disney plus|disney\\+|max.com|hbo max',
    matchField: 'any',
    categoryId: 'cat-leisure-subs',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Assinaturas', 'Streaming'],
    isActive: true,
  },
  {
    name: 'OpenAI / ChatGPT Plus',
    pattern: 'openai|chatgpt',
    matchField: 'any',
    categoryId: 'cat-leisure-subs',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Assinaturas', 'Produtividade'],
    isActive: true,
  },
  {
    name: 'Academia Smart Fit / Bluefit',
    pattern: 'smart fit|bluefit|bodytech|academia',
    matchField: 'any',
    categoryId: 'cat-health-gym',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Saúde', 'Academia', 'Recorrente'],
    isActive: true,
  },

  // --- 2. Alimentação & Delivery (Cartão de Crédito e Débito) ---
  {
    name: 'iFood / Rappi Delivery',
    pattern: 'ifood|rappi|delivery',
    matchField: 'any',
    categoryId: 'cat-food-restaurant',
    paymentMethod: 'credit_card',
    isRecurring: false,
    tags: ['Delivery', 'Alimentação'],
    isActive: true,
  },
  {
    name: 'McDonalds / Burger King / Fast Food',
    pattern: 'mcdonald|burger king|habibs|subway|bobs',
    matchField: 'any',
    categoryId: 'cat-food-restaurant',
    paymentMethod: 'credit_card',
    isRecurring: false,
    tags: ['Alimentação', 'FastFood'],
    isActive: true,
  },
  {
    name: 'Restaurantes & Cafeterias',
    pattern: 'restaurante|churrascaria|pizzaria|cafeteria|starbucks|bacio di latte',
    matchField: 'any',
    categoryId: 'cat-food-restaurant',
    paymentMethod: 'credit_card',
    isRecurring: false,
    tags: ['Lazer', 'Restaurante'],
    isActive: true,
  },
  {
    name: 'Supermercados & Atacados',
    pattern: 'pao de acucar|carrefour|assai|atacadao|extra|st marche|supermercado|hipermercado|sam.s club',
    matchField: 'any',
    categoryId: 'cat-food-market',
    paymentMethod: 'credit_card',
    isRecurring: false,
    tags: ['Essencial', 'Mercado'],
    isActive: true,
  },
  {
    name: 'Padarias & Confeitarias (Débito habitual)',
    pattern: 'padaria|panificadora|confeitaria',
    matchField: 'any',
    categoryId: 'cat-food-restaurant',
    paymentMethod: 'debit_card',
    isRecurring: false,
    tags: ['Alimentação', 'Dia a Dia'],
    isActive: true,
  },

  // --- 3. Transporte & Mobilidade (Crédito & Débito) ---
  {
    name: 'Uber & 99 Táxi',
    pattern: 'uber|99app|99 pop|99 taxi|cabify',
    matchField: 'any',
    categoryId: 'cat-trans-rides',
    paymentMethod: 'credit_card',
    isRecurring: false,
    tags: ['Transporte', 'Mobilidade'],
    isActive: true,
  },
  {
    name: 'Postos de Combustível',
    pattern: 'posto |ipiranga|shell|petrobras|auto posto|combustivel',
    matchField: 'any',
    categoryId: 'cat-trans-fuel',
    paymentMethod: 'credit_card',
    isRecurring: false,
    tags: ['Transporte', 'Combustível'],
    isActive: true,
  },
  {
    name: 'Pedágio & Sem Parar / Veloe / ConectCar',
    pattern: 'sem parar|veloe|conectcar|pedagio',
    matchField: 'any',
    categoryId: 'cat-trans-maint',
    paymentMethod: 'credit_card',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Transporte', 'Pedágio'],
    isActive: true,
  },

  // --- 4. Débito em Conta / Débito Automático (Concessionárias, Habitação e Impostos) ---
  {
    name: 'Energia Elétrica (Enel / CPFL / Light)',
    pattern: 'enel|cpfl|light s.a|cemig|copel|eletropaulo|cia eletrica',
    matchField: 'any',
    categoryId: 'cat-home-utilities',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Contas Fixas', 'Energia', 'Débito Automático'],
    isActive: true,
  },
  {
    name: 'Água e Esgoto (Sabesp / Sanepar / Cedae)',
    pattern: 'sabesp|sanepar|cedae|copasa|corsan|cia saneamento',
    matchField: 'any',
    categoryId: 'cat-home-utilities',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Contas Fixas', 'Água', 'Débito Automático'],
    isActive: true,
  },
  {
    name: 'Gás Encanado (Comgás / Naturgy)',
    pattern: 'comgas|naturgy|gas brasiliano',
    matchField: 'any',
    categoryId: 'cat-home-utilities',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Contas Fixas', 'Gás', 'Débito Automático'],
    isActive: true,
  },
  {
    name: 'Telecom (Claro / Net / Vivo / TIM / Oi)',
    pattern: 'claro|net servicos|telefonica|vivo|tim celular|oi fibra',
    matchField: 'any',
    categoryId: 'cat-home-internet',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Contas Fixas', 'Internet', 'Débito Automático'],
    isActive: true,
  },
  {
    name: 'Taxa Condominial',
    pattern: 'condominio|taxa condominial|cond.|administradora condominio',
    matchField: 'any',
    categoryId: 'cat-home-condo',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Habitação', 'Condomínio', 'Essencial'],
    isActive: true,
  },
  {
    name: 'Aluguel (QuintoAndar / Imobiliária)',
    pattern: 'quintoandar|aluguel|locacao imovel|imobiliaria',
    matchField: 'any',
    categoryId: 'cat-home-condo',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Habitação', 'Aluguel', 'Essencial'],
    isActive: true,
  },
  {
    name: 'Plano de Saúde (Bradesco Saúde / Amil / SulAmérica)',
    pattern: 'bradesco saude|amil|sulamerica saude|notredame|unimed|seguros saude',
    matchField: 'any',
    categoryId: 'cat-health-plan',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Saúde', 'Plano de Saúde', 'Essencial'],
    isActive: true,
  },
  {
    name: 'Mensalidade Escolar / Faculdade',
    pattern: 'escola|colegio|faculdade|universidade|educacao infantil|mensalidade escolar',
    matchField: 'any',
    categoryId: 'cat-edu-school',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Educação', 'Escola', 'Mensal'],
    isActive: true,
  },
  {
    name: 'Tarifas Bancárias e Pacotes de Conta',
    pattern: 'tarifa pacote|tar conta|manutencao conta|iof|tarifa mensalidade|anuidade cartao',
    matchField: 'any',
    categoryId: 'cat-home-utilities',
    paymentMethod: 'account_debit',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Tarifa Bancária', 'Débito em Conta'],
    isActive: true,
  },

  // --- 5. Saúde e Farmácias ---
  {
    name: 'Farmácias (Drogasil / Raia / SP)',
    pattern: 'drogasil|droga raia|drogaria sp|drogaria sao paulo|pacheco|pague menos',
    matchField: 'any',
    categoryId: 'cat-health-meds',
    paymentMethod: 'credit_card',
    isRecurring: false,
    tags: ['Saúde', 'Farmácia'],
    isActive: true,
  },

  // --- 6. Compras Online & E-commerce ---
  {
    name: 'E-commerce & Marketplace',
    pattern: 'amazon.com.br|mercado livre|shopee|magalu|magazine luiza|shein|aliexpress',
    matchField: 'any',
    categoryId: 'cat-leisure',
    paymentMethod: 'credit_card',
    isRecurring: false,
    tags: ['Compras', 'Online'],
    isActive: true,
  },

  // --- 7. Receitas Automáticas (Salário & Rendimentos) ---
  {
    name: 'Salário & Remuneração em Conta',
    pattern: 'ted salario|folha pagamento|proventos|remuneracao|credito salario|salario',
    matchField: 'any',
    categoryId: 'cat-inc-salary',
    paymentMethod: 'transfer',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Salário', 'Receita Fixa'],
    isActive: true,
  },
  {
    name: 'Dividendos & Rendimentos de Investimento',
    pattern: 'dividendos|juros capital proprio|rendimento fundo|fii |rendimento poupanca',
    matchField: 'any',
    categoryId: 'cat-inc-invest',
    paymentMethod: 'transfer',
    isRecurring: true,
    recurrenceFrequency: 'monthly',
    tags: ['Investimentos', 'Renda Passiva'],
    isActive: true,
  },
];

/**
 * Detecta automaticamente o canal ou método de pagamento com base no texto
 */
export function detectPaymentMethod(text: string, defaultMethod: PaymentMethod = 'credit_card'): PaymentMethod {
  const normalized = text.toLowerCase();

  // Débito em Conta / Débito Automático
  if (
    normalized.includes('deb aut') ||
    normalized.includes('deb autom') ||
    normalized.includes('debito automatico') ||
    normalized.includes('debito em conta') ||
    normalized.includes('deb conta') ||
    normalized.includes('dda ') ||
    normalized.includes('tar conta') ||
    normalized.includes('tarifa') ||
    normalized.includes('concessionaria')
  ) {
    return 'account_debit';
  }

  // Cartão de Débito
  if (
    normalized.includes('compra debito') ||
    normalized.includes('debito visa') ||
    normalized.includes('debito master') ||
    normalized.includes('deb elo') ||
    normalized.includes('rede maestro') ||
    normalized.includes('cartao debito') ||
    normalized.includes('debito caixa')
  ) {
    return 'debit_card';
  }

  // PIX
  if (
    normalized.includes('pix ') ||
    normalized.includes('pix transf') ||
    normalized.includes('pix qrcode') ||
    normalized.includes('pix recebido') ||
    normalized.includes('pix enviado')
  ) {
    return 'pix';
  }

  // Cartão de Crédito
  if (
    normalized.includes('compra cartao') ||
    normalized.includes('cartao credito') ||
    normalized.includes('fatura') ||
    normalized.includes('ifood') ||
    normalized.includes('uber') ||
    normalized.includes('netflix') ||
    normalized.includes('amazon') ||
    normalized.includes('spotify') ||
    normalized.includes('loja')
  ) {
    return 'credit_card';
  }

  // Boleto Bancário
  if (normalized.includes('boleto') || normalized.includes('pagamento titulo') || normalized.includes('pagto titulo')) {
    return 'bank_slip';
  }

  // Transferência bancária
  if (normalized.includes('ted ') || normalized.includes('doc ') || normalized.includes('transf ')) {
    return 'transfer';
  }

  return defaultMethod;
}

/**
 * Detecta se a despesa é recorrente (mensalidade, assinatura, fatura de serviço fixo)
 */
export function detectIsRecurring(text: string): { isRecurring: boolean; recurrenceFrequency?: RecurrenceFrequency } {
  const normalized = text.toLowerCase();
  const recurringKeywords = [
    'netflix',
    'spotify',
    'amazon prime',
    'youtube premium',
    'apple.com/bill',
    'disney',
    'smart fit',
    'bluefit',
    'bodytech',
    'enel',
    'sabesp',
    'comgas',
    'claro',
    'vivo',
    'tim',
    'condominio',
    'aluguel',
    'quintoandar',
    'plano de saude',
    'bradesco saude',
    'amil',
    'mensalidade escolar',
    'escola',
    'sem parar',
    'veloe',
    'tarifa pacote',
    'manutencao conta',
    'chatgpt',
    'openai',
  ];

  for (const kw of recurringKeywords) {
    if (normalized.includes(kw)) {
      return { isRecurring: true, recurrenceFrequency: 'monthly' };
    }
  }

  return { isRecurring: false };
}

/**
 * Função principal de catalogação automática
 */
export function autoCategorizeTransaction(
  tx: Partial<Transaction>,
  customRules: AutoCategorizationRule[] = []
): AutoCategorizeResult {
  const searchTarget = `${tx.payee || ''} ${tx.notes || ''}`.toLowerCase();

  // 1. Prioridade: Regras personalizadas cadastradas pelo usuário
  for (const rule of customRules) {
    if (!rule.isActive) continue;

    let textToCheck = searchTarget;
    if (rule.matchField === 'payee') textToCheck = (tx.payee || '').toLowerCase();
    if (rule.matchField === 'notes') textToCheck = (tx.notes || '').toLowerCase();

    try {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(textToCheck)) {
        return {
          categoryId: rule.categoryId,
          paymentMethod: rule.paymentMethod || detectPaymentMethod(searchTarget),
          isRecurring: rule.isRecurring ?? false,
          recurrenceFrequency: rule.recurrenceFrequency,
          tags: rule.tags || [],
          ruleMatched: `Regra personalizada: "${rule.name}"`,
          confidence: 'high',
        };
      }
    } catch {
      // Fallback para includes simples se o regex falhar
      if (textToCheck.includes(rule.pattern.toLowerCase())) {
        return {
          categoryId: rule.categoryId,
          paymentMethod: rule.paymentMethod || detectPaymentMethod(searchTarget),
          isRecurring: rule.isRecurring ?? false,
          recurrenceFrequency: rule.recurrenceFrequency,
          tags: rule.tags || [],
          ruleMatched: `Regra personalizada: "${rule.name}"`,
          confidence: 'high',
        };
      }
    }
  }

  // 2. Dicionário nativo do sistema
  for (const rule of BUILT_IN_AUTO_RULES) {
    try {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(searchTarget)) {
        return {
          categoryId: rule.categoryId,
          paymentMethod: rule.paymentMethod || detectPaymentMethod(searchTarget),
          isRecurring: rule.isRecurring ?? false,
          recurrenceFrequency: rule.recurrenceFrequency,
          tags: rule.tags || [],
          ruleMatched: `Catálogo Inteligente: "${rule.name}"`,
          confidence: 'high',
        };
      }
    } catch {
      if (searchTarget.includes(rule.pattern.toLowerCase())) {
        return {
          categoryId: rule.categoryId,
          paymentMethod: rule.paymentMethod || detectPaymentMethod(searchTarget),
          isRecurring: rule.isRecurring ?? false,
          recurrenceFrequency: rule.recurrenceFrequency,
          tags: rule.tags || [],
          ruleMatched: `Catálogo Inteligente: "${rule.name}"`,
          confidence: 'high',
        };
      }
    }
  }

  // 3. Fallback inteligente: tentar inferir método de pagamento e recorrência mesmo sem categoria exata
  const detectedMethod = detectPaymentMethod(searchTarget);
  const { isRecurring, recurrenceFrequency } = detectIsRecurring(searchTarget);

  return {
    categoryId: undefined,
    paymentMethod: detectedMethod,
    isRecurring,
    recurrenceFrequency,
    tags: isRecurring ? ['Recorrente'] : [],
    ruleMatched: undefined,
    confidence: 'low',
  };
}
