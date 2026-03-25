import React from 'react';

const CustomModal = ({ isOpen, title, message, type = 'alert', onConfirm, onCancel, confirmText = "OK", cancelText = "Cancel", isDestructive = false }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onCancel || onConfirm}>
      <div style={styles.content} onClick={e => e.stopPropagation()}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          {type === 'confirm' && (
            <button style={styles.cancelBtn} onClick={onCancel}>{cancelText}</button>
          )}
          <button 
            style={type === 'confirm' && isDestructive ? styles.destructiveBtn : styles.primaryBtn} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)', padding: '20px' },
  content: { backgroundColor: 'white', padding: '24px', borderRadius: '20px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  title: { margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800', color: '#1f2a56' },
  message: { margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 16px', borderRadius: '10px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1 },
  destructiveBtn: { padding: '10px 16px', borderRadius: '10px', backgroundColor: '#EF4444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1 },
  primaryBtn: { padding: '10px 16px', borderRadius: '10px', backgroundColor: '#1f2a56', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 1 }
};

export default CustomModal;
