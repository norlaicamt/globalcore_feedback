import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const CustomModal = ({
  isOpen,
  title,
  message,
  type = 'info',
  // Traditional Props
  onConfirm,
  onCancel,
  onThirdAction,
  confirmText = "OK",
  cancelText = "Cancel",
  thirdActionText = "Discard",
  isDestructive = false,
  isThirdActionDestructive = true,
  // New Semantic Props
  primaryAction,
  secondaryAction,
  tertiaryAction,
  content = null,
  showDefaultActions = true
}) => {

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        const cancel = secondaryAction?.onClick || onCancel;
        const confirm = primaryAction?.onClick || onConfirm;
        if (cancel) cancel();
        else if (confirm) confirm();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel, onConfirm, primaryAction, secondaryAction]);

  if (!isOpen) return null;

  const typeStyles = {
    success: { title: '#10B981', bg: '#F0FDF4', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> },
    error: { title: '#EF4444', bg: '#FEF2F2', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
    info: { title: 'var(--primary-color)', bg: '#F8F9FF', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> },
    alert: { title: '#334155', bg: '#FFF7ED', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> },
    draft: { title: '#6366F1', bg: '#EEF2FF', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> }
  };

  const currentStyle = typeStyles[type] || typeStyles.info;

  // Normalize actions
  const pAct = primaryAction || (onConfirm ? { label: confirmText, onClick: onConfirm, isDestructive } : null);
  const sAct = secondaryAction || (onCancel ? { label: cancelText, onClick: onCancel } : null);
  const tAct = tertiaryAction || (onThirdAction ? { label: thirdActionText, onClick: onThirdAction, isDestructive: isThirdActionDestructive } : null);

  const hasThreeActions = pAct && sAct && tAct;

  const modalNode = (
    <div style={styles.overlay} onClick={(e) => { e.stopPropagation(); if (sAct?.onClick) sAct.onClick(); }}>
      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .modal-content {
            animation: bottomSheet 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            margin-bottom: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            position: fixed !important;
            bottom: 0 !important;
          }
        }
        @keyframes bottomSheet {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div 
        className="modal-content"
        style={{ 
          ...styles.content, 
          maxWidth: content ? '480px' : '400px',
          animation: 'modalEnter 0.3s ease-out forwards'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ ...styles.iconBadge, backgroundColor: currentStyle.bg, marginBottom: '16px' }}>{currentStyle.icon}</div>
          <h3 style={{ ...styles.title, color: '#1E293B' }}>{title}</h3>
        </div>
        <p style={styles.message}>{message}</p>
        {content && <div style={{ width: '100%', textAlign: 'left', marginBottom: '24px' }}>{content}</div>}
        
        {showDefaultActions && (
          <div style={{ ...styles.actions, flexDirection: hasThreeActions ? 'column' : 'row' }}>
            {/* Primary Action (Top if 3 buttons, Right if 2) */}
            {pAct && (
              <button
                style={{
                  ...styles.primaryBtn,
                  backgroundColor: pAct.isDestructive ? '#EF4444' : currentStyle.title,
                  order: hasThreeActions ? 0 : 2
                }}
                onClick={pAct.onClick}
                autoFocus
                data-modal-confirm="true"
              >
                {pAct.label}
              </button>
            )}

            {hasThreeActions ? (
              <div style={{ display: 'flex', gap: '12px', width: '100%', order: 1 }}>
                {sAct && (
                  <button style={styles.cancelBtn} onClick={sAct.onClick}>{sAct.label}</button>
                )}
                {tAct && (
                  <button
                    style={{
                      ...styles.cancelBtn,
                      color: tAct.isDestructive ? '#EF4444' : '#64748B',
                    }}
                    onClick={tAct.onClick}
                  >
                    {tAct.label}
                  </button>
                )}
              </div>
            ) : (
              <>
                {sAct && (
                  <button style={{ ...styles.cancelBtn, order: 1 }} onClick={sAct.onClick}>{sAct.label}</button>
                )}
                {tAct && (
                  <button
                    style={{
                      ...styles.cancelBtn,
                      color: tAct.isDestructive ? '#EF4444' : '#64748B',
                      order: 0
                    }}
                    onClick={tAct.onClick}
                  >
                    {tAct.label}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalNode, document.body);
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
    padding: '20px'
  },
  content: {
    backgroundColor: 'white',
    padding: 'var(--card-padding, 32px 24px)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '340px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  iconBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    margin: 0,
    fontSize: 'var(--size-page-title, 18px)',
    fontWeight: '800',
    letterSpacing: '-0.02em'
  },
  message: {
    margin: '0 0 28px 0',
    fontSize: 'var(--size-body, 14px)',
    color: '#64748B',
    lineHeight: '1.6',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    width: '100%'
  },
  cancelBtn: {
    padding: 'var(--card-padding, 12px 16px)',
    borderRadius: '12px',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    fontSize: 'var(--size-nav, 14px)',
    fontWeight: '700',
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.2s',
    height: 'var(--button-height, 44px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryBtn: {
    padding: 'var(--card-padding, 12px 16px)',
    borderRadius: '12px',
    color: 'white',
    border: 'none',
    fontSize: 'var(--size-nav, 14px)',
    fontWeight: '700',
    cursor: 'pointer',
    flex: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
    height: 'var(--button-height, 44px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default CustomModal;
