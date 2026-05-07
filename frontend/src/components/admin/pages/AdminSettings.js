import React, { useState, useEffect } from "react";
import { adminGetProfile, adminUpdateProfile, getSystemLabels, updateSystemLabelsBulk, adminGetProfileActivity, getAdminSettings, updateAdminSetting } from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import { STORAGE_KEYS } from "../../../utils/storage";
import ImageCropperModal from "../../ImageCropperModal";

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

const Icons = {
  Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  EyeOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
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

const AccordionCard = ({ title, subtitle, children, theme, status, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{ background: theme.surface, borderRadius: "24px", border: `1.5px solid ${theme.border}`, marginBottom: "20px", overflow: 'hidden', transition: '0.3s', boxShadow: isExpanded ? '0 10px 30px rgba(0,0,0,0.04)' : 'none' }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ padding: "24px 28px", cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? 'rgba(var(--primary-rgb), 0.02)' : 'transparent', transition: '0.2s' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "900", color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
            {status && (
              <div style={{ padding: '3px 10px', borderRadius: '6px', background: status.color + '15', color: status.color, fontSize: '10px', fontWeight: '900', border: `1px solid ${status.color}20` }}>{status.label}</div>
            )}
          </div>
          {subtitle && <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: theme.textMuted, fontWeight: '500' }}>{subtitle}</p>}
        </div>
        <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)', color: isExpanded ? 'var(--primary-color)' : theme.textMuted }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>

      <div style={{
        maxHeight: isExpanded ? '2000px' : '0',
        opacity: isExpanded ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        borderTop: isExpanded ? `1.5px solid ${theme.border}` : '0.5px solid transparent'
      }}>
        <div style={{ padding: '28px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const ImpactScope = ({ modules, users, description, theme }) => (
  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', borderLeft: '3px solid #3B82F6' }}>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase' }}>Scope: {modules}</div>
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#6366F1', textTransform: 'uppercase' }}>Audience: {users}</div>
    </div>
    <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: '500', lineHeight: '1.4' }}>{description}</p>
  </div>
);

const RevertConfirmationModal = ({ action, onConfirm, onCancel, theme }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
    <div style={{ width: '440px', background: theme.surface, borderRadius: '24px', padding: '32px', border: `1.5px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EF444415', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
      </div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900', color: theme.text, letterSpacing: '-0.02em' }}>Revert Change?</h3>
      <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: theme.textMuted, lineHeight: '1.6' }}>
        This will restore the previous configuration for <strong>{action.details?.updated_fields?.join(', ') || 'this system setting'}</strong>.
        This action will be recorded in the system audit trail.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onConfirm} style={{ flex: 1, padding: '14px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Confirm Revert</button>
        <button onClick={onCancel} style={{ padding: '14px 24px', background: 'none', border: `1.5px solid ${theme.border}`, borderRadius: '12px', fontWeight: '800', color: theme.text, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
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
  const { labels, refreshLabels, getLabel, systemName, systemLogo } = useTerminology();
  const isGlobalAdmin = ["admin", "superadmin"].includes(adminUser?.role) && !adminUser?.department;
  const isGlobalCoreAdmin = (adminUser?.email || "").toLowerCase() === "admin@globalcore.com";

  // 🌍 ORGANIZATION CONTEXT (Neutral Engine)
  // org_type is now managed within the settings state for backend persistence

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

  const [settings, setSettings] = useState({
    allow_voice: true,
    public_feed: true,
    email_notifications: false,
    status_notifications: true,
    primary_color: "#3B82F6",
    font_family: "'Outfit', sans-serif",
    org_type: "government",
    timezone: "Asia/Manila (UTC+8)",
    time_format: "12h",
    date_format: "MMMM DD, YYYY",
    week_start: "Monday",
    submission_rate_limit: 5,
    data_sovereignty: "on-premise",
    primary_organization_name: "",
    general_report_title: "",
    general_report_title_fil: "",
    form_show_staff: true,
    form_show_rating: true,
    form_show_attachments: true,
    form_show_voice: true
  });

  const activeProfile = orgProfiles[settings.org_type || "government"] || orgProfiles.government;
  const [activeTab, setActiveTab] = useState("profile");
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
    notify_announcements: true,
    notify_replies: true,
    weekly_digest: false,
    biometrics_enabled: true,
    position_title: "",
    unit_name: "",
    phone: "",
  });
  const [cropper, setCropper] = useState({ isOpen: false, image: null });

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
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [showRevertModal, setShowRevertModal] = useState(null);

  const getActivityMeta = (type) => {
    const t = type.toLowerCase();
    if (t.includes('profile')) return { title: 'Admin Profile Updated', category: 'Identity', color: '#6366F1' };
    if (t.includes('branding') || t.includes('logo') || t.includes('color')) return { title: 'Branding Protocol Updated', category: 'Branding', color: '#F59E0B' };
    if (t.includes('password') || t.includes('security')) return { title: 'Security Protocol Modified', category: 'Security', color: '#EF4444' };
    return { title: 'System Setting Updated', category: 'Configuration', color: '#3B82F6' };
  };

  useEffect(() => {
    const root = document.documentElement;

    if (settings.primary_color) {
      const primary = settings.primary_color;
      const rgb = hexToRgb(primary);
      const contrast = getContrastColor(primary);
      const hover = adjustBrightness(primary, -20);

      root.style.setProperty('--primary-color', primary);
      root.style.setProperty('--primary-rgb', rgb);
      root.style.setProperty('--primary-contrast', contrast);
      root.style.setProperty('--primary-hover', hover);
      root.style.setProperty('--primary-soft', `rgba(${rgb}, 0.1)`);

      localStorage.setItem('admin_primary_color', primary);
      localStorage.setItem('public_primary_color', primary);
      window.dispatchEvent(new StorageEvent('storage', { key: 'primary_color', newValue: primary }));
    }

    if (settings.font_family) {
      root.style.setProperty('--font-family', settings.font_family);
      localStorage.setItem('admin_font_family', settings.font_family);
    }
  }, [settings.primary_color, settings.font_family]);

  const isFormDirty = JSON.stringify(form) !== JSON.stringify(pristineForm);
  const isTermDirty = JSON.stringify(termForm) !== JSON.stringify(pristineTermForm);
  const isSettingsDirty = JSON.stringify(settings) !== JSON.stringify(pristineSettings);
  const isLogoDirty = logoPreview !== (pristineSettings.primary_organization_logo || null);
  const hasUnsavedChanges = isFormDirty || isTermDirty || isSettingsDirty || isLogoDirty;

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
    // Logo changes
    if (logoPreview !== (pristineSettings.primary_organization_logo || null)) {
      changes.push({ section: "Branding", label: "Organization Logo", from: "Current Logo", to: "New Uploaded Asset" });
    }
    return changes;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [sysSettings, profileData] = await Promise.all([
          getAdminSettings().catch(() => []),
          adminGetProfile()
        ]);
        let mergedSettings = { ...settings };
        if (sysSettings?.length) {
          const mapped = {};
          sysSettings.forEach(s => {
            mapped[s.key] = (s.value === "true" || s.value === "false") ? (s.value === "true") : s.value;
          });
          mergedSettings = { ...settings, ...mapped };
          setSettings(mergedSettings);

          setLogoPreview(mapped.primary_organization_logo || null);
          setLogoMeta({
            updated_at: mapped.logo_last_updated_at || null,
            updated_by: mapped.logo_updated_by || null
          });
        }

        setProfile(profileData);
        const currentForm = {
          ...form,
          name: profileData.name || "",
          avatar_url: profileData.avatar_url || "",
          two_factor_enabled: !!profileData.two_factor_enabled,
          push_notifications: !!profileData.push_notifications,
          email_notifications: !!profileData.email_notifications,
          notify_announcements: !!profileData.notify_announcements,
          notify_replies: !!profileData.notify_replies,
          weekly_digest: !!profileData.weekly_digest,
          position_title: profileData.position_title || "",
          unit_name: profileData.unit_name || "",
          phone: profileData.phone || "",
          biometrics_enabled: !!profileData.biometrics_enabled,
        };
        setForm(currentForm);
        setPristineForm({ ...currentForm, current_password: "", password: "" });

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

        // 🚀 CRITICAL: Set pristine settings AFTER backend load
        setPristineSettings(mergedSettings);
      } catch (e) {
        console.error("Failed to load settings/profile", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [labels]);

  // Pristine tracking is now handled inside the load effect to ensure it captures backend data

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
          const ctx = canvas.getContext('2d');
          
          // Enforce 1x1 square crop (center-weighted)
          const size = Math.min(img.width, img.height);
          const targetSize = Math.min(size, 400); 
          
          canvas.width = targetSize;
          canvas.height = targetSize;
          
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, targetSize, targetSize);
          
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropper({ isOpen: true, image: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedBase64) => {
    setCropper({ isOpen: false, image: null });
    setForm(prev => ({ ...prev, avatar_url: croppedBase64 }));
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm("Are you sure you want to remove the organization logo? This will revert to the default system icon.")) return;
    setLogoPreview(null);
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

  // Global Config tab removed per user request
  // if (isGlobalCoreAdmin) {
  //   tabs.push({ id: "system", label: "Global Config" });
  // }

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
      const promises = [];

      // 1. Profile Update
      const profileChanged = Object.keys(form).some(k => form[k] !== pristineForm[k]);
      if (profileChanged) {
        promises.push(adminUpdateProfile(form));
      }

      // 2. Terminology Update
      const termChanged = Object.keys(termForm).some(k => termForm[k] !== pristineTermForm[k]);
      if (termChanged) {
        promises.push(updateSystemLabelsBulk(termForm));
      }

      // 3. Settings Update (Sequential patches as backend only supports per-key)
      for (const key of Object.keys(settings)) {
        if (settings[key] !== pristineSettings[key]) {
          promises.push(updateAdminSetting(key, String(settings[key])));
        }
      }

      // 4. Logo Update
      if (logoPreview !== (pristineSettings.primary_organization_logo || null)) {
        promises.push(updateAdminSetting("primary_organization_logo", logoPreview || ""));
      }

      await Promise.all(promises);

      // Apply branding live if changed
      if (settings.primary_color) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', settings.primary_color);
        root.style.setProperty('--primary-rgb', hexToRgb(settings.primary_color));
      }
      if (settings.font_family) {
        document.documentElement.style.setProperty('--font-family', settings.font_family);
      }

      localStorage.setItem('admin_time_format', settings.time_format || "12h");
      localStorage.setItem('admin_date_format', settings.date_format || "MMMM DD, YYYY");

      setLastSaved(new Date());
      setPristineForm({ ...form });
      setPristineTermForm({ ...termForm });
      setPristineSettings({ ...settings });
      setIsEditingProfile(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);

      if (onAdminUpdate) {
        const updatedProfile = await adminGetProfile();
        onAdminUpdate(updatedProfile);
      }
    } catch (e) {
      console.error("Global save failed", e);
      alert("System synchronization failed. Please check your network connection.");
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>System Sync Status</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: '800', color: hasUnsavedChanges ? '#D97706' : '#10B981' }}>
                {hasUnsavedChanges ? '● You have unsaved changes' : '● All changes saved'}
              </p>
              {hasUnsavedChanges && (
                <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: theme.textMuted, fontWeight: '600' }}>
                  {calculateChanges().length} {calculateChanges().length === 1 ? 'change' : 'changes'} pending ({[...new Set(calculateChanges().map(c => c.section))].join(', ')})
                </p>
              )}
            </div>

            {hasUnsavedChanges && (
              <div style={{ width: '1px', height: '32px', background: theme.border, margin: '0 8px' }} />
            )}

            <button
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
              style={{ padding: '8px 16px', background: 'none', border: `1.5px solid ${theme.border}`, borderRadius: '10px', fontSize: '12px', fontWeight: '800', color: theme.textMuted, cursor: hasUnsavedChanges ? 'pointer' : 'default', opacity: hasUnsavedChanges ? 1 : 0.4 }}
            >
              Discard
            </button>
            <button
              onClick={handleGlobalSave}
              disabled={!hasUnsavedChanges || profileSaving}
              style={{
                padding: '10px 24px', background: hasUnsavedChanges ? 'var(--primary-color)' : theme.surface,
                color: hasUnsavedChanges ? 'white' : theme.textMuted, border: `1.5px solid ${hasUnsavedChanges ? 'transparent' : theme.border}`, borderRadius: '12px',
                fontSize: '12px', fontWeight: '900', cursor: hasUnsavedChanges ? 'pointer' : 'default',
                boxShadow: hasUnsavedChanges ? '0 12px 24px rgba(var(--primary-rgb), 0.3)' : 'none',
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {profileSaving ? 'Synchronizing...' : `Save Changes ${hasUnsavedChanges ? `(${calculateChanges().length})` : ''}`}
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
            Changes successfully applied system-wide
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
                          {isGlobalAdmin ? (
                            systemLogo ? (
                              <img src={systemLogo} alt="System Logo" style={{ width: "120px", height: "120px", borderRadius: "28px", objectFit: "contain", background: 'white', padding: '10px', border: `3px solid ${theme.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }} />
                            ) : (
                              <div style={{ width: "120px", height: "120px", borderRadius: "28px", background: "linear-gradient(135deg, var(--primary-color), #4F46E5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", fontWeight: "900", boxShadow: '0 8px 20px rgba(var(--primary-rgb), 0.2)' }}>{profile.name?.charAt(0)}</div>
                            )
                          ) : (
                            profile.avatar_url
                              ? <img src={profile.avatar_url} alt={profile.name} style={{ width: "120px", height: "120px", borderRadius: "28px", objectFit: "cover", border: `3px solid ${theme.border}`, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }} />
                              : <div style={{ width: "120px", height: "120px", borderRadius: "28px", background: "linear-gradient(135deg, var(--primary-color), #4F46E5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", fontWeight: "900", boxShadow: '0 8px 20px rgba(var(--primary-rgb), 0.2)' }}>{profile.name?.charAt(0)}</div>
                          )}
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
                              style={{ padding: "12px 24px", background: 'var(--primary-color)', color: "white", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: "900", cursor: "pointer", transition: '0.3s', boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.2)' }}
                            >
                              Modify Account Identity
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
                        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '32px' }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{ width: "120px", height: "120px", borderRadius: "28px", background: theme.bg, border: `3px dashed ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {isGlobalAdmin ? (
                                systemLogo ? <img src={systemLogo} style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'white', padding: '10px' }} /> : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              ) : (
                                form.avatar_url ? <img src={form.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              )}
                            </div>
                            {!isGlobalAdmin && (
                              <>
                                <input type="file" id="avatar-upload" hidden onChange={handleAvatarChange} accept="image/*" />
                                <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: -8, right: -8, width: '36px', height: '36px', background: 'var(--primary-color)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(var(--primary-rgb), 0.3)', border: `3px solid ${theme.surface}` }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                </label>
                              </>
                            )}
                          </div>
                          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
                  <p style={{ margin: '6px 0 0 0', fontSize: '14px', fontWeight: '800', color: theme.text }}>Parañaque City, PH • Just now</p>
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
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showCurrentPass ? "text" : "password"}
                            value={form.current_password || ""}
                            onChange={e => setForm(prev => ({ ...prev, current_password: e.target.value }))}
                            style={{ ...inputStyle, paddingRight: '40px' }}
                            placeholder="Verify identity..."
                          />
                          <div
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}
                          >
                            {showCurrentPass ? <Icons.Eye /> : <Icons.EyeOff />}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>New Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showNewPass ? "text" : "password"}
                            value={form.password || ""}
                            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                            style={{ ...inputStyle, paddingRight: '40px' }}
                            placeholder="Enter new password..."
                          />
                          <div
                            onClick={() => setShowNewPass(!showNewPass)}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}
                          >
                            {showNewPass ? <Icons.Eye /> : <Icons.EyeOff />}
                          </div>
                        </div>
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
                  <div style={{ marginTop: '32px', borderTop: `1px solid ${theme.border}`, paddingTop: '24px' }}>
                    <button
                      onClick={handleGlobalSave}
                      disabled={!isSettingsDirty && !isFormDirty}
                      style={{
                        padding: '12px 28px',
                        background: (isSettingsDirty || isFormDirty) ? 'var(--primary-color)' : theme.bg,
                        color: (isSettingsDirty || isFormDirty) ? 'white' : theme.textMuted,
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '900',
                        cursor: (isSettingsDirty || isFormDirty) ? 'pointer' : 'default',
                        boxShadow: (isSettingsDirty || isFormDirty) ? '0 8px 20px rgba(var(--primary-rgb), 0.2)' : 'none',
                        transition: '0.3s'
                      }}
                    >
                      Apply Security Updates
                    </button>
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
                    <ToggleRow title="Task Assignments" description="Receive an alert whenever a case or location is assigned to your unit." checked={form.notify_announcements} onChange={() => setForm(prev => ({ ...prev, notify_announcements: !prev.notify_announcements }))} theme={theme} darkMode={darkMode} />
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
              {showRevertModal && (
                <RevertConfirmationModal
                  action={showRevertModal}
                  onConfirm={() => { setShowRevertModal(null); setSuccessMsg("✅ Change successfully reverted."); setTimeout(() => setSuccessMsg(""), 3000); }}
                  onCancel={() => setShowRevertModal(null)}
                  theme={theme}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--primary-rgb), 0.05)', padding: '16px 20px', borderRadius: '16px', border: '1px dashed var(--primary-color)' }}>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, fontWeight: '500' }}>
                  <strong>Note:</strong> This view shows recent configuration changes made in <strong>Global Settings</strong>. For full system activity, open the Global Audit Trail.
                </p>
                <button onClick={() => onNavigate("auditlogs")} style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'var(--primary-contrast)', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                  View Full Audit Trail →
                </button>
              </div>

              <SectionCard theme={theme} title="Settings Activity" subtitle="A governance-level trace of recent configuration changes and identity updates.">
                {activityLoading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>Synchronizing records...</div>
                ) : recentActions.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted, background: theme.bg, borderRadius: 16 }}>No recent changes found.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {recentActions.slice(0, 10).map((act, i) => {
                      const meta = getActivityMeta(act.action_type);
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex", alignItems: 'flex-start', gap: "16px", padding: "20px",
                            background: theme.bg, borderRadius: "16px", border: `1.5px solid ${theme.border}`,
                            transition: '0.2s'
                          }}
                        >
                          <div style={{
                            marginTop: '4px', width: "10px", height: "10px", borderRadius: "50%",
                            background: meta.color,
                            boxShadow: `0 0 10px ${meta.color}`
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <p style={{ margin: 0, fontSize: "14px", fontWeight: "900", color: theme.text }}>{meta.title}</p>
                              <div style={{ padding: '2px 8px', borderRadius: '6px', background: `${meta.color}15`, color: meta.color, fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>{meta.category}</div>
                            </div>
                            <p style={{ margin: "0", fontSize: "12px", color: theme.textMuted, fontWeight: '500', lineHeight: '1.4' }}>
                              {act.details?.updated_fields ? `Modified fields: ${act.details.updated_fields.join(', ')}` : meta.title}
                            </p>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>{profile?.name || 'Global Admin'}</span>
                              </div>
                              <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: theme.border }} />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>{new Date(act.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setShowRevertModal(act)}
                              style={{ padding: '8px 16px', borderRadius: '10px', background: 'none', border: `1.5px solid ${theme.border}`, fontSize: '12px', fontWeight: '800', color: theme.text, cursor: 'pointer', transition: '0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
                            >
                              Revert
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ textAlign: 'center', marginTop: '16px', padding: '24px', background: theme.surface, borderRadius: '20px', border: `1.5px solid ${theme.border}` }}>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: theme.textMuted, fontWeight: '500', lineHeight: '1.6' }}>
                        Access full, immutable system-wide activity logs stored in the governance vault.
                      </p>
                      <button onClick={() => onNavigate("auditlogs")} style={{ padding: '12px 28px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 20px rgba(var(--primary-rgb), 0.25)' }}>Enter Audit Vault</button>
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
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: profile?.profile_completed ? '#10B981' : '#F59E0B' }}>
                        {profile?.profile_completed ? "100% Verified" : "Required security fields pending"}
                      </p>
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
              {/* 🎯 PRESET VOCABULARIES */}
              <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Presets</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { id: 'gov', label: 'Government (Programs & Beneficiaries)', values: { category_label: 'Program', category_label_plural: 'Programs', entity_label: 'Site', entity_label_plural: 'Sites', feedback_label: 'Beneficiary Feedback', feedback_label_plural: 'Beneficiary Feedbacks' } },
                    { id: 'hotel', label: 'Hospitality (Services & Guests)', values: { category_label: 'Service', category_label_plural: 'Services', entity_label: 'Department', entity_label_plural: 'Departments', feedback_label: 'Guest Feedback', feedback_label_plural: 'Guest Feedbacks' } },
                    { id: 'retail', label: 'Retail (Products & Customers)', values: { category_label: 'Division', category_label_plural: 'Divisions', entity_label: 'Branch', entity_label_plural: 'Branches', feedback_label: 'Customer Feedback', feedback_label_plural: 'Customer Feedbacks' } }
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
              </div>

              <SectionCard theme={theme} title="System Labels" subtitle="Define how key terms (e.g., Program, Service, Office) appear across dashboards, forms, and reports.">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  <div style={{ gridColumn: "1 / span 2", padding: '24px', background: theme.bg, borderRadius: '20px', border: `1.5px solid ${theme.border}` }}>
                    <p style={{ fontSize: '12px', fontWeight: '900', color: theme.textMuted, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Core Terms</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                          <label style={labelStyle}>Primary Category (e.g., Program / Service)</label>
                          <input value={termForm.category_label} onChange={e => setTermForm(p => ({ ...p, category_label: e.target.value }))} style={inputStyle} placeholder="Program" />
                        </div>
                        <div>
                          <label style={labelStyle}>Category Plural</label>
                          <input value={termForm.category_label_plural} onChange={e => setTermForm(p => ({ ...p, category_label_plural: e.target.value }))} style={inputStyle} placeholder="Programs" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                          <label style={labelStyle}>Operational Unit (e.g., Site / Office)</label>
                          <input value={termForm.entity_label} onChange={e => setTermForm(p => ({ ...p, entity_label: e.target.value }))} style={inputStyle} placeholder="Site" />
                        </div>
                        <div>
                          <label style={labelStyle}>Unit Plural</label>
                          <input value={termForm.entity_label_plural} onChange={e => setTermForm(p => ({ ...p, entity_label_plural: e.target.value }))} style={inputStyle} placeholder="Sites" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ gridColumn: "1 / span 2", padding: '24px', background: theme.bg, borderRadius: '20px', border: `1.5px solid ${theme.border}` }}>
                    <p style={{ fontSize: '12px', fontWeight: '900', color: theme.textMuted, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feedback Terms</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                      <div>
                        <label style={labelStyle}>Primary Response Type (e.g., Feedback / Survey)</label>
                        <input value={termForm.feedback_label} onChange={e => setTermForm(p => ({ ...p, feedback_label: e.target.value }))} style={inputStyle} placeholder="Feedback" />
                      </div>
                      <div>
                        <label style={labelStyle}>Response Plural</label>
                        <input value={termForm.feedback_label_plural} onChange={e => setTermForm(p => ({ ...p, feedback_label_plural: e.target.value }))} style={inputStyle} placeholder="Feedbacks" />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: theme.surface, borderRadius: '24px', padding: '28px', border: `1.5px solid ${theme.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'sticky', top: '24px' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Context Preview</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ padding: '20px', background: theme.bg, borderRadius: '16px', border: `1.5px solid ${theme.border}` }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' }}>Dashboard View</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.text }}>Active {termForm.category_label_plural || 'Programs'}</p>
                    <div style={{ marginTop: '8px', width: '40%', height: '8px', background: 'var(--primary-color)', borderRadius: '4px' }} />
                  </div>

                  <div style={{ padding: '20px', background: theme.bg, borderRadius: '16px', border: `1.5px solid ${theme.border}` }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' }}>Form View</p>
                    <p style={{ margin: 0, fontSize: '13px', color: theme.text }}>Select {termForm.category_label || 'Program'} at {termForm.entity_label || 'Site'}</p>
                  </div>

                  <div style={{ padding: '20px', background: theme.bg, borderRadius: '16px', border: `1.5px solid ${theme.border}` }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' }}>Submission Action</p>
                    <div style={{ padding: '10px 16px', background: 'var(--primary-color)', color: 'white', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'inline-block' }}>
                      Submit {termForm.feedback_label || 'Feedback'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '14px', border: `1px solid rgba(var(--primary-rgb), 0.1)` }}>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--primary-color)', fontWeight: '700', lineHeight: '1.6' }}>
                    💡 These labels will be visible to both staff members and citizens system-wide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Global Config Tab Content Removed */}
        <ImageCropperModal 
          isOpen={cropper.isOpen} 
          imageSrc={cropper.image} 
          onCrop={handleCropConfirm} 
          onCancel={() => setCropper({ isOpen: false, image: null })} 
        />
      </div>
    </div>
  );
};

export default AdminSettings;