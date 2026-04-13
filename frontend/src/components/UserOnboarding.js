import React, { useEffect, useMemo, useState } from "react";
import { updateUser, getEntities } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";

const ROLE_OPTIONS = ["Student", "Visitor", "Employee", "Parent", "Staff", "Others"];
const DRAFT_VERSION = 1;
const DRAFT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const UserOnboarding = ({ currentUser, onBack, onComplete }) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [restored, setRestored] = useState(false);
  const [form, setForm] = useState({
    username: currentUser?.username || "",
    role_identity: currentUser?.role_identity || "",
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    school: currentUser?.school || "",
    company_name: currentUser?.company_name || "",
    position_title: currentUser?.position_title || "",
    program: currentUser?.program || "",
    birthdate: currentUser?.birthdate || "",
    birthplace: currentUser?.birthplace || "" ,
    avatar_url: currentUser?.avatar_url || "",
    id_photo_url: currentUser?.id_photo_url || "",
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
  const [agencyList, setAgencyList] = useState([]);
  const { systemName } = useTerminology();
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const getMissingFields = () => {
    const missing = [];
    if (step === 1) {
      if (!form.role_identity) missing.push("Role Selection");
      if (!form.id_photo_url) missing.push("ID Photo");
    } else if (step === 2) {
      if (!form.username) missing.push("Username");
      if (!form.name) missing.push("Full Name");
      if (!form.phone) missing.push("Contact Number");
      if (!form.avatar_url) missing.push("Profile Photo");
      if (!form.birthdate) missing.push("Birthdate");
      if (!form.birthplace) missing.push("Birthplace");
      if (form.role_identity === "Student" && !form.school) missing.push("School Name");
      if (form.role_identity === "Employee") {
        if (!form.company_name) missing.push("Company Name");
        if (!form.position_title) missing.push("Position Title");
        if (!form.program) missing.push("Program/Office");
      }
    } else if (step === 3) {
      if (!form.region) missing.push("Region");
      if (!form.province) missing.push("Province");
      if (!form.city) missing.push("City");
      if (!form.barangay) missing.push("Barangay");
    }
    return missing;
  };

  const canNext = useMemo(() => {
    return getMissingFields().length === 0;
  }, [step, form]);

  useEffect(() => {
    // 1. Check for draft on mount
    const draftKey = `onboarding_draft_${currentUser?.id}`;
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
    getEntities().then(cats => setAgencyList((cats || []).map(c => c.name).filter(Boolean)));
  }, [currentUser?.id]);

  // Sync company_name with systemName (from TerminologyContext)
  useEffect(() => {
    if (form.role_identity === "Employee" && systemName && form.company_name !== systemName) {
      setForm(prev => ({ ...prev, company_name: systemName }));
    }
  }, [systemName, form.role_identity]);

  // 2. Auto-save with debounce
  useEffect(() => {
    if (saving) return; // Don't save while finalizing
    const draftKey = `onboarding_draft_${currentUser?.id}`;
    
    const timer = setTimeout(() => {
      const draft = {
        version: DRAFT_VERSION,
        savedAt: Date.now(),
        step,
        form
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
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
      const payload = {
        ...form,
        onboarding_completed: true,
      };
      const updatedFromApi = await updateUser(currentUser.id, payload);
      const updated = {
        ...currentUser,
        ...payload,
        ...(updatedFromApi || {}),
        onboarding_completed: true,
      };
      localStorage.setItem("userView", "home");
      localStorage.setItem("currentUser", JSON.stringify(updated));
      localStorage.removeItem(`onboarding_draft_${currentUser.id}`);
      onComplete(updated);
    } catch (err) {
      // Keep UX unblocked: if backend response shape/version is behind,
      // still proceed locally to dashboard after form completion.
      const fallbackUser = {
        ...currentUser,
        ...form,
        onboarding_completed: true,
      };
      localStorage.setItem("userView", "home");
      localStorage.setItem("currentUser", JSON.stringify(fallbackUser));
      onComplete(fallbackUser);
    } finally {
      setSaving(false);
    }
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
        <div style={styles.header}>
            <h2 style={styles.title}>Complete Your Profile</h2>
            <p style={styles.sub}>Step {step} of 3</p>
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
          <div style={{ ...styles.progressFill, width: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <div>
            <p style={styles.stepTitle}>Step 1: Role Identity</p>
            <div style={styles.roleGrid}>
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  onClick={() => setForm((p) => ({
                    ...p,
                    role_identity: role,
                    school: role === "Student" ? p.school : "",
                    company_name: role === "Employee" ? systemName : "",
                    position_title: role === "Employee" ? p.position_title : "",
                  }))}
                  style={{
                    ...styles.roleBtn,
                    borderColor: form.role_identity === role ? "#2563EB" : "#E2E8F0",
                    background: form.role_identity === role ? "#EFF6FF" : "#fff",
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#475569", fontWeight: 600 }}>
                Upload Photo of ID (required)
              </p>
              <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, "id_photo_url")} />
              {form.id_photo_url && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={form.id_photo_url}
                    alt="Uploaded ID"
                    style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 10, border: "1px solid #CBD5E1" }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            <p style={styles.stepTitle}>Step 2: Basic Profile</p>
            <div style={styles.inputGroup}>
                <input style={styles.input} placeholder="Full Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                <input style={styles.input} placeholder="Contact Number" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            
            <div style={styles.inputGroup}>
                <div style={{ flex: 1 }}>
                     <p style={styles.fieldLabel}>Date of Birth</p>
                     <input type="date" style={styles.input} value={form.birthdate} onChange={(e) => setForm((p) => ({ ...p, birthdate: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                     <p style={styles.fieldLabel}>Place of Birth</p>
                     <input style={styles.input} placeholder="City, Province" value={form.birthplace} onChange={(e) => setForm((p) => ({ ...p, birthplace: e.target.value }))} />
                </div>
            </div>

            <div style={styles.inputGroup}>
                <input style={styles.input} placeholder="Username" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
                <input style={{ ...styles.input, opacity: 0.7, background: "#f8fafc" }} value={currentUser?.email || ""} disabled />
            </div>
            
            <div style={{ marginTop: 14 }}>
              <p style={styles.fieldLabel}>Profile Picture (required)</p>
              <div style={styles.uploadBox}>
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, "avatar_url")} style={{ fontSize: 12 }} />
                  {form.avatar_url && (
                    <img src={form.avatar_url} alt="profile" style={styles.avatarPreview} />
                  )}
              </div>
            </div>

            {form.role_identity === "Student" && (
              <input style={styles.input} placeholder="School Name" value={form.school} onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))} />
            )}
            {form.role_identity === "Employee" && (
              <>
                <div style={styles.inputGroup}>
                    <input 
                      style={{ ...styles.input, ...(form.role_identity === "Employee" ? { background: "#F1F5F9", cursor: "not-allowed", opacity: 0.8 } : {}) }} 
                      placeholder="Company Name" 
                      value={form.company_name} 
                      onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))}
                      readOnly={form.role_identity === "Employee"}
                    />
                    <input style={styles.input} placeholder="Position Title" value={form.position_title} onChange={(e) => setForm((p) => ({ ...p, position_title: e.target.value }))} />
                </div>
                <select
                    style={styles.input}
                    value={form.program}
                    onChange={(e) => setForm((p) => ({ ...p, program: e.target.value }))}
                >
                    <option value="">Select Program / Office / Site</option>
                    {agencyList.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            <p style={styles.stepTitle}>Step 3: Location / Address</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={styles.fieldLabel}>Region</p>
                <select
                  style={styles.input}
                  value={form.region}
                  onChange={(e) => setForm((p) => ({ ...p, region: e.target.value, province: "", city: "", barangay: "" }))}
                >
                  <option value="">Select Region</option>
                  {regionList.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <p style={styles.fieldLabel}>Province</p>
                <select
                  style={styles.input}
                  value={form.province}
                  onChange={(e) => setForm((p) => ({ ...p, province: e.target.value, city: "", barangay: "" }))}
                  disabled={!form.region}
                >
                  <option value="">Select Province</option>
                  {provinceList.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <p style={styles.fieldLabel}>City / Municipality</p>
                <select
                  style={styles.input}
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value, barangay: "" }))}
                  disabled={!form.province}
                >
                  <option value="">Select City / Municipality</option>
                  {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <p style={styles.fieldLabel}>Barangay</p>
                <select
                  style={styles.input}
                  value={form.barangay}
                  onChange={(e) => setForm((p) => ({ ...p, barangay: e.target.value }))}
                  disabled={!form.city || isLoadingLocations}
                >
                  <option value="">{isLoadingLocations ? "Loading barangays..." : "Select Barangay"}</option>
                  {barangayList.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <p style={styles.fieldLabel}>Exact Address</p>
                <input style={styles.input} placeholder="House No. / Street / Block" value={form.exact_address} onChange={(e) => setForm((p) => ({ ...p, exact_address: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        <div style={styles.actions}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            {showErrors && !canNext && (
              <p style={styles.warning}>
                Missing: <span style={{ fontWeight: 800 }}>{getMissingFields().join(", ")}</span>
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <button 
                type="button"
                onClick={() => {
                   if (step === 1) {
                     onBack();
                   } else {
                     setStep((s) => Math.max(1, s - 1));
                   }
                   setShowErrors(false);
                }} 
                disabled={saving} 
                style={styles.secondaryBtn}
              >
                Back
              </button>
              {step < 3 ? (
                <button 
                  type="button"
                  onClick={() => {
                    if (canNext) {
                      setStep((s) => Math.min(3, s + 1));
                      setShowErrors(false);
                    } else {
                      setShowErrors(true);
                    }
                  }} 
                  style={styles.primaryBtn}
                >
                  Next
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    if (canNext) {
                      saveOnboarding();
                    } else {
                      setShowErrors(true);
                    }
                  }} 
                  disabled={saving} 
                  style={styles.primaryBtn}
                >
                  {saving ? "Saving..." : "Finish"}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrap: { 
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", 
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", padding: 20 
  },
  card: { 
    width: "100%", maxWidth: 640, background: "rgba(255, 255, 255, 0.95)", 
    backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.5)", 
    borderRadius: 32, padding: 0, boxShadow: "0 30px 60px rgba(31, 42, 86, 0.12)",
    overflow: "hidden"
  },
  header: {
    background: "linear-gradient(135deg, #1f2a56 0%, #3b82f6 100%)",
    padding: "32px", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.1)"
  },
  body: { padding: "32px" },
  title: { margin: 0, color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" },
  sub: { marginTop: 6, color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600 },
  warning: { 
    background: "#FFF1F2", color: "#E11D48", padding: "10px 16px", borderRadius: "12px", 
    fontSize: "12px", fontWeight: "600", border: "1px solid #FECDD3", margin: "10px 0 0" 
  },
  restoredDraft: {
    display: 'flex', alignItems: 'center', background: "#F1F5F9", color: "#475569", 
    padding: "10px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", 
    border: "1px solid #E2E8F0", marginBottom: 15, animation: 'fadeIn 0.3s ease-out'
  },
  progress: { height: 6, background: "#E2E8F0", borderRadius: 99, overflow: "hidden", margin: "20px 0 24px" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #2563EB, #3B82F6)", transition: "width 0.4s ease" },
  stepTitle: { fontWeight: 800, fontSize: 13, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 },
  roleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  roleBtn: { 
    padding: "16px 12px", borderRadius: 14, border: "2px solid #E2E8F0", 
    background: "#fff", cursor: "pointer", fontWeight: 700, transition: "all 0.2s",
    fontSize: 14, color: "#475569"
  },
  inputGroup: { display: "flex", gap: 12, marginTop: 12 },
  fieldLabel: { margin: "0 0 6px", fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" },
  input: { 
    width: "100%", padding: "12px 16px", marginTop: 0, border: "1.5px solid #E2E8F0", 
    borderRadius: 12, fontSize: 14, boxSizing: "border-box", outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s", background: "#fff",
    color: "#1e293b", fontWeight: 500
  },
  uploadBox: { 
    display: "flex", alignItems: "center", justifyContent: "space-between", 
    padding: "12px", border: "1.5px dashed #CBD5E1", borderRadius: 12, background: "#f8fafc" 
  },
  avatarPreview: { width: 48, height: 48, objectFit: "cover", borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  actions: { marginTop: 32, display: "flex", justifyContent: "space-between", gap: 12 },
  primaryBtn: { 
    flex: 2, background: "#2563EB", color: "#fff", border: "none", borderRadius: 12, 
    padding: "14px 24px", cursor: "pointer", fontWeight: 800, fontSize: 15,
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)", transition: "transform 0.1s"
  },
  secondaryBtn: { 
    flex: 1, background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", 
    borderRadius: 12, padding: "14px 24px", cursor: "pointer", fontWeight: 700, fontSize: 15 
  },
};

export default UserOnboarding;
