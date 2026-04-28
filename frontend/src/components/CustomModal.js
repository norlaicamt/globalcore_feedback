import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const CustomModal = ({
  isOpen,
  title,
  message,
  type = 'info', 
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
  isDestructive = false,
  content = null
}) => {

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (onCancel) onCancel();
        else if (onConfirm) onConfirm();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const typeStyles = {
    success: { title: '#10B981', bg: '#F0FDF4', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> },
    error: { title: '#EF4444', bg: '#FEF2F2', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
    info: { title: 'var(--primary-color)', bg: '#F8F9FF', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> },
    alert: { title: '#334155', bg: '#FFF7ED', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> }
  };

  const currentStyle = typeStyles[type] || typeStyles.info;

  const modalNode = (
    <div style={styles.overlay} onClick={(e) => { e.stopPropagation(); if (onCancel) onCancel(); }}>
      <div style={{ ...styles.content, maxWidth: content ? '480px' : '400px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ ...styles.iconBadge, backgroundColor: currentStyle.bg, marginBottom: '16px' }}>{currentStyle.icon}</div>
          <h3 style={{ ...styles.title, color: '#1E293B' }}>{title}</h3>
        </div>
        <p style={styles.message}>{message}</p>
        {content && <div style={{ width: '100%', textAlign: 'left', marginBottom: '24px' }}>{content}</div>}
        <div style={styles.actions}>
          {onCancel && (
            <button style={styles.cancelBtn} onClick={onCancel}>{cancelText}</button>
          )}
          <button
            style={{
              ...styles.primaryBtn,
              backgroundColor: isDestructive ? '#EF4444' : currentStyle.title
            }}
            onClick={onConfirm}
            autoFocus
            data-modal-confirm="true"
          >
            {confirmText}
          </button>
        </div>
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
    padding: '32px 24px',
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
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '-0.02em'
  },
  message: {
    margin: '0 0 28px 0',
    fontSize: '14px',
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
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.2s'
  },
  primaryBtn: {
    padding: '12px 16px',
    borderRadius: '12px',
    color: 'white',
    border: 'none',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    flex: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s'
  }
};

export default CustomModal;
