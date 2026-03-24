import React, { useState } from "react";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ProfileSettings from './ProfileSettings';
import HistoryView from './HistoryView';
import DepartmentFeedback from './DepartmentFeedback';
import IndividualFeedback from './IndividualFeedback';
import GeneralFeedback from './GeneralFeedback';

// --- REUSABLE SVG ICONS (Professional Navy/Grey) ---
const Icons = {
  Plus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Chart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Building: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Message: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Clock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  History: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><polyline points="12 7 12 12 15 15"></polyline></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
};

const FeedbackHub = ({ currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [view, setView] = useState("home"); 

  const navigateTo = (newView) => {
    setView(newView);
    setIsMenuOpen(false);
  };

  const handleSecureLogout = async () => {
    try {
      // Assuming you store a JWT token when the user logs in
      const token = localStorage.getItem("token"); 

      if (token) {
        // 1. Notify the backend to blacklist the token
        await fetch("http://192.168.1.47:8000/api/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
      }
    } catch (error) {
      // We catch the error but don't stop the local logout process
      console.error("Backend logout notification failed:", error);
    } finally {
      // 2. ALWAYS clean up locally, regardless of backend success
      localStorage.removeItem("user");
      localStorage.removeItem("token"); // Clear the token too!
      
      if (onLogout) onLogout(); 
      
      // 3. Reset the application state
      window.location.reload(); 
    }
  };

  // --- DYNAMIC MENU ARRAY ---
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: <Icons.Building /> },
    { id: 'analytics', label: 'My Analytics', icon: <Icons.Chart /> },
    { id: 'history', label: 'History', icon: <Icons.History /> },
    { id: 'profile', label: 'Profile Settings', icon: <Icons.User /> },
    { 
      id: 'logout', 
      label: 'Logout', 
      icon: <Icons.Logout />, 
      color: '#EF4444',
      action: handleSecureLogout // Use the new secure function here!
    },
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
        
        <span style={styles.headerTitle}>
          {view === "home" ? "Command Center" : "Feedback Hub"}
        </span>

        <button style={styles.iconBtn} onClick={() => setIsNotifOpen(true)}>
          <div style={styles.notifDot}></div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
      </header>

      <main style={styles.mainScroll}>
        {view === "home" ? (
          <DashboardView user={currentUser} onAction={setView} />
        ) : view === "analytics" ? (
          <AnalyticsDashboard onBack={() => setView("home")} />
        ) : view === "profile" ? (
          <ProfileSettings currentUser={currentUser} onBack={() => setView("home")} onLogout={onLogout} />
        ) : view === "history" ? (
          <HistoryView currentUser={currentUser} onBack={() => setView("home")} />
        ) : view === "category_selection" ? (
          <CategorySelection onBack={() => setView("home")} onSelect={(v) => setView(v)} />
        ) : view === "department" ? (
          <DepartmentFeedback currentUser={currentUser} onBack={() => setView("category_selection")} />
        ) : view === "individual" ? (
          <IndividualFeedback currentUser={currentUser} onBack={() => setView("category_selection")} />
        ) : view === "general" ? (
          <GeneralFeedback currentUser={currentUser} onBack={() => setView("category_selection")} />
        ) : null }
      </main>

      {/* --- SIDE MENU DRAWER --- */}
      {isMenuOpen && (
        <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
          <div style={styles.menuContent} onClick={e => e.stopPropagation()}>
            <div style={styles.menuHeader}>
              <div style={styles.avatarLarge}>{currentUser?.name?.charAt(0) || "U"}</div>
              <h3 style={styles.userName}>{currentUser?.name || "User"}</h3>
              <p style={styles.userRole}>Feedback Giver</p>
            </div>
            
            <nav style={styles.menuLinks}>
              {menuItems.map((item) => (
                <button 
                  key={item.id} 
                  style={{
                    ...styles.menuLink,
                    color: item.color || '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    // Push logout to the bottom
                    marginTop: item.id === 'logout' ? 'auto' : '0' 
                  }}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      navigateTo(item.id);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</div>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* --- NOTIFICATION DRAWER --- */}
      {isNotifOpen && (
        <div style={styles.notifOverlay} onClick={() => setIsNotifOpen(false)}>
          <div style={styles.notifContent} onClick={e => e.stopPropagation()}>
            <div style={styles.notifHeader}>
              <h3 style={styles.notifTitle}>Notifications</h3>
              <button style={styles.closeBtn} onClick={() => setIsNotifOpen(false)}>✕</button>
            </div>
            
            <div style={styles.notifList}>
              <div style={{...styles.notifItem, backgroundColor: '#F8FAFC'}}>
                <div style={styles.notifIndicator}></div>
                <div>
                  <p style={styles.notifItemTitle}>New Reply: IT Department</p>
                  <p style={styles.notifItemSub}>They have responded to your ticket regarding Wi-Fi issues.</p>
                  <p style={styles.notifTime}>10 mins ago</p>
                </div>
              </div>

              <div style={styles.notifItem}>
                <div>
                  <p style={styles.notifItemTitle}>Status Update</p>
                  <p style={styles.notifItemSub}>Your feedback for "Facilities" is now marked as In Progress.</p>
                  <p style={styles.notifTime}>2 hours ago</p>
                </div>
              </div>

              <div style={styles.notifItem}>
                <div>
                  <p style={styles.notifItemTitle}>Weekly Summary</p>
                  <p style={styles.notifItemSub}>Your department sentiment score increased by 4% this week.</p>
                  <p style={styles.notifTime}>Yesterday</p>
                </div>
              </div>
            </div>
            
            <div style={styles.notifFooter}>
              <button style={styles.markReadBtn}>Mark all as read</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardView = ({ user, onAction }) => (
  <div style={styles.fadeIn}>
    <section style={styles.welcomeSection}>
      <h1 style={styles.greeting}>Welcome back, {user?.name?.split(' ')[0] || "Team Member"}</h1>
      <p style={styles.subGreeting}>You have 2 pending replies to review.</p>
    </section>

    <section style={styles.actionGrid}>
      <button style={styles.primaryAction} onClick={() => onAction("category_selection")}>
        <div style={{...styles.actionIconBg, color: '#1f2a56', backgroundColor: '#F1F5F9'}}>
          <Icons.Plus />
        </div>
        <span style={styles.actionText}>New Report</span>
      </button>
      <button style={styles.secondaryAction} onClick={() => onAction("analytics")}>
        <div style={{...styles.actionIconBg, color: '#475569', backgroundColor: '#F1F5F9'}}>
          <Icons.Chart />
        </div>
        <span style={styles.actionText}>My Stats</span>
      </button>
    </section>

    <h3 style={styles.sectionTitle}>What's Happening</h3>
    <section style={styles.statsRow}>
      <div style={{...styles.statCard, borderBottom: '4px solid #94A3B8'}}>
        <span style={styles.statNum}>02</span>
        <span style={styles.statLabel}>Pending</span>
      </div>
      <div style={{...styles.statCard, borderBottom: '4px solid #1f2a56'}}>
        <span style={styles.statNum}>14</span>
        <span style={styles.statLabel}>Resolved</span>
      </div>
      <div style={{...styles.statCard, borderBottom: '4px solid #475569'}}>
        <span style={styles.statNum}>08</span>
        <span style={styles.statLabel}>Active</span>
      </div>
    </section>

    <div style={styles.feedHeader}>
      <h3 style={styles.sectionTitle}>Recent Updates</h3>
      <button style={styles.textBtn}>View All</button>
    </div>
    <section style={styles.feedList}>
      {[
        { id: 1, title: 'IT Dept replied to your report', time: '10m ago', status: 'Urgent', color: '#1f2a56' },
        { id: 2, title: 'New policy feedback submitted', time: '2h ago', status: 'Pending', color: '#64748B' },
        { id: 3, title: 'Office repair completed', time: 'Yesterday', status: 'Fixed', color: '#475569' },
      ].map(item => (
        <div key={item.id} style={styles.feedItem}>
          <div style={{...styles.feedIcon, color: '#94A3B8'}}>
            <Icons.Clock />
          </div>
          <div style={styles.feedContent}>
            <p style={styles.feedTitle}>{item.title}</p>
            <p style={styles.feedTime}>{item.time}</p>
          </div>
          <span style={{...styles.feedTag, color: item.color, backgroundColor: '#F1F5F9'}}>
            {item.status}
          </span>
        </div>
      ))}
    </section>
  </div>
);

const CategorySelection = ({ onBack, onSelect }) => (
  <div style={styles.fadeIn}>
    <button onClick={onBack} style={styles.backBtn}>← Back</button>
    <h2 style={styles.pageTitle}>Choose Category</h2>
    <div style={styles.categoryStack}>
      {[
        { id: 'department', label: 'Department Feedback', icon: <Icons.Building /> },
        { id: 'individual', label: 'Individual Recognition', icon: <Icons.User /> },
        { id: 'general', label: 'General Suggestions', icon: <Icons.Message /> }
      ].map(cat => (
        <button key={cat.id} style={styles.categoryCard} onClick={() => onSelect(cat.id)}>
          <div style={{...styles.catIcon, color: '#1f2a56', backgroundColor: '#F1F5F9'}}>
            {cat.icon}
          </div>
          <span style={styles.catLabel}>{cat.label}</span>
          <span style={styles.catArrow}><Icons.ChevronRight /></span>
        </button>
      ))}
    </div>
  </div>
);

const styles = {
  hubContainer: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 },
  headerTitle: { fontSize: '14px', fontWeight: '800', color: '#1f2a56', textTransform: 'uppercase', letterSpacing: '1px' },
  iconBtn: { background: 'none', border: 'none', padding: '8px', cursor: 'pointer', position: 'relative' },
  notifDot: { position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', backgroundColor: '#1f2a56', borderRadius: '50%', border: '2px solid white' },
  
  mainScroll: { flex: 1, overflowY: 'auto', padding: '20px' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in-out' },

  welcomeSection: { marginBottom: '24px' },
  greeting: { fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 4px 0' },
  subGreeting: { fontSize: '14px', color: '#64748B', margin: 0 },

  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' },
  primaryAction: { backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer' },
  secondaryAction: { backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  actionIconBg: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: '14px', fontWeight: 'bold', color: '#1E293B' },

  sectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#1E293B', marginBottom: '12px' },
  statsRow: { display: 'flex', gap: '10px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' },
  statCard: { flex: 1, minWidth: '100px', backgroundColor: 'white', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #E2E8F0' },
  statNum: { fontSize: '20px', fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },

  feedHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  textBtn: { background: 'none', border: 'none', color: '#1f2a56', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
  feedList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  feedItem: { backgroundColor: 'white', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #E2E8F0' },
  feedIcon: { display: 'flex', alignItems: 'center' },
  feedContent: { flex: 1 },
  feedTitle: { fontSize: '14px', fontWeight: '600', color: '#1E293B', margin: 0 },
  feedTime: { fontSize: '12px', color: '#94A3B8', marginTop: '4px' },
  feedTag: { fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px' },

  backBtn: { background: 'none', border: 'none', color: '#1f2a56', fontWeight: 'bold', marginBottom: '16px', padding: 0, fontSize: '14px', cursor: 'pointer' },
  pageTitle: { fontSize: '22px', fontWeight: 'bold', color: '#0F172A', marginBottom: '20px', margin: '0 0 20px 0' },
  categoryStack: { display: 'flex', flexDirection: 'column', gap: '12px' },
  categoryCard: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0', cursor: 'pointer', textAlign: 'left' },
  catIcon: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' },
  catLabel: { flex: 1, fontSize: '15px', fontWeight: '600', color: '#1E293B' },
  catArrow: { color: '#94A3B8', display: 'flex', alignItems: 'center' },

  // Menu Overlay
  menuOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 100, backdropFilter: 'blur(4px)' },
  menuContent: { width: '280px', height: '100%', backgroundColor: 'white', display: 'flex', flexDirection: 'column' },
  menuHeader: { padding: '60px 24px 30px', backgroundColor: '#1f2a56', color: 'white' },
  avatarLarge: { width: '64px', height: '64px', borderRadius: '22px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', border: '2px solid white' },
  userName: { margin: 0, fontSize: '18px', fontWeight: 'bold' },
  userRole: { margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' },
  menuLinks: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  menuLink: { background: 'none', border: 'none', textAlign: 'left', padding: '12px', fontSize: '15px', fontWeight: '600', borderRadius: '12px', cursor: 'pointer' },

  // Notification Overlay & Drawer
  notifOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 100, backdropFilter: 'blur(4px)' },
  notifContent: { width: '300px', height: '100%', backgroundColor: 'white', display: 'flex', flexDirection: 'column', position: 'absolute', right: 0, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' },
  notifHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' },
  notifTitle: { margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0F172A' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' },
  notifList: { flex: 1, overflowY: 'auto', padding: '10px 0' },
  notifItem: { padding: '16px 20px', borderBottom: '1px solid #F1F5F9', position: 'relative', cursor: 'pointer' },
  notifIndicator: { position: 'absolute', left: '8px', top: '24px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1f2a56' },
  notifItemTitle: { margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#1E293B' },
  notifItemSub: { margin: '0 0 8px 0', fontSize: '13px', color: '#64748B', lineHeight: '1.4' },
  notifTime: { margin: 0, fontSize: '11px', color: '#94A3B8', fontWeight: '600' },
  notifFooter: { padding: '16px 20px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' },
  markReadBtn: { width: '100%', background: 'none', border: 'none', color: '#1f2a56', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }
};

export default FeedbackHub;