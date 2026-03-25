import React, { useState, useEffect } from "react";
import ProfileSettings from './ProfileSettings';
import HistoryView from './HistoryView';
import InboxView from './InboxView';
import DraftsView from './DraftsView';
import NotificationsView from './NotificationsView';
import CustomModal from './CustomModal';
import DepartmentFeedback from './DepartmentFeedback';
import IndividualFeedback from './IndividualFeedback';
import GeneralFeedback from './GeneralFeedback';
import { getFeedbacks, getUserNotifications, getFeedbackReplies, createFeedbackReply, updateFeedbackReply, deleteFeedbackReply, toggleReaction, toggleReplyReaction, getReactionsSummary, markNotificationsAsRead } from "../services/api";

const Icons = {
  Plus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Building: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Message: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  History: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><polyline points="12 7 12 12 15 15"></polyline></svg>,
  Inbox: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  EditComment: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  ThumbUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>,
  ThumbDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"></path><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Star: ({ filled, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
};

const FeedbackHub = ({ currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [view, setView] = useState("home");
  const [feedData, setFeedData] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState('category');
  const [dialogState, setDialogState] = useState({ isOpen: false });
  const [inboxTab, setInboxTab] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [commentingFeedback, setCommentingFeedback] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  // Local reactive copy of the user — can be updated after profile saves
  const [localUser, setLocalUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || 'null') || currentUser; }
    catch { return currentUser; }
  });

  const handleUserUpdate = (updatedUser) => {
    setLocalUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const fetchCommunityFeed = async () => {
    try {
      setLoadingFeed(true);
      const data = await getFeedbacks();
      setFeedData(data);
    } catch (error) {
      console.error("Could not fetch feed:", error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchNotifications = async () => {
    if (!localUser?.id) return;
    try {
      const data = await getUserNotifications(localUser.id);
      setNotifications(data);
      const unreadCount = data.filter(n => !n.is_read).length;
      setHasUnreadNotifications(unreadCount > 0);
    } catch (e) { console.error("Could not fetch notifications", e); }
  };

  const handleOpenNotifications = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && hasUnreadNotifications) {
      try {
        await markNotificationsAsRead(localUser.id);
        setHasUnreadNotifications(false);
        // Optional: refresh notifications to show them as read (though they'll look same in list unless we add styles)
        fetchNotifications();
      } catch (e) { console.error("Could not mark notifications as read", e); }
    }
  };

  // FETCH REAL DATA FROM BACKEND
  useEffect(() => {
    if (view === "home") {
      fetchCommunityFeed();
      fetchNotifications();
    }
  }, [view, localUser]);

  const navigateTo = (newView) => {
    setInboxTab("All");
    setView(newView);
    setIsMenuOpen(false);
  };

  const handleSecureLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://192.168.1.47:8000/api/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      }
    } catch (e) { console.error(e); }
    finally {
      localStorage.clear();
      if (onLogout) onLogout();
      window.location.reload();
    }
  };

  const triggerLogout = () => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title: 'Logout',
      message: 'Are you sure you want to log out of your account?',
      confirmText: 'Logout',
      isDestructive: true,
      onConfirm: handleSecureLogout,
      onCancel: () => setDialogState({ isOpen: false })
    });
  };

  const showToast = (message, isError = false) => {
    setToastMessage({ text: message, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const showSuccessModal = (message) => {
    setIsReportModalOpen(false);
    showToast(message || "Submitted Confirmed");
    fetchCommunityFeed(); // Refresh feed without reloading
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: <Icons.Building /> },
    {
      id: 'feedback_group',
      label: 'My Feedback',
      icon: <Icons.Inbox />,
      subItems: [
        { id: 'inbox', label: 'Inbox', icon: <Icons.Inbox /> },
        { id: 'history', label: 'Sent', icon: <Icons.History /> },
        { id: 'drafts', label: 'Drafts', icon: <Icons.Message /> }
      ]
    },
    { id: 'profile', label: 'Settings', icon: <Icons.User /> },
    { id: 'logout', label: 'Logout', icon: <Icons.Logout />, color: '#EF4444', action: triggerLogout },
  ];

  return (
    <div style={styles.hubContainer}>
      <header style={styles.header}>
        <button onClick={() => setIsMenuOpen(true)} style={styles.iconBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="18" y2="6"></line>
            <line x1="3" y1="18" x2="15" y2="18"></line>
          </svg>
        </button>
        <span style={styles.headerTitle}>Command Center</span>
        <button onClick={handleOpenNotifications} style={styles.iconBtn}>
          <Icons.Bell />
          {hasUnreadNotifications && <div style={{ ...styles.notifDot, backgroundColor: '#EF4444' }}></div>}
        </button>
      </header>

      <main style={styles.mainScroll}>
        {view === "home" ? (
          <DashboardView
            feed={feedData}
            loading={loadingFeed}
            onAction={() => { setIsReportModalOpen(true); setReportStep('category'); }}
            currentUser={localUser}
            onShowToast={showToast}
            onOpenComments={(f) => setCommentingFeedback(f)}
          />
        ) : view === "inbox" ? (
          <InboxView currentUser={localUser} onBack={() => setView("home")} initialTab={inboxTab} />
        ) : view === "history" ? (
          <HistoryView currentUser={localUser} onBack={() => setView("home")} />
        ) : view === "drafts" ? (
          <DraftsView currentUser={localUser} onBack={() => setView("home")} />
        ) : view === "notifications" ? (
          <NotificationsView 
            currentUser={localUser} 
            onBack={() => setView("home")} 
            onOpenComment={async (n) => {
              let post = feedData.find(f => f.id === n.feedback_id);
              if (!post) {
                try {
                  const res = await fetch(`http://${window.location.hostname}:8000/feedbacks/${n.feedback_id}`);
                  if(res.ok) post = await res.json();
                } catch(e) { console.error(e); }
              }
              if (post) setCommentingFeedback(post);
            }}
          />
        ) : view === "profile" ? (
          <ProfileSettings currentUser={localUser} onBack={() => setView("home")} onLogout={onLogout} onUserUpdate={handleUserUpdate} />
        ) : null}
      </main>

      {/* Side Menu */}
      {isMenuOpen && (
        <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
          <div style={styles.menuContent} onClick={e => e.stopPropagation()}>
            <div style={styles.menuHeader}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {localUser?.avatar_url ? (
                  <img src={localUser.avatar_url} alt="avatar" style={{ ...styles.avatarLarge, objectFit: 'cover', display: 'flex' }} />
                ) : (
                  <div style={styles.avatarLarge}>{localUser?.name?.charAt(0) || "U"}</div>
                )}
                {localUser?.show_activity_status !== false && (
                  <span style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, backgroundColor: '#22C55E', borderRadius: '50%', border: '2px solid white', display: 'block' }}></span>
                )}
              </div>
              <h3 style={styles.userName}>{localUser?.name || "User"}</h3>
              <p style={styles.userRole}>{localUser?.role ? (localUser.role.charAt(0).toUpperCase() + localUser.role.slice(1)) : 'Feedback Giver'}</p>
            </div>
            <nav style={styles.menuLinks}>
              {menuItems.map((item) => (
                <div key={item.id} style={{ marginTop: item.id === 'logout' ? 'auto' : '0' }}>
                  <button
                    style={{ ...styles.menuLink, color: item.color || '#475569', display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}
                    onClick={() => {
                      if (item.subItems) {
                        setIsFeedbackExpanded(!isFeedbackExpanded);
                      } else if (item.action) {
                        item.action();
                      } else {
                        navigateTo(item.id);
                      }
                    }}
                  >
                    {item.icon} <span>{item.label}</span>
                    {item.subItems && (
                      <span style={{ marginLeft: 'auto', display: 'flex' }}>
                        {isFeedbackExpanded ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        )}
                      </span>
                    )}
                  </button>

                  {item.subItems && isFeedbackExpanded && (
                    <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      {item.subItems.map(sub => (
                        <button
                          key={sub.id}
                          style={{ ...styles.menuLink, fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '10px' }}
                          onClick={() => navigateTo(sub.id)}
                        >
                          {sub.icon} <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Notifications */}
      {isNotifOpen && (
        <div style={styles.notifOverlay} onClick={() => setIsNotifOpen(false)}>
          <div style={styles.notifContent} onClick={e => e.stopPropagation()}>
            <div style={styles.notifHeader}>
              <h3 style={styles.notifTitle}>Notifications</h3>
              <button style={styles.closeBtn} onClick={() => setIsNotifOpen(false)}>✕</button>
            </div>
            <div style={styles.notifList}>
              {notifications.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '20px' }}>No new notifications</p>
              ) : (
                notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '12px',
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      cursor: 'pointer'
                    }} onClick={async () => {
                      setIsNotifOpen(false);
                      let postInfo = feedData.find(f => f.id === n.feedback_id);
                      if (!postInfo) {
                        try {
                          const res = await fetch(`http://${window.location.hostname}:8000/feedbacks/${n.feedback_id}`);
                          if (res.ok) postInfo = await res.json();
                        } catch(e) { console.error(e); }
                      }
                      if (postInfo) setCommentingFeedback(postInfo);
                    }}>
                      <div style={{ fontSize: '13px', color: '#1E293B' }}>
                      <span style={{ fontWeight: '800' }}>{n.actor_name}</span> {
                        n.type === 'comment' ? `commented on your post "${n.feedback_title}"` :
                        n.type === 'reply' ? `replied to your comment in "${n.feedback_title}"` :
                        (n.type === 'like' || n.type === 'dislike' || n.type === 'reaction') ? 
                          (n.reply_id ? `reacted to your comment in "${n.feedback_title}"` : `reacted to your post "${n.feedback_title}"`) 
                          : `interacted with your post "${n.feedback_title}"`
                      }
                    </div>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{timeAgo(n.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Report Modal Overlay */}
      {isReportModalOpen && (
        <div style={styles.reportOverlay} onClick={() => setIsReportModalOpen(false)}>
          <div style={styles.reportModalContent} onClick={e => e.stopPropagation()}>
            {reportStep === "category" ? (
              <CategorySelection onBack={() => setIsReportModalOpen(false)} onSelect={(v) => setReportStep(v)} />
            ) : reportStep === "department" ? (
              <DepartmentFeedback currentUser={currentUser} onBack={() => setReportStep("category")} onSuccess={() => showSuccessModal("Your departmental feedback has been submitted.")} />
            ) : reportStep === "individual" ? (
              <IndividualFeedback currentUser={currentUser} onBack={() => setReportStep("category")} onSuccess={() => showSuccessModal("Your individual recognition has been submitted.")} />
            ) : reportStep === "general" ? (
              <GeneralFeedback currentUser={currentUser} onBack={() => setReportStep("category")} onSuccess={() => showSuccessModal("Your suggestions have been submitted.")} />
            ) : null}
          </div>
        </div>
      )}

      {/* Reusable Dialog Modal (No more localhost alerts) */}
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

      {/* Center Toast Message */}
      {toastMessage && (
        <div style={{ ...styles.toastModal, backgroundColor: toastMessage.isError ? '#EF4444' : '#10B981' }}>
          {toastMessage.isError ? '❌ ' : '✅ '}{toastMessage.text}
        </div>
      )}

      {commentingFeedback && (
        <CommentModal
          item={commentingFeedback}
          currentUser={localUser}
          onClose={() => setCommentingFeedback(null)}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};

const CommentModal = ({ item, currentUser, onClose, onShowToast }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // { id, name }
  const [itemMeta, setItemMeta] = useState(item);
  const [expandedThreads, setExpandedThreads] = useState({}); // { commentId: boolean }

  const toggleThread = (id) => {
    setExpandedThreads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [commentData, metaData] = await Promise.all([
          getFeedbackReplies(item.id, currentUser.id),
          getReactionsSummary(item.id, currentUser.id)
        ]);
        setComments(commentData);
        setItemMeta({ ...item, ...metaData });
      } catch (e) {
        console.error("Failed to load modal data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [item, currentUser]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const reply = await createFeedbackReply(item.id, {
        message: replyingTo ? `@${replyingTo.name} ${newComment}` : newComment,
        user_id: currentUser?.id || 1,
        parent_id: replyingTo?.id || null
      });

      const refresh = await getFeedbackReplies(item.id, currentUser.id);
      setComments(refresh);
      setNewComment("");
      setReplyingTo(null);
      onShowToast("Comment Submitted");
    } catch (err) {
      onShowToast("Error posting comment", true);
    }
  };

  const handleEditSave = async (c) => {
    if (!editCommentText.trim()) return;
    try {
      const updated = await updateFeedbackReply(item.id, c.id, { message: editCommentText, user_id: currentUser?.id || 1 });
      setComments(comments.map(x => x.id === c.id ? { ...x, message: updated.message } : x));
      setEditingCommentId(null);
      onShowToast("Comment Updated");
    } catch (err) { onShowToast("Failed to update comment", true); }
  };

  const handleDeleteComment = async (cId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteFeedbackReply(item.id, cId);
      setComments(comments.filter(x => x.id !== cId));
      onShowToast("Comment Deleted");
    } catch (err) { onShowToast("Failed to delete comment", true); }
  };

  const handleReplyReaction = async (replyId, isLike) => {
    try {
      await toggleReplyReaction(item.id, replyId, currentUser.id, isLike);
      const updated = await getFeedbackReplies(item.id, currentUser.id);
      setComments(updated);
    } catch (e) { }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.commentModalContent} onClick={e => e.stopPropagation()}>
        <header style={styles.commentModalHeader}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={styles.modalTitle}>Community Discussion</h3>
            <span style={styles.modalSubtitle}>{item.title}</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </header>

        <div style={styles.commentModalBody}>
          <div style={styles.originalPostSnippetExtended}>
            <div style={styles.snippetUserRow}>
              <div style={styles.snippetAvatar}>{(itemMeta.user_name || 'U').charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.snippetUser}>{itemMeta.user_name || 'Anonymous'}</div>
                <div style={styles.snippetMeta}>
                  {formatDate(itemMeta.created_at)} • {itemMeta.likes || itemMeta.likes_count || 0} Likes
                </div>
              </div>
              <div style={styles.ratingBadge}>
                <Icons.Star filled={true} size={14} />
                <span>{itemMeta.rating || 0}/5</span>
              </div>
            </div>
            <p style={styles.snippetTextFull}>{itemMeta.description || itemMeta.comment}</p>
          </div>

          <div style={styles.modalCommentsList}>
            {loading ? <p style={styles.emptyText}>Loading...</p> :
              comments.length === 0 ? <p style={styles.emptyText}>No comments yet. Be the first to start the conversation!</p> :
                comments.filter(c => !c.parent_id).map(c => {
                  const nested = comments.filter(r => r.parent_id === c.id);
                  return (
                    <div key={c.id} style={styles.commentChain}>
                      <div style={styles.modalCommentItem}>
                        <div style={styles.commentAvatarSmall}>{(c.user?.name || c.user_name || 'U').charAt(0)}</div>
                        <div style={styles.commentBubble}>
                          {editingCommentId === c.id ? (
                            <div style={{ width: '100%' }}>
                              <input
                                style={styles.modalEditInput}
                                value={editCommentText}
                                onChange={e => setEditCommentText(e.target.value)}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button onClick={() => setEditingCommentId(null)} style={styles.modalMiniBtn}>Cancel</button>
                                <button onClick={() => handleEditSave(c)} style={{ ...styles.modalMiniBtn, color: '#3B82F6' }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={styles.commentUserRow}>
                                <span style={styles.commentUserName}>{c.user?.name || c.user_name || 'User'}</span>
                                {c.user_id === currentUser?.id && (
                                  <div style={styles.commentOptions}>
                                    <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.message); }} style={styles.btnIconTiny}><Icons.EditComment /></button>
                                    <button onClick={() => handleDeleteComment(c.id)} style={styles.btnIconTiny}><Icons.Trash /></button>
                                  </div>
                                )}
                              </div>
                              <p style={styles.commentText}>{c.message}</p>
                              <div style={styles.commentActionsRow}>
                                <div style={styles.commentReactions}>
                                  <button
                                    style={{ ...styles.commentReactBtn, color: c.user_reaction === true ? '#3B82F6' : '#64748B' }}
                                    onClick={() => handleReplyReaction(c.id, true)}
                                  >
                                    <Icons.ThumbUp /> <span>{c.likes_count || ''}</span>
                                  </button>
                                  <button
                                    style={{ ...styles.commentReactBtn, color: c.user_reaction === false ? '#EF4444' : '#64748B' }}
                                    onClick={() => handleReplyReaction(c.id, false)}
                                  >
                                    <Icons.ThumbDown /> <span>{c.dislikes_count || ''}</span>
                                  </button>
                                  <button
                                    style={styles.commentReplyLink}
                                    onClick={() => setReplyingTo({ id: c.id, name: c.user?.name || c.user_name })}
                                  >Reply</button>
                                </div>
                                <span style={styles.commentDate}>{timeAgo(c.created_at)}</span>
                              </div>

                              {comments.filter(r => r.parent_id === c.id).length > 0 && (
                                <button
                                  style={styles.viewMoreBtn}
                                  onClick={() => toggleThread(c.id)}
                                >
                                  {expandedThreads[c.id] ? 'Hide replies' : `View ${comments.filter(r => r.parent_id === c.id).length} replies`}
                                </button>
                              )}

                              {expandedThreads[c.id] && (
                                <div style={styles.commentChain}>
                                  {comments.filter(r => r.parent_id === c.id).map(r => (
                                    <div key={r.id} style={styles.nestedCommentItem}>
                                      <div style={styles.nestedAvatarSmall}>{(r.user?.name || r.user_name || 'U').charAt(0)}</div>
                                      <div style={styles.commentBubble}>
                                        <div style={styles.commentUserRow}>
                                          <span style={styles.commentUserName}>{r.user?.name || r.user_name || 'User'}</span>
                                        </div>
                                        <p style={styles.commentText}>{r.message}</p>

                                        <div style={styles.commentActionsRow}>
                                          <div style={styles.commentReactions}>
                                            <button
                                              style={{ ...styles.commentReactBtn, color: r.user_reaction === true ? '#3B82F6' : '#64748B' }}
                                              onClick={() => handleReplyReaction(r.id, true)}
                                            ><Icons.ThumbUp /> {r.likes_count || ''}</button>
                                            <button
                                              style={{ ...styles.commentReactBtn, color: r.user_reaction === false ? '#EF4444' : '#64748B' }}
                                              onClick={() => handleReplyReaction(r.id, false)}
                                            ><Icons.ThumbDown /> {r.dislikes_count || ''}</button>
                                          </div>
                                          <button
                                            style={styles.commentReplyLink}
                                            onClick={() => {
                                              setReplyingTo({ id: r.id, name: r.user?.name || r.user_name || 'Anonymous' });
                                              const input = document.getElementById('modal-comment-input');
                                              if (input) input.focus();
                                            }}
                                          >Reply</button>
                                          <span style={styles.commentDate}>{timeAgo(r.created_at)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

        <div style={styles.commentModalFooter}>
          {replyingTo && (
            <div style={styles.replyingToNotice}>
              Replying to <strong>{replyingTo.name}</strong>
              <button onClick={() => setReplyingTo(null)} style={styles.cancelReplyBtn}>✕</button>
            </div>
          )}
          <div style={styles.modalInputWrapper}>
            <input
              style={styles.modalCommentInput}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePostComment()}
            />
            <button style={styles.modalSendBtn} onClick={handlePostComment}>
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const timeAgo = (dateString) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  if (isNaN(date)) return 'Recently';
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `Just now`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#FCD34D'; // Yellow
    case 'Approved': return '#34D399'; // Green
    case 'Rejected': return '#EF4444'; // Red
    case 'Implemented': return '#60A5FA'; // Blue
    default: return 'transparent';
  }
};

const FeedCard = ({ item, currentUser, onShowToast, onOpenComments }) => {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState(null); // true=like, false=dislike, null=none
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState("");

  // Load reactions on mount
  useEffect(() => {
    getReactionsSummary(item.id, currentUser?.id).then(data => {
      setLikes(data.likes || 0);
      setDislikes(data.dislikes || 0);
      setUserReaction(data.user_reaction ?? null);
    }).catch(() => { });
  }, [item.id, currentUser?.id]);

  const handleReact = async (isLike) => {
    try {
      await toggleReaction(item.id, currentUser?.id || 1, isLike);
      // Refresh counts
      const data = await getReactionsSummary(item.id, currentUser?.id);
      setLikes(data.likes || 0);
      setDislikes(data.dislikes || 0);
      setUserReaction(data.user_reaction ?? null);
    } catch (err) {
      console.error("Reaction failed", err);
    }
  };

  const handleTranslate = () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    const text = item.description || item.comment || "";
    const lower = text.toLowerCase();

    // Simple language detection (mock)
    const formsOfFilipino = ["salamat", "kumusta", "mahal", "saan", "bakit", "magandang", "umaga", "po", "opo", "ano", "sino", "kailan", "paano", "maganda", "pangit", "mabuti"];
    const isFilipino = formsOfFilipino.some(word => lower.includes(word));

    const dictToFilipino = {
      "the": "ang", "is": "ay", "are": "ay", "good": "mabuti", "morning": "umaga",
      "praise": "papuri", "great": "mahusay", "job": "trabaho", "well done": "magaling",
      "thank you": "salamat", "awesome": "kahanga-hanga", "hello": "kumusta",
      "this is a test": "ito ay isang pagsubok", "excellent": "napakahusay",
      "needs": "kailangan ng", "improvement": "pagpapabuti",
      "take too much time in processing": "masyadong matagal sa pagproseso",
      "processing": "pagproseso", "cheater!": "mandaraya!", "cheater": "mandaraya",
      "slow": "mabagal", "fast": "mabilis", "bad": "pangit"
    };

    const dictToEnglish = {
      "salamat": "thank you", "kumusta": "hello", "mahal": "love", "saan": "where", 
      "bakit": "why", "magandang": "beautiful/good", "umaga": "morning", "po": "(respectful term)", 
      "opo": "yes (respectful)", "ano": "what", "sino": "who", "kailan": "when", "paano": "how", 
      "maganda": "beautiful", "mabuti": "good", "maraming": "many/much", "magaling": "great",
      "kaayo": "very much"
    };

    let result = text;
    
    const activeDict = isFilipino ? dictToEnglish : dictToFilipino;

    Object.keys(activeDict).forEach(key => {
      const reg = new RegExp(`\\b${key}\\b`, 'gi');
      if (reg.test(result)) {
        // preserve case matching roughly by just replacing directly 
        result = result.replace(reg, activeDict[key]);
      }
    });

    if (isFilipino) {
      setTranslatedText(`[Translated to English] ${result}`);
    } else {
      setTranslatedText(`[Translated to Filipino] ${result}`);
    }
    setIsTranslated(true);
  };

  const isAnonymous = item.is_anonymous;
  const avatarText = isAnonymous ? "?" : (item.user_name || item.sender_name || 'U').charAt(0).toUpperCase();

  const categoryColorMap = {
    1: '#3B82F6',
    2: '#1f2a56',
    3: '#64748B'
  };
  const markerColor = categoryColorMap[item.category_id] || '#64748B';

  return (
    <div style={{ ...styles.feedCard, borderLeft: `6px solid ${markerColor}` }}>
      <div style={styles.cardHeader}>
        <div style={styles.cardAvatar}>{(item.user_name || 'U').charAt(0)}</div>
        <div style={{ flex: 1 }}>
          <div style={styles.cardSender}>{item.is_anonymous ? 'Anonymous' : (item.user_name || 'Anonymous')}</div>
          <div style={styles.cardMeta}>{timeAgo(item.created_at)}</div>
        </div>
        {item.status && item.status !== 'Open' && item.status !== 'OPEN' && (
          <div style={{ ...styles.statusBadge, backgroundColor: getStatusColor(item.status) }}>
            {item.status}
          </div>
        )}
      </div>

      {/* SUBJECT & DEPARTMENT ROW */}
      <div style={styles.cardSubjectRow}>
        <span style={styles.cardSubject}>{(item.title || item.subject || 'No Subject').substring(0, 40)}</span>
        <span style={styles.cardDept}>
          @ {item.recipient_user_name ? `${item.recipient_user_name}` : (item.recipient_dept_name || 'General')}
        </span>
      </div>

      {/* RATING ROW - ADDED */}
      {item.rating > 0 && (
        <div style={styles.cardRatingRow}>
          {[1, 2, 3, 4, 5].map(s => (
            <Icons.Star key={s} filled={s <= item.rating} size={12} />
          ))}
        </div>
      )}

      <p style={styles.cardText}>
        {isTranslated ? translatedText : ((item.description || '').substring(0, 100) + ((item.description || '').length > 100 ? '...' : ''))}
      </p>

      {(item.description || item.comment) && (
        <button style={styles.translateBtn} onClick={(e) => { e.stopPropagation(); handleTranslate(); }}>
          {isTranslated ? "Show Original" : "See Translation / I-translate"}
        </button>
      )}

      <div style={styles.cardFooter}>
        <div style={styles.cardActions}>
          <button
            style={{ ...styles.reactionBtn, backgroundColor: userReaction === true ? '#DBEAFE' : 'transparent', color: userReaction === true ? '#1D4ED8' : '#64748B' }}
            onClick={() => handleReact(true)}
          >
            <Icons.ThumbUp /> {likes}
          </button>
          <button
            style={{ ...styles.reactionBtn, backgroundColor: userReaction === false ? '#FEE2E2' : 'transparent', color: userReaction === false ? '#DC2626' : '#64748B' }}
            onClick={() => handleReact(false)}
          >
            <Icons.ThumbDown /> {dislikes}
          </button>
        </div>

        <button style={styles.commentActionBtn} onClick={() => onOpenComments(item)}>
          <Icons.Message /> {item.replies_count || 0} {item.replies_count === 1 ? 'Comment' : 'Comments'}
        </button>
      </div>
    </div>
  );
};

const DashboardView = ({ feed, loading, onAction, currentUser, onShowToast, onOpenComments }) => (
  <div style={{ ...styles.fadeIn, display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
    <section style={styles.welcomeSection}>
      <h1 style={styles.greeting}>Community Feed</h1>
      <p style={styles.subGreeting}>Real-time feedback from across the platform.</p>
    </section>

    <section style={styles.actionGridSingle}>
      <button style={styles.primaryAction} onClick={() => onAction("category_selection")}>
        <div style={{ ...styles.actionIconBg, color: '#1f2a56', backgroundColor: '#F1F5F9' }}>
          <Icons.Plus />
        </div>
        <span style={styles.actionText}>New Report</span>
      </button>
    </section>

    <div style={styles.feedHeader}>
      <h3 style={styles.sectionTitle}>Recent Activity</h3>
      <div style={styles.livePulse}>
        <div style={styles.pulseDot}></div> Live
      </div>
    </div>

    <section style={{ ...styles.feedList, flex: 1, overflowY: 'auto', paddingBottom: '20px', border: '1px solid #E2E8F0', borderRadius: '24px' }}>
      {loading ? (
        <p style={styles.emptyText}>Loading feed...</p>
      ) : feed.length > 0 ? (
        feed.map(item => (
          <FeedCard key={item.id} item={item} currentUser={currentUser} onShowToast={onShowToast} onOpenComments={onOpenComments} />
        ))
      ) : (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No activity yet. Be the first to leave feedback!</p>
        </div>
      )}
    </section>
  </div>
);

const CategorySelection = ({ onBack, onSelect }) => (
  <div style={{ ...styles.fadeIn, padding: '20px' }}>
    <button onClick={onBack} style={styles.backBtn}>← Back</button>
    <h2 style={{ ...styles.pageTitle, fontSize: 'clamp(20px, 5vw, 24px)' }}>What kind of feedback?</h2>
    <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>Select a category below to direct your feedback to the right place.</p>
    <div style={styles.categoryStack}>
      {[
        { id: 'department', labelMain: 'Department', labelSub: 'Ahensya / Departamento', desc: 'Feedback para sa isang opisina, LGU, o team', icon: <Icons.Building /> },
        { id: 'individual', labelMain: 'Individual', labelSub: 'Pampersonal', desc: 'Papuri, mensahe, o reklamo para sa isang tao', icon: <Icons.User /> },
        { id: 'general', labelMain: 'General', labelSub: 'Pangkalahatan', desc: 'Mga ideya o suhestiyon para sa ikabubuti ng lahat', icon: <Icons.Message /> }
      ].map(cat => (
        <button key={cat.id} style={styles.categoryCard} onClick={() => onSelect(cat.id)}>
          <div style={{ ...styles.catIcon, color: '#1f2a56', backgroundColor: '#F1F5F9' }}>{cat.icon}</div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1 }}>
            <span style={{ ...styles.catLabel, fontSize: 'clamp(15px, 4vw, 17px)' }}>
              {cat.labelMain} <span style={{fontSize: '11px', color: '#64748B', fontWeight: 'normal'}}> / {cat.labelSub}</span>
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{cat.desc}</span>
          </div>
          <Icons.ChevronRight />
        </button>
      ))}
    </div>
  </div>
);

const styles = {
  hubContainer: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', fontFamily: '"Inter", -apple-system, sans-serif', fontSize: '14px' },
  header: { padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F1F5F9', flexShrink: 0 },
  headerTitle: { fontSize: '14px', fontWeight: '800', color: '#1f2a56', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', position: 'relative' },
  notifDot: { position: 'absolute', top: '0px', right: '0px', width: '8px', height: '8px', backgroundColor: '#1f2a56', borderRadius: '50%', border: '2px solid white' },
  mainScroll: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in-out' },
  layoutCenter: { maxWidth: '800px', margin: '0 auto', width: '100%' },
  welcomeSection: { marginBottom: '12px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  greeting: { fontSize: '18px', fontWeight: '800', background: '-webkit-linear-gradient(45deg, #1f2a56, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subGreeting: { fontSize: '12px', color: '#64748B' },
  actionGridSingle: { marginBottom: '12px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  primaryAction: { width: '100%', background: 'linear-gradient(135deg, #1f2a56 0%, #2563EB 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)', cursor: 'pointer', transition: 'transform 0.2s', fontWeight: 'bold' },
  actionIconBg: { width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  actionText: { fontSize: '14px', fontWeight: 'bold' },
  sectionTitle: { fontSize: '13px', fontWeight: 'bold' },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    position: 'sticky',
    top: 0,
    backgroundColor: '#F8FAFC',
    padding: '8px 0',
    zIndex: 10,
    maxWidth: '800px', margin: '0 auto', width: '100%'
  },
  feedList: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  feedScroll: { flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' },
  feedCard: { backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px', border: '1px solid #F1F5F9', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' },

  cardHeader: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' },
  cardAvatar: { width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#1f2a56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  cardSender: { fontSize: '12px', fontWeight: '700', color: '#1E293B' },
  cardMeta: { fontSize: '10px', color: '#94A3B8' },
  statusBadge: { padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'white' },

  cardSubjectRow: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' },
  cardSubject: { fontSize: '12px', fontWeight: '800', color: '#1f2a56' },
  cardDept: { fontSize: '10px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' },
  cardRatingRow: { display: 'flex', gap: '2px', marginBottom: '4px' },

  cardText: { fontSize: '11px', color: '#475569', lineHeight: '1.4', marginBottom: '8px', margin: '0 0 8px 0' },

  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F8FAFC', paddingTop: '6px' },
  cardActions: { display: 'flex', gap: '12px' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#64748B', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: '2px 0' },
  commentActionBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#1f2a56', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '2px 0' },
  feedTarget: { fontSize: '12px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  feedComment: { fontSize: '14px', margin: '8px 0', lineHeight: '1.5', color: '#334155' },
  feedTag: { display: 'inline-block', fontSize: '10px', fontWeight: '800', backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '8px' },
  livePulse: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 'bold' },
  pulseDot: { width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%' },
  emptyState: { padding: '40px 20px', textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: '20px' },
  emptyText: { color: '#94A3B8', fontSize: '14px' },
  backBtn: { background: 'none', border: 'none', color: '#1f2a56', fontWeight: 'bold', marginBottom: '16px' },
  pageTitle: { fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' },
  categoryStack: { display: 'flex', flexDirection: 'column', gap: '12px' },
  categoryCard: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0' },
  catIcon: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' },
  catLabel: { flex: 1, fontWeight: '600', textAlign: 'left' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 100, backdropFilter: 'blur(4px)' },
  menuContent: { width: '280px', height: '100%', backgroundColor: 'white' },
  menuHeader: { padding: '60px 24px 30px', backgroundColor: '#1f2a56', color: 'white' },
  avatarLarge: { width: '64px', height: '64px', borderRadius: '22px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '2px solid white', marginBottom: '16px' },
  userName: { margin: 0 },
  userRole: { margin: 0, opacity: 0.7, fontSize: '13px' },
  menuLinks: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  menuLink: { background: 'none', border: 'none', textAlign: 'left', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  notifOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 100 },
  notifContent: { width: '300px', height: '100%', backgroundColor: 'white', position: 'absolute', right: 0 },
  notifHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' },
  notifTitle: { margin: 0, fontSize: '16px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' },
  notifList: { flex: 1, padding: '10px' },
  reportOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '20px' },
  reportModalContent: { backgroundColor: '#F8FAFC', width: '100%', maxWidth: '420px', height: '85vh', maxHeight: '85vh', borderRadius: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  feedAvatar: { width: '36px', height: '36px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0 },
  commentToggleBtn: { background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', transition: 'background-color 0.2s' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' },
  commentModalContent: { backgroundColor: 'white', width: '100%', maxWidth: '500px', maxHeight: '85vh', borderRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  commentModalHeader: { padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  modalTitle: { fontSize: '18px', fontWeight: '800', color: '#1f2a56', margin: 0 },
  closeBtn: { background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' },
  commentModalBody: { flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#F8FAFC' },
  originalPostSnippet: { backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '24px' },
  snippetUser: { fontSize: '12px', fontWeight: 'bold', color: '#1f2a56', textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
  snippetText: { fontSize: '13px', margin: 0, color: '#475569', lineHeight: '1.4' },
  modalCommentsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  modalCommentItem: { display: 'flex', gap: '8px' },
  commentAvatarSmall: { width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#1f2a56', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 },
  commentBubble: { backgroundColor: 'white', padding: '8px 12px', borderRadius: '16px', border: '1px solid #E2E8F0', flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  commentUserName: { fontSize: '12px', fontWeight: '800', color: '#1f2a56' },
  commentText: { fontSize: '13px', margin: '4px 0 8px', color: '#334155', lineHeight: '1.4' },
  commentActionsRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  commentActionLink: { background: 'none', border: 'none', padding: 0, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'color 0.2s' },
  commentDate: { fontSize: '10px', color: '#94A3B8', marginLeft: 'auto' },
  commentModalFooter: { padding: '12px 16px', borderTop: '1px solid #F1F5F9', borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', backgroundColor: 'white' },
  modalInputWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
  modalCommentInput: { flex: 1, backgroundColor: '#F1F5F9', border: 'none', borderRadius: '20px', padding: '10px 16px', fontSize: '13px', outline: 'none' },
  modalSendBtn: { background: '#1f2a56', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' },
  modalEditInput: { width: '100%', border: '2px solid #3B82F6', borderRadius: '12px', padding: '8px', fontSize: '13px', outline: 'none', marginBottom: '6px', boxSizing: 'border-box' },
  modalMiniBtn: { background: '#F1F5F9', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', color: '#64748B', padding: '4px 10px', borderRadius: '8px' },
  btnIconTiny: { background: 'none', border: 'none', padding: '3px', cursor: 'pointer', color: '#94A3B8', transition: 'color 0.2s' },
  modalSubtitle: { fontSize: '11px', color: '#64748B', fontWeight: '600' },
  originalPostSnippetExtended: { backgroundColor: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  snippetUserRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  snippetAvatar: { width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#1f2a56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' },
  snippetMeta: { fontSize: '11px', color: '#94A3B8' },
  ratingBadge: { backgroundColor: '#FFF7ED', color: '#C2410C', padding: '3px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' },
  snippetTextFull: { fontSize: '14px', color: '#1E293B', lineHeight: '1.5', margin: 0 },
  commentChain: { display: 'flex', flexDirection: 'column', gap: '6px' },
  commentUserRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  commentOptions: { display: 'flex', gap: '6px' },
  commentReactions: { display: 'flex', alignItems: 'center', gap: '10px' },
  commentReactBtn: { background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', color: '#64748B' },
  commentReplyLink: { background: 'none', border: 'none', padding: 0, fontSize: '11px', fontWeight: 'bold', color: '#1f2a56', cursor: 'pointer', marginLeft: '6px' },
  nestedCommentItem: { display: 'flex', gap: '8px', marginLeft: '40px', marginTop: '2px' },
  nestedAvatarSmall: { width: '24px', height: '24px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
  viewMoreBtn: { background: 'none', border: 'none', color: '#3B82F6', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '4px 0', marginTop: '4px', textAlign: 'left' },
  replyingToNotice: { fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '6px 10px', borderRadius: '10px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cancelReplyBtn: { background: 'none', border: 'none', color: '#EF4444', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px' },
  translateBtn: { background: 'none', border: 'none', color: '#1f2a56', fontSize: '12px', textAlign: 'left', padding: '0 0 8px 0', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' },
  reactionBtn: { border: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '16px', fontSize: '11px', cursor: 'pointer', transition: 'background-color 0.2s', fontWeight: 'bold' },
  toastModal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '16px 24px', color: 'white', fontWeight: 'bold', fontSize: '15px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999, animation: 'fadeIn 0.2s ease-out', pointerEvents: 'none' },
  feedList: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: '14px', width: '100%', margin: '40px 0' }
};

export default FeedbackHub;