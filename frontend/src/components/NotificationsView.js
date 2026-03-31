import React, { useState, useEffect } from "react";
import { getUserNotifications } from "../services/api";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Message: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  HeartFill: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  ThumbsDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"></path><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>,
  Reply: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  CheckCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  BellRing: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
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
      <style>{`
        .notif-card-wow {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .notif-card-wow:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.08);
          border-color: rgba(59, 130, 246, 0.4);
        }
        .notif-card-wow::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 4px; height: 100%;
          background: transparent;
          transition: background 0.3s ease;
        }
        .notif-card-wow:hover::before {
          background: linear-gradient(180deg, #3B82F6 0%, #8B5CF6 100%);
        }
        .notif-avatar-cont {
          width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: inset 0 2px 4px rgba(255,255,255,0.5);
        }
        .header-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.5);
        }
      `}</style>

      <div style={styles.headerWrapper}>
        <header style={{ ...styles.header }}>
          <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
          <h1 style={styles.headerTitle}>Notifications</h1>
          <div style={{ width: 40 }}></div>
        </header>
      </div>

      <main style={styles.mainContainer}>
        <div style={styles.listContainer}>
          {isLoading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <p>Syncing your activity...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ color: '#CBD5E1', marginBottom: '16px' }}><Icons.BellRing /></div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '18px' }}>You're all caught up!</h3>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>When people react or reply to your posts, you'll find it here.</p>
            </div>
          ) : (
            notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((notif) => {
              const isCommentReaction = (notif.type === 'like' || notif.type === 'dislike') && notif.reply_id;

              const getVisuals = () => {
                const t = notif.type.toLowerCase();
                if (t === 'comment') return { icon: <Icons.Message />, bg: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)', color: '#0369A1' };
                if (t === 'reply') return { icon: <Icons.Reply />, bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', color: '#7E22CE' };
                if (t === 'like') return { icon: <Icons.HeartFill />, bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#B91C1C' };
                if (t === 'dislike') return { icon: <Icons.ThumbsDown />, bg: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)', color: '#C2410C' };
                if (t === 'broadcast') return { icon: <Icons.BellRing />, bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#92400E' };
                if (t === 'approval') return { icon: <Icons.CheckCircle />, bg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#15803D' };
                return { icon: <Icons.Message />, bg: '#F1F5F9', color: '#64748B' };
              };

              const getNotifText = () => {
                const t = notif.type.toLowerCase();
                if (t === 'comment') return 'commented on';
                if (t === 'reply') return 'replied directly to';
                if (t === 'like') return 'loved';
                if (t === 'dislike') return 'disagreed with';
                if (t === 'broadcast') return 'sent an announcement';
                return 'reacted to';
              };

              const getTargetText = () => {
                if (notif.type === 'reply' || isCommentReaction) {
                  return `your comment`;
                }
                return `your post`;
              };

              const viz = getVisuals();

              return (
                <div key={notif.id} className="notif-card-wow" onClick={() => onOpenComment && onOpenComment(notif)}>
                  <div className="notif-avatar-cont" style={{ background: viz.bg, color: viz.color }}>
                    {viz.icon}
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={styles.notifText}>
                        {notif.type === 'broadcast' ? (
                          <>
                            <span style={{ color: '#0F172A', fontWeight: 700 }}>System Announcement:</span> {notif.subject || "Important Update"}
                          </>
                        ) : notif.type === 'approval' ? (
                          <>
                            <span style={{ color: '#15803D', fontWeight: 700 }}>Great News!</span> {notif.message}
                          </>
                        ) : (
                          <>
                            <span style={{ color: '#0F172A', fontWeight: 700 }}>{notif.actor_name || "Someone"}</span> {getNotifText()} <span style={{ color: '#3B82F6', fontWeight: 700 }}>{getTargetText()}</span>
                          </>
                        )}
                      </p>
                      <button style={styles.viewBtn}>View</button>
                    </div>
                    
                    <div style={styles.cardFooter}>
                      <div style={{ ...styles.typeBadge, backgroundColor: 'rgba(241, 245, 249, 0.8)', color: '#64748B' }}>
                        {notif.type.toUpperCase()}
                      </div>
                      <div style={styles.timeLabel}>
                        <Icons.Clock /> {formatDateTime(notif.created_at).date} • {formatDateTime(notif.created_at).time}
                      </div>
                    </div>
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

const spinKeyframes = `
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)', overflow: 'hidden', fontFamily: '"Inter", -apple-system, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', flexShrink: 0, maxWidth: '800px', width: '100%', margin: '0 auto', zIndex: 10 },
  headerTitle: { fontSize: '16px', fontWeight: '800', background: 'linear-gradient(45deg, #1f2a56, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
  iconBtn: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer', color: '#1f2a56', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s' },
  headerWrapper: { position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.5)', flexShrink: 0 },
  mainContainer: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  listContainer: { width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' },
  notifText: { fontSize: '13px', color: '#475569', margin: '0', lineHeight: '1.4' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' },
  typeBadge: { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em' },
  timeLabel: { fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' },
  viewBtn: { padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', backgroundColor: '#F8FAFC', color: '#3B82F6', border: '1px solid #E2E8F0', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', ':hover': { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' } },
  emptyState: { padding: '60px 20px', backgroundColor: 'transparent', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginTop: '40px' },
  loadingState: { padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8', gap: '16px', fontWeight: 'bold' },
  spinner: { width: '30px', height: '30px', border: '3px solid #E2E8F0', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }
};

// Inject keyframes to document gracefully, outside of React scope to prevent duplicate injections on hot-reload:
if (typeof document !== 'undefined') {
  let styleTag = document.getElementById('notif-spin-keyframes');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'notif-spin-keyframes';
    styleTag.innerHTML = spinKeyframes;
    document.head.appendChild(styleTag);
  }
}

export default NotificationsView;
