// src/lib/session-manager.ts
"use client";

export interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalMs: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeoutMinutes: 30, // 30 minutes of inactivity
  warningMinutes: 5,  // Show warning 5 minutes before timeout
  checkIntervalMs: 60000, // Check every minute
};

export class SessionManager {
  private config: SessionConfig;
  private lastActivity: number;
  private warningCallback?: () => void;
  private timeoutCallback?: () => void;
  private intervalId?: NodeJS.Timeout;
  private isActive: boolean = false;

  constructor(config: SessionConfig = DEFAULT_SESSION_CONFIG) {
    this.config = config;
    this.lastActivity = Date.now();
  }

  start(warningCallback?: () => void, timeoutCallback?: () => void): void {
    this.warningCallback = warningCallback;
    this.timeoutCallback = timeoutCallback;
    this.isActive = true;
    this.resetActivity();
    this.setupActivityListeners();
    this.startMonitoring();
  }

  stop(): void {
    this.isActive = false;
    this.removeActivityListeners();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  resetActivity(): void {
    this.lastActivity = Date.now();
  }

  getTimeUntilTimeout(): number {
    const elapsed = Date.now() - this.lastActivity;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    return Math.max(0, timeoutMs - elapsed);
  }

  getTimeUntilWarning(): number {
    const elapsed = Date.now() - this.lastActivity;
    const warningMs = (this.config.timeoutMinutes - this.config.warningMinutes) * 60 * 1000;
    return Math.max(0, warningMs - elapsed);
  }

  isWarningTime(): boolean {
    return this.getTimeUntilWarning() === 0 && this.getTimeUntilTimeout() > 0;
  }

  isTimedOut(): boolean {
    return this.getTimeUntilTimeout() === 0;
  }

  private setupActivityListeners(): void {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const resetActivity = () => this.resetActivity();

    events.forEach(event => {
      document.addEventListener(event, resetActivity, true);
    });

    // Store the cleanup function
    (window as any).__sessionManagerCleanup = () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity, true);
      });
    };
  }

  private removeActivityListeners(): void {
    if ((window as any).__sessionManagerCleanup) {
      (window as any).__sessionManagerCleanup();
      delete (window as any).__sessionManagerCleanup;
    }
  }

  private startMonitoring(): void {
    let warningShown = false;

    this.intervalId = setInterval(() => {
      if (!this.isActive) return;

      if (this.isTimedOut()) {
        this.stop();
        this.timeoutCallback?.();
        return;
      }

      if (this.isWarningTime() && !warningShown) {
        warningShown = true;
        this.warningCallback?.();
      }

      // Reset warning flag if user becomes active again
      if (!this.isWarningTime()) {
        warningShown = false;
      }
    }, this.config.checkIntervalMs);
  }
}

// Singleton instance for global session management
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

export function initializeSessionManager(
  config?: Partial<SessionConfig>,
  warningCallback?: () => void,
  timeoutCallback?: () => void
): SessionManager {
  const manager = getSessionManager();
  
  if (config) {
    manager.stop();
    sessionManagerInstance = new SessionManager({ ...DEFAULT_SESSION_CONFIG, ...config });
  }
  
  sessionManagerInstance.start(warningCallback, timeoutCallback);
  return sessionManagerInstance;
}

export function destroySessionManager(): void {
  if (sessionManagerInstance) {
    sessionManagerInstance.stop();
    sessionManagerInstance = null;
  }
}