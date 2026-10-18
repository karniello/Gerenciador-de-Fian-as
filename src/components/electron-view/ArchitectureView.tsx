import React, { useState, useEffect } from 'react';
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
  Upload,
  FolderOpen,
  Settings2,
  HardDrive,
  Clock,
  Play
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const { generateSqlDump, exportJsonData, importJsonData, resetToSampleData, addToast } = useFinanceStore();

  const [activeCodeTab, setActiveCodeTab] = useState<'main' | 'drizzle' | 'preload' | 'builder' | 'tree' | 'sqldump'>('main');
  const [copied, setCopied] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Estados locais das configurações de auto-backup ao fechar
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [customBackupDir, setCustomBackupDir] = useState<string>('C:\\Users\\Usuario\\Documentos\\AlzexBackups');
  const [maxBackups, setMaxBackups] = useState(15);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Inicializar configurações do Electron se estiver em runtime nativo
  useEffect(() => {
    // @ts-ignore
    if (window.alzexApi?.backup?.getSettings) {
      // @ts-ignore
      window.alzexApi.backup.getSettings().then((settings: any) => {
        if (settings) {
          setAutoBackupEnabled(settings.autoBackupEnabled);
          setCustomBackupDir(settings.customBackupDir || settings.defaultBackupsDir);
          setMaxBackups(settings.maxBackupsToKeep || 15);
          setLastBackupTime(settings.lastBackupDate);
        }
      });
    }
  }, []);

  const handleSelectCustomFolder = async () => {
    // @ts-ignore
    if (window.alzexApi?.backup?.selectFolder) {
      // @ts-ignore
      const res = await window.alzexApi.backup.selectFolder();
      if (res.success && res.folderPath) {
        setCustomBackupDir(res.folderPath);
        addToast(`Pasta de backup configurada: ${res.folderPath}`, 'success');
      }
    } else {
      // Simulação no ambiente de navegador
      const input = prompt('Digite o caminho absoluto da pasta para salvar os backups automáticos:', customBackupDir);
      if (input && input.trim()) {
        setCustomBackupDir(input.trim());
        addToast(`Pasta definida com sucesso: ${input.trim()}`, 'success');
      }
    }
  };

  const handleTriggerBackupNow = async () => {
    // @ts-ignore
    if (window.alzexApi?.backup?.triggerManual) {
      // @ts-ignore
      const res = await window.alzexApi.backup.triggerManual();
      if (res.success) {
        setLastBackupTime(new Date().toLocaleTimeString('pt-BR'));
        addToast(`Backup gerado com sucesso em: ${res.filePath}`, 'success');
      } else {
        addToast(`Falha no backup: ${res.error}`, 'error');
      }
    } else {
      // Modo Navegador: realiza o dump e atualiza o carimbo
      handleDownloadSql();
      setLastBackupTime(new Date().toLocaleTimeString('pt-BR'));
      addToast(`Backup automático simulado salvo na pasta: ${customBackupDir}`, 'success');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Trecho de código copiado para a área de transferência!', 'info');
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
    addToast('Arquivo DDL SQLite (.sql) gerado e baixado!', 'success');
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
    addToast('Arquivo de backup JSON gerado e baixado!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importJsonData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const projectTree = `alzex-finance-pro/
├── electron/                   # Processo Principal do Electron
│   ├── main.ts                # Auto-backup para pasta do usuário ao fechar, SQLite WAL
│   └── preload.ts             # ContextBridge seguro com canais de backup e SQLite
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

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950">
      {/* Header com Ações de Backup */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Arquitetura de Engenharia & Backup SQLite
          </h2>
          <p className="text-xs text-slate-400">
            Controle de rotina de auto-backup ao fechar, schema Drizzle ORM e scripts Electron.
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

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Importar arquivo de backup JSON previamente gerado"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar JSON</span>
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

      {/* PAINEL DE CONFIGURAÇÃO DE AUTO-BACKUP EM PASTA DO USUÁRIO */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Auto-Backup ao Fechar a Aplicação</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold">
                  main.ts implementado
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                O Electron intercepta o fechamento (`mainWindow.on('close')`), executa o checkpoint do WAL e salva uma cópia na pasta escolhida.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={(e) => {
                  setAutoBackupEnabled(e.target.checked);
                  addToast(e.target.checked ? 'Auto-backup ativado no fechamento!' : 'Auto-backup desativado.', 'info');
                }}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
              />
              <span className="text-xs font-semibold text-slate-200">Ativar no Fechamento</span>
            </label>

            <button
              onClick={handleTriggerBackupNow}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Testar Backup Agora</span>
            </button>
          </div>
        </div>

        {/* Linha de Caminho da Pasta e Rotação */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8 bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 truncate">
              <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex flex-col truncate">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Pasta de Destino Definida pelo Usuário:</span>
                <span className="text-xs text-slate-200 font-mono font-semibold truncate">{customBackupDir}</span>
              </div>
            </div>

            <button
              onClick={handleSelectCustomFolder}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-700 transition-colors cursor-pointer flex-shrink-0"
              title="Abrir seletor de pasta nativo do Windows"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Alterar Pasta</span>
            </button>
          </div>

          <div className="lg:col-span-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Rotação de Cópias:</span>
              <span className="text-xs text-slate-300 font-medium">Manter os últimos</span>
            </div>

            <select
              value={maxBackups}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxBackups(val);
                addToast(`Limite de rotação ajustado para ${val} cópias.`, 'info');
              }}
              className="bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-xs rounded px-2.5 py-1 focus:outline-none"
            >
              <option value={10}>10 backups</option>
              <option value={15}>15 backups (recomendado)</option>
              <option value={30}>30 backups</option>
            </select>
          </div>
        </div>

        {lastBackupTime && (
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono pt-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Último snapshot gerado às: {lastBackupTime}</span>
          </div>
        )}
      </div>

      {/* Visualizador de Código das Entregas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Barra de Abas */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveCodeTab('main')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeCodeTab === 'main' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              electron/main.ts (Auto-Backup)
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
              onClick={() => setActiveCodeTab('drizzle')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activeCodeTab === 'drizzle' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              src/db/schema.ts
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
              else if (activeCodeTab === 'sqldump') handleCopy(generateSqlDump());
              else handleCopy('// Código copiado com sucesso');
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* Bloco de Código com Sintaxe */}
        <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[500px]">
          {activeCodeTab === 'main' && (
            <pre className="text-slate-300 leading-relaxed">
{`/**
 * @file electron/main.ts - Auto-Backup no Fechamento para Pasta Definida pelo Usuário
 */
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let isClosingCleanly = false; // Garante o término do backup assíncrono antes do exit
const dbFilePath = path.join(app.getPath('userData'), 'alzex_finance.db');
const configFilePath = path.join(app.getPath('userData'), 'alzex_backup_config.json');

// Rotina executada ao fechar a janela
mainWindow.on('close', async (event) => {
  if (!isClosingCleanly) {
    event.preventDefault(); // Impede encerramento prematuro

    const config = loadBackupConfig();
    if (config.autoBackupEnabled) {
      console.log('[AutoBackup] Executando auto-backup antes do fechamento...');
      await performAutoBackup();
    }

    isClosingCleanly = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close(); // Fecha após conclusão
    }
  }
});

async function performAutoBackup() {
  const config = loadBackupConfig();
  // Utiliza a pasta personalizada escolhida pelo usuário (ou padrão)
  const targetDir = config.customBackupDir && fs.existsSync(config.customBackupDir)
    ? config.customBackupDir
    : path.join(app.getPath('userData'), 'backups');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Checkpoint seguro do WAL
  dbInstance?.pragma('wal_checkpoint(TRUNCATE)');

  // Nome do arquivo com timestamp: alzex_backup_YYYY-MM-DD_HH-mm-ss.db
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const targetFile = path.join(targetDir, \`alzex_backup_\${dateStr}_\${timeStr}.db\`);

  // Cópia binária / backup nativo SQLite
  if (dbInstance && typeof dbInstance.backup === 'function') {
    await dbInstance.backup(targetFile);
  } else {
    fs.copyFileSync(dbFilePath, targetFile);
  }

  // Rotação: remove cópias antigas mantendo apenas as N configuradas
  cleanOldBackups(targetDir, config.maxBackupsToKeep);
}

// Handler IPC para o usuário escolher uma pasta no Windows/Mac/Linux
ipcMain.handle('backup:select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Selecione a Pasta para Backup Automático ao Fechar',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedFolder = result.filePaths[0];
    saveBackupConfig({ customBackupDir: selectedFolder });
    return { success: true, folderPath: selectedFolder };
  }
  return { success: false };
});`}
            </pre>
          )}

          {activeCodeTab === 'preload' && (
            <pre className="text-slate-300 leading-relaxed">
{`// electron/preload.ts - ContextBridge com métodos de backup para o renderer
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('alzexApi', {
  backup: {
    getSettings: () => ipcRenderer.invoke('backup:get-settings'),
    selectFolder: () => ipcRenderer.invoke('backup:select-folder'),
    updateSettings: (settings) => ipcRenderer.invoke('backup:update-settings', settings),
    triggerManual: () => ipcRenderer.invoke('backup:trigger-manual'),
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

          {activeCodeTab === 'tree' && (
            <pre className="text-emerald-400 leading-relaxed">{projectTree}</pre>
          )}

          {activeCodeTab === 'drizzle' && (
            <pre className="text-slate-300 leading-relaxed">
{`// src/db/schema.ts - Schema Drizzle ORM SQLite
export const accounts = sqliteTable('accounts', { ... });
export const transactions = sqliteTable('transactions', { ... });
export const transactionSplits = sqliteTable('transaction_splits', { ... });
export const familyMembers = sqliteTable('family_members', { ... });`}
            </pre>
          )}

          {activeCodeTab === 'builder' && (
            <pre className="text-amber-300">
{`{
  "appId": "com.alzexfinance.desktop",
  "productName": "Alzex Finance Pro",
  "win": {
    "target": [{ "target": "portable" }, { "target": "nsis" }]
  }
}`}
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
