import React, { useState, useEffect } from "react";
import { createFeedback, getEntities, getBranches, getEntityFormConfig } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";
import CustomModal from "./CustomModal";


const SMART_DEFAULTS = {
  star_rating: "How would you rate your overall experience?",
  emoji_rating: "How do you feel about our service today?",
  rating_matrix: "Please evaluate the following categories:",
  rating: "Overall satisfaction",
  short_text: "In a few words, how was your visit?",
  long_text: "Please share any additional details or suggestions.",
  message_input: "How can we improve?",
  multiple_choice: "Which of these best describes your visit?",
  photo_upload: "Snap or upload a photo (Optional)",
  voice_record: "Speak your feedback (Optional)",
  full_name: "May we know your name?",
  contact_number: "Mobile or phone number",
  email_address: "Email address",
  mailing_address: "Home or mailing address",
  number_input: "Reference or Ticket number",
  staff_mention: "Tag a specific staff member",
  entity_picker: "Select the service category",
  location_picker: "Select your branch or location"
};

const SMART_HELPERS = {
  star_rating: "Tap a star to give your rating",
  emoji_rating: "Select the icon that matches your feeling",
  rating_matrix: "1 is low, 5 is high",
  photo_upload: "Images help us understand better",
  voice_record: "Hold the mic to start recording",
  full_name: "We use this for internal verification",
  email_address: "We will only contact you if necessary"
};

const LocalIcons = {
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
  Pool: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0 1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0" /><path d="M2 12c1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0 1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0" /><path d="M2 18c1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0 1.6 1 3.2 1 4.8 0 1.6-1 3.2-1 4.8 0" /></svg>,
  Restaurant: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /></svg>,
  Plate: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /></svg>,
  Amenity: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  Music: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
  Spa: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-9" /><path d="M12 13c-4.97 0-9 4.03-9 9" /><path d="M12 13c4.97 0 9 4.03 9 9" /><path d="M12 22c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9s-9 4.03-9 9c0 4.97 4.03 9 9 9z" /></svg>,
  Wine: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8" /><path d="M12 15v7" /><path d="M12 15a8 8 0 0 0 8-8V3H4v4a8 8 0 0 0 8 8z" /><path d="M4 7h16" /></svg>,
  Shower: (props) => <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>,
  User: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Layers: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  EyeOff: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  Phone: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Mail: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  Hash: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>,
  Home: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Globe: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  FileText: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  CheckCircle: ({ size = 24, color = "currentColor", strokeWidth = 2 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  AlertCircle: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  Camera: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  Shield: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
};

const FEEDBACK_TYPES = [
  { id: "Complaint", label: "Complaint", color: "#EF4444", icon: <LocalIcons.AlertTriangle size={32} /> },
  { id: "Suggestion", label: "Suggestion", color: "#3B82F6", icon: <LocalIcons.Lightbulb size={32} /> },
  { id: "Appreciation", label: "Appreciation", color: "#10B981", icon: <LocalIcons.Heart size={32} /> },
];

const hexToRgb = (hex) => {
  if (!hex || !hex.startsWith('#')) return "16, 185, 129";
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.substring(0, 2), 16);
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.substring(2, 4), 16);
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const GeneralFeedback = ({ currentUser, onBack, onSuccess, overrideConfig = null, isPreview = false }) => {
  const { getLabel, systemSettings } = useTerminology();
  const [step, setStep] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
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
  const [allowComments, setAllowComments] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [customFields, setCustomFields] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [confirmingSelection, setConfirmingSelection] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [matrixRatings, setMatrixRatings] = useState({});
  const [selectionMethod, setSelectionMethod] = useState("manual"); // auto | manual

  const adminColor = systemSettings?.primary_color || "#10B981";
  const primaryColor = formConfig?.theme?.primary_color || adminColor;
  const bgStyle = formConfig?.theme?.bg_style || "abstract";

  const getDynamicBackground = () => {
    const p = primaryColor;
    const p08 = `rgba(${hexToRgb(p)}, 0.08)`;
    const p05 = `rgba(${hexToRgb(p)}, 0.05)`;
    const p12 = `rgba(${hexToRgb(p)}, 0.12)`;
    
    switch (bgStyle) {
      case 'minimal': 
        return { background: '#FFFFFF' };
      case 'gradient': 
        return { background: `linear-gradient(135deg, ${p08} 0%, #FFFFFF 100%)` };
      case 'modern':
        return { 
          background: `linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)`,
          position: 'relative'
        };
      case 'abstract': 
      default:
        return {
          background: `
            radial-gradient(at 0% 0%, ${p08} 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, ${p12} 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.03) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(255, 255, 255, 0.5) 0px, transparent 80%),
            #F8FAFC
          `
        };
    }
  };

  useEffect(() => {
    getEntities().then(data => {
      setDbEntities(data);
      if (data.length === 1 && !selectedEntity) {
        setSelectedEntity(data[0]);
        setSelectionMethod("auto");
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setStep("");
    setRating(0);
    setIdea("");
    setFeedbackType("");
    setCustomFields({});
    setMatrixRatings({});
    setSelectedBranch(null);
    setSelectedStaff(null);
    setShowErrors(false);
  };

  useEffect(() => {
    if (overrideConfig) {
      setFormConfig(overrideConfig);
      setConfigLoaded(true);
      setLoading(false);
      // Reset progress when config is swapped (e.g. in Admin Designer)
      resetForm();
      return;
    }
  }, [overrideConfig]);

  useEffect(() => {
    const timer = setTimeout(() => setBranchSearch(branchSearch), 300);
    return () => clearTimeout(timer);
  }, [branchSearch]);

  const enabledSteps = React.useMemo(() => {
    if (!formConfig || !formConfig.steps) return [];

    return formConfig.steps
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        ...s,
        items: (s.items || []).map(it => ({
          ...it,
          label_override: it.label_override || SMART_DEFAULTS[it.key] || it.key,
          helper: it.helper || SMART_HELPERS[it.key]
        }))
      }))
      .filter(s => s.items.length > 0);
  }, [formConfig]);

  useEffect(() => {
    if (enabledSteps.length > 0 && !loading) {
      const isValid = enabledSteps.some(s => s.id === step);
      if (!step || !isValid) {
        setStep(enabledSteps[0].id);
      }
    }
  }, [enabledSteps, step, loading]);

  useEffect(() => {
    if (selectedEntity) {
      setLoading(true);
      // Reset form state to Step 1 whenever a new entity is selected
      if (!overrideConfig) {
        setRating(0);
        setIdea("");
        setFeedbackType("");
        setCustomFields({});
        setMatrixRatings({});
        setSelectedBranch(null);
        setSelectedStaff(null);
        setShowErrors(false);
        setStep(""); // This will trigger the enabledSteps effect to set Step 1
      }
      
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

  const isItemFilled = (item) => {
    if (item.type === "module") {
      const key = item.key;
      if (key === 'entity_picker') return !!selectedEntity;
      if (key === 'location_picker') return !!selectedBranch || (isManualLocation && !!manualLocationText.trim());
      if (key === 'star_rating' || key === 'rating' || key === 'emoji_rating' || key === 'slider_rating') return rating > 0;
      if (key === 'short_text' || key === 'long_text' || key === 'message_input') return !!idea.trim();
      if (key === 'rating_matrix') {
        const ratings = matrixRatings[item.id] || {};
        const criteria = item.config?.criteria || item.criteria || [];
        return criteria.every(c => !!ratings[c]);
      }
      if (key === 'multiple_choice') {
        return !!customFields[item.id || key];
      }
      if (['full_name', 'contact_number', 'email_address', 'mailing_address', 'number_input'].includes(key)) {
        const val = customFields[item.id || key];
        return val !== undefined && val !== null && val.toString().trim() !== "";
      }
      return true;
    }
    if (item.type === "section") {
      const section = formConfig?.sections?.find(s => s.id === item.section_id);
      if (!section) return true;
      return (section.fields || []).every(f => {
        if (!f.required) return true;
        const val = customFields[f.id];
        return val !== undefined && val !== null && val.toString().trim() !== "";
      });
    }
    return true;
  };

  const handleNext = (overrideKey, overrideVal, entityOverride = null) => {
    if (isNavigating) return;
    
    const currentEntity = entityOverride || selectedEntity;
    
    if (!currentEntity && dbEntities.length > 1 && !overrideConfig && !isPreviewMode) {
      setModal({ isOpen: true, title: "Service Required", message: `Please select a category to continue.`, type: "warning" });
      return;
    }
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
      const nextStepId = enabledSteps[idx + 1].id;
      setStep(nextStepId);
      // Optional: scroll to top
      window.scrollTo(0, 0);
    } else {
      setShowPrivacyModal(true);
    }
  };

  const handleBack = () => {
    const idx = enabledSteps.findIndex(s => s.id === step);
    if (idx > 0) {
      setStep(enabledSteps[idx - 1].id);
    } else if (selectedEntity) {
      // Go back to selection screen instead of closing
      setSelectedEntity(null);
      setStep("");
    } else if (typeof onBack === 'function') {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (isPreviewMode) {
      setModal({ isOpen: true, title: "Preview Mode", message: "Flow verified. Deployment ready.", type: "success", onConfirm: () => { if (typeof onSuccess === 'function') onSuccess(); setModal({ isOpen: false }); } });
      return;
    }
    try {
      await createFeedback({
        sender_id: currentUser?.id,
        feedback_type: feedbackType,
        entity_id: selectedEntity.id,
        branch_id: selectedBranch?.id,
        description: idea,
        rating,
        is_anonymous: isAnonymous,
        allow_comments: allowComments,
        custom_data: { ...customFields, matrix_evaluations: matrixRatings, routing_method: selectionMethod }
      });
      setModal({ isOpen: true, title: "Success", message: "Submitted successfully!", type: "success", onConfirm: () => { if (typeof onSuccess === 'function') onSuccess(); setModal({ isOpen: false }); } });
    } catch (e) { 
      const errMsg = e.response?.data?.detail || e.message || "Submission failed.";
      setModal({ isOpen: true, title: "Error", message: errMsg, type: "error" }); 
    }
    finally { setIsSubmitting(false); }
  };

  const getStepIcon = (key) => {
    switch (key) {
      case 'feedback_type': return <LocalIcons.AlertTriangle size={14} />;
      case 'entity_picker': return <LocalIcons.Globe size={14} />;
      case 'location_picker': return <LocalIcons.MapPin size={14} />;
      case 'message_input':
      case 'short_text':
      case 'long_text': return <LocalIcons.MessageSquare size={14} />;
      case 'rating':
      case 'star_rating':
      case 'emoji_rating':
      case 'rating_matrix': return <LocalIcons.Star size={14} />;
      case 'staff':
      case 'staff_mention':
      case 'full_name': return <LocalIcons.User size={14} />;
      case 'contact_number': return <LocalIcons.Phone size={14} />;
      case 'email_address': return <LocalIcons.Mail size={14} />;
      case 'mailing_address': return <LocalIcons.Home size={14} />;
      case 'number_input': return <LocalIcons.Hash size={14} />;
      default: return null;
    }
  };

  const renderItem = (item, idx) => {
    const { key, required, label_override, helper } = item;
    const invalid = showErrors && required && !isItemFilled(item);
    let itemValue = null;
    if (key === 'star_rating' || key === 'rating' || key === 'emoji_rating') itemValue = rating;
    else if (key === 'location_picker') itemValue = selectedBranch;
    else if (key === 'multiple_choice') itemValue = customFields[item.id || key];
    else if (key === 'rating_matrix') {
      const m = matrixRatings[item.id] || {};
      itemValue = Object.keys(m).length > 0 ? m : null;
    }
    else if (['full_name', 'contact_number', 'email_address', 'mailing_address', 'number_input'].includes(key)) {
      itemValue = customFields[item.id || key];
    }

    const renderContent = () => {
      if (key === 'entity_picker') {
        if (dbEntities.length <= 1) return null;
        return (
          <div style={styles.grid}>{dbEntities.map(ent => {
            const name = ent.icon ? (ent.icon.charAt(0).toUpperCase() + ent.icon.slice(1)) : 'Layers';
            const IconComp = LocalIcons[name] || LocalIcons.Layers;
            const isSel = selectedEntity?.id === ent.id;
            return (
              <button key={ent.id} onClick={() => { setSelectedEntity(ent); setConfirmingSelection(ent); setTimeout(() => { setConfirmingSelection(null); handleNext(null, null, ent); }, 800); }} style={{ ...styles.typeCard, borderColor: isSel ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)', background: isSel ? 'rgba(var(--primary-rgb), 0.05)' : 'white', transform: isSel ? 'scale(1.02)' : 'scale(1)' }}>
                <div style={styles.itemIcon}><IconComp size={28} /></div>
                <div style={styles.itemName}>{ent.name}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', textAlign: 'center' }}>{ent.description || 'Quality Service'}</div>
              </button>
            );
          })}</div>
        );
      }
      if (key === 'location_picker') return (
        <div style={styles.branchList}>{branches.map(b => (
          <button key={b.id} onClick={() => { setSelectedBranch(b); handleNext(); }} style={{ ...styles.branchItem, borderColor: selectedBranch?.id === b.id ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)', background: selectedBranch?.id === b.id ? 'rgba(var(--primary-rgb), 0.05)' : 'white' }}>{b.name}</button>
        ))}</div>
      );
      if (key === 'star_rating' || key === 'rating') return (
        <div style={{ display: 'flex', gap: '12px', background: '#F8FAFC', padding: '24px', borderRadius: '20px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', transform: s <= rating ? 'scale(1.1)' : 'scale(1)' }}>
              <LocalIcons.Star size={32} filled={s <= rating} />
            </button>
          ))}
        </div>
      );
      if (key === 'emoji_rating') return (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', background: '#F8FAFC', padding: '24px', borderRadius: '20px' }}>
          {['ðŸ˜ž', 'ðŸ˜', 'ðŸ™‚', 'ðŸ˜ƒ', 'ðŸ¤©'].map((e, i) => (
            <button key={i} onClick={() => setRating(i + 1)} style={{ fontSize: '40px', border: 'none', background: 'none', cursor: 'pointer', transition: '0.2s', transform: rating === (i + 1) ? 'scale(1.2)' : 'scale(1)', filter: rating === (i + 1) ? 'none' : 'grayscale(1) opacity(0.5)' }}>{e}</button>
          ))}
        </div>
      );
      if (key === 'multiple_choice') return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(item.config?.options || []).map((opt, i) => {
            const isSel = customFields[item.id || key] === opt;
            return (
              <button key={i} onClick={() => setCustomFields({ ...customFields, [item.id || key]: opt })} style={{ padding: '18px', borderRadius: '16px', border: `1.5px solid ${isSel ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)'}`, background: isSel ? 'rgba(var(--primary-rgb), 0.05)' : 'white', fontWeight: '700', fontSize: '14px', textAlign: 'left', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{opt}</span>
                {isSel && <LocalIcons.CheckCircle size={18} color="var(--primary-color)" />}
              </button>
            );
          })}
        </div>
      );
      if (key === 'photo_upload') return (
        <button style={{ width: '100%', padding: '30px', borderRadius: '20px', border: '2px dashed #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#64748B' }}>
          <LocalIcons.Camera size={32} />
          <span style={{ fontWeight: '800', fontSize: '14px' }}>Snap or upload photo</span>
        </button>
      );
      if (key === 'long_text' || key === 'message_input') return (
        <textarea style={styles.textarea} value={idea} onChange={e => setIdea(e.target.value)} placeholder={item.config?.placeholder || "Share your thoughts here..."} />
      );
      if (['short_text', 'full_name', 'contact_number', 'email_address', 'number_input'].includes(key)) {
        const inputType = key === 'email_address' ? 'email' : (key === 'number_input' ? 'number' : (key === 'contact_number' ? 'tel' : 'text'));
        return (
          <input type={inputType} style={styles.input} value={customFields[item.id || key] || ""} onChange={e => setCustomFields({ ...customFields, [item.id || key]: e.target.value })} placeholder={item.config?.placeholder || "Type here..."} />
        );
      }
      if (key === 'rating_matrix') return (
        <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', background: '#F8FAFC', padding: '14px', borderBottom: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748B' }}>CRITERIA</span>
            {[1, 2, 3, 4, 5].map(n => <span key={n} style={{ fontSize: '10px', fontWeight: '900', color: '#64748B', textAlign: 'center' }}>{n}</span>)}
          </div>
          {(item.config?.criteria || []).map((c, cIdx) => (
            <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '16px', borderBottom: cIdx === (item.config.criteria.length - 1) ? 'none' : '1px solid #F1F5F9', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{c}</span>
              {[1, 2, 3, 4, 5].map(n => {
                const isSel = matrixRatings[item.id]?.[c] === n;
                return (
                  <div key={n} style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => setMatrixRatings(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), [c]: n } }))} style={{ width: '26px', height: '26px', borderRadius: '8px', border: `2.5px solid ${isSel ? 'var(--primary-color)' : '#E2E8F0'}`, background: isSel ? 'var(--primary-color)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
      return <div style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>Module type not supported</div>;
    };

    const content = renderContent();
    if (!content) return null;

    return (
      <div key={item.id || idx} style={{ marginBottom: '32px', background: 'white', padding: '30px', borderRadius: '30px', border: `1.5px solid ${invalid ? '#EF4444' : 'rgba(0,0,0,0.03)'}`, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ ...styles.label, color: '#0F172A', fontSize: '14px', fontWeight: '600', marginBottom: '6px', textTransform: 'none', letterSpacing: '-0.01em', lineHeight: '1.4' }}>{label_override}{item.required && <span style={{ color: '#EF4444', marginLeft: '6px' }}>*</span>}</label>
          {helper && <p style={{ fontSize: '11px', color: '#64748B', margin: '6px 0 0', fontWeight: '400', lineHeight: '1.4' }}>{helper}</p>}
        </div>
        <div style={{ position: 'relative', marginTop: '12px' }}>
          {content}
          {!!itemValue && !['message_input', 'long_text', 'short_text'].includes(key) && (
            <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: '800', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease' }}>
              <LocalIcons.CheckCircle size={14} strokeWidth={3} />
              <span>Response captured</span>
            </div>
          )}
        </div>
        {invalid && <div style={{ marginTop: '15px', color: '#EF4444', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><LocalIcons.AlertCircle size={14} />Required to continue</div>}
      </div>
    );
  };

  if (loading && !configLoaded) return <div style={styles.loader}>Loading...</div>;
  const currentStep = enabledSteps.find(s => s.id === step);
  const currentIndex = enabledSteps.findIndex(s => s.id === step);

  return (
    <div 
      className="feedback-container"
      style={{ 
        ...styles.container, 
        ...getDynamicBackground(),
        '--primary-color': primaryColor,
        '--primary-rgb': hexToRgb(primaryColor)
      }}
    >
      {(selectedEntity || overrideConfig) && (
        <header style={styles.header}>
          <div style={{ width: 40 }} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {selectedEntity && (
              <WorkflowStepper steps={enabledSteps} currentIndex={currentIndex} primaryColor="var(--primary-color)" onStepClick={setStep} />
            )}
          </div>
          <div style={{ width: 40 }} />
        </header>
      )}
      <main style={styles.content}>
        {!selectedEntity && !overrideConfig ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px 16px',
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 12px 40px -10px rgba(0,0,0,0.08)',
            margin: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* INTENTIONAL HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '22px', 
                fontWeight: '800', 
                color: '#0F172A', 
                margin: '0 0 8px 0', 
                letterSpacing: '-0.03em', 
                lineHeight: '1.2' 
              }}>
                How can we help?
              </h2>
              <div style={{ 
                width: '32px', 
                height: '3px', 
                background: 'var(--primary-color)', 
                margin: '0 auto 12px', 
                borderRadius: '2px',
                opacity: 0.6
              }} />
              <p style={{ 
                fontSize: '13px', 
                color: '#64748B', 
                fontWeight: '500', 
                lineHeight: '1.4',
                maxWidth: '240px',
                margin: '0 auto'
              }}>
                Please select the service category you interacted with today.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              maxWidth: '380px',
              width: '100%',
              justifyContent: 'center'
            }}>
              {dbEntities.map(ent => {
                const isSel = selectedEntity?.id === ent.id;
                const iconName = ent.icon ? (ent.icon.charAt(0).toUpperCase() + ent.icon.slice(1)) : 'Layers';
                const IconComp = LocalIcons[iconName] || LocalIcons.Layers;
                
                const colorMap = {
                  spa: { bg: '#F0FDFA', icon: '#0D9488', border: '#CCFBF1' },
                  restaurant: { bg: '#FFF7ED', icon: '#EA580C', border: '#FFEDD5' },
                  pool: { bg: '#EFF6FF', icon: '#2563EB', border: '#DBEAFE' },
                  gym: { bg: '#F5F3FF', icon: '#7C3AED', border: '#EDE9FE' },
                  default: { bg: '#F8FAFC', icon: adminColor, border: '#F1F5F9' }
                };
                const theme = colorMap[ent.name.toLowerCase()] || colorMap.default;

                return (
                  <button 
                    key={ent.id} 
                    onClick={() => { 
                      setConfirmingSelection(ent); 
                      setTimeout(() => { 
                        setSelectedEntity(ent); 
                        setConfirmingSelection(null); 
                      }, 800); 
                    }} 
                    className="minimal-service-card press-effect"
                    style={{ 
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '18px 12px',
                      backgroundColor: isSel ? theme.bg : '#FFFFFF',
                      borderRadius: '24px',
                      border: `1.5px solid ${isSel ? 'var(--primary-color)' : '#F1F5F9'}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSel 
                        ? `0 10px 20px -5px rgba(${hexToRgb(primaryColor)}, 0.2)` 
                        : '0 4px 12px rgba(0,0,0,0.03)',
                      zIndex: isSel ? 2 : 1
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '16px',
                      backgroundColor: isSel ? 'var(--primary-color)' : theme.bg,
                      color: isSel ? '#FFFFFF' : theme.icon,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: isSel 
                        ? '0 8px 16px rgba(var(--primary-rgb), 0.3)' 
                        : `inset 0 0 0 1px ${theme.border}`
                    }}>
                      <IconComp size={24} />
                    </div>
                    
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '800', 
                      color: isSel ? 'var(--primary-color)' : '#1E293B',
                      letterSpacing: '-0.01em'
                    }}>
                      {ent.name}
                    </div>
                    
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: '600', 
                      color: isSel ? 'var(--primary-color)' : '#94A3B8',
                      marginTop: '4px',
                      opacity: isSel ? 0.8 : 0.6
                    }}>
                      {isSel ? 'Selected' : 'Service Point'}
                    </div>

                    {confirmingSelection?.id === ent.id && (
                      <div style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        background: 'rgba(255, 255, 255, 0.9)', 
                        backdropFilter: 'blur(4px)',
                        borderRadius: '22px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--primary-color)', 
                        zIndex: 10,
                        animation: 'fadeIn 0.2s ease'
                      }}>
                         <div className="loader-mini" style={{ width: '20px', height: '20px', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <style>{`
              .minimal-service-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(0,0,0,0.06);
                border-color: #E2E8F0;
              }
              .minimal-service-card:active {
                transform: scale(0.97);
              }
              .press-effect:active {
                transform: scale(0.97);
              }
            `}</style>
          </div>
        ) : (
          currentStep && (
            <div className="step-transition">
              {currentStep.items.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>
                  <div style={{ color: '#94A3B8', marginBottom: '12px' }}><LocalIcons.Layers size={32} /></div>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#64748B' }}>No interactions yet</div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Add interactions in the designer to see them here.</p>
                </div>
              ) : (
                currentStep.items.map((it, idx) => renderItem(it, idx))
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button onClick={handleBack} style={{ ...styles.nextBtn, background: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', boxShadow: 'none', flex: 1, height: '48px' }}>Back</button>
                {(!['entity_picker'].includes(currentStep.items[0]?.key) || isPreview) && (
                  <button onClick={() => handleNext()} style={{ ...styles.nextBtn, flex: 2, height: '48px' }}>{currentIndex === enabledSteps.length - 1 ? "Submit Feedback" : "Continue"}</button>
                )}
              </div>
            </div>
          )
        )}
      </main>
      <CustomModal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onConfirm={() => { if (modal.onConfirm) modal.onConfirm(); setModal({ ...modal, isOpen: false }); }} />
      
      {showPrivacyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '32px 24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <LocalIcons.Shield size={24} />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Privacy & Interaction</h3>
              <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '400', lineHeight: '1.4', margin: '0 0 20px 0' }}>Before submitting, adjust how you'd like your feedback to be shared.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Anonymous Toggle */}
                <div 
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '18px', background: isAnonymous ? 'rgba(59, 130, 246, 0.04)' : '#F8FAFC', border: `1.5px solid ${isAnonymous ? '#3B82F6' : 'transparent'}`, cursor: 'pointer', transition: '0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: isAnonymous ? '#3B82F6' : '#94A3B8' }}>{isAnonymous ? <LocalIcons.EyeOff size={20} /> : <LocalIcons.User size={20} />}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>Submit Anonymously</div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '400' }}>Hide your name from public</div>
                    </div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${isAnonymous ? '#3B82F6' : '#E2E8F0'}`, background: isAnonymous ? '#3B82F6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                    {isAnonymous && <LocalIcons.Check size={14} color="white" strokeWidth={4} />}
                  </div>
                </div>

                {/* Comments Toggle */}
                <div 
                  onClick={() => setAllowComments(!allowComments)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '18px', background: allowComments ? 'rgba(16, 185, 129, 0.04)' : '#F8FAFC', border: `1.5px solid ${allowComments ? '#10B981' : 'transparent'}`, cursor: 'pointer', transition: '0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: allowComments ? '#10B981' : '#94A3B8' }}>{allowComments ? <LocalIcons.MessageSquare size={20} /> : <LocalIcons.MessageSquare size={20} style={{ opacity: 0.5 }} />}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>Allow Comments</div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '400' }}>Let others discuss this feedback</div>
                    </div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${allowComments ? '#10B981' : '#E2E8F0'}`, background: allowComments ? '#10B981' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                    {allowComments && <LocalIcons.Check size={14} color="white" strokeWidth={4} />}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => { setShowPrivacyModal(false); handleSubmit(); }}
                disabled={isSubmitting}
                style={{ ...styles.nextBtn, width: '100%', height: '52px' }}
              >
                {isSubmitting ? "Submitting..." : "Finish & Submit"}
              </button>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '13px', fontWeight: '800', cursor: 'pointer', height: '32px' }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } 
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .step-transition { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

function WorkflowStepper({ steps, currentIndex, primaryColor, onStepClick }) {
  if (steps.length <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      {steps.map((s, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <React.Fragment key={s.id}>
            <div onClick={() => isCompleted && onStepClick(s.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: isActive ? primaryColor : (isCompleted ? primaryColor : '#F1F5F9'), color: (isActive || isCompleted) ? 'white' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: isActive ? `0 0 0 4px var(--primary-soft)` : 'none', cursor: isCompleted ? 'pointer' : 'default', fontSize: '12px', fontWeight: '900' }}>
              {isCompleted ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : (i + 1)}
            </div>
            {i < steps.length - 1 && <div style={{ width: '20px', height: '2px', background: i < currentIndex ? primaryColor : '#F1F5F9', transition: '0.3s' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const styles = {
  container: { 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column',
    fontFamily: "'Outfit', sans-serif" 
  },
  header: { padding: '24px 20px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', position: 'sticky', top: 0, zIndex: 10 },
  headerTitle: { fontSize: '14px', fontWeight: '600', color: '#0F172A', letterSpacing: '-0.02em' },
  content: { flex: 1, padding: '24px 20px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  typeCard: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '24px 16px', 
    borderRadius: '24px', 
    background: 'rgba(255, 255, 255, 0.8)', 
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.7)', 
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5)', 
    cursor: 'pointer', 
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
    textAlign: 'center' 
  },
  itemIcon: { 
    width: '60px', 
    height: '60px', 
    borderRadius: '20px', 
    background: 'white', 
    boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.06)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    color: 'var(--primary-color)', 
    marginBottom: '12px',
    transition: 'all 0.3s'
  },
  itemName: { fontWeight: '600', fontSize: '14px', color: '#0F172A', marginBottom: '2px' },
  branchList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  branchItem: { padding: '16px', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', lineHeight: '1.4' },
  formGroup: { marginBottom: '24px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#0F172A', marginBottom: '8px', display: 'block', lineHeight: '1.4' },
  textarea: { width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1.5px solid #E2E8F0', height: '120px', outline: 'none', fontSize: '13px', background: 'white', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset', lineHeight: '1.5' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px', background: 'white', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset', lineHeight: '1.5' },
  nextBtn: { width: '100%', padding: '0 20px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-rgb), 0.8) 100%)', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 10px 20px -5px rgba(var(--primary-rgb), 0.4)', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', letterSpacing: '0.01em' },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  sectionTitle: { fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)', marginBottom: '16px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', letterSpacing: '-0.01em', lineHeight: '1.4' },
  loader: { padding: '100px', textAlign: 'center', fontWeight: '600', fontSize: '14px', color: 'var(--primary-color)' }
};

export default GeneralFeedback;
