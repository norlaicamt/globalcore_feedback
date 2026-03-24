import React, { useState } from "react";

// --- PROFESSIONAL SVGs (Strict Navy/Grey Palette) ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Gear: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Role: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Chevron: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  CheckCircle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#1f2a56" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  Circle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
};

const ProfileSettings = ({ currentUser, onBack }) => {
  const [subView, setSubView] = useState("main");

  if (subView === "personal_info") return <PersonalInfoView currentUser={currentUser} onBack={() => setSubView("main")} />;
  if (subView === "role_management") return <RoleManagementView onBack={() => setSubView("main")} />;
  if (subView === "alert_prefs") return <AlertPreferencesView onBack={() => setSubView("main")} />;
  if (subView === "privacy_security") return <PrivacySecurityView onBack={() => setSubView("main")} />;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}>
          <Icons.Back />
        </button>
        <h1 style={styles.headerTitle}>Profile</h1>
        <button style={styles.iconBtn}>
          <Icons.Gear />
        </button>
      </header>

      <main style={styles.mainScroll}>
        <section style={styles.profileSection}>
          <div style={styles.avatarContainer}>
            <div style={styles.avatar}>{currentUser?.name?.charAt(0) || "U"}</div>
            <button style={styles.editBadge}><Icons.Edit /></button>
          </div>
          <h2 style={styles.userName}>{currentUser?.name || "Alex Johnson"}</h2>
          <div style={styles.roleBadges}>
            <span style={styles.badge}>Maker</span>
            <span style={styles.badge}>Recipient</span>
          </div>
        </section>

        <div style={styles.sectionWrapper}>
          <h3 style={styles.sectionLabel}>ACCOUNT SETTINGS</h3>
          <div style={styles.cardGroup}>
            <SettingItem icon={<Icons.User />} title="Personal Information" subtitle="Email, Phone, Address" onClick={() => setSubView("personal_info")} />
            <SettingItem icon={<Icons.Role />} title="Role Management" subtitle="Switch between Maker and Recipient" onClick={() => setSubView("role_management")} />
          </div>
        </div>

        <div style={styles.sectionWrapper}>
          <h3 style={styles.sectionLabel}>PREFERENCES</h3>
          <div style={styles.cardGroup}>
            <SettingItem icon={<Icons.Bell />} title="Alert Preferences" subtitle="Manage push and email alerts" onClick={() => setSubView("alert_prefs")} />
            <SettingItem icon={<Icons.Lock />} title="Privacy & Security" subtitle="Anonymous mode, Password, 2FA" onClick={() => setSubView("privacy_security")} />
          </div>
        </div>

        <p style={styles.versionText}>APP VERSION 2.4.1 (BUILD 890)</p>
      </main>
    </div>
  );
};

const PersonalInfoView = ({ currentUser, onBack }) => (
  <div style={styles.container}>
    <header style={styles.header}>
      <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
      <h1 style={styles.headerTitle}>Personal Info</h1>
      <div style={{ width: 24 }}></div>
    </header>

    <main style={styles.mainScroll}>
      <div style={styles.formGroup}><label style={styles.inputLabel}>Full Name</label><input type="text" style={styles.inputField} defaultValue={currentUser?.name || "Alex Johnson"} /></div>
      <div style={styles.formGroup}><label style={styles.inputLabel}>Username</label><input type="text" style={styles.inputField} defaultValue={currentUser?.username || "@alex_j"} /></div>
      <div style={styles.formGroup}><label style={styles.inputLabel}>Email Address</label><input type="email" style={styles.inputField} defaultValue={currentUser?.email || "alex.johnson@company.com"} /></div>
      <div style={styles.formGroup}><label style={styles.inputLabel}>Phone Number</label><input type="tel" style={styles.inputField} defaultValue={currentUser?.phone || "+63 917 123 4567"} /></div>
      <div style={styles.formGroup}><label style={styles.inputLabel}>Department / Office Address</label><input type="text" style={styles.inputField} defaultValue={currentUser?.department || "IT Department, Floor 3"} /></div>
      <button style={styles.saveBtn}>Save Changes</button>
    </main>
  </div>
);

const RoleManagementView = ({ onBack }) => {
  const [activeRole, setActiveRole] = useState("maker");

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>Role Management</h1>
        <div style={{ width: 24 }}></div>
      </header>

      <main style={styles.mainScroll}>
        <p style={styles.pageDescription}>Select your active workspace role. This changes the layout of your Command Center.</p>

        <div style={{...styles.roleCard, borderColor: activeRole === "maker" ? "#1f2a56" : "#E2E8F0", backgroundColor: activeRole === "maker" ? "#F8FAFC" : "white"}} onClick={() => setActiveRole("maker")}>
          <div style={styles.roleHeader}>
            <div style={{...styles.roleIconBox, backgroundColor: '#F1F5F9', color: '#1f2a56'}}><Icons.User /></div>
            <div style={styles.roleTitleBox}>
              <h3 style={styles.roleTitle}>Maker (Feedback Giver)</h3>
              <p style={styles.roleSubtitle}>Default account view</p>
            </div>
            {activeRole === "maker" ? <Icons.CheckCircle /> : <Icons.Circle />}
          </div>
          <p style={styles.roleDesc}>Submit reports, recognize colleagues, and track the status of feedback you have given to others.</p>
        </div>

        <div style={{...styles.roleCard, borderColor: activeRole === "recipient" ? "#1f2a56" : "#E2E8F0", backgroundColor: activeRole === "recipient" ? "#F8FAFC" : "white"}} onClick={() => setActiveRole("recipient")}>
          <div style={styles.roleHeader}>
            <div style={{...styles.roleIconBox, backgroundColor: '#F1F5F9', color: '#1f2a56'}}><Icons.Role /></div>
            <div style={styles.roleTitleBox}>
              <h3 style={styles.roleTitle}>Recipient (Manager)</h3>
              <p style={styles.roleSubtitle}>Requires admin privileges</p>
            </div>
            {activeRole === "recipient" ? <Icons.CheckCircle /> : <Icons.Circle />}
          </div>
          <p style={styles.roleDesc}>Review incoming feedback for your department, resolve open tickets, and reply to users.</p>
        </div>
        <button style={styles.saveBtn}>Apply Role Change</button>
      </main>
    </div>
  );
};

const AlertPreferencesView = ({ onBack }) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [newReplies, setNewReplies] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>Alerts</h1>
        <div style={{ width: 24 }}></div>
      </header>
      <main style={styles.mainScroll}>
        <p style={styles.pageDescription}>Choose how and when you want to be notified about your feedback activity.</p>
        
        <h3 style={styles.sectionLabel}>DELIVERY METHODS</h3>
        <div style={styles.cardGroup}>
          <ToggleRow title="Push Notifications" subtitle="Receive alerts on your mobile device" isOn={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />
          <ToggleRow title="Email Notifications" subtitle="Receive updates to your company email" isOn={emailEnabled} onToggle={() => setEmailEnabled(!emailEnabled)} />
        </div>

        <h3 style={{...styles.sectionLabel, marginTop: '24px'}}>NOTIFY ME WHEN...</h3>
        <div style={styles.cardGroup}>
          <ToggleRow title="Status Changes" subtitle="A report you made is marked resolved or active" isOn={statusUpdates} onToggle={() => setStatusUpdates(!statusUpdates)} />
          <ToggleRow title="New Replies" subtitle="Someone comments on your feedback thread" isOn={newReplies} onToggle={() => setNewReplies(!newReplies)} />
          <ToggleRow title="Weekly Digest" subtitle="A summary of department activity every Friday" isOn={weeklyDigest} onToggle={() => setWeeklyDigest(!weeklyDigest)} />
        </div>
      </main>
    </div>
  );
};

const PrivacySecurityView = ({ onBack }) => {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [biometrics, setBiometrics] = useState(true);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>Privacy & Security</h1>
        <div style={{ width: 24 }}></div>
      </header>
      <main style={styles.mainScroll}>
        
        <h3 style={styles.sectionLabel}>PRIVACY</h3>
        <div style={styles.cardGroup}>
          <ToggleRow 
            title="Anonymous Mode" 
            subtitle="Hide your identity when submitting general feedback" 
            isOn={isAnonymous} 
            onToggle={() => setIsAnonymous(!isAnonymous)} 
            highlight={true}
          />
          <ToggleRow title="Show Activity Status" subtitle="Let others see when you are online" isOn={showStatus} onToggle={() => setShowStatus(!showStatus)} />
        </div>

        <h3 style={{...styles.sectionLabel, marginTop: '24px'}}>SECURITY</h3>
        <div style={styles.cardGroup}>
          <SettingItem icon={<Icons.Lock />} title="Change Password" subtitle="Last updated 3 months ago" onClick={() => alert("Change password flow")} />
          <SettingItem icon={<Icons.Shield />} title="Two-Factor Authentication" subtitle="Add an extra layer of security" onClick={() => alert("2FA Setup")} />
          <ToggleRow title="Biometric Login" subtitle="Use Face ID / Touch ID to open the app" isOn={biometrics} onToggle={() => setBiometrics(!biometrics)} />
        </div>
      </main>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const SettingItem = ({ icon, title, subtitle, onClick }) => (
  <button style={styles.settingItem} onClick={onClick}>
    <div style={styles.iconWrapper}>{icon}</div>
    <div style={styles.itemText}>
      <p style={styles.itemTitle}>{title}</p>
      <p style={styles.itemSubtitle}>{subtitle}</p>
    </div>
    <Icons.Chevron />
  </button>
);

const ToggleRow = ({ title, subtitle, isOn, onToggle, highlight }) => (
  <div style={styles.toggleRowContainer}>
    <div style={styles.itemText}>
      <p style={{...styles.itemTitle, color: highlight && isOn ? '#10B981' : '#1E293B'}}>{title}</p>
      <p style={styles.itemSubtitle}>{subtitle}</p>
    </div>
    <div 
      style={{...styles.toggleBg, backgroundColor: isOn ? '#10B981' : '#E2E8F0'}} 
      onClick={onToggle}
    >
      <div style={{...styles.toggleCircle, transform: isOn ? 'translateX(20px)' : 'translateX(2px)'}} />
    </div>
  </div>
);

// --- STYLES ---
const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: '18px', fontWeight: 'bold', color: '#1f2a56', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  
  mainScroll: { flex: 1, overflowY: 'auto', padding: '0 20px 40px 20px' },
  
  profileSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' },
  avatarContainer: { position: 'relative', marginBottom: '16px' },
  avatar: { width: '88px', height: '88px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#64748B', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  editBadge: { position: 'absolute', bottom: '0', right: '0', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1f2a56', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  userName: { fontSize: '22px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 10px 0' },
  roleBadges: { display: 'flex', gap: '8px' },
  badge: { backgroundColor: '#F1F5F9', color: '#1f2a56', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },

  sectionWrapper: { marginBottom: '24px' },
  sectionLabel: { fontSize: '11px', fontWeight: 'bold', color: '#94A3B8', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '4px' },
  cardGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  
  settingItem: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background-color 0.2s' },
  iconWrapper: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F1F5F9', color: '#1f2a56', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' },
  
  itemText: { flex: 1, paddingRight: '16px' },
  itemTitle: { fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: '0 0 4px 0' },
  itemSubtitle: { fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: '1.4' },

  versionText: { textAlign: 'center', fontSize: '11px', color: '#CBD5E1', fontWeight: '600', marginTop: '30px' },
  pageDescription: { fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '24px' },

  formGroup: { marginBottom: '16px' },
  inputLabel: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748B', marginBottom: '8px', paddingLeft: '4px' },
  inputField: { width: '100%', padding: '16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '15px', color: '#0F172A', boxSizing: 'border-box', outline: 'none' },
  saveBtn: { width: '100%', padding: '16px', backgroundColor: '#1f2a56', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31, 42, 86, 0.2)' },

  roleCard: { padding: '20px', borderRadius: '16px', border: '2px solid', marginBottom: '16px', cursor: 'pointer', transition: 'all 0.2s ease' },
  roleHeader: { display: 'flex', alignItems: 'center', marginBottom: '12px' },
  roleIconBox: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' },
  roleTitleBox: { flex: 1 },
  roleTitle: { margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#0F172A' },
  roleSubtitle: { margin: 0, fontSize: '12px', color: '#64748B', fontWeight: '600' },
  roleDesc: { margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' },

  toggleRowContainer: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', justifyContent: 'space-between' },
  toggleBg: { width: '46px', height: '26px', borderRadius: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.3s ease' },
  toggleCircle: { width: '22px', height: '22px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
};

export default ProfileSettings;