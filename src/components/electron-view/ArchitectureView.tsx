import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { 
  Database, 
  Terminal, 
  FolderTree, 
  Download, 
  Copy, 
  Check, 
  Cpu, 
  ShieldCheck, 
  Package, 
  FileCode2,
  RefreshCw,
  Upload
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const { generateSqlDump, exportJsonData, importJsonData, resetToSampleData } = useFinanceStore();

  const [activeCodeTab, setActiveCodeTab] = useState<'drizzle' | 'preload' | 'main' | 'builder' | 'tree' | 'sqldump'>('drizzle');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const sqlContent = generateSqlDump();
    const blob = new Blob([sqlContent], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alzex_finance_dump_${new Date().toISOString().split('T')[0]}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonContent = exportJsonData();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alzex_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const projectTree = `alzex-finance-pro/
├── electron/                   # Processo Principal do Electron
│   ├── main.ts                # Inicialização da janela, better-sqlite3 e auto-backup
│   └── preload.ts             # ContextBridge seguro expondo window.alzexApi
├── src/
│   ├── db/
│   │   ├── schema.ts          # Schema Relacional Drizzle ORM (Tabelas, Relacionamentos)
│   │   └── drizzle.config.ts  # Configuração de Migrations SQLite
│   ├── components/
│   │   ├── layout/            # Titlebar desktop personalizada, Sidebar e navegação
│   │   ├── transactions/      # Grid estilo Alzex, Formulário com Splits e Autocomplete
│   │   ├── budgets/           # Metas, teto de gastos e alertas visuais de progresso
│   │   └── reports/           # Gráficos Donut, fluxo de caixa e rateio por membros
│   ├── store/
│   │   └── useFinanceStore.ts # Gerenciamento de estado reativo offline-first (Zustand)
│   ├── types/
│   │   └── index.ts           # Definições estritas de TypeScript
│   ├── App.tsx
│   └── main.tsx
├── electron-builder.json       # Configuração de empacotamento Windows Portable .exe e NSIS
├── package.json
└── tsconfig.json`;

  const packageJsonScripts = `{
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build && tsc -p tsconfig.electron.json",
    "electron:dev": "concurrently \"vite\" \"wait-on tcp:3000 && electron .\"",
    "electron:build": "npm run build && electron-builder --win portable --x64"
  }
}`;

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950">
      {/* Header com Ações de Backup */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Arquitetura de Engenharia & Entregáveis Técnicos
          </h2>
          <p className="text-xs text-slate-400">
            Documentação viva com o Schema Drizzle ORM, Scripts Electron, Bridge IPC seguro e Gerador SQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-colors cursor-pointer"
            title="Download do dump SQL com CREATE TABLE e INSERTS"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar DDL SQLite (.sql)</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup JSON</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados de exemplo originais?')) {
                resetToSampleData();
              }
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Resetar dados para estado inicial"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>
      </div>

      {/* Cards com os 4 Pilares da Solução */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-200">1. Drizzle ORM + SQLite</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Schema relacional normalizado com suporte nativo a WAL mode, foreign keys e cascata de deleção.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-200">2. IPC Bridge Seguro</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Isolamento de contexto total via ContextBridge, impedindo que o renderer acesse Node.js diretamente.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
            <Package className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-200">3. Windows Portable .exe</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Configuração pronta no electron-builder para gerar executável standalone portátil sem necessidade de instalação.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
            <FileCode2 className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-200">4. Split Transactions</h4>
          <p className="text-[11px] text-slate-400 mt-1">
            Transações rateadas em múltiplas categorias e membros da família com validação de saldo restante.
          </p>
        </div>
      </div>

      {/* Visualizador de Código das Entregas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Barra de Abas */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveCodeTab('drizzle')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeCodeTab === 'drizzle' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              src/db/schema.ts
            </button>
            <button
              onClick={() => setActiveCodeTab('preload')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeCodeTab === 'preload' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              electron/preload.ts
            </button>
            <button
              onClick={() => setActiveCodeTab('main')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeCodeTab === 'main' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              electron/main.ts
            </button>
            <button
              onClick={() => setActiveCodeTab('builder')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeCodeTab === 'builder' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              electron-builder.json
            </button>
            <button
              onClick={() => setActiveCodeTab('tree')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeCodeTab === 'tree' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Estrutura de Pastas
            </button>
            <button
              onClick={() => setActiveCodeTab('sqldump')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeCodeTab === 'sqldump' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live SQL Dump
            </button>
          </div>

          <button
            onClick={() => {
              if (activeCodeTab === 'tree') handleCopy(projectTree);
              else if (activeCodeTab === 'builder') handleCopy(packageJsonScripts);
              else if (activeCodeTab === 'sqldump') handleCopy(generateSqlDump());
              else handleCopy('// Copiado do código fonte');
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* Bloco de Código com Sintaxe */}
        <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[500px]">
          {activeCodeTab === 'tree' && (
            <pre className="text-emerald-400 leading-relaxed">{projectTree}</pre>
          )}

          {activeCodeTab === 'builder' && (
            <div className="space-y-4">
              <div className="text-slate-400 text-[11px] font-sans pb-1 border-b border-slate-800">
                // 1. Configuração de Scripts no package.json:
              </div>
              <pre className="text-sky-300">{packageJsonScripts}</pre>
              <div className="text-slate-400 text-[11px] font-sans pb-1 border-b border-slate-800 pt-3">
                // 2. Configuração do electron-builder.json:
              </div>
              <pre className="text-amber-300">
{`{
  "appId": "com.alzexfinance.desktop",
  "productName": "Alzex Finance Pro",
  "directories": { "output": "release" },
  "win": {
    "target": [{ "target": "nsis" }, { "target": "portable" }],
    "icon": "public/icon.ico"
  },
  "portable": {
    "artifactName": "Alzex-Finance-Portable.exe"
  }
}`}
              </pre>
            </div>
          )}

          {activeCodeTab === 'drizzle' && (
            <pre className="text-slate-300 leading-relaxed">
{`// src/db/schema.ts - Schema Drizzle ORM SQLite
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const currencies = sqliteTable('currencies', {
  code: text('code', { length: 3 }).primaryKey(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  rateToBase: real('rate_to_base').notNull().default(1.0),
  isBase: integer('is_base', { mode: 'boolean' }).default(false),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['wallet', 'checking', 'credit_card', 'investment', 'savings'] }).notNull(),
  initialBalance: real('initial_balance').notNull().default(0.0),
  currentBalance: real('current_balance').notNull().default(0.0),
  currencyCode: text('currency_code').references(() => currencies.code),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  parentId: text('parent_id'), // Hierarquia infinita de subcategorias
  type: text('type', { enum: ['expense', 'income'] }).notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
});

export const familyMembers = sqliteTable('family_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  color: text('color').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  type: text('type', { enum: ['expense', 'income', 'transfer'] }).notNull(),
  amount: real('amount').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  toAccountId: text('to_account_id').references(() => accounts.id),
  categoryId: text('category_id').references(() => categories.id),
  familyMemberId: text('family_member_id').references(() => familyMembers.id),
  status: text('status', { enum: ['cleared', 'pending', 'void'] }).default('cleared'),
  payee: text('payee').notNull(),
  isSplit: integer('is_split', { mode: 'boolean' }).default(false),
});

export const transactionSplits = sqliteTable('transaction_splits', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  familyMemberId: text('family_member_id').references(() => familyMembers.id),
  notes: text('notes'),
});`}
            </pre>
          )}

          {activeCodeTab === 'preload' && (
            <pre className="text-slate-300 leading-relaxed">
{`// electron/preload.ts - ContextBridge Seguro
import { contextBridge, ipcRenderer } from 'electron';

export interface AlzexDesktopAPI {
  db: {
    query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
    exec: (sql: string, params?: any[]) => Promise<{ changes: number; lastInsertRowid: number }>;
  };
  backup: {
    createBackup: () => Promise<{ success: boolean; filePath: string }>;
    restoreBackup: () => Promise<{ success: boolean }>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}

// Expõe métodos estritamente tipados e blindados para o renderer
contextBridge.exposeInMainWorld('alzexApi', {
  db: {
    query: (sql, params = []) => ipcRenderer.invoke('db:query', { sql, params }),
    exec: (sql, params = []) => ipcRenderer.invoke('db:exec', { sql, params }),
  },
  backup: {
    createBackup: () => ipcRenderer.invoke('backup:create'),
    restoreBackup: () => ipcRenderer.invoke('backup:restore'),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
});`}
            </pre>
          )}

          {activeCodeTab === 'main' && (
            <pre className="text-slate-300 leading-relaxed">
{`// electron/main.ts - Processo Principal com better-sqlite3 e Auto-backup
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';

let db = new Database(path.join(app.getPath('userData'), 'alzex_finance.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

ipcMain.handle('db:query', async (_e, { sql, params }) => {
  return db.prepare(sql).all(...(params || []));
});

ipcMain.handle('db:exec', async (_e, { sql, params }) => {
  return db.prepare(sql).run(...(params || []));
});

// Auto-backup ao fechar
mainWindow.on('close', () => {
  const backupPath = path.join(app.getPath('userData'), 'backups', \`backup_\${Date.now()}.db\`);
  fs.copyFileSync(dbPath, backupPath);
});`}
            </pre>
          )}

          {activeCodeTab === 'sqldump' && (
            <pre className="text-emerald-300 leading-relaxed">{generateSqlDump()}</pre>
          )}
        </div>
      </div>
    </div>
  );
};
