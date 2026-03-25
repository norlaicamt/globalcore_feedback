import React, { useState, useEffect } from "react";
import { getUserNotifications } from "../services/api";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Message: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Star: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

const NotificationsView = ({ currentUser, onBack, onOpenComment }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await getUserNotifications(currentUser?.id);
        setNotifications(data);
      } catch (e) {
        console.error("Failed to load notifications:", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) fetchNotifs();
  }, [currentUser]);

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
        <h1 style={styles.headerTitle}>Notifications</h1>
        <div style={{ width: 24 }}></div>
      </header>

      <main style={styles.mainContainer}>
        <div style={styles.listContainer}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: 40 }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ color: '#94A3B8', textAlign: 'center' }}>No notifications yet.</p>
            </div>
          ) : (
            notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((notif) => {
              const isCommentReaction = (notif.type === 'like' || notif.type === 'dislike') && notif.reply_id;
              const isPostReaction = (notif.type === 'like' || notif.type === 'dislike') && !notif.reply_id;

              const getNotifText = () => {
                const t = notif.type.toLowerCase();
                if (t === 'comment') return 'commented on';
                if (t === 'reply' || t === 'message') return 'replied to';
                if (t === 'like' || t === 'reaction' || t === 'like_reaction') return 'liked';
                if (t === 'dislike') return 'disliked';
                return 'reacted to';
              };

              const getTargetText = () => {
                // If it's a nested reply or a reaction on a comment
                if (notif.type === 'reply' || isCommentReaction) {
                  return `your comment "${notif.reply_message?.substring(0, 30)}${notif.reply_message?.length > 30 ? '...' : ''}"`;
                }
                // If it's a direct comment or reaction on a post
                return `your post "${notif.feedback_title}"`;
              };

              return (
                <div key={notif.id} style={styles.notifCard} onClick={() => onOpenComment && onOpenComment(notif)}>
                  <div style={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        ...styles.avatar,
                        backgroundColor: (notif.type === 'comment' || notif.type === 'reply') ? '#E0F2FE' : '#FEF3C7'
                      }}>
                        {(notif.type === 'comment' || notif.type === 'reply') ? <Icons.Message /> : <Icons.Star />}
                      </div>
                      <span style={styles.actorName}>{notif.actor_name}</span>
                    </div>
                    <span style={styles.itemDate}>{formatDateTime(notif.created_at).date}</span>
                  </div>

                  <p style={styles.notifText}>
                    {getNotifText()} {getTargetText()}
                  </p>

                  <div style={styles.cardFooter}>
                    <div style={{
                      ...styles.typeBadge,
                      backgroundColor: (notif.type === 'comment' || notif.type === 'reply') ? '#F0F9FF' : '#FFF7ED',
                      color: (notif.type === 'comment' || notif.type === 'reply') ? '#0369A1' : '#C2410C'
                    }}>
                      {notif.type.toUpperCase()}
                    </div>
                    <div style={styles.timeLabel}><Icons.Clock /> {formatDateTime(notif.created_at).time}</div>
                  </div>
                </div>
              );
            })
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
  notifCard: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'box-shadow 0.2s', ':hover': { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' } },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' },
  avatar: { width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f2a56' },
  actorName: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  itemDate: { fontSize: '11px', color: '#94A3B8' },
  notifText: { fontSize: '14px', color: '#475569', margin: '0 0 12px 0', lineHeight: '1.4' },
  feedbackTitle: { fontWeight: '700', color: '#1f2a56' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' },
  timeLabel: { fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' },
  emptyState: { padding: '40px 20px', border: '2px dashed #E2E8F0', borderRadius: '20px', marginTop: '20px' }
};

export default NotificationsView;
