import React, { useEffect, useState } from 'react';

const INSTALL_DISMISSED_KEY = 'gc_pwa_install_dismissed';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or installed
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed) return;

    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay so app finishes initial load
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setVisible(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
  };

  if (!visible || installed) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'min(420px, calc(100vw - 32px))',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(31, 42, 86, 0.18)',
          border: '1px solid #E2E8F0',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          animation: 'slideUpInstall 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* App Icon */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: '#1F2A56',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <img src="/icon-96x96.png" alt="GC Feedback" style={{ width: '52px', height: '52px', borderRadius: '14px' }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A', lineHeight: 1.3 }}>
            Install GlobalCore
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
            Add to home screen for quick access
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none', border: 'none', color: '#94A3B8',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '6px 8px',
            }}
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            style={{
              background: '#1F2A56', color: 'white', border: 'none',
              padding: '10px 16px', borderRadius: '10px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: '0.2s', boxShadow: '0 2px 8px rgba(31, 42, 86, 0.25)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2D3E7A'}
            onMouseLeave={e => e.currentTarget.style.background = '#1F2A56'}
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Close install prompt"
            style={{
              background: 'none', border: 'none', color: '#CBD5E1',
              cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpInstall {
          from { transform: translateX(-50%) translateY(80px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default InstallPrompt;
