import React, { useState, useEffect } from "react";
import { getUserActivity } from "../services/api";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Like: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>,
  Dislike: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>,
  Comment: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Post: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return { date: "N/A", time: "N/A" };
  const dateObj = new Date(dateStr);
  return {
    date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  };
};

const ActivityView = ({ currentUser, onBack, onViewPost }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ width: 24 }} />
        <h2 style={styles.title}>Interaction Activity</h2>
        <div style={{ width: 24 }} />
      </header>

      <main style={styles.main}>
        {loading ? (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyText}>Loading your activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyIcon}>✨</div>
            <p style={styles.emptyText}>No interactions found.</p>
            <p style={styles.emptySubText}>Join the conversation by liking or commenting on feedback from your peers.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {activities.map((act) => {
              const { date, time } = formatDateTime(act.created_at);
              let Icon = Icons.Comment;
              let actionText = "commented on";
              let iconBg = "#E0E7FF";
              let iconColor = "#4338CA";
              
              if (act.type === 'like') { 
                Icon = Icons.Like; actionText = "liked"; 
                iconBg = "#DCFCE7"; iconColor = "#15803D";
              }
              else if (act.type === 'dislike') { 
                Icon = Icons.Dislike; actionText = "disliked"; 
                iconBg = "#FEE2E2"; iconColor = "#B91C1C";
              }
              else if (act.type === 'post') { 
                Icon = Icons.Post; actionText = "published"; 
                iconBg = "#DBEAFE"; iconColor = "#1D4ED8";
              }

              return (
                <div 
                  key={act.id} 
                  style={{...styles.card, transform: hoveredId === act.id ? 'scale(1.01)' : 'scale(1)', borderColor: hoveredId === act.id ? '#3B82F6' : '#F1F5F9'}} 
                  onMouseEnter={() => setHoveredId(act.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onViewPost && onViewPost(act.feedback_id)}
                >
                  <div style={styles.cardHeader}>
                    <div style={{...styles.iconWrapper, backgroundColor: iconBg, color: iconColor}}><Icon /></div>
                    <div style={styles.meta}>
                      <span style={styles.actionText}>
                        <span style={styles.actor}>You</span> {actionText} <span style={styles.targetTitle}>"{act.title || "a post"}"</span>
                        {act.type === 'post' && act.mentions && act.mentions.length > 0 && (
                          <div style={styles.mentionsList}>
                            <span style={styles.mentionsLabel}>MENTIONED:</span> {act.mentions.map(m => `${m.employee_prefix} ${m.employee_name}`.trim()).join(", ")}
                          </div>
                        )}
                      </span>
                      <span style={styles.date}>{date} • {time}</span>
                    </div>
                    <div style={styles.chevron}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
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
  container: { height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: '"Inter", sans-serif' },
  header: { padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, zIndex: 10 },
  title: { margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '-0.2px' },
  main: { flex: 1, overflowY: 'auto', padding: '24px 20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' },
  cardHeader: { display: 'flex', gap: '16px', alignItems: 'center' },
  iconWrapper: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', transition: 'all 0.2s ease' },
  meta: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  actionText: { fontSize: '13px', color: '#64748B', lineHeight: '1.5' },
  actor: { fontWeight: '600', color: '#1E293B' },
  targetTitle: { fontWeight: '700', color: 'var(--primary-color)' },
  date: { fontSize: '11px', color: '#94A3B8', fontWeight: '500' },
  mentionsList: { marginTop: '8px', fontSize: '10px', color: '#3B82F6', fontWeight: '600', backgroundColor: '#F0F7FF', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' },
  mentionsLabel: { color: '#1E40AF', letterSpacing: '0.5px' },
  emptyContainer: { textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  emptyIcon: { fontSize: '32px', marginBottom: '16px' },
  emptyText: { color: 'var(--primary-color)', fontSize: '16px', fontWeight: '800', marginBottom: '8px' },
  emptySubText: { color: '#64748B', fontSize: '13px', maxWidth: '240px', lineHeight: '1.6' },
  chevron: { marginLeft: '8px' }
};

export default ActivityView;
