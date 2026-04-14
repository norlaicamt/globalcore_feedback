import React, { useState, useEffect, useRef } from "react";
import { createFeedback, getEntities, getBranches, getAdminSettings, getUserProfiles, getFormFields } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";
import CustomModal from "./CustomModal";
import { IconRegistry } from "./IconRegistry";

const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  MapPin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Star: ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  History: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  TrendingUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
};

const STEPS = {
  TYPE: "type",
  ENTITY: "entity",
  BRANCH: "branch",
  DETAILS: "details"
};

const FEEDBACK_TYPES = [
  { id: "Complaint", label: "Complaint", color: "#EF4444", icon: "⚠️" },
  { id: "Suggestion", label: "Suggestion", color: "#3B82F6", icon: "💡" },
  { id: "Appreciation", label: "Appreciation", color: "#10B981", icon: "❤️" },
];

const GeneralFeedback = ({ currentUser, onBack, onSuccess }) => {
  const { getLabel } = useTerminology();
  const [step, setStep] = useState(STEPS.TYPE);
  const [feedbackType, setFeedbackType] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  
  // Locations Data
  const [dbEntities, setDbEntities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [manualLocationText, setManualLocationText] = useState("");
  
  // Personalized Suggestions
  const [recentBranches, setRecentBranches] = useState([]);
  const [suggestedBranches, setSuggestedBranches] = useState([]);

  // Details Form
  const [idea, setIdea] = useState("");
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachmentBase64, setAttachmentBase64] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  
  // Tagging State
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(branchSearch), 300);
    return () => clearTimeout(timer);
  }, [branchSearch]);

  // Mentions Search Debounce
  useEffect(() => {
    const search = async () => {
      if (mentionSearch.trim().length < 2) {
        setMentionSuggestions([]);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const { searchUsers } = await import("../services/api");
        const results = await searchUsers(mentionSearch, "staff,employee,admin");
        // Filter out already selected
        setMentionSuggestions(results.filter(u => !selectedMentions.some(m => m.id === u.id)));
      } catch (e) {
        console.error("Error searching users", e);
      } finally {
        setIsSearchingUsers(false);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [mentionSearch, selectedMentions]);

  useEffect(() => {
    Promise.all([getEntities()])
      .then(([entities]) => {
        setDbEntities(entities);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedEntity) {
      setLoading(true);
      getBranches(selectedEntity.id)
        .then(data => {
            const activeOnly = data.filter(b => b.is_active);
            setBranches(activeOnly);
            
            // Generate Suggested Branches (Global Top)
            // In a real app, this might come from a dedicated API
            const top = [...activeOnly].sort((a, b) => (b.feedback_count || 0) - (a.feedback_count || 0)).slice(0, 3);
            setSuggestedBranches(top);

            // Load Recent Branches from LocalStorage
            try {
                const stored = JSON.parse(localStorage.getItem(`recent_branches_${selectedEntity.id}`) || "[]");
                // Filter to ensure they are still active
                const validRecent = stored.filter(id => activeOnly.some(b => b.id === id))
                                        .map(id => activeOnly.find(b => b.id === id))
                                        .slice(0, 3);
                setRecentBranches(validRecent);
            } catch (e) {
                console.error("Error loading recent branches", e);
            }

            // Auto-guide to manual if no branches exist
            if (activeOnly.length === 0) {
                setIsManualLocation(true);
            } else {
                setIsManualLocation(false);
            }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedEntity]);

  const saveToRecent = (branchId) => {
    if (!selectedEntity || !branchId) return;
    try {
        const key = `recent_branches_${selectedEntity.id}`;
        let recent = JSON.parse(localStorage.getItem(key) || "[]");
        recent = [branchId, ...recent.filter(id => id !== branchId)].slice(0, 5);
        localStorage.setItem(key, JSON.stringify(recent));
    } catch (e) {
        console.error("Error saving recent branch", e);
    }
  };

  const handleNext = () => {
    if (step === STEPS.TYPE && feedbackType) setStep(STEPS.ENTITY);
    else if (step === STEPS.ENTITY && selectedEntity) setStep(STEPS.BRANCH);
    else if (step === STEPS.BRANCH && (selectedBranch || isManualLocation)) setStep(STEPS.DETAILS);
  };

  const handleBack = () => {
    if (step === STEPS.DETAILS) setStep(STEPS.BRANCH);
    else if (step === STEPS.BRANCH) setStep(STEPS.ENTITY);
    else if (step === STEPS.ENTITY) setStep(STEPS.TYPE);
    else onBack();
  };

  const generateTitle = () => {
    const type = feedbackType || "Feedback";
    const entity = selectedEntity?.name || "Service";
    const location = isManualLocation 
        ? manualLocationText 
        : (selectedBranch?.name || "");
    
    if (location) {
        return `${type} – ${entity} (${location})`;
    }
    return `${type} – ${entity}`;
  };

  const handleSubmit = async () => {
    // 1. Validation
    if (!feedbackType || !selectedEntity || (!selectedBranch && !isManualLocation)) {
        setModal({
            isOpen: true,
            title: "Incomplete Details",
            message: "Please ensure you have selected a feedback type, program, and location before submitting.",
            type: "info"
        });
        return;
    }

    if (!idea.trim()) {
        setModal({
            isOpen: true,
            title: "Reference Required",
            message: "Please provide a description or message for your report.",
            type: "info"
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: generateTitle(),
        feedback_type: feedbackType,
        entity_id: selectedEntity.id,
        branch_id: selectedBranch?.id || null,
        manual_location_text: isManualLocation ? manualLocationText : null,
        description: idea,
        rating: rating,
        is_anonymous: isAnonymous,
        sender_id: currentUser.id,
        is_approved: true,
        attachments: attachmentBase64 ? JSON.stringify([attachmentBase64]) : null,
        mentions: selectedMentions.map(u => ({
            user_id: u.id,
            employee_name: u.name,
            employee_prefix: u.role_identity || u.position_title || "Staff"
        }))
      };

      await createFeedback(payload);
      
      if (selectedBranch) saveToRecent(selectedBranch.id);
      
      setModal({
        isOpen: true,
        title: "Success",
        message: "Your feedback has been submitted successfully. Thank you for helping us improve!",
        type: "success",
        onConfirm: () => onSuccess()
      });
    } catch (err) {
      console.error("Submission error details:", err.response?.data || err.message);
      setModal({
        isOpen: true,
        title: "Submission Failed",
        message: "We encountered an error while sending your feedback. Please try again.",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (b.city && b.city.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  // Render Helpers
  const renderStepIndicator = () => {
    const steps = [
        { id: STEPS.TYPE, label: "Type" },
        { id: STEPS.ENTITY, label: getLabel("entity_label", "Program") },
        { id: STEPS.BRANCH, label: "Location" },
        { id: STEPS.DETAILS, label: "Details" }
    ];
    const currentIndex = steps.findIndex(s => s.id === step);

    return (
      <div style={styles.stepperContainer}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              ...styles.stepCircle,
              backgroundColor: i <= currentIndex ? 'var(--primary-color)' : '#CBD5E1',
              color: 'white'
            }}>
              {i < currentIndex ? <Icons.Check /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                ...styles.stepLine,
                backgroundColor: i < currentIndex ? 'var(--primary-color)' : '#CBD5E1'
              }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading && step === STEPS.TYPE) return <div style={styles.loader}>Initializing...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <button onClick={handleBack} style={styles.backBtn}><Icons.Back /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={styles.headerSubtitle}>Step {Object.values(STEPS).indexOf(step) + 1} of 4</p>
            <h1 style={styles.headerTitle}>
                {step === STEPS.TYPE && "How can we help?"}
                {step === STEPS.ENTITY && `Select ${getLabel("entity_label", "Program")}`}
                {step === STEPS.BRANCH && "Which Office?"}
                {step === STEPS.DETAILS && "Report Details"}
            </h1>
        </div>
        <div style={{ width: 40 }} />
      </header>

      {renderStepIndicator()}

      <main style={styles.content}>
        {/* STEP 1: TYPE */}
        {step === STEPS.TYPE && (
          <div style={styles.grid}>
            {FEEDBACK_TYPES.map(t => (
              <button 
                key={t.id} 
                onClick={() => { setFeedbackType(t.id); handleNext(); }}
                style={{
                  ...styles.typeCard,
                  borderColor: feedbackType === t.id ? t.color : '#E2E8F0',
                  background: feedbackType === t.id ? `${t.color}10` : 'white'
                }}
              >
                <span style={{ fontSize: '32px', marginBottom: '10px' }}>{t.icon}</span>
                <span style={styles.typeLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: ENTITY */}
        {step === STEPS.ENTITY && (
          <div style={styles.list}>
            {dbEntities.map(ent => {
                if (!ent || !ent.id) return null;
                const IconComp = IconRegistry[ent.icon] || IconRegistry.default;
                const displayName = ent.name || "Unnamed Service";
                
                return (
                    <button 
                        key={ent.id} 
                        onClick={() => { setSelectedEntity(ent); handleNext(); }}
                        style={{
                            ...styles.listItem,
                            background: selectedEntity?.id === ent.id ? 'rgba(var(--primary-rgb), 0.05)' : 'white'
                        }}
                    >
                        <div style={styles.itemIcon}><IconComp width="24" height="24" /></div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={styles.itemName}>{displayName}</div>
                            <div style={styles.itemSub}>{(ent.description && ent.description !== "[]") ? ent.description : "Official Service / Program"}</div>
                        </div>
                        {selectedEntity?.id === ent.id && <Icons.Check />}
                    </button>
                );
            })}
          </div>
        )}

        {/* STEP 3: BRANCH */}
        {step === STEPS.BRANCH && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {branches.length === 0 ? (
                <div style={styles.emptyBranchBox}>
                    <p style={{ margin: 0, fontWeight: '800', color: 'var(--primary-color)', fontSize: '14px' }}>No direct locations registered yet.</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#64748B' }}>You can still submit your report by manually entering the location below.</p>
                </div>
            ) : (
                <>
                    <div style={styles.searchBox}>
                        <Icons.Search />
                        <input 
                            placeholder="Search city, office, or branch..." 
                            style={styles.searchInput}
                            value={branchSearch}
                            onChange={e => setBranchSearch(e.target.value)}
                        />
                    </div>

                    {!branchSearch && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {recentBranches.length > 0 && (
                                <div>
                                    <p style={styles.sectionTitle}><Icons.History /> RECENTLY USED</p>
                                    <div style={styles.suggestionGrid}>
                                        {recentBranches.map(b => (
                                            <button key={`rec-${b.id}`} onClick={() => { setSelectedBranch(b); setIsManualLocation(false); handleNext(); }} style={styles.suggestionItem}>
                                                {b.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {suggestedBranches.length > 0 && (
                                <div>
                                    <p style={styles.sectionTitle}><Icons.TrendingUp /> SUGGESTED</p>
                                    <div style={styles.suggestionGrid}>
                                        {suggestedBranches.map(b => (
                                            <button key={`sug-${b.id}`} onClick={() => { setSelectedBranch(b); setIsManualLocation(false); handleNext(); }} style={styles.suggestionItem}>
                                                {b.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={styles.branchList}>
                        {filteredBranches.map(b => (
                            <button 
                                key={b.id} 
                                onClick={() => { setSelectedBranch(b); setIsManualLocation(false); handleNext(); }}
                                style={{
                                    ...styles.branchItem,
                                    background: selectedBranch?.id === b.id ? 'rgba(var(--primary-rgb), 0.05)' : 'white'
                                }}
                            >
                                <Icons.MapPin />
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={styles.branchName}>{b.name}</div>
                                    <div style={styles.branchLoc}>{b.city}, {b.province}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div style={styles.divider}>OR</div>
                </>
            )}

            <button 
                onClick={() => { setIsManualLocation(true); setSelectedBranch(null); }}
                style={{
                  ...styles.manualBtn,
                  borderColor: isManualLocation ? 'var(--primary-color)' : '#E2E8F0',
                  background: isManualLocation ? 'rgba(var(--primary-rgb), 0.05)' : 'white'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isManualLocation ? '10px' : 0 }}>
                    <span style={{ fontSize: '18px' }}>📍</span>
                    <p style={{ margin: 0, fontWeight: '800', fontSize: '13px' }}>Manual Location Input</p>
                </div>
                {isManualLocation && (
                    <input 
                        autoFocus
                        placeholder="e.g. Near Barangay Hall, Bangon, Marawi"
                        style={styles.manualInput}
                        value={manualLocationText}
                        onChange={e => setManualLocationText(e.target.value)}
                    />
                )}
            </button>
            <div style={{ height: '20px' }} />
            {isManualLocation && <button onClick={handleNext} disabled={!manualLocationText.trim()} style={styles.nextBtn}>Continue with Manual Location</button>}
          </div>
        )}

        {/* STEP 4: DETAILS */}
        {step === STEPS.DETAILS && (
          <div style={styles.form}>
             <div style={styles.summaryBox}>
                <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Report Summary</p>
                <p style={{ margin: 0, fontWeight: '700' }}>{feedbackType} for {selectedEntity?.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                    {isManualLocation ? `📍 Manual: ${manualLocationText}` : `@ ${selectedBranch?.name}`}
                </p>
                {selectedMentions.length > 0 && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#3B82F6', fontWeight: '700' }}>
                        👤 MENTIONED: {selectedMentions.map(m => m.name).join(", ")}
                    </p>
                )}
             </div>

             <div style={styles.formGroup}>
                <label style={styles.label}>Rate your experience</label>
                <div style={styles.starRow}>
                    {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setRating(s)} style={styles.starBtn}>
                            <Icons.Star filled={s <= rating} />
                        </button>
                    ))}
                </div>
             </div>

             <div style={styles.formGroup}>
                 <label style={styles.label}>Mention Staff / Employees (Optional - Max 5)</label>
                 <div style={{ position: 'relative' }}>
                    <div style={styles.mentionInputContainer}>
                        {selectedMentions.map(user => (
                            <span key={user.id} style={styles.mentionPill}>
                                {user.name}
                                <button onClick={() => setSelectedMentions(prev => prev.filter(u => u.id !== user.id))} style={styles.removeTag}>✕</button>
                            </span>
                        ))}
                        {selectedMentions.length < 5 && (
                            <input 
                                placeholder={selectedMentions.length === 0 ? "Type staff name to tag..." : "Add another..."}
                                style={styles.mentionInput}
                                value={mentionSearch}
                                onChange={e => setMentionSearch(e.target.value)}
                            />
                        )}
                    </div>
                    
                    {mentionSuggestions.length > 0 && (
                        <div style={styles.suggestionsDropdown}>
                            {mentionSuggestions.map(user => (
                                <button 
                                    key={user.id} 
                                    onClick={() => {
                                        setSelectedMentions(prev => [...prev, user]);
                                        setMentionSearch("");
                                        setMentionSuggestions([]);
                                    }}
                                    style={styles.suggestionRow}
                                >
                                    <div style={styles.suggestionAvatar}>
                                        {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : user.name[0]}
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{user.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748B' }}>{user.role_identity || user.department}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
              </div>

              <div style={styles.formGroup}>
                 <label style={styles.label}>Your Message</label>
                 <textarea 
                    placeholder="Describe what happened or share your suggestion here..."
                    style={styles.textarea}
                    value={idea}
                    onChange={e => setIdea(e.target.value)}
                 />
             </div>

             <div style={styles.formGroup}>
                 <label style={styles.label}>Add a Photo (Optional)</label>
                 <input 
                     type="file" 
                     accept="image/*" 
                     onChange={(e) => {
                         const file = e.target.files[0];
                         if (file) {
                             const reader = new FileReader();
                             reader.onloadend = () => setAttachmentBase64(reader.result);
                             reader.readAsDataURL(file);
                         }
                     }}
                     style={{
                         padding: '10px',
                         border: '1px dashed #94A3B8',
                         borderRadius: '12px',
                         backgroundColor: '#F8FAFC',
                         cursor: 'pointer',
                         width: '100%',
                         boxSizing: 'border-box',
                         fontSize: '13px',
                         color: '#64748B'
                     }}
                 />
                 {attachmentBase64 && (
                     <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                         <img src={attachmentBase64} alt="Preview" style={{ height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0' }} />
                         <button 
                             onClick={() => setAttachmentBase64(null)} 
                             style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                         >✕</button>
                     </div>
                 )}
             </div>

             <div style={{ ...styles.formGroup, flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
                <label style={{ ...styles.label, margin: 0 }}>Submit as Anonymous</label>
             </div>

             <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !idea.trim()}
                style={{...styles.submitBtn, opacity: (isSubmitting || !idea.trim()) ? 0.6 : 1}}
             >
                {isSubmitting ? "Submitting..." : `Submit ${feedbackType}`}
             </button>
          </div>
        )}
      </main>

      <CustomModal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={() => {
            if (modal.onConfirm) modal.onConfirm();
            setModal({ ...modal, isOpen: false });
        }}
        confirmText={modal.type === "error" ? "Try Again" : "OK"}
      />
    </div>
  );
};

const styles = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC' },
  header: { padding: '20px', background: 'white', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' },
  headerTitle: { fontSize: '16px', fontWeight: '800', margin: 0, color: '#1E293B' },
  headerSubtitle: { fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' },
  stepperContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', background: 'white', borderBottom: '1px solid #F1F5F9' },
  stepCircle: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' },
  stepLine: { width: '40px', height: '2px', margin: '0 4px' },
  content: { flex: 1, padding: '24px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' },
  typeCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', borderRadius: '20px', border: '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  typeLabel: { fontSize: '13px', fontWeight: '800', color: '#334155' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', cursor: 'pointer', width: '100%' },
  itemIcon: { width: '44px', height: '44px', borderRadius: '12px', background: 'white', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' },
  itemName: { fontWeight: '800', fontSize: '14px', color: '#1E293B' },
  itemSub: { fontSize: '11px', color: '#64748B' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '10px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', flex: 1, color: '#1E293B', background: 'transparent' },
  sectionTitle: { fontSize: '10px', fontWeight: '800', color: '#94A3B8', margin: '0 0 10px 0', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' },
  suggestionGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  suggestionItem: { padding: '8px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', fontSize: '11px', fontWeight: '700', color: '#475569', cursor: 'pointer' },
  branchList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' },
  branchItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid #F1F5F9', cursor: 'pointer', width: '100%', color: '#64748B' },
  branchName: { fontWeight: '700', fontSize: '13px', color: '#1E293B' },
  branchLoc: { fontSize: '10px' },
  divider: { textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '800', margin: '10px 0' },
  manualBtn: { padding: '16px', borderRadius: '16px', border: '2px dashed #E2E8F0', width: '100%', cursor: 'pointer', textAlign: 'left' },
  manualInput: { width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid var(--primary-color)`, fontSize: '13px', outline: 'none', background: 'white' },
  emptyBranchBox: { padding: '24px', borderRadius: '16px', background: 'rgba(var(--primary-rgb), 0.03)', border: '1px solid rgba(var(--primary-rgb), 0.1)', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  summaryBox: { padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#334155' },
  starRow: { display: 'flex', gap: '5px' },
  starBtn: { border: 'none', background: 'none', cursor: 'pointer', padding: 0 },
  textarea: { height: '120px', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', fontFamily: 'inherit' },
  submitBtn: { padding: '16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' },
  nextBtn: { padding: '14px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
  loader: { padding: '100px', textAlign: 'center', color: '#64748B' },
  
  // Mention Styles
  mentionInputContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', minHeight: '48px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', alignItems: 'center' },
  mentionPill: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: '1px solid #DBEAFE' },
  removeTag: { border: 'none', background: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '12px', padding: '2px' },
  mentionInput: { border: 'none', outline: 'none', flex: 1, minWidth: '120px', fontSize: '13px' },
  suggestionsDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' },
  suggestionRow: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' },
  suggestionAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)', overflow: 'hidden' }
};

export default GeneralFeedback;
