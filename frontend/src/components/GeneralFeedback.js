import React, { useState, useEffect } from "react";
import { createFeedback, getEntities, getBranches, getProducts, getEntityFormConfig, createDraft, updateDraft, deleteDraft } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";
import { IconRegistry } from "./IconRegistry";
import CustomModal from "./CustomModal";

// Service types that can have Products
const SERVICE_TYPES_WITH_PRODUCTS = ['Restaurant', 'Pool', 'Spa', 'Housekeeping', 'Shop', 'Store', 'Gift Shop'];

const SMART_DEFAULTS = {
  star_rating: "How would you rate your overall experience?",
  rating_matrix: "Please evaluate the following categories:",
  rating: "Overall satisfaction",
  short_text: "In a few words, how was your visit?",
  long_text: "Please share any additional details or suggestions.",
  message_input: "How can we improve?",
  multiple_choice: "Which of these best describes your visit?",
  photo_upload: "Snap or upload a photo (Optional)",
  full_name: "May we know your name?",
  contact_number: "Mobile or phone number",
  email_address: "Email address",
  mailing_address: "Home or mailing address",
  number_input: "Reference or Ticket number",
  entity_picker: "Select the service category",
  location_picker: "Select your branch or location",
  product_picker: "What did you purchase or review?"
};

const SMART_HELPERS = {
  star_rating: "Tap a star to give your rating",
  rating_matrix: "1 is low, 5 is high",
  photo_upload: "Images help us understand better",
  full_name: "We use this for internal verification",
  email_address: "We will only contact you if necessary",
  product_picker: "Search or select from the list below"
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
  Package: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4L7.5 4.21M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
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

const GeneralFeedback = React.memo(({ currentUser, onBack, onSuccess, onSaveDraft, resumeDraft, initialDraft, entities: preFetchedEntities = null, overrideConfig = null, isPreview = false }) => {
  const { getLabel, systemSettings } = useTerminology();
  const draft = initialDraft || resumeDraft;
  const [step, setStep] = useState(draft?.step || "");
  const [feedbackType, setFeedbackType] = useState(draft?.feedback_type || "");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formConfig, setFormConfig] = useState(overrideConfig || null);
  const [configLoaded, setConfigLoaded] = useState(!!overrideConfig);
  const [loading, setLoading] = useState(!overrideConfig);
  const lastConfigVersion = React.useRef(0);
  const isResuming = React.useRef(!!draft);
  const lastSelectedEntityId = React.useRef(draft?.entity_id || null);
  const isPreviewMode =
    new URLSearchParams(window.location.search).get('preview') === 'true' ||
    window.location.pathname.includes('/preview') || isPreview;

  const [dbEntities, setDbEntities] = useState(preFetchedEntities || []);
  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [manualLocationText, setManualLocationText] = useState("");
  const [idea, setIdea] = useState(draft?.idea || "");
  const [rating, setRating] = useState(draft?.rating || 0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [customFields, setCustomFields] = useState(draft?.customFields || draft?.custom_data?.customFields || {});
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [confirmingSelection, setConfirmingSelection] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [matrixRatings, setMatrixRatings] = useState(draft?.matrixRatings || draft?.custom_data?.matrixRatings || {});
  const [selectionMethod, setSelectionMethod] = useState("manual"); // auto | manual
  const [validationHint, setValidationHint] = useState(null);
  const [stepJustValidated, setStepJustValidated] = useState(false);
  const [showAutofillSuccess, setShowAutofillSuccess] = useState(false);
  const [autofillStatus, setAutofillStatus] = useState({}); // { fieldId: 'filled' | 'kept' | 'missing' }
  const [bulkSummary, setBulkSummary] = useState("");
  const [mediaStatus, setMediaStatus] = useState({}); // { fieldId: { status: 'idle'|'validating'|'compressing'|'uploading'|'scanning'|'safe'|'failed', progress: 0, preview: null, error: null } }
  const [products, setProducts] = useState([]);
  const [globalProducts, setGlobalProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState(draft?.selectedProducts || []);
  const [productEvaluations, setProductEvaluations] = useState(draft?.productEvaluations || []);

  // --- MEDIA GOVERNANCE HELPERS ---
  const generateThumbnail = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 400; // Small but sharp
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], `thumb_${file.name}`, { type: "image/jpeg", lastModified: Date.now() }));
          }, "image/jpeg", 0.7); // Highly compressed for feed
        };
      };
    });
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
          }, "image/jpeg", 0.85);
        };
      };
    });
  };

  const handleMediaAction = async (item, fileOrFiles) => {
    const fieldId = item.id || item.key;
    const config = item.config || {};
    const isMultiple = config.multiple || item.key === 'photo_upload';
    const files = isMultiple ? (fileOrFiles instanceof FileList ? Array.from(fileOrFiles) : [fileOrFiles]) : [fileOrFiles];

    const batchId = Math.random().toString(36).substring(7);
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) console.log(`[AUDIT:BATCH_SELECTION] selected_count=${files.length} filenames=${JSON.stringify(files.map(f => f.name))} batch_id=${batchId}`);

    const uploadPromises = files.map(async (file, index) => {
      const fileUid = `${fieldId}_${file.name}_${Date.now()}_${index}`;
      if (isDev) console.log(`[AUDIT:BATCH_UPLOAD] file_index=${index} original_name=${file.name} upload_started=${new Date().toISOString()} batch_id=${batchId}`);

      setMediaStatus(prev => ({
        ...prev,
        [fieldId]: {
          ...(prev[fieldId] || {}),
          [fileUid]: { status: 'validating', progress: 0, preview: null, error: null, name: file.name, batchId, index }
        }
      }));

      try {
        const allowedTypes = config.allowed_types || ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
        const maxSize = config.max_file_size || 10485760;

        if (!allowedTypes.some(t => file.type.includes(t.split('/')[1]) || file.type === t)) throw new Error("Invalid type.");
        if (file.size > maxSize) throw new Error("Too large.");

        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        setMediaStatus(prev => ({
          ...prev,
          [fieldId]: { ...prev[fieldId], [fileUid]: { ...prev[fieldId][fileUid], preview } }
        }));

        let finalFile = file;
        let thumbFile = null;

        if (file.type.startsWith('image/')) {
          setMediaStatus(prev => ({
            ...prev,
            [fieldId]: { ...prev[fieldId], [fileUid]: { ...prev[fieldId][fileUid], status: 'compressing' } }
          }));

          // Original/Full-Res for Lightbox
          if (file.size > 1 * 1024 * 1024) {
            finalFile = await compressImage(file);
          }
          // Lightweight Thumbnail for Feed (Target ≤ 300 KB)
          thumbFile = await generateThumbnail(file);
        }

        const uploadFile = async (f, isThumb = false) => {
          const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;
          const formData = new FormData();
          formData.append('file', f);
          const response = await fetch(`${API_BASE}/feedbacks/upload`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Batch-ID': batchId, 'X-File-Index': index.toString() }
          });
          if (!response.ok) throw new Error(`Upload failed (${response.status})`);
          return (await response.json()).url;
        };

        setMediaStatus(prev => ({
          ...prev,
          [fieldId]: { ...prev[fieldId], [fileUid]: { ...prev[fieldId][fileUid], status: 'uploading', progress: 50 } }
        }));

        const startTime = Date.now();
        const originalUrl = await uploadFile(finalFile);
        let thumbUrl = originalUrl; // Fallback to original
        if (thumbFile) {
          try { thumbUrl = await uploadFile(thumbFile, true); } catch (e) { console.warn("Thumb upload failed, using original."); }
        }
        const endTime = Date.now();

        // [PROD:UPLOAD] Monitoring
        if (!isDev) {
          console.info(`[PROD:UPLOAD] status=SUCCESS duration=${endTime - startTime}ms original_name=${file.name} batch_id=${batchId}`);
        }

        if (isDev) console.log(`[AUDIT:BATCH_UPLOAD] file_index=${index} original_name=${file.name} upload_completed=${new Date().toISOString()} returned_url=${originalUrl} batch_id=${batchId}`);

        setMediaStatus(prev => ({
          ...prev,
          [fieldId]: { ...prev[fieldId], [fileUid]: { ...prev[fieldId][fileUid], status: 'safe', progress: 100 } }
        }));

        const fileData = {
          uid: fileUid, name: file.name, size: file.size, type: file.type,
          url: originalUrl,
          thumb_url: thumbUrl,
          batchId, index
        };

        setCustomFields(prev => {
          const current = prev[fieldId];
          if (isMultiple) {
            const arr = Array.isArray(current) ? current : [];
            return { ...prev, [fieldId]: [...arr, fileData] };
          }
          return { ...prev, [fieldId]: fileData };
        });

        return { success: true, url: originalUrl };
      } catch (err) {
        if (isDev) console.error(`[AUDIT:BATCH_UPLOAD] FAILED file_index=${index} name=${file.name} error=${err.message}`);
        setMediaStatus(prev => ({
          ...prev,
          [fieldId]: { ...prev[fieldId], [fileUid]: { ...prev[fieldId][fileUid], status: 'failed', error: err.message } }
        }));
        return { success: false, error: err.message };
      }
    });

    await Promise.all(uploadPromises);
  };

  // --- PHASE 7: MOBILE LAYOUT AUDIT ---
  useEffect(() => {
    const auditLayout = () => {
      if (window.DEBUG_MODE) {
        console.log("[AUDIT:LAYOUT]", {
          width: window.innerWidth,
          height: window.innerHeight,
          pixelRatio: window.devicePixelRatio,
          isMobile: window.innerWidth < 768,
          orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        });
      }
    };
    auditLayout();
    window.addEventListener('resize', auditLayout);

    // --- PHASE 11: MULTI-TAB CONFLICT DETECTION ---
    const handleStorageChange = (e) => {
      if (!currentUser?.id) return;
      const userFingerprint = `${currentUser.id}_${currentUser.created_at || 'legacy'}`;
      const draftsKey = `user.drafts_${userFingerprint}`;
      if (e.key === draftsKey) {
        if (window.DEBUG_MODE) console.warn("[AUDIT:CONFLICT] Draft updated in another tab.");
        setModal({
          isOpen: true,
          title: "Multi-Tab Conflict",
          message: "Your draft was updated in another window. Please refresh to synchronize your progress.",
          type: "warning",
          confirmText: "Refresh Now",
          onConfirm: () => window.location.reload()
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('resize', auditLayout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser?.id]);

  // --- PHASE 10: DEBOUNCED DRAFT SAVE ---
  useEffect(() => {
    if (!currentUser?.id || !selectedEntity?.id || isPreviewMode) return;

    const timer = setTimeout(() => {
      const userFingerprint = `${currentUser.id}_${currentUser.created_at || 'legacy'}`;
      const draftsKey = `user.drafts_${userFingerprint}`;
      const currentDrafts = JSON.parse(localStorage.getItem(draftsKey) || "[]");
      const existingIdx = currentDrafts.findIndex(d => d.entity_id === selectedEntity.id);

      const draftData = {
        id: draft?.id || `local_${Date.now()}`,
        entity_id: selectedEntity.id,
        branch_id: selectedBranch?.id,
        idea,
        rating,
        customFields,
        matrixRatings,
        schemaVersion: formConfig?.updated_at || 1,
        userEmail: currentUser.email,
        profileUpdatedAt: currentUser.updated_at,
        timestamp: new Date().toISOString()
      };

      if (existingIdx > -1) currentDrafts[existingIdx] = draftData;
      else currentDrafts.push(draftData);

      localStorage.setItem(draftsKey, JSON.stringify(currentDrafts));
      if (window.DEBUG_MODE) console.log("[AUDIT:DRAFT_SAVED] Progress persisted");

      // --- PHASE 11: RE-ELIGIBILITY RULE ---
      // If user makes new progress, clear the localStorage dismissal flag
      const dismissalKey = `dismissedDraft_${userFingerprint}_${selectedEntity.id}`;
      if (localStorage.getItem(dismissalKey)) {
        localStorage.removeItem(dismissalKey);
        if (window.DEBUG_MODE) console.log("[AUDIT:DRAFT_DISMISSAL] LocalStorage dismissal cleared due to new progress.");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [idea, rating, customFields, matrixRatings, selectedEntity, selectedBranch, currentUser, isPreviewMode]);

  // Fetch products when entity/branch changes
  useEffect(() => {
    if (selectedEntity) {
      setProductLoading(true);
      getProducts(selectedEntity.id, selectedBranch?.id)
        .then(data => setProducts(data))
        .catch(err => {
          console.error("Failed to fetch products:", err);
          setProducts([]);
        })
        .finally(() => setProductLoading(false));
    } else {
      setProducts([]);
    }
  }, [selectedEntity?.id, selectedBranch?.id]);

  // --- PHASE 10: API DEDUPLICATION ---
  const entityFetchRef = React.useRef(false);
  useEffect(() => {
    if (dbEntities.length === 0 && !entityFetchRef.current) {
      entityFetchRef.current = true;
      Promise.all([
        getEntities(),
        getProducts() // Fetch all active products globally once for previews
      ]).then(([entData, prodData]) => {
        setDbEntities(entData);
        if (prodData && Array.isArray(prodData)) {
          setGlobalProducts(prodData);
        }
        if (window.DEBUG_MODE) console.log("[AUDIT:API] Entities and Global Products deduplicated");
      }).catch(err => {
        console.error("Failed to fetch entities or products", err);
        entityFetchRef.current = false;
      });
    }
  }, []);

  const adminColor = systemSettings?.primary_color || "#10B981";
  const primaryColor = formConfig?.theme?.primary_color || adminColor;
  const bgStyle = formConfig?.theme?.bg_style || "abstract";

  const dynamicBackground = React.useMemo(() => {
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
  }, [primaryColor, bgStyle]);

  useEffect(() => {
    if (preFetchedEntities && preFetchedEntities.length > 0) {
      if (preFetchedEntities.length === 1 && !selectedEntity) {
        setSelectedEntity(preFetchedEntities[0]);
        setSelectionMethod("auto");
      }
      setLoading(false);
      return;
    }

    getEntities().then(data => {
      setDbEntities(data);
      if (draft?.entity_id) {
        const ent = data.find(e => e.id === draft.entity_id);
        if (ent) setSelectedEntity(ent);
      } else if (data.length === 1 && !selectedEntity) {
        setSelectedEntity(data[0]);
        setSelectionMethod("auto");
      }
    }).catch(console.error).finally(() => setLoading(false));
    getProducts().then(prodData => {
      if (prodData && Array.isArray(prodData)) setGlobalProducts(prodData);
    }).catch(console.error);
  }, [preFetchedEntities, draft]);

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

  const isItemFilled = (item) => {
    if (!item) return true;
    const { key, type, required, id } = item;
    const itemId = id || key;

    // console.log(`Validating field: ${key} (Required: ${required})`);

    if (type === "module") {
      // 1. Core System Pickers
      if (key === 'entity_picker') return !!selectedEntity;
      if (key === 'location_picker') return !!selectedBranch || (isManualLocation && !!manualLocationText.trim());
      if (key === 'product_picker') return selectedProducts.length > 0;

      // 2. Ratings (Matrix has its own state, others use 'rating')
      if (key === 'rating_matrix') {
        const ratings = matrixRatings[id || key] || {};
        const criteria = item.config?.criteria || item.criteria || [];
        return criteria.length > 0 && criteria.every(c => !!ratings[c]);
      }
      if (['star_rating', 'rating', 'slider_rating'].includes(key)) return rating > 0;

      // 3. Text/Numeric Inputs & Everything else in customFields
      const val = customFields[itemId];
      const hasCustomVal = val !== undefined && val !== null && val.toString().trim() !== "";

      // Fallback for legacy 'idea' bindings
      const hasIdeaVal = !!idea.trim();

      // If it's a known identity/input field
      if (['short_text', 'long_text', 'message_input', 'full_name', 'contact_number', 'email_address', 'mailing_address', 'number_input', 'multiple_choice', 'photo_upload'].includes(key)) {
        if (['long_text', 'message_input'].includes(key)) return hasCustomVal || hasIdeaVal;
        return hasCustomVal;
      }

      // Catch-all for any other required module: must have a custom field value
      if (required) return hasCustomVal;

      return true;
    }

    if (type === "section") {
      const section = formConfig?.sections?.find(s => s.id === item.section_id);
      if (!section) return true;
      return (section.fields || []).every(f => {
        if (!f.required) return true;
        const val = customFields[f.id];
        return val !== undefined && val !== null && val.toString().trim() !== "";
      });
    }

    // Default for unknown types: if required, check customFields
    if (required) return !!customFields[itemId];

    return true;
  };

  useEffect(() => {
    const timer = setTimeout(() => setBranchSearch(branchSearch), 300);
    return () => clearTimeout(timer);
  }, [branchSearch]);

  // --- SILENT AUTO-PREFILL LOGIC ---
  useEffect(() => {
    // privacyMode architecture: if enabled, skip silent prefill
    const privacyMode = false;
    if (!configLoaded || !formConfig || !currentUser || privacyMode) return;

    const profileMap = {
      full_name: currentUser.name,
      contact_number: currentUser.phone,
      email_address: currentUser.email,
      mailing_address: currentUser.exact_address
    };

    let hasUpdates = false;
    const newCustomFields = { ...customFields };

    enabledSteps.forEach(s => {
      s.items.forEach(it => {
        const val = profileMap[it.key];
        const isReq = it.required === true || it.required === "true";
        const currentVal = newCustomFields[it.id || it.key];

        if (isReq && val && !currentVal) {
          newCustomFields[it.id || it.key] = val;
          hasUpdates = true;
        }
      });
    });

    if (hasUpdates) {
      setCustomFields(newCustomFields);
    }
  }, [configLoaded, formConfig, currentUser]);

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

  const currentStepProgress = React.useMemo(() => {
    if (!configLoaded || !formConfig) return { required: { total: 0, filled: 0 }, optional: { total: 0, filled: 0 }, isComplete: false };

    const current = enabledSteps.find(s => s.id === step);
    if (!current) return { required: { total: 0, filled: 0 }, optional: { total: 0, filled: 0 }, isComplete: false };

    const allItems = [];
    current.items.forEach(it => {
      if (it.type === "section") {
        const section = formConfig?.sections?.find(s => s.id === it.section_id);
        if (section && section.fields) {
          section.fields.forEach(f => allItems.push({ ...f, type: 'module' }));
        }
      } else {
        allItems.push(it);
      }
    });

    const required = allItems.filter(it => it.required === true || it.required === "true");
    const optional = allItems.filter(it => !it.required || (it.required !== true && it.required !== "true"));

    const requiredFilled = required.filter(it => isItemFilled(it)).length;
    const optionalFilled = optional.filter(it => isItemFilled(it)).length;

    return {
      required: { total: required.length, filled: requiredFilled },
      optional: { total: optional.length, filled: optionalFilled },
      isComplete: required.length === 0 || requiredFilled === required.length
    };
  }, [enabledSteps, step, customFields, rating, matrixRatings, selectedEntity, selectedBranch, configLoaded, formConfig]);

  useEffect(() => {
    if (currentStepProgress.isComplete && !stepJustValidated) {
      setStepJustValidated(true);
      setTimeout(() => setStepJustValidated(false), 1000);
    } else if (!currentStepProgress.isComplete) {
      setStepJustValidated(false);
    }
  }, [currentStepProgress.isComplete]);

  useEffect(() => {
    if (selectedEntity) {
      setLoading(true);

      // Only reset form if we are explicitly switching to a different entity
      // and we are NOT currently resuming a draft
      const isSwitchingEntity = lastSelectedEntityId.current && lastSelectedEntityId.current !== selectedEntity.id;

      if (!overrideConfig && isSwitchingEntity && !isResuming.current) {
        resetForm();
      }

      // Update the tracked entity ID
      lastSelectedEntityId.current = selectedEntity.id;

      // After the first valid entity selection in a resume flow, we turn off the resume flag
      if (isResuming.current) {
        // We wait until after the reset check to clear this, 
        // but we can do it now since we've already checked isSwitchingEntity
        isResuming.current = false;
      }

      Promise.all([getBranches(selectedEntity.id), getEntityFormConfig(selectedEntity.id)])
        .then(([bd, cd]) => {
          const activeBranches = bd.filter(b => b.is_active);
          setBranches(activeBranches);
          if (draft?.branch_id) {
            const b = activeBranches.find(x => x.id === draft.branch_id);
            if (b) setSelectedBranch(b);
          }
          if (!lastConfigVersion.current) {
            if (window.DEBUG_MODE) console.log("AUDIT: Backend Raw Config Received", cd);

            // --- PHASE 11: SCHEMA VERSION MISMATCH CHECK ---
            if (draft && cd.updated_at && draft.schemaVersion && draft.schemaVersion !== cd.updated_at) {
              if (window.DEBUG_MODE) console.warn("[AUDIT:VERSION] Schema mismatch detected", { draft: draft.schemaVersion, live: cd.updated_at });
              setModal({
                isOpen: true,
                title: "Form Updated",
                message: "This form has been updated since your last visit. We'll safely restore what still matches.",
                type: "info"
              });
            }

            // --- PHASE 11: IDENTITY CONSISTENCY CHECK ---
            if (draft && currentUser.updated_at && draft.profileUpdatedAt && draft.profileUpdatedAt !== currentUser.updated_at) {
              if (window.DEBUG_MODE) console.warn("[AUDIT:IDENTITY] Profile update detected");
              setModal({
                isOpen: true,
                title: "Profile Updated",
                message: "Your profile has been updated since this draft was saved. Would you like to use your latest details?",
                type: "confirm",
                confirmText: "Use latest profile",
                cancelText: "Keep draft values",
                onConfirm: () => setModal({ isOpen: false }),
                onCancel: () => setModal({ isOpen: false })
              });
            }

            // Granular Audit for User Rendering
            cd.steps?.forEach(step => {
              step.items?.forEach(item => {
                if (window.DEBUG_MODE) {
                  console.log(`[User Render] STEP: ${step.label} | FIELD: ${item.label_override || item.key} | ID: ${item.id} | REQUIRED: ${item.required}`);
                }
              });
            });
            setFormConfig(cd);
            setConfigLoaded(true);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [selectedEntity]);


  const handleNext = (overrideKey, overrideVal, entityOverride = null) => {
    if (isNavigating) return;
    if (!configLoaded) {
      setModal({ isOpen: true, title: "Please Wait", message: "Loading form validation schema...", type: "info" });
      return;
    }

    const currentEntity = entityOverride || selectedEntity;

    if (!currentEntity && dbEntities.length > 1 && !overrideConfig && !isPreviewMode) {
      setModal({ isOpen: true, title: "Service Required", message: `Please select a category to continue.`, type: "warning" });
      return;
    }
    const current = enabledSteps.find(s => s.id === step);
    if (!current) return;

    const invalidFields = current.items.filter(it => {
      const isReq = it.required === true || it.required === "true";

      // --- PHASE 7: REQUIRED FIELD AUDIT ---
      if (window.DEBUG_MODE) {
        console.log(`[AUDIT:FIELD]`, {
          id: it.id || it.key,
          label: it.label_override || it.key,
          type: it.key,
          step: current.label,
          required: isReq,
          value: customFields[it.id || it.key] || rating || "EMPTY",
          valid: isItemFilled(it)
        });
      }

      return isReq && !isItemFilled(it);
    });

    if (invalidFields.length > 0 && !overrideKey) {
      if (window.DEBUG_MODE) {
        console.warn(`[AUDIT:VALIDATION_FAIL] Step: ${current.label} | Missing: ${invalidFields.length}`);
      }
      setShowErrors(true);
      const firstInvalid = invalidFields[0];
      const elementId = `field-${firstInvalid.id || current.items.indexOf(firstInvalid)}`;
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('shake-validation');
        setTimeout(() => el.classList.remove('shake-validation'), 500);
      }

      // Show sticky hint
      setValidationHint(`${invalidFields.length} required field${invalidFields.length > 1 ? 's' : ''} missing`);
      setTimeout(() => setValidationHint(null), 3000);
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

  const handleSaveToDrafts = async () => {
    const draftId = draft?.id || "draft_" + Date.now();
    const draftData = {
      entity_id: selectedEntity?.id,
      branch_id: selectedBranch?.id,
      staff_id: selectedStaff?.id,
      feedback_type: feedbackType,
      idea,
      rating,
      custom_data: {
        customFields,
        matrixRatings,
        entity_name: selectedEntity?.name,
        branch_name: selectedBranch?.name
      },
      step: step,
      title: selectedEntity?.name ? `Feedback for ${selectedEntity.name}` : "Untitled Draft",
      description: idea || "No content..."
    };

    if (currentUser?.id) {
      try {
        if (draft?.id && typeof draft.id === 'number') {
          await updateDraft(draft.id, draftData);
        } else {
          await createDraft(currentUser.id, draftData);
        }
      } catch (err) {
        console.error("Failed to save draft to cloud", err);
        // Fallback to local
        saveToLocalStorage(draftId, draftData);
      }
    } else {
      saveToLocalStorage(draftId, draftData);
    }

    if (typeof onSaveDraft === 'function') onSaveDraft();

    setModal({ isOpen: false });
    setSelectedEntity(null);
    setStep("");
    if (typeof onBack === 'function') onBack();
  };

  const saveToLocalStorage = (id, data) => {
    const draftsKey = `user.drafts_${currentUser?.id || 'guest'}`;
    const savedDrafts = JSON.parse(localStorage.getItem(draftsKey) || "[]");
    const fullData = {
      ...data,
      id,
      created_at: draft?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const existingIndex = savedDrafts.findIndex(d => d.id === id);
    if (existingIndex >= 0) {
      savedDrafts[existingIndex] = fullData;
    } else {
      savedDrafts.push(fullData);
    }
    localStorage.setItem(draftsKey, JSON.stringify(savedDrafts));
  };

  const handleBack = () => {
    if (isPreviewMode) return;
    const idx = enabledSteps.findIndex(s => s.id === step);
    if (idx > 0) {
      setStep(enabledSteps[idx - 1].id);
    } else if (selectedEntity) {
      // Check if user has entered any data
      const hasData = rating > 0 || (idea && idea.trim().length > 0) || Object.keys(customFields).length > 0 || Object.keys(matrixRatings).length > 0;

      if (hasData) {
        setModal({
          isOpen: true,
          title: "Unsaved Feedback",
          message: "You have unsaved changes. Choose an action to continue.",
          type: "alert",
          showDefaultActions: false,
          onCancel: () => setModal({ isOpen: false }), // ESC/Overlay support
          content: (
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
              <button
                onClick={() => setModal({ isOpen: false })}
                style={{ flex: 1, padding: '12px 8px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }}
              >
                Keep Editing
              </button>
              <button
                onClick={handleSaveToDrafts}
                style={{ flex: 1.2, padding: '12px 8px', borderRadius: '12px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: '800', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)', transition: '0.2s' }}
              >
                Save Draft
              </button>
              <button
                onClick={() => {
                  setModal({ isOpen: false });
                  setSelectedEntity(null);
                  setStep("");
                }}
                style={{ flex: 1, padding: '12px 8px', borderRadius: '12px', border: 'none', background: '#FEF2F2', color: '#EF4444', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }}
              >
                Discard
              </button>
            </div>
          )
        });
      } else {
        setSelectedEntity(null);
        setStep("");
      }
    } else if (typeof onBack === 'function') {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (isPreviewMode) {
      setModal({ isOpen: true, title: "Preview Mode", message: "Flow verified. Deployment ready.", type: "success", onConfirm: () => { if (typeof onSuccess === 'function') onSuccess(); setModal({ isOpen: false }); } });
      return;
    }
    // --- PHASE 7: SUBMISSION AUDIT ---
    if (window.DEBUG_MODE) {
      console.log("[AUDIT:SUBMIT_START]", {
        form_id: formConfig?.id,
        user_id: currentUser?.id,
        steps_total: enabledSteps.length,
        draft: !!draft?.id,
        timestamp: new Date().toISOString()
      });
    }

    // --- RECOVERY RULE: ATOMIC MEDIA GUARD ---
    const allMediaStatus = Object.values(mediaStatus).flatMap(field => Object.values(field));
    const pendingCount = allMediaStatus.filter(m => !['safe', 'failed', 'idle'].includes(m.status)).length;
    const failedCount = allMediaStatus.filter(m => m.status === 'failed').length;

    if (pendingCount > 0) {
      setModal({
        isOpen: true,
        title: "Uploads in Progress",
        message: `Please wait while ${pendingCount} photo(s) finish uploading.`,
        type: "warning"
      });
      return;
    }

    if (failedCount > 0) {
      setModal({
        isOpen: true,
        title: "Upload Failed",
        message: `${failedCount} photo(s) failed to upload. Please retry or remove them before submitting.`,
        type: "error"
      });
      return;
    }

    try {
      const schemaItems = enabledSteps.flatMap(s => s.items || []);
      const starModules = schemaItems.filter(i => (i.type || i.key) === 'star_rating').map(i => i.id || i.key);
      const emojiModules = schemaItems.filter(i => (i.type || i.key) === 'emoji_rating').map(i => i.id || i.key);
      const sliderModules = schemaItems.filter(i => (i.type || i.key) === 'slider_scale').map(i => i.id || i.key);

      const evalData = {};
      const starValues = [];

      // Force evaluation modules to save into custom_data using their real module id
      if (rating !== null && rating !== undefined) {
        starModules.forEach(id => { evalData[id] = rating; starValues.push(rating); });
        emojiModules.forEach(id => { evalData[id] = rating; });
        sliderModules.forEach(id => { evalData[id] = rating; });
      }

      // Snapshot field labels for data preservation
      const field_labels = {};
      schemaItems.forEach(item => {
        field_labels[item.id || item.key] = item.label_override || item.label || item.key;
      });

      const mergedCustomData = {
        ...customFields,
        ...evalData,
        ...matrixRatings,
        product_evaluations: productEvaluations,
        routing_method: selectionMethod,
        product_metadata: selectedProducts.length > 0 ? {
          category: selectedProducts[0].category,
          price: selectedProducts[0].price,
          image_url: selectedProducts[0].image_url,
          evaluation_template_id: selectedProducts[0].evaluation_template_id,
          all_selected: selectedProducts.map(p => ({ id: p.id, name: p.name, category: p.category }))
        } : null,
        field_labels
      };

      console.log('[AUDIT:EVALUATION_SUBMIT]', {
        feedback_id: 'pending',
        custom_data: mergedCustomData,
        star_modules: starModules,
        star_values: starValues,
      });

      const payload = {
        sender_id: currentUser?.id,
        feedback_type: feedbackType,
        entity_id: selectedEntity.id,
        branch_id: selectedBranch?.id,
        product_id: selectedProducts[0]?.id || null,
        product_name: selectedProducts.map(p => p.name).join(', ') || null,
        product_sku: selectedProducts[0]?.sku || null,
        description: idea,
        rating,
        is_anonymous: isAnonymous,
        allow_comments: allowComments,
        custom_data: mergedCustomData
      };

      // [AUDIT:MATRIX_SUBMIT]
      enabledSteps.flatMap(s => s.items).filter(it => it.key === 'rating_matrix').forEach(it => {
        const val = matrixRatings[it.id || it.key];
        console.log(`[AUDIT:MATRIX_SUBMIT]`, {
          module_type: 'rating_matrix',
          value: val
        });
      });

      // [AUDIT:PHOTO_SUBMIT] & Submission Guard
      const photoKeys = enabledSteps.flatMap(s => s.items).filter(it => it.key === 'photo_upload').map(it => it.id || it.key);
      let hasBlobUrl = false;

      photoKeys.forEach(photoKey => {
        const val = payload.custom_data[photoKey];
        if (val) {
          const arr = Array.isArray(val) ? val : [val];
          // Validate & Clean
          const cleanedArr = arr.map(a => {
            const cleaned = { ...a };
            const finalUrl = cleaned.url || cleaned.preview;
            if (finalUrl && finalUrl.startsWith('blob:')) {
              hasBlobUrl = true;
            }
            console.log(`[AUDIT:PHOTO_PERSISTENCE]`, {
              original_preview: cleaned.preview,
              persisted_url: cleaned.url,
              url_type: cleaned.url?.startsWith('http') ? 'http' : (cleaned.url?.startsWith('/uploads') ? 'path' : 'unknown')
            });
            delete cleaned.preview; // NEVER save preview to backend
            return cleaned;
          });
          payload.custom_data[photoKey] = cleanedArr;

          console.log(`[AUDIT:PHOTO_SUBMIT]`, {
            module_id: photoKey,
            module_type: 'photo_upload',
            original_filename: cleanedArr.map(a => a.name).join(', '),
            mime_type: cleanedArr.map(a => a.type).join(', '),
            file_size: cleanedArr.map(a => a.size).join(', '),
            upload_url: cleanedArr.map(a => a.url || a.storage).join(', '),
            saved_value: {
              type: "photo_upload",
              value: cleanedArr.map(a => ({
                url: a.url || a.storage,
                name: a.name
              }))
            }
          });
        }
      });

      if (hasBlobUrl) {
        setModal({
          isOpen: true,
          title: "Photo Processing",
          message: "A photo is still uploading or processing. Please wait a moment and try again.",
          type: "warning"
        });
        setIsSubmitting(false);
        return;
      }

      // [AUDIT:PHOTO_PAYLOAD]
      photoKeys.forEach(photoKey => {
        const val = payload.custom_data[photoKey];
        if (val) {
          const arr = Array.isArray(val) ? val : [val];
          arr.forEach(a => {
            console.log(`[AUDIT:PHOTO_PAYLOAD]`, {
              feedback_id: 'pending',
              module_id: photoKey,
              persisted_url: a.url,
              starts_with_blob: a.url?.startsWith('blob:'),
              starts_with_http: a.url?.startsWith('http')
            });
          });
        }
      });

      const response = await createFeedback(payload);

      if (window.DEBUG_MODE) {
        console.log("[AUDIT:SUBMIT_SUCCESS]", { payload_size: JSON.stringify(payload).length });
        console.log("[AUDIT:SUBMISSION_RESPONSE]", {
          customFields: response?.custom_data || response?.customFields,
          media: response?.media,
          attachments: response?.attachments
        });
      }
      setModal({
        isOpen: true,
        title: "Success",
        message: "Submitted successfully!",
        type: "success",
        onConfirm: () => {
          // --- PHASE 11: SECURE DRAFT CLEANUP ---
          if (currentUser?.id && selectedEntity?.id) {
            const userFingerprint = `${currentUser.id}_${currentUser.created_at || 'legacy'}`;
            const draftsKey = `user.drafts_${userFingerprint}`;
            try {
              const savedDrafts = JSON.parse(localStorage.getItem(draftsKey) || "[]");
              // Remove both by explicit ID (if editing existing) and by entity_id (if auto-saved)
              const filtered = savedDrafts.filter(d => d.id !== draft?.id && d.entity_id !== selectedEntity.id);
              localStorage.setItem(draftsKey, JSON.stringify(filtered));
              if (window.DEBUG_MODE) console.log("[AUDIT:CLEANUP] Local drafts purged.");
            } catch (err) {
              console.error("Failed to cleanup draft after submission", err);
            }
          }

          // Cloud cleanup
          if (draft?.id && typeof draft.id === 'number') {
            deleteDraft(draft.id).catch(err => console.error("Failed to delete cloud draft", err));
          }

          if (typeof onSuccess === 'function') onSuccess();
          setModal({ isOpen: false });
        }
      });
    } catch (e) {
      if (window.DEBUG_MODE) {
        console.error("[AUDIT:SUBMISSION] NETWORK FAILED", e);
      }
      const isNetworkError = !e.response && (e.message === 'Network Error' || e.code === 'ECONNABORTED' || !window.navigator.onLine);
      const errMsg = isNetworkError
        ? "You're offline. Your progress is safe."
        : (e.response?.data?.detail || e.message || "Submission failed.");

      setModal({
        isOpen: true,
        title: isNetworkError ? "Connection lost" : "Error",
        message: errMsg,
        type: "error"
      });
    }
    finally { setIsSubmitting(false); }
  };


  const renderItem = (item, idx) => {
    const { key, required, label_override, helper } = item;
    const label = label_override || item.label || "";
    const isProminent = ['multiple_choice', 'rating_matrix'].includes(key);
    const invalid = showErrors && required && !isItemFilled(item);
    let itemValue = null;
    if (key === 'star_rating' || key === 'rating') itemValue = rating;
    else if (key === 'location_picker') itemValue = selectedBranch;
    else if (key === 'multiple_choice') itemValue = customFields[item.id || key];
    else if (key === 'rating_matrix') {
      const m = matrixRatings[item.id || key] || {};
      itemValue = Object.keys(m).length > 0 ? m : null;
    }
    else if (['full_name', 'contact_number', 'email_address', 'mailing_address', 'number_input'].includes(key)) {
      itemValue = customFields[item.id || key];
    }
    else if (key === 'product_picker') itemValue = selectedProducts.length > 0 ? selectedProducts : null;

    const renderContent = () => {
      if (key === 'entity_picker') {
        if (dbEntities.length <= 1) return null;
        return (
          <div style={styles.grid}>{dbEntities.map(ent => {
            const IconComp = IconRegistry[ent.icon] || IconRegistry.default;
            const isSel = selectedEntity?.id === ent.id;
            return (
              <button key={ent.id} onClick={() => { setSelectedEntity(ent); setConfirmingSelection(ent); setTimeout(() => { setConfirmingSelection(null); handleNext(null, null, ent); }, 800); }} style={{ ...styles.typeCard, borderColor: isSel ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)', background: isSel ? 'rgba(var(--primary-rgb), 0.05)' : 'white', transform: isSel ? 'scale(1.02)' : 'scale(1)' }}>
                <div style={styles.itemIcon}><IconComp width="28" height="28" strokeWidth="2.5" /></div>
                <div style={styles.itemName}>{ent.name}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', textAlign: 'center' }}>{ent.description || 'Quality Service'}</div>
                {(() => {
                  if (!SERVICE_TYPES_WITH_PRODUCTS.includes(ent.fields?.operational?.workspace_type)) return null;
                  const entProducts = globalProducts.filter(p => p.entity_id === ent.id && p.is_active !== false);
                  if (entProducts.length === 0) return null;
                  return (
                    <div style={{ marginTop: '12px', padding: '6px 10px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6366F1', fontSize: '10px', fontWeight: '800', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px' }}>🛍</span> {entProducts.length} Product{entProducts.length !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '9px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                        {entProducts.slice(0, 3).map(p => p.name).join(' • ')}
                        {entProducts.length > 3 && ` • +${entProducts.length - 3}`}
                      </div>
                    </div>
                  );
                })()}
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
      if (key === 'multiple_choice') {
        // Evaluate config to determine if it allows multiple selections, defaulting to true for maximum flexibility unless explicitly disabled
        const allowMultiple = item.config?.allow_multiple !== false;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(item.config?.options || []).map((opt, i) => {
              const currentVal = customFields[item.id || key];
              const safeArray = Array.isArray(currentVal) ? currentVal : (currentVal ? [currentVal] : []);
              const isSel = allowMultiple ? safeArray.includes(opt) : currentVal === opt;

              const handleSelect = () => {
                if (!allowMultiple) {
                  setCustomFields({ ...customFields, [item.id || key]: isSel ? null : opt });
                } else {
                  const nextArray = isSel ? safeArray.filter(v => v !== opt) : [...safeArray, opt];
                  setCustomFields({ ...customFields, [item.id || key]: nextArray.length ? nextArray : null });
                }
              };

              return (
                <button key={i} onClick={handleSelect} type="button" style={{ padding: '18px', borderRadius: '16px', border: `1.5px solid ${isSel ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)'}`, background: isSel ? 'rgba(var(--primary-rgb), 0.05)' : 'white', fontWeight: '700', fontSize: '14px', textAlign: 'left', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{opt}</span>
                  {isSel && <LocalIcons.CheckCircle size={18} color="var(--primary-color)" />}
                </button>
              );
            })}
          </div>
        );
      }
      // Voice recording module removed due to hardware incompatibility
      if (key === 'voice_record') return null;

      if (key === 'photo_upload' || key === 'file_upload' || key === 'video_upload') {
        const fieldId = item.id || key;
        const currentMediaMap = mediaStatus[fieldId] || {};
        const processingUids = Object.keys(currentMediaMap).filter(uid => !['safe', 'idle', 'failed'].includes(currentMediaMap[uid].status));
        const failedUids = Object.keys(currentMediaMap).filter(uid => currentMediaMap[uid].status === 'failed');

        const value = customFields[fieldId];
        const isPhoto = key === 'photo_upload';
        const config = item.config || {};
        const isMultiple = config.multiple || isPhoto;

        const mediaItems = isMultiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);

        return (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="file"
              id={`file-input-${fieldId}`}
              style={{ display: 'none' }}
              multiple={isMultiple}
              accept={config.allowed_types?.join(',')}
              onChange={(e) => {
                if (e.target.files.length > 0) handleMediaAction(item, e.target.files);
              }}
            />

            {/* SOCIAL PHOTO GALLERY UI */}
            {isPhoto && (
              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                padding: '4px 0 12px 0',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
                {mediaItems.map((m, mIdx) => (
                  <div key={m.uid} style={{
                    position: 'relative',
                    flexShrink: 0,
                    width: '100px',
                    height: '100px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1.5px solid #F1F5F9',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}>
                    <img src={m.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => {
                        const next = [...mediaItems];
                        next.splice(mIdx, 1);
                        setCustomFields({ ...customFields, [fieldId]: next });
                      }}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(16,185,129,0.8)', color: 'white', fontSize: '8px', fontWeight: '900', textAlign: 'center', padding: '2px 0' }}>SAFE</div>
                  </div>
                ))}

                {/* PROCESSING STATES AS THUMBNAILS */}
                {processingUids.map(uid => (
                  <div key={uid} style={{ flexShrink: 0, width: '100px', height: '100px', borderRadius: '16px', border: '1.5px dashed var(--primary-color)', background: 'rgba(var(--primary-rgb), 0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {currentMediaMap[uid].preview ? (
                      <img src={currentMediaMap[uid].preview} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
                    ) : (
                      <div className="loader-mini" style={{ width: '16px', height: '16px', border: '2px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                    )}
                    <div style={{ position: 'absolute', fontSize: '8px', fontWeight: '900', color: 'var(--primary-color)', textTransform: 'uppercase' }}>{currentMediaMap[uid].status}</div>
                  </div>
                ))}

                {/* ADD BUTTON */}
                <button
                  onClick={() => document.getElementById(`file-input-${fieldId}`).click()}
                  style={{ flexShrink: 0, width: '100px', height: '100px', borderRadius: '16px', border: '2px dashed #E2E8F0', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', transition: '0.2s' }}
                >
                  <LocalIcons.Camera size={20} color="#94A3B8" />
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8' }}>{mediaItems.length > 0 ? "Add More" : "Add Photos"}</span>
                </button>
              </div>
            )}

            {/* GOVERNED MEDIA UI (FILE/VOICE/VIDEO) OR FAILED STATES */}
            {(!isPhoto || failedUids.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!isPhoto && mediaItems.length === 0 && processingUids.length === 0 && (
                  <button
                    onClick={() => document.getElementById(`file-input-${fieldId}`).click()}
                    style={{ width: '100%', padding: '30px 20px', borderRadius: '24px', border: '2.5px dashed #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                  >
                    <LocalIcons.Layers size={24} color="#64748B" />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: '#1E293B' }}>{label_override}</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>{config.allowed_types?.join(', ')} • Max {Math.round((config.max_file_size || 10485760) / 1024 / 1024)}MB</div>
                    </div>
                  </button>
                )}

                {/* List of files (Governed mode) */}
                {!isPhoto && mediaItems.map((m, mIdx) => (
                  <div key={m.uid} style={{ padding: '12px 16px', borderRadius: '16px', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LocalIcons.FileText size={20} color="var(--primary-color)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>{(m.size / 1024 / 1024).toFixed(2)} MB • {config.retention_days}d Retention</div>
                    </div>
                    <button onClick={() => setCustomFields({ ...customFields, [fieldId]: isMultiple ? mediaItems.filter(x => x.uid !== m.uid) : undefined })} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}

                {/* Failed states list */}
                {failedUids.map(uid => (
                  <div key={uid} style={{ padding: '12px 16px', borderRadius: '16px', background: '#FEF2F2', border: '1.5px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LocalIcons.AlertCircle size={18} color="#EF4444" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#991B1B' }}>{currentMediaMap[uid].name}</div>
                      <div style={{ fontSize: '10px', color: '#EF4444' }}>{currentMediaMap[uid].error}</div>
                    </div>
                    <button onClick={() => document.getElementById(`file-input-${fieldId}`).click()} style={{ padding: '6px 12px', borderRadius: '8px', background: 'white', border: '1px solid #FCA5A5', color: '#EF4444', fontSize: '10px', fontWeight: '800' }}>Retry</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      if (key === "product_picker") {
        const filteredProducts = products.filter(p =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku?.toLowerCase().includes(productSearch.toLowerCase())
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <input
                style={{
                  width: '100%', padding: '12px 16px 12px 40px', borderRadius: '14px',
                  border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                  fontSize: '14px', outline: 'none', transition: '0.2s'
                }}
                placeholder="Search products or categories..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <LocalIcons.Search />
              </div>
            </div>

            {productLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Loading catalog...</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                <LocalIcons.Package size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>No products found</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                maxHeight: '140px',
                overflowY: 'auto',
                padding: '4px'
              }}>
                {filteredProducts.map(p => {
                  const isSel = selectedProducts.some(sel => sel.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProducts(prev => {
                          const isAlreadySel = prev.some(sel => sel.id === p.id);
                          if (isAlreadySel) {
                            return prev.filter(sel => sel.id !== p.id);
                          } else {
                            return [...prev, p];
                          }
                        });
                        // Optional: Reset evaluations if needed, or keep them if they are per-product
                        // setProductEvaluations([]); 
                      }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        padding: '12px', borderRadius: '16px', border: `2px solid ${isSel ? 'var(--primary-color)' : '#F1F5F9'}`,
                        background: isSel ? 'rgba(var(--primary-rgb), 0.04)' : '#FFFFFF',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                        boxShadow: isSel ? '0 4px 12px rgba(var(--primary-rgb), 0.1)' : 'none',
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: '100%' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: isSel ? 'var(--primary-color)' : '#1E293B', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748B' }}>{p.category || 'Product'}</div>
                        {p.price && <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary-color)', marginTop: '4px' }}>₱{p.price.toLocaleString()}</div>}
                      </div>
                      {isSel && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--primary-color)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 2 }}>
                          <LocalIcons.Check />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* DYNAMIC PRODUCT EVALUATION INJECTION (Progressive Reveal) */}
            <div style={{
              maxHeight: selectedProducts.length > 0 && selectedProducts[0].evaluation_template ? '800px' : '0px',
              overflow: 'hidden',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: selectedProducts.length > 0 && selectedProducts[0].evaluation_template ? 1 : 0,
              marginTop: selectedProducts.length > 0 && selectedProducts[0].evaluation_template ? '12px' : '0px'
            }}>
              <div style={{
                padding: '20px', borderRadius: '24px',
                background: 'rgba(var(--primary-rgb), 0.03)', border: '1.5px solid rgba(var(--primary-rgb), 0.1)',
                display: 'flex', flexDirection: 'column', gap: '16px'
              }}>
                {selectedProducts[0]?.evaluation_template?.criteria.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>{c.label}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          onClick={() => {
                            const next = [...(productEvaluations || [])];
                            const idx = next.findIndex(x => x.id === c.id);
                            if (idx > -1) next[idx] = { id: c.id, label: c.label, score: s };
                            else next.push({ id: c.id, label: c.label, score: s });
                            setProductEvaluations(next);
                          }}
                          type="button"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transition: '0.2s', transform: (productEvaluations?.find(x => x.id === c.id)?.score || 0) >= s ? 'scale(1.1)' : 'scale(1)' }}
                        >
                          <LocalIcons.Star
                            size={20}
                            filled={(productEvaluations?.find(x => x.id === c.id)?.score || 0) >= s}
                            color={(productEvaluations?.find(x => x.id === c.id)?.score || 0) >= s ? '#F59E0B' : '#E2E8F0'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (key === 'long_text' || key === 'message_input') return (
        <MemoizedTextArea
          style={styles.textarea}
          value={customFields[item.id || key] || idea || ""}
          onChange={val => {
            setCustomFields({ ...customFields, [item.id || key]: val });
            setIdea(val); // Sync with idea for legacy support
          }}
          placeholder={item.config?.placeholder || "Share your thoughts here..."}
        />
      );
      if (['short_text', 'full_name', 'contact_number', 'email_address', 'mailing_address', 'number_input'].includes(key)) {
        const inputType = key === 'email_address' ? 'email' : (key === 'number_input' ? 'number' : (key === 'contact_number' ? 'tel' : 'text'));

        // --- SMART PROFILE AUTOFILL LOGIC (PHASE 2: PRIVACY AWARE) ---
        const profileMap = {
          full_name: { val: currentUser?.name, icon: "👤", label: "saved name", aria: "Use saved name" },
          contact_number: { val: currentUser?.phone, icon: "📱", label: "saved number", aria: "Use saved contact number" },
          email_address: { val: currentUser?.email, icon: "✉", label: "saved email", aria: "Use saved email" },
          mailing_address: { val: currentUser?.exact_address, icon: "🏠", label: "saved address", aria: "Use saved address" }
        };

        const maskValue = (type, val) => {
          if (!val) return "";
          if (type === 'full_name') return val;
          if (type === 'contact_number') {
            if (val.includes(' ')) {
              const parts = val.split(' ');
              return `${parts[0]} ••• ••• ${val.slice(-4)}`;
            }
            // Handle continuous numbers like 09090909123
            if (val.length > 4) {
              const prefix = val.length > 7 ? val.slice(0, 2) : "";
              return `${prefix}•• •••• ${val.slice(-4)}`;
            }
            return `•••• ${val.slice(-2)}`;
          }
          if (type === 'email_address') {
            const [user, domain] = val.split('@');
            if (!domain) return val;
            return `${user.charAt(0)}••••@${domain}`;
          }
          if (type === 'mailing_address') return "Saved home address";
          return val;
        };

        const suggestion = profileMap[key];
        const currentVal = customFields[item.id || key] || "";
        const showAutofill = suggestion?.val && !currentVal;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <MemoizedInput
              id={`field-${item.id || idx}`}
              type={inputType}
              style={styles.input}
              value={currentVal}
              onChange={val => setCustomFields({ ...customFields, [item.id || key]: val })}
              placeholder={item.config?.placeholder || "Type here..."}
            />

            {showAutofill && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', animation: 'fadeIn 0.3s ease' }}>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Use {suggestion.label}:
                </span>
                <button
                  onClick={() => {
                    setCustomFields(prev => ({ ...prev, [item.id || key]: suggestion.val }));

                    // --- PHASE 7: AUTOFILL AUDIT ---
                    if (window.DEBUG_MODE) {
                      console.log("[AUDIT:AUTOFILL_CHIP]", { field: key, source: 'profile' });
                    }

                    const el = document.getElementById(`field-${item.id || idx}`);
                    if (el) el.classList.remove('shake-validation');
                  }}
                  className="press-effect"
                  title="Use your saved profile information"
                  aria-label={suggestion.aria}
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: 'rgba(var(--primary-rgb), 0.08)',
                    border: '1.5px solid rgba(var(--primary-rgb), 0.12)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{suggestion.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary-color)' }}>
                    {maskValue(key, suggestion.val)}
                  </span>
                </button>
              </div>
            )}

            {/* SILENT PREFILL INDICATOR (REFINED) */}
            {required && suggestion?.val && currentVal === suggestion.val && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', opacity: 1, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
                  <LocalIcons.Check size={12} strokeWidth={4} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B' }}>
                  From your profile • Edit anytime
                </span>
              </div>
            )}
          </div>
        );
      }
      if (key === 'rating_matrix') {
        const fieldId = item.id || key;
        return (
          <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', background: '#F8FAFC', padding: '14px', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748B' }}>CRITERIA</span>
              {[1, 2, 3, 4, 5].map(n => <span key={n} style={{ fontSize: '10px', fontWeight: '900', color: '#64748B', textAlign: 'center' }}>{n}</span>)}
            </div>
            {(item.config?.criteria || []).map((c, cIdx) => (
              <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '16px', borderBottom: cIdx === (item.config.criteria.length - 1) ? 'none' : '1px solid #F1F5F9', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{c}</span>
                {[1, 2, 3, 4, 5].map(n => {
                  const isSel = matrixRatings[fieldId]?.[c] === n;
                  return (
                    <div key={n} style={{ display: 'flex', justifyContent: 'center' }}>
                      <button onClick={() => setMatrixRatings(prev => ({ ...prev, [fieldId]: { ...(prev[fieldId] || {}), [c]: n } }))} style={{ width: '26px', height: '26px', borderRadius: '8px', border: `2.5px solid ${isSel ? 'var(--primary-color)' : '#E2E8F0'}`, background: isSel ? 'var(--primary-color)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      }
      return <div style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>Module type not supported</div>;
    };

    const content = renderContent();
    if (!content) return null;

    return (
      <div
        key={item.id || idx}
        id={`field-${item.id || idx}`}
        className={`user-portal-card ${invalid ? 'invalid-field' : ''}`}
        style={{
          marginBottom: '16px',
          padding: 'var(--card-padding, 30px)',
          borderRadius: '30px',
          border: `1.5px solid ${invalid ? '#FCA5A5' : 'rgba(0,0,0,0.03)'}`,
          background: invalid ? '#FFF5F5' : 'white',
          boxShadow: invalid ? '0 10px 25px -5px rgba(239, 68, 68, 0.08)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          animation: invalid ? 'shakeStep 0.4s ease' : 'fadeIn 0.5s ease-out',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ 
              ...styles.label, 
              color: invalid ? '#EF4444' : '#0F172A', 
              fontSize: isProminent ? '16px' : 'var(--size-body, 14px)', 
              fontWeight: isProminent ? '800' : '700', 
              marginBottom: isProminent ? '8px' : '4px', 
              textTransform: 'none', 
              letterSpacing: isProminent ? '-0.02em' : '-0.01em', 
              lineHeight: '1.4', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              {label}

              {/* --- PHASE 4: FIELD-LEVEL FEEDBACK LABELS --- */}
              {(() => {
                const status = autofillStatus[item.id || item.key];
                if (!status) return null;

                const config = {
                  filled: { text: "✓ From profile", color: "var(--primary-color)" },
                  kept: { text: "✓ Kept your entry", color: "#3B82F6" },
                  missing: { text: "⚠ Not found in profile", color: "#F59E0B" }
                }[status];

                return (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    color: config.color,
                    background: `${config.color}10`,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    {config.text}
                  </span>
                );
              })()}
            </label>
            {helper && <p style={{ fontSize: 'var(--size-metadata, 11px)', color: '#64748B', margin: '2px 0 0', fontWeight: '400', lineHeight: '1.4' }}>{helper}</p>}
          </div>
          {item.required && (
            <div style={{
              padding: '4px 8px',
              borderRadius: '8px',
              background: invalid ? '#FEE2E2' : '#F1F5F9',
              color: invalid ? '#EF4444' : '#64748B',
              fontSize: '9px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: `1px solid ${invalid ? '#FECACA' : '#E2E8F0'}`,
              flexShrink: 0,
              marginTop: '2px'
            }}>
              Required
            </div>
          )}
        </div>
        <div style={{ position: 'relative', marginTop: '12px' }}>
          {content}
          {!!itemValue && !['message_input', 'long_text', 'short_text'].includes(key) && (
            <div style={{ marginTop: '16px', fontSize: 'var(--size-metadata, 12px)', fontWeight: '800', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease' }}>
              <LocalIcons.CheckCircle size={14} strokeWidth={3} />
              <span>Response captured</span>
            </div>
          )}
        </div>
        {invalid && (
          <div style={{ marginTop: '15px', color: '#EF4444', fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.3s ease' }}>
            <LocalIcons.AlertCircle size={12} />
            Please answer before moving on.
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={styles.loader}>Loading...</div>;
  const currentStep = enabledSteps.find(s => s.id === step);
  const currentIndex = enabledSteps.findIndex(s => s.id === step);

  return (
    <div
      className="feedback-container user-portal-container"
      style={{
        ...styles.container,
        ...dynamicBackground,
        '--primary-color': primaryColor,
        '--primary-rgb': hexToRgb(primaryColor)
      }}
    >
      {(selectedEntity || overrideConfig) && (
        <header style={styles.header}>
          <div style={{ width: 40 }} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {selectedEntity && (
              <WorkflowStepper
                steps={enabledSteps}
                currentIndex={currentIndex}
                primaryColor="var(--primary-color)"
                onStepClick={setStep}
                validationState={enabledSteps.map((s, i) => {
                  const requiredItems = s.items.filter(it => it.required === true || it.required === "true");
                  const optionalItems = s.items.filter(it => !it.required || (it.required !== true && it.required !== "true"));

                  const requiredCount = requiredItems.length;
                  const requiredFilled = requiredItems.filter(it => isItemFilled(it)).length;
                  const anyOptionalFilled = optionalItems.some(it => isItemFilled(it));

                  const isStrictlyComplete = requiredCount > 0
                    ? requiredFilled === requiredCount
                    : anyOptionalFilled;

                  const stepStatus = {
                    id: s.id,
                    isComplete: isStrictlyComplete,
                    hasError: showErrors && !isStrictlyComplete && i <= currentIndex,
                    requiredCount,
                    requiredFilled,
                    anyOptionalFilled,
                    visited: i <= currentIndex
                  };

                  // DEBUG LOG
                  if (window.DEBUG_MODE) {
                    console.log(`STEP AUDIT [${s.label}]:`, {
                      id: s.id,
                      required: `${requiredFilled}/${requiredCount}`,
                      anyOptionalFilled,
                      visited: i <= currentIndex,
                      valid: isStrictlyComplete,
                      status: i < currentIndex ? (isStrictlyComplete ? 'COMPLETE' : 'INCOMPLETE') : (i === currentIndex ? 'ACTIVE' : 'LOCKED')
                    });
                  }

                  return stepStatus;
                })}
              />
            )}
          </div>
          <div style={{ width: 40 }} />
        </header>
      )}
      <ErrorBoundary>
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
              {/* CLOSE BUTTON */}
              <button
                onClick={onBack}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                  zIndex: 20,
                  transition: 'all 0.2s'
                }}
                title="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              {/* INTENTIONAL HEADER */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{
                  fontSize: 'var(--size-page-title, 22px)',
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
                  fontSize: 'var(--size-body, 13px)',
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
                  const IconComp = IconRegistry[ent.icon] || IconRegistry.default;

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
                        <IconComp width="24" height="24" strokeWidth="2.5" />
                      </div>

                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 13px)',
                        fontWeight: '800',
                        color: isSel ? 'var(--primary-color)' : '#1E293B',
                        letterSpacing: '-0.02em',
                        lineHeight: '1.2',
                        width: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {ent.name}
                      </div>

                      <div style={{
                        fontSize: 'var(--size-metadata, 10px)',
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
                <div style={{
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 8px',
                  animation: stepJustValidated ? 'pulseSuccess 0.5s ease' : 'none'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {currentStep?.items?.some(it => ['full_name', 'contact_number', 'email_address', 'mailing_address'].includes(it.key))
                        ? "Your details"
                        : currentStep?.label || 'Step Progress'}
                    </span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {!configLoaded ? (
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', fontStyle: 'italic' }}>
                          Loading validation...
                        </div>
                      ) : (
                        <>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: currentStepProgress.required.filled === currentStepProgress.required.total && currentStepProgress.required.total > 0
                              ? '#10B981'
                              : currentStepProgress.required.filled > 0 ? 'var(--primary-color)' : '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {(() => {
                              const { filled, total } = currentStepProgress.required;
                              if (total === 0) return "";
                              if (filled === 0) return `Complete 0 of ${total} required questions`;
                              if (filled < total) return `${filled} of ${total} required questions completed`;
                              return `All required questions completed ✓`;
                            })()}
                          </div>
                          {currentStepProgress.optional.total > 0 && (
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: currentStepProgress.optional.filled > 0 ? 'var(--primary-color)' : '#94A3B8'
                            }}>
                              {currentStepProgress.optional.filled} of {currentStepProgress.optional.total} optional completed
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {currentStepProgress.isComplete && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(var(--primary-rgb), 0.1)',
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      <LocalIcons.Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </div>

                {/* --- PHASE 3: BULK AUTOFILL ACTION --- */}
                {(() => {
                  const identityFieldsInStep = currentStep?.items?.filter(it =>
                    ['full_name', 'contact_number', 'email_address', 'mailing_address'].includes(it.key)
                  ) || [];

                  const profileMap = {
                    full_name: currentUser?.name,
                    contact_number: currentUser?.phone,
                    email_address: currentUser?.email,
                    mailing_address: currentUser?.exact_address
                  };

                  const fillableFields = identityFieldsInStep.filter(it => {
                    const val = profileMap[it.key];
                    const currentVal = customFields[it.id || it.key];
                    return val && !currentVal;
                  });

                  const allResolved = identityFieldsInStep.every(it => !!(customFields[it.id || it.key]));

                  if (identityFieldsInStep.length < 2) return null;

                  if (allResolved && !showAutofillSuccess) {
                    return (
                      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '10px', fontWeight: '800', animation: 'fadeIn 0.3s ease', opacity: 0.8 }}>
                        <LocalIcons.CheckCircle size={12} color="var(--primary-color)" strokeWidth={3} />
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your details are all set ✓</span>
                      </div>
                    );
                  }

                  if (fillableFields.length === 0 && !showAutofillSuccess) return null;

                  return (
                    <div style={{ marginBottom: '16px', animation: 'fadeIn 0.3s ease' }}>
                      <button
                        onClick={() => {
                          const newCustomFields = { ...customFields };
                          const status = {};
                          let filled = 0;
                          let kept = 0;
                          let missing = 0;

                          identityFieldsInStep.forEach(it => {
                            const val = profileMap[it.key];
                            const currentVal = customFields[it.id || it.key];
                            const fieldId = it.id || it.key;

                            if (val && !currentVal) {
                              newCustomFields[fieldId] = val;
                              status[fieldId] = 'filled';
                              filled++;
                            } else if (val && currentVal) {
                              status[fieldId] = 'kept';
                              kept++;
                            } else if (!val) {
                              status[fieldId] = 'missing';
                              missing++;
                            }
                          });

                          setCustomFields(newCustomFields);
                          setAutofillStatus(status);
                          if (filled > 0) {
                            setBulkSummary("Your saved details have been added ✓");
                          } else {
                            setBulkSummary("No saved detail found");
                          }
                          setShowAutofillSuccess(true);

                          // --- PHASE 7: AUTOFILL AUDIT ---
                          if (window.DEBUG_MODE) {
                            console.log("[AUDIT:AUTOFILL_BULK]", { filled, kept, missing, total: identityFieldsInStep.length });
                          }

                          // Fade field-level status after 3s
                          setTimeout(() => setAutofillStatus({}), 3500);
                          // Hide success button state after 2s
                          setTimeout(() => {
                            setShowAutofillSuccess(false);
                            setBulkSummary("");
                          }, 2500);
                        }}
                        className="press-effect"
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'white',
                          border: '1.5px solid var(--primary-color)',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.08)',
                          height: 'var(--button-height, 32px)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '4px', color: 'var(--primary-color)' }}>
                          <LocalIcons.User size={14} />
                          <LocalIcons.Phone size={14} />
                          <LocalIcons.Mail size={14} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)' }}>
                          {bulkSummary || "Use my saved details"}
                        </span>
                      </button>
                    </div>
                  );
                })()}

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
                  <button onClick={handleBack} style={{ ...styles.nextBtn, background: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', boxShadow: 'none', flex: 1, height: 'var(--button-height, 48px)' }}>Back</button>
                  {(!['entity_picker'].includes(currentStep.items[0]?.key) || isPreview) && (
                    <button onClick={() => handleNext()} style={{ ...styles.nextBtn, flex: 2, height: 'var(--button-height, 48px)' }}>
                      {currentIndex === enabledSteps.length - 1 ? "Review Submission" : "Continue"}
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </main>
        <CustomModal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={() => { if (modal.onConfirm) modal.onConfirm(); else setModal({ ...modal, isOpen: false }); }}
          onCancel={modal.onCancel ? () => { modal.onCancel(); } : undefined}
          confirmText={modal.confirmText || "OK"}
          cancelText={modal.cancelText || "Cancel"}
          isDestructive={modal.isDestructive || false}
          content={modal.content}
          showDefaultActions={modal.showDefaultActions}
        />

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
        {validationHint && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1E293B',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            zIndex: 3000,
            animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none'
          }}>
            <div style={{ color: '#F87171' }}><LocalIcons.AlertCircle size={16} /></div>
            {validationHint}
          </div>
        )}
      </ErrorBoundary>

      <DebugOverlay
        stepProgress={currentStepProgress}
        currentIndex={currentIndex}
        configLoaded={configLoaded}
        isMobile={window.innerWidth < 768}
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } 
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes shakeValidation {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes shakeStep {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        @keyframes pulseSuccess {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); background: rgba(var(--primary-rgb), 0.05); }
          100% { transform: scale(1); }
        }
        .shake-validation { animation: shakeValidation 0.4s ease-in-out; }
        .step-transition { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
});

const MemoizedInput = React.memo(({ value, onChange, placeholder, type, style, id }) => (
  <input
    id={id}
    type={type}
    style={style}
    value={value || ""}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
  />
));

const MemoizedTextArea = React.memo(({ value, onChange, placeholder, style }) => (
  <textarea
    style={style}
    value={value || ""}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
  />
));

function ErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error) => {
      if (window.DEBUG_MODE) console.error("[CRITICAL:UI]", error);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#FEF2F2', borderRadius: '24px', border: '1.5px solid #FCA5A5', margin: '20px' }}>
        <div style={{ color: '#EF4444', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <LocalIcons.AlertTriangle size={48} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#991B1B' }}>Something went wrong</h2>
        <p style={{ fontSize: '14px', color: '#B91C1C', marginBottom: '24px' }}>The interface encountered an unexpected error.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '12px 24px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
        >
          Reload and Continue
        </button>
      </div>
    );
  }
  return children;
}

const DebugOverlay = ({ stepProgress, currentIndex, configLoaded, isMobile }) => {
  if (process.env.NODE_ENV !== 'development' && !window.DEBUG_MODE) return null;
  if (isMobile) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(8px)',
      color: 'white',
      padding: '12px',
      borderRadius: '12px',
      fontSize: '10px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
      pointerEvents: 'none'
    }}>
      <div style={{ fontWeight: '800', marginBottom: '8px', color: '#10B981', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>PLATFORM DEBUG</div>
      <div>Step: {currentIndex + 1}</div>
      <div>Required: {stepProgress.required.filled}/{stepProgress.required.total}</div>
      <div>Schema: {configLoaded ? 'LOADED' : 'WAITING'}</div>
      <div>Mode: {isMobile ? 'MOBILE' : 'DESKTOP'}</div>
      <div>W: {window.innerWidth}px | H: {window.innerHeight}px</div>
    </div>
  );
};

const WorkflowStepper = React.memo(({ steps, currentIndex, primaryColor, onStepClick, validationState = [] }) => {
  if (steps.length <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      {steps.map((s, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        const stepStatus = validationState.find(vs => vs.id === s.id);

        const isComplete = stepStatus?.isComplete && isPast; // Only show check if complete AND left
        const hasError = stepStatus?.hasError;

        // Logic for 4 states
        let bgColor = '#F1F5F9';
        let textColor = '#94A3B8';
        let borderStyle = 'none';
        let content = i + 1;

        if (hasError) {
          bgColor = '#FEF2F2';
          textColor = '#EF4444';
          borderStyle = '1.5px solid #FCA5A5';
          content = <LocalIcons.AlertCircle size={14} />;
        } else if (isActive) {
          bgColor = primaryColor;
          textColor = 'white';
          borderStyle = `0 0 0 4px var(--primary-soft)`;
        } else if (isComplete) {
          bgColor = primaryColor;
          textColor = 'white';
          content = <LocalIcons.Check size={14} strokeWidth={4} />;
        } else if (stepStatus?.isComplete && !isPast) {
          // Valid but currently active or future (future is rare but possible if pre-filled)
          // For active step that is complete, we stay in "Active" visual state (no check)
          if (isActive) {
            bgColor = primaryColor;
            textColor = 'white';
          }
        }

        return (
          <React.Fragment key={s.id}>
            <div
              onClick={() => isPast && onStepClick(s.id)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: bgColor,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? borderStyle : (hasError ? 'none' : 'none'),
                border: hasError ? borderStyle : 'none',
                cursor: isPast ? 'pointer' : 'default',
                fontSize: '12px',
                fontWeight: '900',
                position: 'relative',
                transform: isActive ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {content}

              {hasError && isActive && (
                <div style={{ position: 'absolute', top: '-24px', whiteSpace: 'nowrap', background: '#EF4444', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)', animation: 'fadeIn 0.2s ease' }}>
                  INCOMPLETE
                </div>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: '20px',
                height: '2px',
                background: isComplete ? primaryColor : (isPast ? primaryColor : '#F1F5F9'),
                opacity: isPast ? 1 : 0.5,
                transition: '0.3s'
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Outfit', sans-serif"
  },
  header: { padding: 'var(--card-padding, 24px 20px)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', position: 'sticky', top: 0, zIndex: 10 },
  headerTitle: { fontSize: 'var(--size-page-title, 14px)', fontWeight: '600', color: '#0F172A', letterSpacing: '-0.02em' },
  content: { flex: 1, padding: 'var(--card-padding, 24px 20px)', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  typeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--card-padding, 24px 16px)',
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
  itemName: { fontWeight: '600', fontSize: 'clamp(10px, 3vw, 13px)', color: '#0F172A', marginBottom: '2px', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', letterSpacing: '-0.02em' },
  branchList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  branchItem: { padding: 'var(--card-padding, 16px)', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', fontWeight: '600', fontSize: 'var(--size-body, 13px)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', lineHeight: '1.4' },
  formGroup: { marginBottom: '24px' },
  label: { fontSize: 'var(--size-body, 14px)', fontWeight: '600', color: '#0F172A', marginBottom: '8px', display: 'block', lineHeight: '1.4' },
  textarea: { width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1.5px solid #E2E8F0', height: '120px', outline: 'none', fontSize: 'var(--size-body, 13px)', background: 'white', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset', lineHeight: '1.5' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: 'var(--size-body, 13px)', background: 'white', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset', lineHeight: '1.5' },
  nextBtn: { width: '100%', padding: '0 20px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-rgb), 0.8) 100%)', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: 'var(--size-nav, 14px)', boxShadow: '0 10px 20px -5px rgba(var(--primary-rgb), 0.4)', height: 'var(--button-height, 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', letterSpacing: '0.01em' },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  sectionTitle: { fontSize: 'var(--size-card-title, 14px)', fontWeight: '600', color: 'var(--primary-color)', marginBottom: '16px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', letterSpacing: '-0.01em', lineHeight: '1.4' },
  loader: { padding: '100px', textAlign: 'center', fontWeight: '600', fontSize: '14px', color: 'var(--primary-color)' }
};

export default GeneralFeedback;
