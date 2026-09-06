import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';
import { FETLogo } from './FETLogo';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global hook or state for PWA install trigger
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let triggerListeners: Array<(canInstall: boolean) => void> = [];

export const triggerPWAInstall = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }
  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    triggerListeners.forEach((listener) => listener(false));
    return outcome === 'accepted';
  } catch (err) {
    console.warn('[PWA Install Error]', err);
    return false;
  }
};

export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState<boolean>(!!deferredPrompt);

  useEffect(() => {
    const listener = (available: boolean) => setCanInstall(available);
    triggerListeners.push(listener);
    return () => {
      triggerListeners = triggerListeners.filter((l) => l !== listener);
    };
  }, []);

  return { canInstall, installApp: triggerPWAInstall };
};

export const PWAInstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed & running as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed prompt within 14 days
    const dismissedUntil = localStorage.getItem('fet_pwa_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      triggerListeners.forEach((listener) => listener(true));
      
      // Delay showing banner slightly to avoid interfering with initial page load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);

      return () => clearTimeout(timer);
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setShowBanner(false);
      setIsInstalled(true);
      triggerListeners.forEach((listener) => listener(false));
      console.info('[PWA] FET India app installed successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      deferredPrompt = null;
      triggerListeners.forEach((listener) => listener(false));
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 14 days (14 * 24 * 60 * 60 * 1000 ms)
    const expiry = Date.now() + 14 * 86400000;
    localStorage.setItem('fet_pwa_dismissed_until', expiry.toString());
  };

  if (!showBanner || isInstalled) {
    return null;
  }

  return (
    <div 
      id="fet-pwa-install-banner"
      role="region"
      aria-label="Install App Prompt"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <FETLogo variant="emblem" size="xs" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              Install FET India App
            </h4>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Fast, standalone access to Member ID, Scholarships & Verification.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          aria-label="Dismiss installation prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
        >
          Not Now
        </button>
        <button
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </button>
      </div>
    </div>
  );
};
