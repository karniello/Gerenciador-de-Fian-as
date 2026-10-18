/**
 * @file src/utils/notifications.ts
 * @description Utilitário para gerenciamento de notificações nativas do sistema (Electron / OS / Web)
 * e efeitos sonoros para o sistema de lembretes de transações do Alzex Finance Pro.
 */

// Sintetizador Web Audio API para alerta suave e elegante sem dependências externas
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tom 1 (587.33 Hz - Ré5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tom 2 (880 Hz - Lá5 - Harmônico mais alto e claro)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('[Audio] Não foi possível reproduzir som de notificação:', err);
  }
}

/**
 * Verifica se notificações nativas são suportadas no ambiente atual
 */
export function isNativeNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // @ts-ignore
  if (window.alzexApi?.notifications?.send) return true;
  return 'Notification' in window;
}

/**
 * Obtém o status da permissão atual do sistema
 */
export function getNativeNotificationPermission(): 'granted' | 'denied' | 'default' {
  if (typeof window === 'undefined') return 'denied';
  // @ts-ignore
  if (window.alzexApi?.notifications?.send) return 'granted';
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
}

/**
 * Solicita permissão ao usuário para emitir notificações nativas do SO
 */
export async function requestNativeNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  // @ts-ignore
  if (window.alzexApi?.notifications?.send) {
    return 'granted';
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error('[Notification] Erro ao solicitar permissão:', err);
      return 'denied';
    }
  }

  return 'denied';
}

/**
 * Dispara uma notificação nativa do sistema operacional (Desktop Electron ou Web)
 */
export async function sendNativeNotification(
  title: string,
  body: string,
  options?: {
    playChime?: boolean;
    onClick?: () => void;
  }
): Promise<boolean> {
  const shouldPlaySound = options?.playChime !== false;
  if (shouldPlaySound) {
    playNotificationSound();
  }

  // 1. Tentar via IPC do Electron (se em execução desktop)
  // @ts-ignore
  if (window.alzexApi?.notifications?.send) {
    try {
      // @ts-ignore
      const result = await window.alzexApi.notifications.send({ title, body });
      if (result?.success) return true;
    } catch (e) {
      console.warn('[Notification] Electron IPC falhou, tentando fallback web:', e);
    }
  }

  // 2. Fallback para a Web Notification API padrão do navegador / PWA
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          silent: false,
        });

        if (options?.onClick) {
          notif.onclick = () => {
            window.focus();
            options.onClick!();
          };
        }
        return true;
      } catch (err) {
        console.error('[Notification] Falha ao disparar Notification web:', err);
      }
    }
  }

  return false;
}

/**
 * Calcula a diferença em dias entre uma data YYYY-MM-DD e o dia de hoje (meia-noite local)
 */
export function getDaysDiffFromToday(dateStr: string): number {
  if (!dateStr) return 0;
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna uma data no formato ISO YYYY-MM-DD somada de X dias
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
