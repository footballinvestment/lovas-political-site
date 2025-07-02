// src/components/common/ServiceWorker.tsx
"use client";

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  isOnline: boolean;
  updateAvailable: boolean;
  isInstalling: boolean;
  error: string | null;
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    registration: null,
    isOnline: true,
    updateAvailable: false,
    isInstalling: false,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const registerSW = async () => {
      try {
        console.log('[SW] Registering service worker...');
        
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        setSwState(prev => ({ ...prev, registration, isInstalling: true }));

        // Handle installation
        registration.addEventListener('updatefound', () => {
          const newWorker = registration!.installing;
          if (newWorker) {
            console.log('[SW] New service worker installing...');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  console.log('[SW] New content available; please refresh.');
                  setSwState(prev => ({ 
                    ...prev, 
                    updateAvailable: true, 
                    isInstalling: false 
                  }));
                } else {
                  // Content is cached for the first time
                  console.log('[SW] Content is cached for offline use.');
                  setSwState(prev => ({ ...prev, isInstalling: false }));
                }
              }
            });
          }
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, payload } = event.data;
          
          switch (type) {
            case 'SW_UPDATE_AVAILABLE':
              setSwState(prev => ({ ...prev, updateAvailable: true }));
              break;
            case 'SW_CACHE_UPDATED':
              console.log('[SW] Cache updated:', payload);
              break;
          }
        });

        console.log('[SW] Service worker registered successfully');
        
      } catch (error) {
        console.error('[SW] Service worker registration failed:', error);
        setSwState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Registration failed',
          isInstalling: false,
        }));
      }
    };

    // Monitor online/offline status
    const updateOnlineStatus = () => {
      setSwState(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Register service worker
    registerSW();

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Provide service worker utilities to the app
  const swUtils = {
    ...swState,
    updateServiceWorker: () => {
      if (swState.registration?.waiting) {
        swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    },
    clearCache: async (cacheName?: string) => {
      if (swState.registration?.active) {
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          
          swState.registration.active!.postMessage(
            { type: 'CLEAR_CACHE', payload: { cacheName } },
            [messageChannel.port2]
          );
        });
      }
    },
    precacheUrls: async (urls: string[]) => {
      if (swState.registration?.active) {
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          
          swState.registration.active!.postMessage(
            { type: 'PRECACHE_URLS', payload: { urls } },
            [messageChannel.port2]
          );
        });
      }
    },
  };

  return (
    <ServiceWorkerContext.Provider value={swUtils}>
      {children}
      <ServiceWorkerNotifications />
    </ServiceWorkerContext.Provider>
  );
}

// Context for accessing service worker utilities
const ServiceWorkerContext = React.createContext<any>(null);

export function useServiceWorker() {
  const context = React.useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorker must be used within ServiceWorkerProvider');
  }
  return context;
}

// Component for service worker notifications
function ServiceWorkerNotifications() {
  const { updateAvailable, isOnline, updateServiceWorker } = useServiceWorker();
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    setShowUpdateBanner(updateAvailable);
  }, [updateAvailable]);

  useEffect(() => {
    setShowOfflineBanner(!isOnline);
  }, [isOnline]);

  if (showOfflineBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 8.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Nincs internetkapcsolat - Az oldal offline módban működik</span>
          </div>
          <button
            onClick={() => setShowOfflineBanner(false)}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (showUpdateBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Új verzió érhető el</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={updateServiceWorker}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
            >
              Frissítés
            </button>
            <button
              onClick={() => setShowUpdateBanner(false)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Hook for offline detection
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for service worker updates
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Check for updates every 10 minutes
      const interval = setInterval(() => {
        reg.update();
      }, 10 * 60 * 1000);

      return () => clearInterval(interval);
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setUpdateAvailable(true);
    });
  }, []);

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return { updateAvailable, applyUpdate };
}

// Component for PWA install prompt
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA install accepted');
    } else {
      console.log('PWA install dismissed');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Alkalmazás telepítése
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Telepítsd az oldalt az eszközödre a jobb élményért
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleInstall}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Telepítés
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Elhalasztás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}