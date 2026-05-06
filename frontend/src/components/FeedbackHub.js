import React, { useState, useEffect, useRef } from "react";
import { STORAGE_KEYS } from "../utils/storage";
import { logoutUser } from "../utils/auth";
import {
  formatLocation,
  formatFeedbackDate,
  renderFeedbackAction,
  formatMentions
} from "../utils/feedback";
import ProfileSettings from './ProfileSettings';
import HistoryView from './HistoryView';
import DraftsView from './DraftsView';
import NotificationsView from './NotificationsView';
import CustomModal from './CustomModal';
import GeneralFeedback from './GeneralFeedback';
import ActivityView from './ActivityView';
import { getFeedbacks, getUserById, getUserNotifications, getFeedbackReplies, createFeedbackReply, updateFeedbackReply, deleteFeedbackReply, toggleReaction, toggleReplyReaction, getReactionsSummary, markNotificationAsRead, updateFeedback, deleteFeedback, getAdminSettings, getEntities, trackBroadcastView, acknowledgeBroadcast, updateUserPresence } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";
import { IconRegistry } from "./IconRegistry";

const Icons = {
  CheckCircle: ({ size = 16, color = "currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
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
  TrendingDownGood: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>,
  Lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Tag: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
};


const FeedbackHub = React.memo(({ currentUser, onLogout }) => {
  const { getLabel, systemName, systemLogo } = useTerminology();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState(localStorage.getItem("userView") || "home");
  const [feed, setFeed] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [prevView, setPrevView] = useState("home");
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState('general');
  const [dialogState, setDialogState] = useState({ isOpen: false });
  const [notifications, setNotifications] = useState([]);
  // hasUnreadNotifications setter not needed currently

  const [commentingFeedback, setCommentingFeedback] = useState(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [fullscreenImg, setFullscreenImg] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ONGOING');
  const [resumeDraft, setResumeDraft] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [localUser, setLocalUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_CURRENT) || 'null') || currentUser; }
    catch { return currentUser; }
  });

  // Keep localUser in sync with prop from App.js
  useEffect(() => {
    if (currentUser) {
      setLocalUser(currentUser);
    }
  }, [currentUser]);

  const [publicFeedEnabled, setPublicFeedEnabled] = useState(true);
  const [entities, setEntities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ents = await getEntities();
        setEntities(ents);
      } catch (e) { console.error("Error fetching entities", e); }

      try {
        const settings = await getAdminSettings();
        const found = settings.find(s => s.key === 'public_feed');
        if (found) setPublicFeedEnabled(found.value === 'true');
      } catch (e) { console.error("Error fetching initial data", e); }
    };
    fetchData();
  }, []);

  const handleUserUpdate = (updatedUser) => {
    setLocalUser((prev) => {
      const merged = { ...(prev || {}), ...(updatedUser || {}) };

      try {
        localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(merged));
      } catch (err) {
        if (err.name === 'QuotaExceededError') {
          console.warn("FeedbackHub: Storage quota exceeded. Saving stripped profile.");
          const stripped = { ...merged };
          delete stripped.avatar_url;
          localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(stripped));
        }
      }

      return merged;
    });
  };

  const fetchFeed = React.useCallback(async (newOffset = 0) => {
    if (newOffset === 0) setLoading(true);
    try {
      const data = await getFeedbacks({ skip: newOffset, limit: 10, status: statusFilter });
      if (newOffset === 0) {
        setFeed(data);
      } else {
        setFeed(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 10);
      setOffset(newOffset);
    } catch (err) {
      setDialogState({ isOpen: true, title: "Feed Error", message: "Failed to load activity feed.", type: "alert" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadMoreFeed = () => {
    if (!loading && hasMore) {
      fetchFeed(offset + 10);
    }
  };

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchNotifications = React.useCallback(async () => {
    if (!localUser?.id) return;
    try {
      const data = await getUserNotifications(localUser.id);
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadNotifCount(unread);
    } catch (e) { console.error("Could not fetch notifications", e); }
  }, [localUser?.id]);

  useEffect(() => {
    if (!localUser?.id) return;

    fetchNotifications();
    fetchFeed(0);

    const sseUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/notifications/stream/${localUser.id}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      if (event.data === "new_notification") {
        setUnreadNotifCount(prev => prev + 1);
        fetchNotifications();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [localUser?.id, fetchNotifications, fetchFeed]);

  const handleOpenNotifications = async () => {
    if (view === "notifications") {
      setView(prevView);
      return;
    }
    setPrevView(view);
    setView("notifications");
    setIsMenuOpen(false);
  };

  const fetchUserProfile = React.useCallback(async () => {
    if (!localUser?.id) return;
    try {
      const updated = await getUserById(localUser.id);
      handleUserUpdate(updated);
    } catch (e) { console.error("Could not refresh user profile", e); }
  }, [localUser?.id]); // handleUserUpdate is stable if defined correctly, but here it's a regular function

  useEffect(() => {
    try {
      localStorage.setItem("userView", view);
    } catch (e) { console.warn("Could not save userView", e); }
    if (view === "home") {
      fetchFeed(0);
      fetchNotifications();
      fetchUserProfile();
    }
  }, [view, fetchFeed, fetchNotifications, fetchUserProfile]);

  // Real-time Presence Heartbeat
  useEffect(() => {
    if (!localUser?.id) return;

    const updatePresence = () => {
      const ACTION_MAP = {
        home: "Browsing Dashboard",
        history: "Reviewing History",
        mentioned: "Checking Mentions",
        drafts: "Managing Drafts",
        activity: "Viewing Activity Feed",
        notifications: "Reading Notifications",
        profile: "Updating Profile",
        notifs_settings: "Configuring Notifications",
        privacy: "Managing Security"
      };
      const moduleName = ACTION_MAP[view] || "Active in Portal";
      updateUserPresence(localUser.id, moduleName).catch(err => console.debug("Presence sync failed", err));
    };

    updatePresence(); // Initial
    const presenceInterval = setInterval(updatePresence, 45000); // Every 45 seconds

    return () => clearInterval(presenceInterval);
  }, [localUser?.id, view]);

  const navigateTo = (newView) => {
    setView(newView);
    setIsMenuOpen(false);
  };

  const handleSecureLogout = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_CURRENT);
      const userObj = saved ? JSON.parse(saved) : null;
      const token = userObj?.token;
      if (token) {
        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/logout`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      }
    } catch (e) { console.error(e); }
    finally {
      if (onLogout) onLogout();
      else logoutUser();
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

  const showToast = React.useCallback((message, isError = false) => {
    setToastMessage({ text: message, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const showSuccessModal = React.useCallback((message) => {
    setIsReportModalOpen(false);
    showToast(message || "Submitted Confirmed");
    fetchFeed(0);
    fetchUserProfile();
  }, [showToast, fetchFeed, fetchUserProfile]);

  const handleCloseReportModal = React.useCallback(() => {
    setIsReportModalOpen(false);
    setResumeDraft(null);
  }, []);

  const handleGeneralSuccess = React.useCallback(() => {
    showSuccessModal("Your suggestions have been submitted.");
    setResumeDraft(null);
    fetchUserProfile();
  }, [showSuccessModal, fetchUserProfile]);

  const handleSaveDraft = React.useCallback(() => {
    setIsReportModalOpen(false);
    setResumeDraft(null);
  }, []);

  const handleClearDraft = React.useCallback(() => {
    setResumeDraft(null);
  }, []);

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: <Icons.Building /> },
    {
      id: 'feedback_group',
      label: `My ${getLabel("feedback_label", "Feedback")}`,
      icon: <Icons.Inbox />,
      subItems: [
        { id: 'history', label: 'Sent', icon: <Icons.User /> },
        { id: 'mentioned', label: 'Mentions', icon: <Icons.Tag /> },
        { id: 'drafts', label: 'Drafts', icon: <Icons.Message /> },
        { id: 'activity', label: 'Interaction Activity', icon: <Icons.Activity /> }
      ]
    },
    {
      id: 'settings_group', label: 'Settings', icon: <Icons.Gear />, subItems: [
        { id: 'profile', label: 'Personal Details', icon: <Icons.User /> },
        { id: 'notifs_settings', label: 'Notification Preferences', icon: <Icons.Bell /> },
        { id: 'privacy', label: 'Security', icon: <Icons.Lock /> }
      ]
    },
    { id: 'logout', label: 'Logout', icon: <Icons.Logout />, color: '#EF4444', action: triggerLogout },
  ];

  return (
    <div style={{ ...styles.hubContainer, backgroundColor: '#F8FAFC', color: '#1E293B' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fab-btn:hover {
          transform: scale(1.1) !important;
          background-color: var(--primary-color) !important;
          box-shadow: 0 12px 24px rgba(var(--primary-rgb), 0.4) !important;
        }
        .fab-btn:active { transform: scale(0.95) !important; }
      `}</style>
      <header style={{ ...styles.header, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <button onClick={() => setIsMenuOpen(true)} style={styles.iconBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="18" y2="6"></line>
            <line x1="3" y1="18" x2="15" y2="18"></line>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, justifyContent: 'center' }}>
          {systemLogo && (
            <img src={systemLogo} alt="Logo" style={{ height: '40px', maxWidth: '120px', objectFit: 'contain' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ ...styles.headerTitle, color: 'var(--primary-color)', fontSize: '16px', fontWeight: '800', lineHeight: 1.2 }}>{systemName}</span>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500', letterSpacing: '0.01em' }}>
              Official Feedback Portal
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={handleOpenNotifications} style={{ ...styles.iconBtn, color: 'var(--primary-color)' }} title="Notifications">
            <Icons.Bell />
            {unreadNotifCount > 0 && (
              <div style={{ ...styles.notifDot, backgroundColor: '#EF4444', width: '16px', height: '16px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '2px solid #FFFFFF', top: -4, right: -4 }}>
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Live date/time bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '5px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8' }}>
          {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <span style={{ fontSize: '9px', color: '#CBD5E1' }}>•</span>
        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.02em' }}>
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </span>
        <span style={{ fontSize: '9px', color: '#CBD5E1' }}>•</span>
        <span style={{ fontSize: '10px', fontWeight: '600', color: '#94A3B8' }}>Manila (GMT+8)</span>
      </div>

      <main style={styles.mainScroll}>
        {view === "home" ? (
          <DashboardView
            feed={feed}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMoreFeed}
            onAction={() => { setIsReportModalOpen(true); setReportStep('general'); }}
            currentUser={localUser}
            onShowToast={showToast}
            onOpenComments={(f) => setCommentingFeedback(f)}
            setFullscreenImg={setFullscreenImg}
            onRefresh={() => fetchFeed(0)}
            publicFeedEnabled={publicFeedEnabled}
            entities={entities}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        ) : (view === "history" || view === "mentioned") ? (
          <HistoryView
            currentUser={localUser}
            mode={view}
            onBack={() => { setView("home"); setIsMenuOpen(true); }}
          />
        ) : view === "drafts" ? (
          <DraftsView
            currentUser={localUser}
            onBack={() => { setView("home"); setIsMenuOpen(true); }}
          />
        ) : view === "activity" ? (
          <ActivityView
            currentUser={localUser}
            onBack={() => { setView("home"); setIsMenuOpen(true); }}
            onViewPost={async (feedbackId) => {
              let post = feed.find(f => f.id === feedbackId);
              if (!post) {
                try {
                  const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/feedbacks/${feedbackId}`);
                  if (res.ok) post = await res.json();
                } catch (e) { console.error(e); }
              }
              if (post) setCommentingFeedback(post);
            }}
          />
        ) : view === "notifications" ? (
          <NotificationsView
            currentUser={localUser}
            notifications={notifications}
            onBack={() => setView("home")}
            onRead={() => setUnreadNotifCount(0)}
            onOpenComment={async (n) => {
              // Mark this single notification as read when clicked
              if (!n.is_read) {
                try {
                  await markNotificationAsRead(n.id);
                  setNotifications(prev => prev.map(notif =>
                    notif.id === n.id ? { ...notif, is_read: true } : notif
                  ));
                  setUnreadNotifCount(prev => Math.max(0, prev - 1));
                } catch (e) { console.error("Could not mark notif as read", e); }
              }

              if (n.type && n.type.toLowerCase() === 'announcement') {
                setSelectedBroadcast(n);
                // Track view if it's a broadcast
                if (n.broadcast_id) {
                  try {
                    await trackBroadcastView(localUser.id, n.broadcast_id);
                  } catch (e) { console.error("Could not track broadcast view", e); }
                }
                return;
              }
              let post = feed.find(f => f.id === n.feedback_id);
              if (!post) {
                try {
                  const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/feedbacks/${n.feedback_id}`);
                  if (res.ok) post = await res.json();
                } catch (e) { console.error(e); }
              }
              if (post) setCommentingFeedback(post);
            }}
          />
        ) : (view === "profile" || view === "notifs_settings" || view === "privacy") ? (
          <ProfileSettings
            currentUser={localUser}
            onBack={() => { setView("home"); setIsMenuOpen(true); }}
            onLogout={onLogout}
            onUserUpdate={handleUserUpdate}
            initialSubView={view === "profile" ? "personal_info" : view === "privacy" ? "privacy" : "notifs"}
          />
        ) : null}
      </main>

      {/* Side Menu */}
      {isMenuOpen && (
        <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
          <div style={styles.menuContent} onClick={e => e.stopPropagation()}>
            <div style={{ ...styles.menuHeader, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigateTo('profile')}>
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

              {/* COMPACT IMPACT MINI-STATS */}
              <div style={{
                marginTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 'var(--size-nav, 12px)', fontWeight: '900', color: '#FCD34D' }}>{(localUser?.impact_points || 0).toFixed(0)}</p>
                  <p style={{ margin: 0, fontSize: 'var(--size-chip, 7px)', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>PTS</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 'var(--size-nav, 12px)', fontWeight: '900', color: 'white' }}>{localUser?.posts_count || 0}</p>
                  <p style={{ margin: 0, fontSize: 'var(--size-chip, 7px)', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>POSTS</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 'var(--size-nav, 12px)', fontWeight: '900', color: 'white' }}>{localUser?.likes_received || 0}</p>
                  <p style={{ margin: 0, fontSize: 'var(--size-chip, 7px)', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>LIKES</p>
                </div>
              </div>
            </div>
            <nav style={styles.menuLinks}>
              {menuItems.map((item, idx) => {
                if (item.type === 'label') {
                  return (
                    <div key={`label-${idx}`} style={{
                      fontSize: 'var(--size-chip, 11px)', fontWeight: '800', color: 'rgba(255,255,255,0.4)',
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
                        backgroundColor: (isActive && !item.subItems) ? 'var(--primary-color)' : 'transparent',
                        color: (isActive && !item.subItems) ? 'white' : (item.color || 'rgba(255, 255, 255, 0.8)'),
                        display: 'flex', alignItems: 'center', gap: '12px', width: '100%'
                      }}
                      onClick={() => {
                        if (item.subItems) {
                          if (item.id === 'feedback_group') setIsFeedbackExpanded(!isFeedbackExpanded);
                          if (item.id === 'settings_group') setIsSettingsExpanded(!isSettingsExpanded);
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
                          {(item.id === 'feedback_group' ? isFeedbackExpanded : isSettingsExpanded) ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          )}
                        </span>
                      )}
                    </button>

                    {item.subItems && (item.id === 'feedback_group' ? isFeedbackExpanded : isSettingsExpanded) && (
                      <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                        {item.subItems.map(sub => {
                          const isSubActive = view === sub.id;
                          return (
                            <button
                              key={sub.id}
                              style={{
                                ...styles.menuLink,
                                fontSize: 'var(--size-nav, 14px)',
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
                currentUser={localUser}
                entities={entities}
                resumeDraft={resumeDraft}
                onClearDraft={handleClearDraft}
                onBack={handleCloseReportModal}
                onSuccess={handleGeneralSuccess}
                onSaveDraft={handleSaveDraft}
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
        <div style={{ ...styles.toastModal, backgroundColor: toastMessage.isError ? '#EF4444' : 'var(--primary-color)' }}>
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
          onRefreshFeed={() => fetchFeed(0)}
        />
      )}

      {selectedBroadcast && (
        <BroadcastViewModal
          notif={selectedBroadcast}
          currentUser={localUser}
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
});

const CommentModal = ({ item, currentUser, onClose, onShowToast, onRefreshProfile, onRefreshFeed }) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const { getModeLabel } = useTerminology();
  const [dialogState, setDialogState] = useState({ isOpen: false });
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // { id, name }
  const [itemMeta, setItemMeta] = useState(item);
  // expandedThreads managed via setExpandedThreads only
  // Expanded threads management removed (unused)
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (!loading && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [loading]);


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
      await toggleReplyReaction(item.id, replyId, currentUser?.id || 1, isLike);
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
            backgroundColor: isReply ? '#E2E8F0' : 'var(--primary-color)',
            color: isReply ? '#64748B' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isReply ? '11px' : '13px', fontWeight: 'bold',
            overflow: 'hidden'
          }}>
            {node.user?.avatar_url ? (
              <img src={node.user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (node.user?.name || node.user_name || 'U').charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              ...styles.commentBubble,
              backgroundColor: node.is_official ? 'rgba(79, 70, 229, 0.03)' : (isReply ? 'rgba(0,0,0,0.02)' : '#FFFFFF'),
              borderColor: node.is_official ? '#4F46E5' : '#E2E8F0',
              borderLeft: node.is_official ? '4px solid #4F46E5' : '1px solid #E2E8F0',
              boxShadow: node.is_official ? '0 2px 10px rgba(79, 70, 229, 0.08)' : 'none'
            }}>
              {editingCommentId === node.id ? (
                <div>
                  <input style={{ ...styles.modalEditInput, backgroundColor: 'white', color: '#1E293B', borderColor: '#4F46E5' }} value={editCommentText} onChange={e => setEditCommentText(e.target.value)} autoFocus />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => setEditingCommentId(null)} style={{ ...styles.modalMiniBtn, backgroundColor: '#F1F5F9', color: '#64748B' }}>Cancel</button>
                    <button onClick={() => handleEditSave(node)} style={{ ...styles.modalMiniBtn, color: '#4F46E5', backgroundColor: '#F1F5F9' }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.commentUserRow}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ ...styles.commentUserName, color: node.is_official ? '#4338CA' : '#1E293B' }}>{node.user?.name || node.user_name || 'User'}</span>
                        {node.is_official && (
                          <span style={{
                            marginLeft: '8px', padding: '2px 8px', borderRadius: '4px',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', color: 'white',
                            fontSize: '9px', fontWeight: '900', textTransform: 'uppercase',
                            letterSpacing: '0.04em', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                          }}>
                            Official Response
                          </span>
                        )}
                      </div>
                      {node.is_official && node.admin_role_snapshot && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          <span style={{ fontSize: '10px', color: '#4F46E5', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            {node.admin_role_snapshot}
                          </span>
                        </div>
                      )}
                    </div>
                    {node.user_id === currentUser?.id && (
                      <div style={styles.commentOptions}>
                        <button onClick={() => { setEditingCommentId(node.id); setEditCommentText(node.message); }} style={styles.btnIconTiny}><Icons.EditComment /></button>
                        <button onClick={() => handleDeleteComment(node.id)} style={styles.btnIconTiny}><Icons.Trash /></button>
                      </div>
                    )}
                  </div>
                  <p style={{ ...styles.commentText, fontSize: '13px', color: '#1E293B' }}>
                    {node.message.split(' ').map((word, i) =>
                      word.startsWith('@') ? <strong key={i} style={{ color: '#4F46E5' }}>{word} </strong> : word + ' '
                    )}
                  </p>
                </>
              )}
            </div>
            {!editingCommentId && (
              <div style={{ ...styles.commentActionsRow, marginTop: '4px', paddingLeft: '8px' }}>
                <button style={{ ...styles.commentReactBtn, color: node.user_reaction === true ? '#3B82F6' : '#64748B' }} onClick={() => handleReplyReaction(node.id, true)}><Icons.ThumbUp size={12} /> <span>{node.likes_count || ''}</span></button>
                <button style={{ ...styles.commentReactBtn, color: node.user_reaction === false ? '#EF4444' : '#64748B' }} onClick={() => handleReplyReaction(node.id, false)}><Icons.ThumbDown size={12} /> <span>{node.dislikes_count || ''}</span></button>
                <button style={{ ...styles.commentReplyLink, color: 'var(--primary-color)' }} onClick={() => handleStartReply(node)}>Reply</button>
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
          </div>
          <button onClick={onClose} style={{ ...styles.closeBtn, backgroundColor: '#F1F5F9', color: '#64748B' }}>✕</button>
        </header>

        <div style={{ ...styles.commentModalBody, backgroundColor: '#F8FAFC' }}>
          {/* Detailed Original Post Section */}
          <div style={{ ...styles.originalPostSnippetExtended, backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <div style={{ ...styles.snippetAvatar, backgroundColor: '#F1F5F9', color: '#1E293B', width: '48px', height: '48px', fontSize: '20px' }}>
                {itemMeta.is_anonymous || !itemMeta.sender_avatar_url ? (
                  (itemMeta.user_name || 'U').charAt(0)
                ) : (
                  <img src={itemMeta.sender_avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '800', fontSize: 'var(--size-user-name, 11px)', color: '#1E293B' }}>{itemMeta.is_anonymous ? 'Anonymous' : (itemMeta.user_name || 'Anonymous')}</span>
                </div>
                <div style={{ fontSize: 'var(--size-chip, 9px)', color: '#94A3B8', marginTop: '2px' }}>{formatDate(itemMeta.created_at)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ ...styles.ratingBadge, backgroundColor: '#FFF7ED', color: '#C2410C', padding: '2px 8px' }}>
                  <Icons.Star filled={true} size={10} />
                  <span>{itemMeta.rating || 0}/5</span>
                </div>
              </div>
            </div>

            {/* LOCATION CHIP */}
            {(itemMeta.barangay || itemMeta.city || itemMeta.province) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', padding: '4px 8px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #F1F5F9' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '500' }}>
                  {[itemMeta.barangay, itemMeta.city, itemMeta.province, itemMeta.region].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {itemMeta.title && itemMeta.title.toLowerCase() !== 'feedback entry' && (
              <h2 style={{ fontSize: 'var(--size-card-title, 12px)', fontWeight: '800', color: 'var(--primary-color)', margin: '0 0 8px 0', lineHeight: 1.3, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{itemMeta.title}</h2>
            )}
            <p style={{ ...styles.snippetTextFull, color: '#334155', lineHeight: 1.6, fontSize: 'var(--size-body, 11px)', marginBottom: '16px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{itemMeta.description || itemMeta.comment}</p>

            {/* CLOSURE CONTEXT (Lighter version) */}
            {itemMeta.status?.toUpperCase() === 'CLOSED' && (
              <div style={{ backgroundColor: '#F8FAFC', borderLeft: '3px solid #64748B', padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Icons.Lock size={12} color="#64748B" />
                  <span style={{ fontWeight: '800', fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {getModeLabel("closed", "Closed")} Details
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '12px', color: '#1E293B' }}>
                    <strong>{getModeLabel("closed", "Closed")} on:</strong> {formatDate(itemMeta.closed_at)}
                  </div>
                  {itemMeta.closure_note && (
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', fontStyle: 'italic' }}>
                      "{itemMeta.closure_note}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ATTACHMENTS */}
            {itemMeta.attachments && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {(() => {
                  try {
                    const files = JSON.parse(itemMeta.attachments);
                    return files.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Post media ${idx}`}
                        style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #E2E8F0' }}
                        onClick={() => setFullscreenImg(src)}
                      />
                    ));
                  } catch (e) { return null; }
                })()}
              </div>
            )}

            {/* MENTIONS */}
            {(itemMeta.mentions && itemMeta.mentions.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {itemMeta.mentions.map((m, idx) => (
                  <div key={idx} style={{ backgroundColor: '#F0F9FF', border: '1px solid #B9E6FE', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.User size={12} color="#026AA2" />
                    <span style={{ fontSize: '11px', color: '#026AA2', fontWeight: 'bold' }}>{m.employee_prefix} {m.employee_name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Post-level Actions */}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{ ...styles.reactionBtn, backgroundColor: itemMeta.user_reaction === true ? '#DBEAFE' : '#F8FAFC', color: itemMeta.user_reaction === true ? '#1D4ED8' : '#64748B', borderRadius: '10px', padding: '8px 16px' }}
                  onClick={(e) => { e.stopPropagation(); handlePostReaction(true); }}
                >
                  <Icons.ThumbUp size={16} /> <span style={{ fontWeight: 'bold' }}>{itemMeta.likes_count ?? itemMeta.likes ?? 0}</span>
                </button>
                <button
                  style={{ ...styles.reactionBtn, backgroundColor: itemMeta.user_reaction === false ? '#FEF2F2' : '#F8FAFC', color: itemMeta.user_reaction === false ? '#EF4444' : '#64748B', borderRadius: '10px', padding: '8px 16px' }}
                  onClick={(e) => { e.stopPropagation(); handlePostReaction(false); }}
                >
                  <Icons.ThumbDown size={16} /> <span style={{ fontWeight: 'bold' }}>{itemMeta.dislikes_count ?? itemMeta.dislikes ?? 0}</span>
                </button>
              </div>
            </div>
          </div>

          <div style={styles.modalCommentsList}>
            {loading ? <p style={styles.emptyText}>Loading...</p> :
              comments.length === 0 ? <p style={styles.emptyText}>No comments yet. Be the first!</p> :
                comments
                  .filter(c => !c.parent_id)
                  .sort((a, b) => {
                    // PIN ADMIN COMMENTS TO TOP
                    if (a.is_official && !b.is_official) return -1;
                    if (!a.is_official && b.is_official) return 1;
                    // Otherwise sort by date (Newest First)
                    return new Date(b.created_at) - new Date(a.created_at);
                  })
                  .map(parentComment => {
                    const thread = getAllRepliesForThread(comments, parentComment.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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
          {itemMeta.status?.toUpperCase() === 'RESOLVED' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#F0FDF4',
              borderRadius: '12px',
              border: '1px solid #DCFCE7',
              color: '#15803D',
              width: '100%',
              marginBottom: '12px'
            }}>
              <Icons.CheckCircle size={14} color="#15803D" />
              <span style={{ fontSize: '13px', fontWeight: '700' }}>
                Marked as resolved by admin
              </span>
            </div>
          )}
          {replyingTo && (
            <div style={{ ...styles.replyingToNotice, backgroundColor: '#F1F5F9', color: '#64748B' }}>
              Replying to <strong style={{ color: '#1E293B' }}>{replyingTo.name}</strong>
              <button onClick={() => setReplyingTo(null)} style={styles.cancelReplyBtn}>X</button>
            </div>
          )}
          {(itemMeta.allow_comments !== false || isAdmin) ? (
            <div style={styles.modalInputWrapper}>
              <input
                id="modal-comment-input"
                ref={commentInputRef}
                type="text"
                placeholder={replyingTo ? `Replying to ${replyingTo.name}...` : "Write a comment..."}
                style={styles.modalCommentInput}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
              />
              <button style={{ ...styles.modalSendBtn, backgroundColor: 'var(--primary-color)' }} onClick={handlePostComment}>
                Post
              </button>
            </div>
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#64748B',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px dashed #E2E8F0',
              width: '100%'
            }}>
              Comments have been disabled for this feedback.
            </div>
          )}
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



const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#FCD34D'; // Yellow
    case 'Approved': return '#34D399'; // Green
    case 'Rejected': return '#EF4444'; // Red
    case 'Implemented': return '#60A5FA'; // Blue
    default: return 'transparent';
  }
};

const FeedCard = React.memo(({ item: initialItem, currentUser, onShowToast, onOpenComments, setFullscreenImg, onRefresh }) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
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
      // Refresh counts locally instantly
      const data = await getReactionsSummary(item.id, currentUser?.id);
      setLikes(data.likes || 0);
      setDislikes(data.dislikes || 0);
      setUserReaction(data.user_reaction ?? null);
      // Removed global refresh to prevent scroll jumping
    } catch (err) {
      console.error("Reaction failed", err);
    }
  };

  const isAnonymous = item.is_anonymous;
  // avatarText and markerColor reserved for future rendering enhancements
  // eslint-disable-next-line no-unused-vars
  const avatarText = isAnonymous ? "?" : (item.user_name || item.sender_name || 'U').charAt(0).toUpperCase();
  // eslint-disable-next-line no-unused-vars
  const markerColor = (() => {
    const entityColorMap = { 1: '#3B82F6', 2: 'var(--primary-color)', 3: '#64748B' };
    return entityColorMap[item.entity_id] || '#64748B';
  })();

  const getEmotion = (rating) => {
    if (rating === 5) return "🤩 ecstatic";
    if (rating === 4) return "😊 happy";
    if (rating === 3) return "😐 neutral";
    if (rating === 2) return "😕 disappointed";
    if (rating === 1) return "😠 angry";
    return "";
  };

  const getEstablishmentName = () => {
    // Priority 1: Use the computed branch_name from backend (includes waterfall & inactive suffix)
    if (item.branch_name) return item.branch_name;

    // Fallback for legacy items or unexpected data
    if (item.title && item.title.includes(":")) {
      return item.title.split(":")[1].trim();
    }
    return item.entity_name || item.recipient_dept_name || 'General Office';
  };

  // eslint-disable-next-line no-unused-vars
  const emotion = getEmotion(item.rating);
  const establishmentName = getEstablishmentName();
  // eslint-disable-next-line no-unused-vars
  const locationHeader = establishmentName;
  // eslint-disable-next-line no-unused-vars
  const locationText = (item.region || item.province || item.city || item.barangay) ? `${[item.barangay, item.city, item.province, item.region].filter(Boolean).join(', ')}` : '';
  // eslint-disable-next-line no-unused-vars
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
          if (onRefresh) onRefresh();
          onShowToast("Post deleted successfully");
        } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
  };

  return (
    <div
      className="user-portal-card"
      onClick={() => { if (!isEditing) onOpenComments(item); }}
      style={{
        ...styles.feedCard,
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--primary-color)',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(var(--primary-rgb), 0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
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
          <div style={{ ...styles.cardAvatar, backgroundColor: 'var(--primary-color)', color: '#FFFFFF' }}>{(item.user_name || 'U').charAt(0)}</div>
        ) : (
          <img
            src={item.sender_avatar_url}
            alt={item.user_name}
            style={{ ...styles.cardAvatar, objectFit: 'cover', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
          />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={styles.fbSenderRow}>
            {renderFeedbackAction(item, currentUser)}
            {(item.mentions && item.mentions.length > 0) ? (
              <span style={{ marginLeft: '4px', fontSize: '11px', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', border: '1px solid #DBEAFE' }}>
                Mentioned: {formatMentions(item.mentions)}
              </span>
            ) : item.employee_name && (
              <span style={{ marginLeft: '4px', fontSize: '11px', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', border: '1px solid #DBEAFE' }}>
                Mentioned: {item.employee_name}
              </span>
            )}
          </div>
          <div style={{ ...styles.cardMeta, color: '#64748B', fontWeight: '500', fontSize: 'var(--size-chip, 9px)' }}>
            {formatFeedbackDate(item.created_at)}
            {item.type !== 'comment' && (
              <span style={{ color: '#94A3B8' }}> • {formatLocation(item)}</span>
            )}
          </div>
        </div>
        {item.status && item.status.toUpperCase() === 'RESOLVED' && (
          <div style={{ ...styles.statusBadge, backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icons.CheckCircle size={10} /> RESOLVED
          </div>
        )}
        {item.status && item.status.toUpperCase() !== 'RESOLVED' && item.status.toUpperCase() !== 'OPEN' && (
          <div style={{ ...styles.statusBadge, backgroundColor: getStatusColor(item.status), marginLeft: 'auto' }}>
            {item.status}
          </div>
        )}
        <div style={{ position: 'relative', marginLeft: (item.status && item.status.toUpperCase() !== 'OPEN') ? '6px' : 'auto' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: 'var(--button-height, 32px)', height: 'var(--button-height, 32px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '18px', fontWeight: 'bold', borderRadius: '50%' }}
          >
            ⋮
          </button>
          {showOptions && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'absolute', right: 0, top: '100%', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '110px', overflow: 'hidden', marginTop: '4px' }}
            >
              {isOwner ? (
                <>
                  <button onClick={() => { setIsEditing(true); setShowOptions(false); setEditTitle(item.title); setEditDesc(item.description); }} style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', color: '#1E293B', fontSize: 'var(--size-nav, 13px)', fontWeight: '600' }}>Edit</button>
                  <button onClick={() => { setShowOptions(false); handleDelete(); }} style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#EF4444', fontSize: 'var(--size-nav, 13px)', fontWeight: '600' }}>Delete</button>
                </>
              ) : (
                <button onClick={() => { setShowOptions(false); onShowToast("Post reported. Thank you."); }} style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#EF4444', fontSize: 'var(--size-nav, 13px)', fontWeight: '600' }}>Report</button>
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
        <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '4px' }}>{item.rating || 0}/5</span>
      </div>

      {/* DETAIL METADATA — product/staff only (address shown in header) */}
      <div style={styles.metaGrid}>
        {item.product_name && (
          <div style={styles.metaItem}>
            <span style={styles.metaIcon}>🛍️</span>
            <span style={{ ...styles.metaText, color: '#64748B' }}>{item.product_name}</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
          {/* Structured Feedback Content */}
          {(() => {
            const config = item.entity?.fields;
            const responses = item.custom_data || {};

            // If no structured data, fallback to legacy description
            if (!config || !config.steps || Object.keys(responses).length === 0) {
              return <p style={{ ...styles.cardText, color: '#000000', margin: 0 }}>
                {(item.description || '').substring(0, 400) + ((item.description || '').length > 400 ? '...' : '')}
              </p>;
            }

            // Render based on Form Design
            return config.steps.flatMap(s => s.items || []).map((it, idx) => {
              // --- SMART VISIBILITY RULES ---
              const key = it.key || "";
              let isPublic = true;

              // Always Hidden Identity Fields
              if (['contact_number', 'email_address', 'mailing_address'].includes(key)) isPublic = false;
              // Conditional Identity Fields
              if (key === 'full_name' && item.is_anonymous) isPublic = false;

              if (!isPublic) return null;

              const val = responses[it.id] || responses[it.key];
              if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) return null;

              // Formatting the value
              let displayVal = val;
              if (typeof val === 'object' && !Array.isArray(val)) {
                // Handle Matrix Ratings
                displayVal = Object.entries(val).map(([k, v]) => `${k}: ${v}/5`).join(', ');
              } else if (Array.isArray(val)) {
                displayVal = val.join(', ');
              }

              return (
                <div key={idx} style={{ borderLeft: '3px solid var(--primary-soft)', paddingLeft: '12px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {it.label_override}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1E293B', lineHeight: '1.5', fontWeight: '500', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {displayVal}
                  </div>
                </div>
              );
            });
          })()}
        </div>
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
          onClick={(e) => { e.stopPropagation(); handleReact(true); }}
        >
          <Icons.ThumbUp />{likes > 0 ? <span style={styles.actionCount}>{likes}</span> : null}
        </button>

        <button
          style={{ ...styles.fbActionBtn, color: userReaction === false ? '#EF4444' : '#65676B' }}
          onClick={(e) => { e.stopPropagation(); handleReact(false); }}
        >
          <Icons.ThumbDown />{dislikes > 0 ? <span style={styles.actionCount}>{dislikes}</span> : null}
        </button>

        <button
          style={{ ...styles.fbActionBtn, opacity: (item.allow_comments !== false || isAdmin) ? 1 : 0.6 }}
          onClick={(e) => { e.stopPropagation(); onOpenComments(item); }}
        >
          <Icons.Message />
          <span style={{ color: (item.allow_comments === false && !isAdmin) ? '#94A3B8' : 'inherit' }}>
            {item.allow_comments === false && !isAdmin ? "Comments Disabled" : "Comment"}
          </span>
          {item.replies_count > 0 ? <span style={styles.actionCount}>{item.replies_count}</span> : null}
        </button>
      </div>
    </div>
  );
});

const DashboardView = React.memo(({ feed, loading, hasMore, onLoadMore, onAction, currentUser, onShowToast, onOpenComments, onRefresh, publicFeedEnabled, entities, setFullscreenImg, statusFilter, setStatusFilter }) => {
  // eslint-disable-next-line no-unused-vars
  const [isHotTopicsExpanded, setIsHotTopicsExpanded] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const { getLabel, getModeLabel, systemMode, systemName } = useTerminology();
  const [activeTab, setActiveTab] = useState('All');
  const [searchDash, setSearchDash] = useState("");

  const getTabIcon = (cat) => {
    if (!cat) return Icons.Message;

    // 1. Try to use the icon key directly from the category object
    if (cat.icon && IconRegistry[cat.icon]) {
      return IconRegistry[cat.icon];
    }

    // 2. Fallback to name-based heuristic if icon is missing or invalid
    const name = (cat.name || "").toLowerCase();

    if (name.includes('dept') || name.includes('department') || name.includes('office')) return IconRegistry.hotel;
    if (name.includes('food') || name.includes('eat') || name.includes('rest')) return IconRegistry.plate;
    if (name.includes('beauty') || name.includes('cosmetic')) return IconRegistry.spa;
    if (name.includes('car') || name.includes('transport') || name.includes('bus')) return IconRegistry.bus;
    if (name.includes('bank') || name.includes('finance') || name.includes('money')) return IconRegistry.shield;
    if (name.includes('edu') || name.includes('school')) return IconRegistry.school;

    return IconRegistry.default || Icons.Message;
  };

  // Calculate counts for each entity
  const getEntityCount = (entName) => {
    if (entName === 'All') return feed.length;
    return feed.filter(item => (item.entity_name || "").toLowerCase() === entName.toLowerCase()).length;
  };

  const tabs = [
    { id: 'All', label: 'All', icon: Icons.History },
    ...(entities || []).map(ent => ({
      id: ent.name,
      label: ent.name.charAt(0).toUpperCase() + ent.name.slice(1),
      icon: getTabIcon(ent)
    }))
  ];

  const filteredFeed = feed.filter(item => {
    // Tab Filter
    const entName = (item.entity_name || "").toLowerCase();
    const deptName = (item.recipient_dept_name || "").toLowerCase();
    const activeLower = activeTab.toLowerCase();

    let matchesTab = false;
    if (activeTab === 'All') matchesTab = true;
    else if (entName === activeLower) matchesTab = true;
    else if (activeLower === 'dept' && (entName.includes('dept') || entName.includes('department') || deptName)) matchesTab = true;

    if (!matchesTab) return false;

    // Search Filter
    if (searchDash) {
      const q = searchDash.toLowerCase();
      const searchableStr = `${item.title} ${item.description} ${item.product_name || ""} ${item.employee_name || ""} ${item.entity_name || ""}`.toLowerCase();
      return searchableStr.includes(q);
    }
    return true;
  });

  const allTrendingItems = [...feed]
    .filter(item => (item.replies_count > 0) || (item.likes_count > 0) || (item.dislikes_count > 0))
    .sort((a, b) => {
      const scoreA = (a.replies_count || 0) * 2 + (a.likes_count || 0) + (a.dislikes_count || 0);
      const scoreB = (b.replies_count || 0) * 2 + (b.likes_count || 0) + (b.dislikes_count || 0);
      return scoreB - scoreA;
    });

  const trendingItems = allTrendingItems.slice(0, 3);


  return (
    <div className="user-portal-container" style={{ ...styles.fadeIn, display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1000px', margin: '0 auto', width: '100%', overflow: 'hidden' }}>

      {/* FIXED TOP SECTION */}
      <div style={{ flexShrink: 0, paddingBottom: '8px' }}>
        {/* NO LONGER AT TOP - MOVED TO FAB */}

        {/* TRENDING WIDGET MOVED TO TOP OF FEED */}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%', maxWidth: '700px', margin: '0 auto' }}>

        {/* RECENT ACTIVITY: Main Feed */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="scroll-momentum no-scrollbar">
          {/* CATEGORIES / TABS */}
          <div
            ref={el => {
              if (!el) return;
              let isDown = false, startX = 0, scrollLeft = 0;
              el.onmousedown = (e) => { isDown = true; el.style.cursor = 'grabbing'; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; };
              el.onmouseleave = () => { isDown = false; el.style.cursor = 'grab'; };
              el.onmouseup = () => { isDown = false; el.style.cursor = 'grab'; };
              el.onmousemove = (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = scrollLeft - (x - startX) * 1.5; };
            }}
            style={{ ...styles.feedTabsRow, flexShrink: 0, padding: '12px 8px' }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.feedTabBtn,
                  backgroundColor: activeTab === tab.id ? '#DBEAFE' : '#F1F5F9',
                  color: activeTab === tab.id ? '#1D4ED8' : '#64748B',
                  fontWeight: activeTab === tab.id ? '700' : '600'
                }}
              >
                <div style={styles.tabIconWrapper}>
                  <tab.icon width="15" height="15" strokeWidth="2.5" />
                </div>
                <span>{tab.label}</span>
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
                placeholder={`Search office, entity, or service...`}
                value={searchDash}
                onChange={(e) => setSearchDash(e.target.value)}
                style={{
                  width: '100%', height: 'var(--search-height, 44px)', padding: '0 10px 0 36px', backgroundColor: 'white',
                  border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: 'var(--size-body, 13px)',
                  outline: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
              />
            </div>
          </div>

          {/* PREMIUM TRENDING WIDGET */}
          <section style={{ marginBottom: '16px', padding: '0 8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              borderRadius: '20px',
              padding: '16px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 10px 25px -5px rgba(var(--primary-rgb), 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.08em' }}>
                  <div style={{ backgroundColor: '#EF4444', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 3.5 2.5 6 .5 2.5-1 4.5-3 5.5"></path></svg>
                  </div>
                  HOT TOPICS
                </h3>
                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold' }}>LIVE UPDATES</span>
              </div>

              {trendingItems.length > 0 ? (
                <div
                  className="horizontal-scroll"
                  ref={el => {
                    if (!el) return;
                    let isDown = false, startX = 0, scrollLeft = 0;
                    el.onmousedown = (e) => { isDown = true; el.style.cursor = 'grabbing'; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; };
                    el.onmouseleave = () => { isDown = false; el.style.cursor = 'grab'; };
                    el.onmouseup = () => { isDown = false; el.style.cursor = 'grab'; };
                    el.onmousemove = (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = scrollLeft - (x - startX) * 1.5; };
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '12px',
                    overflowX: 'auto',
                    padding: '4px 2px 12px 2px',
                    scrollBehavior: 'smooth',
                    cursor: 'grab',
                    userSelect: 'none'
                  }}
                >
                  {trendingItems.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => onOpenComments(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: index === 0 ? '#FFFFFF' : 'transparent',
                        padding: '12px',
                        borderRadius: '16px',
                        border: index === 0 ? '1px solid #DBEAFE' : '1px solid #F1F5F9',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        width: '260px',
                        minWidth: '260px',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(var(--primary-rgb), 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index === 0 ? '#FFFFFF' : 'transparent';
                        e.currentTarget.style.borderColor = index === 0 ? '#DBEAFE' : '#F1F5F9';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ backgroundColor: index === 0 ? '#EFF6FF' : '#F1F5F9', width: 'var(--avatar-size, 32px)', height: 'var(--avatar-size, 32px)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
                        <span style={{ fontSize: 'var(--size-nav, 14px)', fontWeight: '900', color: index === 0 ? '#2563EB' : '#64748B' }}>{index + 1}</span>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <h4 style={{ fontSize: 'var(--size-card-title, 12px)', fontWeight: '800', color: '#1E293B', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ backgroundColor: '#F0FDF4', padding: '2px', borderRadius: '4px', display: 'flex' }}><Icons.ThumbUp size={8} color="#166534" /></div>
                            <span style={{ fontSize: 'var(--size-metadata, 10px)', color: '#166534', fontWeight: 'bold' }}>{item.likes_count || 0}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ backgroundColor: '#FEF2F2', padding: '2px', borderRadius: '4px', display: 'flex' }}><Icons.ThumbDown size={8} color="#991B1B" /></div>
                            <span style={{ fontSize: 'var(--size-metadata, 10px)', color: '#991B1B', fontWeight: 'bold' }}>{item.dislikes_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0, textAlign: 'center', padding: '10px' }}>No trending topics yet.</p>
              )}
            </div>
          </section>

          <section style={{ padding: '0 8px', marginBottom: '16px' }}>
            <div style={{ borderTop: '1px solid #F1F5F9', marginBottom: '16px' }} />
            <div style={{ ...styles.feedList, border: 'none', borderRadius: 0, backgroundColor: 'transparent', minHeight: 'auto' }}>
              {!publicFeedEnabled ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                  <h3 style={{ color: 'var(--primary-color)', margin: '0 0 8px 0' }}>Feed Restricted</h3>
                  <p style={{ color: '#64748B', fontSize: '13px', margin: 0, maxWidth: '250px', marginLeft: 'auto', marginRight: 'auto' }}>The community feed has been set to private by the administrator.</p>
                </div>
              ) : (
                <>
                  {loading ? (
                    <p style={styles.emptyText}>Loading feed...</p>
                  ) : filteredFeed.length > 0 ? (
                    <>
                      {filteredFeed.map(item => (
                        <FeedCard key={item.id} item={item} currentUser={currentUser} onShowToast={onShowToast} onOpenComments={onOpenComments} onRefresh={onRefresh} setFullscreenImg={setFullscreenImg} />
                      ))}
                    </>
                  ) : (
                    <div style={{ ...styles.emptyState, padding: '48px 20px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '64px', height: '64px', backgroundColor: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icons.Message size={32} color="#94A3B8" />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ ...styles.emptyText, fontWeight: '800', color: 'var(--primary-color)', margin: '0 0 4px 0', fontSize: '16px' }}>
                          No feedback yet in this entity
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                          Be the first to submit feedback
                        </p>
                      </div>
                      <button
                        onClick={() => onAction()}
                        style={{
                          ...styles.primaryAction,
                          width: 'auto',
                          padding: '10px 24px',
                          fontSize: '13px',
                          background: 'var(--primary-color)',
                          marginTop: '8px'
                        }}
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}
                  {hasMore && feed.length >= 10 && (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <button
                        onClick={onLoadMore}
                        disabled={loading}
                        style={{ ...styles.submitBtn, width: 'auto', padding: '10px 30px', backgroundColor: '#F1F5F9', color: 'var(--primary-color)', border: '1px solid #E2E8F0' }}
                      >
                        {loading ? 'Loading...' : 'Load More Activity'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        className="fab-btn"
        style={styles.fab}
        onClick={(e) => { e.stopPropagation(); onAction(); }}
        title={`New ${getLabel("feedback_label", "Report")}`}
      >
        <Icons.Plus />
      </button>
    </div>
  );
});

// CategorySelection reserved for future step-based form flow
// eslint-disable-next-line no-unused-vars
const CategorySelection = React.memo(({ onBack, onSelect }) => (
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
          <div style={{ ...styles.catIcon, color: 'var(--primary-color)', backgroundColor: '#F1F5F9' }}>{cat.icon}</div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1 }}>
            <span style={{ ...styles.catLabel, fontSize: 'clamp(15px, 4vw, 17px)' }}>
              {cat.labelMain} <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}> / {cat.labelSub}</span>
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{cat.desc}</span>
          </div>
          <Icons.ChevronRight />
        </button>
      ))}
    </div>
  </div>
));

const styles = {
  hubContainer: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', fontFamily: '"Inter", -apple-system, sans-serif', fontSize: 'var(--size-body, 14px)' },
  header: { padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F1F5F9', flexShrink: 0 },
  headerTitle: { fontSize: 'var(--size-page-title, 14px)', fontWeight: '800', color: '#1E293B', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', position: 'relative' },
  notifDot: { position: 'absolute', top: '0px', right: '0px', width: '8px', height: '8px', backgroundColor: 'var(--primary-color)', borderRadius: '50%', border: '2px solid white' },
  mainScroll: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in-out' },
  fabBtnHtml: `
    .fab-btn:hover {
      transform: scale(1.05) !important;
      background-color: #2563EB !important;
    }
  `,
  layoutCenter: { maxWidth: '700px', margin: '0 auto', width: '100%' },
  welcomeSection: { marginBottom: '12px', maxWidth: '700px', margin: '0 auto', width: '100%' },
  greeting: { fontSize: 'var(--size-page-title, 16px)', fontWeight: '800', background: '-webkit-linear-gradient(45deg, var(--primary-color), #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subGreeting: { fontSize: 'var(--size-secondary, 12px)', color: '#475569', fontWeight: '500' },
  actionGridSingle: { marginBottom: '12px', maxWidth: '700px', margin: '0 auto', width: '100%' },
  primaryAction: { width: '100%', background: 'linear-gradient(135deg, var(--primary-color) 0%, #2563EB 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: 'var(--card-padding, 10px 14px)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)', cursor: 'pointer', transition: 'transform 0.2s', fontWeight: 'bold' },
  actionIconBg: { width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  actionText: { fontSize: 'var(--size-nav, 14px)', fontWeight: 'bold' },
  sectionTitle: { fontSize: 'var(--size-card-title, 13px)', fontWeight: 'bold' },
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
  feedCard: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: 'var(--card-padding, 12px 16px)', border: '1px solid #F1F5F9', borderLeft: '4px solid var(--primary-color)', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', marginBottom: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },

  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  cardAvatar: { width: 'var(--avatar-size, 32px)', height: 'var(--avatar-size, 32px)', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--size-nav, 14px)', fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  cardSender: { fontSize: 'var(--size-user-name, 13px)', fontWeight: '700', color: '#000000' },
  cardMeta: { fontSize: 'var(--size-metadata, 11px)', color: '#64748B' },
  statusBadge: { padding: '2px 6px', borderRadius: '4px', fontSize: 'var(--size-chip, 10px)', fontWeight: 'bold', textTransform: 'uppercase', color: 'white', backgroundColor: 'var(--primary-color)' },

  cardSubjectRow: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' },
  cardSubject: { fontSize: 'var(--size-card-title, 13px)', fontWeight: '800', color: '#000000' },
  cardDept: { fontSize: 'var(--size-chip, 10px)', color: '#FFFFFF', backgroundColor: 'var(--primary-color)', padding: '2px 4px', borderRadius: '4px' },
  cardRatingRow: { display: 'flex', gap: '2px', marginBottom: '4px', alignItems: 'center' },

  cardText: { fontSize: 'var(--size-body, 14px)', color: '#1E293B', lineHeight: '1.5', margin: '8px 0 12px 0', overflowWrap: 'break-word', wordBreak: 'break-word' },

  fbSenderRow: { fontSize: 'var(--size-nav, 14.5px)', color: '#1E293B', lineHeight: '1.4', marginBottom: '2px', overflowWrap: 'break-word', wordBreak: 'break-word' },
  fbActionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '12px' },
  fbActionBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flex: 1, justifyContent: 'center', borderRadius: '6px', transition: 'background-color 0.2s', fontSize: '10px', color: '#64748B', fontWeight: '600' },
  actionCount: { fontSize: '9px', fontWeight: '700', marginLeft: '2px' },

  feedImages: { display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto', padding: '4px 0', marginBottom: '8px', scrollbarWidth: 'none' },
  feedImg: { height: '80px', minWidth: '80px', maxWidth: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'zoom-in' },

  imageModal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' },
  modalImg: { maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: '8px' },
  feedTabsRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '12px',
    marginBottom: '8px',
    WebkitOverflowScrolling: 'touch',
    cursor: 'grab',
    flexShrink: 0,
    userSelect: 'none',
    minWidth: 0,
    width: '100%',
  },
  feedTabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    flexShrink: 0,
    fontSize: 'var(--size-chip, 11.5px)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  tabIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    flexShrink: 0
  },
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.3)',
    border: 'none',
    cursor: 'pointer',
    zIndex: 200,
    transition: 'transform 0.2s, background-color 0.2s',
  },

  metaGrid: { display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' },
  metaItem: { display: 'flex', alignItems: 'flex-start', gap: '5px' },
  metaIcon: { fontSize: 'var(--size-metadata, 11px)', flexShrink: 0, marginTop: '1px' },
  metaText: { fontSize: 'var(--size-metadata, 11px)', color: '#65676B', lineHeight: '1.3' },

  feedTarget: { fontSize: '12px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  feedComment: { fontSize: '14px', margin: '8px 0', lineHeight: '1.5', color: '#334155' },
  feedTag: { display: 'inline-block', fontSize: '10px', fontWeight: '800', backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '8px' },
  livePulse: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 'bold' },
  pulseDot: { width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%' },
  emptyState: { padding: '40px 20px', textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: '20px' },
  emptyText: { color: '#94A3B8', fontSize: 'var(--size-body, 14px)' },
  backBtn: { background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '16px' },
  pageTitle: { fontSize: 'var(--size-page-title, 22px)', fontWeight: 'bold', marginBottom: '20px' },
  categoryStack: { display: 'flex', flexDirection: 'column', gap: '12px' },
  categoryCard: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0' },
  catIcon: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' },
  catLabel: { flex: 1, fontWeight: '600', textAlign: 'left' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease-in-out' },
  menuContent: { width: '280px', height: '100%', background: 'linear-gradient(180deg, var(--primary-color) 0%, #0F172A 100%)', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.3)', animation: 'slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' },
  menuHeader: { padding: '50px 24px 30px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  avatarLarge: { width: '64px', height: '64px', borderRadius: '22px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '2px solid rgba(255,255,255,0.3)', marginBottom: '16px', color: 'white' },
  userName: { margin: 0, color: 'white', fontWeight: 'bold', fontSize: 'var(--size-user-name, 16px)' },
  userRole: { margin: 0, color: '#94A3B8', fontSize: 'var(--size-secondary, 13px)', marginTop: '4px' },
  menuLinks: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' },
  modalBody: { padding: '24px', flex: 1, overflowY: 'auto', overflowWrap: 'break-word', wordBreak: 'break-word' },
  menuLink: { background: 'none', border: 'none', textAlign: 'left', padding: '14px 16px', fontSize: 'var(--size-nav, 15px)', fontWeight: '600', cursor: 'pointer', borderRadius: '12px', transition: 'background-color 0.2s', ':hover': { backgroundColor: 'rgba(255,255,255,0.05)' } },
  notifOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 100 },
  notifContent: { width: '300px', height: '100%', backgroundColor: 'white', position: 'absolute', right: 0 },
  notifHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' },
  notifTitle: { margin: 0, fontSize: '16px' },
  closeBtnSecondary: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' },
  notifList: { flex: 1, padding: '10px' },
  reportOverlay: {
    position: 'fixed', inset: 0,
    background: `
      radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.2) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(34, 197, 94, 0.1) 0px, transparent 50%),
      rgba(15, 23, 42, 0.6)
    `,
    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)', padding: '20px',
    animation: 'fadeIn 0.25s ease-out'
  },
  reportModalContent: {
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    width: '100%', maxWidth: '440px',
    height: '85vh',
    borderRadius: '40px',
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 40px 80px -15px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  feedAvatar: { width: 'var(--avatar-size, 36px)', height: 'var(--avatar-size, 36px)', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 'var(--size-nav, 16px)', flexShrink: 0 },
  commentToggleBtn: { background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--size-body, 13px)', fontWeight: '600', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', transition: 'background-color 0.2s' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' },
  commentModalContent: { backgroundColor: 'white', width: '100%', maxWidth: '500px', maxHeight: '85vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  commentModalHeader: { padding: 'var(--card-padding, 12px 16px)', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' },
  modalTitle: { fontSize: 'var(--size-page-title, 16px)', fontWeight: '800', color: 'var(--primary-color)', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' },
  closeBtn: { background: '#F1F5F9', border: 'none', width: 'var(--button-height, 28px)', height: 'var(--button-height, 28px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' },
  commentModalBody: { flex: 1, overflowY: 'auto', padding: 'var(--card-padding, 12px)', backgroundColor: '#F8FAFC' },
  originalPostSnippet: { backgroundColor: 'white', padding: 'var(--card-padding, 12px)', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '16px' },
  snippetUser: { fontSize: 'var(--size-metadata, 11px)', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
  snippetText: { fontSize: 'var(--size-body, 12px)', margin: 0, color: '#1E293B', lineHeight: '1.4' },
  modalCommentsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  modalCommentItem: { display: 'flex', gap: '8px' },
  commentAvatarSmall: { width: 'var(--avatar-size, 28px)', height: 'var(--avatar-size, 28px)', borderRadius: '10px', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--size-nav, 11px)', fontWeight: 'bold', flexShrink: 0 },
  commentBubble: { padding: 'var(--card-padding, 8px 10px)', borderRadius: '12px', border: '1px solid #E2E8F0', position: 'relative', overflowWrap: 'break-word', wordBreak: 'break-word', flex: 1, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  commentUserName: { fontSize: 'var(--size-user-name, 11px)', fontWeight: '800', color: 'var(--primary-color)' },
  commentText: { fontSize: 'var(--size-body, 11px)', color: '#334155', lineHeight: '1.4', margin: '4px 0 0 0', overflowWrap: 'break-word', wordBreak: 'break-word' },
  commentActionsRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  commentActionLink: { background: 'none', border: 'none', padding: 0, fontSize: 'var(--size-metadata, 11px)', fontWeight: 'bold', cursor: 'pointer', transition: 'color 0.2s' },
  commentDate: { fontSize: 'var(--size-metadata, 9px)', color: '#94A3B8', marginLeft: 'auto' },
  commentModalFooter: { padding: 'var(--card-padding, 8px 12px)', borderTop: '1px solid #F1F5F9', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', backgroundColor: 'white' },
  modalInputWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
  modalCommentInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '8px 12px',
    fontSize: 'var(--size-body, 11px)',
    outline: 'none',
    transition: 'border-color 0.2s',
    '&:focus': { borderColor: 'var(--primary-color)' }
  },
  modalSendBtn: { background: 'var(--primary-color)', border: 'none', color: 'white', width: 'var(--button-height, 32px)', height: 'var(--button-height, 32px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' },
  modalEditInput: { width: '100%', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: 'var(--size-body, 14px)', outline: 'none', overflowWrap: 'break-word', wordBreak: 'break-word', marginBottom: '6px', boxSizing: 'border-box' },
  modalMiniBtn: { background: '#F1F5F9', border: 'none', fontSize: 'var(--size-metadata, 11px)', fontWeight: 'bold', cursor: 'pointer', color: '#64748B', padding: '4px 10px', borderRadius: '8px' },
  btnIconTiny: { background: 'none', border: 'none', padding: '3px', cursor: 'pointer', color: '#94A3B8', transition: 'color 0.2s' },
  modalSubtitle: { fontSize: 'var(--size-metadata, 11px)', color: '#64748B', fontWeight: '600' },
  originalPostSnippetExtended: { backgroundColor: 'white', padding: 'var(--card-padding, 12px)', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  snippetUserRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  snippetAvatar: { width: 'var(--avatar-size, 28px)', height: 'var(--avatar-size, 28px)', borderRadius: '10px', backgroundColor: '#F1F5F9', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 'var(--size-nav, 12px)' },
  snippetMeta: { fontSize: 'var(--size-metadata, 10px)', color: '#94A3B8' },
  ratingBadge: { backgroundColor: '#FFF7ED', color: '#C2410C', padding: '2px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--size-chip, 10px)', fontWeight: 'bold' },
  snippetTextFull: { fontSize: 'var(--size-body, 12px)', color: '#1E293B', lineHeight: '1.4', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' },
  commentChain: { display: 'flex', flexDirection: 'column', gap: '6px' },
  commentUserRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  commentOptions: { display: 'flex', gap: '6px' },
  commentReactions: { display: 'flex', alignItems: 'center', gap: '10px' },
  commentReactBtn: { background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', color: '#64748B' },
  commentReplyLink: { background: 'none', border: 'none', padding: 0, fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)', cursor: 'pointer', marginLeft: '6px' },
  nestedCommentItem: { display: 'flex', gap: '8px', marginLeft: '40px', marginTop: '2px' },
  nestedAvatarSmall: { width: '24px', height: '24px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
  viewMoreBtn: { background: 'none', border: 'none', color: '#3B82F6', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '4px 0', marginTop: '4px', textAlign: 'left' },
  replyingToNotice: { fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '6px 10px', borderRadius: '10px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cancelReplyBtn: { background: 'none', border: 'none', color: '#EF4444', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px' },
  translateBtn: { background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12px', textAlign: 'left', padding: '0 0 8px 0', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' },
  reactionBtn: { border: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '16px', fontSize: '11px', cursor: 'pointer', transition: 'background-color 0.2s', fontWeight: 'bold' },
  toastModal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '16px 24px', color: 'white', fontWeight: 'bold', fontSize: '15px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999, animation: 'fadeIn 0.2s ease-out', pointerEvents: 'none' },
  feedListContainer: { display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px' },
  emptyFeedText: { textAlign: 'center', color: '#94A3B8', fontSize: '14px', width: '100%', margin: '40px 0' }
};

const BroadcastViewModal = React.memo(({ notif, currentUser, onClose, onAcknowledge }) => {
  const { systemName } = useTerminology();
  const isHighPriority = notif.priority === 'high' || (notif.subject && notif.subject.toLowerCase().includes('urgent'));
  const requireAck = notif.require_ack === true;

  // Cleanup subject for cleaner UI (removing [OFFICIAL] if redundant)
  const displaySubject = notif.subject ? notif.subject.replace(/\[OFFICIAL\]\s*/i, '').replace(/SYSTEM\s*-\s*/i, '') : 'Official Announcement';

  return (
    <div style={{ ...styles.modalOverlay, zIndex: 1000, cursor: requireAck ? 'default' : 'pointer' }} onClick={requireAck ? null : onClose}>
      <div
        style={{
          ...styles.commentModalContent,
          maxWidth: '520px',
          height: 'auto',
          maxHeight: '90vh',
          borderRadius: '32px',
          border: 'none',
          boxShadow: isHighPriority
            ? '0 30px 60px -12px rgba(239, 68, 68, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3)'
            : '0 30px 60px -12px rgba(0, 0, 0, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* TOP META ROW */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 24px 0',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              background: isHighPriority ? '#FEE2E2' : '#F1F5F9',
              color: isHighPriority ? '#EF4444' : '#64748B',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {isHighPriority ? 'Urgent Alert' : 'Official Update'}
            </span>
          </div>

          {!requireAck && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: '18px',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* HEADER SECTION */}
        <header style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: 'var(--avatar-size, 40px)',
              height: 'var(--avatar-size, 40px)',
              borderRadius: '12px',
              background: isHighPriority ? '#EF4444' : 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h2 style={{
                margin: 0,
                fontSize: 'var(--size-page-title, 18px)',
                fontWeight: '800',
                color: '#0F172A',
                lineHeight: 1.2
              }}>
                {displaySubject}
              </h2>
              <p style={{ margin: 0, fontSize: 'var(--size-secondary, 13px)', color: '#64748B', fontWeight: '500' }}>
                Posted by {notif.actor_name || systemName + ' Administration'}
              </p>
            </div>
          </div>
        </header>

        <div style={{ height: '1px', background: '#F1F5F9', margin: '0 24px' }} />

        {/* MESSAGE AREA */}
        <div style={{
          padding: 'var(--card-padding, 24px)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <p style={{
            margin: 0,
            fontSize: 'var(--size-body, 15px)',
            color: '#334155',
            lineHeight: '1.7',
            whiteSpace: 'pre-wrap'
          }}>
            {notif.message}
          </p>
        </div>

        <div style={{ height: '1px', background: '#F1F5F9', margin: '0 24px' }} />

        {/* FOOTER & ACTIONS */}
        <footer style={{ padding: '24px', textAlign: 'center' }}>
          <button
            className="press-effect"
            onClick={async () => {
              if (currentUser && notif.broadcast_id) {
                try {
                  await acknowledgeBroadcast(currentUser.id, notif.broadcast_id);
                } catch (e) { console.error("Could not acknowledge broadcast", e); }
              }
              if (onAcknowledge) onAcknowledge(notif);
              else onClose();
            }}
            style={{
              width: '100%',
              padding: 'var(--card-padding, 14px)',
              borderRadius: '12px',
              background: isHighPriority ? '#EF4444' : 'var(--primary-color)',
              color: 'white',
              border: 'none',
              fontSize: 'var(--size-nav, 15px)',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              marginBottom: '16px',
              height: 'var(--button-height, 48px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {requireAck ? 'Confirm Receipt' : 'Understood'}
          </button>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '10px',
              fontWeight: '800',
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Internal Communication
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
              Published {new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
});

export default FeedbackHub;
