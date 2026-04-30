import React, { useState, useEffect } from "react";
import { getUserNotifications, markNotificationsAsRead, markNotificationAsRead, trackBroadcastView, acknowledgeBroadcast } from "../services/api";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Message: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  HeartFill: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  ThumbsDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"></path><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>,
  Reply: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  CheckCircle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  BellRing: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  AtSign: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>,
  ThumbsUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
};

const NotificationsView = ({ currentUser, onBack, onOpenComment, onRead, notifications: propsNotifications }) => {
  const [internalNotifications, setInternalNotifications] = useState(propsNotifications || []);
  const [isLoading, setIsLoading] = useState(!propsNotifications);

  useEffect(() => {
    if (propsNotifications) {
      setInternalNotifications(propsNotifications);
      setIsLoading(false);
    }
  }, [propsNotifications]);

  const notifications = internalNotifications;

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getUserNotifications(currentUser.id);
        setInternalNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser && !propsNotifications) fetchNotifications();
  }, [currentUser, propsNotifications]);

  const handleRead = async (notif) => {
    // 1. Logic for read/acknowledged status
    if (!notif.is_read) {
      try {
        await markNotificationAsRead(notif.id);
        setInternalNotifications(prev => prev.map(n => 
          n.id === notif.id ? { ...n, is_read: true } : n
        ));
        if (onRead) onRead();
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }

    // 2. Logic for broadcasts
    if (notif.broadcast_id) {
      try {
        await trackBroadcastView(currentUser.id, notif.broadcast_id);
        if (notif.require_ack && !notif.is_acknowledged) {
          // If acknowledgment is required, opening the comment view will trigger the acknowledgment prompt
          if (onOpenComment) onOpenComment(notif);
          return;
        }
      } catch (err) {
        console.error("Broadcast tracking error:", err);
      }
    }

    // 3. Open details for any notification type
    if (onOpenComment) onOpenComment(notif);
  };
  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "N/A", time: "N/A" };
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getVisuals = (type) => {
    const t = type.toLowerCase();
    // Premium Palette: Professional, soft but clear
    if (t === 'comment') return { icon: <Icons.Message />, bg: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)', color: '#0369A1' };
    if (t === 'reply') return { icon: <Icons.Reply />, bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', color: '#7E22CE' };
    if (t === 'like') return { icon: <Icons.ThumbsUp />, bg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#15803D' };
    if (t === 'dislike') return { icon: <Icons.ThumbsDown />, bg: 'linear-gradient(135deg, #FFF1F2 0%, #FECDD3 100%)', color: '#BE123C' };
    if (t === 'announcement') return { icon: <Icons.BellRing />, bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#92400E' };
    if (t === 'mention') return { icon: <Icons.AtSign />, bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', color: '#4338CA' };
    return { icon: <Icons.Message />, bg: '#F1F5F9', color: '#64748B' };
  };

  const getNotifText = (type, meta) => {
    const t = type.toLowerCase();
    if (t === 'comment') return 'commented on';
    if (t === 'reply') return 'replied directly to';
    if (t === 'like') {
      if (meta?.actor_count > 1) return 'and others liked';
      return 'liked';
    }
    if (t === 'dislike') return 'disliked';
    if (t === 'announcement') return 'sent an announcement';
    if (t === 'mention') return 'mentioned you in';
    return 'reacted to';
  };

  const getTargetText = (type) => {
    const t = type.toLowerCase();
    if (t === 'reply') return `your comment`;
    if (t === 'mention') return `their post`;
    if (t === 'dislike') return `your feedback`;
    return `your feedback`;
  };

  return (
    <div style={styles.container}>
      <style>{`
        .notif-card-wow {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 16px 20px;
          border: 1px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 4px;
          font-family: 'Inter', sans-serif !important;
        }
        .notif-card-wow * {
          font-family: 'Inter', sans-serif !important;
        }
        .notif-card-wow:hover {
          border-color: #E2E8F0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transform: translateX(4px);
        }
        .section-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 16px;
          font-family: 'Inter', sans-serif !important;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .section-line {
          height: 1px;
          background: #F1F5F9;
          flex: 1;
        }
        .count-badge {
          background: #F1F5F9;
          color: #64748B;
          padding: 2px 6px;
          borderRadius: 6px;
          fontSize: 10px;
        }
      `}</style>

      <div style={styles.headerWrapper}>
        <header style={{ ...styles.header }}>
          <div style={{ width: 40 }}></div>
          <h1 style={styles.headerTitle}>System Notifications</h1>
          {notifications.some(n => !n.is_read) ? (
            <button 
              onClick={async () => {
                try {
                  await markNotificationsAsRead(currentUser.id);
                  if (onRead) onRead();
                  setInternalNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                } catch (e) { console.error("Could not mark all as read", e); }
              }}
              style={{
                background: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                fontSize: '10px',
                fontWeight: '800',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '20px'
              }}
            >
              Mark All Read
            </button>
          ) : (
            <div style={{ width: 40 }}></div>
          )}
        </header>
      </div>

      <main style={styles.mainContainer}>
        <div style={styles.listContainer}>
          {isLoading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <p>Syncing system records...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ color: '#CBD5E1', marginBottom: '16px' }}><Icons.BellRing /></div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '18px' }}>No Activity</h3>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>Your notification log is currently empty.</p>
            </div>
          ) : (
            (() => {
              const sorted = [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              const groups = {};
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

              sorted.forEach(n => {
                const d = new Date(n.created_at);
                const compareDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                
                let key;
                if (compareDate.getTime() === today.getTime()) {
                  key = 'Today';
                } else if (compareDate.getTime() === yesterday.getTime()) {
                  key = 'Yesterday';
                } else {
                  // Use the formatted date as the group key
                  key = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }
                
                if (!groups[key]) groups[key] = [];
                groups[key].push(n);
              });

              // Maintain the sorted order of groups (Today -> Yesterday -> Date Desc)
              // Since 'sorted' is already descending, the keys will appear in correct order if we use an array or sort keys
              const groupKeys = Object.keys(groups).sort((a, b) => {
                if (a === 'Today') return -1;
                if (b === 'Today') return 1;
                if (a === 'Yesterday') return -1;
                if (b === 'Yesterday') return 1;
                return new Date(b) - new Date(a);
              });

              return groupKeys.map((key) => {
                const list = groups[key];
                if (list.length === 0) return null;
                const unreadCount = list.filter(n => !n.is_read).length;

                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="section-divider">
                      <div className="section-title">
                        {key}
                        {unreadCount > 0 && <span className="count-badge">{unreadCount}</span>}
                      </div>
                      <div className="section-line" />
                    </div>
                    {list.map((notif) => {
                      const viz = getVisuals(notif.type);
                      const isAnnouncement = notif.type.toLowerCase() === 'announcement';
                      const nText = getNotifText(notif.type, notif.meta);
                      const tText = getTargetText(notif.type);

                      return (
                        <div 
                          key={notif.id} 
                          className="notif-card-wow" 
                          onClick={() => handleRead(notif)}
                          style={{
                            backgroundColor: notif.is_read ? '#FFFFFF' : '#F4F8FF',
                            borderLeft: notif.is_read ? '3px solid #E2E8F0' : '3px solid #3B82F6',
                            transition: 'all 0.3s ease',
                            padding: '16px 20px',
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                            borderRadius: '16px',
                            border: '1px solid #F1F5F9',
                            marginBottom: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          <div className="notif-avatar-cont" style={{ 
                            background: notif.is_read ? '#F8FAFC' : viz.bg, 
                            color: notif.is_read ? '#CBD5E1' : viz.color,
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: notif.is_read ? 'none' : '0 4px 12px rgba(0,0,0,0.08)',
                            border: notif.is_read ? '1px solid #F1F5F9' : 'none'
                          }}>
                            {viz.icon}
                          </div>
                          
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                {isAnnouncement && (
                                  <span style={{ 
                                    fontSize: '9px', 
                                    fontWeight: '900', 
                                    color: viz.color, 
                                    background: notif.is_read ? '#F1F5F9' : viz.bg, 
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em', 
                                    marginBottom: '6px', 
                                    display: 'inline-block' 
                                  }}>
                                    Official Bulletin
                                  </span>
                                )}
                                <h4 style={{ 
                                  margin: 0, 
                                  color: '#0F172A', 
                                  fontWeight: notif.is_read ? 600 : 800, 
                                  fontSize: '15px',
                                  lineHeight: '1.4'
                                }}>
                                  {isAnnouncement ? (notif.subject || notif.message) : (
                                    <span>
                                      <strong style={{ color: '#1E293B' }}>{notif.actor_name || "Someone"}</strong> {nText} {tText}
                                    </span>
                                  )}
                                </h4>
                              </div>
                              {!notif.is_read && (
                                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '12px', marginTop: '6px' }}>
                                  <div style={{ width: '8px', height: '8px', backgroundColor: '#3B82F6', borderRadius: '50%' }} />
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.Clock /> {formatDateTime(notif.created_at).date} at {formatDateTime(notif.created_at).time}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()
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
  headerTitle: { fontSize: '16px', fontWeight: '800', color: 'var(--primary-color)', margin: 0 },
  iconBtn: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer', color: 'var(--primary-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s' },
  headerWrapper: { position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.5)', flexShrink: 0 },
  mainContainer: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  listContainer: { width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' },
  notifText: { fontSize: '13px', color: '#475569', margin: '0', lineHeight: '1.4' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' },
  typeBadge: { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em' },
  timeLabel: { fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' },
  viewBtn: { padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', backgroundColor: '#F8FAFC', color: 'var(--primary-color)', border: '1px solid #E2E8F0', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', ':hover': { backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderColor: 'rgba(var(--primary-rgb), 0.2)' } },
  emptyState: { padding: '60px 20px', backgroundColor: 'transparent', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginTop: '40px' },
  loadingState: { padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94A3B8', gap: '16px', fontWeight: 'bold' },
  spinner: { width: '30px', height: '30px', border: '3px solid #E2E8F0', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }
};

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
