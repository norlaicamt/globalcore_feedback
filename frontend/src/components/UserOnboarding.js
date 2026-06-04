import React, { useEffect, useMemo, useState } from "react";
import { updateUser, getDrafts, createDraft, updateDraft, deleteDraft } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";
import { STORAGE_KEYS } from "../utils/storage";
import { resolveMediaUrl } from "../utils/feedback";
import "../styles/UserOnboarding.css";


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
    birthplace: currentUser?.birthplace || "",
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
  useTerminology();
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
    const loadDraft = async () => {
      if (!currentUser?.id) return;

      try {
        const cloudDrafts = await getDrafts(currentUser.id);
        const onboardingDraft = cloudDrafts.find(d => d.feedback_type === "onboarding");

        if (onboardingDraft) {
          if (onboardingDraft.custom_data?.form) setForm(prev => ({ ...prev, ...onboardingDraft.custom_data.form }));
          if (onboardingDraft.step) setStep(parseInt(onboardingDraft.step) || 1);
          setRestored(true);
          // Keep track of the draft ID for updates
          window._onboardingDraftId = onboardingDraft.id;
          setTimeout(() => setRestored(false), 5000);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch cloud onboarding draft", err);
      }

      // Fallback to local
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
            setTimeout(() => setRestored(false), 5000);
          }
        } catch (err) {
          console.error("Failed to restore onboarding draft from local", err);
        }
      }
    };

    loadDraft();

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
    if (saving || !currentUser?.id) return;

    const timer = setTimeout(async () => {
      const draftForm = { ...form };
      if (draftForm.avatar_url && draftForm.avatar_url.startsWith('data:')) {
        delete draftForm.avatar_url;
      }

      const draftData = {
        feedback_type: "onboarding",
        step: step.toString(),
        custom_data: { form: draftForm },
        title: "Onboarding Progress",
        description: `Step ${step} of onboarding`
      };

      try {
        if (window._onboardingDraftId) {
          await updateDraft(window._onboardingDraftId, draftData);
        } else {
          const newDraft = await createDraft(currentUser.id, draftData);
          window._onboardingDraftId = newDraft.id;
        }
      } catch (err) {
        console.warn("Failed to sync onboarding draft to cloud", err);
        // Local fallback
        const draftKey = `user.onboarding_draft_${currentUser.id}`;
        localStorage.setItem(draftKey, JSON.stringify({ version: DRAFT_VERSION, savedAt: Date.now(), step, form: draftForm }));
      }
    }, 2000);

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
      const cities = allCities[form.province];
      setCityList(cities);
      // Auto-select if there's only one city (especially for NCR where province is same as city)
      if (cities.length === 1 && form.city !== cities[0]) {
        setForm(p => ({ ...p, city: cities[0] }));
      }
    } else {
      setCityList([]);
    }
  }, [form.province, allCities, form.city]);

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

      if (window._onboardingDraftId) {
        deleteDraft(window._onboardingDraftId).catch(err => console.error("Failed to delete onboarding draft", err));
        delete window._onboardingDraftId;
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
    <div className="onboarding-wrap">
      <div className="onboarding-card">
        {!isWelcome ? (
          <>
            <div className="onboarding-header">
              <button
                onClick={onBack}
                className="onboarding-close-btn"
                title="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <h2 className="onboarding-title">Complete Your Profile</h2>
              <p className="onboarding-sub">{step === 1 ? "Basic Info" : "Community & Location"}</p>
            </div>

            <div className="onboarding-body">
              {restored && (
                <div className="onboarding-restored-draft">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8 }}>
                    <path d="M23 12a11 11 0 1 1-2.9-7.3L20 6V1h-5" />
                  </svg>
                  Your previous progress has been restored.
                </div>
              )}
              <div className="onboarding-progress">
                <div className="onboarding-progress-fill" style={{ width: `${(step / 2) * 100}%` }} />
              </div>

              {step === 1 && (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <p className="onboarding-step-title">Profile Setup</p>

                  {/* Identity Section */}
                  <div style={{ marginBottom: 24 }}>
                    <p className="onboarding-section-label">Identity</p>
                    <div className="onboarding-input-group">
                      <div>
                        <p className="onboarding-field-label">First Name</p>
                        <input className="onboarding-input" placeholder="e.g. Juan" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                      </div>
                      <div>
                        <p className="onboarding-field-label">Middle Name (Optional)</p>
                        <input className="onboarding-input" placeholder="e.g. Santos" value={form.middleName} onChange={(e) => setForm((p) => ({ ...p, middleName: e.target.value }))} />
                      </div>
                    </div>
                    <div className="onboarding-input-group-full" style={{ marginTop: 12 }}>
                      <p className="onboarding-field-label">Last Name</p>
                      <input className="onboarding-input" placeholder="e.g. Dela Cruz" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div className="onboarding-optional-box">
                    <p className="onboarding-section-label">Personal Information</p>
                    <div className="onboarding-input-group-full">
                      <p className="onboarding-field-label">Date of Birth</p>
                      <input type="date" className="onboarding-input" value={form.birthdate} onChange={(e) => setForm((p) => ({ ...p, birthdate: e.target.value }))} />
                    </div>

                    <div className="onboarding-input-group">
                      <div>
                        <p className="onboarding-field-label">Citizenship</p>
                        <select className="onboarding-input" value={form.citizenship} onChange={(e) => setForm((p) => ({ ...p, citizenship: e.target.value }))}>
                          <option value="Filipino">Filipino</option>
                          <option value="Dual Citizen">Dual Citizen</option>
                          <option value="Foreign National">Foreign National</option>
                        </select>
                      </div>
                      <div>
                        <p className="onboarding-field-label">Marital Status</p>
                        <select className="onboarding-input" value={form.marital_status} onChange={(e) => setForm((p) => ({ ...p, marital_status: e.target.value }))}>
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
                    <p className="onboarding-section-label">Contact</p>
                    <div className="onboarding-input-group-full">
                      <p className="onboarding-field-label">Contact Number</p>
                      <input className="onboarding-input" placeholder="+63 9xx xxx xxxx" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                  <p className="onboarding-step-title">Step 2: Location & Finalization</p>

                  <div className="onboarding-optional-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <p className="onboarding-section-label">Profile Picture</p>
                      <span className="onboarding-badge-optional">Optional</span>
                    </div>
                    <div className="onboarding-upload-box">
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, "avatar_url")} style={{ fontSize: 12 }} />
                      {form.avatar_url && (
                        <img src={resolveMediaUrl(form.avatar_url)} alt="profile" className="onboarding-avatar-preview" />
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <p className="onboarding-section-label">Village / Community Location</p>
                    <div className="onboarding-location-grid">
                      <div>
                        <p className="onboarding-field-label">Region</p>
                        <select className="onboarding-input" value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value, province: "", city: "", barangay: "" }))}>
                          <option value="">Select Region</option>
                          {regionList.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="onboarding-field-label">Province</p>
                        <select className="onboarding-input" value={form.province} onChange={(e) => setForm((p) => ({ ...p, province: e.target.value, city: "", barangay: "" }))} disabled={!form.region}>
                          <option value="">Select Province</option>
                          {provinceList.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="onboarding-location-grid" style={{ marginTop: 12 }}>
                      <div>
                        <p className="onboarding-field-label">City / Municipality</p>
                        <select className="onboarding-input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value, barangay: "" }))} disabled={!form.province}>
                          <option value="">Select City</option>
                          {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="onboarding-field-label">Barangay</p>
                        <select className="onboarding-input" value={form.barangay} onChange={(e) => setForm((p) => ({ ...p, barangay: e.target.value }))} disabled={!form.city || isLoadingLocations}>
                          <option value="">{isLoadingLocations ? "..." : "Select Barangay"}</option>
                          {barangayList.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <p className="onboarding-field-label">Lot / Block / House No. / Street</p>
                      <input className="onboarding-input" placeholder="Exact residence address" value={form.exact_address} onChange={(e) => setForm((p) => ({ ...p, exact_address: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}

              <div className="onboarding-actions">
                <div className="onboarding-btn-container">
                  {showErrors && !canNext && (
                    <p className="onboarding-warning">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 6 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {getMissingFields()[0]}
                    </p>
                  )}
                  <div className="onboarding-btn-row">
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 1) onBack();
                        else setStep(1);
                        setShowErrors(false);
                      }}
                      disabled={saving}
                      className="onboarding-secondary-btn"
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
                        className="onboarding-primary-btn"
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
                        className="onboarding-primary-btn"
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
          <div className="onboarding-welcome-wrap">
            <div className="onboarding-welcome-tick">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="onboarding-welcome-title">Welcome aboard, {form.firstName} {form.lastName}!</h2>
            <p className="onboarding-welcome-sub">Your professional workspace is ready. Let's start making an impact together.</p>
            <button
              className="onboarding-welcome-btn"
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



export default UserOnboarding;
