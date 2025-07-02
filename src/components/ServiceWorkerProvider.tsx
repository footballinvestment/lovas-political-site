// src/components/ServiceWorkerProvider.tsx
"use client";

import { useEffect, useState } from 'react';
import { getServiceWorkerManager } from '@/lib/service-worker-manager';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

function UpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium">Frissítés elérhető</h4>
          <p className="text-sm text-blue-100 mt-1">
            Új verzió érhető el az alkalmazásból. Frissítse most a legújabb funkciókért.
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={onUpdate}
              className="text-xs bg-white text-blue-600 px-3 py-1 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              Frissítés
            </button>
            <button
              onClick={onDismiss}
              className="text-xs text-blue-200 hover:text-white transition-colors"
            >
              Később
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfflineNotification() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white p-2 text-center text-sm z-50">
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 8.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>Offline mód - Korlátozott funkcionalitás</span>
      </div>
    </div>
  );
}

export default function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Only register service worker in production and if supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const shouldRegister = isProduction || process.env.NEXT_PUBLIC_SW_DEV === 'true';

    if (!shouldRegister) {
      console.log('Service Worker registration skipped in development');
      return;
    }

    registerServiceWorker();
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('Registering Service Worker...');
      
      // Initialize service worker manager
      const swManager = getServiceWorkerManager();
      const registered = await swManager.initialize();

      if (registered) {
        setIsRegistered(true);
        console.log('✅ Service Worker registered successfully');

        // Listen for update events
        window.addEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate);

        // Listen for cache events
        window.addEventListener('videoCacheStatus', handleCacheStatus);

        // Start cache monitoring
        swManager.startCacheMonitoring();

        // Initialize offline support
        initializeOfflineSupport();

      } else {
        console.warn('⚠️ Service Worker registration failed');
      }
    } catch (error) {
      console.error('❌ Service Worker registration error:', error);
    }
  };

  const handleServiceWorkerUpdate = (event: any) => {
    console.log('🔄 Service Worker update detected');
    setUpdateAvailable(true);
    setShowUpdateNotification(true);
  };

  const handleCacheStatus = (event: any) => {
    const { detail } = event;
    console.log('📊 Cache status:', detail);

    // Show warning if cache is getting full
    if (detail.usagePercentage > 90) {
      console.warn('⚠️ Video cache is nearly full');
    }
  };

  const handleUpdate = async () => {
    try {
      console.log('🔄 Applying Service Worker update...');
      
      // Get the service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration?.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Listen for controlling change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Reload the page to get the latest version
          window.location.reload();
        });
      }
      
      setShowUpdateNotification(false);
    } catch (error) {
      console.error('❌ Failed to update Service Worker:', error);
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdateNotification(false);
    
    // Show notification again after 1 hour
    setTimeout(() => {
      if (updateAvailable) {
        setShowUpdateNotification(true);
      }
    }, 60 * 60 * 1000);
  };

  const initializeOfflineSupport = () => {
    // Cache critical pages for offline access
    const criticalPages = [
      '/',
      '/program',
      '/kapcsolat',
      '/esemenyek',
    ];

    // Preload critical pages in background
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        criticalPages.forEach(page => {
          fetch(page).catch(() => {
            // Silent fail - page will be cached on first visit
          });
        });
      });
    }
  };

  return (
    <>
      {children}
      
      {/* Offline notification */}
      <OfflineNotification />
      
      {/* Update notification */}
      {showUpdateNotification && (
        <UpdateNotification
          onUpdate={handleUpdate}
          onDismiss={handleDismissUpdate}
        />
      )}
      
      {/* Service Worker status indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-xs z-40">
          SW: {isRegistered ? '✅' : '❌'}
        </div>
      )}
    </>
  );
}