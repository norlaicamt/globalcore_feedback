import React, { useState, useEffect, useRef } from "react";
import { createFeedback, getCategories, getDepartments, getAdminSettings, getUserProfiles, getFormFields } from "../services/api";
import CustomModal from "./CustomModal";
import { IconRegistry } from "./IconRegistry";

const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Building: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/></svg>,
  Food: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 18 0H3z"/><path d="M3 12h18"/><path d="M8 12v-2a4 4 0 0 1 8 0v2"/></svg>,
  Cosmetics: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11h10v10H7z"/><path d="M9 11V7a3 3 0 0 1 6 0v4"/><line x1="12" y1="2" x2="12" y2="4"/></svg>,
  Furniture: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="10" width="20" height="6" rx="2"/><path d="M4 16v4"/><path d="M20 16v4"/><path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/></svg>,
  Car: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="8" rx="2"/><path d="M4 11l1.5-4h13L20 11"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>,
  Resort: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Hotel: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Translate: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Paperclip: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Star: ({ filled }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Mic: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Stop: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};

// Legacy hardcoded lists removed in favor of dynamic backend categories

// Dynamic locations will be loaded from /assets/locations/ JSON files

const PRODUCT_TYPES = ['furniture', 'cosmetics'];
const PACKAGE_TYPES = ['resort', 'hotel'];

const GeneralFeedback = ({ currentUser, onBack, onSuccess, onSaveDraft, initialDraft }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isFilipino, setIsFilipino] = useState(false);

  const [selectedType, setSelectedType] = useState("");
  const [specificName, setSpecificName] = useState(initialDraft?.specificName || "");
  const [otherSpecificName, setOtherSpecificName] = useState(initialDraft?.otherSpecificName || "");

  const [region, setRegion] = useState(initialDraft?.region || "");
  const [province, setProvince] = useState(initialDraft?.province || "");
  const [city, setCity] = useState(initialDraft?.city || "");
  const [barangay, setBarangay] = useState(initialDraft?.barangay || "");
  
  const [regionList, setRegionList] = useState([]);
  const [allProvinces, setAllProvinces] = useState({});
  const [provinceList, setProvinceList] = useState([]);
  const [allCities, setAllCities] = useState({});
  const [cityList, setCityList] = useState([]);
  const [barangayList, setBarangayList] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  const [productName, setProductName] = useState(initialDraft?.productName || "");
  const [idea, setIdea] = useState(initialDraft?.description || "");
  const [rating, setRating] = useState(initialDraft?.rating || 0);
  const [isAnonymous, setIsAnonymous] = useState(initialDraft?.isAnonymous ?? false);
  const [allowComments, setAllowComments] = useState(initialDraft?.allowComments ?? true);

  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalCategoryId, setGeneralCategoryId] = useState(null);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [focusedMentionIndex, setFocusedMentionIndex] = useState(null);
  const [mentions, setMentions] = useState(initialDraft?.mentions || [{ prefix: 'Mr.', name: '', userId: null }]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "alert" });
  
  const isResuming = useRef(!!initialDraft);

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveTimer, setSaveTimer] = useState(10);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en-US');
  const suggestionsRef = useRef(null);

  // Dynamic values for category-specific fields
  const [localDraftId, setLocalDraftId] = useState(initialDraft?.id);
  const [dynamicValues, setDynamicValues] = useState({});
  const [formFields, setFormFields] = useState([]);

  const handleCancelClick = () => {
    if (idea.trim() || specificName || region) setShowDraftModal(true);
    else onBack();
  };

  const performSilentSave = () => {
    const finalName = specificName === "Other" ? otherSpecificName : specificName;
    const titleStr = finalName ? `${selectedBusiness?.name || 'General'}: ${finalName}` : "Untitled Draft";
    
    // Generate an ID if we don't have one yet (either from initialDraft or previous silent save)
    const draftIdToUse = localDraftId || String(Date.now());
    if (!localDraftId) setLocalDraftId(draftIdToUse);

    const newDraft = {
      id: draftIdToUse,
      title: titleStr, description: idea, created_at: new Date().toISOString(),
      business_id: selectedBusiness?.id, specificName, otherSpecificName,
      region, province, city, barangay, productName, mentions, rating, isAnonymous, allowComments
    };
    
    const existing = JSON.parse(localStorage.getItem(`drafts_${currentUser?.id}`) || "[]");
    
    // Check if this draft already exists in the list (by localDraftId)
    const exists = existing.some(d => d.id === draftIdToUse);
    
    const updated = exists
      ? existing.map(d => d.id === draftIdToUse ? newDraft : d)
      : [newDraft, ...existing];
      
    localStorage.setItem(`drafts_${currentUser?.id}`, JSON.stringify(updated));
  };

  const handleSaveDraft = () => {
    performSilentSave();
    setShowDraftModal(false);
    if (onSaveDraft) onSaveDraft(); else onBack();
  };

  const deleteCurrentDraft = () => {
    if (!initialDraft?.id) return;
    const existing = JSON.parse(localStorage.getItem(`drafts_${currentUser?.id}`) || "[]");
    const updated = existing.filter(d => d.id !== initialDraft.id);
    localStorage.setItem(`drafts_${currentUser?.id}`, JSON.stringify(updated));
  };

  const [allowVoiceSetting, setAllowVoiceSetting] = useState(true);
  const [uiText, setUiText] = useState({
    en_title: "Submit Your Feedback",
    en_desc: "Share your thoughts, concerns, or suggestions about any service, office, or establishment. Please select the appropriate category to proceed.",
    fil_title: "Submit Your Feedback",
    fil_desc: "Ang feedback ay para sa pagbabahagi ng inyong opinyon, reklamo, o mungkahi tungkol sa anumang serbisyo o opisina. Mangyaring piliin ang naaangkop na kategorya sa ibaba."
  });
  const [formLayout, setFormLayout] = useState({
    show_staff: true,
    show_rating: true,
    show_attachments: true,
    show_voice: true,
    show_product: false,
  });

  useEffect(() => {
    const loadBaseLocations = async () => {
      try {
        const [regRes, provRes, cityRes] = await Promise.all([
          fetch("/assets/locations/regions.json"),
          fetch("/assets/locations/provinces.json"),
          fetch("/assets/locations/cities.json")
        ]);
        setRegionList(await regRes.json());
        setAllProvinces(await provRes.json());
        setAllCities(await cityRes.json());
      } catch (err) {
        console.error("Failed to load locations", err);
      }
    };
    loadBaseLocations();
  }, []);

  useEffect(() => {
    if (region && allProvinces[region]) {
      setProvinceList(allProvinces[region]);
    } else {
      setProvinceList([]);
    }
    if (!isResuming.current) {
      setProvince(""); setCity(""); setBarangay(""); setCityList([]); setBarangayList([]);
    }
  }, [region, allProvinces]);

  useEffect(() => {
    if (province && allCities[province]) {
      setCityList(allCities[province]);
    } else {
      setCityList([]);
    }
    if (!isResuming.current) {
      setCity(""); setBarangay(""); setBarangayList([]);
    }
  }, [province, allCities]);

  useEffect(() => {
    const loadBarangays = async () => {
      if (city) {
        setIsLoadingLocations(true);
        try {
          const safeCity = city.replace(/[^a-z0-9]/gi, x => " -_".includes(x) ? x : "").trim();
          const res = await fetch(`/assets/locations/barangays/${safeCity}.json`);
          if (res.ok) setBarangayList(await res.json());
          else setBarangayList([]);
        } catch (err) {
          console.error("Failed to load barangays", err);
          setBarangayList([]);
        } finally {
          setIsLoadingLocations(false);
        }
      } else {
        setBarangayList([]);
      }
    };
    loadBarangays();
    if (!isResuming.current) setBarangay("");
  }, [city]);

  useEffect(() => {
    const fetchEverything = async () => {
      try {
        const [settings, categories, departments, allProfiles, fields] = await Promise.allSettled([
          getAdminSettings(),
          getCategories(),
          getDepartments(),
          getUserProfiles(),
          getFormFields()
        ]);

        if (settings.status === 'fulfilled' && settings.value) {
          const dict = {};
          settings.value.forEach(s => { dict[s.key] = s.value; });
          setAllowVoiceSetting(dict['allow_voice'] !== 'false');
          setUiText({
            en_title: dict['general_report_title'] || "Submit Your Feedback",
            en_desc: dict['general_report_instruction'] || "Share your thoughts, concerns, or suggestions about any service, office, or establishment. Please select the appropriate category to proceed.",
            fil_title: dict['general_report_title'] || "Submit Your Feedback",
            fil_desc: dict['general_report_instruction_fil'] || "Ang feedback ay para sa pagbabahagi ng inyong opinyon, reklamo, o mungkahi tungkol sa anumang serbisyo o opisina. Mangyaring piliin ang naaangkop na kategorya sa ibaba.",
          });
          setFormLayout({
            show_staff: dict['form_show_staff'] !== 'false',
            show_rating: dict['form_show_rating'] !== 'false',
            show_attachments: dict['form_show_attachments'] !== 'false',
            show_voice: dict['form_show_voice'] !== 'false',
            show_product: dict['form_show_product'] === 'true',
          });
        }

        if (categories.status === 'fulfilled') {
          setDbCategories(categories.value);
          const genCat = categories.value.find(c => c.name.toLowerCase() === 'general') || categories.value[0];
          if (genCat) setGeneralCategoryId(genCat.id);
          
          // Restore selected business from draft if exists
          if (initialDraft?.business_id) {
            const found = categories.value.find(c => c.id === initialDraft.business_id);
            if (found) setSelectedBusiness(found);
          }
        }

        if (departments.status === 'fulfilled') {
          setDbDepartments(departments.value);
        }

        if (allProfiles.status === 'fulfilled') {
          setUserProfiles(allProfiles.value);
        }

        if (fields?.status === 'fulfilled' && fields.value) {
          setFormFields(fields.value);
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchEverything();
    
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowUserSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedBusiness || (!idea.trim() && !specificName && !region)) {
      setSaveTimer(10);
      return;
    }
    const interval = setInterval(() => {
      setSaveTimer(prev => {
        if (prev <= 1) {
          setIsSavingDraft(true);
          performSilentSave();
          setTimeout(() => setIsSavingDraft(false), 2000);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [idea, specificName, region, province, city, barangay, selectedBusiness, rating, allowComments, isAnonymous, mentions, productName]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm', audioBitsPerSecond: 16000 });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(audioBlob));
        audioChunksRef.current = [];
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => setAudioBase64(reader.result);
      };
      mediaRecorderRef.current.start();

      // --- Start Transcription ---
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = transcriptionLanguage;
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          }
          if (finalTranscript) {
            setIdea(prev => prev.trim() ? prev + ' ' + finalTranscript : finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          if (event.error === 'not-allowed') {
            setModalConfig({ isOpen: true, title: "Permission Denied", message: "Microphone access blocked. Please enable it in your browser settings.", type: "alert" });
          }
        };
        
        recognitionRef.current.start();
      }

      setIsRecording(true);
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") stopRecording();
      }, 30000);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setModalConfig({ isOpen: true, title: "Permission Denied", message: "Could not access microphone. Please allow permissions to use voice notes.", type: "alert" });
      } else {
        setModalConfig({ isOpen: true, title: "Microphone Error", message: "Could not access microphone or transcription service.", type: "alert" });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        // Check for silence (if idea hasn't changed much during recording)
        // This is a simple heuristic: if idea is still empty after recording
        setTimeout(() => {
            if (!idea.trim() && !isRecording) {
                setModalConfig({ isOpen: true, title: "No Speech Detected", message: "We couldn't hear anything. Please try speaking clearly or check your mic.", type: "alert" });
            }
        }, 500);
    }
    setIsRecording(false);
  };

  useEffect(() => {
    if (isResuming.current) {
      // Release the resume lock after a short delay to allow location cascades to finish
      const timer = setTimeout(() => { isResuming.current = false; }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDiscard = () => { setShowDraftModal(false); onBack(); };

  // Location cascading is managed by specific useEffects in the location section

  const allBusinessTypes = dbCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    label: cat.name, // Keep label for filtering compatibility
    fields: cat.fields || [],
    description: cat.description,
    icon: cat.icon || 'default'
  }));

  const filteredBusinesses = allBusinessTypes.filter(b =>
    b.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const searchTerm = focusedMentionIndex !== null ? mentions[focusedMentionIndex]?.name || '' : '';
  const filteredUserSuggestions = searchTerm.trim().length >= 1 ? userProfiles.filter(u => {
    const isSelf = u.id == currentUser?.id;
    const matches = u.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matches && !isSelf;
  }).slice(0, 5) : [];

  const handleUpdateMention = (index, field, value) => {
    const newMentions = [...mentions];
    newMentions[index][field] = value;
    if (field === 'name') newMentions[index].userId = null; // Clear ID if typed
    setMentions(newMentions);
  };

  const handleAddMention = () => setMentions([...mentions, { prefix: 'Mr.', name: '', userId: null }]);
  const handleRemoveMention = (index) => {
    if (mentions.length > 1) {
      setMentions(mentions.filter((_, i) => i !== index));
    } else {
      setMentions([{ prefix: 'Mr.', name: '', userId: null }]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(f => ({ file: f, name: f.name, url: URL.createObjectURL(f), isImage: f.type.startsWith('image/') }));
    setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };
  const removeFile = (index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleSubmit = async () => {
    if (!region) { setModalConfig({ isOpen: true, title: "Missing Region", message: "Please select a Region.", type: "alert" }); return; }
    if (!province) { setModalConfig({ isOpen: true, title: "Missing Province", message: "Please select a Province.", type: "alert" }); return; }
    if (!city) { setModalConfig({ isOpen: true, title: "Missing City", message: "Please select a City.", type: "alert" }); return; }
    if (!barangay) { setModalConfig({ isOpen: true, title: "Missing Barangay", message: "Please select a Barangay.", type: "alert" }); return; }
    if (!idea.trim()) { setModalConfig({ isOpen: true, title: "Empty Message", message: "Please enter your feedback message.", type: "alert" }); return; }
    
    // Check dynamic fields
    if (selectedBusiness?.fields) {
      for (const field of selectedBusiness.fields) {
        if (field.required && (!dynamicValues[field.label] || !dynamicValues[field.label].trim())) {
          setModalConfig({ isOpen: true, title: "Field Required", message: `Please fill out the "${field.label}" field.`, type: "alert" });
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const bizLabel = selectedBusiness?.label || "General";
      let matchedDeptId = null;
      if (selectedBusiness?.id === 'department' || bizLabel.toLowerCase().includes('department')) {
        const matched = dbDepartments.find(d => d.name.toLowerCase() === bizLabel.toLowerCase());
        if (matched) matchedDeptId = matched.id;
      }
      const base64Files = await Promise.all(attachedFiles.map(af => fileToBase64(af.file)));
      if (audioBase64) base64Files.push(audioBase64);
      await createFeedback({
        title: bizLabel,
        description: idea,
        is_anonymous: isAnonymous,
        allow_comments: allowComments,
        is_approved: true, // No longer flagging "Other" string since it's removed
        sender_id: currentUser.id,
        category_id: selectedBusiness?.id || generalCategoryId || 1,
        recipient_dept_id: matchedDeptId || null,
        region, province, city, barangay,
        mentions: mentions.filter(m => m.name.trim() !== '').map(m => ({
          employee_name: m.name,
          employee_prefix: m.prefix,
          user_id: m.userId
        })),
        product_name: productName || null,
        rating: rating || 0,
        attachments: base64Files.length > 0 ? JSON.stringify(base64Files) : null,
        custom_data: dynamicValues
      });
      deleteCurrentDraft();
      onSuccess();
    } catch (error) {
      if (error.message === "Network Error" || !navigator.onLine) {
        performSilentSave(); // Save as draft immediately
        setModalConfig({ 
            isOpen: true, 
            title: "Offline / Network Error", 
            message: "You are currently offline or having connection issues. Your progress has been saved as a draft. Please retry when back online.", 
            type: "alert" 
        });
      } else {
        const statusCode = error.response ? error.response.status : 'Network';
        const exactDetail = error.response?.data?.detail || error.message;
        setModalConfig({ isOpen: true, title: `Submission Error (${statusCode})`, message: `Failed: ${JSON.stringify(exactDetail)}`, type: "alert" });
      }
    } finally { setIsSubmitting(false); }
  };

  const productLabel = PACKAGE_TYPES.includes(selectedBusiness?.id) ? 'Room Type / Package (Optional)' : 'Thing / Item / Product (Optional)';
  const productPlaceholder = PACKAGE_TYPES.includes(selectedBusiness?.id) ? 'e.g. Deluxe Room, Day Tour Package' : 'e.g. Matte Lipstick or Study Table';

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => { if (selectedBusiness) setSelectedBusiness(null); else onBack(); }} style={styles.iconBtn} aria-label="Go back">
          <Icons.Back />
        </button>
        <h1 style={styles.headerTitle}>{initialDraft ? "Resume Draft" : "New General Report"}</h1>
        <div style={{ minWidth: 80, textAlign: 'right', fontSize: '11px', color: '#64748B' }}>
          {selectedBusiness && (isSavingDraft ? (
            <span style={{ color: '#10B981', fontWeight: 'bold' }}>Saved! ✅</span>
          ) : (
            saveTimer <= 3 && <span>Saving in {saveTimer}s...</span>
          ))}
        </div>
      </header>

      <main style={styles.mainScroll}>
        {!selectedBusiness ? (
          <>
            <div style={styles.explainBox}>
              <div style={styles.explainTopRow}>
                <span style={styles.explainTitle}>{isFilipino ? uiText.fil_title : uiText.en_title}</span>
                <button style={styles.translateBtn} onClick={() => setIsFilipino(!isFilipino)} title="Translate">
                  <Icons.Translate /> <span style={{ fontSize: '11px', marginLeft: '4px' }}>{isFilipino ? 'EN' : 'FIL'}</span>
                </button>
              </div>
              <p style={styles.explainDesc}>
                {isFilipino ? uiText.fil_desc : uiText.en_desc}
              </p>
            </div>

            <div style={styles.searchContainer}>
              <Icons.Search />
              <input type="text" placeholder="Search category type..." style={styles.searchInput}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div style={styles.grid}>
              {filteredBusinesses.map(biz => {
                const IconComp = IconRegistry[biz.icon] || IconRegistry.default;
                return (
                  <div key={biz.id} style={{ ...styles.card, flexDirection: 'column', gap: '12px', padding: '20px', minHeight: '120px' }} onClick={() => { setSelectedBusiness(biz); setSpecificName(""); setOtherSpecificName(""); setSelectedType(""); }}>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', color: '#1D6C8A' }}>
                      <IconComp width="28" height="28" />
                    </div>
                    <span style={{ ...styles.cardLabel, fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>{biz.name}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={styles.formContainer}>
            <div style={{ ...styles.selectedHeader, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
              <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', color: '#1D6C8A' }}>
                {(() => {
                  const IconComp = IconRegistry[selectedBusiness.icon] || IconRegistry.default;
                  return <IconComp width="24" height="24" />;
                })()}
              </div>
              <h2 style={{ ...styles.selectedTitle, margin: 0, fontSize: '18px' }}>{selectedBusiness.name} Feedback</h2>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Region <span style={{ color: '#EF4444' }}>*</span></label>
              <select style={styles.nativeSelect} value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">Select Region...</option>
                {regionList.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Province <span style={{ color: '#EF4444' }}>*</span></label>
              <select style={styles.nativeSelect} value={province} onChange={(e) => setProvince(e.target.value)} disabled={!region}>
                <option value="">{region ? "Select Province..." : "Select Region First"}</option>
                {provinceList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>City / Municipality <span style={{ color: '#EF4444' }}>*</span></label>
                <select style={styles.nativeSelect} value={city} onChange={(e) => setCity(e.target.value)} disabled={!province}>
                  <option value="">{province ? "Select City..." : "Select Province First"}</option>
                  {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Barangay <span style={{ color: '#EF4444' }}>*</span></label>
                <select style={styles.nativeSelect} value={barangay} onChange={(e) => setBarangay(e.target.value)} disabled={!city || isLoadingLocations}>
                  <option value="">{isLoadingLocations ? "Loading..." : city ? "Select Barangay..." : "Select City First"}</option>
                  {barangayList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {(PRODUCT_TYPES.includes(selectedBusiness.id) || PACKAGE_TYPES.includes(selectedBusiness.id)) && (
              <div style={styles.formGroup}>
                <label style={styles.label}>{productLabel}</label>
                <input type="text" placeholder={productPlaceholder} style={styles.inputBox}
                  value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
            )}

            {formLayout.show_staff && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.label}>👤 Staff Involved (Optional)</label>
                  <button 
                    type="button" 
                    onClick={handleAddMention}
                    style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none' }}
                  >
                    + Add another employee
                  </button>
                </div>

                {mentions.map((mention, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select 
                        style={{ ...styles.nativeSelect, width: '90px' }}
                        value={mention.prefix} 
                        onChange={(e) => handleUpdateMention(index, 'prefix', e.target.value)}
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mrs.">Mrs.</option>
                      </select>
                      
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input 
                          type="text" 
                          placeholder="Search name or type manually..." 
                          style={{ ...styles.inputBox, width: '100%' }}
                          value={mention.name} 
                          onChange={(e) => {
                            handleUpdateMention(index, 'name', e.target.value);
                            setFocusedMentionIndex(index);
                            setShowUserSuggestions(true);
                          }}
                          onFocus={() => {
                            setFocusedMentionIndex(index);
                            setShowUserSuggestions(true);
                          }}
                        />
                        
                        {showUserSuggestions && focusedMentionIndex === index && filteredUserSuggestions.length > 0 && (
                          <div ref={suggestionsRef} style={{ ...styles.suggestionsDropdown, left: 0 }}>
                            {filteredUserSuggestions.map(u => (
                              <div 
                                key={u.id} 
                                style={styles.suggestionItem}
                                onClick={() => {
                                  const newMentions = [...mentions];
                                  newMentions[index].name = u.name;
                                  newMentions[index].userId = u.id;
                                  setMentions(newMentions);
                                  setShowUserSuggestions(false);
                                  setFocusedMentionIndex(null);
                                }}
                              >
                                {u.avatar_url 
                                  ? <img src={u.avatar_url} alt="" style={styles.suggestionAvatar} />
                                  : <div style={styles.suggestionAvatarPlaceholder}>{u.name.charAt(0)}</div>}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={styles.suggestionName}>{u.name}</span>
                                  <span style={styles.suggestionMeta}>{u.department || 'General'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {mentions.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMention(index)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', padding: '0 4px' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* (Custom Form Fields section removed as requested) */}

            {/* — Dynamic Custom Fields (📦 Additional Info) — */}
            {formFields.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '4px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📦 Additional Info</p>
                {formFields.map((field) => {
                  const val = dynamicValues[field.label] || '';
                  const setVal = (v) => setDynamicValues(prev => ({ ...prev, [field.label]: v }));
                  const labelEl = (
                    <label style={{ ...styles.label }}>
                      {field.label} {field.is_required && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                  );
                  if (field.field_type === 'dropdown') {
                    return (
                      <div key={field.label} style={styles.formGroup}>
                        {labelEl}
                        <select style={styles.nativeSelect} value={val} onChange={e => setVal(e.target.value)}>
                          <option value="">{field.placeholder || `-- Select ${field.label} --`}</option>
                          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    );
                  }
                  if (field.field_type === 'rating') {
                    return (
                      <div key={field.label} style={styles.formGroup}>
                        {labelEl}
                        <div style={styles.starRow}>
                          {[1,2,3,4,5].map(s => (
                            <button key={s} type="button" style={styles.starBtn} onClick={() => setVal(s)}>
                              <Icons.Star filled={s <= (val || 0)} />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={field.label} style={styles.formGroup}>
                      {labelEl}
                      <input
                        type={field.field_type === 'date' ? 'date' : field.field_type === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder || `Enter ${field.label}...`}
                        style={styles.inputBox}
                        value={val}
                        onChange={e => setVal(e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>📝 Your Message <span style={{ color: '#EF4444' }}>*</span></label>
              <textarea placeholder="Describe your experience or concern..." style={styles.textArea}
                value={idea} onChange={(e) => setIdea(e.target.value)} />
              <div style={{ marginTop: '8px' }}>
                {formLayout.show_voice && allowVoiceSetting && !audioURL && !isRecording && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button type="button" style={{ ...styles.attachBtn, width: 'auto' }} onClick={startRecording}>
                      <Icons.Mic /> <span style={{ marginLeft: '6px' }}>Record & Transcribe (max 30s)</span>
                    </button>
                    <select 
                      style={{ ...styles.nativeSelect, width: 'auto', padding: '4px 8px', fontSize: '11px' }}
                      value={transcriptionLanguage}
                      onChange={(e) => setTranscriptionLanguage(e.target.value)}
                    >
                      <option value="en-US">English</option>
                      <option value="fil-PH">Filipino</option>
                    </select>
                  </div>
                )}
                {isRecording && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: '600' }}>Transcribing...</span>
                    <button type="button" style={{ ...styles.attachBtn, width: 'auto', backgroundColor: '#FEE2E2', color: '#EF4444', borderColor: '#FCA5A5' }} onClick={stopRecording}>
                      <Icons.Stop /> <span style={{ marginLeft: '6px' }}>Stop</span>
                    </button>
                  </div>
                )}
                {audioURL && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0F2F5', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E4E6EB' }}>
                    <audio src={audioURL} controls style={{ height: '32px', flex: 1 }} />
                    <button type="button" style={styles.removeFileBtn} onClick={() => { setAudioURL(null); setAudioBase64(null); }}>
                      <Icons.Trash />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {formLayout.show_attachments && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Attach Photos (Optional, max 5)</label>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }} onChange={handleFileChange} />
              <button type="button" style={styles.attachBtn} onClick={() => fileInputRef.current.click()}>
                <Icons.Paperclip /> <span style={{ marginLeft: '6px' }}>Attach File / Photo</span>
              </button>
              {attachedFiles.length > 0 && (
                <div style={styles.fileList}>
                  {attachedFiles.map((f, i) => (
                    <div key={i} style={styles.fileItem}>
                      {f.isImage ? <img src={f.url} alt={f.name} style={styles.fileThumb} /> : <div style={styles.fileIcon}><Icons.Paperclip /></div>}
                      <span style={styles.fileName}>{f.name.substring(0, 20)}{f.name.length > 20 ? '...' : ''}</span>
                      <button style={styles.removeFileBtn} onClick={() => removeFile(i)}><Icons.X /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            )}

            {formLayout.show_rating && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Rate your experience</label>
              <div style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} style={styles.starBtn} onClick={() => setRating(star)}>
                    <Icons.Star filled={star <= rating} />
                  </button>
                ))}
              </div>
              </div>
            )}

            <div style={styles.toggleRowContainer}>
              <div style={styles.itemText}>
                <p style={{ ...styles.itemTitle, color: isAnonymous ? '#10B981' : '#1E293B' }}>Anonymously</p>
                {isAnonymous && <p style={{ fontSize: '11px', color: '#65676B', margin: '4px 0 0 0' }}>Assurance: No one will know your identity except the admin.</p>}
              </div>
              <div style={{ ...styles.toggleBg, backgroundColor: isAnonymous ? '#10B981' : '#E2E8F0' }} onClick={() => setIsAnonymous(!isAnonymous)}>
                <div style={{ ...styles.toggleCircle, transform: isAnonymous ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
            </div>

            <div style={styles.toggleRowContainer}>
              <div style={styles.itemText}><p style={{ ...styles.itemTitle, color: allowComments ? '#10B981' : '#1E293B' }}>Comments</p></div>
              <div style={{ ...styles.toggleBg, backgroundColor: allowComments ? '#10B981' : '#E2E8F0' }} onClick={() => setAllowComments(!allowComments)}>
                <div style={{ ...styles.toggleCircle, transform: allowComments ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button style={{ ...styles.cancelBtn, flex: 1 }} onClick={handleCancelClick} disabled={isSubmitting}>Cancel</button>
              <button style={{ ...styles.submitBtn, flex: 1, marginTop: 0 }} onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        )}
      </main>

      {showDraftModal && (
        <div style={styles.draftOverlay}>
          <div style={styles.draftModal}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1f2a56' }}>Save to draft?</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748B', fontSize: '13px' }}>Would you like to save your progress?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={styles.draftDiscardBtn} onClick={handleDiscard}>Cancel</button>
              <button style={styles.draftSaveBtn} onClick={handleSaveDraft}>Save to Draft</button>
            </div>
          </div>
        </div>
      )}

      <CustomModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message}
        type={modalConfig.type} onConfirm={() => setModalConfig({ ...modalConfig, isOpen: false })} />
    </div>
  );
};

const styles = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F0F2F5', fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0' },
  headerTitle: { fontSize: '15px', fontWeight: 'bold', color: '#1C1E21', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  mainScroll: { flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' },
  explainBox: { backgroundColor: 'white', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E4E6EB' },
  explainTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  explainTitle: { fontSize: '20px', fontWeight: '800', color: '#1C1E21' },
  explainDesc: { fontSize: '12px', color: '#65676B', lineHeight: '1.4', margin: 0 },
  translateBtn: { background: 'none', border: '1px solid #E4E6EB', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#1C1E21' },
  searchContainer: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E4E6EB', marginBottom: '16px', gap: '8px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#1C1E21', backgroundColor: 'transparent' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' },
  card: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 10px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E4E6EB', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  iconBox: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C1E21', marginBottom: '8px' },
  iconBoxSmall: { width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C1E21' },
  cardLabel: { fontSize: '12px', fontWeight: '600', color: '#1C1E21', textAlign: 'center' },
  formContainer: { backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #E4E6EB', marginBottom: '20px' },
  selectedHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E4E6EB' },
  selectedTitle: { margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1C1E21' },
  row: { display: 'flex', gap: '8px' },
  formGroup: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#65676B', marginBottom: '5px' },
  inputBox: { width: '100%', padding: '9px 12px', backgroundColor: '#F0F2F5', border: '1px solid #E4E6EB', borderRadius: '6px', fontSize: '13px', color: '#1C1E21', outline: 'none', boxSizing: 'border-box' },
  textArea: { width: '100%', padding: '9px 12px', backgroundColor: '#F0F2F5', border: '1px solid #E4E6EB', borderRadius: '6px', fontSize: '13px', color: '#1C1E21', minHeight: '120px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  nativeSelect: { width: '100%', padding: '12px 14px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', cursor: 'pointer', transition: 'all 0.2s ease' },
  attachBtn: { display: 'flex', alignItems: 'center', padding: '8px 14px', backgroundColor: '#F0F2F5', border: '1px dashed #C7C9CC', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#65676B', fontWeight: '600' },
  fileList: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' },
  fileItem: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0F2F5', borderRadius: '6px', padding: '4px 8px', border: '1px solid #E4E6EB' },
  fileThumb: { width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' },
  fileIcon: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#65676B' },
  fileName: { fontSize: '11px', color: '#1C1E21', maxWidth: '100px' },
  removeFileBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px', display: 'flex', alignItems: 'center' },
  toggleRowContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 0', borderBottom: '1px solid #F0F2F5' },
  itemText: { flex: 1, paddingRight: '12px' },
  itemTitle: { fontSize: '13px', fontWeight: '600', margin: 0, color: '#1C1E21' },
  toggleBg: { width: '40px', height: '22px', borderRadius: '11px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.2s', padding: '2px', boxSizing: 'border-box' },
  toggleCircle: { width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.2)', transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#1877F2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' },
  cancelBtn: { width: '100%', padding: '12px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  starRow: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' },
  starBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  suggestionsDropdown: {
    position: 'absolute', top: '100%', left: '98px', right: 0,
    backgroundColor: 'white', border: '1px solid #E2E8F0',
    borderRadius: '12px', marginTop: '4px', zIndex: 1000,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    maxHeight: '240px', overflowY: 'auto'
  },
  suggestionItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 12px', cursor: 'pointer', transition: 'background-color 0.2s',
    borderBottom: '1px solid #F1F5F9'
  },
  suggestionAvatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E2E8F0' },
  suggestionAvatarPlaceholder: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1f2a56', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },
  suggestionName: { fontSize: '13px', fontWeight: '700', color: '#1E293B' },
  suggestionMeta: { fontSize: '11px', color: '#64748B' },
  draftOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  draftModal: { backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxWidth: '300px', width: '100%', textAlign: 'center' },
  draftDiscardBtn: { flex: 1, padding: '10px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', fontWeight: 'bold', cursor: 'pointer' },
  draftSaveBtn: { flex: 1, padding: '10px', backgroundColor: '#10B981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    input:focus, textarea:focus, select:focus { border-color: #1877F2 !important; }
    @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
  `;
  document.head.appendChild(style);
}

export default GeneralFeedback;