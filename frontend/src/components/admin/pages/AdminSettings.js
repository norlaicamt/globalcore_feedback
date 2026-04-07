import React, { useState, useEffect } from "react";
import { getAdminSettings, updateAdminSetting } from "../../../services/api";
import { adminGetProfile, adminUpdateProfile } from "../../../services/adminApi";

const ToggleRow = ({ title, description, checked, onChange, loading, theme, darkMode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${theme.border}`, opacity: loading ? 0.6 : 1 }}>
    <div style={{ flex: 1, paddingRight: "16px" }}>
      <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: theme.text }}>{title}</p>
      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: theme.textMuted }}>{description}</p>
    </div>
    <div onClick={loading ? null : onChange} style={{
      width: "40px", height: "22px", borderRadius: "11px", padding: "2px",
      background: checked ? "#3B82F6" : (darkMode ? "rgba(255,255,255,0.1)" : "#E2E8F0"), cursor: loading ? "wait" : "pointer", transition: "background 0.2s",
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

const AdminSettings = ({ theme, darkMode, adminUser, onNavigate, onToggleTheme }) => {
  const isGlobalCoreAdmin = (adminUser?.email || "").toLowerCase() === "admin@globalcore.com";
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState({ allow_voice: true, public_feed: true, email_notifications: false, status_notifications: true });
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [language, setLanguage] = useState(localStorage.getItem("adminLanguage") || "English");
  const [defaultView, setDefaultView] = useState(localStorage.getItem("adminDefaultView") || "dashboard");

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
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [sysSettings, profileData] = await Promise.all([
          getAdminSettings().catch(() => []),
          adminGetProfile()
        ]);
        if (sysSettings?.length) {
          const mapped = {};
          sysSettings.forEach(s => mapped[s.key] = s.value === "true");
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
        }));
      } catch (e) {
        console.error("Failed to load settings/profile", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = async (key) => {
    if (!isGlobalCoreAdmin) return;
    const newValue = !settings[key];
    setUpdatingKey(key);
    try {
      await updateAdminSetting(key, String(newValue));
      setSettings(prev => ({ ...prev, [key]: newValue }));
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
      ...(form.password ? { password: form.password } : {}),
      two_factor_enabled: form.two_factor_enabled
    };
    await saveProfile(payload);
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
    localStorage.setItem("adminLanguage", language);
    localStorage.setItem("adminDefaultView", defaultView);
    localStorage.setItem("adminView", defaultView);
    setSuccessMsg("Display preferences saved.");
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const tabs = [
    { id: "profile", label: "Basic Profile" },
    { id: "security", label: "Account Security" },
    { id: "notifs", label: "Notification Preferences" },
    { id: "display", label: "Display / Preferences" },
    { id: "links", label: "Quick Links" },
  ];
  if (isGlobalCoreAdmin) tabs.push({ id: "system", label: "Global Config" });

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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: "none", border: "none", padding: "12px 4px", fontSize: "13px", fontWeight: activeTab === tab.id ? "700" : "600", color: activeTab === tab.id ? "#3B82F6" : theme.textMuted, borderBottom: `2.5px solid ${activeTab === tab.id ? "#3B82F6" : "transparent"}`, cursor: "pointer", fontFamily: "inherit" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <SectionCard theme={theme} title="Basic Profile" subtitle="Identity and role details for accountability.">
          {loading || !profile ? <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading profile...</div> : (
            <form onSubmit={handleProfileSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={profile.email || ""} disabled style={{ ...inputStyle, opacity: 0.7 }} />
              </div>
              <div>
                <label style={labelStyle}>Position / Role Title</label>
                <input value={profile.role_title || "Administrator"} disabled style={{ ...inputStyle, opacity: 0.7 }} />
              </div>
              <div>
                <label style={labelStyle}>Department / Organization</label>
                <input value={profile.department || "No Department / External"} disabled style={{ ...inputStyle, opacity: 0.7 }} />
              </div>
              <div style={{ gridColumn: "1 / span 2" }}>
                <label style={labelStyle}>Profile Photo URL (Optional)</label>
                <input value={form.avatar_url} onChange={e => setForm(prev => ({ ...prev, avatar_url: e.target.value }))} style={inputStyle} placeholder="https://..." />
              </div>
              <div style={{ gridColumn: "1 / span 2" }}>
                <button type="submit" disabled={profileSaving} style={{ padding: "10px 16px", background: "#3B82F6", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>{profileSaving ? "Saving..." : "Save Basic Profile"}</button>
              </div>
            </form>
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
            <button onClick={() => saveProfile({ ...(form.password ? { password: form.password } : {}), two_factor_enabled: form.two_factor_enabled })} style={{ marginTop: 12, padding: "10px 16px", background: "#1f2a56", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save Security</button>
          </div>
        </SectionCard>
      )}

      {activeTab === "notifs" && (
        <SectionCard theme={theme} title="Notification Preferences" subtitle="Control alerts and summaries.">
          <ToggleRow title="Email on New Feedback" description="Receive email when new feedback arrives." checked={form.email_notifications} onChange={() => setForm(prev => ({ ...prev, email_notifications: !prev.email_notifications }))} theme={theme} darkMode={darkMode} />
          <ToggleRow title="Email on Assigned Feedback" description="Receive updates on assigned actions." checked={form.status_updates} onChange={() => setForm(prev => ({ ...prev, status_updates: !prev.status_updates }))} theme={theme} darkMode={darkMode} />
          <ToggleRow title="Broadcast Alerts" description="Get urgent broadcast notices." checked={form.push_notifications} onChange={() => setForm(prev => ({ ...prev, push_notifications: !prev.push_notifications }))} theme={theme} darkMode={darkMode} />
          <ToggleRow title="Daily / Weekly Summary" description="Receive digest emails." checked={form.weekly_digest} onChange={() => setForm(prev => ({ ...prev, weekly_digest: !prev.weekly_digest }))} theme={theme} darkMode={darkMode} />
          <button onClick={handleNotificationSave} style={{ marginTop: 14, padding: "10px 16px", background: "#3B82F6", color: "#fff", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save Notification Preferences</button>
        </SectionCard>
      )}

      {activeTab === "display" && (
        <SectionCard theme={theme} title="Display / Preferences" subtitle="Personalize your workspace and default view.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
                <option value="English">English</option>
                <option value="Filipino">Filipino</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Default Dashboard View</label>
              <select value={defaultView} onChange={e => setDefaultView(e.target.value)} style={inputStyle}>
                <option value="dashboard">Dashboard</option>
                <option value="feedbacks">Feedback Management</option>
                <option value="users">User Oversight</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <ToggleRow title="Theme (Light / Dark)" description="Switch visual mode instantly." checked={darkMode} onChange={onToggleTheme} theme={theme} darkMode={darkMode} />
          </div>
          <button onClick={saveDisplayPrefs} style={{ marginTop: 12, padding: "10px 16px", background: "#1f2a56", color: "#fff", border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save Display Preferences</button>
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
        <SectionCard theme={theme} title="Global Config" subtitle="System-wide configuration for GlobalCore Admin only.">
          {loading ? <div style={{ fontSize: 13, color: theme.textMuted }}>Loading global config...</div> : (
            <>
              <ToggleRow theme={theme} darkMode={darkMode} title="Voice Note Submissions" description="Allow voice notes in feedback form." checked={settings.allow_voice} onChange={() => handleToggle("allow_voice")} loading={updatingKey === "allow_voice"} />
              <ToggleRow theme={theme} darkMode={darkMode} title="Community Feed" description="Enable public feed visibility." checked={settings.public_feed} onChange={() => handleToggle("public_feed")} loading={updatingKey === "public_feed"} />
              <ToggleRow theme={theme} darkMode={darkMode} title="Email Notifications" description="Send email on new replies." checked={settings.email_notifications} onChange={() => handleToggle("email_notifications")} loading={updatingKey === "email_notifications"} />
              <ToggleRow theme={theme} darkMode={darkMode} title="Status Notifications" description="Notify on status updates." checked={settings.status_notifications} onChange={() => handleToggle("status_notifications")} loading={updatingKey === "status_notifications"} />
            </>
          )}
        </SectionCard>
      )}
    </div>
  );
};

export default AdminSettings;
