import React, { useState, useEffect } from "react";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

const DraftsView = ({ currentUser, onBack, onResumeDraft }) => {
  const [drafts, setDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedDrafts = JSON.parse(localStorage.getItem(`drafts_${currentUser?.id}`) || "[]");
    setDrafts(savedDrafts);
    setIsLoading(false);
  }, [currentUser]);

  const deleteDraft = (id) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem(`drafts_${currentUser?.id}`, JSON.stringify(updated));
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>My Drafts</h1>
        <div style={{ width: 24 }}></div> 
      </header>

      <main style={styles.mainContainer}>
        <div style={styles.listContainer}>
          {isLoading ? (
            <p style={{textAlign: 'center', color: '#94A3B8', marginTop: 40}}>Loading drafts...</p>
          ) : drafts.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{color: '#94A3B8', textAlign: 'center'}}>No drafts saved yet.</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} style={styles.draftCard} onClick={() => onResumeDraft && onResumeDraft(draft)}>
                <div style={styles.cardHeader}>
                  <span style={styles.itemDate}>{formatDateTime(draft.created_at).date}</span>
                  <button style={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); deleteDraft(draft.id); }}><Icons.Trash /></button>
                </div>
                <h3 style={styles.itemTitle}>{draft.title || draft.subject || "Untitled Draft"}</h3>
                <p style={styles.itemDesc}>{draft.description || draft.message || "No content..."}</p>
                <div style={styles.cardFooter}>
                  <div style={styles.draftBadge}>DRAFT</div>
                  <div style={styles.timeLabel}><Icons.Clock /> {formatDateTime(draft.created_at).time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, maxWidth: '800px', margin: '0 auto', width: '100%', borderBottom: '1px solid #F1F5F9' },
  headerTitle: { fontSize: '16px', fontWeight: '800', color: '#1f2a56' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#1f2a56' },
  mainContainer: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  listContainer: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  draftCard: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', cursor: 'pointer' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' },
  itemDate: { fontSize: '11px', color: '#94A3B8' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  itemTitle: { margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: '#1E293B' },
  itemDesc: { fontSize: '13px', color: '#64748B', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  draftBadge: { backgroundColor: '#FFF7ED', color: '#C2410C', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' },
  timeLabel: { fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' },
  emptyState: { padding: '40px 20px', border: '2px dashed #E2E8F0', borderRadius: '20px', marginTop: '20px' }
};

export default DraftsView;
