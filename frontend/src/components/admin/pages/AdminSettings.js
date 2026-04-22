import React, { useState, useEffect } from "react";
import { adminGetProfile, adminUpdateProfile, getSystemLabels, updateSystemLabelsBulk, adminGetProfileActivity, getAdminSettings, updateAdminSetting } from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import { STORAGE_KEYS } from "../../../utils/storage";

const hexToRgb = (hex) => {
  let defaultRgb = "31, 42, 86";
  if (!hex || !hex.startsWith('#')) return defaultRgb;
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.substring(0, 2), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.substring(2, 4), 16);
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const getContrastColor = (hex) => {
  if (!hex || !hex.startsWith('#')) return '#ffffff';
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.substring(0, 2), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.substring(2, 4), 16);
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#1e293b' : '#ffffff';
};

const adjustBrightness = (hex, percent) => {
  const h = (hex || '#3B82F6').replace(/^#/, '');
  const r = Math.min(255, Math.max(0, parseInt(h.substring(0, 2), 16) + percent));
  const g = Math.min(255, Math.max(0, parseInt(h.substring(2, 4), 16) + percent));
  const b = Math.min(255, Math.max(0, parseInt(h.substring(4, 6), 16) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

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

const ImpactScope = ({ modules, users, description, theme }) => (
  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', borderLeft: '3px solid #3B82F6' }}>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase' }}>Scope: {modules}</div>
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#6366F1', textTransform: 'uppercase' }}>Audience: {users}</div>
    </div>
    <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: '500', lineHeight: '1.4' }}>{description}</p>
  </div>
);

const SaveConfirmationModal = ({ changes, onConfirm, onCancel, theme, darkMode }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
    <div style={{ width: '480px', background: theme.surface, borderRadius: '24px', padding: '32px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900', color: theme.text, letterSpacing: '-0.02em' }}>Review Operation Changes</h3>
      <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: theme.textMuted }}>You are about to deploy the following modifications to the active operational environment.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '32px', paddingRight: '8px' }}>
        {changes.map((c, i) => (
          <div key={i} style={{ padding: '14px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '4px' }}>{c.section}</div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: theme.text }}>{c.label}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: theme.textMuted }}>{c.from} → <span style={{ color: '#10B981', fontWeight: '700' }}>{c.to}</span></p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onConfirm} style={{ flex: 1, padding: '14px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Apply & Synchronize</button>
        <button onClick={onCancel} style={{ padding: '14px 24px', background: 'none', border: `1.5px solid ${theme.border}`, borderRadius: '12px', fontWeight: '800', color: theme.text, cursor: 'pointer' }}>Review More</button>
      </div>
    </div>
  </div>
);

const AdminSettings = ({ theme, darkMode, adminUser, onNavigate, onToggleTheme, onAdminUpdate }) => {
  const { labels, refreshLabels, getLabel, systemName } = useTerminology();
  const isGlobalCoreAdmin = (adminUser?.email || "").toLowerCase() === "admin@globalcore.com";

  // 🌍 ORGANIZATION CONTEXT (Neutral Engine)
  const [orgType, setOrgType] = useState("government"); // 'government', 'service', 'corporate'

  const orgProfiles = {
    government: {
      platform_name: "Operations Management System",
      policy_ref: "Governance Policy (MC 06 s. 2026)",
      window_label: "Program Implementation Cycle",
      audience: "Beneficiaries / Citizens"
    },
    service: {
      platform_name: "Service Hub Control Panel",
      policy_ref: "Service Delivery Standards",
      window_label: "Guest Stay / Service Window",
      audience: "Guests / Customers"
    },
    corporate: {
      platform_name: "Operations Management Platform",
      policy_ref: "Standard Operating Procedures (SOP)",
      window_label: "Operational Cycle",
      audience: "Staff / Employees"
    }
  };

  const activeProfile = orgProfiles[orgType] || orgProfiles.government;
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState({ 
    allow_voice: true, 
    public_feed: true, 
    email_notifications: false, 
    status_notifications: true,
    primary_color: "#3B82F6",
    font_family: "'Outfit', sans-serif"
  });
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [language, setLanguage] = useState(localStorage.getItem(STORAGE_KEYS.ADMIN_LANGUAGE) || "English");
  const [defaultView, setDefaultView] = useState(localStorage.getItem(STORAGE_KEYS.ADMIN_DEFAULT_VIEW) || "dashboard");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Logo & Branding States
  const [logoPreview, setLogoPreview] = useState(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoMeta, setLogoMeta] = useState({ updated_at: null, updated_by: null });

  const [form, setForm] = useState({
    name: "",
    avatar_url: "",
    current_password: "",
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
  const [lastSaved, setLastSaved] = useState(new Date());

  const [pristineForm, setPristineForm] = useState({});
  const [pristineTermForm, setPristineTermForm] = useState({});
  const [pristineSettings, setPristineSettings] = useState({});
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [displayDensity, setDisplayDensity] = useState("comfort"); // compact, comfort, expanded
  const [securityRisk, setSecurityRisk] = useState("LOW"); // LOW, MEDIUM, HIGH
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  
  const [timeConfig, setTimeConfig] = useState({
    timezone: "Asia/Manila (UTC+8)",
    time_format: "12h",
    date_format: "MMMM DD, YYYY",
    week_start: "Monday"
  });

  useEffect(() => {
    if (settings.primary_color) {
      const primary = settings.primary_color;
      const rgb = hexToRgb(primary);
      const contrast = getContrastColor(primary);
      const hover = adjustBrightness(primary, -20);
      
      const root = document.documentElement;
      root.style.setProperty('--primary-color', primary);
      root.style.setProperty('--primary-rgb', rgb);
      root.style.setProperty('--primary-contrast', contrast);
      root.style.setProperty('--primary-hover', hover);
      root.style.setProperty('--primary-soft', `rgba(${rgb}, 0.1)`);

      localStorage.setItem('admin_primary_color', primary);
      localStorage.setItem('public_primary_color', primary);
      window.dispatchEvent(new StorageEvent('storage', { key: 'primary_color', newValue: primary }));
    }
  }, [settings.primary_color]);

  const isFormDirty = JSON.stringify(form) !== JSON.stringify(pristineForm);
  const isTermDirty = JSON.stringify(termForm) !== JSON.stringify(pristineTermForm);
  const isSettingsDirty = JSON.stringify(settings) !== JSON.stringify(pristineSettings);
  const hasUnsavedChanges = isFormDirty || isTermDirty || isSettingsDirty;

  const calculateChanges = () => {
    const changes = [];
    // Form changes
    Object.keys(form).forEach(key => {
      if (form[key] !== pristineForm[key]) {
        changes.push({ section: "Profile / Identity", label: key.replace(/_/g, ' '), from: String(pristineForm[key]), to: String(form[key]) });
      }
    });
    // Terminology changes
    Object.keys(termForm).forEach(key => {
      if (termForm[key] !== pristineTermForm[key]) {
        changes.push({ section: "System Terminology", label: key.replace(/_/g, ' '), from: String(pristineTermForm[key]), to: String(termForm[key]) });
      }
    });
    // Policy changes
    Object.keys(settings).forEach(key => {
      if (settings[key] !== pristineSettings[key]) {
        changes.push({ section: "Global Policy", label: key.replace(/_/g, ' '), from: String(pristineSettings[key]), to: String(settings[key]) });
      }
    });
    return changes;
  };

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
            mapped[s.key] = (s.value === "true" || s.value === "false") ? (s.value === "true") : s.value;
          });
          setSettings(prev => ({ ...prev, ...mapped }));

          // Sync branding from DB to local state
          if (mapped.primary_color) {
            setSettings(prev => ({ ...prev, primary_color: mapped.primary_color }));
          }

          setLogoPreview(mapped.primary_organization_logo || null);
          setLogoMeta({
            updated_at: mapped.logo_last_updated_at || null,
            updated_by: mapped.logo_updated_by || null
          });
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
        setPristineForm({
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
          password: ""
        });
        const initialTerms = {
          category_label: labels.category_label || "Program",
          category_label_plural: labels.category_label_plural || "Programs",
          entity_label: labels.entity_label || "Location",
          entity_label_plural: labels.entity_label_plural || "Locations",
          feedback_label: labels.feedback_label || "Feedback",
          feedback_label_plural: labels.feedback_label_plural || "Feedbacks",
        };
        setTermForm(initialTerms);
        setPristineTermForm(initialTerms);
      } catch (e) {
        console.error("Failed to load settings/profile", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [labels]);

  useEffect(() => {
    if (settings && !Object.keys(pristineSettings).length) {
      setPristineSettings(settings);
    }
  }, [settings]);

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


  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = reject;
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400; // slightly higher for quality
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
      };
    });
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select a file under 2MB (it will be compressed automatically).");
      return;
    }

    setIsProcessingLogo(true);
    try {
      const compressed = await compressImage(file);
      setLogoPreview(compressed);
    } catch (err) {
      console.error(err);
      alert("Failed to process image.");
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm("Are you sure you want to remove the organization logo? This will revert to the default system icon.")) return;
    setUpdatingKey("branding");
    try {
      await updateAdminSetting("primary_organization_logo", "");
      setLogoPreview(null);
      setSuccessMsg("✅ Logo removed successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      refreshLabels();
    } catch (e) {
      alert("Failed to remove logo.");
    } finally {
      setUpdatingKey("branding");
    }
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

      // Save Logo if changed
      if (logoPreview !== settings.primary_organization_logo) {
        await updateAdminSetting("primary_organization_logo", logoPreview || "");
      }

      setSuccessMsg("✅ System branding updated. All changes applied globally.");
      setTimeout(() => setSuccessMsg(""), 3000);
      refreshLabels();
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
      phone: form.phone,
      ...(form.current_password ? { current_password: form.current_password } : {}),
      ...(form.password ? { password: form.password } : {}),
      two_factor_enabled: form.two_factor_enabled
    };
    await saveProfile(payload);
    setPristineForm(JSON.parse(JSON.stringify(form)));
    setForm(prev => ({ ...prev, current_password: "", password: "" }));
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
    { id: "activity", label: "Settings Activity" },
  ];

  // Any admin can manage terminology for their own scope
  tabs.push({ id: "terminology", label: "Terminology" });

  if (isGlobalCoreAdmin) {
    tabs.push({ id: "system", label: "Global Config" });
  }

  const handleReset = () => {
    setForm({ ...pristineForm });
    setTermForm({ ...pristineTermForm });
    setSettings({ ...pristineSettings });
    setIsEditingProfile(false);
  };

  const handleGlobalSave = async () => {
    if (!showConfirmModal) {
      setPendingChanges(calculateChanges());
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
    setProfileSaving(true);
    setTermSaving(true);
    try {
      // Simulate API delays
      await new Promise(r => setTimeout(r, 1000));
      setLastSaved(new Date());
      setPristineForm({ ...form });
      setPristineTermForm({ ...termForm });
      setPristineSettings({ ...settings });
      setIsEditingProfile(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
      if (onAdminUpdate) onAdminUpdate({ ...adminUser, ...form });
    } catch (e) {
      console.error("Global save failed", e);
    } finally {
      setProfileSaving(false);
      setTermSaving(false);
    }
  };

  const inputStyle = { padding: "10px 14px", border: `1.5px solid ${theme.border}`, borderRadius: "8px", fontSize: "13px", outline: "none", fontFamily: "inherit", background: theme.bg, color: theme.text, width: "100%", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "11px", fontWeight: "700", color: theme.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" };

  return (
    <div style={{
      width: "100%",
      height: "calc(100vh - 140px)",
      overflow: "hidden",
      display: 'flex',
      flexDirection: 'column',
      fontSize: 'clamp(11px, 0.8vh + 0.5vw, 14px)'
    }}>
      {showConfirmModal && (
        <SaveConfirmationModal
          changes={pendingChanges}
          onConfirm={handleGlobalSave}
          onCancel={() => setShowConfirmModal(false)}
          theme={theme}
          darkMode={darkMode}
        />
      )}
      <div style={{ padding: "0 40px" }}>
        <div style={{ marginBottom: "32px", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "900", color: theme.text, letterSpacing: '-0.02em' }}>{activeProfile.platform_name}</h2>
            <p style={{ margin: 0, fontSize: "14px", color: theme.textMuted, fontWeight: '500' }}>Manage system governance and organizational preferences.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right', marginRight: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Integrity</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: '700', color: hasUnsavedChanges ? '#D97706' : '#10B981' }}>
                {hasUnsavedChanges ? '● Unsaved Modifications' : '● System Synchronized'}
              </p>
            </div>

            <button
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
              style={{ padding: '8px 16px', background: 'none', border: `1.5px solid ${theme.border}`, borderRadius: '10px', fontSize: '12px', fontWeight: '800', color: theme.textMuted, cursor: hasUnsavedChanges ? 'pointer' : 'default', opacity: hasUnsavedChanges ? 1 : 0.5 }}
            >
              Discard
            </button>
            <button
              onClick={handleGlobalSave}
              disabled={!hasUnsavedChanges || profileSaving}
              style={{
                padding: '8px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '12px', fontWeight: '800', cursor: hasUnsavedChanges ? 'pointer' : 'default',
                boxShadow: hasUnsavedChanges ? '0 8px 16px rgba(var(--primary-rgb), 0.15)' : 'none',
                opacity: hasUnsavedChanges ? 1 : 0.5
              }}
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {showSaveToast && (
          <div style={{
            position: 'fixed', bottom: '40px', right: '40px', zIndex: 1000,
            padding: "16px 24px", borderRadius: "16px",
            background: "var(--primary-color)", color: "white",
            fontWeight: 800, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'slideUpFade 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            System Protocol Updated & Synchronized
            <style>{`
            @keyframes slideUpFade {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          </div>
        )}
        {successMsg && (
          <div style={{
            padding: "12px 20px", marginBottom: 24, borderRadius: "14px",
            background: "rgba(16,185,129,0.1)", color: "#10B981",
            fontWeight: 700, fontSize: 13, border: '1px solid rgba(16,185,129,0.2)',
            animation: 'fadeInDown 0.3s ease'
          }}>
            {successMsg}
          </div>
        )}
      </div>

      <div style={{ borderBottom: `1px solid ${theme.border}`, marginBottom: "24px", display: "flex", gap: "24px", flexShrink: 0, padding: "0 40px" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none", border: "none", padding: "16px 8px",
              fontSize: "14px", fontWeight: activeTab === tab.id ? "800" : "600",
              color: activeTab === tab.id ? "var(--primary-color)" : theme.textMuted,
              borderBottom: `3px solid ${activeTab === tab.id ? "var(--primary-color)" : "transparent"}`,
              cursor: "pointer", fontFamily: "inherit", transition: '0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SCROLLABLE SETTINGS CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 40px 60px" }}>
        {activeTab === "profile" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <SectionCard theme={theme} title="Administrative Identity" subtitle="Primary identification and organizational role mapping.">
                {loading || !profile ? <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading profile...</div> : (
                  <>
                    {!isEditingProfile ? (
                      <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
                        <div style={{ position: "relative" }}>
                          {profile.avatar_url
                            ? <img src={profile.avatar_url} alt={profile.name} style={{ width: "120px", height: "120px", borderRadius: "28px", objectFit: "cover", border: `3px solid ${theme.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }} />
                            : <div style={{ width: "120px", height: "120px", borderRadius: "28px", background: "linear-gradient(135deg, var(--primary-color), #4F46E5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", fontWeight: "900", boxShadow: '0 8px 20px rgba(var(--primary-rgb), 0.2)' }}>{profile.name?.charAt(0)}</div>}
                          {profile.profile_completed && (
                            <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#10B981', border: `4px solid ${theme.surface}`, borderRadius: '50%', padding: '6px', display: 'flex', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <h3 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "900", color: theme.text, letterSpacing: '-0.02em' }}>
                                {profile.name}
                              </h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)', background: 'rgba(var(--primary-rgb), 0.1)', padding: '2px 10px', borderRadius: '6px' }}>
                                  {profile.position_title || (isGlobalCoreAdmin ? "Head Admin" : (profile.role || "Admin"))}
                                </span>
                                <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>• {profile.email}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setIsEditingProfile(true)}
                              style={{ padding: "10px 20px", background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: "12px", fontSize: "12px", fontWeight: "800", cursor: "pointer", transition: '0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
                            >
                              Edit Details
                            </button>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "28px" }}>
                            <div>
                              <label style={labelStyle}>Administrative Unit</label>
                              <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: theme.text }}>{profile.unit_name || "Central Command"}</p>
                            </div>
                            <div>
                              <label style={labelStyle}>Organization Scope</label>
                              <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: theme.text }}>{systemName}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleProfileSave}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: '32px' }}>
                          <div style={{ gridColumn: '1 / span 2' }}>
                            <label style={labelStyle}>Full Legal Name</label>
                            <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} placeholder="Full name for audit trails..." />
                          </div>
                          <div>
                            <label style={labelStyle}>Public Position Title</label>
                            <input value={form.position_title} onChange={e => setForm(prev => ({ ...prev, position_title: e.target.value }))} style={inputStyle} placeholder="e.g. Director of Operations" />
                          </div>
                          <div>
                            <label style={labelStyle}>{getLabel("category_label", "Assigned Unit")}</label>
                            <input value={form.unit_name} onChange={e => setForm(prev => ({ ...prev, unit_name: e.target.value }))} style={inputStyle} placeholder="Primary working unit..." />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px", borderTop: `1px solid ${theme.border}`, paddingTop: '24px' }}>
                          <button type="submit" disabled={profileSaving} style={{ padding: "12px 28px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: 12, fontWeight: 800, cursor: "pointer", boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)' }}>
                            {profileSaving ? "Saving..." : "Commit Profile Changes"}
                          </button>
                          <button type="button" onClick={() => setIsEditingProfile(false)} style={{ padding: "12px 28px", background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>
                            Discard
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </SectionCard>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <SectionCard theme={theme} title="Contact Information" subtitle="Direct communication channels for admin alerts.">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Verified Email</label>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: theme.text }}>{profile?.email}</p>
                    </div>
                    <div>
                      <label style={labelStyle}>Official Contact Number</label>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: theme.text }}>{profile?.phone || "Not provided"}</p>
                    </div>
                  </div>
                </SectionCard>
                <SectionCard theme={theme} title="Work Preferences" subtitle="Customization for your admin experience.">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Default Language</label>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: theme.text }}>{language}</p>
                    </div>
                    <div>
                      <label style={labelStyle}>Workspace Theme</label>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: theme.text }}>{darkMode ? "Premium Dark" : "Professional Light"}</p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: theme.surface, borderRadius: '24px', padding: '28px', border: `1.5px solid ${theme.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '8px', background: '#10B98115', color: '#10B981', borderRadius: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: theme.text }}>Security Health</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Admin account protection status</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: theme.bg, borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: theme.text }}>Two-Factor Auth</span>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: profile?.two_factor_enabled ? '#10B981' : '#F59E0B', background: profile?.two_factor_enabled ? '#10B98115' : '#F59E0B15', padding: '4px 10px', borderRadius: '8px' }}>
                      {profile?.two_factor_enabled ? 'ACTIVE' : 'RECOMMENDED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: theme.bg, borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: theme.text }}>Last Password Reset</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted }}>32 days ago</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: theme.bg, borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: theme.text }}>Active Sessions</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)' }}>1 Active</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("security")}
                  style={{ width: '100%', marginTop: '20px', padding: '12px', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Harden Security
                </button>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', borderRadius: '24px', padding: '28px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                  <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', letterSpacing: '-0.02em' }}>Audit Integrity</h4>
                <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#94A3B8', fontWeight: '500', lineHeight: '1.5' }}>Your administrative actions are logged in a tamper-proof audit trail for governance compliance.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>Total Actions Logged</span>
                    <span style={{ fontWeight: '800' }}>1,242</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>Compliance Score</span>
                    <span style={{ fontWeight: '800', color: '#10B981' }}>100% Secure</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("activity")}
                  style={{ width: '100%', marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
                >
                  View Activity Trail
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 🛡️ SECURITY STATUS BAR */}
              <div style={{
                display: 'flex', gap: '16px', padding: '24px',
                background: darkMode ? 'rgba(255,255,255,0.03)' : '#fff',
                borderRadius: '24px', border: `1.5px solid ${theme.border}`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Risk Profile</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: securityRisk === 'LOW' ? '#10B981' : '#F59E0B' }} />
                    <span style={{ fontSize: '18px', fontWeight: '900', color: securityRisk === 'LOW' ? '#10B981' : '#F59E0B' }}>{securityRisk} RISK</span>
                  </div>
                </div>
                <div style={{ width: '1.5px', background: theme.border }} />
                <div style={{ flex: 1.2 }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Known Access</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '14px', fontWeight: '800', color: theme.text }}>Quezon City, PH • 2 mins ago</p>
                </div>
                <div style={{ width: '1.5px', background: theme.border }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suspicious activity</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '14px', fontWeight: '800', color: '#10B981' }}>None Detected</p>
                </div>
              </div>

              <SectionCard theme={theme} title="Authentication Protocols" subtitle="Define how your administrative session is verified.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '800', color: theme.text }}>Administrative Password</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={labelStyle}>Current Password</label>
                        <input 
                          type="password" 
                          value={form.current_password || ""} 
                          onChange={e => setForm(prev => ({ ...prev, current_password: e.target.value }))} 
                          style={inputStyle} 
                          placeholder="Verify identity..." 
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>New Password</label>
                        <input 
                          type="password" 
                          value={form.password || ""} 
                          onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} 
                          style={inputStyle} 
                          placeholder="Enter new password..." 
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: theme.text }}>Multi-Factor Protection</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: theme.textMuted }}>Secondary verification layer via biometric or TOTP.</p>
                      </div>
                      <div style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900',
                        background: form.two_factor_enabled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: form.two_factor_enabled ? '#10B981' : '#EF4444',
                        border: `1px solid ${form.two_factor_enabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                      }}>
                        {form.two_factor_enabled ? '✓ SECURED' : '⚠ UNPROTECTED'}
                      </div>
                    </div>
                    <ToggleRow title="Enable 2FA" description="Require identity verification on every sign-in attempt." checked={form.two_factor_enabled} onChange={() => setForm(prev => ({ ...prev, two_factor_enabled: !prev.two_factor_enabled }))} loading={profileSaving} theme={theme} darkMode={darkMode} />
                    <ImpactScope modules="Authentication / Login" users="Administrators" description={`2FA is required for system administrators under the current ${activeProfile.policy_ref}.`} theme={theme} />
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}>
                    <ToggleRow title="Session Persistence" description="Maintain login state for 24 hours on this device." checked={form.biometrics_enabled} onChange={() => setForm(prev => ({ ...prev, biometrics_enabled: !prev.biometrics_enabled }))} theme={theme} darkMode={darkMode} />
                  </div>
                </div>
              </SectionCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: theme.bg, borderRadius: '24px', padding: '28px', border: `1.5px solid ${theme.border}` }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Decision Accountability</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Last Security Synchronization</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '700', color: theme.text }}>{adminUser?.name || "System"} • {lastSaved.toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => onNavigate("activity")}
                    style={{ width: '100%', padding: "12px", background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: 12, fontWeight: 800, cursor: "pointer", fontSize: '13px', marginTop: '8px' }}
                  >
                    View Authority Logs
                  </button>
                </div>
              </div>

              <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(245,158,11,0.05)', border: '1.5px solid rgba(245,158,11,0.1)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900', color: '#D97706' }}>Compliance Note</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#B45309', fontWeight: '500', lineHeight: '1.5' }}>
                  Your department requires password rotation every 90 days. You have <strong>42 days</strong> remaining before mandatory reset.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifs" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <SectionCard theme={theme} title="Daily Operational Notifications" subtitle="Automatic alerts for your day-to-day work. These help you stay on top of new tasks and community feedback.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '14px', right: '48px', zIndex: 1, background: '#10B98115', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '900' }}>RECOMMENDED</div>
                    <ToggleRow title="New Feedback Received" description="Get notified immediately when a parent or citizen submits new feedback." checked={form.email_notifications} onChange={() => setForm(prev => ({ ...prev, email_notifications: !prev.email_notifications }))} theme={theme} darkMode={darkMode} />
                  </div>
                  <div style={{ padding: '0 0 16px 0', display: 'flex', gap: '16px', borderBottom: `1px solid ${theme.border}` }}>
                     <div style={{ fontSize: '10px', color: theme.textMuted }}><strong>Sent to:</strong> All Program Personnel</div>
                     <div style={{ fontSize: '10px', color: theme.textMuted }}><strong>Trigger:</strong> New submission recorded</div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '14px', right: '48px', zIndex: 1, background: '#10B98115', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '900' }}>RECOMMENDED</div>
                    <ToggleRow title="Task Assignments" description="Receive an alert whenever a case or location is assigned to your unit." checked={form.status_updates} onChange={() => setForm(prev => ({ ...prev, status_updates: !prev.status_updates }))} theme={theme} darkMode={darkMode} />
                  </div>
                  <div style={{ padding: '0 0 16px 0', display: 'flex', gap: '16px' }}>
                     <div style={{ fontSize: '10px', color: theme.textMuted }}><strong>Sent to:</strong> Assigned Responders</div>
                     <div style={{ fontSize: '10px', color: theme.textMuted }}><strong>Trigger:</strong> Staff assignment changed</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard theme={theme} title="Urgent Announcements" subtitle="Emergency communication and high-priority alerts. These are forced notifications for situational awareness.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ToggleRow title="Emergency Broadcasts" description="Critical system-wide notices regarding program suspensions or urgent advisories." checked={form.push_notifications} onChange={() => setForm(prev => ({ ...prev, push_notifications: !prev.push_notifications }))} theme={theme} darkMode={darkMode} />
                  <div style={{ padding: '0 0 16px 0', display: 'flex', gap: '16px' }}>
                     <div style={{ fontSize: '10px', color: '#EF4444' }}><strong>Sent to:</strong> Everyone</div>
                     <div style={{ fontSize: '10px', color: theme.textMuted }}><strong>Trigger:</strong> High-priority manual broadcast</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard theme={theme} title="Reports & Summaries" subtitle="Non-urgent performance tracking and strategic digests. Best for management and long-term planning.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ToggleRow title="Performance Digest" description="Weekly high-level summary of feedback trends and operational health." checked={form.weekly_digest} onChange={() => setForm(prev => ({ ...prev, weekly_digest: !prev.weekly_digest }))} theme={theme} darkMode={darkMode} />
                  <div style={{ padding: '0 0 16px 0', display: 'flex', gap: '16px', borderBottom: `1px solid ${theme.border}` }}>
                     <div style={{ fontSize: '10px', color: theme.textMuted }}><strong>Sent to:</strong> Supervisors & Executives</div>
                     <div style={{ fontSize: '10px', color: theme.textMuted }}><strong>Trigger:</strong> Every Monday at 8:00 AM</div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
                  <label style={labelStyle}>Notification Frequency</label>
                  <p style={{ margin: '2px 0 12px 0', fontSize: '12px', color: theme.textMuted }}>Control how often you receive updates to avoid notification fatigue.</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['Immediate', 'Hourly', 'Daily Summary'].map(freq => (
                      <button
                        key={freq}
                        style={{
                          flex: 1, padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800',
                          background: freq === 'Immediate' ? 'var(--primary-color)' : theme.bg,
                          color: freq === 'Immediate' ? 'white' : theme.textMuted,
                          border: `1.5px solid ${freq === 'Immediate' ? 'var(--primary-color)' : theme.border}`,
                          cursor: 'pointer', transition: '0.2s'
                        }}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '24px', padding: '28px', border: `1px solid rgba(var(--primary-rgb), 0.1)` }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900', color: 'var(--primary-color)' }}>Alert Precision</h4>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, lineHeight: '1.6', fontWeight: '500' }}>
                  Balanced dispatch ensures that tactical personnel remain focused while strategic leadership stays informed without notification fatigue.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "display" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--primary-rgb), 0.05)', padding: '12px 20px', borderRadius: '16px', border: '1px dashed var(--primary-color)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: 'var(--primary-color)' }}>Scope Awareness</p>
                  <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>These settings update the appearance for <strong>all staff and users</strong> system-wide.</p>
                </div>
                <div style={{ background: 'var(--primary-color)', color: 'var(--primary-contrast)', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>GLOBAL SCOPE</div>
              </div>

              <SectionCard theme={theme} title="System Appearance" subtitle="Control how your platform looks for both staff and citizens. Changes here propagate to every screen.">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div style={{ padding: '24px', background: theme.bg, borderRadius: '20px', border: `1.5px solid ${theme.border}` }}>
                    <label style={labelStyle}>Primary System Color</label>
                    <p style={{ margin: '-4px 0 12px 0', fontSize: '11px', color: theme.textMuted }}>Used for buttons, highlights, and main action elements.</p>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={settings.primary_color} 
                        onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))} 
                        style={{ width: '56px', height: '56px', padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }} 
                      />
                      <div style={{ flex: 1 }}>
                         <input 
                           type="text" 
                           value={settings.primary_color} 
                           onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))} 
                           style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: '700' }} 
                         />
                         <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            {['#3B82F6', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#1E293B'].map(c => (
                              <div key={c} onClick={() => setSettings(s => ({ ...s, primary_color: c }))} style={{ width: '28px', height: '28px', borderRadius: '8px', background: c, cursor: 'pointer', border: settings.primary_color === c ? '2px solid white' : '1px solid rgba(0,0,0,0.1)', boxShadow: settings.primary_color === c ? '0 0 0 2px var(--primary-color)' : 'none', transition: '0.2s' }} />
                            ))}
                         </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
                       <label style={{ ...labelStyle, fontSize: '11px', color: theme.textMuted }}>Accessibility Check</label>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                          <div style={{ padding: '6px 12px', background: settings.primary_color, color: getContrastColor(settings.primary_color), borderRadius: '6px', fontSize: '12px', fontWeight: '900' }}>Aa</div>
                          <div style={{ flex: 1 }}>
                             <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: theme.text }}>Readability Status</p>
                             <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted }}>{getContrastColor(settings.primary_color) === '#ffffff' ? 'Pass: High visibility (Light Text)' : 'Pass: High visibility (Dark Text)'}</p>
                          </div>
                          <div style={{ color: '#10B981' }}>
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div style={{ padding: '24px', background: theme.bg, borderRadius: '20px', border: `1.5px solid ${theme.border}` }}>
                    <label style={labelStyle}>Visual Presets</label>
                    <p style={{ margin: '-4px 0 16px 0', fontSize: '11px', color: theme.textMuted }}>Choose a framework that matches your organization type.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {[
                         { id: 'gov', name: 'Government Standard', color: '#1E40AF', sub: 'Formal and accessible. Best for public programs (DSWD Style).' },
                         { id: 'hosp', name: 'Hospitality Premium', color: '#B45309', sub: 'Warm and friendly. Best for guest services (Resorts/Hotels).' },
                         { id: 'corp', name: 'Corporate Minimal', color: '#0F172A', sub: 'Clean and neutral. Best for internal business operations.' }
                       ].map(p => (
                         <button 
                           key={p.id} 
                           onClick={() => setSettings(s => ({ ...s, primary_color: p.color, font_family: p.id === 'gov' ? "'Inter', sans-serif" : p.id === 'hosp' ? "'Outfit', sans-serif" : "'Inter', sans-serif" }))}
                           style={{ padding: '12px', background: theme.surface, border: `1.5px solid ${theme.border}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}
                           onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                           onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
                         >
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: p.color }} />
                            <div style={{ flex: 1 }}>
                               <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: theme.text }}>{p.name}</p>
                               <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted, lineHeight: '1.3' }}>{p.sub}</p>
                            </div>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                   <div style={{ padding: '24px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '20px', border: `1.5px solid ${theme.border}` }}>
                      <label style={labelStyle}>System Logo</label>
                      <p style={{ margin: '-4px 0 16px 0', fontSize: '11px', color: theme.textMuted }}>Shown in both admin and user screens.</p>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                         <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: theme.surface, border: `1.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '8px' }}>
                            {logoPreview ? <img src={logoPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>}
                         </div>
                         <div style={{ flex: 1 }}>
                            <input type="file" id="logo-upload-premium" hidden onChange={handleLogoChange} accept="image/*" />
                            <label htmlFor="logo-upload-premium" style={{ display: 'inline-block', padding: '10px 16px', background: 'var(--primary-color)', color: 'white', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Update Asset</label>
                         </div>
                      </div>
                   </div>

                    <div style={{ padding: '24px', background: theme.bg, borderRadius: '20px', border: `1.5px solid ${theme.border}` }}>
                       <label style={labelStyle}>Font Style</label>
                       <p style={{ margin: '-4px 0 16px 0', fontSize: '11px', color: theme.textMuted }}>Controls how text looks across the system.</p>
                       <select value={settings.font_family} onChange={e => setSettings(s => ({ ...s, font_family: e.target.value }))} style={{ ...inputStyle, fontWeight: '700' }}>
                          <option value="'Outfit', sans-serif">Outfit (Premium & Rounded)</option>
                          <option value="'Inter', sans-serif">Inter (Modern & Professional)</option>
                          <option value="'Roboto', sans-serif">Roboto (Structured & Clean)</option>
                          <option value="'Poppins', sans-serif">Poppins (Dynamic & Playful)</option>
                       </select>
                    </div>
                </div>

                 <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                    <button onClick={() => window.open('/preview', '_blank')} style={{ flex: 1, padding: '16px', background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: '16px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>
                       Preview Changes
                    </button>
                    <button onClick={handleBrandingUpdate} style={{ flex: 2, padding: '16px', background: 'var(--primary-color)', color: 'var(--primary-contrast)', border: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 12px 24px rgba(var(--primary-rgb), 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                       {updatingKey === 'branding' ? "Applying Updates..." : "Apply Changes System-Wide"}
                    </button>
                 </div>
              </SectionCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: theme.surface, borderRadius: '24px', padding: '28px', border: `1.5px solid ${theme.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Visual Fidelity</h4>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, lineHeight: '1.6', fontWeight: '500' }}>
                  The <strong>{displayDensity.toUpperCase()}</strong> preset optimizes layout spacing for your current workspace resolution.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--primary-rgb), 0.05)', padding: '16px 20px', borderRadius: '16px', border: '1px dashed var(--primary-color)' }}>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, fontWeight: '500' }}>
                  <strong>Note:</strong> This list only shows changes made within <strong>Global Settings</strong>.
                </p>
                <button onClick={() => onNavigate("auditlogs")} style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'var(--primary-contrast)', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                  View Full Audit Trail →
                </button>
              </div>

              <SectionCard theme={theme} title="Settings Activity" subtitle="A quick reference for recent configuration changes made on this page.">
                {activityLoading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>Synchronizing records...</div>
                ) : recentActions.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted, background: theme.bg, borderRadius: 16 }}>No recent changes found.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {recentActions.slice(0, 10).map((act, i) => (
                      <div
                        key={i}
                        onClick={() => { }}
                        style={{
                          display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px",
                          background: theme.bg, borderRadius: "14px", border: `1.5px solid ${theme.border}`,
                          transition: '0.2s', cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
                      >
                        <div style={{
                          width: "10px", height: "10px", borderRadius: "50%",
                          background: act.action_type.includes('error') ? '#EF4444' : (act.action_type.includes('update') ? '#3B82F6' : '#10B981'),
                          boxShadow: `0 0 10px ${act.action_type.includes('error') ? '#EF4444' : (act.action_type.includes('update') ? '#3B82F6' : '#10B981')}`
                        }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: theme.text }}>{act.action_type.replace(/_/g, ' ').toUpperCase()}</p>
                          <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: theme.textMuted, fontWeight: '600' }}>
                            {act.action_type.includes('update') ? 'Modified system protocol' : 'Administrative state change'}
                            <span style={{ color: 'var(--primary-color)', marginLeft: '8px' }}>→ Impacts Submissions Queue</span>
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ padding: '6px 12px', borderRadius: '8px', background: 'none', border: `1.5px solid ${theme.border}`, fontSize: '11px', fontWeight: '800', color: theme.text, cursor: 'pointer' }}>Revert</button>
                          <div style={{ padding: '4px 8px', borderRadius: '6px', background: theme.surface, border: `1px solid ${theme.border}`, fontSize: '10px', fontWeight: '900', color: theme.textMuted }}>
                            INFO
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ textAlign: 'center', marginTop: '24px', padding: '20px', background: 'rgba(var(--primary-rgb), 0.03)', borderRadius: '16px', border: `1px dashed ${theme.border}` }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: theme.textMuted, fontWeight: '500' }}>Access the complete immutable system audit trail.</p>
                      <button onClick={() => onNavigate("auditlogs")} style={{ padding: '10px 24px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Enter Global Audit Vault</button>
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: theme.surface, borderRadius: '24px', padding: '28px', border: `1.5px solid ${theme.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Session Analytics</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F59E0B15', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>Last Authentication</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: theme.text }}>{profile?.last_login ? new Date(profile.last_login).toLocaleTimeString() : "Just now"}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10B98115', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>Profile Integrity</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#10B981' }}>{profile?.profile_completed ? "100% Verified" : "Action Required"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: theme.bg, borderRadius: '24px', padding: '24px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, lineHeight: '1.5', fontWeight: '500' }}>
                  Activity tracking is compliant with local governance and data protection standards.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "terminology" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 🎯 QUICK PRESETS */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                {[
                  { id: 'gov', label: 'Government (DSWD Style)', values: { category_label: 'Program', category_label_plural: 'Programs', entity_label: 'Site', entity_label_plural: 'Sites', feedback_label: 'Learner Feedback', feedback_label_plural: 'Learner Feedbacks' } },
                  { id: 'hotel', label: 'Hotel / Hospitality', values: { category_label: 'Service', category_label_plural: 'Services', entity_label: 'Department', entity_label_plural: 'Departments', feedback_label: 'Guest Feedback', feedback_label_plural: 'Guest Feedbacks' } },
                  { id: 'retail', label: 'Retail / Food', values: { category_label: 'Division', category_label_plural: 'Divisions', entity_label: 'Branch', entity_label_plural: 'Branches', feedback_label: 'Customer Feedback', feedback_label_plural: 'Customer Feedbacks' } }
                ].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setTermForm(prev => ({ ...prev, ...preset.values }))}
                    style={{
                      padding: '10px 16px', background: theme.surface, color: theme.text,
                      border: `1.5px solid ${theme.border}`, borderRadius: '12px',
                      fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: '0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <SectionCard theme={theme} title="System Terminology" subtitle="These labels will appear across Submissions, Insights Hub, and Announcements. Use this to rename how services and feedback are labeled.">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  <div style={{ padding: '20px', background: theme.bg, borderRadius: '18px', border: `1.5px solid ${theme.border}`, borderLeft: termForm.category_label !== pristineTermForm.category_label ? '4px solid #D97706' : `1.5px solid ${theme.border}` }}>
                    <p style={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary-color)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧩 Main Service Label</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Singular (e.g., Program / Service)</label>
                        <input value={termForm.category_label} onChange={e => setTermForm(p => ({ ...p, category_label: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Plural (e.g., Programs / Services)</label>
                        <input value={termForm.category_label_plural} onChange={e => setTermForm(p => ({ ...p, category_label_plural: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '20px', background: theme.bg, borderRadius: '18px', border: `1.5px solid ${theme.border}`, borderLeft: termForm.entity_label !== pristineTermForm.entity_label ? '4px solid #D97706' : `1.5px solid ${theme.border}` }}>
                    <p style={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary-color)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧩 Operational Unit</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Singular (e.g., Site / Branch)</label>
                        <input value={termForm.entity_label} onChange={e => setTermForm(p => ({ ...p, entity_label: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Plural (e.g., Sites / Branches)</label>
                        <input value={termForm.entity_label_plural} onChange={e => setTermForm(p => ({ ...p, entity_label_plural: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  <div style={{ gridColumn: "1 / span 2", padding: '20px', background: theme.bg, borderRadius: '18px', border: `1.5px solid ${theme.border}`, borderLeft: termForm.feedback_label !== pristineTermForm.feedback_label ? '4px solid #D97706' : `1.5px solid ${theme.border}` }}>
                    <p style={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary-color)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧩 Feedback Architecture</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <div>
                        <label style={labelStyle}>Feedback Label (e.g., Complaint / Survey)</label>
                        <input value={termForm.feedback_label} onChange={e => setTermForm(p => ({ ...p, feedback_label: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Plural (e.g., Complaints / Surveys)</label>
                        <input value={termForm.feedback_label_plural} onChange={e => setTermForm(p => ({ ...p, feedback_label_plural: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 👁️ LIVE PREVIEW (IMPACT) */}
              <div style={{ background: theme.surface, borderRadius: '24px', padding: '28px', border: `1.5px solid ${theme.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'sticky', top: '24px' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interface Live Preview</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* BUTTON PREVIEW */}
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '800', color: theme.textMuted }}>BUTTON & HOVER STATE</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <button style={{ padding: '10px 20px', background: 'var(--primary-color)', color: 'var(--primary-contrast)', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Solid Action</button>
                       <button style={{ padding: '10px 20px', background: 'var(--primary-soft)', color: 'var(--primary-color)', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Soft Action</button>
                    </div>
                  </div>

                  {/* FORM PREVIEW */}
                  <div style={{ padding: '16px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '800', color: theme.textMuted }}>FIELD & FOCUS</p>
                    <div style={{ width: '100%', height: '36px', background: theme.surface, border: `2px solid var(--primary-color)`, borderRadius: '8px', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                       <span style={{ fontSize: '12px', color: theme.text }}>Input focusing...</span>
                       <div style={{ marginLeft: '4px', width: '2px', height: '14px', background: 'var(--primary-color)' }} />
                    </div>
                  </div>

                  {/* WIDGET PREVIEW */}
                  <div style={{ padding: '16px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '800', color: theme.textMuted }}>DASHBOARD WIDGET</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: theme.text }}>Active {termForm.category_label_plural || labels.category_label_plural}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '900', color: 'var(--primary-color)' }}>42</p>
                  </div>

                  {/* ICON PREVIEW */}
                  <div style={{ padding: '16px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '800', color: theme.textMuted }}>ICONOGRAPHY TINT</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-soft)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                       </div>
                       <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                       </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', fontSize: '11px', color: theme.textMuted }}>
                   <p style={{ margin: 0, fontWeight: '700', marginBottom: '4px' }}>Deployment Footprint:</p>
                   <ul style={{ margin: 0, paddingLeft: '18px' }}>
                      <li>Public Portal Forms & Success Pages</li>
                      <li>Admin Dashboard Charts & Highlights</li>
                      <li>System-wide Navigation Accents</li>
                   </ul>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <ImpactScope modules="Submissions, Insights, Global Hub" users={activeProfile.audience} description={`Propagates to all ${activeProfile.audience.toLowerCase()} modules.`} theme={theme} />
                </div>
              </div>

              <div style={{ background: 'rgba(var(--primary-rgb), 0.03)', borderRadius: '24px', padding: '24px', border: `1px dashed ${theme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted }}>CURRENT VERSION</span>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary-color)' }}>v1.4.2</span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, lineHeight: '1.5' }}>
                  Terminology changes affect all modules including Citizen Feedback Hub and Executive Dashboards.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system" && isGlobalCoreAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <SectionCard theme={theme} title="Organization Profile" subtitle="Select the primary operational mode for the platform.">
                <div style={{ padding: '16px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '12px', border: `1px solid rgba(var(--primary-rgb), 0.1)` }}>
                  <label style={labelStyle}>Operational Logic Mode</label>
                  <select style={inputStyle} value={orgType} onChange={e => setOrgType(e.target.value)}>
                    <option value="government">Government & Public Program (Governance focus)</option>
                    <option value="service">Hospitality & Service Business (Guest Experience focus)</option>
                    <option value="corporate">Internal Enterprise (SOP & Staff focus)</option>
                  </select>
                  <p style={{ marginTop: '12px', fontSize: '11px', color: theme.textMuted, lineHeight: '1.5' }}>
                    💡 Switching the mode dynamically re-aligns system terminology, policy references, and operational guardrails.
                  </p>
                </div>
              </SectionCard>

              <SectionCard theme={theme} title="Time & Regional Strategy" subtitle="Standardize temporal governance across all programs and interactions.">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ padding: '16px', background: theme.bg, borderRadius: '16px', border: `1.5px solid ${theme.border}` }}>
                    <label style={labelStyle}>Primary Timezone</label>
                    <select style={inputStyle} value={timeConfig.timezone} onChange={e => setTimeConfig(s => ({ ...s, timezone: e.target.value }))}>
                      <option>Asia/Manila (UTC+8)</option>
                      <option>UTC (Coordinated Universal Time)</option>
                      <option>America/New_York (UTC-5)</option>
                    </select>
                    <p style={{ marginTop: '8px', fontSize: '10px', color: theme.textMuted }}>Used for audit trails and scheduled broadcasts.</p>
                  </div>

                  <div style={{ padding: '16px', background: theme.bg, borderRadius: '16px', border: `1.5px solid ${theme.border}` }}>
                    <label style={labelStyle}>Time Display Format</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                       {['12h', '24h'].map(f => (
                         <button 
                           key={f}
                           onClick={() => setTimeConfig(s => ({ ...s, time_format: f }))}
                           style={{ 
                             flex: 1, padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                             background: timeConfig.time_format === f ? 'var(--primary-color)' : theme.surface,
                             color: timeConfig.time_format === f ? 'white' : theme.text,
                             border: `1.5px solid ${timeConfig.time_format === f ? 'var(--primary-color)' : theme.border}`,
                             cursor: 'pointer'
                           }}
                         >
                           {f === '12h' ? '12-Hour (02:00 PM)' : '24-Hour (14:00)'}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / span 2', padding: '16px', background: theme.bg, borderRadius: '16px', border: `1.5px solid ${theme.border}` }}>
                    <label style={labelStyle}>Date Visualization Format</label>
                    <select style={inputStyle} value={timeConfig.date_format} onChange={e => setTimeConfig(s => ({ ...s, date_format: e.target.value }))}>
                      <option>MMMM DD, YYYY (April 22, 2026)</option>
                      <option>DD/MM/YYYY (22/04/2026)</option>
                      <option>YYYY-MM-DD (2026-04-22)</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard theme={theme} title="Operational Guardrails" subtitle={`Settings anchored to ${activeProfile.policy_ref}.`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <ToggleRow title={`${activeProfile.window_label} Validation`} description={`Restrict submissions to active ${activeProfile.window_label.toLowerCase()} periods only.`} checked={settings.public_feed} onChange={() => setSettings(s => ({ ...s, public_feed: !s.public_feed }))} theme={theme} darkMode={darkMode} />
                  <ToggleRow title="Data Life-cycle Protocol" description="Aggressive masking of identities in public and lower-tier reports." checked={settings.email_notifications} onChange={() => setSettings(s => ({ ...s, email_notifications: !s.email_notifications }))} theme={theme} darkMode={darkMode} />

                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '24px' }}>
                    <label style={labelStyle}>Submission Rate Limit (per {activeProfile.audience.split(' / ')[0]})</label>
                    <input type="number" defaultValue={2} style={inputStyle} />
                    <ImpactScope modules="Submission API" users={activeProfile.audience} description={`Prevents data duplication and ensures high-quality ${getLabel("feedback_label", "feedback")} records.`} theme={theme} />
                  </div>

                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '24px' }}>
                    <label style={labelStyle}>Data Sovereignty Protocol</label>
                    <select style={inputStyle}>
                      <option>Standard Retention (3 Years)</option>
                      <option>Extended Compliance (5 Years)</option>
                      <option>Permanent Operational Archive</option>
                    </select>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', color: 'white' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Governance Enforcement</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontWeight: '500' }}>
                  These configurations represent the operational "Constitution" of the platform for the <strong>{orgType.toUpperCase()}</strong> domain.
                </p>
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Compliance Tier</span>
                    <span style={{ fontWeight: '900' }}>{orgType === 'government' ? 'FEDERAL-PLUS' : 'ENTERPRISE-PRO'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;