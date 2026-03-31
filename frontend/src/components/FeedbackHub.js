import React, { useState, useEffect } from "react";
import ProfileSettings from './ProfileSettings';
import HistoryView from './HistoryView';
import DraftsView from './DraftsView';
import NotificationsView from './NotificationsView';
import CustomModal from './CustomModal';
import GeneralFeedback from './GeneralFeedback';
import ActivityView from './ActivityView';
import { getFeedbacks, getUserById, getUserNotifications, getFeedbackReplies, createFeedbackReply, updateFeedbackReply, deleteFeedbackReply, toggleReaction, toggleReplyReaction, getReactionsSummary, markNotificationsAsRead, updateFeedback, deleteFeedback, getAdminSettings, getCategories } from "../services/api";
import { QRCodeCanvas } from "qrcode.react";

const Icons = {
  QR: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="7" y="17" width="2" height="2"></rect><rect x="17" y="17" width="2" height="2"></rect><rect x="7" y="7" width="2" height="2"></rect><rect x="17" y="7" width="2" height="2"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Plus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Building: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>,
  Food: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0H3z"></path><path d="M3 12h18"></path><path d="M8 12v-2a4 4 0 0 1 8 0v2"></path></svg>,
  Cosmetics: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11h10v10H7z"></path><path d="M9 11V7a3 3 0 0 1 6 0v4"></path><line x1="12" y1="2" x2="12" y2="4"></line></svg>,
  Furniture: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="10" width="20" height="6" rx="2"></rect><path d="M4 16v4"></path><path d="M20 16v4"></path><path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"></path></svg>,
  Car: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="8" rx="2"></rect><path d="M4 11l1.5-4h13L20 11"></path><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle></svg>,
  Resort: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Hotel: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Message: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  History: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><polyline points="12 7 12 12 15 15"></polyline></svg>,
  Inbox: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  EditComment: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  ThumbUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>,
  ThumbDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"></path><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Star: ({ filled, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  Moon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
  Sun: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Gear: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Alert: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  TrendingUp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  TrendingDownGood: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
};

const calculateLevel = (points) => {
  if (points >= 500) return { lv: 5, name: "Gold Citizen", color: "#F59E0B" };
  if (points >= 200) return { lv: 4, name: "Silver Citizen", color: "#94A3B8" };
  if (points >= 100) return { lv: 3, name: "Bronze Citizen", color: "#B45309" };
  if (points >= 50) return { lv: 2, name: "Active Citizen", color: "#10B981" };
  return { lv: 1, name: "New Citizen", color: "#3B82F6" };
};

const FeedbackHub = ({ currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [view, setView] = useState(localStorage.getItem("userView") || "home");
  const [prevView, setPrevView] = useState("home");
  const [feedData, setFeedData] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState('general');
  const [dialogState, setDialogState] = useState({ isOpen: false });
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [commentingFeedback, setCommentingFeedback] = useState(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [fullscreenImg, setFullscreenImg] = useState(null);
  const [resumeDraft, setResumeDraft] = useState(null);
  const [localUser, setLocalUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || 'null') || currentUser; }
    catch { return currentUser; }
  });

  const [publicFeedEnabled, setPublicFeedEnabled] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settings, cats] = await Promise.all([
          getAdminSettings(),
          getCategories()
        ]);
        const found = settings.find(s => s.key === 'public_feed');
        if (found) setPublicFeedEnabled(found.value === 'true');
        setCategories(cats);
      } catch (e) { console.error("Error fetching initial data", e); }
    };
    fetchData();
  }, []);

  const handleUserUpdate = (updatedUser) => {
    setLocalUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const fetchCommunityFeed = async (silent = false) => {
    try {
      if (!silent) setLoadingFeed(true);
      const data = await getFeedbacks();
      setFeedData(data);
    } catch (error) {
      console.error("Could not fetch feed:", error);
    } finally {
      if (!silent) setLoadingFeed(false);
    }
  };

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchNotifications = async () => {
    if (!localUser?.id) return;
    try {
      const data = await getUserNotifications(localUser.id);
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadNotifCount(unread);
    } catch (e) { console.error("Could not fetch notifications", e); }
  };

  useEffect(() => {
    if (!localUser?.id) return;
    
    // Initial fetch
    fetchNotifications();

    // SSE Real-time listener
    const sseUrl = `http://${window.location.hostname}:8000/api/notifications/stream/${localUser.id}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      if (event.data === "new_notification") {
        // Increment count and sync list
        setUnreadNotifCount(prev => prev + 1);
        fetchNotifications();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [localUser?.id]);

  const handleOpenNotifications = async () => {
    if (view === "notifications") {
      setView(prevView);
      return;
    }
    setPrevView(view);
    setView("notifications");
    setIsMenuOpen(false);
    
    if (unreadNotifCount > 0) {
      try {
        await markNotificationsAsRead(localUser.id);
        setUnreadNotifCount(0);
        fetchNotifications();
      } catch (e) { console.error("Could not mark notifications as read", e); }
    }
  };

  const fetchUserProfile = async () => {
    if (!localUser?.id) return;
    try {
      const updated = await getUserById(localUser.id);
      handleUserUpdate(updated);
    } catch (e) { console.error("Could not refresh user profile", e); }
  };

  // FETCH REAL DATA FROM BACKEND
  useEffect(() => {
    localStorage.setItem("userView", view);
    if (view === "home") {
      fetchCommunityFeed();
      fetchNotifications();
      fetchUserProfile();
    }
  }, [view, localUser?.id]);

  const navigateTo = (newView) => {
    setView(newView);
    setIsMenuOpen(false);
  };

  const handleSecureLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`http://${window.location.hostname}:8000/api/logout`, {
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
    fetchUserProfile();   // Refresh points and post count
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: <Icons.Building /> },
    {
      id: 'feedback_group',
      label: 'My Feedback',
      icon: <Icons.Inbox />,
      subItems: [
        { id: 'history', label: 'Sent', icon: <Icons.History /> },
        { id: 'drafts', label: 'Drafts', icon: <Icons.Message /> },
        { id: 'activity', label: 'Activity', icon: <Icons.Bell /> }
      ]
    },
    { type: 'label', label: 'ACCOUNT' },
    { id: 'settings', label: 'Settings', icon: <Icons.Gear /> },
    { id: 'profile', label: 'Profile', icon: <Icons.User /> },
    { id: 'logout', label: 'Logout', icon: <Icons.Logout />, color: '#EF4444', action: triggerLogout },
  ];



  return (
    <div style={{ ...styles.hubContainer, backgroundColor: '#F8FAFC', color: '#1E293B' }}>
      <header style={{ ...styles.header, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <button onClick={() => setIsMenuOpen(true)} style={styles.iconBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="18" y2="6"></line>
            <line x1="3" y1="18" x2="15" y2="18"></line>
          </svg>
        </button>
        <span style={{ ...styles.headerTitle, color: '#1f2a56' }}>Command Center</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={handleOpenNotifications} style={{ ...styles.iconBtn, color: '#1f2a56' }} title="Notifications">
            <Icons.Bell />
            {unreadNotifCount > 0 && (
              <div style={{ ...styles.notifDot, backgroundColor: '#EF4444', width: '16px', height: '16px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '2px solid #FFFFFF', top: -4, right: -4 }}>
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </div>
            )}
          </button>
        </div>
      </header>

      <main style={styles.mainScroll}>
        {view === "home" ? (
          <DashboardView
            feed={feedData}
            loading={loadingFeed}
            onAction={() => { setIsReportModalOpen(true); setReportStep('general'); }}
            currentUser={localUser}
            onShowToast={showToast}
            onOpenComments={(f) => setCommentingFeedback(f)}
            setFullscreenImg={setFullscreenImg}
            onRefresh={fetchCommunityFeed}
            publicFeedEnabled={publicFeedEnabled}
            categories={categories}
          />
        ) : view === "history" ? (
          <HistoryView currentUser={localUser} onBack={() => { setView("home"); setIsMenuOpen(true); }} />
        ) : view === "drafts" ? (
          <DraftsView 
            currentUser={localUser} 
            onBack={() => { setView("home"); setIsMenuOpen(true); }} 
            onResumeDraft={(draft) => { setResumeDraft(draft); setReportStep('general'); setIsReportModalOpen(true); setView('home'); }} 
          />
        ) : view === "activity" ? (
          <ActivityView 
            currentUser={localUser} 
            onBack={() => { setView("home"); setIsMenuOpen(true); }} 
            onViewPost={async (feedbackId) => {
              let post = feedData.find(f => f.id === feedbackId);
              if (!post) {
                try {
                  const res = await fetch(`http://${window.location.hostname}:8000/feedbacks/${feedbackId}`);
                  if(res.ok) post = await res.json();
                } catch(e) { console.error(e); }
              }
              if (post) setCommentingFeedback(post);
            }} 
          />
        ) : view === "notifications" ? (
          <NotificationsView 
            currentUser={localUser} 
            onBack={() => setView("home")} 
            onOpenComment={async (n) => {
              if (n.type === 'broadcast') {
                setSelectedBroadcast(n);
                return;
              }
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
        ) : (view === "profile" || view === "settings") ? (
          <ProfileSettings 
            currentUser={localUser} 
            onBack={() => { setView("home"); setIsMenuOpen(true); }} 
            onLogout={onLogout} 
            onUserUpdate={handleUserUpdate} 
            initialSubView={view === "profile" ? "personal_info" : "main"}
          />
        ) : null}
      </main>

      {/* Side Menu */}
      {isMenuOpen && (
        <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
          <div style={styles.menuContent} onClick={e => e.stopPropagation()}>
            <div style={{ ...styles.menuHeader, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
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
              
              {/* COMPACT IMPACT CARD IN SIDEBAR */}
              <div style={{ 
                marginTop: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px',
                border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ 
                    backgroundColor: '#FCD34D', color: '#1E1B4B', padding: '2px 8px', borderRadius: '10px', 
                    fontSize: '9px', fontWeight: '900', letterSpacing: '0.05em'
                  }}>
                    {calculateLevel(localUser?.impact_points || 0).name.toUpperCase()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#FCD34D' }}>{(localUser?.impact_points || 0).toFixed(1)}</p>
                    <p style={{ margin: 0, fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>POINTS</p>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'white' }}>{localUser?.posts_count || 0}</p>
                    <p style={{ margin: 0, fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>POSTS</p>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'white' }}>{localUser?.likes_received || 0}</p>
                    <p style={{ margin: 0, fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>LIKES</p>
                  </div>
                </div>
              </div>
            </div>
            <nav style={styles.menuLinks}>
              {menuItems.map((item, idx) => {
                if (item.type === 'label') {
                  return (
                    <div key={`label-${idx}`} style={{ 
                      fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', 
                      letterSpacing: '1px', marginTop: '24px', marginBottom: '12px', paddingLeft: '16px' 
                    }}>
                      {item.label}
                    </div>
                  );
                }
                const isActive = view === item.id || (item.subItems && item.subItems.some(sub => sub.id === view));
                return (
                  <div key={item.id} style={{ marginTop: item.id === 'logout' ? 'auto' : '0' }}>
                    <button
                      style={{ 
                        ...styles.menuLink, 
                        backgroundColor: (isActive && !item.subItems) ? '#3B82F6' : 'transparent',
                        color: (isActive && !item.subItems) ? 'white' : (item.color || 'rgba(255, 255, 255, 0.8)'), 
                        display: 'flex', alignItems: 'center', gap: '12px', width: '100%' 
                      }}
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
                        {item.subItems.map(sub => {
                          const isSubActive = view === sub.id;
                          return (
                            <button
                              key={sub.id}
                              style={{ 
                                ...styles.menuLink, 
                                fontSize: '14px', 
                                backgroundColor: isSubActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                color: isSubActive ? 'white' : 'rgba(255, 255, 255, 0.6)', 
                                display: 'flex', alignItems: 'center', gap: '10px' 
                              }}
                              onClick={() => navigateTo(sub.id)}
                            >
                              {sub.icon} <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Legacy Notifications Dropdown Removed in Favor of NotificationsView */}

      {/* New Report Modal Overlay */}
      {isReportModalOpen && (
        <div style={styles.reportOverlay} onClick={() => setIsReportModalOpen(false)}>
          <div style={styles.reportModalContent} onClick={e => e.stopPropagation()}>
            {reportStep === "general" && (
              <GeneralFeedback 
                currentUser={currentUser} 
                initialDraft={resumeDraft}
                onBack={() => { setIsReportModalOpen(false); setResumeDraft(null); }} 
                onSuccess={() => { 
                  showSuccessModal("Your suggestions have been submitted."); 
                  setResumeDraft(null); 
                  fetchUserProfile(); // Refresh points after post
                }} 
                onSaveDraft={() => { setIsReportModalOpen(false); setResumeDraft(null); navigateTo('drafts'); }} 
              />
            )}
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
        <div style={{ ...styles.toastModal, backgroundColor: toastMessage.isError ? '#EF4444' : '#1f2a56' }}>
          {toastMessage.text}
        </div>
      )}

      {commentingFeedback && (
        <CommentModal
          item={commentingFeedback}
          currentUser={localUser}
          onClose={() => setCommentingFeedback(null)}
          onShowToast={showToast}
          onRefreshProfile={fetchUserProfile}
          onRefreshFeed={() => fetchCommunityFeed(true)}
        />
      )}

      {selectedBroadcast && (
        <BroadcastViewModal 
          notif={selectedBroadcast} 
          onClose={() => setSelectedBroadcast(null)} 
        />
      )}

      {fullscreenImg && (
        <div style={styles.imageModal} onClick={() => setFullscreenImg(null)}>
          <img src={fullscreenImg} style={styles.modalImg} alt="Fullscreen View" />
        </div>
      )}
    </div>
  );
};

const CommentModal = ({ item, currentUser, onClose, onShowToast, onRefreshProfile, onRefreshFeed }) => {
  const [dialogState, setDialogState] = useState({ isOpen: false });
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

  const [fullscreenImg, setFullscreenImg] = useState(null);


  useEffect(() => {
    const loadData = async () => {
      try {
        const [commentData, metaData] = await Promise.all([
          getFeedbackReplies(item.id, currentUser.id),
          getReactionsSummary(item.id, currentUser.id)
        ]);
        setComments(commentData);
        // Correctively sync likes -> likes_count and dislikes -> dislikes_count
        setItemMeta({ 
          ...item, 
          ...metaData, 
          likes_count: metaData.likes,
          dislikes_count: metaData.dislikes
        });
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
      await createFeedbackReply(item.id, {
        user_id: currentUser?.id || 1,
        message: newComment,
        parent_id: replyingTo?.id || null
      });

      const refresh = await getFeedbackReplies(item.id, currentUser.id);
      setComments(refresh);
      setNewComment("");
      setReplyingTo(null);
      onShowToast("Comment Submitted");
      if (typeof onRefreshProfile === 'function') onRefreshProfile();
    } catch (err) {
      onShowToast("Error posting comment", true);
    }
  };

  const handleStartReply = (node) => {
    const userName = node.user?.name || node.user_name || 'User';
    setReplyingTo({ id: node.id, name: userName });
    setNewComment(`@${userName} `);
    const input = document.getElementById('modal-comment-input');
    if (input) {
      input.focus();
      // Move cursor to end
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = input.value.length;
      }, 0);
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
    setDialogState({
      isOpen: true,
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This cannot be undone.',
      type: 'alert',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteFeedbackReply(item.id, cId);
          setComments(prev => prev.filter(x => x.id !== cId));
          onShowToast("Comment Deleted");
          if (typeof onRefreshProfile === 'function') onRefreshProfile();
        } catch (err) { onShowToast("Failed to delete comment", true); }
        setDialogState({ isOpen: false });
      },
      onCancel: () => setDialogState({ isOpen: false })
    });
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

  const handlePostReaction = async (isLike) => {
    try {
      await toggleReaction(item.id, currentUser?.id || 1, isLike);
      const data = await getReactionsSummary(item.id, currentUser?.id);
      // Correctively sync likes -> likes_count and dislikes -> dislikes_count to ensure local UI updates immediately
      setItemMeta(prev => ({ 
        ...prev, 
        ...data, 
        likes_count: data.likes, 
        dislikes_count: data.dislikes, 
        user_reaction: data.user_reaction 
      }));
      if (typeof onRefreshProfile === 'function') onRefreshProfile();
      if (typeof onRefreshFeed === 'function') onRefreshFeed();
    } catch (e) { console.error(e); }
  };

  // Flatten all replies under a top-level parent to a single level depth (like Facebook)
  const getAllRepliesForThread = (allComments, parentId) => {
    let result = [];
    const children = allComments.filter(c => c.parent_id === parentId);
    for (const child of children) {
      result.push(child);
      result = [...result, ...getAllRepliesForThread(allComments, child.id)];
    }
    return result;
  };

  const renderThreadNode = (node, depth) => {
    const isReply = depth > 0;
    return (
      <div key={node.id} style={{ marginLeft: isReply ? '32px' : '0', marginTop: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            width: isReply ? '28px' : '32px',
            height: isReply ? '28px' : '32px',
            borderRadius: '50%',
            backgroundColor: isReply ? '#E2E8F0' : '#1f2a56',
            color: isReply ? '#64748B' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isReply ? '11px' : '13px', fontWeight: 'bold',
            overflow: 'hidden'
          }}>
            {node.user?.avatar_url ? (
              <img src={node.user.avatar_url} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : (node.user?.name || node.user_name || 'U').charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...styles.commentBubble, backgroundColor: isReply ? 'rgba(0,0,0,0.02)' : '#FFFFFF', borderColor: '#E2E8F0' }}>
              {editingCommentId === node.id ? (
                <div>
                  <input style={{ ...styles.modalEditInput, backgroundColor: 'white', color: '#1E293B', borderColor: '#3B82F6' }} value={editCommentText} onChange={e => setEditCommentText(e.target.value)} autoFocus />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => setEditingCommentId(null)} style={{ ...styles.modalMiniBtn, backgroundColor: '#F1F5F9', color: '#64748B' }}>Cancel</button>
                    <button onClick={() => handleEditSave(node)} style={{ ...styles.modalMiniBtn, color: '#3B82F6', backgroundColor: '#F1F5F9' }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.commentUserRow}>
                    <span style={{ ...styles.commentUserName, color: '#1E293B' }}>{node.user?.name || node.user_name || 'User'}</span>
                    {node.user_id === currentUser?.id && (
                      <div style={styles.commentOptions}>
                        <button onClick={() => { setEditingCommentId(node.id); setEditCommentText(node.message); }} style={styles.btnIconTiny}><Icons.EditComment /></button>
                        <button onClick={() => handleDeleteComment(node.id)} style={styles.btnIconTiny}><Icons.Trash /></button>
                      </div>
                    )}
                  </div>
                  <p style={{ ...styles.commentText, fontSize: '13px', color: '#1E293B' }}>
                    {node.message.split(' ').map((word, i) => 
                      word.startsWith('@') ? <strong key={i} style={{ color: '#3B82F6' }}>{word} </strong> : word + ' '
                    )}
                  </p>
                </>
              )}
            </div>
            {!editingCommentId && (
              <div style={{ ...styles.commentActionsRow, marginTop: '4px', paddingLeft: '8px' }}>
                <button style={{ ...styles.commentReactBtn, color: node.user_reaction === true ? '#3B82F6' : '#64748B' }} onClick={() => handleReplyReaction(node.id, true)}><Icons.ThumbUp size={12}/> <span>{node.likes_count || ''}</span></button>
                <button style={{ ...styles.commentReactBtn, color: node.user_reaction === false ? '#EF4444' : '#64748B' }} onClick={() => handleReplyReaction(node.id, false)}><Icons.ThumbDown size={12}/> <span>{node.dislikes_count || ''}</span></button>
                <button style={{ ...styles.commentReplyLink, color: '#1f2a56' }} onClick={() => handleStartReply(node)}>Reply</button>
                <span style={styles.commentDate}>{formatDate(node.created_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.commentModalContent} onClick={e => e.stopPropagation()}>
        <header style={{ ...styles.commentModalHeader, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ ...styles.modalTitle, color: '#1E293B' }}>Community Discussion</h3>
            <span style={styles.modalSubtitle}>{item.title}</span>
          </div>
          <button onClick={onClose} style={{ ...styles.closeBtn, backgroundColor: '#F1F5F9', color: '#64748B' }}>✕</button>
        </header>

        <div style={{ ...styles.commentModalBody, backgroundColor: '#F8FAFC' }}>
          {/* Original Post with Reactions */}
          <div style={{ ...styles.originalPostSnippetExtended, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
            <div style={styles.snippetUserRow}>
              <div style={{ ...styles.snippetAvatar, backgroundColor: '#F1F5F9', color: '#1E293B', overflow: 'hidden' }}>
                {itemMeta.sender_avatar_url ? (
                  <img src={itemMeta.sender_avatar_url} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (itemMeta.user_name || 'U').charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...styles.snippetUser, color: '#1E293B' }}>{itemMeta.user_name || 'Anonymous'}</div>
                <div style={styles.snippetMeta}>{formatDate(itemMeta.created_at)}</div>
              </div>
              <div style={{ ...styles.ratingBadge, backgroundColor: '#FFF7ED', color: '#C2410C' }}>
                <Icons.Star filled={true} size={14} />
                <span>{itemMeta.rating || 0}/5</span>
              </div>
            </div>
            <p style={{ ...styles.snippetTextFull, color: '#1E293B' }}>{itemMeta.description || itemMeta.comment}</p>
            {/* Post-level Like / Dislike */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ ...styles.reactionBtn, backgroundColor: '#F1F5F9', color: '#1E293B' }} onClick={(e) => { e.stopPropagation(); handlePostReaction(true); }}>
                  <Icons.ThumbUp size={16} /> <span style={{ color: itemMeta.user_reaction === true ? '#3B82F6' : '#64748B' }}>{itemMeta.likes_count ?? itemMeta.likes ?? 0}</span>
                </button>
                <button style={{ ...styles.reactionBtn, backgroundColor: '#F1F5F9', color: '#1E293B' }} onClick={(e) => { e.stopPropagation(); handlePostReaction(false); }}>
                  <Icons.ThumbDown size={16} /> <span style={{ color: itemMeta.user_reaction === false ? '#EF4444' : '#64748B' }}>{itemMeta.dislikes_count ?? itemMeta.dislikes ?? 0}</span>
                </button>
              </div>
              <button
                style={{ ...styles.commentReplyLink, padding: '4px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#1f2a56' }}
                onClick={() => { setReplyingTo(null); document.getElementById('modal-comment-input')?.focus(); }}
              >Comment</button>
            </div>
          </div>

          <div style={styles.modalCommentsList}>
            {loading ? <p style={styles.emptyText}>Loading...</p> :
              comments.length === 0 ? <p style={styles.emptyText}>No comments yet. Be the first!</p> :
                comments.filter(c => !c.parent_id).map(parentComment => {
                  const thread = getAllRepliesForThread(comments, parentComment.id).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                  return (
                    <div key={parentComment.id} style={{ marginBottom: '16px' }}>
                      {renderThreadNode(parentComment, 0)}
                      {thread.length > 0 && (
                        <div style={{ marginLeft: '16px', borderLeft: '2px solid #E2E8F0', paddingLeft: '8px' }}>
                          {thread.map(reply => renderThreadNode(reply, 1))}
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </div>
        </div>

        <div style={{ ...styles.commentModalFooter, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          {replyingTo && (
            <div style={{ ...styles.replyingToNotice, backgroundColor: '#F1F5F9', color: '#64748B' }}>
              Replying to <strong style={{ color: '#1E293B' }}>{replyingTo.name}</strong>
              <button onClick={() => setReplyingTo(null)} style={styles.cancelReplyBtn}>X</button>
            </div>
          )}
          <div style={styles.modalInputWrapper}>
            <input
              id="modal-comment-input"
              style={{ ...styles.modalCommentInput, backgroundColor: '#F1F5F9', color: '#1E293B' }}
              placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a comment..."}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePostComment()}
            />
            <button style={{ ...styles.modalSendBtn, backgroundColor: '#1f2a56' }} onClick={handlePostComment}>
              Post
            </button>
          </div>
        </div>
      </div>
      {fullscreenImg && (
        <div style={styles.imageModal} onClick={() => setFullscreenImg(null)}>
          <img src={fullscreenImg} style={styles.modalImg} alt="Fullscreen View" />
        </div>
      )}

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
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
         ' at ' + 
         date.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
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

const FeedCard = ({ item: initialItem, currentUser, onShowToast, onOpenComments, setFullscreenImg, onRefresh }) => {
  const [dialogState, setDialogState] = useState({ isOpen: false });
  const [item, setItem] = useState(initialItem);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  
  // Edit & Delete state
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title || "");
  const [editDesc, setEditDesc] = useState(item.description || "");

  useEffect(() => { setItem(initialItem); }, [initialItem]);



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
      // Refresh counts locally and in parent feed for trending
      const data = await getReactionsSummary(item.id, currentUser?.id);
      setLikes(data.likes || 0);
      setDislikes(data.dislikes || 0);
      setUserReaction(data.user_reaction ?? null);
      if (onRefresh) onRefresh(true);
    } catch (err) {
      console.error("Reaction failed", err);
    }
  };

  const isAnonymous = item.is_anonymous;
  const avatarText = isAnonymous ? "?" : (item.user_name || item.sender_name || 'U').charAt(0).toUpperCase();

  const categoryColorMap = {
    1: '#3B82F6',
    2: '#1f2a56',
    3: '#64748B'
  };
  const markerColor = categoryColorMap[item.category_id] || '#64748B';

  const getEmotion = (rating) => {
    if (rating === 5) return "🤩 ecstatic";
    if (rating === 4) return "😊 happy";
    if (rating === 3) return "😐 neutral";
    if (rating === 2) return "😕 disappointed";
    if (rating === 1) return "😠 angry";
    return "";
  };

  const getEstablishmentName = () => {
    if (item.title && item.title.includes(":")) {
      return item.title.split(":")[1].trim();
    }
    return item.recipient_dept_name || 'General';
  };

  const emotion = getEmotion(item.rating);
  const establishmentName = getEstablishmentName();
  const locationText = (item.region || item.city || item.barangay) ? `${[item.barangay, item.city, item.region].filter(Boolean).join(', ')}` : '';
  const senderName = item.is_anonymous ? 'Anonymous' : (item.user_name || 'Anonymous');
  const isOwner = currentUser && item.sender_id === currentUser.id;

  const handleDelete = async () => {
    setDialogState({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This cannot be undone.',
      type: 'alert',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteFeedback(item.id);
          if(onRefresh) onRefresh();
          onShowToast("Post deleted successfully");
        } catch(e) { console.error(e); }
        setDialogState({ isOpen: false });
      },
      onCancel: () => setDialogState({ isOpen: false })
    });
  };

  const handleUpdate = async () => {
    try {
      const updated = await updateFeedback(item.id, { title: editTitle, description: editDesc });
      setItem(updated);
      setIsEditing(false);
      onShowToast("Post updated");
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{ ...styles.feedCard, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderLeft: `5px solid ${markerColor}` }}>
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
      <div style={styles.cardHeader}>
        {item.is_anonymous || !item.sender_avatar_url ? (
          <div style={{ ...styles.cardAvatar, backgroundColor: '#F1F5F9', color: '#1E293B' }}>{(item.user_name || 'U').charAt(0)}</div>
        ) : (
          <img
            src={item.sender_avatar_url}
            alt={item.user_name}
            style={{ ...styles.cardAvatar, objectFit: 'cover', border: '2px solid #E2E8F0' }}
          />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={styles.fbSenderRow}>
            <span style={{ ...styles.cardSender, color: '#1E293B' }}>{senderName}</span>
            {emotion ? (
              <span style={{color: '#64748B'}}> is feeling {emotion} at <span style={{fontWeight: '600', color: '#1E293B'}}>{establishmentName}</span></span>
            ) : (
              <span style={{color: '#64748B'}}> reported about <span style={{fontWeight: '600', color: '#1E293B'}}>{establishmentName}</span></span>
            )}
          </div>
          <div style={{ ...styles.cardMeta, color: '#64748B' }}>{timeAgo(item.created_at)} {locationText && ` • ${locationText}`}</div>
        </div>
        {item.status && item.status !== 'Open' && item.status !== 'OPEN' && (
          <div style={{ ...styles.statusBadge, backgroundColor: getStatusColor(item.status), marginLeft: 'auto' }}>
            {item.status}
          </div>
        )}
        <div style={{ position: 'relative', marginLeft: item.status !== 'Open' ? '6px' : 'auto' }}>
           <button 
             onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748B' }}
           >
             ⋮
           </button>
           {showOptions && (
              <div style={{ position: 'absolute', right: 0, top: '100%', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10 }}>
                 {isOwner ? (
                   <>
                     <button onClick={() => { setIsEditing(true); setShowOptions(false); setEditTitle(item.title); setEditDesc(item.description); }} style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #E2E8F0', color: '#1E293B' }}>Edit</button>
                     <button onClick={() => { setShowOptions(false); handleDelete(); }} style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#EF4444' }}>Delete</button>
                   </>
                 ) : (
                   <button onClick={() => { setShowOptions(false); onShowToast("Post reported. Thank you."); }} style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#EF4444', minWidth: '100px' }}>Report</button>
                 )}
              </div>
           )}
        </div>
      </div>

      {/* RATING ROW */}
      <div style={styles.cardRatingRow}>
        {[1, 2, 3, 4, 5].map(s => (
          <Icons.Star key={s} filled={s <= (item.rating || 0)} size={12} />
        ))}
        <span style={{fontSize: '11px', color: '#64748B', marginLeft: '4px'}}>{item.rating || 0}/5</span>
      </div>

      {/* DETAIL METADATA — product/staff only (address shown in header) */}
      <div style={styles.metaGrid}>
        {item.product_name && (
          <div style={styles.metaItem}>
            <span style={styles.metaIcon}>🛍️</span>
            <span style={{ ...styles.metaText, color: '#64748B' }}>{item.product_name}</span>
          </div>
        )}
        {item.employee_name && (
          <div style={styles.metaItem}>
            <span style={styles.metaIcon}>👤</span>
            <span style={{ ...styles.metaText, color: '#64748B' }}>Staff: {item.employee_name}</span>
          </div>
        )}
      </div>

      {isEditing ? (
        <div style={{ marginBottom: '12px' }}>
           <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#1E293B', borderRadius: '4px' }} placeholder="Title" />
           <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ width: '100%', padding: '8px', minHeight: '60px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#1E293B', borderRadius: '4px' }} placeholder="Description" />
           <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setIsEditing(false)} style={{ padding: '6px 12px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleUpdate} style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
           </div>
        </div>
      ) : (
        <p style={{ ...styles.cardText, color: '#1E293B' }}>
          {(item.description || '').substring(0, 200) + ((item.description || '').length > 200 ? '...' : '')}
        </p>
      )}

      {/* ATTACHMENTS GRID */}
      {item.attachments && (
        <div style={styles.feedImages}>
          {(() => {
            try {
              const files = JSON.parse(item.attachments);
              return files.map((src, idx) => (
                <img 
                  key={idx} 
                  src={src} 
                  alt={`Attachment ${idx}`} 
                  style={styles.feedImg} 
                  onClick={(e) => { e.stopPropagation(); setFullscreenImg(src); }}
                />
              ));
            } catch (e) { return null; }
          })()}
        </div>
      )}



      <div style={{ ...styles.fbActionRow, borderTop: '1px solid #E2E8F0' }}>
        <button
          style={{ ...styles.fbActionBtn, color: userReaction === true ? '#3B82F6' : '#64748B' }}
          onClick={() => handleReact(true)}
        >
          <Icons.ThumbUp />{likes > 0 ? <span style={styles.actionCount}>{likes}</span> : null}
        </button>

        <button
          style={{ ...styles.fbActionBtn, color: userReaction === false ? '#EF4444' : '#65676B' }}
          onClick={() => handleReact(false)}
        >
          <Icons.ThumbDown />{dislikes > 0 ? <span style={styles.actionCount}>{dislikes}</span> : null}
        </button>

        <button style={styles.fbActionBtn} onClick={() => onOpenComments(item)}>
          <Icons.Message />
          <span>Comment</span>
          {item.replies_count > 0 ? <span style={styles.actionCount}>{item.replies_count}</span> : null}
        </button>
      </div>
    </div>
  );
};

const DashboardView = ({ feed, loading, onAction, currentUser, onShowToast, onOpenComments, onRefresh, publicFeedEnabled, categories, setFullscreenImg }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [isTrendingExpanded, setIsTrendingExpanded] = useState(false);
  const [searchDash, setSearchDash] = useState("");

  const getTabIcon = (catName) => {
    const name = (catName || "").toLowerCase();
    if (name.includes('dept') || name.includes('department')) return <Icons.Building />;
    if (name.includes('food')) return <Icons.Food />;
    if (name.includes('cosmetic') || name.includes('beauty')) return <Icons.Cosmetics />;
    if (name.includes('furniture')) return <Icons.Furniture />;
    if (name.includes('car') || name.includes('transport')) return <Icons.Car />;
    if (name.includes('resort')) return <Icons.Resort />;
    if (name.includes('hotel')) return <Icons.Hotel />;
    return <Icons.Message />;
  };

  const tabs = [
    { id: 'All', label: 'All', icon: <Icons.History /> },
    ...(categories || []).map(cat => ({
      id: cat.name,
      label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      icon: getTabIcon(cat.name)
    }))
  ];

  const filteredFeed = feed.filter(item => {
    // Tab Filter
    const catName = (item.category_name || "").toLowerCase();
    const deptName = (item.dept_name || "").toLowerCase();
    const activeLower = activeTab.toLowerCase();
    
    let matchesTab = false;
    if (activeTab === 'All') matchesTab = true;
    else if (catName === activeLower) matchesTab = true;
    else if (activeLower === 'dept' && (catName.includes('dept') || catName.includes('department') || deptName)) matchesTab = true;
    
    if (!matchesTab) return false;

    // Search Filter
    if (searchDash) {
      const q = searchDash.toLowerCase();
      const searchableStr = `${item.title} ${item.description} ${item.product_name || ""} ${item.employee_name || ""} ${item.establishment_name || ""}`.toLowerCase();
      return searchableStr.includes(q);
    }
    return true;
  });

  const trendingItems = [...feed]
    .filter(item => (item.replies_count > 0) || (item.likes_count > 0))
    .sort((a, b) => ((b.replies_count || 0) * 2 + (b.likes_count || 0)) - ((a.replies_count || 0) * 2 + (a.likes_count || 0)))
    .slice(0, 3);


  const level = calculateLevel(currentUser?.impact_points || 0);

  return (
    <div style={{ ...styles.fadeIn, display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1000px', margin: '0 auto', width: '100%', overflow: 'hidden' }}>
      
      {/* FIXED TOP SECTION */}
      <div style={{ flexShrink: 0, paddingBottom: '8px' }}>
        <section style={{ ...styles.actionGridSingle, marginBottom: '12px', marginTop: '12px' }}>
          <button style={{ ...styles.primaryAction, backgroundColor: '#2563EB', color: 'white' }} onClick={() => onAction("category_selection")}>
            <div style={{ ...styles.actionIconBg, color: '#2563EB', backgroundColor: 'white' }}>
              <Icons.Plus />
            </div>
            <span style={{ ...styles.actionText, color: 'white' }}>New Report</span>
          </button>
        </section>

        {/* TRENDING WIDGET */}
        <section style={{ marginBottom: '8px', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '12px 16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              TRENDING THIS WEEK
            </h3>
            
            {trendingItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(isTrendingExpanded ? trendingItems : trendingItems.slice(0, 1)).map((item, index) => {
                  const iconColor = index === 0 ? '#4F46E5' : '#E2E8F0';
                  const textColor = index === 0 ? 'white' : '#475569';
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                      <div style={{ width: '20px', height: '20px', backgroundColor: iconColor, color: textColor, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px', marginRight: '10px', flexShrink: 0 }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 1px 0', fontSize: '12px', fontWeight: 'bold', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </p>
                        <p style={{ margin: 0, fontSize: '10px', color: '#64748B' }}>
                          {item.replies_count || 0} Replies • {item.likes_count || 0} Likes
                        </p>
                      </div>
                    </div>
                  );
                })}
                {trendingItems.length > 1 && (
                  <button 
                    onClick={() => setIsTrendingExpanded(!isTrendingExpanded)}
                    style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '4px 0', textAlign: 'center', width: '100%' }}
                  >
                    {isTrendingExpanded ? 'View Less' : `View Top ${trendingItems.length} Trending`}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #E2E8F0' }}>
                <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>No trending posts yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%', maxWidth: '700px', margin: '0 auto' }}>
        
        {/* RECENT ACTIVITY: Main Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={styles.feedHeader}>
            <h3 style={styles.sectionTitle}>Recent Activity</h3>
          </div>

          <div
            ref={el => {
              if (!el) return;
              let isDown = false, startX = 0, scrollLeft = 0;
              el.onmousedown = (e) => { isDown = true; el.style.cursor = 'grabbing'; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; };
              el.onmouseleave = () => { isDown = false; el.style.cursor = 'grab'; };
              el.onmouseup = () => { isDown = false; el.style.cursor = 'grab'; };
              el.onmousemove = (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = scrollLeft - (x - startX) * 1.5; };
            }}
            style={styles.feedTabsRow}
          >
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.feedTabBtn,
                  backgroundColor: activeTab === tab.id ? '#DBEAFE' : '#F1F5F9',
                  color: activeTab === tab.id ? '#1D4ED8' : '#64748B',
                  fontWeight: activeTab === tab.id ? 'bold' : '600'
                }}
              >
                <div style={{width: 14, height: 14}}>{tab.icon}</div>
                <span style={{fontSize: '11px'}}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* SEARCH BOX BELOW TABS */}
          <div style={{ padding: '0 8px', marginBottom: '12px', marginTop: '4px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search establishments or services..."
                value={searchDash}
                onChange={(e) => setSearchDash(e.target.value)}
                style={{
                  width: '100%', padding: '10px 10px 10px 36px', backgroundColor: 'white',
                  border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px',
                  outline: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
              />
            </div>
          </div>

          <section style={{ ...styles.feedList, flex: 1, overflowY: 'auto', paddingBottom: '20px', border: '1px solid #E2E8F0', borderRadius: '12px', minHeight: '400px', backgroundColor: publicFeedEnabled ? 'transparent' : 'white' }}>
            {!publicFeedEnabled ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3 style={{ color: '#1f2a56', margin: '0 0 8px 0' }}>Feed Restricted</h3>
                <p style={{ color: '#64748B', fontSize: '13px', margin: 0, maxWidth: '250px', marginLeft: 'auto', marginRight: 'auto' }}>The community feed has been set to private by the administrator.</p>
              </div>
            ) : (
              <>
                {loading ? (
                  <p style={styles.emptyText}>Loading feed...</p>
                ) : filteredFeed.length > 0 ? (
                  filteredFeed.map(item => (
                    <FeedCard key={item.id} item={item} currentUser={currentUser} onShowToast={onShowToast} onOpenComments={onOpenComments} onRefresh={onRefresh} setFullscreenImg={setFullscreenImg} />
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyText}>No activity found in this category.</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

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
  layoutCenter: { maxWidth: '700px', margin: '0 auto', width: '100%' },
  welcomeSection: { marginBottom: '12px', maxWidth: '700px', margin: '0 auto', width: '100%' },
  greeting: { fontSize: '16px', fontWeight: '800', background: '-webkit-linear-gradient(45deg, #1f2a56, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subGreeting: { fontSize: '12px', color: '#64748B' },
  actionGridSingle: { marginBottom: '12px', maxWidth: '700px', margin: '0 auto', width: '100%' },
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
    maxWidth: '700px', margin: '0 auto', width: '100%'
  },
  feedList: { display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px 0', maxWidth: '700px', margin: '0 auto', width: '100%' },
  feedScroll: { flex: 1, overflowY: 'auto', padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px' },
  feedCard: { backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '8px 12px', border: '1px solid #F1F5F9', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', marginBottom: '0px' },

  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  cardAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F1F5F9', color: '#1f2a56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  cardSender: { fontSize: '13px', fontWeight: '700', color: '#1C1E21' },
  cardMeta: { fontSize: '11px', color: '#65676B' },
  statusBadge: { padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'white' },

  cardSubjectRow: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' },
  cardSubject: { fontSize: '13px', fontWeight: '800', color: '#1f2a56' },
  cardDept: { fontSize: '10px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' },
  cardRatingRow: { display: 'flex', gap: '2px', marginBottom: '4px', alignItems: 'center' },

  cardText: { fontSize: '13px', color: '#1C1E21', lineHeight: '1.4', margin: '2px 0 4px 0' },

  fbSenderRow: { fontSize: '13px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', marginBottom: '2px' },
  fbActionRow: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid #F0F2F5', padding: '0', marginTop: '0' },
  fbActionBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', flex: 1, justifyContent: 'center', borderRadius: '4px', transition: 'background-color 0.2s', fontSize: '12px', color: '#65676B' },
  actionCount: { fontSize: '12px', fontWeight: '600', marginLeft: '2px' },

  feedImages: { display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto', padding: '4px 0', marginBottom: '8px', scrollbarWidth: 'none' },
  feedImg: { height: '80px', minWidth: '80px', maxWidth: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'zoom-in' },

  imageModal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' },
  modalImg: { maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: '8px' },
  feedTabsRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'scroll',
    paddingBottom: '8px',
    marginBottom: '8px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    cursor: 'grab',
    flexShrink: 0,
    userSelect: 'none',
    minWidth: 0,
    width: '100%',
  },
  feedTabBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', border: 'none', borderRadius: '16px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 0.2s', flexShrink: 0 },

  metaGrid: { display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' },
  metaItem: { display: 'flex', alignItems: 'flex-start', gap: '5px' },
  metaIcon: { fontSize: '11px', flexShrink: 0, marginTop: '1px' },
  metaText: { fontSize: '11px', color: '#65676B', lineHeight: '1.3' },

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
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease-in-out' },
  menuContent: { width: '280px', height: '100%', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.3)', animation: 'slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' },
  menuHeader: { padding: '50px 24px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  avatarLarge: { width: '64px', height: '64px', borderRadius: '22px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '2px solid rgba(255,255,255,0.2)', marginBottom: '16px', color: 'white' },
  userName: { margin: 0, color: 'white', fontWeight: 'bold' },
  userRole: { margin: 0, color: '#94A3B8', fontSize: '13px', marginTop: '4px' },
  menuLinks: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' },
  menuLink: { background: 'none', border: 'none', textAlign: 'left', padding: '14px 16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', borderRadius: '12px', transition: 'background-color 0.2s', ':hover': { backgroundColor: 'rgba(255,255,255,0.05)' } },
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
  feedList: { display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: '14px', width: '100%', margin: '40px 0' }
};

const BroadcastViewModal = ({ notif, onClose }) => {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.commentModalContent, maxWidth: '500px', height: 'auto', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <header style={{ ...styles.commentModalHeader, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <div style={{ padding: '10px', background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', borderRadius: '12px', color: '#92400E' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
               <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{notif.subject || 'System Announcement'}</h3>
               <span style={{ fontSize: '11px', color: '#64748B' }}>Posted by GlobalCore Admin</span>
             </div>
          </div>
          <button onClick={onClose} style={{ ...styles.closeBtn, backgroundColor: '#F1F5F9', color: '#64748B' }}>✕</button>
        </header>
        <div style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
           <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap' }}>
             {notif.message}
           </p>
           <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dotted #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={onClose} 
                style={{ ...styles.modalSendBtn, backgroundColor: '#1f2a56', width: 'auto', padding: '10px 24px' }}
              >Confirm</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackHub;