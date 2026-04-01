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
          <p style={styles.emptyText}>Loading your activity...</p>
        ) : activities.length === 0 ? (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyText}>No interactions found.</p>
            <p style={styles.emptySubText}>Like or comment on posts to see them here.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {activities.map((act) => {
              const { date, time } = formatDateTime(act.created_at);
              let Icon = Icons.Comment;
              let actionText = "commented on";
              
              if (act.type === 'like') { Icon = Icons.Like; actionText = "liked"; }
              else if (act.type === 'dislike') { Icon = Icons.Dislike; actionText = "disliked"; }
              else if (act.type === 'post') { Icon = Icons.Post; actionText = "posted"; }

              return (
                <div key={act.id} style={styles.card} onClick={() => onViewPost && onViewPost(act.feedback_id)}>
                  <div style={styles.cardHeader}>
                    <div style={styles.iconWrapper}><Icon /></div>
                    <div style={styles.meta}>
                      <span style={styles.actionText}>
                        You {actionText} <span style={styles.targetTitle}>a post</span>
                        {act.type === 'post' && act.mentions && act.mentions.length > 0 && (
                          <div style={{ marginTop: '8px', fontSize: '11px', color: '#1D4ED8', fontWeight: '600' }}>
                            Mentioned: {act.mentions.map(m => `${m.employee_prefix} ${m.employee_name}`.trim()).join(", ")}
                          </div>
                        )}
                      </span>
                      <span style={styles.date}>{date} at {time}</span>
                    </div>
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
  header: { padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' },
  title: { margin: 0, fontSize: '16px', fontWeight: '800', color: '#1f2a56' },
  main: { flex: 1, overflowY: 'auto', padding: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'transform 0.1s ease', ':hover': { backgroundColor: '#F8FAFC' } },
  cardHeader: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  iconWrapper: { marginTop: '2px', color: '#1f2a56', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: '#F1F5F9', borderRadius: '8px' },
  meta: { display: 'flex', flexDirection: 'column', gap: '4px' },
  actionText: { fontSize: '14px', color: '#334155', lineHeight: '1.4' },
  targetTitle: { fontWeight: '700', color: '#1f2a56' },
  date: { fontSize: '12px', color: '#64748B' },
  messageSnippet: { marginTop: '12px', padding: '12px', backgroundColor: '#F1F5F9', borderRadius: '8px', fontSize: '13px', color: '#475569', fontStyle: 'italic', borderLeft: '3px solid #CBD5E1' },
  emptyContainer: { textAlign: 'center', padding: '40px 20px' },
  emptyText: { color: '#64748B', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' },
  emptySubText: { color: '#94A3B8', fontSize: '13px', marginTop: '8px', textAlign: 'center' },
  viewBtn: { marginLeft: 'auto', padding: '6px 12px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#1f2a56', cursor: 'pointer' }
};

export default ActivityView;
