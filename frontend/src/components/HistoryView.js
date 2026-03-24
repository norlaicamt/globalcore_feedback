import React, { useState, useEffect } from "react";
// 1. IMPORT getDepartments
import { getFeedbacks, getDepartments } from "../services/api"; 

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const HistoryView = ({ currentUser, onBack }) => {
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]); // 2. STATE FOR DEPARTMENTS
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 3. FETCH BOTH AT THE SAME TIME
        const [historyData, deptsData] = await Promise.all([
          getFeedbacks(currentUser.id),
          getDepartments().catch(() => []) // Failsafe if departments fail to load
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
  }, [currentUser]);

  const getFeedbackType = (item) => {
    const title = item?.title || ""; 
    return (title.toLowerCase().includes("praise") || title.toLowerCase().includes("general")) ? "FEED" : "TICKET";
  };

  const getUiStatus = (item) => {
    if (getFeedbackType(item) === "FEED") return "Shared";
    const map = { "OPEN": "Pending", "IN_PROGRESS": "Pending", "RESOLVED": "Resolved", "CLOSED": "Closed" };
    return map[item?.status] || "Pending";
  };

  // 4. HELPER TO FIND DEPARTMENT NAME
  const getDepartmentName = (deptId) => {
    if (!deptId) return null;
    const dept = departments.find(d => d.id === parseInt(deptId));
    return dept ? dept.name : `Dept ID: ${deptId}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const filteredHistory = history.filter(item => {
    const title = item?.title || "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getUiStatus(item);
    return matchesSearch && (activeTab === "All" || status === activeTab);
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>Activity History</h1>
        <div style={{ width: 24 }}></div> 
      </header>

      <main style={styles.mainScroll}>
        <div style={styles.searchContainer}>
          <div style={styles.searchIcon}><Icons.Search /></div>
          <input 
            type="text" 
            placeholder="Search activity..." 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={styles.tabContainer}>
          {["All", "Pending", "Resolved", "Shared"].map(tab => (
            <button 
              key={tab}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === tab ? '#1f2a56' : 'transparent',
                color: activeTab === tab ? 'white' : '#64748B',
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={styles.listContainer}>
          {filteredHistory.map((item) => {
            const isFeed = getFeedbackType(item) === "FEED";
            const dt = formatDateTime(item.created_at);
            return (
              <div key={item.id} style={isFeed ? styles.feedCard : styles.historyCard} onClick={() => setSelectedItem(item)}>
                <div style={styles.cardHeader}>
                  <span style={styles.itemType}>{isFeed ? "✨ Informational" : `Ticket #${item.id}`}</span>
                  <span style={styles.itemDate}>{dt.date}</span>
                </div>
                <h3 style={styles.itemTitle}>{item.title}</h3>
                <div style={styles.cardFooter}>
                  {isFeed ? <div style={styles.sharedBadge}><Icons.Check /> Shared</div> : <div style={styles.statusBadge(getUiStatus(item))}>{getUiStatus(item)}</div>}
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

              {getFeedbackType(selectedItem) === "TICKET" && (
                <div style={styles.statusBox}>
                  <span style={styles.sectionLabel}>Status:</span>
                  <div style={styles.statusBadge(getUiStatus(selectedItem))}>{getUiStatus(selectedItem)}</div>
                </div>
              )}
            </div>

            <button style={styles.primaryAction} onClick={() => setSelectedItem(null)}>Close View</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', position: 'relative', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' },
  headerTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2a56' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  mainScroll: { flex: 1, overflowY: 'auto', padding: '0 20px 40px 20px' },
  searchContainer: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '0 16px', marginBottom: '20px', height: '48px' },
  searchIcon: { marginRight: '12px', display: 'flex' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '15px' },
  tabContainer: { display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px' },
  tabBtn: { flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  historyCard: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #F1F5F9', cursor: 'pointer' },
  feedCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1px dashed #CBD5E1', cursor: 'pointer' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  itemType: { fontSize: '11px', fontWeight: '700', color: '#64748B' },
  itemDate: { fontSize: '11px', color: '#94A3B8' },
  itemTitle: { margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#1E293B' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timeLabel: { fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' },
  statusBadge: (status) => ({
    padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
    backgroundColor: status === 'Resolved' ? '#D1FAE5' : '#E0F2FE',
    color: status === 'Resolved' ? '#059669' : '#1f2a56', width: 'fit-content'
  }),
  sharedBadge: { display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#10B981', gap: '4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '30px', position: 'relative' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' },
  modalHeader: { marginBottom: '20px' },
  modalTag: { fontSize: '12px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', display: 'block' },
  modalTitle: { fontSize: '20px', fontWeight: '800', color: '#1f2a56', margin: '0 0 8px 0' },
  modalMeta: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94A3B8' },
  bullet: { color: '#CBD5E1' },
  divider: { height: '1px', backgroundColor: '#F1F5F9', margin: '20px 0' },
  modalBody: { marginBottom: '30px' },
  infoSection: { marginBottom: '20px' },
  sectionLabel: { fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: '700', display: 'block' },
  infoValue: { fontSize: '15px', color: '#1f2a56', fontWeight: '600', margin: 0 },
  messageText: { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: 0, backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px' },
  statusBox: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' },
  primaryAction: { width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#1f2a56', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};

export default HistoryView;