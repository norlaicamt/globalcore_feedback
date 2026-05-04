import React, { useState, useEffect } from "react";
import { getUserActivity } from "../services/api";
import { 
  formatLocation, 
  formatFeedbackDate, 
  renderFeedbackAction,
  formatMentions
} from "../utils/feedback";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Like: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>,
  Dislike: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>,
  Comment: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Post: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
};

const ActivityView = ({ currentUser, onBack, onViewPost }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (currentUser?.id) {
      getUserActivity(currentUser.id)
        .then(data => {
          if (isMounted) {
            setActivities(data);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Failed to load activity", err);
          if (isMounted) setLoading(false);
        });
    } else {
        setLoading(false);
    }
    return () => { isMounted = false; };
  }, [currentUser]);

  const getVisuals = (type) => {
    const t = type.toLowerCase();
    if (t === 'like') return { icon: <Icons.Like />, bg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#15803D' };
    if (t === 'dislike') return { icon: <Icons.Dislike />, bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECDAA 100%)', color: '#B91C1C' };
    if (t === 'post') return { icon: <Icons.Post />, bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', color: '#1D4ED8' };
    return { icon: <Icons.Comment />, bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', color: '#4338CA' };
  };

  return (
    <div style={styles.container}>
      <style>{`
        .activity-card {
          background: white;
          border-radius: 20px;
          padding: 18px 24px;
          border: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          gap: 18px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .activity-card:hover {
          transform: translateY(-2px);
          border-color: #E2E8F0;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }
        .activity-card:active {
          transform: translateY(0);
        }
        .activity-icon-cont {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
      `}</style>

      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          <Icons.Back />
        </button>
        <h2 style={styles.title}>Interaction Activity</h2>
        <button 
          onClick={() => {
            setLoading(true);
            getUserActivity(currentUser.id).then(data => { setActivities(data); setLoading(false); });
          }} 
          style={styles.refreshBtn}
          title="Refresh Feed"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={loading ? "spin" : ""}>
            <path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
      </header>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      <main style={styles.main}>
        {loading ? (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyText}>Syncing your activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>✨</div>
            <p style={styles.emptyText}>Your feed is clear</p>
            <p style={styles.emptySubText}>When you like, comment, or post feedback, your journey will be tracked here.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {activities.map((act) => {
              const viz = getVisuals(act.type);
              let actionText = act.type === 'like' ? "liked" : act.type === 'dislike' ? "disliked" : act.type === 'post' ? "published" : "commented on";

              return (
                <div 
                  key={act.id} 
                  className="activity-card"
                  onClick={() => onViewPost && onViewPost(act.feedback_id)}
                >
                  <div className="activity-icon-cont" style={{ background: viz.bg, color: viz.color }}>
                    {viz.icon}
                  </div>
                  
                  <div style={styles.meta}>
                    <div style={styles.actionText}>
                      {act.type === 'post' ? (
                        <div style={{ fontWeight: '600', color: '#1E293B' }}>{renderFeedbackAction(act, currentUser)}</div>
                      ) : (
                        <div style={{ lineHeight: '1.4' }}>
                          <span style={styles.actor}>You</span> {actionText} <span style={styles.targetTitle}>{act.title || "a contribution"}</span>
                          {(act.type === 'comment' || act.id.startsWith('react') || act.id.startsWith('reply_react')) && act.message && (
                            <p style={{ 
                              margin: '4px 0 0 0', 
                              fontSize: '12.5px', 
                              color: '#475569', 
                              fontStyle: (act.id.startsWith('react') || act.id.startsWith('reply_react')) ? 'italic' : 'normal',
                              borderLeft: (act.type === 'comment') ? '2px solid #E2E8F0' : 'none',
                              paddingLeft: (act.type === 'comment') ? '8px' : '0'
                            }}>
                              {act.message}
                            </p>
                          )}
                        </div>
                      )}
                      {act.type === 'post' && act.mentions && act.mentions.length > 0 && (
                        <div style={styles.mentionsList}>
                          <span style={styles.mentionsLabel}>MENTIONED:</span> {formatMentions(act.mentions)}
                        </div>
                      )}
                    </div>
                    <div style={styles.dateRow}>
                      <span style={styles.date}>{formatFeedbackDate(act.created_at)}</span>
                      {act.type === 'post' && act.location && (
                        <span style={styles.location}> • {formatLocation(act)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={styles.chevron}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    backgroundColor: '#F8FAFC', 
    fontFamily: '"Inter", sans-serif' 
  },
  header: { 
    padding: '20px 24px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: 'white', 
    borderBottom: '1px solid #F1F5F9', 
    position: 'sticky', 
    top: 0, 
    zIndex: 10 
  },
  backBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    border: '1px solid #F1F5F9',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748B',
    transition: '0.2s'
  },
  title: { 
    margin: 0, 
    fontSize: '17px', 
    fontWeight: '900', 
    color: '#1E293B', 
    letterSpacing: '-0.02em' 
  },
  refreshBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    border: '1px solid #F1F5F9',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748B',
    transition: '0.2s'
  },
  main: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '32px 24px' 
  },
  list: { 
    display: 'flex', 
    flexDirection: 'column', 
    maxWidth: '700px', 
    margin: '0 auto', 
    width: '100%' 
  },
  meta: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  actionText: { 
    fontSize: '14px', 
    color: '#475569', 
    lineHeight: '1.5' 
  },
  actor: { 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  targetTitle: { 
    fontWeight: '800', 
    color: 'var(--primary-color)' 
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  date: { 
    fontSize: '11px', 
    color: '#94A3B8', 
    fontWeight: '600' 
  },
  location: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500'
  },
  mentionsList: { 
    marginTop: '8px', 
    fontSize: '10px', 
    color: '#3B82F6', 
    fontWeight: '700', 
    backgroundColor: '#F0F9FF', 
    padding: '4px 10px', 
    borderRadius: '8px', 
    width: 'fit-content',
    border: '1px solid #E0F2FE'
  },
  mentionsLabel: { 
    color: '#0369A1', 
    letterSpacing: '0.05em' 
  },
  emptyContainer: { 
    textAlign: 'center', 
    padding: '120px 24px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center' 
  },
  emptyIcon: { 
    fontSize: '48px', 
    marginBottom: '24px' 
  },
  emptyText: { 
    color: '#1E293B', 
    fontSize: '18px', 
    fontWeight: '900', 
    marginBottom: '12px' 
  },
  emptySubText: { 
    color: '#64748B', 
    fontSize: '14px', 
    maxWidth: '280px', 
    lineHeight: '1.6' 
  },
  chevron: { 
    marginLeft: '12px',
    opacity: 0.6
  }
};

export default ActivityView;
