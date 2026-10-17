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
  // Gestão de Arquivos e Backups
  backup: {
    createBackup: () => Promise<{ success: boolean; filePath: string }>;
    restoreBackup: () => Promise<{ success: boolean; message: string }>;
    exportData: (format: 'json' | 'csv' | 'sqlite', dataPayload?: any) => Promise<{ success: boolean; path?: string }>;
    importData: () => Promise<{ success: boolean; content?: string; format?: string }>;
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
    createBackup: () => ipcRenderer.invoke('backup:create'),
    restoreBackup: () => ipcRenderer.invoke('backup:restore'),
    exportData: (format, dataPayload) => ipcRenderer.invoke('data:export', { format, dataPayload }),
    importData: () => ipcRenderer.invoke('data:import'),
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
