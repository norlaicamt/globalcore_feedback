import React, { useState, useEffect } from "react";
import { createFeedback, getEntities, getBranches, getEntityFormConfig } from "../services/api";
import { useTerminology } from "../context/TerminologyContext";
import CustomModal from "./CustomModal";
import { IconRegistry } from "./IconRegistry";

const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  MapPin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Star: ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1" } strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  History: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
};

const FEEDBACK_TYPES = [
  { id: "Complaint", label: "Complaint", color: "#EF4444", icon: "⚠️" },
  { id: "Suggestion", label: "Suggestion", color: "#3B82F6", icon: "💡" },
  { id: "Appreciation", label: "Appreciation", color: "#10B981", icon: "❤️" },
];

const GeneralFeedback = ({ currentUser, onBack, onSuccess }) => {
  const { getLabel } = useTerminology();
  const [step, setStep] = useState("type");
  const [feedbackType, setFeedbackType] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const isPreviewMode = new URLSearchParams(window.location.search).get('preview') === 'true';
  const previewEntityId = new URLSearchParams(window.location.search).get('entity_id');
  
  const [dbEntities, setDbEntities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [manualLocationText, setManualLocationText] = useState("");
  
  const [recentBranches, setRecentBranches] = useState([]);
  const [idea, setIdea] = useState("");
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachmentBase64, setAttachmentBase64] = useState(null);
  const [customFields, setCustomFields] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [selectedMentions, setSelectedMentions] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(branchSearch), 300);
    return () => clearTimeout(timer);
  }, [branchSearch]);

  useEffect(() => {
    const search = async () => {
      if (mentionSearch.trim().length < 2) { setMentionSuggestions([]); return; }
      try {
        const { searchUsers } = await import("../services/api");
        const results = await searchUsers(mentionSearch, "staff,employee,admin");
        setMentionSuggestions(results.filter(u => !selectedMentions.some(m => m.id === u.id)));
      } catch (e) { console.error(e); }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [mentionSearch, selectedMentions]);

  useEffect(() => {
    if (!isPreviewMode) return;
    const channel = new BroadcastChannel('form_preview');
    channel.onmessage = (e) => {
      if (e.data?.type === 'config_update') setFormConfig(e.data.config);
    };
    return () => channel.close();
  }, [isPreviewMode]);

  useEffect(() => {
    if (isPreviewMode && previewEntityId && dbEntities.length > 0) {
      const ent = dbEntities.find(e => String(e.id) === String(previewEntityId));
      if (ent && !selectedEntity) setSelectedEntity(ent);
    }
  }, [isPreviewMode, previewEntityId, dbEntities]);

  useEffect(() => {
    getEntities().then(setDbEntities).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedEntity) {
      setLoading(true);
      Promise.all([getBranches(selectedEntity.id), getEntityFormConfig(selectedEntity.id)])
        .then(([bd, cd]) => {
            const activeOnly = bd.filter(b => b.is_active);
            setBranches(activeOnly);
            setFormConfig(cd);
            setIsManualLocation(activeOnly.length === 0);
            try {
                const stored = JSON.parse(localStorage.getItem(`recent_branches_${selectedEntity.id}`) || "[]");
                setRecentBranches(stored.filter(id => activeOnly.some(b => b.id === id)).map(id => activeOnly.find(b => b.id === id)).slice(0, 3));
            } catch (e) {}
        })
        .finally(() => setLoading(false));
    }
  }, [selectedEntity]);

  const getEnabledSteps = () => {
    if (!formConfig || !formConfig.steps) return [];
    return [...formConfig.steps].filter(s => s.enabled && (s.items || []).length > 0).sort((a, b) => a.order - b.order);
  };

  const isItemValid = (item) => {
    if (item.type === "module") {
      if (item.key === "feedback_type") return !!feedbackType;
      if (item.key === "entity_picker") return !!selectedEntity;
      if (item.key === "location_picker") return !!selectedBranch || (isManualLocation && !!manualLocationText.trim());
      if (item.key === "message_input") return !!idea.trim();
      if (item.key === "rating") return rating > 0;
      return true;
    }
    if (item.type === "section") {
      const section = formConfig?.sections?.find(s => s.id === item.section_id);
      if (!section) return true;
      return (section.fields || []).every(f => {
        if (!f.required) return true;
        if (f.visible_if && f.visible_if.field === "feedback_type" && feedbackType !== f.visible_if.equals) return true;
        return !!customFields[f.id];
      });
    }
    return true;
  };

  const handleNext = () => {
    const enabled = getEnabledSteps();
    const current = enabled.find(s => s.id === step);
    if (!current) return;
    if (!current.items.every(isItemValid)) { setShowErrors(true); return; }
    setShowErrors(false);
    const idx = enabled.findIndex(s => s.id === step);
    if (idx < enabled.length - 1) setStep(enabled[idx+1].id);
  };

  const handleBack = () => {
    setShowErrors(false);
    const enabled = getEnabledSteps();
    const idx = enabled.findIndex(s => s.id === step);
    if (idx > 0) setStep(enabled[idx - 1].id); else onBack();
  };

  const handleSubmit = async () => {
    const enabled = getEnabledSteps();
    const current = enabled.find(s => s.id === step);
    if (!current.items.every(isItemValid)) { setShowErrors(true); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        title: `${feedbackType} - ${selectedEntity?.name}`,
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
        mentions: selectedMentions.map(u => ({ user_id: u.id, employee_name: u.name, employee_prefix: "Staff" })),
        custom_data: customFields
      };
      await createFeedback(payload);
      setModal({ isOpen: true, title: "Success", message: "Report Submitted!", type: "success", onConfirm: () => onSuccess() });
    } catch (e) { setModal({ isOpen: true, title: "Error", message: "Submission failed.", type: "error" }); }
    finally { setIsSubmitting(false); }
  };

  const renderItem = (item, idx) => {
    if (item.type === "module") {
      const key = item.key;
      const invalid = showErrors && !isItemValid(item);
      const errStyle = invalid ? { borderLeft: '4px solid #EF4444', paddingLeft: '12px' } : {};

      if (key === 'feedback_type') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>Select Feedback Type</label>
          <div style={styles.grid}>{FEEDBACK_TYPES.map(t => (
            <button key={t.id} onClick={() => { setFeedbackType(t.id); handleNext(); }} style={{ ...styles.typeCard, borderColor: feedbackType === t.id ? t.color : '#E2E8F0', background: feedbackType === t.id ? `${t.color}10` : 'white' }}>
              <span style={{ fontSize: '32px' }}>{t.icon}</span><span style={styles.typeLabel}>{t.label}</span>
            </button>
          ))}</div>
          {invalid && <p style={styles.errTxt}>Please select a type</p>}
        </div>
      );
      if (key === 'entity_picker') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>{getLabel('department_label', 'Program')}</label>
          <div style={styles.list}>{dbEntities.map(ent => (
            <button key={ent.id} onClick={() => { setSelectedEntity(ent); handleNext(); }} style={{ ...styles.listItem, background: selectedEntity?.id === ent.id ? 'rgba(var(--primary-rgb), 0.05)' : 'white' }}>
              <div style={styles.itemIcon}>{IconRegistry[ent.icon] ? React.createElement(IconRegistry[ent.icon], { width:24, height:24 }) : <Icons.MapPin />}</div>
              <div style={{ textAlign: 'left', flex: 1 }}><div style={styles.itemName}>{ent.name}</div></div>
            </button>
          ))}</div>
          {invalid && <p style={styles.errTxt}>Please select an option</p>}
        </div>
      );
      if (key === 'location_picker') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>Where did this happen?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={styles.searchBox}><Icons.Search/><input placeholder="Search branch..." style={styles.searchInput} value={branchSearch} onChange={e => setBranchSearch(e.target.value)}/></div>
            <div style={styles.branchList}>{branches.filter(b => b.name.toLowerCase().includes(debouncedSearch.toLowerCase())).map(b => (
              <button key={b.id} onClick={() => { setSelectedBranch(b); setIsManualLocation(false); handleNext(); }} style={{ ...styles.branchItem, background: selectedBranch?.id === b.id ? 'rgba(var(--primary-rgb), 0.05)' : 'white' }}>
                <Icons.MapPin/><div style={styles.branchName}>{b.name}</div>
              </button>
            ))}</div>
            <button onClick={() => setIsManualLocation(true)} style={{ ...styles.manualBtn, borderColor: isManualLocation ? 'var(--primary-color)' : '#E2E8F0' }}>
              <p style={{ margin: 0, fontWeight: 800 }}>Manual Input</p>
              {isManualLocation && <input autoFocus style={{ ...styles.manualInput, marginTop: 10 }} value={manualLocationText} onChange={e => setManualLocationText(e.target.value)} />}
            </button>
          </div>
          {invalid && <p style={styles.errTxt}>Please select/input location</p>}
        </div>
      );
      if (key === 'message_input') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>Your Message</label>
          <textarea style={{ ...styles.textarea, borderColor: invalid ? '#EF4444' : '#E2E8F0' }} value={idea} onChange={e => setIdea(e.target.value)} placeholder="Describe everything..." />
          {invalid && <p style={styles.errTxt}>Message is required</p>}
        </div>
      );
      if (key === 'rating') return (
        <div key={idx} style={{ ...styles.formGroup, ...errStyle }}>
          <label style={styles.label}>Rating</label>
          <div style={styles.starRow}>{[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)} style={styles.starBtn}><Icons.Star filled={s <= rating} /></button>)}</div>
          {invalid && <p style={styles.errTxt}>Rating is required</p>}
        </div>
      );
      if (key === 'staff') return (
        <div key={idx} style={styles.formGroup}>
          <label style={styles.label}>Mention Staff</label>
          <div style={styles.mentionInputContainer}>
            {selectedMentions.map(m => <span key={m.id} style={styles.mentionPill}>{m.name}<button onClick={() => setSelectedMentions(prev => prev.filter(u => u.id !== m.id))} style={styles.removeTag}>✕</button></span>)}
            <input placeholder="Search..." style={styles.mentionInput} value={mentionSearch} onChange={e => setMentionSearch(e.target.value)} />
          </div>
          {mentionSuggestions.length > 0 && <div style={styles.suggestionsDropdown}>{mentionSuggestions.map(u => <button key={u.id} onClick={() => { setSelectedMentions([...selectedMentions, u]); setMentionSearch(""); }} style={styles.suggestionRow}>{u.name}</button>)}</div>}
        </div>
      );
      if (key === 'anonymous') return <div key={idx} style={{ ...styles.formGroup, flexDirection: 'row', alignItems: 'center', gap: 10 }}><input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} /><label style={{ ...styles.label, margin: 0 }}>Anonymous Submission</label></div>;
    }
    if (item.type === "section") {
      const section = formConfig?.sections?.find(sec => sec.id === item.section_id);
      if (!section) return null;
      return (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          <h3 style={styles.sectionTitle}>{section.title}</h3>
          {(section.fields || []).map(f => {
            if (f.visible_if && f.visible_if.field === "feedback_type" && feedbackType !== f.visible_if.equals) return null;
            const isInvalid = showErrors && f.required && !customFields[f.id];
            return (
              <div key={f.id} style={{ ...styles.formGroup, borderLeft: isInvalid ? '4px solid #EF4444' : 'none', paddingLeft: isInvalid ? '12px' : 0 }}>
                <label style={styles.label}>{f.label} {f.required && "*"}</label>
                <input style={styles.input} value={customFields[f.id] || ""} onChange={e => setCustomFields({ ...customFields, [f.id]: e.target.value })} />
                {isInvalid && <p style={styles.errTxt}>Required</p>}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div style={styles.loader}>Loading...</div>;

  const enabled = getEnabledSteps();
  const currentStep = enabled.find(s => s.id === step);
  const currentIndex = enabled.findIndex(s => s.id === step);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={handleBack} style={styles.backBtn}><Icons.Back /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={styles.headerSubtitle}>Step {currentIndex + 1} of {enabled.length}</p>
          <h1 style={styles.headerTitle}>{currentStep?.label || "Details"}</h1>
        </div>
        <div style={{ width: 40 }} />
      </header>

      <div style={{ background: 'white', borderBottom: '1px solid #F1F5F9', padding: '14px 20px 10px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {enabled.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= currentIndex ? 'var(--primary-color)' : '#E2E8F0', opacity: i < currentIndex ? 0.6 : 1, position: 'relative', overflow: 'hidden' }}>
              {i === currentIndex && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  animation: 'shimmerBar 1.5s infinite'
                }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {enabled.map((s, i) => (
            <div key={s.id} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: i === currentIndex ? 800 : 600, color: i === currentIndex ? 'var(--primary-color)' : '#94A3B8' }}>{i < currentIndex ? "✓ " : ""}{s.label}</div>
          ))}
        </div>
      </div>

      <main style={styles.content}>
        {currentStep && (
          <div key={step} className="step-transition">
            {currentStep.items.map((it, idx) => renderItem(it, idx))}
            {!(currentStep.items.length === 1 && ['feedback_type', 'entity_picker', 'location_picker'].includes(currentStep.items[0].key)) && (
              <div style={{ marginTop: 24 }}>
                {currentStep.items.some(i => i.key === 'message_input') 
                  ? <button onClick={handleSubmit} disabled={isSubmitting} style={{ ...styles.submitBtn, width: '100%', opacity: isSubmitting ? 0.6 : 1 }}>Submit</button>
                  : <button onClick={handleNext} style={{ ...styles.nextBtn, width: '100%' }}>Continue</button>
                }
              </div>
            )}
          </div>
        )}
      </main>

      <CustomModal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onConfirm={() => { if (modal.onConfirm) modal.onConfirm(); setModal({ ...modal, isOpen: false }); }} />
    </div>
  );
};

const styles = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC' },
  header: { padding: '20px', background: 'white', display: 'flex', alignItems: 'center', gap: '10px' },
  headerTitle: { fontSize: '16px', fontWeight: '800', margin: 0, color: '#1E293B' },
  headerSubtitle: { fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', margin: 0 },
  content: { flex: 1, padding: '24px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' },
  typeCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', borderRadius: '20px', border: '2px solid transparent', background: 'white', cursor: 'pointer', transition: 'all 0.2s' },
  typeLabel: { fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', cursor: 'pointer', width: '100%', background: 'white' },
  itemIcon: { width: '44px', height: '44px', borderRadius: '12px', background: 'white', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' },
  itemName: { fontWeight: '800', fontSize: '14px', color: '#1E293B' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', flex: 1, background: 'transparent' },
  branchList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  branchItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid #F1F5F9', cursor: 'pointer', width: '100%', background: 'white' },
  branchName: { fontWeight: '700', fontSize: '13px', color: '#1E293B' },
  manualBtn: { padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', textAlign: 'left', cursor: 'pointer' },
  manualInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' },
  formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
  label: { fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' },
  textarea: { padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', height: '120px', fontSize: '14px', resize: 'none' },
  input: { padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px' },
  nextBtn: { padding: '16px', borderRadius: '14px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer' },
  submitBtn: { padding: '16px', borderRadius: '14px', background: '#10B981', color: 'white', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer' },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  errTxt: { fontSize: '11px', color: '#EF4444', margin: '4px 0 0', fontWeight: '700' },
  starBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  starRow: { display: 'flex', gap: '8px' },
  mentionInputContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white' },
  mentionPill: { background: '#EFF6FF', color: '#3B82F6', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' },
  mentionInput: { border: 'none', outline: 'none', flex: 1, minWidth: '100px', fontSize: '13px' },
  suggestionsDropdown: { background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', marginTop: '5px', maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  suggestionRow: { width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
  removeTag: { border: 'none', background: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: '10px' },
  sectionTitle: { margin: '20px 0 10px', fontSize: '14px', fontWeight: '800', color: 'var(--primary-color)', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' },
  select: { padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', background: 'white' },
  loader: { padding: '100px', textAlign: 'center', fontWeight: '800', color: '#64748B' }
};

export default GeneralFeedback;
