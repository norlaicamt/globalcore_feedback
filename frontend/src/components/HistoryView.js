import React, { useState, useEffect } from "react";
// 1. IMPORT getDepartments
import { getFeedbacks, getDepartments } from "../services/api"; 
import CustomModal from './CustomModal';

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Star: ({ filled, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return { date: "N/A", time: "N/A" };
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
};

const HistoryView = ({ currentUser, onBack, minimalist = false }) => {
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogState, setDialogState] = useState({ isOpen: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allFeedbacks, deptsData] = await Promise.all([
          getFeedbacks(),
          getDepartments().catch(() => [])
        ]);
        const historyData = allFeedbacks.filter(fb => fb.sender_id === currentUser.id);
        setHistory(historyData);
        setDepartments(deptsData);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser?.id) fetchData();
  }, [currentUser]);

  const getFeedbackType = (item) => {
    const title = item?.title || ""; 
    return (title.toLowerCase().includes("praise") || title.toLowerCase().includes("general")) ? "FEED" : "TICKET";
  };

  const getDepartmentName = (deptId) => {
    if (!deptId) return null;
    const dept = departments.find(d => d.id === parseInt(deptId));
    return dept ? dept.name : `Dept ID: ${deptId}`;
  };

  const renderStars = (rating) => {
    const starCount = rating || 0;
    return (
      <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <Icons.Star key={s} filled={s <= starCount} size={14} />
        ))}
      </div>
    );
  };

  const [filterType, setFilterType] = useState('ALL');

  const filteredHistory = history.filter(item => {
    const title = item?.title || "";
    const description = item?.description || item?.details || item?.message || item?.idea || "";
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          description.toLowerCase().includes(searchQuery.toLowerCase());
                          
    if (!matchesSearch) return false;
    
    const type = getFeedbackType(item);
    if (filterType === 'FEED' && type !== 'FEED') return false;
    if (filterType === 'TICKET' && type !== 'TICKET') return false;
    
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div style={minimalist ? styles.minimalContainer : styles.container}>
      {!minimalist && (
        <header style={styles.header}>
          <div style={{ width: 24 }}></div> 
          <h1 style={styles.headerTitle}>Sent Feedback</h1>
          <div style={{ width: 24 }}></div> 
        </header>
      )}

      <main style={minimalist ? styles.minimalMainScroll : styles.mainContainer}>
        <div style={styles.searchContainer}>
          <div style={styles.searchIcon}><Icons.Search /></div>
          <input 
            type="text" 
            placeholder="Search sent feedback..." 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>



        <div style={styles.tabContainer}>
          <button 
            style={{...styles.tabBtn, backgroundColor: filterType === 'ALL' ? 'white' : 'transparent', color: filterType === 'ALL' ? '#1f2a56' : '#64748B', boxShadow: filterType === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}}
            onClick={() => setFilterType('ALL')}
          >All</button>
          <button 
            style={{...styles.tabBtn, backgroundColor: filterType === 'FEED' ? 'white' : 'transparent', color: filterType === 'FEED' ? '#1f2a56' : '#64748B', boxShadow: filterType === 'FEED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}}
            onClick={() => setFilterType('FEED')}
          >Informational</button>
          <button 
            style={{...styles.tabBtn, backgroundColor: filterType === 'TICKET' ? 'white' : 'transparent', color: filterType === 'TICKET' ? '#1f2a56' : '#64748B', boxShadow: filterType === 'TICKET' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}}
            onClick={() => setFilterType('TICKET')}
          >Tickets</button>
        </div>

        <div style={styles.listContainer}>
          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#64748B', fontWeight: 'bold' }}>No feedback found.</p>
            </div>
          ) : filteredHistory.map((item) => {
            const isFeed = getFeedbackType(item) === "FEED";
            const dt = formatDateTime(item.created_at);
            return (
              <div key={item.id} style={isFeed ? styles.feedCard : styles.historyCard} onClick={() => setSelectedItem(item)}>
                <div style={styles.cardHeader}>
                  <span style={styles.itemType}>{isFeed ? "✨ Informational" : `Ticket #${item.id}`}</span>
                  <span style={styles.itemDate}>{dt.date}</span>
                </div>
                {renderStars(item.rating)}
                <h3 style={styles.itemTitle}>{item.title}</h3>
                <div style={styles.cardFooter}>
                  <div style={styles.timeLabel}><Icons.Clock /> {dt.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* --- DETAIL MODAL --- */}
      {selectedItem && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.closeBtn} onClick={() => setSelectedItem(null)}>
              <Icons.Close />
            </button>

            <div style={styles.modalHeader}>
              <span style={styles.modalTag}>
                {getFeedbackType(selectedItem) === "FEED" ? "✨ Informational Feed" : "🛠 Service Ticket"}
              </span>
              <h2 style={styles.modalTitle}>{selectedItem.title}</h2>
              <div style={styles.modalMeta}>
                <span>{formatDateTime(selectedItem.created_at).date}</span>
                <span style={styles.bullet}>•</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <Icons.Clock /> {formatDateTime(selectedItem.created_at).time}
                </span>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.modalBody}>
              {/* SUBJECT (Fallback to title if subject doesn't exist) */}
              <div style={styles.infoSection}>
                <h4 style={styles.sectionLabel}>Subject</h4>
                <p style={styles.infoValue}>{selectedItem.subject || selectedItem.title}</p>
              </div>

              {/* 5. DEPARTMENT REVEALED */}
              {(selectedItem.department_name || selectedItem.recipient_dept_id) && (
                <div style={styles.infoSection}>
                  <h4 style={styles.sectionLabel}>Target Department</h4>
                  <p style={styles.infoValue}>
                    {selectedItem.department_name || getDepartmentName(selectedItem.recipient_dept_id)}
                  </p>
                </div>
              )}

              {/* 6. MESSAGE CONTENT REVEALED (Added .description) */}
              <div style={styles.infoSection}>
                <h4 style={styles.sectionLabel}>Message Details</h4>
                <p style={styles.messageText}>
                  {selectedItem.description || selectedItem.details || selectedItem.message || selectedItem.idea || "No message content."}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={styles.primaryAction} onClick={() => setSelectedItem(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      <CustomModal 
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', position: 'relative', fontFamily: 'inherit' },
  minimalContainer: { height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', position: 'relative', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, maxWidth: '800px', margin: '0 auto', width: '100%', borderBottom: '1px solid #F1F5F9' },
  headerTitle: { fontSize: '16px', fontWeight: '800', color: '#1f2a56' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#1f2a56' },
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
  regularBadge: { display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: '#1f2a56', gap: '4px', backgroundColor: '#E2E8F0', padding: '3px 8px', borderRadius: '6px' },
  emptyState: { padding: '30px 16px', border: '2px dashed #E2E8F0', borderRadius: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', width: '100%', maxWidth: '440px', borderRadius: '20px', padding: '24px', position: 'relative' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' },
  modalHeader: { marginBottom: '16px' },
  modalTag: { fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
  modalTitle: { fontSize: '18px', fontWeight: '800', color: '#1f2a56', margin: '0 0 6px 0' },
  modalMeta: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', flexWrap: 'wrap' },
  bullet: { color: '#CBD5E1' },
  divider: { height: '1px', backgroundColor: '#F1F5F9', margin: '16px 0' },
  modalBody: { marginBottom: '24px' },
  infoSection: { marginBottom: '16px' },
  sectionLabel: { fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: '700', display: 'block' },
  infoValue: { fontSize: '14px', color: '#1f2a56', fontWeight: '600', margin: 0 },
  messageText: { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: 0, backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px' },
  primaryAction: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#1f2a56', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }
};

export default HistoryView;