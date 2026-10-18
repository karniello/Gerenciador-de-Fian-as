/**
 * @file electron/preload.ts
 * @description Preload script com ContextBridge seguro para Electron.
 * Expõe apenas métodos estritamente tipados e controlados para o renderer.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface AlzexDesktopAPI {
  // Execução de consultas SQLite seguras
  db: {
    query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
    exec: (sql: string, params?: any[]) => Promise<{ changes: number; lastInsertRowid: number | bigint }>;
    transaction: <T = any>(callbackId: string, actions: Array<{ sql: string; params?: any[] }>) => Promise<T>;
  };
  // Gestão de Arquivos e Auto-Backup Definido pelo Usuário
  backup: {
    getSettings: () => Promise<{
      autoBackupEnabled: boolean;
      customBackupDir: string | null;
      maxBackupsToKeep: number;
      lastBackupDate: string | null;
      defaultBackupsDir: string;
      activeBackupDir: string;
    }>;
    selectFolder: () => Promise<{
      success: boolean;
      folderPath?: string;
      message?: string;
      config?: any;
    }>;
    updateSettings: (settings: {
      autoBackupEnabled?: boolean;
      customBackupDir?: string | null;
      maxBackupsToKeep?: number;
    }) => Promise<{ success: boolean; config: any }>;
    triggerManual: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
    restoreBackup: () => Promise<{ success: boolean; message: string }>;
  };
  // Notificações Nativas do Sistema Operacional
  notifications: {
    send: (options: { title: string; body: string; icon?: string }) => Promise<{ success: boolean; error?: string; reason?: string }>;
    isSupported: () => Promise<boolean>;
  };
  // Controles de Janela do Desktop
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
  };
  // Informações do Sistema
  system: {
    isElectron: boolean;
    appVersion: string;
    platform: string;
    dbPath: () => Promise<string>;
  };
}

const alzexApi: AlzexDesktopAPI = {
  db: {
    query: (sql, params = []) => ipcRenderer.invoke('db:query', { sql, params }),
    exec: (sql, params = []) => ipcRenderer.invoke('db:exec', { sql, params }),
    transaction: (callbackId, actions) => ipcRenderer.invoke('db:transaction', { callbackId, actions }),
  },
  backup: {
    getSettings: () => ipcRenderer.invoke('backup:get-settings'),
    selectFolder: () => ipcRenderer.invoke('backup:select-folder'),
    updateSettings: (settings) => ipcRenderer.invoke('backup:update-settings', settings),
    triggerManual: () => ipcRenderer.invoke('backup:trigger-manual'),
    restoreBackup: () => ipcRenderer.invoke('backup:restore'),
  },
  notifications: {
    send: (options) => ipcRenderer.invoke('notifications:send', options),
    isSupported: () => ipcRenderer.invoke('notifications:isSupported'),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  system: {
    isElectron: true,
    appVersion: '1.0.0',
    platform: process.platform,
    dbPath: () => ipcRenderer.invoke('system:getDbPath'),
  },
};

// Expõe no objeto global window.alzexApi de forma blindada
contextBridge.exposeInMainWorld('alzexApi', alzexApi);
