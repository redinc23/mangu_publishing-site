import React, { useState, useEffect } from 'react';
import { useAnnouncer } from '../hooks/useA11y';
import { AccessibleButton, VisuallyHidden } from './A11yComponents';

/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app when installable
 */
export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { announce } = useAnnouncer();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      announce('App installation available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [announce]);

  useEffect(() => {
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      announce('App installed successfully');
    });
  }, [announce]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      announce('Installing app...');
    } else {
      announce('Installation cancelled');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    announce('Installation prompt dismissed');
  };

  if (!showPrompt) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-white rounded-lg shadow-2xl p-6 z-50 border border-gray-200"
    >
      <button
        onClick={handleDismiss}
        aria-label="Close installation prompt"
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <VisuallyHidden>Close</VisuallyHidden>
      </button>

      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 id="pwa-install-title" className="text-lg font-semibold text-gray-900 mb-2">
            Install MANGU Publishing
          </h3>
          <p id="pwa-install-description" className="text-sm text-gray-600 mb-4">
            Install our app for a better experience. Access your library offline and get quick access from your home screen.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <AccessibleButton
          onClick={handleInstall}
          variant="primary"
          className="flex-1"
          ariaLabel="Install MANGU Publishing app"
        >
          Install
        </AccessibleButton>
        <AccessibleButton
          onClick={handleDismiss}
          variant="secondary"
          ariaLabel="Dismiss installation prompt"
        >
          Not Now
        </AccessibleButton>
      </div>
    </div>
  );
};

/**
 * PWA Update Notification Component
 * Shows when a new version is available
 */
export const PWAUpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);
  const { announce } = useAnnouncer();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
              setRegistration(reg);
              announce('New app version available', 'assertive');
            }
          });
        });
      });
    }
  }, [announce]);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    announce('Update notification dismissed');
  };

  if (!showUpdate) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 right-4 left-4 md:left-auto md:w-96 bg-white rounded-lg shadow-2xl p-4 z-50 border border-gray-200"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-green-100 rounded-lg p-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Update Available
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            A new version is ready. Refresh to update.
          </p>
          <div className="flex gap-2">
            <AccessibleButton
              onClick={handleUpdate}
              variant="primary"
              className="text-sm py-1.5 px-3"
              ariaLabel="Update app now"
            >
              Refresh
            </AccessibleButton>
            <AccessibleButton
              onClick={handleDismiss}
              variant="secondary"
              className="text-sm py-1.5 px-3"
              ariaLabel="Dismiss update notification"
            >
              Later
            </AccessibleButton>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Offline Status Indicator
 */
export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { announce } = useAnnouncer();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      announce('Connection restored', 'assertive');
    };

    const handleOffline = () => {
      setIsOnline(false);
      announce('You are offline. Some features may be limited.', 'assertive');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [announce]);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium z-50"
    >
      <span className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        You're offline. Some features may be limited.
      </span>
    </div>
  );
};
