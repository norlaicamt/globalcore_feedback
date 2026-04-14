import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import GeneralFeedback from "./GeneralFeedback";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Resume: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const DraftsView = ({ currentUser, onBack }) => {
  const [drafts, setDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogState, setDialogState] = useState({ isOpen: false });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);

  const refreshDrafts = () => {
    const savedDrafts = JSON.parse(localStorage.getItem(`user.drafts_${currentUser?.id}`) || "[]");
    setDrafts(savedDrafts);
  };

  useEffect(() => {
    refreshDrafts();
    setIsLoading(false);
  }, [currentUser]);

  const toggleSelect = (e, id) => {
    e?.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === drafts.length) setSelectedIds([]);
    else setSelectedIds(drafts.map(d => d.id));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setDialogState({
      isOpen: true,
      title: "Delete Selected Drafts",
      message: `Are you sure you want to delete ${selectedIds.length} drafts? This action cannot be undone.`,
      type: "alert",
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: () => {
        setDrafts(prev => {
          const updated = prev.filter(d => !selectedIds.includes(d.id));
          localStorage.setItem(`user.drafts_${currentUser?.id}`, JSON.stringify(updated));
          return updated;
        });
        setSelectedIds([]);
        setIsSelectMode(false);
        setDialogState({ isOpen: false });
      },
      onCancel: () => setDialogState({ isOpen: false })
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (editingDraft) {
    return (
      <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 100, backgroundColor: 'white' }}>
        <GeneralFeedback
          currentUser={currentUser}
          initialDraft={editingDraft}
          onBack={() => { setEditingDraft(null); refreshDrafts(); }}
          onSaveDraft={() => { setEditingDraft(null); refreshDrafts(); }}
          onSuccess={() => { setEditingDraft(null); refreshDrafts(); }}
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        .bulk-btn:hover { background-color: #F1F5F9; border-color: #E2E8F0; }
        .danger-btn:hover { background-color: #FEE2E2 !important; border-color: #EF4444 !important; }
        .draft-card-hover:hover { border-color: var(--primary-color) !important; background-color: #F8FAFC; }
      `}</style>

      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={styles.iconBtn} onClick={onBack} title="Back">
            <Icons.Back />
          </button>
          <h1 style={styles.headerTitle}>My Drafts {drafts.length > 0 && `(${drafts.length})`}</h1>
        </div>

        {drafts.length > 0 && (
          <button
            style={{ ...styles.selectModeBtn, color: isSelectMode ? 'var(--primary-color)' : '#1D4ED8' }}
            onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds([]); }}
          >
            {isSelectMode ? 'Cancel' : 'Select'}
          </button>
        )}
      </header>

      {isSelectMode && drafts.length > 0 && (
        <div style={styles.bulkBar}>
          <button style={{ ...styles.bulkActionBtn, color: 'var(--primary-color)' }} onClick={selectAll}>
            {selectedIds.length === drafts.length ? 'Deselect All' : 'Select All'}
          </button>

          <button
            disabled={selectedIds.length === 0}
            style={{
              ...styles.bulkActionBtn,
              padding: '6px 16px',
              backgroundColor: selectedIds.length > 0 ? '#EF4444' : '#F1F5F9',
              color: selectedIds.length > 0 ? 'white' : '#94A3B8',
              borderRadius: '20px',
              border: 'none'
            }}
            onClick={handleDeleteSelected}
          >
            Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </button>
        </div>
      )}

      <main style={styles.mainContainer}>
        <div style={styles.listContainer}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: 40 }}>Loading drafts...</p>
          ) : drafts.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ color: '#94A3B8', textAlign: 'center' }}>No drafts saved yet.</p>
            </div>
          ) : (
            drafts.map((draft) => {
              const isSelected = selectedIds.includes(draft.id);
              return (
                <div
                  key={draft.id}
                  className={!isSelectMode ? "draft-card-hover" : ""}
                  style={{
                    ...styles.draftCard,
                    border: isSelected ? '2px solid var(--primary-color)' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : 'white',
                  }}
                  onClick={(e) => isSelectMode ? toggleSelect(e, draft.id) : setEditingDraft(draft)}
                >
                  {/* Selection Indicator on the left - Only Show in Select Mode */}
                  {isSelectMode && (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', border: isSelected ? 'none' : '2px solid #CBD5E1',
                      backgroundColor: isSelected ? 'var(--primary-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <Icons.Check />}
                    </div>
                  )}

                  {/* Main Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.cardHeader}>
                      <span style={{ ...styles.itemDate, color: isSelected ? 'var(--primary-color)' : '#94A3B8' }}>{formatDateTime(draft.created_at).date}</span>
                    </div>
                    <h3 style={{ ...styles.itemTitle, color: isSelected ? 'var(--primary-color)' : '#1E293B' }}>{draft.title || draft.subject || "Untitled Draft"}</h3>
                    <p style={styles.itemDesc}>{draft.description || draft.message || "No content..."}</p>
                    <div style={styles.cardFooter}>
                      <div style={styles.draftBadge}>DRAFT</div>
                      <div style={styles.timeLabel}><Icons.Clock /> {formatDateTime(draft.created_at).time}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <CustomModal
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.type}
          confirmText={dialogState.confirmText}
          isDestructive={dialogState.isDestructive}
          onConfirm={dialogState.onConfirm}
          onCancel={dialogState.onCancel}
        />
      </main>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, borderBottom: '1px solid #F1F5F9', backgroundColor: 'white' },
  headerTitle: { fontSize: '18px', fontWeight: '900', color: 'var(--primary-color)', margin: 0 },
  selectModeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '800' },
  bulkBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', width: '100%' },
  bulkActionBtn: { background: 'none', border: 'none', fontSize: '13px', fontWeight: '900', cursor: 'pointer', padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', padding: '4px', display: 'flex' },
  mainContainer: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  listContainer: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' },
  draftCard: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', gap: '16px', alignItems: 'center' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' },
  itemDate: { fontSize: '11px', color: '#94A3B8', fontWeight: 'bold' },
  itemTitle: { margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemDesc: { fontSize: '13px', color: '#334155', margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  draftBadge: { backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' },
  timeLabel: { fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' },
  emptyState: { padding: '60px 20px', border: '2px dashed #E2E8F0', borderRadius: '24px', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
};

export default DraftsView;
