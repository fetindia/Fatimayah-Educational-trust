/**
 * PWA Service Worker Registration Utility
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for service worker updates periodically
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available
                  console.info('[PWA] New version of FET India available.');
                } else {
                  // Content cached for offline use
                  console.info('[PWA] FET India cached for offline capability.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[PWA] Service worker registration notice:', error);
        });
    });
  }
}
