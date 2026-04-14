import React, { useState, useEffect } from "react";
import { adminGetProfile, adminUpdateProfile, getSystemLabels, updateSystemLabelsBulk, adminGetProfileActivity, getAdminSettings, updateAdminSetting } from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import { STORAGE_KEYS } from "../../../utils/storage";

const ToggleRow = ({ title, description, checked, onChange, loading, theme, darkMode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${theme.border}`, opacity: loading ? 0.6 : 1 }}>
    <div style={{ flex: 1, paddingRight: "16px" }}>
      <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: theme.text }}>{title}</p>
      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: theme.textMuted }}>{description}</p>
    </div>
    <div onClick={loading ? null : onChange} style={{
      width: "40px", height: "22px", borderRadius: "11px", padding: "2px",
      background: checked ? "var(--primary-color)" : (darkMode ? "rgba(255,255,255,0.1)" : "#E2E8F0"), cursor: loading ? "wait" : "pointer", transition: "background 0.2s",
      display: "flex", alignItems: "center", flexShrink: 0
    }}>
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%", background: "white",
        transition: "transform 0.2s", transform: checked ? "translateX(18px)" : "translateX(0)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
      }} />
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, children, theme }) => (
  <div style={{ background: theme.surface, borderRadius: "12px", padding: "20px 24px", border: `1px solid ${theme.border}`, marginBottom: "16px" }}>
    <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "800", color: theme.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
    {subtitle && <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: theme.textMuted }}>{subtitle}</p>}
    {children}
  </div>
);

const AdminSettings = ({ theme, darkMode, adminUser, onNavigate, onToggleTheme, onAdminUpdate }) => {
  const { labels, refreshLabels, getLabel, systemName } = useTerminology();
  const isGlobalCoreAdmin = (adminUser?.email || "").toLowerCase() === "admin@globalcore.com";
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState({ allow_voice: true, public_feed: true, email_notifications: false, status_notifications: true });
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [language, setLanguage] = useState(localStorage.getItem(STORAGE_KEYS.ADMIN_LANGUAGE) || "English");
  const [defaultView, setDefaultView] = useState(localStorage.getItem(STORAGE_KEYS.ADMIN_DEFAULT_VIEW) || "dashboard");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [form, setForm] = useState({
    name: "",
    avatar_url: "",
    password: "",
    two_factor_enabled: false,
    push_notifications: true,
    email_notifications: false,
    status_updates: true,
    reply_notifications: true,
    weekly_digest: false,
    biometrics_enabled: true,
    position_title: "",
    unit_name: "",
    phone: "",
  });
  
  const [recentActions, setRecentActions] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [termForm, setTermForm] = useState({
    category_label: "",
    category_label_plural: "",
    entity_label: "",
    entity_label_plural: "",
    feedback_label: "",
    feedback_label_plural: "",
  });
  const [termSaving, setTermSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [sysSettings, profileData] = await Promise.all([
          getAdminSettings().catch(() => []),
          adminGetProfile()
        ]);
        if (sysSettings?.length) {
          const mapped = {};
          sysSettings.forEach(s => {
            // Check if it looks like a boolean, otherwise store as string
            mapped[s.key] = (s.value === "true" || s.value === "false") ? (s.value === "true") : s.value;
          });
          setSettings(prev => ({ ...prev, ...mapped }));
        }
        setProfile(profileData);
        setForm(prev => ({
          ...prev,
          name: profileData.name || "",
          avatar_url: profileData.avatar_url || "",
          two_factor_enabled: !!profileData.two_factor_enabled,
          push_notifications: !!profileData.push_notifications,
          email_notifications: !!profileData.email_notifications,
          status_updates: !!profileData.status_updates,
          reply_notifications: !!profileData.reply_notifications,
          weekly_digest: !!profileData.weekly_digest,
          position_title: profileData.position_title || "",
          unit_name: profileData.unit_name || "",
          phone: profileData.phone || "",
        }));
        setTermForm({
          category_label: labels.category_label || "Category",
          category_label_plural: labels.category_label_plural || "Categories",
          entity_label: labels.entity_label || "Establishment/Service",
          entity_label_plural: labels.entity_label_plural || "Establishments/Services",
          dept_label: labels.dept_label || "Department",
          dept_label_plural: labels.dept_label_plural || "Departments",
          feedback_label: labels.feedback_label || "Feedback",
          feedback_label_plural: labels.feedback_label_plural || "Feedbacks",
        });
      } catch (e) {
        console.error("Failed to load settings/profile", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [labels]);

  useEffect(() => {
    if (activeTab === "activity" && profile) {
      setActivityLoading(true);
      adminGetProfileActivity(5)
        .then(res => setRecentActions(res))
        .catch(err => console.error("Failed to load activity", err))
        .finally(() => setActivityLoading(false));
    }
  }, [activeTab, profile]);

  const handleToggle = async (key) => {
    if (!isGlobalCoreAdmin) return;
    const newValue = !settings[key];
    setUpdatingKey(key);
    try {
      await updateAdminSetting(key, String(newValue));
      setSettings(prev => ({ ...prev, [key]: newValue }));
      setSuccessMsg(`System setting "${key.replace(/_/g, " ")}" updated.`);
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to update system setting.");
    } finally {
      setUpdatingKey(null);
    }
  };

  // Convert hex to RGB string for rgba() usage
  const hexToRgb = (hex) => {
    if (!hex || !hex.startsWith('#')) return "31, 42, 86";
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    if (hex.length !== 6) return "31, 42, 86";
    return `${parseInt(hex.substring(0,2),16)}, ${parseInt(hex.substring(2,4),16)}, ${parseInt(hex.substring(4,6),16)}`;
  };

  const handleBrandingUpdate = async () => {
    setUpdatingKey("branding");
    try {
      if (settings.primary_organization_name) {
        await updateAdminSetting("primary_organization_name", settings.primary_organization_name);
      }
      if (settings.primary_color) {
        await updateAdminSetting("primary_color", settings.primary_color);
        // Apply both CSS variables live — no page refresh needed
        const root = document.documentElement;
        root.style.setProperty('--primary-color', settings.primary_color);
        root.style.setProperty('--primary-rgb', hexToRgb(settings.primary_color));
      }
      setSuccessMsg("✅ System branding updated. Colors applied live.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to update branding.");
    } finally {
      setUpdatingKey(null);
    }
  };

  const saveProfile = async (updates) => {
    setProfileSaving(true);
    setSuccessMsg("");
    try {
      await adminUpdateProfile(updates);
      const refreshed = await adminGetProfile();
      setProfile(refreshed);
      if (onAdminUpdate) onAdminUpdate(refreshed);
      setSuccessMsg("Profile settings updated.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      avatar_url: form.avatar_url || null,
      position_title: form.position_title || null,
      unit_name: form.unit_name || null,
      phone: form.phone || null,
      ...(form.password ? { password: form.password } : {}),
      two_factor_enabled: form.two_factor_enabled
    };
    await saveProfile(payload);
    setIsEditingProfile(false);
    setForm(prev => ({ ...prev, password: "" }));
  };

  const handleNotificationSave = async () => {
    await saveProfile({
      push_notifications: form.push_notifications,
      email_notifications: form.email_notifications,
      status_updates: form.status_updates,
      reply_notifications: form.reply_notifications,
      weekly_digest: form.weekly_digest,
    });
  };

  const saveDisplayPrefs = () => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_LANGUAGE, language);
    localStorage.setItem(STORAGE_KEYS.ADMIN_DEFAULT_VIEW, defaultView);
    localStorage.setItem(STORAGE_KEYS.ADMIN_VIEW, defaultView);
    setSuccessMsg("Display preferences saved.");
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const saveTerminology = async () => {
    setTermSaving(true);
    setSuccessMsg("");
    try {
      await updateSystemLabelsBulk(termForm);
      await refreshLabels();
      setSuccessMsg("Terminology updated successfully.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (e) {
      console.error(e);
      alert("Failed to update terminology.");
    } finally {
      setTermSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "notifs", label: "Notifications" },
    { id: "display", label: "Display" },
    { id: "activity", label: "Activity" },
  ];
  if (isGlobalCoreAdmin) {
    tabs.push({ id: "terminology", label: "Terminology" });
    tabs.push({ id: "system", label: "Global Config" });
  }

  const inputStyle = { padding: "10px 14px", border: `1.5px solid ${theme.border}`, borderRadius: "8px", fontSize: "13px", outline: "none", fontFamily: "inherit", background: theme.bg, color: theme.text, width: "100%", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "11px", fontWeight: "700", color: theme.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800", color: theme.text }}>Admin Profile Settings</h2>
        <p style={{ margin: 0, fontSize: "13px", color: theme.textMuted }}>Manage your profile, security, notifications, and personal admin workspace.</p>
      </div>
      {successMsg && <div style={{ padding: "10px 12px", marginBottom: 14, borderRadius: "8px", background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 600, fontSize: 13 }}>{successMsg}</div>}

      <div style={{ borderBottom: `1px solid ${theme.border}`, marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: "none", border: "none", padding: "12px 4px", fontSize: "13px", fontWeight: activeTab === tab.id ? "700" : "600", color: activeTab === tab.id ? "var(--primary-color)" : theme.textMuted, borderBottom: `2.5px solid ${activeTab === tab.id ? "var(--primary-color)" : "transparent"}`, cursor: "pointer", fontFamily: "inherit" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <SectionCard theme={theme} title="Admin Identity" subtitle="Manage your core identity and organizational context.">
          {loading || !profile ? <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading profile...</div> : (
            <>
              {!isEditingProfile ? (
                <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
                  <div style={{ position: "relative" }}>
                    {profile.avatar_url 
                      ? <img src={profile.avatar_url} alt={profile.name} style={{ width: "110px", height: "110px", borderRadius: "20px", objectFit: "cover", border: `2px solid ${theme.border}` }} />
                      : <div style={{ width: "110px", height: "110px", borderRadius: "20px", background: "var(--primary-color)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", fontWeight: "800" }}>{profile.name?.charAt(0)}</div>}
                    {profile.profile_completed && (
                       <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#10B981', border: '3px solid white', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                       </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "800", color: theme.text }}>
                          {profile.position_title || (isGlobalCoreAdmin ? "Head Admin" : (profile.role || "Admin"))}
                          {isGlobalCoreAdmin && !profile.position_title && <span style={{ marginLeft: 8, fontSize: '10px', background: '#9333ea', color: 'white', padding: '2px 8px', borderRadius: '4px', verticalAlign: 'middle' }}>Head Admin</span>}
                        </h3>
                        <p style={{ margin: 0, fontSize: "13px", color: theme.textMuted }}>{profile.email}</p>
                      </div>
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        style={{ padding: "8px 16px", background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                      >
                        Edit Profile Details
                      </button>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
                      <div>
                        <label style={labelStyle}>Position / Title</label>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: theme.text }}>{profile.position_title || "—"}</p>
                      </div>
                      <div>
                        <label style={labelStyle}>{getLabel("category_label", "Unit Type")}</label>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: theme.text }}>{profile.unit_name || "—"}</p>
                      </div>
                      <div>
                        <label style={labelStyle}>Organization</label>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: theme.text }}>{systemName}</p>
                      </div>
                      <div>
                        <label style={labelStyle}>Contact Number</label>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: theme.text }}>{profile.phone || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileSave}>
                   {/* 🧩 1. Basic Information */}
                   <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧩 1. Basic Information</p>
                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: '24px' }}>
                    <div style={{ gridColumn: '1 / span 2' }}>
                      <label style={labelStyle}>Full Name</label>
                      <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address (Read-only)</label>
                      <input value={profile.email || ""} disabled style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Position / Title</label>
                      <input value={form.position_title} onChange={e => setForm(prev => ({ ...prev, position_title: e.target.value }))} style={inputStyle} placeholder="e.g. Program Officer" />
                    </div>
                  </div>

                  {/* 🧩 2. Organization Context */}
                  <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧩 2. Organization Context</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: '24px' }}>
                    <div>
                      <label style={labelStyle}>Organization Name (Read-only)</label>
                      <input value={settings.primary_organization_name || systemName} disabled style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>{getLabel("category_label", "Unit/Program")}</label>
                      <input value={form.unit_name} onChange={e => setForm(prev => ({ ...prev, unit_name: e.target.value }))} style={inputStyle} placeholder={`e.g. ${getLabel("category_label", "Internal")}`} />
                    </div>
                  </div>

                  {/* 🧩 3. Contact Information */}
                  <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧩 3. Contact Information</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: '24px' }}>
                    <div style={{ gridColumn: '1 / span 2' }}>
                      <label style={labelStyle}>Contact Number</label>
                      <input value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} placeholder="+63 9xx xxx xxxx" />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", borderTop: `1px solid ${theme.border}`, paddingTop: '20px' }}>
                    <button type="submit" disabled={profileSaving} style={{ padding: "10px 24px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                      {profileSaving ? "Saving..." : "Verify & Save Profile"}
                    </button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} style={{ padding: "10px 24px", background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </SectionCard>
      )}

      {activeTab === "security" && (
        <SectionCard theme={theme} title="Account Security" subtitle="Protect admin access credentials.">
          <div style={{ maxWidth: 460 }}>
            <label style={labelStyle}>Change Password</label>
            <input type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} style={inputStyle} placeholder="Enter new password" />
            <div style={{ marginTop: 14 }}>
              <ToggleRow title="Two-Factor Authentication" description="Add second verification step on sign-in." checked={form.two_factor_enabled} onChange={() => setForm(prev => ({ ...prev, two_factor_enabled: !prev.two_factor_enabled }))} loading={profileSaving} theme={theme} darkMode={darkMode} />
            </div>
            <div style={{ marginTop: 14, padding: "12px", border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, color: theme.textMuted }}>
              Active Sessions: Current device only (multi-session management coming soon).
            </div>
            <button onClick={() => saveProfile({ ...(form.password ? { password: form.password } : {}), two_factor_enabled: form.two_factor_enabled })} style={{ marginTop: 12, padding: "10px 16px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save Security</button>
          </div>
        </SectionCard>
      )}

      {activeTab === "notifs" && (
        <SectionCard theme={theme} title="Notification Preferences" subtitle="Control alerts and summaries.">
          <ToggleRow title="Email on New Feedback" description="Receive email when new feedback arrives." checked={form.email_notifications} onChange={() => setForm(prev => ({ ...prev, email_notifications: !prev.email_notifications }))} theme={theme} darkMode={darkMode} />
          <ToggleRow title="Email on Assigned Feedback" description="Receive updates on assigned actions." checked={form.status_updates} onChange={() => setForm(prev => ({ ...prev, status_updates: !prev.status_updates }))} theme={theme} darkMode={darkMode} />
          <ToggleRow title="Broadcast Alerts" description="Get urgent broadcast notices." checked={form.push_notifications} onChange={() => setForm(prev => ({ ...prev, push_notifications: !prev.push_notifications }))} theme={theme} darkMode={darkMode} />
          <ToggleRow title="Daily / Weekly Summary" description="Receive digest emails." checked={form.weekly_digest} onChange={() => setForm(prev => ({ ...prev, weekly_digest: !prev.weekly_digest }))} theme={theme} darkMode={darkMode} />
          <button onClick={handleNotificationSave} style={{ marginTop: 14, padding: "10px 16px", background: "var(--primary-color)", color: "#fff", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save Notification Preferences</button>
        </SectionCard>
      )}

      {activeTab === "display" && (
        <SectionCard theme={theme} title="System Configuration" subtitle="System-wide and terminal preferences.">
             {isGlobalCoreAdmin && (
               <div style={{ marginBottom: 24, padding: 16, background: 'rgba(var(--primary-rgb),0.05)', borderRadius: 12, border: '1px solid rgba(var(--primary-rgb),0.12)' }}>
                 <p style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 700, color: 'var(--primary-color)' }}>TERMINOLOGY & LABELS</p>
                 <button onClick={() => setActiveTab("terminology")} style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Manage Industry Labels</button>
               </div>
             )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Interface Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
                <option value="English">English</option>
                <option value="Filipino">Filipino</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Default Homepage</label>
              <select value={defaultView} onChange={e => setDefaultView(e.target.value)} style={inputStyle}>
                <option value="dashboard">Dashboard</option>
                <option value="feedbacks">Feedback Feed</option>
                <option value="users">People</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <ToggleRow title="Dark Mode" description="Switch your workspace theme." checked={darkMode} onChange={onToggleTheme} theme={theme} darkMode={darkMode} />
          </div>
          <button onClick={saveDisplayPrefs} style={{ marginTop: 12, padding: "10px 16px", background: "var(--primary-color)", color: "#fff", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save Preferences</button>
        </SectionCard>
      )}

      {activeTab === "activity" && (
        <SectionCard theme={theme} title="Profile Activity" subtitle="Summary of your recent personal activity and login history.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
            <div style={{ padding: "16px", background: theme.bg, borderRadius: "12px", border: `1px solid ${theme.border}` }}>
              <label style={labelStyle}>Last Login Timestamp</label>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: theme.text }}>
                {profile?.last_login ? new Date(profile.last_login).toLocaleString() : "Never (First session)"}
              </p>
            </div>
            <div style={{ padding: "16px", background: theme.bg, borderRadius: "12px", border: `1px solid ${theme.border}` }}>
              <label style={labelStyle}>Profile Set-up Status</label>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: profile?.profile_completed ? "#10B981" : "#F59E0B" }}>
                {profile?.profile_completed ? "Identity Fully Verified" : "Information Incomplete"}
              </p>
            </div>
          </div>

          <p style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧩 6. Recent Actions Summary</p>
          {activityLoading ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textMuted }}>Loading activity...</div>
          ) : recentActions.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: theme.textMuted, background: theme.bg, borderRadius: 12 }}>No recent actions recorded.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentActions.map((act, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: theme.bg, borderRadius: "10px", border: `1px solid ${theme.border}` }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary-color)" }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: theme.text }}>{act.action_type.replace(/_/g, ' ')}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: theme.textMuted }}>{new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                  {act.details?.updated_fields && (
                    <div style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(var(--primary-rgb),0.12)', color: 'var(--primary-color)', borderRadius: '4px', fontWeight: 600 }}>
                      {act.details.updated_fields.join(', ')}
                    </div>
                  )}
                </div>
              ))}
              <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: theme.textMuted }}>Full audit logs are available in the <span onClick={() => onNavigate("auditlogs")} style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}>Admin Activity</span> page.</p>
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "links" && (
        <SectionCard theme={theme} title="Quick Links" subtitle="Jump quickly to common admin modules.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <button onClick={() => onNavigate("users")} style={{ padding: "12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, cursor: "pointer" }}>Go to User Oversight</button>
            <button onClick={() => onNavigate("broadcast")} style={{ padding: "12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, cursor: "pointer" }}>Go to Broadcast</button>
            <button onClick={() => onNavigate("feedbacks")} style={{ padding: "12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, cursor: "pointer" }}>Go to Feedback Management</button>
          </div>
        </SectionCard>
      )}

      {activeTab === "system" && isGlobalCoreAdmin && (
        <SectionCard theme={theme} title="Global Config" subtitle={`System-wide configuration for ${systemName} Admin only.`}>
          {loading ? <div style={{ fontSize: 13, color: theme.textMuted }}>Loading global config...</div> : (
            <>
              <ToggleRow theme={theme} darkMode={darkMode} title="Voice Note Submissions" description="Allow voice notes in feedback form." checked={settings.allow_voice} onChange={() => handleToggle("allow_voice")} loading={updatingKey === "allow_voice"} />
              <ToggleRow theme={theme} darkMode={darkMode} title="Community Feed" description="Enable public feed visibility." checked={settings.public_feed} onChange={() => handleToggle("public_feed")} loading={updatingKey === "public_feed"} />
              <ToggleRow theme={theme} darkMode={darkMode} title="Email Notifications" description="Send email on new replies." checked={settings.email_notifications} onChange={() => handleToggle("email_notifications")} loading={updatingKey === "email_notifications"} />
              <ToggleRow theme={theme} darkMode={darkMode} title="Status Notifications" description="Notify on status updates." checked={settings.status_notifications} onChange={() => handleToggle("status_notifications")} loading={updatingKey === "status_notifications"} />
              
              <div style={{ marginTop: 24, borderTop: `1px solid ${theme.border}`, paddingTop: 20 }}>
                <p style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 700, color: 'var(--primary-color)' }}>SYSTEM BRANDING</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Primary Organization Name</label>
                    <input 
                      value={settings.primary_organization_name || ""} 
                      onChange={e => setSettings(p => ({ ...p, primary_organization_name: e.target.value }))}
                      style={inputStyle} 
                      placeholder="e.g. DSWD"
                    />
                    <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: theme.textMuted }}>Auto-filled for new employees during onboarding.</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Primary Theme Color</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input 
                        type="color"
                        value={settings.primary_color || "var(--primary-color)"} 
                        onChange={e => setSettings(p => ({ ...p, primary_color: e.target.value }))}
                        style={{ ...inputStyle, padding: "2px", width: "50px", height: "40px", cursor: "pointer" }} 
                      />
                      <input 
                        type="text"
                        value={settings.primary_color || "var(--primary-color)"} 
                        onChange={e => setSettings(p => ({ ...p, primary_color: e.target.value }))}
                        style={{ ...inputStyle, flex: 1 }} 
                        placeholder="var(--primary-color)"
                      />
                    </div>
                    <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: theme.textMuted }}>Main brand color for UI elements.</p>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                   <button 
                     onClick={handleBrandingUpdate}
                     disabled={updatingKey === "branding"}
                     style={{ padding: '10px 24px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: updatingKey === "branding" ? 0.6 : 1 }}
                   >
                     {updatingKey === "branding" ? "Updating..." : "Update Branding"}
                   </button>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      )}

      {activeTab === "terminology" && isGlobalCoreAdmin && (
        <>
          <SectionCard theme={theme} title="System Terminology" subtitle="Customize the language used throughout the platform to fit your industry.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#c35b00', marginBottom: '12px', textTransform: 'uppercase' }}>Categories</p>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Singular (e.g. Program)</label>
                  <input value={termForm.category_label} onChange={e => setTermForm(p => ({ ...p, category_label: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Plural (e.g. Programs)</label>
                  <input value={termForm.category_label_plural} onChange={e => setTermForm(p => ({ ...p, category_label_plural: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#c35b00', marginBottom: '12px', textTransform: 'uppercase' }}>Entities / Establishments</p>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Singular (e.g. Office)</label>
                  <input value={termForm.entity_label} onChange={e => setTermForm(p => ({ ...p, entity_label: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Plural (e.g. Offices)</label>
                  <input value={termForm.entity_label_plural} onChange={e => setTermForm(p => ({ ...p, entity_label_plural: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ gridColumn: "1 / span 2", borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#c35b00', marginBottom: '12px', textTransform: 'uppercase' }}>General Activity</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <label style={labelStyle}>Feedback Label (Singular)</label>
                    <input value={termForm.feedback_label} onChange={e => setTermForm(p => ({ ...p, feedback_label: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Feedback Label (Plural)</label>
                    <input value={termForm.feedback_label_plural} onChange={e => setTermForm(p => ({ ...p, feedback_label_plural: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            <button onClick={saveTerminology} disabled={termSaving} style={{ marginTop: 24, padding: "12px 24px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
              {termSaving ? "Saving..." : "Save Terminology Changes"}
            </button>
          </SectionCard>

          <SectionCard theme={theme} title="Live Preview" subtitle="See how your terminology looks in common UI areas.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 16, border: `1px solid ${theme.border}`, borderRadius: 8, background: theme.bg }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 8 }}>DASHBOARD CARD</p>
                <div style={{ fontSize: 24, fontWeight: 800, color: theme.text }}>42</div>
                <div style={{ fontSize: 13, color: theme.textMuted }}>Total {termForm.feedback_label_plural}</div>
              </div>
              <div style={{ padding: 16, border: `1px solid ${theme.border}`, borderRadius: 8, background: theme.bg }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 8 }}>SEARCH PLACEHOLDER</p>
                <div style={{ padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 12, color: theme.textMuted }}>
                  Search by {termForm.entity_label} or {termForm.category_label}...
                </div>
              </div>
              <div style={{ padding: 16, border: `1px solid ${theme.border}`, borderRadius: 8, background: theme.bg, gridColumn: "1 / span 2" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 8 }}>MENU ITEM / HEADER</p>
                <div style={{ display: 'flex', gap: 20 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-color)', borderBottom: '2px solid var(--primary-color)', paddingBottom: 4 }}>Manage {termForm.category_label_plural}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted }}>{termForm.entity_label_plural}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default AdminSettings;
