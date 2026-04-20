import React, { useState, useEffect } from "react";
import { useTerminology } from "../../../context/TerminologyContext";
import { 
  adminGetEntities,
  getEntityFormConfig,
  updateEntityFormConfig,
  getSystemLabels,
  adminGetWorkflowTemplates,
  adminCreateWorkflowTemplate,
  adminDeleteWorkflowTemplate
} from "../../../services/adminApi";
import GeneralFeedback from "../../GeneralFeedback";
import { IconRegistry } from "../../IconRegistry";
import CustomModal from "../../CustomModal";

// --- UI Constants ---
const st = {
  select: (t) => ({ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.bg, color: t.text }),
  input: (t) => ({ width: '100%', padding: '9px 12px', borderRadius: '9px', border: `1px solid ${t.border}`, background: t.bg, fontSize: '13px' }),
  btnPrimary: (isLoading) => ({ padding: '9px 18px', borderRadius: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }),
  addBtn: (t) => ({ background: 'none', border: `1px dashed ${t.border}`, borderRadius: '9px', padding: '6px 12px', color: 'var(--primary-color)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }),
  addItemBtn: (color, bg) => ({ flex: 1, padding: '7px 10px', borderRadius: '8px', border: `1.5px dashed ${color}30`, background: bg, color, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }),
  libraryBtn: (t) => ({ padding: '12px 10px', borderRadius: '12px', background: 'white', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', height: '100%' }),
  librarySearch: (t) => ({ width: '100%', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'white', fontSize: '12px', marginBottom: '12px', outline: 'none' }),
  toggle: (active) => ({ width: '28px', height: '14px', borderRadius: '20px', background: active ? 'var(--primary-color)' : '#E2E8F0', position: 'relative', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-block' }),
  toggleKnob: (active) => ({ width: '10px', height: '10px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: active ? '16px' : '2px', transition: 'all 0.2s' })
};

const Ico = {
  Plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  ChevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  Save: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Box: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  AlertTriangle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  User: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Paperclip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  EyeOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  MapPin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  MessageSquare: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Building: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="9" y1="14" x2="9" y2="14"/><line x1="15" y1="14" x2="15" y2="14"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/></svg>,
  Smile: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Sliders: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="12" x2="14" y2="12"/><line x1="18" y1="16" x2="22" y2="16"/></svg>,
  Type: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  FileText: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M7 21v-2a4 4 0 0 1 3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="7" r="4"/></svg>,
  List: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Hash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  Home: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Globe: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
};

const FIELD_TYPES = [
  { value: "text",     label: "Text Field" },
  { value: "dropdown", label: "Dropdown Menu" },
  { value: "rating",   label: "Star Rating" },
  { value: "number",   label: "Number Input" },
  { value: "date",     label: "Date Picker" }
];

const MODULE_OPTIONS = [
  { group: 'RATINGS', items: [
    { key: 'star_rating', label: 'Star Rating', desc: '1-5 Star feedback', icon: Ico.Star },
    { key: 'emoji_rating', label: 'Emoji Rating', desc: 'Feeling based feedback', icon: Ico.Smile },
    { key: 'slider_rating', label: 'Slider Scale', desc: 'Percentage or 1-100', icon: Ico.Sliders },
    { key: 'rating_matrix', label: 'Rating Matrix', desc: 'TER-style 1-5 evaluation', icon: Ico.Grid },
  ]},
  { group: 'IDENTITIES', items: [
    { key: 'full_name', label: 'Full Name', desc: 'Citizen identity name', icon: Ico.User },
    { key: 'contact_number', label: 'Contact Number', desc: 'Mobile/Phone number', icon: Ico.Phone },
    { key: 'email_address', label: 'Email Address', desc: 'Verification email', icon: Ico.Mail },
    { key: 'mailing_address', label: 'Home Address', desc: 'Physical location', icon: Ico.Home },
  ]},
  { group: 'INPUT', items: [
    { key: 'short_text', label: 'Short Answer', desc: 'Single line text', icon: Ico.Type },
    { key: 'long_text', label: 'Long Answer', desc: 'Comment/Details box', icon: Ico.FileText },
    { key: 'number_input', label: 'Numbers Only', desc: 'Numeric values', icon: Ico.Hash },
    { key: 'multiple_choice', label: 'Multiple Choice', desc: 'Radio selections', icon: Ico.List },
  ]},
  { group: 'MEDIA', items: [
    { key: 'photo_upload', label: 'Photo Upload', desc: 'Snap or upload image', icon: Ico.Camera },
    { key: 'voice_record', label: 'Voice Recording', desc: 'Speak your feedback', icon: Ico.Mic },
  ]},
  { group: 'SYSTEM', items: [
    { key: 'entity_picker', label: 'Service Selection', desc: 'Select Service (Required)', icon: Ico.Globe },
    { key: 'location_picker', label: 'Location Picker', desc: 'Select Branch/Office', icon: Ico.MapPin },
    { key: 'staff_mention', label: 'Staff Mention', desc: 'Tag specific staff', icon: Ico.Users },
  ]}
];

// ── Normalize for safe rendering ──────────────────────────────────────────────
function normalizeConfig(config) {
  if (!config) return config;
  config.steps = (config.steps || []).map((s, idx) => {
    const norm = { ...s, items: s.items || [] };
    // Force entity_picker into Step 1 if it's the routing step and picker is missing
    if (idx === 0 && !norm.items.some(it => it.key === 'entity_picker')) {
      norm.items.unshift({
        id: `mod_init_${Date.now()}`,
        type: "module",
        key: "entity_picker",
        label_override: "Select Service",
        required: true
      });
    }
    return norm;
  });
  config.sections = config.sections || [];
  config.toggles  = config.toggles  || {};
  config.terminology = config.terminology || {};
  return config;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateConfig(config) {
  const errors = [];
  if (!config.steps || config.steps.length === 0) {
    errors.push("Workflow is empty. Add at least one step.");
  }
  const hasDetails = config.steps.some(s => s.id === "details" && s.enabled);
  if (!hasDetails) {
    // This is a legacy requirement, making it flexible
  }
  const step1 = config.steps[0];
  if (step1 && step1.enabled) {
    const hasPicker = (step1.items || []).some(it => it.key === 'entity_picker');
    if (!hasPicker) {
      errors.push("Step 1 Logic: This step should include a 'Service Selection' interaction to route users correctly.");
    }
  }
  config.steps.forEach((step, i) => {
    // Step 1 is exempt from "empty" check because it has a virtual placeholder and mandatory picker enforced by normalizeConfig
    if (i > 0 && step.enabled && (!step.items || step.items.length === 0)) {
      errors.push(`Empty Step: Step ${i + 1} ("${step.label}") has no interactions. It will be skipped.`);
    }
  });
  return errors;
}

function AdminFormDesigner({ theme, darkMode, adminUser }) {
  const { getLabel } = useTerminology();
  const [entities,      setEntities]      = useState([]);
  const [selectedEntId, setSelectedEntId] = useState("");
  const [config,        setConfig]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [isSaving,      setIsSaving]      = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [showGallery,   setShowGallery]   = useState(false);
  const [templates,     setTemplates]     = useState([]);
  const [previewTpl,    setPreviewTpl]    = useState(null);
  const [isSavingTpl,   setIsSavingTpl]   = useState(false);
  const [showPreview,   setShowPreview]   = useState(true);
  const [isLoadingTpl,  setIsLoadingTpl]  = useState(false);
  const [selectedItem,  setSelectedItem]  = useState(null); // { sIdx, itIdx }
  const [modal,         setModal]         = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [searchTerm,    setSearchTerm]    = useState("");
  const previewChannel = React.useRef(null);

  React.useEffect(() => {
    previewChannel.current = new BroadcastChannel('form_preview_v1');
    return () => previewChannel.current?.close();
  }, []);

  useEffect(() => {
    adminGetEntities()
      .then(data => {
        const visible = !adminUser?.entity_id ? data : data.filter(e => e.id === adminUser.entity_id);
        setEntities(visible);
        if (visible.length > 0) setSelectedEntId(visible[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEntId) return;
    setLoading(true);
    getEntityFormConfig(selectedEntId)
      .then(data => {
        const norm = normalizeConfig(data);
        setConfig(norm);
      })
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, [selectedEntId]);

  useEffect(() => {
    if (config && previewChannel.current) {
      previewChannel.current.postMessage({ 
        type: 'config_update', 
        config: normalizeConfig({ ...config }), 
        entity_id: selectedEntId 
      });
    }
  }, [config, selectedEntId]);

  const handleSave = async () => {
    const errors = validateConfig(config);
    if (errors.length > 0) {
      setModal({
        isOpen: true,
        title: "Validation Issues",
        message: "Please resolve the following:\n\n• " + errors.join("\n• "),
        type: "warning"
      });
      return;
    }

    const totalModules = config.steps.reduce((acc, s) => acc + s.items.length, 0);
    const ratingModules = config.steps.flatMap(s => s.items).filter(i => i.key.includes('rating')).length;

    setModal({
      isOpen: true,
      title: "Deploy Interaction Flow?",
      message: `You are about to deploy this workflow.\n\n• ${config.steps.length} Steps configured\n• ${totalModules} Total interactions\n• ${ratingModules} Rating modules active\n• Routing Engine enabled\n\nContinue with deployment?`,
      type: "info",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await updateEntityFormConfig(selectedEntId, config);
          setModal({ isOpen: false });
          setTimeout(() => {
            setModal({ isOpen: true, title: "Success", message: "Configuration deployed to production!", type: "success" });
          }, 300);
        } catch (e) {
          setModal({ isOpen: true, title: "Error", message: "Failed to deploy configuration.", type: "warning" });
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const addStep = () => {
    const isFirst = !config.steps || config.steps.length === 0;
    const getSuggestedName = () => {
      const count = (config.steps || []).length;
      if (count === 0) return "Service Selection";
      if (count === 1) return "Rating & Experience";
      if (count === 2) return "Specific Details";
      return `Step ${count + 1}`;
    };

    const newStep = { 
      id: `step_${Date.now()}`, 
      label: getSuggestedName(), 
      enabled: true, 
      items: isFirst ? [{
        id: `mod_init_${Date.now()}`,
        type: "module",
        key: "entity_picker",
        label_override: "Select Service",
        required: true,
        config: {}
      }] : [] 
    };
    setConfig({ ...config, steps: [...(config.steps || []), newStep] });
    setExpandedSteps(prev => ({ ...prev, [newStep.id]: true }));
  };

  const removeStep = (sIdx) => {
    if (sIdx === 0) {
      setModal({ isOpen: true, title: "Restricted", message: "The Routing Step cannot be removed.", type: "warning" });
      return;
    }
    const steps = config.steps.filter((_, i) => i !== sIdx);
    setConfig({ ...config, steps });
  };

  const updateStep = (sIdx, key, val) => {
    const steps = [...config.steps];
    steps[sIdx] = { ...steps[sIdx], [key]: val };
    setConfig({ ...config, steps });
  };

  const addModuleItem = (sIdx, key) => {
    if (config.steps[sIdx]?.locked) return; // Prevent adding if locked
    const ROUTING_MODULES = ['entity_picker', 'location_picker'];
    if (sIdx === 0 && !ROUTING_MODULES.includes(key)) {
      setModal({
        isOpen: true,
        title: "Routing Restriction",
        message: "Step 1 is reserved for the Routing Engine. Feedback modules should be placed in subsequent steps.",
        type: "warning"
      });
      return;
    }

    const steps = [...config.steps];
    const module = MODULE_OPTIONS.flatMap(g => g.items).find(m => m.key === key);
    
    const newItem = { 
      id: `mod_${Date.now()}`, 
      type: "module", 
      key, 
      label_override: module?.label || "",
      required: false,
      config: {
        criteria: key === 'rating_matrix' ? ["Overall Quality", "Staff Performance"] : [],
        scale: 5,
        options: []
      },
      logic: { visibility_rules: [] }
    };
    
    steps[sIdx].items = [...(steps[sIdx].items || []), newItem];
    setConfig({ ...config, steps });
  };

  const updateItem = (sIdx, iIdx, key, val) => {
    if (config.steps[sIdx]?.locked) return; // Prevent updates if locked
    const steps = [...config.steps];
    const items = [...steps[sIdx].items];
    items[iIdx] = { ...items[iIdx], [key]: val };
    steps[sIdx].items = items;
    setConfig({ ...config, steps });
  };

  const removeItem = (sIdx, iIdx) => {
    if (config.steps[sIdx]?.locked) return; // Prevent removal if locked
    const steps = [...config.steps];
    steps[sIdx].items = steps[sIdx].items.filter((_, i) => i !== iIdx);
    setConfig({ ...config, steps });
  };

  const updateTerminology = (key, val) => {
    setConfig({ ...config, terminology: { ...config.terminology, [key]: val } });
  };

  const handleUseTemplate = async () => {
    setIsLoadingTpl(true);
    try {
      const data = await adminGetWorkflowTemplates();
      setTemplates(data || []);
      setShowGallery(true);
    } catch (e) {
      setModal({ isOpen: true, title: "Error", message: "Could not load templates. Please try again.", type: "warning" });
    } finally {
      setIsLoadingTpl(false);
    }
  };

  const applyTemplate = (tpl) => {
    if (!tpl) return;
    setConfig(tpl.config);
    setShowGallery(false);
    setModal({
      isOpen: true,
      title: "Template Applied",
      message: "Template successfully applied. You can now customize this workflow.",
      type: "success"
    });
  };

  const saveAsTemplate = async () => {
    const name = window.prompt("Template Name:");
    if (!name) return;
    const category = window.prompt("Category:", "Custom");
    if (!category) return;
    
    setIsSavingTpl(true);
    try {
      await adminCreateWorkflowTemplate({
        name,
        description: "Custom template created by workspace admin.",
        category,
        config: config,
        is_global: false,
        version: 1
      });
      setModal({ isOpen: true, title: "Success", message: "Saved to library!", type: "success" });
    } catch (e) {
      setModal({ isOpen: true, title: "Error", message: "Failed to save template.", type: "warning" });
    } finally {
      setIsSavingTpl(false);
    }
  };

  const toggleStepExpand = (id) => setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  
  const onDragStart = (e, sIdx, iIdx) => {
    e.dataTransfer.setData("itemIndex", JSON.stringify({ fromSIdx: sIdx, fromIIdx: iIdx }));
    e.currentTarget.style.opacity = '0.4';
  };

  const onDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const onLibraryDragStart = (e, moduleKey) => {
    e.dataTransfer.setData("newModuleKey", moduleKey);
  };

  const onDrop = (e, targetStepIdx, targetItemIdx = null) => {
    e.preventDefault();
    if (config.steps[targetStepIdx]?.locked) return; // Prevent drops if locked
    const itemIndexRaw = e.dataTransfer.getData('itemIndex');
    const newModuleKey = e.dataTransfer.getData('newModuleKey');

    const steps = [...config.steps];
    let itemToPlace = null;

    if (itemIndexRaw) {
      const { fromSIdx, fromIIdx } = JSON.parse(itemIndexRaw);
      itemToPlace = steps[fromSIdx].items[fromIIdx];
      steps[fromSIdx].items = steps[fromSIdx].items.filter((_, i) => i !== fromIIdx);
    } else if (newModuleKey) {
      itemToPlace = {
        id: `it_${Date.now()}`,
        type: 'module',
        key: newModuleKey,
        required: false,
        label_override: MODULE_OPTIONS.flatMap(g => g.items).find(m => m.key === newModuleKey)?.label || ""
      };
    }

    if (!itemToPlace) return;

    const ROUTING_MODULES = ['entity_picker', 'location_picker'];
    if (targetStepIdx === 0 && !ROUTING_MODULES.includes(itemToPlace.key)) {
      setModal({
        isOpen: true,
        title: "Routing Restriction",
        message: "Step 1 is the Routing Engine. Only Service Selection and Location Pickers are allowed here.",
        type: "warning"
      });
      return;
    }
    
    const targetItems = [...(steps[targetStepIdx].items || [])];
    if (targetItemIdx === null) targetItems.push(itemToPlace);
    else targetItems.splice(targetItemIdx, 0, itemToPlace);
    
    steps[targetStepIdx].items = targetItems;
    setConfig({ ...config, steps });
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--primary-color)';
    e.currentTarget.style.background = 'rgba(59,130,246,0.02)';
  };

  const onDragLeave = (e) => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.background = theme.surface;
  };

  if (loading && !entities.length) return <div style={{ padding: '20px', color: theme.textMuted }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.surface, padding: '20px 24px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: theme.text }}>{Ico.Layers} Interaction Studio</h1>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: '800' }}>CONNECTED ✓</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: theme.textMuted }}>Isolated workflow persistence for {entities.find(e => e.id === selectedEntId)?.name || 'Service'}.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowPreview(!showPreview)} style={{ ...st.addBtn(theme), background: showPreview ? 'rgba(59,130,246,0.1)' : 'none', border: showPreview ? '1px solid var(--primary-color)' : `1px dashed ${theme.border}` }}>
            {Ico.Eye} {showPreview ? "Hide Preview" : "Live Preview"}
          </button>
          <button onClick={handleUseTemplate} disabled={isLoadingTpl} style={st.addBtn(theme)}>
            {isLoadingTpl ? "..." : Ico.Layers} Start from Template
          </button>
          <button onClick={saveAsTemplate} disabled={isSavingTpl} style={st.addBtn(theme)}>{Ico.Save} {isSavingTpl ? "Saving..." : "Save as Template"}</button>
          <div style={{ width: '1px', background: theme.border, margin: '0 5px' }} />
          <select value={selectedEntId} onChange={e => setSelectedEntId(e.target.value)} style={st.select(theme)}>
            {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
          </select>
          <button onClick={handleSave} disabled={isSaving} style={st.btnPrimary(isSaving)}>
            {Ico.Save} {isSaving ? "Saving..." : "Deploy Flow"}
          </button>
        </div>
      </div>

      {showGallery && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: theme.surface, width: '900px', height: '600px', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Workflow Template Library</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: theme.textMuted }}>Select a professional starting point for your interaction.</p>
              </div>
              <button onClick={() => setShowGallery(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>×</button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: '300px', borderRight: `1px solid ${theme.border}`, padding: '20px', overflowY: 'auto' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, display: 'block', marginBottom: '12px' }}>ALL TEMPLATES</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {templates.map(tpl => (
                    <button 
                      key={tpl.id} 
                      onClick={() => setPreviewTpl(tpl)}
                      style={{ 
                        textAlign: 'left', padding: '12px', borderRadius: '12px', border: `1px solid ${previewTpl?.id === tpl.id ? 'var(--primary-color)' : theme.border}`, 
                        background: previewTpl?.id === tpl.id ? 'rgba(59,130,246,0.05)' : 'none', cursor: 'pointer', transition: '0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '13px', color: previewTpl?.id === tpl.id ? 'var(--primary-color)' : theme.text }}>{tpl.name}</div>
                      <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>{tpl.category}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ flex: 1, padding: '24px', background: 'rgba(0,0,0,0.01)', overflowY: 'auto' }}>
                {previewTpl ? (
                  <div style={{ animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>{previewTpl.name}</h3>
                      <p style={{ fontSize: '13px', color: theme.textMuted, marginTop: '8px', lineHeight: '1.5' }}>{previewTpl.description}</p>
                    </div>
                    
                    <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, display: 'block', marginBottom: '12px' }}>WORKFLOW PREVIEW</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {previewTpl.config.steps.map((s, idx) => (
                        <div key={idx} style={{ padding: '14px', background: 'white', borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                             <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--primary-color)' }}>Step {idx + 1}: {s.label}</div>
                           </div>
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {s.items.map((it, iIdx) => (
                              <span key={iIdx} style={{ fontSize: '10px', padding: '4px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', fontWeight: '700' }}>
                                {it.label_override || it.key}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '13px' }}>
                    Select a template to preview its structure.
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: '20px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '12px', background: theme.surface }}>
              <button onClick={() => setShowGallery(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: 'none', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button 
                onClick={() => applyTemplate(previewTpl)} 
                disabled={!previewTpl} 
                style={{ ...st.btnPrimary(!previewTpl), padding: '10px 24px' }}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      {config && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* LEFT COLUMN: Library & Branding */}
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>
            <div style={{ background: theme.surface, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}`, background: 'rgba(59,130,246,0.02)' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900' }}>Interaction Library</h3>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '10px', color: theme.textMuted }}>{Ico.Search}</div>
                  <input 
                    placeholder="Search interactions..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    style={{ ...st.librarySearch(theme), paddingLeft: '32px' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {MODULE_OPTIONS.map(g => {
                    const filteredItems = g.items.filter(m => 
                      m.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      m.desc.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    if (filteredItems.length === 0) return null;
                    return (
                      <div key={g.group}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, display: 'block', marginBottom: '8px' }}>{g.group}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {filteredItems.map(m => (
                            <button 
                              key={m.key} 
                              draggable={true}
                              onDragStart={(e) => onLibraryDragStart(e, m.key)}
                              onClick={() => { 
                                const firstEnabledIdx = config.steps.findIndex(s => s.enabled);
                                addModuleItem(firstEnabledIdx === -1 ? 0 : firstEnabledIdx, m.key); 
                              }} 
                              style={st.libraryBtn(theme)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ color: 'var(--primary-color)' }}>{m.icon}</div>
                                <span style={{ fontSize: '11px', fontWeight: '800' }}>{m.label}</span>
                              </div>
                              <span style={{ fontSize: '10px', color: theme.textMuted, marginLeft: '22px' }}>{m.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Terminology */}
            <div style={{ background: theme.surface, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>Branding</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={config.terminology?.entity_label || ""} placeholder="Service Label Override" onChange={e => updateTerminology('entity_label', e.target.value)} style={st.input(theme)} />
                <input value={config.terminology?.location_label || ""} placeholder="Location Label Override" onChange={e => updateTerminology('location_label', e.target.value)} style={st.input(theme)} />
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Workflow Steps */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: theme.text }}>Workflow Steps</h2>
              <button onClick={addStep} style={st.addBtn(theme)}>{Ico.Plus} Add Step</button>
            </div>

            {config.steps.map((step, sIdx) => {
              const stepIcon = sIdx === 0 ? Ico.Globe : sIdx === 1 ? Ico.Star : Ico.FileText;
              const stepGuidance = sIdx === 0 
                ? "Displays available services to route user feedback correctly."
                : sIdx === 1 
                  ? "Add rating or primary evaluation questions here."
                  : "Optional: Collect additional photos, voice, or final comments.";
              
              return (
                <div 
                  key={step.id} 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => { onDragLeave(e); onDrop(e, sIdx); }}
                  style={{ 
                    borderRadius: '14px', 
                    border: `2px solid ${selectedItem?.sIdx === sIdx && selectedItem?.itIdx === null ? 'var(--primary-color)' : theme.border}`, 
                    background: sIdx === 0 ? 'rgba(0,0,0,0.01)' : theme.surface, 
                    overflow: 'hidden', 
                    transition: 'all 0.2s ease',
                    opacity: sIdx === 0 ? 0.9 : 1
                  }}
                >
                  <div 
                    style={{ 
                      padding: '12px 16px', 
                      background: sIdx === 0 ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      cursor: sIdx === 0 ? 'not-allowed' : 'pointer' 
                    }} 
                    onClick={() => { if (sIdx > 0) { toggleStepExpand(step.id); setSelectedItem({ sIdx, itIdx: null }); } }}
                  >
                     <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontSize: '12px', opacity: 0.8 }}>{stepIcon}</span>
                       <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, opacity: 0.5 }}>STEP {sIdx + 1}</span>
                        <input 
                          value={step.label} 
                          disabled={sIdx === 0 || step.locked}
                          onChange={e => updateStep(sIdx, 'label', e.target.value)} 
                          onClick={e => e.stopPropagation()} 
                          style={{ 
                            background: 'none', border: 'none', fontWeight: '800', fontSize: '14px', 
                            color: (sIdx === 0 || step.locked) ? theme.textMuted : theme.text, 
                            outline: 'none', cursor: (sIdx === 0 || step.locked) ? 'not-allowed' : 'text' 
                          }} 
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {sIdx > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStep(sIdx, 'locked', !step.locked); }} 
                            style={{ background: 'none', border: 'none', color: step.locked ? 'var(--primary-color)' : theme.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title={step.locked ? "Unlock Step" : "Lock Step"}
                          >
                            {step.locked ? Ico.Lock : Ico.Unlock}
                          </button>
                        )}
                        {sIdx > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeStep(sIdx); }} 
                            disabled={step.locked}
                            style={{ background: 'none', border: 'none', color: '#EF4444', opacity: step.locked ? 0.3 : 1, cursor: step.locked ? 'not-allowed' : 'pointer' }}
                          >
                            {Ico.Trash}
                          </button>
                        )}
                      </div>
                  </div>
                  
                  {expandedSteps[step.id] !== false && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, marginBottom: '4px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                        {stepGuidance}
                      </div>

                      {sIdx === 0 && (
                         <div style={{ padding: '24px', borderRadius: '12px', border: `2px dashed ${theme.border}`, background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
                            <div style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>{Ico.Globe}</div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: theme.text }}>[ Service Selection Module ]</div>
                            <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Automatically displays your active services to the user.</div>
                         </div>
                      )}
                    {step.items.map((item, iIdx) => {
                      const mod = MODULE_OPTIONS.flatMap(g => g.items).find(m => m.key === item.key);
                      return (
                        <div 
                          key={item.id} 
                          draggable={!step.locked}
                          onDragStart={(e) => !step.locked && onDragStart(e, sIdx, iIdx)}
                          onDragEnd={onDragEnd}
                          onDrop={(e) => { e.stopPropagation(); !step.locked && onDrop(e, sIdx, iIdx); }}
                          style={{ 
                            display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', 
                            background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}`, 
                            cursor: step.locked ? 'default' : 'grab', transition: 'opacity 0.2s',
                            opacity: step.locked ? 0.8 : 1
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {!step.locked && (
                              <div style={{ cursor: 'grab', color: theme.textMuted, opacity: 0.5 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h2v2H8V6zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm6-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/></svg>
                              </div>
                            )}
                            <div style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', opacity: step.locked ? 0.6 : 1 }}>
                              {mod?.icon || Ico.Box}
                            </div>
                            <input 
                              value={item.label_override} 
                              disabled={step.locked}
                              onChange={e => updateItem(sIdx, iIdx, 'label_override', e.target.value)} 
                              style={{ flex: 1, background: 'none', border: 'none', fontSize: '13px', fontWeight: '700', color: step.locked ? theme.textMuted : theme.text, outline: 'none', cursor: step.locked ? 'not-allowed' : 'text' }} 
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div 
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: step.locked ? 'not-allowed' : 'pointer', opacity: step.locked ? 0.5 : 1 }}
                                onClick={() => !step.locked && updateItem(sIdx, iIdx, 'required', !item.required)}
                              >
                                <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted }}>REQ</span>
                                <div style={st.toggle(item.required)}>
                                  <div style={st.toggleKnob(item.required)}></div>
                                </div>
                              </div>

                              <button 
                                onClick={() => removeItem(sIdx, iIdx)} 
                                disabled={step.locked}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: step.locked ? 'not-allowed' : 'pointer', opacity: step.locked ? 0.3 : 1 }}
                              >
                                {Ico.Trash}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

          {/* RIGHT COLUMN: Live Simulation */}
          <div style={{ width: showPreview ? '400px' : '0px', opacity: showPreview ? 1 : 0, transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px', overflow: 'hidden' }}>
            {showPreview && (
              <div style={{ background: theme.surface, borderRadius: '24px', border: `10px solid #111827`, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', height: '650px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Android Punch-hole Camera */}
                <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', background: '#111827', borderRadius: '50%', zIndex: 10, border: '1px solid rgba(255,255,255,0.1)' }}></div>
                
                <div style={{ padding: '30px 20px 10px', background: 'white', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#111827' }}>Live Simulation</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontSize: '9px', fontWeight: '800', color: '#64748B' }}>STEP {config.steps.length > 0 ? "1 of " + config.steps.length : "0"}</span>
                       <span style={{ fontSize: '9px', fontWeight: '800', color: '#10B981' }}>ANDROID PREVIEW</span>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                  <GeneralFeedback overrideConfig={config} isPreview={true} />
                </div>

                {/* Android Navigation Bar */}
                <div style={{ height: '36px', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', borderTop: '1px solid #F1F5F9' }}>
                   <div style={{ width: '12px', height: '12px', border: '2px solid #94A3B8', borderRadius: '2px', opacity: 0.6 }}></div>
                   <div style={{ width: '12px', height: '12px', border: '2px solid #94A3B8', borderRadius: '50%', opacity: 0.6 }}></div>
                   <div style={{ width: '12px', height: '12px', borderLeft: '2px solid #94A3B8', borderBottom: '2px solid #94A3B8', transform: 'rotate(45deg)', opacity: 0.6, marginLeft: '4px' }}></div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      <CustomModal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
        onConfirm={modal.onConfirm || (() => setModal({ ...modal, isOpen: false }))} 
        onCancel={modal.onConfirm ? (() => setModal({ ...modal, isOpen: false })) : null}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default AdminFormDesigner;
