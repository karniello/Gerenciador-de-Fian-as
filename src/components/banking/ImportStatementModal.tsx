import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import {
  FileSpreadsheet,
  Upload,
  FileText,
  Check,
  X,
  Sparkles,
  AlertCircle,
  CreditCard,
  Landmark,
  Calendar,
} from 'lucide-react';

const DEMO_OFX_SAMPLE = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEVERSION:102
NEWFILEVERSION:102

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001</TRNUID>
<STATUS>
<CODE>0</CODE>
<SEVERITY>INFO</SEVERITY>
</STATUS>
<STMTRS>
<CURDEF>BRL</CURDEF>
<BANKTRANLIST>
<DTSTART>20261001000000[-03:EST]</DTSTART>
<DTEND>20261017000000[-03:EST]</DTEND>

<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20261016120000</DTPOSTED>
<TRNAMT>-89.90</TRNAMT>
<FITID>OFX-20261016-01</FITID>
<MEMO>COMPRA CARTAO IFOOD *RESTAURANTE</MEMO>
</STMTTRN>

<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20261015143000</DTPOSTED>
<TRNAMT>-32.50</TRNAMT>
<FITID>OFX-20261015-02</FITID>
<MEMO>UBER *VIAGEM CIDADE</MEMO>
</STMTTRN>

<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20261014080000</DTPOSTED>
<TRNAMT>-284.15</TRNAMT>
<FITID>OFX-20261014-03</FITID>
<MEMO>DEB AUT ENEL SP ENERGIA</MEMO>
</STMTTRN>

<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20261012100000</DTPOSTED>
<TRNAMT>-55.90</TRNAMT>
<FITID>OFX-20261012-04</FITID>
<MEMO>NETFLIX.COM BRASIL</MEMO>
</STMTTRN>

<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20261010183000</DTPOSTED>
<TRNAMT>-112.40</TRNAMT>
<FITID>OFX-20261010-05</FITID>
<MEMO>COMPRA DEBITO PAO DE ACUCAR</MEMO>
</STMTTRN>

</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

export const ImportStatementModal: React.FC = () => {
  const {
    isImportStatementModalOpen,
    closeImportStatementModal,
    selectedImportAccountId,
    accounts,
    importStatementTransactions,
    categories,
  } = useFinanceStore();

  const [accountId, setAccountId] = useState<string>(
    selectedImportAccountId || accounts[0]?.id || 'acc-2'
  );
  const [format, setFormat] = useState<'ofx' | 'csv' | 'text'>('ofx');
  const [rawContent, setRawContent] = useState<string>(DEMO_OFX_SAMPLE);

  if (!isImportStatementModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.ofx')) setFormat('ofx');
    else if (fileName.endsWith('.csv')) setFormat('csv');
    else setFormat('text');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setRawContent(text);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!rawContent.trim() || !accountId) return;
    importStatementTransactions(accountId, rawContent, format);
  };

  const handleLoadSample = (type: 'ofx' | 'csv' | 'text') => {
    setFormat(type);
    if (type === 'ofx') {
      setRawContent(DEMO_OFX_SAMPLE);
    } else if (type === 'csv') {
      setRawContent(`Data,Historico,Valor
16/10/2026,"COMPRA CARTAO IFOOD *BURGER",-56.90
15/10/2026,"UBER *TRIP CENTRO",-27.80
14/10/2026,"DEB AUT SABESP SANEAMENTO",-118.40
13/10/2026,"SMART FIT ACADEMIA",-129.90
11/10/2026,"COMPRA DEBITO PADARIA",-34.50`);
    } else {
      setRawContent(`16/10/2026 - R$ 45,90 - IFOOD *PEDIDO 8812
15/10/2026 - R$ 120,00 - POSTO SHELL COMBUSTIVEL
14/10/2026 - R$ 1.850,00 - DEB AUT CONDOMINIO
12/10/2026 - R$ 55,90 - NETFLIX.COM`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Importar Extrato Bancário
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                  OFX / CSV / Texto
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Importe seu extrato e catalogue automaticamente gastos no cartão e débitos em conta
              </p>
            </div>
          </div>
          <button
            onClick={closeImportStatementModal}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Seletor de Conta de Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Conta de Destino no Sistema:
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currencyCode} - {acc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Formato do Extrato:
              </label>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['ofx', 'csv', 'text'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      format === fmt
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Upload de Arquivo ou Colar Texto */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Conteúdo do Extrato:
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Carregar modelo:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSample('ofx')}
                  className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                >
                  OFX
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('csv')}
                  className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('text')}
                  className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                >
                  Texto
                </button>
              </div>
            </div>

            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows={8}
              placeholder="Cole o extrato bancário aqui ou selecione um arquivo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Selecionador de Arquivo */}
          <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-lg p-4 text-center cursor-pointer relative">
            <input
              type="file"
              accept=".ofx,.csv,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-300 font-medium">
              Clique para selecionar um arquivo <span className="text-emerald-400">.OFX</span>,{' '}
              <span className="text-emerald-400">.CSV</span> ou arraste aqui
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Suporta extratos do Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, C6, XP, etc.
            </p>
          </div>

          {/* Benefícios da Catalogação Automática */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300">Catalogação Automática em Lote:</strong> Cada linha do
              extrato será analisada pelo motor de inteligência financeira. Compras no cartão de crédito ou
              débito, assinaturas recorrentes e débitos em conta serão identificados e categorizados de
              imediato.
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={closeImportStatementModal}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleImport}
            disabled={!rawContent.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Processar & Importar Extrato</span>
          </button>
        </div>
      </div>
    </div>
  );
};
