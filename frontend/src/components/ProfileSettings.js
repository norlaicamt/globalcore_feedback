import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import { deleteUser, updateUser, getUserById } from "../services/api";

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
  Circle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
};

const ProfileSettings = ({ currentUser, onBack, onLogout, onUserUpdate }) => {
  const [subView, setSubView] = useState("main");
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = React.useRef(null);

  const [impactPoints, setImpactPoints] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const fetchImpact = async () => {
      if (!currentUser?.id) return;
      try {
        const stats = await getUserById(currentUser.id);
        setImpactPoints(stats.impact_points);
        setPostsCount(stats.posts_count);
        setLikesCount(stats.likes_received);
      } catch(e) { console.error("Error fetching impact points", e); }
    };
    fetchImpact();
  }, [currentUser]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size < 500000) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const updated = await updateUser(currentUser.id, { avatar_url: reader.result });
          if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated, avatar_url: reader.result });
          showToast("Profile picture updated!");
        } catch (err) { 
          const exact = err.response ? err.response.data?.detail || err.message : err.message;
          showToast(`Upload Failed (${err.response?.status || 'Network'}): ${typeof exact === 'string' ? exact : JSON.stringify(exact)}`); 
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        try {
          const updated = await updateUser(currentUser.id, { avatar_url: base64 });
          if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated, avatar_url: base64 });
          showToast("Profile picture updated!");
        } catch (err) { 
          const exact = err.response ? err.response.data?.detail || err.message : err.message;
          showToast(`Upload Failed (${err.response?.status || 'Network'}): ${typeof exact === 'string' ? exact : JSON.stringify(exact)}`); 
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const renderView = () => {
    if (subView === "personal_info") return <PersonalInfoView currentUser={currentUser} onBack={() => setSubView("main")} showToast={showToast} onUserUpdate={onUserUpdate} />;
    if (subView === "alert_prefs") return <AlertPreferencesView currentUser={currentUser} onBack={() => setSubView("main")} showToast={showToast} onUserUpdate={onUserUpdate} />;
    if (subView === "privacy_security") return <PrivacySecurityView currentUser={currentUser} onBack={() => setSubView("main")} onLogout={onLogout} showToast={showToast} onUserUpdate={onUserUpdate} />;

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
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="avatar" style={{...styles.avatar, objectFit: 'cover'}} />
              ) : (
                <div style={styles.avatar}>{currentUser?.name?.charAt(0) || "U"}</div>
              )}
              <button style={styles.editBadge} onClick={() => fileInputRef.current?.click()}><Icons.Edit /></button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload} />
           </div>
           {Number(impactPoints) >= 200 && (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px', color: '#1f2a56', background: '#E0E7FF', padding: '4px 10px', borderRadius: '12px', width: 'fit-content', margin: '8px auto 0' }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
               <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Certified</span>
             </div>
           )}
          <h2 style={{ ...styles.userName, marginTop: Number(impactPoints) >= 200 ? '12px' : '16px' }}>{currentUser?.name || ""}</h2>
        </section>

        <div style={styles.sectionWrapper}>
          <h3 style={styles.sectionLabel}>ACCOUNT SETTINGS</h3>
          <div style={styles.cardGroup}>
            <SettingItem icon={<Icons.User />} title="Personal Information" subtitle="Email, Phone, Address" onClick={() => setSubView("personal_info")} />
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

  return (
    <>
      {renderView()}
      {toastMessage && (
        <div style={styles.toastModal}>
          {toastMessage}
        </div>
      )}
    </>
  );
};

const PersonalInfoView = ({ currentUser, onBack, showToast, onUserUpdate }) => {
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [department, setDepartment] = useState(currentUser?.department || "");
  const [username, setUsername] = useState(currentUser?.username || "");

  const handleSave = async () => {
    try {
      const updated = await updateUser(currentUser.id, { name, email, phone, department, username });
      // Merge server response with existing - ensures all fields (id, role, etc.) preserved
      const merged = { ...currentUser, ...updated };
      if (onUserUpdate) onUserUpdate(merged);
      showToast("Personal Information saved");
      onBack();
    } catch (err) {
      showToast("Failed to save. Make sure you are logged in.");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>Personal Info</h1>
        <div style={{ width: 24 }}></div>
      </header>
      <main style={styles.mainScroll}>
        <div style={styles.formGroup}><label style={styles.inputLabel}>Full Name</label><input type="text" style={styles.inputField} value={name} onChange={e => setName(e.target.value)} /></div>
        <div style={styles.formGroup}><label style={styles.inputLabel}>Username</label><input type="text" style={styles.inputField} value={username} onChange={e => setUsername(e.target.value)} /></div>
        <div style={styles.formGroup}><label style={styles.inputLabel}>Email Address</label><input type="email" style={styles.inputField} value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div style={styles.formGroup}><label style={styles.inputLabel}>Phone Number</label><input type="tel" style={styles.inputField} value={phone} onChange={e => setPhone(e.target.value)} /></div>
        <div style={styles.formGroup}><label style={styles.inputLabel}>Department / Office</label><input type="text" style={styles.inputField} value={department} onChange={e => setDepartment(e.target.value)} /></div>
        <button style={styles.saveBtn} onClick={handleSave}>Save Changes</button>
      </main>
    </div>
  );
};

 
const AlertPreferencesView = ({ currentUser, onBack, showToast, onUserUpdate }) => {
  const [pushEnabled, setPushEnabled] = useState(currentUser?.push_notifications ?? true);
  const [emailEnabled, setEmailEnabled] = useState(currentUser?.email_notifications ?? false);
  const [statusUpdates, setStatusUpdates] = useState(currentUser?.status_updates ?? true);
  const [newReplies, setNewReplies] = useState(currentUser?.reply_notifications ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(currentUser?.weekly_digest ?? false);

  const handleToggle = async (field, currentVal, setter, label) => {
    const next = !currentVal;
    try {
      const updated = await updateUser(currentUser.id, { [field]: next });
      setter(next);
      if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated });
      showToast(`${label} updated`);
    } catch {
      showToast(`Failed to update ${label}`);
    }
  };

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
          <ToggleRow title="Push Notifications" subtitle="Receive alerts on your mobile device" isOn={pushEnabled} onToggle={() => handleToggle("push_notifications", pushEnabled, setPushEnabled, "Push Notifications")} />
          <ToggleRow title="Email Notifications" subtitle="Receive updates to your company email" isOn={emailEnabled} onToggle={() => handleToggle("email_notifications", emailEnabled, setEmailEnabled, "Email Notifications")} />
        </div>

        <h3 style={{...styles.sectionLabel, marginTop: '24px'}}>NOTIFY ME WHEN...</h3>
        <div style={styles.cardGroup}>
          <ToggleRow title="Status Changes" subtitle="A report you made is marked resolved or active" isOn={statusUpdates} onToggle={() => handleToggle("status_updates", statusUpdates, setStatusUpdates, "Status Updates")} />
          <ToggleRow title="New Replies" subtitle="Someone comments on your feedback thread" isOn={newReplies} onToggle={() => handleToggle("reply_notifications", newReplies, setNewReplies, "Reply Notifications")} />
          <ToggleRow title="Weekly Digest" subtitle="A summary of department activity every Friday" isOn={weeklyDigest} onToggle={() => handleToggle("weekly_digest", weeklyDigest, setWeeklyDigest, "Weekly Digest")} />
        </div>
      </main>
    </div>
  );
};

const PrivacySecurityView = ({ currentUser, onBack, onLogout, showToast, onUserUpdate }) => {
  const [showStatus, setShowStatus] = useState(currentUser?.show_activity_status ?? true);
  const [biometrics, setBiometrics] = useState(currentUser?.biometrics_enabled ?? true);
  const [twoFA, setTwoFA] = useState(currentUser?.two_factor_enabled || false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteCountdown, setDeleteCountdown] = useState(5);
  const [deleteTimerStarted, setDeleteTimerStarted] = useState(false);

  const startDeleteTimer = () => {
    setDeleteCountdown(5);
    setDeleteTimerStarted(true);
    const interval = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleToggleActivityStatus = async () => {
    const next = !showStatus;
    try {
      const updated = await updateUser(currentUser.id, { show_activity_status: next });
      setShowStatus(next);
      if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated });
      showToast(next ? "Activity Status is now Visible" : "Activity Status Hidden");
    } catch { showToast("Failed to update activity status"); }
  };

  const handleToggle2FA = async () => {
    const next = !twoFA;
    try {
      const updated = await updateUser(currentUser.id, { two_factor_enabled: next });
      setTwoFA(next);
      if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated });
      showToast(next ? "Two-Factor Authentication Enabled" : "Two-Factor Authentication Disabled");
    } catch { showToast("Failed to update 2FA"); }
  };

  const handleToggleBiometrics = async () => {
    const next = !biometrics;
    try {
      const updated = await updateUser(currentUser.id, { biometrics_enabled: next });
      setBiometrics(next);
      if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated });
      showToast(next ? "Biometric Login Enabled" : "Biometric Login Disabled");
    } catch { showToast("Failed to update biometrics"); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) { showToast("Please fill both fields"); return; }
    const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (stored.password && stored.password !== oldPassword) {
      showToast("Current password is incorrect"); return;
    }
    try {
      const updated = await updateUser(currentUser.id, { password: newPassword });
      if (onUserUpdate) onUserUpdate({ ...currentUser, password: newPassword });
      showToast("Password changed successfully!");
      setShowPasswordForm(false);
      setOldPassword(""); setNewPassword("");
    } catch { showToast("Failed to change password"); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { showToast("Please enter your password to confirm"); return; }
    const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (stored.password && stored.password !== deletePassword) {
      showToast("Incorrect password"); return;
    }
    try {
      if (currentUser?.id) await deleteUser(currentUser.id);
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      if (onLogout) onLogout();
      else window.location.reload();
    } catch (err) {
      showToast("Failed to delete account");
    }
  };

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
          <ToggleRow title="Show Activity Status" subtitle={showStatus ? "Online — others can see you are active" : "Hidden — your status is private"} isOn={showStatus} onToggle={handleToggleActivityStatus} />
        </div>

        <h3 style={{...styles.sectionLabel, marginTop: '24px'}}>SECURITY</h3>
        <div style={styles.cardGroup}>
          <SettingItem icon={<Icons.Lock />} title="Change Password" subtitle={showPasswordForm ? "Enter your details below" : "Click to update your password"} onClick={() => setShowPasswordForm(!showPasswordForm)} />
          {showPasswordForm && (
            <div style={{padding: '16px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <input type="password" placeholder="Current Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={{...styles.inputField, padding: '12px'}} />
              <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{...styles.inputField, padding: '12px'}} />
              <button style={{...styles.saveBtn, marginTop: 0, padding: '12px'}} onClick={handleChangePassword}>Update Password</button>
            </div>
          )}
          <ToggleRow title="Two-Factor Authentication" subtitle={twoFA ? "2FA is Active — your account is protected" : "Enable for extra security"} isOn={twoFA} onToggle={handleToggle2FA} />
          <ToggleRow title="Biometric Login" subtitle="Use Face ID / Touch ID to open the app" isOn={biometrics} onToggle={handleToggleBiometrics} />
        </div>

        <h3 style={{...styles.sectionLabel, marginTop: '32px', color: '#EF4444'}}>DANGER ZONE</h3>
        <div style={{...styles.cardGroup, backgroundColor: '#FEF2F2', padding: '16px', borderRadius: '16px', border: '1px solid #FEE2E2', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <p style={{fontSize: '14px', color: '#991B1B', margin: 0, fontWeight: '500'}}>
            Deleting your account is permanent. All your data will be erased and cannot be recovered.
          </p>
          {!showDeleteConfirm ? (
            <button style={{backgroundColor: '#EF4444', color: 'white', padding: '12px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'}} 
              onClick={() => { setShowDeleteConfirm(true); startDeleteTimer(); }}>
              Delete Account
            </button>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                style={{...styles.inputField, padding: '12px', border: '2px solid #FCA5A5'}}
              />
              <div style={{display: 'flex', gap: '10px'}}>
                <button
                  style={{flex: 1, backgroundColor: '#E2E8F0', color: '#475569', padding: '12px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'}}
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteTimerStarted(false); setDeleteCountdown(5); }}>
                  Cancel
                </button>
                <button
                  disabled={deleteCountdown > 0}
                  onClick={handleDeleteAccount}
                  style={{flex: 1, backgroundColor: deleteCountdown > 0 ? '#FCA5A5' : '#EF4444', color: 'white', padding: '12px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: deleteCountdown > 0 ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s'}}>
                  {deleteCountdown > 0 ? `Confirm (${deleteCountdown}s)` : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
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
      <p style={{...styles.itemTitle, color: highlight && isOn ? '#1f2a56' : '#1E293B'}}>{title}</p>
      <p style={styles.itemSubtitle}>{subtitle}</p>
    </div>
    <div 
      style={{...styles.toggleBg, backgroundColor: isOn ? '#1f2a56' : '#E2E8F0', position: 'relative'}} 
      onClick={onToggle}
    >
      <span style={{position: 'absolute', fontSize: '10px', fontWeight: 'bold', color: 'white', left: isOn ? '6px' : '22px', transition: 'all 0.3s ease', userSelect: 'none'}}>
        {isOn ? 'ON' : 'OFF'}
      </span>
      <div style={{...styles.toggleCircle, transform: isOn ? 'translateX(24px)' : 'translateX(2px)'}} />
    </div>
  </div>
);

// --- STYLES ---
const statsCard = { flex: 1, background: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const statsValue = { fontSize: '24px', fontWeight: '900', color: '#1f2a56', display: 'block' };
const statsLabel = { fontSize: '10px', fontWeight: '800', color: '#94A3B8', letterSpacing: '0.05em', marginTop: '4px' };

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', backgroundColor: '#F8FAFC', flexShrink: 0, maxWidth: '800px', margin: '0 auto', width: '100%', borderBottom: '1px solid #F1F5F9' },
  headerTitle: { fontSize: '16px', fontWeight: '800', color: '#1f2a56', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#1f2a56' },
  
  mainScroll: { flex: 1, overflowY: 'auto', padding: '16px', maxWidth: '800px', margin: '0 auto', width: '100%' },
  
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
  toggleBg: { width: '50px', height: '26px', borderRadius: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.3s ease' },
  toggleCircle: { width: '22px', height: '22px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  toastModal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '16px 24px', backgroundColor: '#1f2a56', color: 'white', fontWeight: 'bold', fontSize: '15px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999, animation: 'fadeIn 0.2s ease-out', pointerEvents: 'none'}
};

export default ProfileSettings;