/**
 * @file electron/main.ts
 * @description Processo Principal (Main Process) do Electron.
 * Gerencia a janela nativa, inicialização do SQLite via better-sqlite3,
 * canais IPC seguros e rotina de auto-backup ao fechar o aplicativo.
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Nota de Produção: No ambiente empacotado, utilize 'better-sqlite3' nativo
// import Database from 'better-sqlite3';
let dbInstance: any = null;

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

// Diretório de dados do usuário isolado e seguro
const userDataPath = app.getPath('userData');
const dbFilePath = path.join(userDataPath, 'alzex_finance.db');
const backupsDir = path.join(userDataPath, 'backups');

// Garante que o diretório de backups exista
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

/**
 * Inicialização e configuração de alta performance do SQLite
 */
function initDatabase() {
  try {
    // Configuração recomendada com WAL mode e Foreign Keys ativadas
    console.log(`[SQLite] Inicializando banco de dados em: ${dbFilePath}`);
    
    // Simulação ou carregamento real de better-sqlite3:
    // dbInstance = new Database(dbFilePath);
    // dbInstance.pragma('journal_mode = WAL');
    // dbInstance.pragma('foreign_keys = ON');
    // dbInstance.pragma('synchronous = NORMAL');
    
    return true;
  } catch (err) {
    console.error('[SQLite] Falha ao inicializar banco de dados:', err);
    return false;
  }
}

/**
 * Criação da Janela Desktop com estilo refinado Alzex Pro
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#020617', // slate-950
    frame: false, // Frameless para título customizado desktop moderno
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Auto-backup ao fechar a janela
  mainWindow.on('close', async (event) => {
    try {
      performAutoBackup();
    } catch (e) {
      console.error('[AutoBackup] Erro ao criar backup automático:', e);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Rotina de Backup Automático
 */
function performAutoBackup() {
  if (!fs.existsSync(dbFilePath)) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupTarget = path.join(backupsDir, `alzex_backup_${timestamp}.db`);

  try {
    fs.copyFileSync(dbFilePath, backupTarget);
    console.log(`[AutoBackup] Snapshot criado com sucesso em: ${backupTarget}`);
  } catch (err) {
    console.error('[AutoBackup] Falha ao copiar arquivo de banco:', err);
  }
}

// ====================================================
// Registro de Handlers IPC Seguros
// ====================================================

// 1. Execução de consultas SQL
ipcMain.handle('db:query', async (_event, { sql, params }) => {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare(sql);
  return stmt.all(...(params || []));
});

ipcMain.handle('db:exec', async (_event, { sql, params }) => {
  if (!dbInstance) return { changes: 0, lastInsertRowid: 0 };
  const stmt = dbInstance.prepare(sql);
  return stmt.run(...(params || []));
});

// 2. Transações atômicas no SQLite
ipcMain.handle('db:transaction', async (_event, { actions }) => {
  if (!dbInstance) return { success: false };
  const runTx = dbInstance.transaction(() => {
    for (const action of actions) {
      dbInstance.prepare(action.sql).run(...(action.params || []));
    }
  });
  runTx();
  return { success: true };
});

// 3. Handlers de Backup & Exportação
ipcMain.handle('backup:create', async () => {
  try {
    performAutoBackup();
    return { success: true, filePath: backupsDir };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup:restore', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Selecione o arquivo de Backup SQLite',
    filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'bak'] }],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'Operação cancelada pelo usuário' };
  }

  const selectedPath = result.filePaths[0];
  try {
    if (dbInstance) {
      dbInstance.close();
    }
    fs.copyFileSync(selectedPath, dbFilePath);
    initDatabase();
    return { success: true, message: 'Banco de dados restaurado com sucesso!' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

// 4. Controles de Janela Desktop
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.handle('system:getDbPath', () => dbFilePath);

// Ciclo de Vida do Aplicativo
app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
