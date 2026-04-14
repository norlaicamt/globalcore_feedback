import React, { useEffect } from 'react';

const CustomModal = ({ 
  isOpen, 
  title, 
  message, 
  type = 'info', // 'success' | 'error' | 'info' | 'confirm'
  onConfirm, 
  onCancel, 
  confirmText = "OK", 
  cancelText = "Cancel", 
  isDestructive = false 
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
    success: { title: '#10B981', bg: '#F0FDF4', icon: '✅' },
    error: { title: '#EF4444', bg: '#FEF2F2', icon: '❌' },
    info: { title: 'var(--primary-color)', bg: '#F8F9FF', icon: 'ℹ️' },
    confirm: { title: '#334155', bg: '#F8FAFC', icon: '❓' }
  };

  const currentStyle = typeStyles[type] || typeStyles.info;

  return (
    <div style={styles.overlay} onClick={onCancel || onConfirm}>
      <div style={styles.content} onClick={e => e.stopPropagation()}>
        <div style={{ ...styles.iconBadge, backgroundColor: currentStyle.bg }}>{currentStyle.icon}</div>
        <h3 style={{ ...styles.title, color: currentStyle.title }}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          {(type === 'confirm' || (type === 'error' && onCancel)) && (
            <button style={styles.cancelBtn} onClick={onCancel}>{cancelText}</button>
          )}
          <button 
            style={{
              ...styles.primaryBtn,
              backgroundColor: isDestructive ? '#EF4444' : currentStyle.title
            }} 
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
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
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginBottom: '16px'
  },
  title: { 
    margin: '0 0 8px 0', 
    fontSize: '20px', 
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
