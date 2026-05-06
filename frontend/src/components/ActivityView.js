import React, { useState, useEffect } from "react";
import { getUserActivity } from "../services/api";
import { formatFeedbackDate } from "../utils/feedback";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Like: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>,
  Dislike: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>,
  Comment: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Post: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
};

const ActivityView = React.memo(({ currentUser, onBack, onViewPost }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Submitted', 'Liked', 'Disliked', 'Commented'];

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
    if (t === 'comment') return { icon: <Icons.Comment />, bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', color: '#4338CA' };
    return { icon: <Icons.Like />, bg: 'linear-gradient(135deg, #FEF08A 0%, #FDE047 100%)', color: '#CA8A04' }; // default fallback for 'react'
  };

  const filteredActivities = activities.filter(act => {
    if (filter === 'All') return true;
    if (filter === 'Submitted') return act.type === 'post';
    if (filter === 'Liked') return act.type === 'like';
    if (filter === 'Disliked') return act.type === 'dislike';
    if (filter === 'Commented') return act.type === 'comment';
    return true;
  });

  const groupActivities = (acts) => {
    const groups = {
      "TODAY": [],
      "YESTERDAY": [],
      "EARLIER": []
    };

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    acts.forEach(act => {
      const d = new Date(act.created_at);
      if (isNaN(d.getTime())) {
        groups["EARLIER"].push(act);
        return;
      }

      const actStr = d.toDateString();
      if (actStr === todayStr) groups["TODAY"].push(act);
      else if (actStr === yesterdayStr) groups["YESTERDAY"].push(act);
      else groups["EARLIER"].push(act);
    });

    return Object.entries(groups).filter(([_, arr]) => arr.length > 0);
  };

  const renderActivityLine = (act) => {
    if (act.type === 'post') {
      const entityLabel = act.entity_name || act.title || "Program";
      return `Feedback submitted to ${entityLabel}`;
    }

    const target = act.title || "a post";
    const isCommentAction = act.message && act.message.toLowerCase().includes("comment");

    if (act.type === 'like') {
      if (isCommentAction) return `You liked a comment on ${target}`;
      if (target === "Feedback Entry") return `You liked a feedback post`;
      return `You liked ${target}`;
    } else if (act.type === 'dislike') {
      if (target === "Feedback Entry") return `You reacted negatively to a post`;
      return `You reacted negatively to ${target}`;
    } else if (act.type === 'comment') {
      return `You commented on ${target}`;
    } else if (act.type === 'react' || (act.id && act.id.startsWith('react'))) {
      return `You reacted to ${target}`;
    }

    return `You interacted with ${target}`;
  };

  return (
    <div style={styles.container}>
      <style>{`
        .activity-card {
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          border: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          position: relative;
          overflow: hidden;
          margin-bottom: 8px;
          min-height: 64px;
        }
        .activity-card:hover {
          transform: translateY(-1px);
          border-color: #E2E8F0;
          box-shadow: 0 4px 12px -2px rgba(0,0,0,0.05);
        }
        .activity-card:active {
          transform: translateY(0);
        }
        .activity-icon-cont {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .filter-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div style={styles.filterBar}>
        <div style={styles.filterBarInner}>
          <span style={styles.filterLabel}>Activity</span>
          <div style={styles.filterScroll} className="filter-scroll">
            {filters.map(f => (
              <button
                key={f}
                style={{ ...styles.filterChip, ...(filter === f ? styles.filterChipActive : {}) }}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

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
        ) : filteredActivities.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>🔍</div>
            <p style={styles.emptyText}>No matches</p>
            <p style={styles.emptySubText}>There is no activity matching the "{filter}" filter.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {groupActivities(filteredActivities).map(([groupName, groupActs]) => (
              <div key={groupName} style={styles.groupContainer}>
                <div style={styles.groupHeader}>{groupName}</div>
                {groupActs.map((act) => {
                  const viz = getVisuals(act.type);
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
                          {renderActivityLine(act)}
                        </div>
                        <div style={styles.dateRow}>
                          <span style={styles.date}>{formatFeedbackDate(act.created_at)}</span>
                        </div>
                      </div>

                      {onViewPost && (
                        <div style={styles.chevron}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
});

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
    fontFamily: '"Inter", sans-serif'
  },
  filterBar: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    padding: '8px 20px 8px'
  },
  filterBarInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '700px',
    margin: '0 auto'
  },
  filterLabel: {
    fontSize: 'var(--size-metadata, 11px)',
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  },
  filterScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
    maskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
  },
  filterChip: {
    padding: '5px 12px',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    background: 'transparent',
    fontSize: 'var(--size-metadata, 11px)',
    fontWeight: '600',
    color: '#64748B',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    lineHeight: '1.4'
  },
  filterChipActive: {
    background: '#1E293B',
    color: 'white',
    borderColor: '#1E293B'
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    fontSize: '14px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '700px',
    margin: '0 auto',
    width: '100%'
  },
  groupContainer: {
    marginBottom: '16px'
  },
  groupHeader: {
    position: 'sticky',
    top: '-16px',
    backgroundColor: '#F8FAFC',
    padding: '16px 0 8px 0',
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: '0.08em',
    zIndex: 5,
    marginBottom: '4px'
  },
  meta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    justifyContent: 'center',
    minWidth: 0
  },
  actionText: {
    fontSize: 'var(--size-body, 13px)',
    color: '#1E293B',
    fontWeight: '600',
    lineHeight: '1.3',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center'
  },
  date: {
    fontSize: 'var(--size-metadata, 11px)',
    color: '#94A3B8',
    fontWeight: '500'
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
    fontSize: 'var(--size-page-title, 18px)',
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
    marginLeft: '8px',
    opacity: 0.3,
    flexShrink: 0
  }
};

export default ActivityView;
