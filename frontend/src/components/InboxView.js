import React, { useState, useEffect } from "react";
import { getDepartments, getUserNotifications } from "../services/api"; 
import { renderFeedbackAction, formatFeedbackDate } from "../utils/feedback";
import axios from "axios";
import CustomModal from './CustomModal';

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Star: ({ filled, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FBBF24" : "none"} stroke={filled ? "#FBBF24" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
};

const InboxView = ({ currentUser, onBack, initialTab = "All", minimalist = false }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogState, setDialogState] = useState({ isOpen: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedbackData, deptsData] = await Promise.all([
          axios.get(`http://${window.location.hostname}:8000/feedbacks/?recipient_user_id=${currentUser?.id}`).then(r => r.data).catch(() => []),
          getDepartments().catch(() => [])
        ]);
        
        // Filter to only feedback where current user is the individual recipient
        const myFeedbacks = feedbackData.filter(f => 
          f.recipient_user_id === currentUser?.id
        );
        
        setFeedbacks(myFeedbacks);
        setDepartments(deptsData);
      } catch (error) {
        console.error("Failed to load inbox:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) fetchData();
  }, [currentUser]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <Icons.Star key={s} filled={s <= rating} size={14} />
        ))}
      </div>
    );
  };

  const getDepartmentName = (deptId) => {
    if (!deptId) return null;
    const dept = departments.find(d => d.id === parseInt(deptId));
    return dept ? dept.name : `Dept ID: ${deptId}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };
  
  const getFilteredFeedbacks = () => {
    return feedbacks.filter(item => {
      const title = item?.title || item?.subject || item?.description || "";
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  return (
    <div style={minimalist ? styles.minimalContainer : styles.container}>
      {!minimalist && (
        <header style={styles.header}>
          <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
          <h1 style={styles.headerTitle}>My Inbox</h1>
          <div style={{ width: 24 }}></div> 
        </header>
      )}

      <main style={minimalist ? styles.minimalMainScroll : styles.mainContainer}>
        <div style={styles.searchContainer}>
          <div style={styles.searchIcon}><Icons.Search /></div>
          <input 
            type="text" 
            placeholder="Search feedback..." 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs removed as per request */}

        <div style={styles.listContainer}>
          {isLoading ? (
            <p style={{textAlign: 'center', color: '#94A3B8', marginTop: 40}}>Loading...</p>
          ) : (
            getFilteredFeedbacks().length === 0 ? (
              <div style={styles.emptyState}>
                 <p style={{color: '#94A3B8', textAlign: 'center'}}>No feedback received</p>
              </div>
            ) : (
              getFilteredFeedbacks().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(item => (
                <div 
                  key={`feedback-${item.id}`} 
                  style={styles.historyCard}
                  onClick={() => setSelectedItem(item)}
                >
                  <div style={styles.cardHeader}>
                    <span style={styles.itemDate}>{formatFeedbackDate(item.created_at)}</span>
                  </div>
                  
                  {renderFeedbackAction(item, currentUser)}

                  <div style={{...styles.cardFooter, marginTop: '12px'}}>
                    <div style={styles.regularBadge}>Feedback</div>
                    <div style={styles.timeLabel}>REF-{item.id}</div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </main>

      {/* --- RECONSTRUCTING HEADER TO BE STICKY TOO --- */}
      <style>{`
        header { position: sticky; top: 0; z-index: 20; background-color: #F8FAFC; }
      `}</style>

      {/* --- DETAIL MODAL --- */}
      {selectedItem && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.closeBtn} onClick={() => setSelectedItem(null)}>
              <Icons.Close />
            </button>

            <div style={styles.modalHeader}>
              <span style={styles.modalTag}>
                {"📝 Feedback"}
              </span>
              <h2 style={styles.modalTitle}>{selectedItem.title || selectedItem.subject || 'Feedback'}</h2>
              <div style={styles.modalMeta}>
                <span>{formatDateTime(selectedItem.created_at).date}</span>
                <span style={styles.bullet}>•</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <Icons.Clock /> {formatDateTime(selectedItem.created_at).time}
                </span>
                <span style={styles.bullet}>•</span>
                <span>From: {selectedItem.user_name || selectedItem.sender_name || 'Anonymous'}</span>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.modalBody}>
              <div style={styles.infoSection}>
                <h4 style={styles.sectionLabel}>Message Details</h4>
                <p style={styles.messageText}>
                  {selectedItem.description || selectedItem.details || selectedItem.message || selectedItem.idea || selectedItem.comment || "No message content."}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={styles.primaryAction} onClick={() => setSelectedItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <CustomModal 
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={() => setDialogState({ isOpen: false })}
      />
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', position: 'relative', fontFamily: 'inherit' },
  minimalContainer: { height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', position: 'relative', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, maxWidth: '800px', margin: '0 auto', width: '100%', borderBottom: '1px solid #F1F5F9' },
  headerTitle: { fontSize: '16px', fontWeight: '800', color: 'var(--primary-color)' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' },
  mainContainer: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  minimalMainScroll: { flex: 1, overflowY: 'auto', padding: '16px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  searchContainer: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0 12px', marginBottom: '16px', height: '42px', flexShrink: 0 },
  searchIcon: { marginRight: '10px', display: 'flex' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '13px' },
  tabContainer: { 
    display: 'flex', 
    gap: '4px', 
    marginBottom: '16px', 
    backgroundColor: '#F1F5F9', 
    padding: '4px', 
    borderRadius: '10px',
    flexShrink: 0
  },
  tabBtn: { flex: 1, padding: '6px 0', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700' },
  listContainer: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  historyCard: { backgroundColor: 'white', borderRadius: '12px', padding: '12px', border: '1px solid #F1F5F9', cursor: 'pointer' },
  praiseCard: { backgroundColor: '#FFFAF0', borderRadius: '12px', padding: '12px', border: '1px solid #FDE68A', cursor: 'pointer' },
  notificationCard: { backgroundColor: '#F0F9FF', borderRadius: '12px', padding: '12px', border: '1px solid #BAE6FD', cursor: 'pointer' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' },
  senderText: { fontSize: '11px', fontWeight: '600', color: '#475569' },
  itemDate: { fontSize: '10px', color: '#94A3B8' },
  itemTitle: { margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#1E293B' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timeLabel: { fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' },
  praiseBadge: { display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: '#D97706', gap: '4px', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '6px' },
  regularBadge: { display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--primary-color)', gap: '4px', backgroundColor: '#E2E8F0', padding: '3px 8px', borderRadius: '6px' },
  emptyState: { padding: '30px 16px', border: '2px dashed #E2E8F0', borderRadius: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', width: '100%', maxWidth: '440px', borderRadius: '20px', padding: '24px', position: 'relative' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' },
  modalHeader: { marginBottom: '16px' },
  modalTag: { fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
  modalTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--primary-color)', margin: '0 0 6px 0' },
  modalMeta: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', flexWrap: 'wrap' },
  bullet: { color: '#CBD5E1' },
  divider: { height: '1px', backgroundColor: '#F1F5F9', margin: '16px 0' },
  modalBody: { marginBottom: '24px' },
  infoSection: { marginBottom: '16px' },
  sectionLabel: { fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: '700', display: 'block' },
  infoValue: { fontSize: '14px', color: 'var(--primary-color)', fontWeight: '600', margin: 0 },
  messageText: { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: 0, backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px' },
  primaryAction: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }
};

export default InboxView;
