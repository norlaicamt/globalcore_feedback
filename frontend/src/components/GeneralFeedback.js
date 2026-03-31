import React, { useState, useEffect, useRef } from "react";
import { createFeedback, getCategories, getDepartments, getAdminSettings } from "../services/api";
import CustomModal from "./CustomModal";

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

const businessTypes = [
  { id: 'department', label: 'Department / Agency', icon: <Icons.Building /> },
  { id: 'food', label: 'Food / Restaurant', icon: <Icons.Food /> },
  { id: 'cosmetics', label: 'Cosmetics Shop', icon: <Icons.Cosmetics /> },
  { id: 'furniture', label: 'Furniture Shop', icon: <Icons.Furniture /> },
  { id: 'car', label: 'Car / Transport', icon: <Icons.Car /> },
  { id: 'resort', label: 'Resort / Pool', icon: <Icons.Resort /> },
  { id: 'hotel', label: 'Hotel / Lodging', icon: <Icons.Hotel /> },
];

const mockSuggestions = {
  department: ["HR Department", "IT Department", "Finance", "Marketing", "Operations", "Customer Service", "Other"],
  food: ["Jollibee", "McDonald's", "KFC", "Chowking", "Mang Inasal", "Greenwich", "Burger King", "Wendy's", "Shakey's", "Max's Restaurant", "Other"],
  cosmetics: ["Watsons", "Sephora", "MAC Cosmetics", "Maybelline", "L'Oreal", "The Face Shop", "Nature Republic", "Innisfree", "Kiehl's", "Other"],
  furniture: ["IKEA", "Mandaue Foam", "Our Home", "SB Furniture", "Muji", "Crate & Barrel", "Ashley Furniture", "Ethan Allen", "Other"],
  car: ["Bus", "MRT", "LRT", "Toyota", "Honda", "Mitsubishi", "Nissan", "Ford", "Grab", "Angkas", "Joyride", "LTO", "LTFRB", "Hyundai", "Isuzu", "Other"],
  resort: ["Splash Island", "Nuvali", "Zoomanity Group", "Star City", "Club Punta Fuego", "Caleruega", "The Lake Hotel", "Mt. Purro Nature Reserve", "Other"],
  hotel: ["Marriott Manila", "Shangri-La BGC", "Seda Hotels", "Hilton Manila", "Grand Hyatt Manila", "City Garden Hotel", "Microtel", "Go Hotels", "Red Planet Hotels", "Other"],
};

const LOCATIONS = {
  "NCR": {
    "Manila": ["Ermita", "Malate", "Intramuros", "Binondo", "Quiapo", "Sampaloc", "Tondo"],
    "Quezon City": ["Cubao", "Diliman", "Novaliches", "Project 4", "Project 8", "Fairview", "Commonwealth"],
    "Makati": ["Poblacion", "Bel-Air", "San Lorenzo", "Urdaneta", "Magallanes", "Guadalupe Nuevo"],
    "Taguig": ["Fort Bonifacio", "Pinagsama", "Signal Village", "Western Bicutan", "Ususan"],
    "Paranaque": ["BF Homes", "Baclaran", "Don Bosco", "Moonwalk", "San Dionisio", "San Isidro"],
    "Pasig": ["San Antonio", "Ugong", "Kapitolyo", "Rosario", "Manggahan", "Bambang"]
  },
  "Region IV-A (CALABARZON)": {
    "Antipolo": ["San Roque", "San Jose", "Mayamot", "Cupang", "Dela Paz"],
    "Dasmarinas": ["Salawag", "Paliparan", "Salitran", "Burol", "San Agustin"],
    "Santa Rosa": ["Balibago", "Macabling", "Dita", "Don Jose", "Tagapo"]
  },
  "Region VII (Central Visayas)": {
    "Cebu City": ["Lahug", "Mabolo", "Capitol Site", "Guadalupe", "Talamban"],
    "Mandaue": ["Banilad", "Cabancalan", "Centro", "Tipolo", "Subangdaku"]
  }
};

const PRODUCT_TYPES = ['furniture', 'cosmetics'];
const PACKAGE_TYPES = ['resort', 'hotel'];

const GeneralFeedback = ({ currentUser, onBack, onSuccess, onSaveDraft, initialDraft }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isFilipino, setIsFilipino] = useState(false);

  const [specificName, setSpecificName] = useState("");
  const [otherSpecificName, setOtherSpecificName] = useState("");

  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  const [availableBarangays, setAvailableBarangays] = useState([]);

  const [productName, setProductName] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [idea, setIdea] = useState("");
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalCategoryId, setGeneralCategoryId] = useState(null);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "alert" });

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Dynamic values for category-specific fields
  const [dynamicValues, setDynamicValues] = useState({});

  const handleCancelClick = () => {
    if (idea.trim() || specificName || region) setShowDraftModal(true);
    else onBack();
  };

  const performSilentSave = () => {
    const finalName = specificName === "Other" ? otherSpecificName : specificName;
    const titleStr = finalName ? `${selectedBusiness?.label || 'General'}: ${finalName}` : "Untitled Draft";
    const newDraft = {
      id: initialDraft?.id || Date.now().toString(),
      title: titleStr, description: idea, created_at: new Date().toISOString(),
      business_id: selectedBusiness?.id, specificName, otherSpecificName,
      region, city, barangay, productName, employeeName, rating, isAnonymous, allowComments
    };
    const existing = JSON.parse(localStorage.getItem(`drafts_${currentUser?.id}`) || "[]");
    const updated = initialDraft
      ? existing.map(d => d.id === initialDraft.id ? newDraft : d)
      : [newDraft, ...existing];
    localStorage.setItem(`drafts_${currentUser?.id}`, JSON.stringify(updated));
  };

  const handleSaveDraft = () => {
    performSilentSave();
    setShowDraftModal(false);
    if (onSaveDraft) onSaveDraft(); else onBack();
  };

  const [allowVoiceSetting, setAllowVoiceSetting] = useState(true);

  useEffect(() => {
    const fetchEverything = async () => {
      try {
        const [settings, categories, departments] = await Promise.allSettled([
          getAdminSettings(),
          getCategories(),
          getDepartments()
        ]);

        if (settings.status === 'fulfilled') {
          const found = settings.value.find(s => s.key === 'allow_voice');
          if (found) setAllowVoiceSetting(found.value === 'true');
        }

        if (categories.status === 'fulfilled') {
          setDbCategories(categories.value);
          const genCat = categories.value.find(c => c.name.toLowerCase() === 'general') || categories.value[0];
          if (genCat) setGeneralCategoryId(genCat.id);
        }

        if (departments.status === 'fulfilled') {
          setDbDepartments(departments.value);
          const merged = [...new Set([...departments.value.map(d => d.name), ...mockSuggestions.department.filter(x => x !== 'Other')])];
          mockSuggestions.department = [...merged, "Other"];
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchEverything();
  }, []);

  useEffect(() => {
    if (!idea.trim() && !specificName && !region) return;
    const interval = setInterval(() => {
      setIsSavingDraft(true);
      performSilentSave();
      setTimeout(() => setIsSavingDraft(false), 2000);
    }, 10000);
    return () => clearInterval(interval);
  }, [idea, specificName, region, city, barangay, selectedBusiness, rating, allowComments, isAnonymous]);

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
      setIsRecording(true);
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") stopRecording();
      }, 30000);
    } catch (err) {
      setModalConfig({ isOpen: true, title: "Microphone Error", message: "Could not access microphone.", type: "alert" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const handleDiscard = () => { setShowDraftModal(false); onBack(); };


  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.business_id) {
        const biz = businessTypes.find(b => b.id === initialDraft.business_id);
        if (biz) setSelectedBusiness(biz);
      }
      if (initialDraft.specificName) setSpecificName(initialDraft.specificName);
      if (initialDraft.otherSpecificName) setOtherSpecificName(initialDraft.otherSpecificName);
      if (initialDraft.region) setRegion(initialDraft.region);
      if (initialDraft.city) setCity(initialDraft.city);
      if (initialDraft.barangay) setBarangay(initialDraft.barangay);
      if (initialDraft.productName) setProductName(initialDraft.productName);
      if (initialDraft.employeeName) setEmployeeName(initialDraft.employeeName);
      if (initialDraft.description) setIdea(initialDraft.description);
      if (initialDraft.rating) setRating(initialDraft.rating);
      if (initialDraft.isAnonymous !== undefined) setIsAnonymous(initialDraft.isAnonymous);
      if (initialDraft.allowComments !== undefined) setAllowComments(initialDraft.allowComments);
    }
  }, [initialDraft]);

  useEffect(() => {
    if (region && LOCATIONS[region]) setAvailableCities(Object.keys(LOCATIONS[region]));
    else setAvailableCities([]);
    setCity(""); setBarangay(""); setAvailableBarangays([]);
  }, [region]);

  useEffect(() => {
    if (region && city && LOCATIONS[region]?.[city]) setAvailableBarangays(LOCATIONS[region][city]);
    else setAvailableBarangays([]);
    setBarangay("");
  }, [city, region]);

  const allBusinessTypes = dbCategories.map(cat => ({
    id: cat.id,
    label: cat.name,
    fields: cat.fields || [],
    description: cat.description,
    icon: businessTypes.find(bt => cat.name.toLowerCase().includes(bt.label.toLowerCase().split(' / ')[0]))?.icon || <Icons.Building />
  }));

  const filteredBusinesses = allBusinessTypes.filter(b =>
    b.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    let finalName = specificName === "Other" ? otherSpecificName : specificName;
    if (!finalName || !finalName.trim()) {
      setModalConfig({ isOpen: true, title: "Selection Required", message: `Please select or specify the ${selectedBusiness?.label || "establishment"}.`, type: "alert" }); return;
    }
    if (!region) { setModalConfig({ isOpen: true, title: "Missing Region", message: "Please select a Region.", type: "alert" }); return; }
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
        const matched = dbDepartments.find(d => d.name.toLowerCase() === finalName.toLowerCase());
        if (matched) matchedDeptId = matched.id;
      }
      const base64Files = await Promise.all(attachedFiles.map(af => fileToBase64(af.file)));
      if (audioBase64) base64Files.push(audioBase64);
      await createFeedback({
        title: `${bizLabel}: ${finalName}`,
        description: idea,
        is_anonymous: isAnonymous,
        allow_comments: allowComments,
        is_approved: specificName !== "Other", // Flag for moderation if "Other"
        sender_id: currentUser.id,
        category_id: selectedBusiness?.id || generalCategoryId || 1,
        recipient_dept_id: matchedDeptId || null,
        rating: rating > 0 ? rating : null,
        region, city, barangay,
        employee_name: employeeName || null,
        product_name: productName || null,
        attachments: base64Files.length > 0 ? JSON.stringify(base64Files) : null,
        custom_data: dynamicValues
      });
      onSuccess();
    } catch (error) {
      const statusCode = error.response ? error.response.status : 'Network';
      const exactDetail = error.response?.data?.detail || error.message;
      setModalConfig({ isOpen: true, title: `Submission Error (${statusCode})`, message: `Failed: ${JSON.stringify(exactDetail)}`, type: "alert" });
    } finally { setIsSubmitting(false); }
  };

  const productLabel = PACKAGE_TYPES.includes(selectedBusiness?.id) ? 'Room Type / Package (Optional)' : 'Thing / Item / Product (Optional)';
  const productPlaceholder = PACKAGE_TYPES.includes(selectedBusiness?.id) ? 'e.g. Deluxe Room, Day Tour Package' : 'e.g. Matte Lipstick or Study Table';

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => { if (selectedBusiness) setSelectedBusiness(null); else onBack(); }} style={styles.iconBtn}>
          <Icons.Back />
        </button>
        <h1 style={styles.headerTitle}>New General Report</h1>
        <div style={{ width: 24 }} />
      </header>

      <main style={styles.mainScroll}>
        {!selectedBusiness ? (
          <>
            <div style={styles.explainBox}>
              <div style={styles.explainTopRow}>
                <span style={styles.explainTitle}>Select the establishment category</span>
                <button style={styles.translateBtn} onClick={() => setIsFilipino(!isFilipino)} title="Translate">
                  <Icons.Translate /> <span style={{ fontSize: '11px', marginLeft: '4px' }}>{isFilipino ? 'EN' : 'FIL'}</span>
                </button>
              </div>
              <p style={styles.explainDesc}>
                {isFilipino
                  ? "Ang pangkalahatang puna ay para sa pagbabahagi ng mga ideya o reklamo tungkol sa mga serbisyo, opisina, restaurant, at iba pang negosyo. Piliin ang kategorya sa ibaba."
                  : "General feedback is for sharing thoughts, complaints, or suggestions about any service, office, restaurant, or business. Select the category below."}
              </p>
            </div>

            <div style={styles.searchContainer}>
              <Icons.Search />
              <input type="text" placeholder="Search category type..." style={styles.searchInput}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div style={styles.grid}>
              {filteredBusinesses.map(biz => (
                <div key={biz.id} style={styles.card} onClick={() => { setSelectedBusiness(biz); setSpecificName(""); setOtherSpecificName(""); }}>
                  <div style={styles.iconBox}>{biz.icon}</div>
                  <span style={styles.cardLabel}>{biz.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={styles.formContainer}>
            <div style={styles.selectedHeader}>
              <div style={styles.iconBoxSmall}>{selectedBusiness.icon}</div>
              <h2 style={styles.selectedTitle}>{selectedBusiness.label} Feedback</h2>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Select {selectedBusiness.label.toLowerCase().includes('department') ? 'Department' : 'Establishment'} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select style={styles.nativeSelect} value={specificName} onChange={(e) => setSpecificName(e.target.value)}>
                <option value="">-- Choose One --</option>
                {(() => {
                  try {
                    const parsed = JSON.parse(selectedBusiness.description || "[]");
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      return [...parsed, "Other"].map(name => <option key={name} value={name}>{name}</option>);
                    }
                  } catch(e) {}
                  // Fallback to mock suggestions or just Other
                  const fallback = mockSuggestions[selectedBusiness.id] || [];
                  return [...fallback, "Other"].map(name => (
                    <option key={name} value={name}>{name}</option>
                  ));
                })()}
              </select>
            </div>

            {specificName === "Other" && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Please Specify <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="text" placeholder="Type the exact name..." style={styles.inputBox}
                  value={otherSpecificName} onChange={(e) => setOtherSpecificName(e.target.value)} />
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Region <span style={{ color: '#EF4444' }}>*</span></label>
              <select style={styles.nativeSelect} value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">Select Region...</option>
                {Object.keys(LOCATIONS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>City / Municipality <span style={{ color: '#EF4444' }}>*</span></label>
                <select style={styles.nativeSelect} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Select City...</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ ...styles.formGroup, flex: 1 }}>
                <label style={styles.label}>Barangay <span style={{ color: '#EF4444' }}>*</span></label>
                <select style={styles.nativeSelect} value={barangay} onChange={(e) => setBarangay(e.target.value)}>
                  <option value="">Select Barangay...</option>
                  {availableBarangays.map(b => <option key={b} value={b}>{b}</option>)}
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

            <div style={styles.formGroup}>
              <label style={styles.label}>Employee Name (Optional)</label>
              <input type="text" placeholder="Name of the person who assisted you" style={styles.inputBox}
                value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
            </div>

            {/* (Custom Form Fields section removed as requested) */}

            <div style={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5px' }}>
                <label style={{ ...styles.label, marginBottom: 0 }}>Your Message <span style={{ color: '#EF4444' }}>*</span></label>
                {isSavingDraft && <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Saving draft...</span>}
              </div>
              <textarea placeholder="Tell us about your experience..." style={styles.textArea}
                value={idea} onChange={(e) => setIdea(e.target.value)} />
              <div style={{ marginTop: '8px' }}>
                {allowVoiceSetting && !audioURL && !isRecording && (
                  <button type="button" style={{ ...styles.attachBtn, width: 'auto' }} onClick={startRecording}>
                    <Icons.Mic /> <span style={{ marginLeft: '6px' }}>Record Voice Note (max 30s)</span>
                  </button>
                )}
                {isRecording && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: '600' }}>Recording...</span>
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
  mainScroll: { flex: 1, overflowY: 'auto', padding: '16px' },
  explainBox: { backgroundColor: 'white', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E4E6EB' },
  explainTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  explainTitle: { fontSize: '14px', fontWeight: '600', color: '#1C1E21' },
  explainDesc: { fontSize: '12px', color: '#65676B', lineHeight: '1.4', margin: 0 },
  translateBtn: { background: 'none', border: '1px solid #E4E6EB', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#1C1E21' },
  searchContainer: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E4E6EB', marginBottom: '16px', gap: '8px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#1C1E21', backgroundColor: 'transparent' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' },
  card: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 10px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E4E6EB', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  iconBox: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C1E21', marginBottom: '8px' },
  iconBoxSmall: { width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#E4E6EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C1E21' },
  cardLabel: { fontSize: '12px', fontWeight: '600', color: '#1C1E21', textAlign: 'center' },
  formContainer: { backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #E4E6EB' },
  selectedHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E4E6EB' },
  selectedTitle: { margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1C1E21' },
  row: { display: 'flex', gap: '8px' },
  formGroup: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#65676B', marginBottom: '5px' },
  inputBox: { width: '100%', padding: '9px 12px', backgroundColor: '#F0F2F5', border: '1px solid #E4E6EB', borderRadius: '6px', fontSize: '13px', color: '#1C1E21', outline: 'none', boxSizing: 'border-box' },
  textArea: { width: '100%', padding: '9px 12px', backgroundColor: '#F0F2F5', border: '1px solid #E4E6EB', borderRadius: '6px', fontSize: '13px', color: '#1C1E21', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  nativeSelect: { width: '100%', padding: '9px 12px', backgroundColor: '#F0F2F5', border: '1px solid #E4E6EB', borderRadius: '6px', fontSize: '13px', color: '#1C1E21', outline: 'none', boxSizing: 'border-box' },
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