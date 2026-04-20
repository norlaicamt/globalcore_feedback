import React, { useState, useEffect } from "react";
import { createFeedback, getEntities, getBranches, getEntityFormConfig } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";
import CustomModal from "./CustomModal";
import { IconRegistry } from "./IconRegistry";

const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  MapPin: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Star: ({ filled, size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  MessageSquare: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  AlertTriangle: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Lightbulb: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.37-1.97.37-3a5.5 5.5 0 0 0-11 0c0 1.03.19 2.02.37 3" /><path d="M9 14c1.49 0 2.85.59 3.85 1.55L14 17" /><path d="M15 14c-1.49 0-2.85.59-3.85 1.55L10 17" /></svg>,
  Heart: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  Pool: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0 1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0"/><path d="M2 12c1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0 1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0"/><path d="M2 18c1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0 1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0"/></svg>,
  Restaurant: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>,
  Plate: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>,
  Amenity: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Music: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Spa: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-9"/><path d="M12 13c-4.97 0-9 4.03-9 9"/><path d="M12 13c4.97 0 9 4.03 9 9"/><path d="M12 22c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9s-9 4.03-9 9c0 4.97 4.03 9 9 9z"/></svg>,
  Wine: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8"/><path d="M12 15v7"/><path d="M12 15a8 8 0 0 0 8-8V3H4v4a8 8 0 0 0 8 8z"/><path d="M4 7h16"/></svg>,
  Shower: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>,
  User: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Layers: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  EyeOff: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  Phone: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Mail: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Hash: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  Home: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Globe: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  FileText: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

const FEEDBACK_TYPES = [
  { id: "Complaint", label: "Complaint", color: "#EF4444", icon: <Icons.AlertTriangle size={32} /> },
  { id: "Suggestion", label: "Suggestion", color: "#3B82F6", icon: <Icons.Lightbulb size={32} /> },
  { id: "Appreciation", label: "Appreciation", color: "#10B981", icon: <Icons.Heart size={32} /> },
];

const hexToRgb = (hex) => {
  if (!hex || !hex.startsWith('#')) return "16, 185, 129";
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.length === 3 ? h[0]+h[0] : h.substring(0,2), 16);
  const g = parseInt(h.length === 3 ? h[1]+h[1] : h.substring(2,4), 16);
  const b = parseInt(h.length === 3 ? h[2]+h[2] : h.substring(4,6), 16);
  return `${r}, ${g}, ${b}`;
};

const GeneralFeedback = ({ currentUser, onBack, onSuccess, overrideConfig = null, isPreview = false }) => {
  const { getLabel } = useTerminology();
  const [step, setStep] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formConfig, setFormConfig] = useState(overrideConfig || null);
  const [configLoaded, setConfigLoaded] = useState(!!overrideConfig);
  const [loading, setLoading] = useState(!overrideConfig);
  const lastConfigVersion = React.useRef(0);
  const isPreviewMode = 
    new URLSearchParams(window.location.search).get('preview') === 'true' || 
    window.location.pathname.includes('/preview') || isPreview;
  
  const [dbEntities, setDbEntities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [manualLocationText, setManualLocationText] = useState("");
  const [idea, setIdea] = useState("");
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customFields, setCustomFields] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [confirmingSelection, setConfirmingSelection] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [matrixRatings, setMatrixRatings] = useState({});

  useEffect(() => {
    const savedPublicColor = localStorage.getItem('public_primary_color');
    if (savedPublicColor) {
      document.documentElement.style.setProperty('--primary-color', savedPublicColor);
      document.documentElement.style.setProperty('--primary-rgb', hexToRgb(savedPublicColor));
    }
    getEntities().then(setDbEntities).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (overrideConfig) {
      setFormConfig(overrideConfig);
      setConfigLoaded(true);
      setLoading(false);
      return;
    }
  }, [overrideConfig]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(branchSearch), 300);
    return () => clearTimeout(timer);
  }, [branchSearch]);

  useEffect(() => {
    if (selectedEntity) {
      setLoading(true);
      Promise.all([getBranches(selectedEntity.id), getEntityFormConfig(selectedEntity.id)])
        .then(([bd, cd]) => {
          setBranches(bd.filter(b => b.is_active));
          if (!lastConfigVersion.current) {
            setFormConfig(cd);
            setConfigLoaded(true);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [selectedEntity]);

  const enabledSteps = React.useMemo(() => {
    if (!formConfig || !formConfig.steps) return [];
    return [...formConfig.steps]
      .filter(s => s.enabled && ((s.items || []).length > 0 || isPreviewMode))
      .sort((a, b) => a.order - b.order);
  }, [formConfig]);

  useEffect(() => {
    if (enabledSteps.length > 0 && !step) {
      setStep(enabledSteps[0].id);
    }
  }, [enabledSteps, step]);

  const isItemFilled = (item) => {
    if (item.type === "module") {
      const key = item.key;
      if (key === 'entity_picker') return !!selectedEntity;
      if (key === 'location_picker') return !!selectedBranch || (isManualLocation && !!manualLocationText.trim());
      if (key === 'star_rating' || key === 'rating' || key === 'emoji_rating' || key === 'slider_rating') return rating > 0;
      if (key === 'short_text' || key === 'long_text' || key === 'message_input') return !!idea.trim();
      if (key === 'rating_matrix') {
        const ratings = matrixRatings[item.id] || {};
        return (item.criteria || []).every(c => !!ratings[c]);
      }
      if (['full_name', 'contact_number', 'email_address', 'mailing_address', 'number_input'].includes(key)) {
        return !!customFields[item.id || key]?.trim();
      }
      return true;
    }
    if (item.type === "section") {
      const section = formConfig?.sections?.find(s => s.id === item.section_id);
      if (!section) return true;
      return (section.fields || []).every(f => !f.required || !!customFields[f.id]);
    }
    return true;
  };

  const handleNext = (overrideKey, overrideVal) => {
    if (isNavigating) return;
    const current = enabledSteps.find(s => s.id === step);
    if (!current) return;

    const allValid = isPreviewMode ? true : current.items.every(it => isItemFilled(it));
    if (!allValid && !overrideKey) {
      setShowErrors(true);
      return;
    }

    setShowErrors(false);
    const idx = enabledSteps.findIndex(s => s.id === step);
    if (idx < enabledSteps.length - 1) {
      setIsNavigating(true);
      setStep(enabledSteps[idx + 1].id);
      setTimeout(() => setIsNavigating(false), 400);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const idx = enabledSteps.findIndex(s => s.id === step);
    if (idx > 0) setStep(enabledSteps[idx - 1].id);
    else if (typeof onBack === 'function') onBack();
  };

  const handleSubmit = async () => {
    if (isPreviewMode) {
       setModal({ 
         isOpen: true, 
         title: "Preview Mode", 
         message: "Flow verified. Deployment ready.", 
         type: "success", 
         onConfirm: () => {
           if (typeof onSuccess === 'function') onSuccess();
           setModal({ isOpen: false });
         } 
       });
       return;
    }
    setIsSubmitting(true);
    try {
      await createFeedback({ 
        feedback_type: feedbackType, 
        entity_id: selectedEntity.id, 
        branch_id: selectedBranch?.id, 
        description: idea, 
        rating, 
        custom_data: { ...customFields, matrix_evaluations: matrixRatings } 
      });
      setModal({ 
        isOpen: true, 
        title: "Success", 
        message: "Submitted successfully!", 
        type: "success", 
        onConfirm: () => {
          if (typeof onSuccess === 'function') onSuccess();
          setModal({ isOpen: false });
        } 
      });
    } catch (e) { setModal({ isOpen: true, title: "Error", message: "Submission failed.", type: "error" }); }
    finally { setIsSubmitting(false); }
  };

  const getStepIcon = (key) => {
    switch (key) {
      case 'feedback_type': return <Icons.AlertTriangle size={14} />;
      case 'entity_picker': return <Icons.Globe size={14} />;
      case 'location_picker': return <Icons.MapPin size={14} />;
      case 'message_input':
      case 'short_text':
      case 'long_text': return <Icons.MessageSquare size={14} />;
      case 'rating':
      case 'star_rating':
      case 'emoji_rating':
      case 'rating_matrix': return <Icons.Star size={14} />;
      case 'staff':
      case 'staff_mention':
      case 'full_name': return <Icons.User size={14} />;
      case 'contact_number': return <Icons.Phone size={14} />;
      case 'email_address': return <Icons.Mail size={14} />;
      case 'mailing_address': return <Icons.Home size={14} />;
      case 'number_input': return <Icons.Hash size={14} />;
      default: return null;
    }
  };

  const getModuleLabel = (key) => {
    switch(key) {
      case 'entity_picker': return "Select Service";
      case 'location_picker': return "Select Location";
      case 'star_rating': return "Rate your experience";
      case 'emoji_rating': return "How do you feel?";
      case 'slider_rating': return "Satisfaction Level";
      case 'short_text': return "Quick Comment";
      case 'long_text': return "Detailed Feedback";
      case 'voice_record': return "Voice Feedback";
      case 'photo_upload': return "Attach Photo";
      case 'rating_matrix': return "Service Evaluation";
      case 'full_name': return "Enter your full name";
      case 'contact_number': return "Contact Number";
      case 'email_address': return "Email Address";
      case 'mailing_address': return "Mailing Address";
      case 'number_input': return "Numeric Value";
      default: return "Information";
    }
  };

  const renderItem = (item, idx) => {
    if (item.type === "module") {
      const { key, required, label_override } = item;
      const invalid = showErrors && required && !isItemFilled(item);
      const errStyle = invalid ? { borderLeft: '4px solid #EF4444', paddingLeft: '12px' } : {};
      const label = label_override || getModuleLabel(key);

      const renderEntityPicker = () => (
        <div style={styles.formGroup}>
          <div style={styles.grid}>{dbEntities.map(ent => {
            const IconComp = ent.icon ? (Icons[ent.icon.charAt(0).toUpperCase() + ent.icon.slice(1)] || Icons.Layers) : Icons.Layers;
            return (
              <button key={ent.id} onClick={() => { setSelectedEntity(ent); setConfirmingSelection(ent); setTimeout(() => { setConfirmingSelection(null); handleNext(); }, 600); }} style={{ ...styles.typeCard, borderColor: selectedEntity?.id === ent.id ? 'var(--primary-color)' : '#E2E8F0', background: selectedEntity?.id === ent.id ? 'rgba(var(--primary-rgb), 0.05)' : 'white' }}>
                <div style={styles.itemIcon}><IconComp size={28} /></div>
                <div style={styles.itemName}>{ent.name}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', textAlign: 'center' }}>{ent.description || 'Quality Service'}</div>
                {confirmingSelection?.id === ent.id && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(var(--primary-rgb), 0.9)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '14px', animation: 'fadeIn 0.2s ease' }}>
                    READY ✓
                  </div>
                )}
              </button>
            );
          })}</div>
        </div>
      );

      if (key === 'entity_picker') return renderEntityPicker();

      if (key === 'location_picker') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>{label}</label>
          <div style={styles.branchList}>{branches.map(b => (
            <button key={b.id} onClick={() => { setSelectedBranch(b); handleNext(); }} style={{ ...styles.branchItem, borderColor: selectedBranch?.id === b.id ? 'var(--primary-color)' : '#F1F5F9' }}>{b.name}</button>
          ))}</div>
        </div>
      );

      if (key === 'star_rating' || key === 'rating') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>{label}</label>
          <div style={{ display: 'flex', gap: '12px', background: 'white', padding: '20px', borderRadius: '16px', border: `1px solid ${invalid ? '#EF4444' : '#E2E8F0'}`, justifyContent: 'center' }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <Icons.Star filled={s <= rating} />
              </button>
            ))}
          </div>
        </div>
      );

      if (key === 'emoji_rating') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle, alignItems: 'center' }}>
          <label style={styles.label}>{label}</label>
          <div style={{ display: 'flex', gap: '15px' }}>{['😞','😐','🙂','😃','🤩'].map((e, i) => <button key={i} onClick={() => setRating(i+1)} style={{ fontSize: '32px', border: 'none', background: 'none', cursor: 'pointer', filter: rating === (i+1) ? 'none' : 'grayscale(1)' }}>{e}</button>)}</div>
        </div>
      );

      if (key === 'voice_record') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>{label}</label>
          <button style={{ padding: '20px', borderRadius: '16px', border: '2px dashed #E2E8F0', background: 'white', cursor: 'pointer' }}>🎤 Tap to record audio</button>
        </div>
      );

      if (key === 'photo_upload') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>{label}</label>
          <button style={{ padding: '20px', borderRadius: '16px', border: '2px dashed #E2E8F0', background: 'white', cursor: 'pointer' }}>📷 Snap or upload photo</button>
        </div>
      );

      if (key === 'long_text' || key === 'message_input') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>{label}</label>
          <textarea style={styles.textarea} value={idea} onChange={e => setIdea(e.target.value)} placeholder="Enter details..." />
        </div>
      );
      
      if (['short_text', 'full_name', 'contact_number', 'email_address', 'number_input'].includes(key)) {
        const inputType = key === 'email_address' ? 'email' : (key === 'number_input' ? 'number' : (key === 'contact_number' ? 'tel' : 'text'));
        return (
          <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
            <label style={styles.label}>{label}</label>
            <input 
              type={inputType}
              style={styles.input} 
              value={customFields[item.id || key] || ""} 
              onChange={e => setCustomFields({ ...customFields, [item.id || key]: e.target.value })} 
              placeholder={key === 'full_name' ? "Juan Dela Cruz" : "Type here..."} 
            />
          </div>
        );
      }

      if (key === 'mailing_address') {
        return (
          <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
            <label style={styles.label}>{label}</label>
            <textarea 
              style={styles.textarea} 
              value={customFields[item.id || key] || ""} 
              onChange={e => setCustomFields({ ...customFields, [item.id || key]: e.target.value })} 
              placeholder="House No., Street, Brgy, City..." 
            />
          </div>
        );
      }

      if (key === 'rating_matrix') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>{label}</label>
          <div style={{ background: 'white', borderRadius: '14px', border: `1px solid ${invalid ? '#EF4444' : '#E2E8F0'}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', background: '#F8FAFC', padding: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748B' }}>CRITERIA</span>
              {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: '10px', fontWeight: '900', color: '#64748B', textAlign: 'center' }}>{n}</span>)}
            </div>
            {(item.criteria || []).map((c, cIdx) => (
              <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '12px', borderBottom: cIdx === (item.criteria.length - 1) ? 'none' : '1px solid #F1F5F9', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>{c}</span>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ display: 'flex', justifyContent: 'center' }}>
                    <button 
                      onClick={() => setMatrixRatings(prev => ({
                        ...prev,
                        [item.id]: { ...(prev[item.id] || {}), [c]: n }
                      }))}
                      style={{ 
                        width: '24px', height: '24px', borderRadius: '6px', 
                        border: `2px solid ${matrixRatings[item.id]?.[c] === n ? 'var(--primary-color)' : '#E2E8F0'}`,
                        background: matrixRatings[item.id]?.[c] === n ? 'var(--primary-color)' : 'white',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {invalid && <p style={styles.errTxt}>All criteria must be evaluated</p>}
        </div>
      );
    }

    if (item.type === "section") {
      const section = formConfig?.sections?.find(s => s.id === item.section_id);
      if (!section) return null;
      return (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={styles.sectionTitle}>{section.title}</h3>
          {(section.fields || []).map(f => (
            <div key={f.id} style={styles.formGroup}>
              <label style={styles.label}>{f.label}</label>
              <input style={styles.input} value={customFields[f.id] || ""} onChange={e => setCustomFields({ ...customFields, [f.id]: e.target.value })} />
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !configLoaded) return <div style={styles.loader}>Loading...</div>;
  const currentStep = enabledSteps.find(s => s.id === step);
  const currentIndex = enabledSteps.findIndex(s => s.id === step);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ width: 40 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <WorkflowStepper steps={enabledSteps} currentIndex={currentIndex} primaryColor="var(--primary-color)" getStepIcon={getStepIcon} />
        </div>
        <div style={{ width: 40 }} />
      </header>

      <main style={styles.content}>
        {!selectedEntity ? (
          <div className="step-transition">
            <div style={styles.formGroup}>
              <label style={styles.label}>{getLabel('entity_label', 'Select Program / Service')}</label>
              <div style={styles.grid}>{dbEntities.map(ent => {
                const IconComp = ent.icon ? (Icons[ent.icon.charAt(0).toUpperCase() + ent.icon.slice(1)] || Icons.Layers) : Icons.Layers;
                return (
                  <button 
                    key={ent.id} 
                    onClick={() => { 
                      setConfirmingSelection(ent);
                      setTimeout(() => {
                        setSelectedEntity(ent);
                        setConfirmingSelection(null);
                      }, 600);
                    }} 
                    style={{ ...styles.typeCard, borderColor: '#E2E8F0', background: 'white', position: 'relative' }}
                  >
                    <div style={styles.itemIcon}><IconComp size={28} /></div>
                    <div style={styles.itemName}>{ent.name}</div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>{ent.description || 'Quality Service'}</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>Tap to select</div>
                    {confirmingSelection?.id === ent.id && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(var(--primary-rgb), 0.9)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '14px', animation: 'fadeIn 0.2s ease' }}>
                        LOADING...
                      </div>
                    )}
                  </button>
                );
              })}</div>
            </div>
          </div>
        ) : (
          currentStep && (
            <div className="step-transition">
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', margin: 0 }}>{currentStep.label}</h2>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Step {currentIndex + 1} of {enabledSteps.length}</p>
              </div>
              
              {currentStep.items.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>
                   <div style={{ color: '#94A3B8', marginBottom: '12px' }}><Icons.Layers size={32} /></div>
                   <div style={{ fontWeight: '800', fontSize: '14px', color: '#64748B' }}>No interactions yet</div>
                   <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Add interactions in the designer to see them here.</p>
                </div>
              ) : (
                currentStep.items.map((it, idx) => renderItem(it, idx))
              )}
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                <button onClick={handleBack} style={{ ...styles.nextBtn, background: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', boxShadow: 'none', flex: 1, height: '48px' }}>Back</button>
                {(!['entity_picker'].includes(currentStep.items[0]?.key) || isPreview) && (
                  <button onClick={() => handleNext()} style={{ ...styles.nextBtn, flex: 2, height: '48px' }}>
                    {currentIndex === enabledSteps.length - 1 ? "Submit Feedback" : "Continue"}
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </main>

      <CustomModal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onConfirm={() => { if (modal.onConfirm) modal.onConfirm(); setModal({ ...modal, isOpen: false }); }} />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .step-transition { animation: fadeIn 0.4s ease-out; }`}</style>
    </div>
  );
};

function WorkflowStepper({ steps, currentIndex, primaryColor, getStepIcon }) {
  if (steps.length <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i <= currentIndex ? primaryColor : '#E2E8F0', color: i <= currentIndex ? 'white' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
            {getStepIcon(s.items[0]?.key) || (i + 1)}
          </div>
          {i < steps.length - 1 && <div style={{ width: '20px', height: '2px', background: i < currentIndex ? primaryColor : '#E2E8F0' }} />}
        </React.Fragment>
      ))}
    </div>
  );
};

const styles = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC' },
  header: { padding: '20px', background: 'white', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #F1F5F9' },
  headerTitle: { fontSize: '16px', fontWeight: '900', color: '#1E293B' },
  content: { flex: 1, padding: '24px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' },
  typeCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', borderRadius: '18px', border: '2px solid transparent', background: 'white', cursor: 'pointer' },
  itemIcon: { width: '50px', height: '50px', borderRadius: '14px', background: 'white', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' },
  itemName: { fontWeight: '800', fontSize: '13px', marginTop: '10px' },
  branchList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  branchItem: { padding: '15px', borderRadius: '12px', border: '1.5px solid #F1F5F9', background: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textAlign: 'left' },
  formGroup: { marginBottom: '20px' },
  label: { fontSize: '11px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' },
  textarea: { width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #E2E8F0', height: '120px', outline: 'none', fontSize: '14px', background: 'white', transition: 'border-color 0.2s' },
  input: { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', background: 'white' },
  nextBtn: { width: '100%', padding: '0 18px', borderRadius: '16px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  sectionTitle: { fontSize: '14px', fontWeight: '900', color: 'var(--primary-color)', marginBottom: '15px', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '8px' },
  loader: { padding: '100px', textAlign: 'center', fontWeight: '900', color: '#64748B' }
};

export default GeneralFeedback;
