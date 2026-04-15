import React, { useState, useEffect } from "react";
// 1. IMPORT getDepartments
import { getFeedbacks, getDepartments } from "../services/api"; 
import { renderFeedbackAction, formatFeedbackDate } from "../utils/feedback";
import CustomModal from './CustomModal';

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Star: ({ filled, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  Hash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Tag: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  Image: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return { date: "N/A", time: "N/A" };
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
};

const HistoryView = ({ currentUser, onBack, mode = "sent", minimalist = false }) => {
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogState, setDialogState] = useState({ isOpen: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isSentMode = mode === 'sent' || mode === 'history';
        const params = isSentMode 
          ? { sender_id: currentUser.id } 
          : { mentioned_user_id: currentUser.id };
          
        const [historyData, deptsData] = await Promise.all([
          getFeedbacks(params),
          getDepartments().catch(() => [])
        ]);
        setHistory(historyData);
        setDepartments(deptsData);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser?.id) fetchData();
  }, [currentUser, mode]);

  const getDepartmentName = (deptId) => {
    if (!deptId) return null;
    const dept = departments.find(d => d.id === parseInt(deptId));
    return dept ? dept.name : `Dept ID: ${deptId}`;
  };

  const renderStars = (rating) => {
    const starCount = rating || 0;
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <Icons.Star key={s} filled={s <= starCount} size={12} />
        ))}
      </div>
    );
  };

  const filteredHistory = history.filter(item => {
    const title = item?.title || "";
    const description = item?.description || item?.details || item?.message || item?.idea || "";
    
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          description.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesSearch;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const isSentMode = mode === 'sent' || mode === 'history';
  const viewTitle = isSentMode ? "Sent" : "Mentions";
  const searchPlaceholder = isSentMode ? "Search sent feedback..." : "Search mentions...";

  return (
    <div style={minimalist ? styles.minimalContainer : styles.container}>
      {!minimalist && (
        <header style={styles.header}>
          <div style={{ width: 24 }}></div> 
          <h1 style={styles.headerTitle}>{viewTitle}</h1>
          <div style={{ width: 24 }}></div> 
        </header>
      )}

      <main style={minimalist ? styles.minimalMainScroll : styles.mainContainer}>
        <div style={styles.searchContainer}>
          <div style={styles.searchIcon}><Icons.Search /></div>
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={styles.listContainer}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#64748B' }}>Loading...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#64748B', fontWeight: 'bold' }}>No feedback found.</p>
            </div>
          ) : filteredHistory.map((item) => {
            const dt = formatDateTime(item.created_at);
            return (
              <div key={item.id} style={styles.historyCard} onClick={() => setSelectedItem(item)}>
                <div style={styles.cardHeader}>
                  <span style={styles.itemDate}>{formatFeedbackDate(item.created_at)}</span>
                </div>
                {renderFeedbackAction(item, currentUser)}
                <div style={{...styles.cardFooter, marginTop: '12px'}}>
                  <div style={styles.timeLabel}>REF-{item.id}</div>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div style={styles.modalHeader}>
              <div style={styles.headerBadgeRow}>
                <span style={styles.caseId}><Icons.Hash /> REF-{selectedItem.id}</span>
              </div>
              <h2 style={styles.modalTitle}>{selectedItem.subject || selectedItem.title}</h2>
              <div style={styles.modalMeta}>
                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <Icons.User /> {selectedItem.sender_id === currentUser.id ? "By You" : (selectedItem.user_name || "Another User")}
                </span>
                <span style={styles.bullet}>•</span>
                {selectedItem.rating > 0 && (
                  <>
                    {renderStars(selectedItem.rating)}
                    <span style={styles.bullet}>•</span>
                  </>
                )}
                <span>{formatDateTime(selectedItem.created_at).date}</span>
                <span style={styles.bullet}>•</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <Icons.Clock /> {formatDateTime(selectedItem.created_at).time}
                </span>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.modalBody}>
              {/* TARGET JURISDICTION */}
              {(selectedItem.recipient_dept_name || selectedItem.department_name || getDepartmentName(selectedItem.recipient_dept_id)) && (
                <div style={styles.infoSection}>
                  <div style={styles.jurisdictionPill}>
                    <Icons.Shield />
                    <span>{selectedItem.recipient_dept_name || selectedItem.department_name || getDepartmentName(selectedItem.recipient_dept_id)}</span>
                  </div>
                </div>
              )}

              {/* MESSAGE CONTENT */}
              <div style={styles.infoSection}>
                <h4 style={styles.sectionLabel}>Communication Details</h4>
                <div style={styles.messageBox}>
                  {selectedItem.description || selectedItem.details || selectedItem.message || selectedItem.idea || "No content provided."}
                </div>
              </div>

              {/* MENTIONED STAFF */}
              {selectedItem.mentions && selectedItem.mentions.length > 0 && (
                <div style={styles.infoSection}>
                  <h4 style={styles.sectionLabel}>Personnel Tagged</h4>
                  <div style={styles.mentionsGrid}>
                    {selectedItem.mentions.map((m, i) => (
                      <div key={i} style={styles.mentionPill}>
                        <Icons.Tag />
                        <span>{m.employee_prefix} {m.employee_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ATTACHMENTS */}
              {selectedItem.attachments && selectedItem.attachments !== "[]" && (
                <div style={styles.infoSection}>
                  <h4 style={styles.sectionLabel}>Report evidence</h4>
                  <div style={styles.attachmentGrid}>
                    {(() => {
                      try {
                        const files = typeof selectedItem.attachments === 'string' ? JSON.parse(selectedItem.attachments) : selectedItem.attachments;
                        return Array.isArray(files) && files.map((f, i) => (
                          <div key={i} style={styles.attachmentItem}>
                            <Icons.Image />
                            <span style={styles.fileName}>evidence_{i+1}.jpg</span>
                          </div>
                        ));
                      } catch (e) { return null; }
                    })()}
                  </div>
                </div>
              )}
            </div>

            <button style={styles.primaryActionPremium} onClick={() => setSelectedItem(null)}>Finish Review</button>
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
  itemTitle: { margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#000000' },
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
  modalTitle: { fontSize: '18px', fontWeight: '800', color: '#000000', margin: '0 0 6px 0' },
  modalMeta: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', flexWrap: 'wrap' },
  bullet: { color: '#CBD5E1' },
  divider: { height: '1px', backgroundColor: '#F1F5F9', margin: '16px 0' },
  modalBody: { marginBottom: '32px' },
  infoSection: { marginBottom: '20px' },
  sectionLabel: { fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '800', display: 'block' },
  
  headerBadgeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  caseId: { fontSize: '11px', fontWeight: '800', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '6px' },
  statusBadge: { fontSize: '10px', fontWeight: '900', padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.5px' },
  
  jurisdictionPill: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#F0F9FF', color: '#0369A1', borderRadius: '12px', fontSize: '13px', fontWeight: '700', border: '1px solid #E0F2FE' },
  messageBox: { padding: '16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', fontSize: '14px', color: '#000000', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  
  mentionsGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  mentionPill: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '8px', fontSize: '12px', fontWeight: '600' },
  
  attachmentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' },
  attachmentItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', color: '#64748B', cursor: 'pointer' },
  fileName: { fontSize: '11px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  primaryActionPremium: { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)', transition: 'transform 0.2s' }
};

export default HistoryView;