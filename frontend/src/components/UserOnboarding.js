import React, { useEffect, useMemo, useState } from "react";
import { updateUser, getEntities } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";
import { STORAGE_KEYS } from "../utils/storage";

// Removed ROLE_OPTIONS as all users are now dynamic standard users
const DRAFT_VERSION = 1;
const DRAFT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const UserOnboarding = ({ currentUser, onBack, onComplete }) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [isWelcome, setIsWelcome] = useState(false);
  const [form, setForm] = useState({
    username: currentUser?.username || "",
    role_identity: "User",
    // Split name components
    firstName: "",
    middleName: "",
    lastName: "",
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    // New Profiling Fields
    birthdate: currentUser?.birthdate || "",
    birthplace: currentUser?.birthplace || "" ,
    citizenship: currentUser?.citizenship || "Filipino",
    marital_status: currentUser?.marital_status || "Single",
    avatar_url: currentUser?.avatar_url || "",
    region: currentUser?.region || "",
    province: currentUser?.province || "",
    city: currentUser?.city || "",
    barangay: currentUser?.barangay || "",
    exact_address: currentUser?.exact_address || "",
  });
  const [regionList, setRegionList] = useState([]);
  const [allProvinces, setAllProvinces] = useState({});
  const [provinceList, setProvinceList] = useState([]);
  const [allCities, setAllCities] = useState({});
  const [cityList, setCityList] = useState([]);
  const [barangayList, setBarangayList] = useState([]);
  const { systemName } = useTerminology();
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [restored, setRestored] = useState(false);

  const getMissingFields = () => {
    const missing = [];
    if (step === 1) {
      if (!form.firstName.trim()) missing.push("Please enter your First Name");
      if (!form.lastName.trim()) missing.push("Please enter your Last Name");
      if (!form.phone.trim()) missing.push("Please enter your Contact Number");
    } else if (step === 2) {
      if (!form.region) missing.push("Please select your Region");
      if (!form.province) missing.push("Please select your Province");
      if (!form.city) missing.push("Please select your City");
      if (!form.barangay) missing.push("Please select your Barangay");
    }
    return missing;
  };

  const canNext = useMemo(() => {
    return getMissingFields().length === 0;
  }, [step, form]);

  useEffect(() => {
    // 1. Check for draft on mount
    const draftKey = `user.onboarding_draft_${currentUser?.id}`;
    const rawDraft = localStorage.getItem(draftKey);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft);
        const isNotExpired = Date.now() - (draft.savedAt || 0) < DRAFT_EXPIRY;
        
        if (draft.version === DRAFT_VERSION && isNotExpired) {
          if (draft.form) setForm(prev => ({ ...prev, ...draft.form }));
          if (draft.step) setStep(draft.step);
          setRestored(true);
          setTimeout(() => setRestored(false), 5000); // Hide after 5 sec
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch (err) {
        console.error("Failed to restore onboarding draft", err);
      }
    }

    const loadBaseLocations = async () => {
      try {
        const [regRes, provRes, cityRes] = await Promise.all([
          fetch("/assets/locations/regions.json"),
          fetch("/assets/locations/provinces.json"),
          fetch("/assets/locations/cities.json"),
        ]);
        setRegionList(await regRes.json());
        setAllProvinces(await provRes.json());
        setAllCities(await cityRes.json());
      } catch (err) {
        console.error("Failed to load locations", err);
      }
    };
    loadBaseLocations();
  }, [currentUser?.id]);

  // Removed role-based agency filtering as roles are now dynamic

  // 2. Auto-save with debounce
  useEffect(() => {
    if (saving || !currentUser?.id) return; // Don't save while finalizing
    const draftKey = `user.onboarding_draft_${currentUser?.id}`;
    
    const timer = setTimeout(() => {
      // Create a copy of the form for the draft, but EXCLUDE large base64 data URLs
      // like avatar_url which quickly exceed localStorage quota (5MB limit)
      const draftForm = { ...form };
      if (draftForm.avatar_url && draftForm.avatar_url.startsWith('data:')) {
        delete draftForm.avatar_url;
      }

      const draft = {
        version: DRAFT_VERSION,
        savedAt: Date.now(),
        step,
        form: draftForm
      };

      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch (err) {
        // QuotaExceededError or other storage failures
        console.warn("Failed to save onboarding draft to localStorage (likely quota exceeded).", err);
        
        // If we still fail even after excluding avatar, we might need to clear old drafts
        if (err.name === 'QuotaExceededError') {
          try {
            // Optional: Clear any other onboarding drafts to make room
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('user.onboarding_draft_') && key !== draftKey) {
                localStorage.removeItem(key);
              }
            });
          } catch (e) { /* ignore */ }
        }
      }
    }, 1000); // 1s debounce for stability

    return () => clearTimeout(timer);
  }, [form, step, currentUser?.id, saving]);

  useEffect(() => {
    if (form.region && allProvinces[form.region]) {
      setProvinceList(allProvinces[form.region]);
    } else {
      setProvinceList([]);
    }
  }, [form.region, allProvinces]);

  useEffect(() => {
    if (form.province && allCities[form.province]) {
      setCityList(allCities[form.province]);
    } else {
      setCityList([]);
    }
  }, [form.province, allCities]);

  useEffect(() => {
    const loadBarangays = async () => {
      if (form.city) {
        setIsLoadingLocations(true);
        try {
          const safeCity = form.city.replace(/[^a-z0-9]/gi, (x) => (" -_".includes(x) ? x : "")).trim();
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
  }, [form.city]);

  const saveOnboarding = async () => {
    setSaving(true);
    try {
      const fullName = [form.firstName, form.middleName, form.lastName].filter(n => n?.trim()).join(" ");
      const payload = {
        ...form,
        name: fullName || form.name,
        first_name: form.firstName,
        middle_name: form.middleName,
        last_name: form.lastName,
        onboarding_completed: true,
      };
      const updatedFromApi = await updateUser(currentUser.id, payload);
      const updated = {
        ...currentUser,
        ...payload,
        ...(updatedFromApi || {}),
        onboarding_completed: true,
      };

      // Safely set items to avoid QuotaExceededError from large avatars
      try {
        localStorage.setItem(STORAGE_KEYS.USER_VIEW, "home");
        localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(updated));
      } catch (storageErr) {
        if (storageErr.name === 'QuotaExceededError') {
          console.warn("Quota exceeded while saving user. Stripping avatar for local session.");
          const stripped = { ...updated };
          delete stripped.avatar_url;
          localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(stripped));
        } else {
          throw storageErr;
        }
      }
      
      localStorage.removeItem(`user.onboarding_draft_${currentUser.id}`);
      return updated;
    } catch (err) {
      console.error("Save onboarding failed", err);
      const fallbackUser = {
        ...currentUser,
        ...form,
        onboarding_completed: true,
      };
      
      try {
        localStorage.setItem(STORAGE_KEYS.USER_VIEW, "home");
        localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(fallbackUser));
      } catch (storageErr) {
        const stripped = { ...fallbackUser };
        delete stripped.avatar_url;
        localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(stripped));
      }
      
      return fallbackUser;
    } finally {
      setSaving(false);
    }
  };

  const finalizeOnboarding = async () => {
    await saveOnboarding();
    setIsWelcome(true);
  };

  const handlePhotoUpload = (event, key) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((p) => ({ ...p, [key]: result }));
    };
    reader.readAsDataURL(file);
  };

  if (!currentUser) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {!isWelcome ? (
          <>
            <div style={styles.header}>
                <h2 style={styles.title}>Complete Your Profile</h2>
                <p style={styles.sub}>{step === 1 ? "Basic Info" : "Community & Location"}</p>
            </div>

            <div style={styles.body}>
            {restored && (
              <div style={styles.restoredDraft}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8 }}>
                   <path d="M23 12a11 11 0 1 1-2.9-7.3L20 6V1h-5" />
                 </svg>
                 Your previous progress has been restored.
              </div>
            )}
            <div style={styles.progress}>
              <div style={{ ...styles.progressFill, width: `${(step / 2) * 100}%` }} />
            </div>

            {step === 1 && (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <p style={styles.stepTitle}>Profile Setup</p>

                {/* Identity Section */}
                <div style={{ marginBottom: 24 }}>
                  <p style={styles.sectionLabel}>Identity</p>
                  <div style={styles.inputGroup}>
                    <div style={{ flex: 1 }}>
                      <p style={styles.fieldLabel}>First Name</p>
                      <input style={styles.input} placeholder="e.g. Juan" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.fieldLabel}>Middle Name (Optional)</p>
                      <input style={styles.input} placeholder="e.g. Santos" value={form.middleName} onChange={(e) => setForm((p) => ({ ...p, middleName: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ ...styles.inputGroupFull, marginTop: 12 }}>
                    <p style={styles.fieldLabel}>Last Name</p>
                    <input style={styles.input} placeholder="e.g. Dela Cruz" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                  </div>
                </div>

                {/* Personal Information Section */}
                <div style={styles.optionalBox}>
                  <p style={styles.sectionLabel}>Personal Information</p>
                  <div style={styles.inputGroupFull}>
                    <p style={styles.fieldLabel}>Date of Birth</p>
                    <input type="date" style={styles.input} value={form.birthdate} onChange={(e) => setForm((p) => ({ ...p, birthdate: e.target.value }))} />
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <div style={{ flex: 1 }}>
                      <p style={styles.fieldLabel}>Citizenship</p>
                      <select style={styles.input} value={form.citizenship} onChange={(e) => setForm((p) => ({ ...p, citizenship: e.target.value }))}>
                        <option value="Filipino">Filipino</option>
                        <option value="Dual Citizen">Dual Citizen</option>
                        <option value="Foreign National">Foreign National</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.fieldLabel}>Marital Status</p>
                      <select style={styles.input} value={form.marital_status} onChange={(e) => setForm((p) => ({ ...p, marital_status: e.target.value }))}>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Live-in">Live-in</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div style={{ marginBottom: 12 }}>
                  <p style={styles.sectionLabel}>Contact</p>
                  <div style={styles.inputGroupFull}>
                     <p style={styles.fieldLabel}>Contact Number</p>
                     <input style={styles.input} placeholder="+63 9xx xxx xxxx" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <p style={styles.stepTitle}>Step 2: Location & Finalization</p>
                
                <div style={styles.optionalBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p style={styles.sectionLabel}>Profile Picture</p>
                    <span style={styles.badgeOptional}>Optional</span>
                  </div>
                  <div style={styles.uploadBox}>
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, "avatar_url")} style={{ fontSize: 12 }} />
                      {form.avatar_url && (
                        <img src={form.avatar_url} alt="profile" style={styles.avatarPreview} />
                      )}
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <p style={styles.sectionLabel}>Village / Community Location</p>
                  <div style={styles.locationGrid}>
                    <div>
                      <p style={styles.fieldLabel}>Region</p>
                      <select style={styles.input} value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value, province: "", city: "", barangay: "" }))}>
                        <option value="">Select Region</option>
                        {regionList.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <p style={styles.fieldLabel}>Province</p>
                      <select style={styles.input} value={form.province} onChange={(e) => setForm((p) => ({ ...p, province: e.target.value, city: "", barangay: "" }))} disabled={!form.region}>
                        <option value="">Select Province</option>
                        {provinceList.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ ...styles.locationGrid, marginTop: 12 }}>
                    <div>
                      <p style={styles.fieldLabel}>City / Municipality</p>
                      <select style={styles.input} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value, barangay: "" }))} disabled={!form.province}>
                        <option value="">Select City</option>
                        {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <p style={styles.fieldLabel}>Barangay</p>
                      <select style={styles.input} value={form.barangay} onChange={(e) => setForm((p) => ({ ...p, barangay: e.target.value }))} disabled={!form.city || isLoadingLocations}>
                        <option value="">{isLoadingLocations ? "..." : "Select Barangay"}</option>
                        {barangayList.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <p style={styles.fieldLabel}>Lot / Block / House No. / Street</p>
                    <input style={styles.input} placeholder="Exact residence address" value={form.exact_address} onChange={(e) => setForm((p) => ({ ...p, exact_address: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            <div style={styles.actions}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                {showErrors && !canNext && (
                  <p style={styles.warning}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 6 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                     </svg>
                     {getMissingFields()[0]}
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <button 
                    type="button"
                    onClick={() => {
                       if (step === 1) onBack();
                       else setStep(1);
                       setShowErrors(false);
                    }} 
                    disabled={saving} 
                    style={styles.secondaryBtn}
                  >
                    Back
                  </button>
                  {step === 1 ? (
                    <button 
                      type="button"
                      onClick={() => {
                        if (canNext) {
                          setStep(2);
                          setShowErrors(false);
                        } else setShowErrors(true);
                      }} 
                      style={styles.primaryBtn}
                    >
                      Next Step
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => {
                        if (canNext) finalizeOnboarding();
                        else setShowErrors(true);
                      }} 
                      disabled={saving} 
                      style={styles.primaryBtn}
                    >
                      {saving ? "Creating Profile..." : "Complete Setup"}
                    </button>
                  )}
                </div>
              </div>
            </div>
            </div>
          </>
        ) : (
          <div style={styles.welcomeWrap}>
             <div style={styles.welcomeTick}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                   <polyline points="20 6 9 17 4 12" />
                </svg>
             </div>
             <h2 style={styles.welcomeTitle}>Welcome aboard, {form.firstName} {form.lastName}!</h2>
             <p style={styles.welcomeSub}>Your professional workspace is ready. Let's start making an impact together.</p>
             <button 
               style={styles.welcomeBtn}
               onClick={() => {
                   // The saveOnboarding already updated localStorage, but we ensure final state is pushed
                   const updated = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_CURRENT));
                   onComplete(updated);
               }}
             >
               Go to Dashboard
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrap: { 
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", 
    background: `
      radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.05) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(34, 197, 94, 0.05) 0px, transparent 50%),
      #F8FAFC
    `,
    padding: 20 
  },
  card: { 
    width: "100%", maxWidth: 680, 
    background: "rgba(255, 255, 255, 0.8)", 
    backdropFilter: 'blur(20px)',
    border: "1px solid rgba(255, 255, 255, 0.5)", 
    borderRadius: 32, padding: 0, 
    boxShadow: "0 40px 80px -15px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
    overflow: "hidden"
  },
  header: {
    padding: "40px 32px 24px", 
    textAlign: "center"
  },
  body: { padding: "0 40px 40px" },
  title: { margin: 0, color: "#0F172A", fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em" },
  sub: { marginTop: 8, color: "var(--primary-color)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px" },
  warning: { 
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(239, 68, 68, 0.05)", color: "#EF4444", padding: "14px 20px", borderRadius: "16px", 
    fontSize: "13px", fontWeight: "700", border: "1px solid rgba(239, 68, 68, 0.1)", margin: "10px 0 24px" 
  },
  restoredDraft: {
    display: 'flex', alignItems: 'center', background: "rgba(var(--primary-rgb), 0.05)", color: "var(--primary-color)", 
    padding: "12px 20px", borderRadius: "16px", fontSize: "12px", fontWeight: "700", 
    border: "1px solid rgba(var(--primary-rgb), 0.1)", marginBottom: 24, animation: 'fadeIn 0.3s ease-out'
  },
  progress: { height: 8, background: "rgba(0,0,0,0.03)", borderRadius: 99, overflow: "hidden", margin: "0 0 40px" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, var(--primary-color), #6366F1)", boxShadow: "0 0 12px rgba(var(--primary-rgb), 0.3)", transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)" },
  stepTitle: { fontWeight: 900, fontSize: 14, color: "#0F172A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24, display: 'block' },
  inputGroup: { display: "flex", gap: 20, marginTop: 20 },
  inputGroupFull: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 },
  fieldLabel: { fontSize: '10px', color: "#94A3B8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", paddingLeft: 4, marginBottom: 4 },
  sectionLabel: { fontSize: 15, color: "#0F172A", fontWeight: 900, marginBottom: 20 },
  input: { 
    width: "100%", padding: "14px 18px", 
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: "1.5px solid rgba(0,0,0,0.05)", 
    borderRadius: 16, fontSize: 15, boxSizing: "border-box", outline: "none",
    transition: "all 0.2s",
    color: "#1E293B", fontWeight: 600,
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  optionalBox: {
    background: "rgba(0,0,0,0.02)", padding: 24, borderRadius: 24, border: "1px solid rgba(0,0,0,0.03)", marginBottom: 24
  },
  badgeOptional: {
    padding: "6px 12px", background: "rgba(0,0,0,0.05)", color: "#64748B", borderRadius: "20px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: '0.5px'
  },
  locationGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  uploadBox: { 
    display: "flex", alignItems: "center", justifyContent: "space-between", 
    padding: "16px", border: "2px dashed rgba(0,0,0,0.1)", borderRadius: 16, background: "rgba(255,255,255,0.5)" 
  },
  avatarPreview: { width: 56, height: 56, objectFit: "cover", borderRadius: "18px", border: "2px solid #fff", boxShadow: "0 8px 16px rgba(0,0,0,0.1)" },
  actions: { marginTop: 40, display: "flex", justifyContent: "space-between", gap: 16 },
  primaryBtn: { 
    flex: 2, background: "linear-gradient(135deg, var(--primary-color), #4F46E5)", color: "#fff", border: "none", borderRadius: 16, 
    padding: "16px 24px", cursor: "pointer", fontWeight: 800, fontSize: 15,
    boxShadow: "0 12px 24px rgba(var(--primary-rgb), 0.25)", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
  },
  secondaryBtn: { 
    flex: 1, background: "rgba(255, 255, 255, 0.8)", color: "#64748B", border: "1.5px solid rgba(0,0,0,0.05)", 
    borderRadius: 16, padding: "16px 24px", cursor: "pointer", fontWeight: 700, fontSize: 15, transition: 'all 0.2s'
  },
  // Welcome Screen
  welcomeWrap: { padding: "80px 40px", textAlign: "center", animation: "fadeIn 0.8s ease-out" },
  welcomeTick: { 
    width: 96, height: 96, background: "linear-gradient(135deg, #10B981, #059669)", borderRadius: "32px", 
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 40px",
    boxShadow: "0 24px 48px rgba(16, 185, 129, 0.3)",
    transform: 'rotate(-5deg)'
  },
  welcomeTitle: { fontSize: 28, fontWeight: 900, color: "#0F172A", marginBottom: 16, letterSpacing: "-0.04em" },
  welcomeSub: { fontSize: 15, color: "#64748B", fontWeight: 500, lineHeight: 1.6, maxWidth: 380, margin: "0 auto 40px" },
  welcomeBtn: { 
    background: "linear-gradient(135deg, var(--primary-color), #4F46E5)", color: "#fff", border: "none", borderRadius: 18, 
    padding: "18px 48px", cursor: "pointer", fontWeight: 800, fontSize: 15,
    boxShadow: "0 16px 32px rgba(var(--primary-rgb), 0.3)", transition: 'all 0.3s'
  }
};

export default UserOnboarding;
