import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineNotice: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestoredNotice) {
    return null;
  }

  if (showRestoredNotice) {
    return (
      <div 
        id="fet-connection-restored-banner"
        role="status" 
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-500/30 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-300"
      >
        <Wifi className="w-4 h-4 text-emerald-200" />
        <span>Back online. Live sync and services restored.</span>
      </div>
    );
  }

  return (
    <div 
      id="fet-offline-status-banner"
      role="alert" 
      aria-live="assertive"
      className="bg-amber-600 text-amber-50 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 sticky top-0 z-50 shadow-xs border-b border-amber-700"
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
        <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
        <span>
          <strong>You're offline.</strong> Some live database, payment, and form submissions may be unavailable until your internet connection is restored.
        </span>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
        title="Check connection and reload"
      >
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );
};
