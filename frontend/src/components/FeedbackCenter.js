import React, { useState } from 'react';
import HistoryView from './HistoryView';
import ActivityView from './ActivityView'; // added ActivityView

const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Inbox: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>,
  History: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><polyline points="12 7 12 12 15 15"></polyline></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
};

const FeedbackCenter = ({ currentUser, onBack }) => {
  const [activeView, setActiveView] = useState('submissions');

  return (
    <div style={styles.container}>
      {/* Small Side Bar */}
      <div style={styles.sidebar}>
        <button onClick={onBack} style={styles.backBtn}>
          <Icons.Back /> <span style={{ marginLeft: '8px' }}>Back</span>
        </button>
        
        <h2 style={styles.sidebarTitle}>My Feedback</h2>
        
        <nav style={styles.navMenu}>
          <button 
            style={activeView === 'submissions' ? styles.activeTab : styles.inactiveTab}
            onClick={() => setActiveView('submissions')}
          >
            <div style={styles.iconWrap}><Icons.History /></div> Submissions
          </button>
          <button 
            style={activeView === 'activity' ? styles.activeTab : styles.inactiveTab}
            onClick={() => setActiveView('activity')}
          >
            <div style={styles.iconWrap}><Icons.Bell /></div> Interaction Activity
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={styles.mainContent}>
        {activeView === 'submissions' && <HistoryView currentUser={currentUser} minimalist={true} />}
        {activeView === 'activity' && <ActivityView currentUser={currentUser} onBack={() => setActiveView('submissions')} />}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #E2E8F0'
  },
  sidebar: {
    width: '240px',
    backgroundColor: 'var(--primary-color)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column'
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '24px'
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'white',
    margin: '0 0 20px 0'
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  activeTab: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'left'
  },
  inactiveTab: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
  },
  iconWrap: {
    marginRight: '12px',
    display: 'flex'
  },
  mainContent: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative'
  }
};

export default FeedbackCenter;
