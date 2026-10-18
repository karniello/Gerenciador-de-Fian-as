/**
 * @file electron/main.ts
 * @description Processo Principal (Main Process) do Electron.
 * Gerencia a janela nativa, inicialização do SQLite via better-sqlite3,
 * canais IPC seguros e rotina de auto-backup do banco de dados para
 * uma pasta configurada pelo usuário ao fechar a aplicação.
 */

import { app, BrowserWindow, ipcMain, dialog, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Nota de Produção: No ambiente empacotado, utilize 'better-sqlite3' nativo
// import Database from 'better-sqlite3';
let dbInstance: any = null;

let mainWindow: BrowserWindow | null = null;
let isClosingCleanly = false; // Flag para garantir a conclusão do backup assíncrono antes de fechar
const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

// Diretórios e Arquivos de Sistema
const userDataPath = app.getPath('userData');
const dbFilePath = path.join(userDataPath, 'alzex_finance.db');
const defaultBackupsDir = path.join(userDataPath, 'backups');
const configFilePath = path.join(userDataPath, 'alzex_backup_config.json');

// Interface de Configuração de Backup Definida pelo Usuário
export interface BackupConfig {
  autoBackupEnabled: boolean;
  customBackupDir: string | null; // Pasta escolhida pelo usuário (ex: Google Drive, Dropbox, D:\Backups)
  maxBackupsToKeep: number;       // Rotação de arquivos para não lotar o disco (padrão: 15)
  lastBackupDate: string | null;
}

const defaultBackupConfig: BackupConfig = {
  autoBackupEnabled: true,
  customBackupDir: null, // null indica uso da pasta padrão defaultBackupsDir
  maxBackupsToKeep: 15,
  lastBackupDate: null,
};

/**
 * Carrega as preferências do usuário do arquivo JSON
 */
function loadBackupConfig(): BackupConfig {
  try {
    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath, 'utf-8');
      return { ...defaultBackupConfig, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('[Config] Erro ao carregar configurações de backup:', err);
  }
  return defaultBackupConfig;
}

/**
 * Salva as preferências de backup do usuário
 */
function saveBackupConfig(config: Partial<BackupConfig>): BackupConfig {
  const current = loadBackupConfig();
  const updated: BackupConfig = { ...current, ...config };
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('[Config] Configurações de backup atualizadas com sucesso.');
  } catch (err) {
    console.error('[Config] Erro ao gravar configurações de backup:', err);
  }
  return updated;
}

// Garante que o diretório padrão de backups exista
if (!fs.existsSync(defaultBackupsDir)) {
  fs.mkdirSync(defaultBackupsDir, { recursive: true });
}

/**
 * Inicialização e configuração de alta performance do SQLite
 */
function initDatabase() {
  try {
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
 * Rotina Central de Auto-Backup:
 * 1. Resgata a pasta definida pelo usuário (ou padrão).
 * 2. Executa checkpoint no SQLite para descarregar o WAL.
 * 3. Cria snapshot com carimbo de data/hora (ISO seguro para nomes de arquivo).
 * 4. Aplica rotação automática mantendo apenas as N últimas cópias.
 */
async function performAutoBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    if (!fs.existsSync(dbFilePath)) {
      console.warn('[AutoBackup] Banco de dados original ainda não foi gerado no disco.');
      return { success: false, error: 'Banco de dados não encontrado.' };
    }

    const config = loadBackupConfig();
    
    // Determina a pasta de destino: personalizada do usuário OU padrão
    let destinationDir = defaultBackupsDir;
    if (config.customBackupDir && config.customBackupDir.trim().length > 0) {
      destinationDir = config.customBackupDir.trim();
    }

    // Cria a pasta de destino se ainda não existir
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Ponto de verificação do WAL antes do snapshot (garante consistência atômica)
    try {
      if (dbInstance) {
        dbInstance.pragma('wal_checkpoint(TRUNCATE)');
      }
    } catch (walErr) {
      console.warn('[AutoBackup] Aviso no checkpoint do WAL:', walErr);
    }

    // Nome do arquivo com timestamp: alzex_backup_YYYY-MM-DD_HH-mm-ss.db
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFileName = `alzex_backup_${dateStr}_${timeStr}.db`;
    const targetFilePath = path.join(destinationDir, backupFileName);

    // Se better-sqlite3 estiver ativo, pode usar dbInstance.backup(targetFilePath) nativo;
    // caso contrário, realiza cópia binária atômica:
    if (dbInstance && typeof dbInstance.backup === 'function') {
      await dbInstance.backup(targetFilePath);
    } else {
      fs.copyFileSync(dbFilePath, targetFilePath);
    }

    console.log(`[AutoBackup] Backup automático concluído com sucesso em: ${targetFilePath}`);

    // Atualiza a data do último backup na configuração
    saveBackupConfig({ lastBackupDate: now.toISOString() });

    // Rotação de backups antigos para preservar espaço em disco
    cleanOldBackups(destinationDir, config.maxBackupsToKeep);

    return { success: true, filePath: targetFilePath };
  } catch (err: any) {
    console.error('[AutoBackup] Falha crítica ao gerar backup automático:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Remove backups antigos além do limite configurado pelo usuário
 */
function cleanOldBackups(dir: string, maxToKeep: number) {
  try {
    const files = fs.readdirSync(dir)
      .filter((file) => file.startsWith('alzex_backup_') && (file.endsWith('.db') || file.endsWith('.sqlite')))
      .map((file) => {
        const fullPath = path.join(dir, file);
        return {
          name: file,
          path: fullPath,
          time: fs.statSync(fullPath).mtimeMs,
        };
      })
      .sort((a, b) => b.time - a.time); // Ordena do mais recente para o mais antigo

    if (files.length > maxToKeep) {
      const filesToDelete = files.slice(maxToKeep);
      filesToDelete.forEach((f) => {
        try {
          fs.unlinkSync(f.path);
          console.log(`[AutoBackup] Rotação: Backup antigo removido: ${f.name}`);
        } catch (delErr) {
          console.warn(`[AutoBackup] Não foi possível remover backup antigo ${f.name}:`, delErr);
        }
      });
    }
  } catch (err) {
    console.error('[AutoBackup] Erro durante a rotação de backups antigos:', err);
  }
}

/**
 * Criação da Janela Desktop com interceptação segura de fechamento
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#020617', // slate-950
    frame: false,
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

  // ====================================================
  // Interceptação do Fechamento para Execução do Auto-Backup
  // ====================================================
  mainWindow.on('close', async (event: any) => {
    if (!isClosingCleanly) {
      // Impede o fechamento abrupto imediato
      event.preventDefault();

      const config = loadBackupConfig();
      if (config.autoBackupEnabled) {
        console.log('[AutoBackup] Interceptado fechamento da janela. Executando auto-backup...');
        try {
          await performAutoBackup();
        } catch (backupError) {
          console.error('[AutoBackup] Falha durante o backup no fechamento:', backupError);
        }
      }

      // Permite o fechamento definitivo da janela após o término do backup
      isClosingCleanly = true;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ====================================================
// Registro de Handlers IPC Seguros
// ====================================================

// 1. Execução de consultas SQL
ipcMain.handle('db:query', async (_event: any, { sql, params }: any) => {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare(sql);
  return stmt.all(...(params || []));
});

ipcMain.handle('db:exec', async (_event: any, { sql, params }: any) => {
  if (!dbInstance) return { changes: 0, lastInsertRowid: 0 };
  const stmt = dbInstance.prepare(sql);
  return stmt.run(...(params || []));
});

// 2. Transações atômicas no SQLite
ipcMain.handle('db:transaction', async (_event: any, { actions }: any) => {
  if (!dbInstance) return { success: false };
  const runTx = dbInstance.transaction(() => {
    for (const action of actions) {
      dbInstance.prepare(action.sql).run(...(action.params || []));
    }
  });
  runTx();
  return { success: true };
});

// 3. Handlers de Configuração e Execução de Backup Definido pelo Usuário
ipcMain.handle('backup:get-settings', async () => {
  const config = loadBackupConfig();
  return {
    ...config,
    defaultBackupsDir,
    activeBackupDir: config.customBackupDir || defaultBackupsDir,
  };
});

// Abre diálogo nativo do sistema operacional para o usuário escolher a pasta de backup
ipcMain.handle('backup:select-folder', async () => {
  if (!mainWindow) return { success: false, message: 'Janela principal indisponível.' };

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecione a Pasta para Backup Automático ao Fechar',
    buttonLabel: 'Usar Esta Pasta para Backup',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'Seleção cancelada pelo usuário.' };
  }

  const selectedFolder = result.filePaths[0];
  const updatedConfig = saveBackupConfig({ customBackupDir: selectedFolder });

  return {
    success: true,
    folderPath: selectedFolder,
    config: updatedConfig,
  };
});

ipcMain.handle('backup:update-settings', async (_event: any, newSettings: Partial<BackupConfig>) => {
  const updated = saveBackupConfig(newSettings);
  return { success: true, config: updated };
});

ipcMain.handle('backup:trigger-manual', async () => {
  return await performAutoBackup();
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

// 5. Notificações Nativas do Sistema Operacional para Lembretes de Vencimento
ipcMain.handle('notifications:send', async (_event: any, { title, body, icon }: any) => {
  try {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'Alzex Finance Pro',
        body: body || '',
        icon: icon || path.join(__dirname, '../public/icon.png'),
      });
      notification.show();
      return { success: true };
    }
    return { success: false, reason: 'Notificações nativas não são suportadas no ambiente atual' };
  } catch (err: any) {
    console.error('[Notification] Falha ao disparar notificação nativa:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('notifications:isSupported', () => {
  return Notification.isSupported();
});

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
