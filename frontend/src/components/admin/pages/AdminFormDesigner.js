import React, { useState, useEffect } from "react";
import { useTerminology } from "../../../context/TerminologyContext";
import { 
  adminGetEntities, 
  getEntityFormConfig, 
  updateEntityFormConfig,
  getSystemLabels
} from "../../../services/adminApi";
import { IconRegistry } from "../../IconRegistry";

// --- SVG Icons ---
const Ico = {
  Plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  ChevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  Save: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Box: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  AlertTriangle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  User: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Paperclip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  EyeOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  MapPin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  MessageSquare: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Building: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="9" y1="14" x2="9" y2="14"/><line x1="15" y1="14" x2="15" y2="14"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/></svg>,
};

const FIELD_TYPES = [
  { value: "text",     label: "Text Field" },
  { value: "dropdown", label: "Dropdown Menu" },
  { value: "rating",   label: "Star Rating" },
  { value: "number",   label: "Number Input" },
  { value: "date",     label: "Date Picker" }
];

const getModuleOptions = (getLabel) => [
  { key: "feedback_type",  label: `${getLabel('feedback_label', 'Feedback')} Type Picker`,    desc: "Complaint / Suggestion / Appreciation", icon: "Layers" },
  { key: "entity_picker",  label: `${getLabel('category_label', 'Program')} Picker`, desc: `Let user choose a ${getLabel('category_label', 'program').toLowerCase()} or service`, icon: "Building" },
  { key: "location_picker",label: `${getLabel('entity_label', 'Location')} Picker`,         desc: "Specific site or manual location input", icon: "MapPin" },
  { key: "message_input",  label: "Message Input",           desc: "Main description / feedback text", icon: "MessageSquare" },
  { key: "staff",          label: "Staff Selection",         desc: "Tag involved staff member(s)", icon: "User" },
  { key: "rating",         label: "Experience Rating",       desc: "Star rating 1–5", icon: "Star" },
  { key: "voice",          label: "Voice Recording",        desc: "Audio note from user", icon: "Mic" },
  { key: "attachments",    label: "Photo / Attachments",     desc: "File or photo upload", icon: "Paperclip" },
  { key: "anonymous",      label: "Anonymous Toggle",       desc: "Let user submit anonymously", icon: "EyeOff" },
];

// ── Normalize for safe rendering ──────────────────────────────────────────────
function normalizeConfig(config) {
  if (!config) return config;
  // Ensure all steps have an items array
  config.steps = (config.steps || []).map(s => ({
    ...s,
    items: s.items || []
  }));
  config.sections = config.sections || [];
  config.toggles  = config.toggles  || {};
  config.terminology = config.terminology || {};
  return config;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateConfig(config) {
  const errors = [];
  if (!config.steps || config.steps.length === 0) {
    errors.push("At least one step is required.");
  }
  const hasDetails = config.steps.some(s => s.id === "details" && s.enabled);
  if (!hasDetails) {
    errors.push("The 'Report Details' step (id: details) must exist and be enabled.");
  }
  // Soft warning for empty steps (not blocking)
  // config.steps.forEach((step, i) => {
  //   if (step.enabled && (!step.items || step.items.length === 0)) {
  //     errors.push(`Step ${i + 1} ("${step.label}") is enabled but has no items. Add at least one module or section.`);
  //   }
  // });
  // Detect duplicate section usage
  const usedSections = {};
  config.steps.forEach(step => {
    (step.items || []).forEach(item => {
      if (item.type === "section" && item.section_id) {
        if (usedSections[item.section_id]) {
          const sec = config.sections.find(s => s.id === item.section_id);
          errors.push(`Section "${sec?.title || item.section_id}" is used in more than one step. Each section can only appear once.`);
        }
        usedSections[item.section_id] = true;
      }
    });
  });
  return errors;
}

// ── Main Component ────────────────────────────────────────────────────────────
const AdminFormDesigner = ({ theme, darkMode, adminUser }) => {
  const { getLabel } = useTerminology();
  const MODULE_OPTIONS = getModuleOptions(getLabel);
  const [entities,      setEntities]      = useState([]);
  const [selectedEntId, setSelectedEntId] = useState("");
  const [config,        setConfig]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [isSaving,      setIsSaving]      = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const previewChannel = React.useRef(null);
  const lastBroadcast = React.useRef(0);

  React.useEffect(() => {
    previewChannel.current = new BroadcastChannel('form_preview_v1');
    previewChannel.current.onmessage = (e) => {
      if (e.data?.type === 'preview_ready' && config) {
        console.log("[Designer] Handshake received, sending current config...");
        sendUpdate(config, selectedEntId);
      }
    };
    return () => previewChannel.current?.close();
  }, [config, selectedEntId]);

  const sendUpdate = (currConfig, entId) => {
    if (!previewChannel.current || !currConfig) return;
    const version = Date.now();
    lastBroadcast.current = version;
    previewChannel.current.postMessage({ 
      type: 'config_update', 
      config: currConfig, 
      entity_id: entId,
      version: version,
      source: 'preview'
    });
  };

  useEffect(() => {
    if (!config) return;
    const timer = setTimeout(() => {
      sendUpdate(config, selectedEntId);
    }, 250); // Debounce
    return () => clearTimeout(timer);
  }, [config, selectedEntId]);

  const isGlobalAdmin = adminUser && !adminUser.entity_id;

  useEffect(() => {
    adminGetEntities()
      .then(data => {
        const visible = isGlobalAdmin ? data : data.filter(e => e.id === adminUser?.entity_id);
        setEntities(visible);
        if (visible.length > 0) setSelectedEntId(visible[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (config && previewChannel.current) {
      previewChannel.current.postMessage({ type: 'config_update', config, entity_id: selectedEntId });
    }
  }, [config, selectedEntId]);

  useEffect(() => {
    if (!selectedEntId) return;
    setLoading(true);
    getEntityFormConfig(selectedEntId)
      .then(data => setConfig(normalizeConfig(data)))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, [selectedEntId]);

  // ── Save ──
  const handleSave = async () => {
    const errors = validateConfig(config);
    if (errors.length > 0) {
      alert("Please fix the following issues before saving:\n\n• " + errors.join("\n• "));
      return;
    }
    setIsSaving(true);
    try {
      await updateEntityFormConfig(selectedEntId, config);
      alert("Configuration saved successfully!");
    } catch (e) {
      alert("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Step CRUD ──
  const addStep = () => {
    if ((config.steps || []).length >= 10) { alert("Maximum 10 steps allowed."); return; }
    const newStep = {
      id: `step_${Date.now()}`,
      label: "New Step",
      enabled: true,
      order: (config.steps || []).length + 1,
      items: []
    };
    const next = { ...config, steps: [...(config.steps || []), newStep] };
    setConfig(next);
    setExpandedSteps(prev => ({ ...prev, [newStep.id]: true }));
  };

  const removeStep = (sIdx) => {
    if (config.steps[sIdx].id === "details") {
      alert("The 'Report Details' step is mandatory and cannot be deleted.");
      return;
    }
    const newSteps = config.steps.filter((_, i) => i !== sIdx).map((s, i) => ({ ...s, order: i + 1 }));
    setConfig({ ...config, steps: newSteps });
  };

  const updateStep = (sIdx, key, val) => {
    const newSteps = [...config.steps];
    if (key === 'enabled' && newSteps[sIdx].id === 'details' && !val) {
      alert("The 'Report Details' step cannot be disabled.");
      return;
    }
    newSteps[sIdx] = { ...newSteps[sIdx], [key]: val };
    setConfig({ ...config, steps: newSteps });
  };

  const moveStep = (idx, dir) => {
    const steps = [...config.steps];
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    setConfig({ ...config, steps: steps.map((s, i) => ({ ...s, order: i + 1 })) });
  };

  // ── Item CRUD (within a step) ──
  const addModuleItem = (sIdx) => {
    const newSteps = [...config.steps];
    newSteps[sIdx] = {
      ...newSteps[sIdx],
      items: [...(newSteps[sIdx].items || []), { type: "module", key: "" }]
    };
    setConfig({ ...config, steps: newSteps });
  };

  const addSectionItem = (sIdx) => {
    const newSteps = [...config.steps];
    newSteps[sIdx] = {
      ...newSteps[sIdx],
      items: [...(newSteps[sIdx].items || []), { type: "section", section_id: "" }]
    };
    setConfig({ ...config, steps: newSteps });
  };

  const updateItem = (sIdx, iIdx, key, val) => {
    const newSteps = [...config.steps];
    const newItems = [...(newSteps[sIdx].items || [])];
    newItems[iIdx] = { ...newItems[iIdx], [key]: val };
    newSteps[sIdx] = { ...newSteps[sIdx], items: newItems };
    setConfig({ ...config, steps: newSteps });
  };

  const removeItem = (sIdx, iIdx) => {
    const newSteps = [...config.steps];
    newSteps[sIdx] = {
      ...newSteps[sIdx],
      items: (newSteps[sIdx].items || []).filter((_, i) => i !== iIdx)
    };
    setConfig({ ...config, steps: newSteps });
  };

  // ── Sections CRUD ──
  const addSection = () => {
    if ((config.sections || []).length >= 8) return;
    const newId = `section_${Date.now()}`;
    setConfig({ ...config, sections: [...(config.sections || []), { id: newId, title: "New Section", fields: [] }] });
  };

  const removeSection = (idx) => {
    const secId = config.sections[idx].id;
    // Remove from any step items first
    const newSteps = config.steps.map(step => ({
      ...step,
      items: (step.items || []).filter(item => !(item.type === "section" && item.section_id === secId))
    }));
    const newSections = config.sections.filter((_, i) => i !== idx);
    setConfig({ ...config, steps: newSteps, sections: newSections });
  };

  const updateSectionTitle = (idx, title) => {
    const s = [...config.sections];
    s[idx] = { ...s[idx], title };
    setConfig({ ...config, sections: s });
  };

  const addField = (sIdx) => {
    if ((config.sections[sIdx].fields || []).length >= 10) return;
    const sec = [...config.sections];
    sec[sIdx] = {
      ...sec[sIdx],
      fields: [...(sec[sIdx].fields || []), { id: `field_${Date.now()}`, label: "New Question", type: "text", required: false }]
    };
    setConfig({ ...config, sections: sec });
  };

  const removeField = (sIdx, fIdx) => {
    const sec = [...config.sections];
    sec[sIdx] = { ...sec[sIdx], fields: sec[sIdx].fields.filter((_, i) => i !== fIdx) };
    setConfig({ ...config, sections: sec });
  };

  const updateField = (sIdx, fIdx, key, val) => {
    const sec = [...config.sections];
    sec[sIdx].fields[fIdx] = { ...sec[sIdx].fields[fIdx], [key]: val };
    setConfig({ ...config, sections: sec });
  };

  const updateTerminology = (key, val) => {
    setConfig({ ...config, terminology: { ...config.terminology, [key]: val } });
  };

  // ── Helpers ──
  const toggleStepExpand = (id) => setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));

  const getSectionLabel = (section_id) => {
    const sec = (config?.sections || []).find(s => s.id === section_id);
    return sec ? sec.title : "Unknown Section";
  };

  const getModuleLabel = (key) => {
    const m = MODULE_OPTIONS.find(m => m.key === key);
    return m ? m.label : key;
  };

  const getUsedSectionIds = () => {
    const used = new Set();
    (config?.steps || []).forEach(step => {
      (step.items || []).forEach(item => {
        if (item.type === "section" && item.section_id) used.add(item.section_id);
      });
    });
    return used;
  };

  const validationErrors = config ? validateConfig(config) : [];

  if (loading && !entities.length) return <div style={{ padding: '20px', color: theme.textMuted }}>Loading entities...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px', animation: 'fadeIn 0.4s ease-out' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.surface, padding: '20px 24px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: theme.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>{Ico.Layers} Workflow Builder</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textMuted }}>Design multi-step {getLabel('feedback_label', 'feedback').toLowerCase()} workflows.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={selectedEntId} onChange={e => setSelectedEntId(e.target.value)} style={st.select(theme)}>
            {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
          </select>
          <button onClick={() => { if (config && previewChannel.current) previewChannel.current.postMessage({ type: 'config_update', config, entity_id: selectedEntId, version: Date.now(), source: 'preview' }); window.open(`/preview?preview=true&entity_id=${selectedEntId}`, '_blank'); }} style={st.btnSecondary(theme)}>
            {Ico.Eye} <span>Preview</span>
          </button>
          <button onClick={handleSave} disabled={isSaving} style={st.btnPrimary(isSaving)}>
            {isSaving ? "Saving…" : <>{Ico.Save} <span>Save</span></>}
          </button>
        </div>
      </div>

      {!config ? (
        <div style={{ textAlign: 'center', padding: '80px', color: theme.textMuted }}>
          {entities.length === 0 ? "No entities found. Create an entity first." : "Failed to load configuration."}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* ── LEFT: Stepper Workflow ── */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Validation Errors Banner */}
            {validationErrors.length > 0 && (
              <div style={{ background: '#FEF3C7', border: '1.5px solid #FCD34D', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13px', color: '#92400E' }}>
                  {Ico.AlertTriangle} Workflow Issues
                </div>
                {validationErrors.map((e, i) => <p key={i} style={{ margin: 0, fontSize: '12px', color: '#78350F' }}>• {e}</p>)}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: theme.text }}>Workflow Steps</h2>
              <button onClick={addStep} style={st.addBtn(theme)}>
                {Ico.Plus} Add Step
              </button>
            </div>

            {(config.steps || []).map((step, sIdx) => {
              const isExpanded = expandedSteps[step.id] !== false; // default open
              const isDetails  = step.id === "details";

              return (
                <div key={step.id} style={{ borderRadius: '14px', border: `1.5px solid ${step.enabled ? '#BFDBFE' : theme.border}`, background: step.enabled ? 'rgba(59,130,246,0.02)' : theme.bg, overflow: 'hidden', opacity: step.enabled ? 1 : 0.65 }}>

                  {/* Step Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: step.enabled ? 'rgba(59,130,246,0.06)' : '#F8FAFC', cursor: 'pointer' }} onClick={() => toggleStepExpand(step.id)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button onClick={e => { e.stopPropagation(); moveStep(sIdx, -1); }} disabled={sIdx === 0} style={st.arrowBtn(theme)}>{Ico.ChevronUp}</button>
                      <button onClick={e => { e.stopPropagation(); moveStep(sIdx, 1); }} disabled={sIdx === (config.steps.length - 1)} style={st.arrowBtn(theme)}>{Ico.ChevronDown}</button>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Step {sIdx + 1}{isDetails ? " · Required" : ""}
                        </span>
                        <span style={{ fontSize: '11px', color: theme.textMuted }}>
                          {(step.items || []).length} item{(step.items || []).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <input
                        value={step.label}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateStep(sIdx, 'label', e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', fontSize: '15px', fontWeight: '700', color: theme.text, width: '280px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={e => e.stopPropagation()}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: theme.textMuted, cursor: 'pointer' }}>
                        <input type="checkbox" checked={step.enabled} onChange={e => updateStep(sIdx, 'enabled', e.target.checked)} />
                        On
                      </label>
                      {!isDetails && (
                        <button onClick={() => removeStep(sIdx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}>{Ico.Trash}</button>
                      )}
                    </div>
                  </div>

                  {/* Step Body - Items */}
                  {isExpanded && (
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(step.items || []).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '16px', color: theme.textMuted, fontSize: '12px', border: `1.5px dashed ${theme.border}`, borderRadius: '10px' }}>
                          <div style={{ color: '#F59E0B', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            {Ico.AlertTriangle} Empty Step
                          </div>
                          No items yet. This step will be automatically skipped in the form. Add a module or section below.
                        </div>
                      )}

                      {(step.items || []).map((item, iIdx) => (
                        <div key={iIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: theme.surface, border: `1px solid ${theme.border}` }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: item.type === 'module' ? '#3B82F6' : '#8B5CF6', minWidth: '55px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {item.type === 'module' ? <>{Ico.Box} Mod</> : <>{Ico.Grid} Sec</>}
                          </span>

                          {item.type === 'module' ? (
                            <select
                              value={item.key || ""}
                              onChange={e => updateItem(sIdx, iIdx, 'key', e.target.value)}
                              style={{ ...st.selectSm(theme), flex: 1 }}
                            >
                              <option value="">Select Module…</option>
                              {MODULE_OPTIONS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                            </select>
                          ) : (
                            <select
                              value={item.section_id || ""}
                              onChange={e => updateItem(sIdx, iIdx, 'section_id', e.target.value)}
                              style={{ ...st.selectSm(theme), flex: 1 }}
                            >
                              <option value="">Select Section…</option>
                              {(config.sections || []).map(sec => (
                                <option key={sec.id} value={sec.id}>{sec.title}</option>
                              ))}
                            </select>
                          )}

                          {item.type === 'module' && item.key && (
                            <span style={{ fontSize: '11px', color: theme.textMuted, whiteSpace: 'nowrap' }}>
                              {MODULE_OPTIONS.find(m => m.key === item.key)?.desc || ""}
                            </span>
                          )}

                          <button onClick={() => removeItem(sIdx, iIdx)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '2px', flexShrink: 0 }}>{Ico.Trash}</button>
                        </div>
                      ))}

                      {/* Add item buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button onClick={() => addModuleItem(sIdx)} style={st.addItemBtn('#3B82F6', '#EFF6FF')}>
                          {Ico.Box} Add Module
                        </button>
                        <button onClick={() => addSectionItem(sIdx)} disabled={(config.sections || []).length === 0} title={(config.sections || []).length === 0 ? "Create a section first in the panel on the right" : ""} style={st.addItemBtn('#8B5CF6', '#F5F3FF')}>
                          {Ico.Grid} Add Section
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Sections Library + Terminology ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '300px' }}>

            {/* Section Library */}
            <div style={{ background: theme.surface, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.text }}>Section Library</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: theme.textMuted }}>Create reusable field groups, then add to steps.</p>
                </div>
                <button onClick={addSection} disabled={(config.sections || []).length >= 8} style={st.addBtn(theme)}>{Ico.Plus} New</button>
              </div>

              {(config.sections || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: theme.textMuted, fontSize: '12px', border: `1.5px dashed ${theme.border}`, borderRadius: '10px' }}>
                  No sections yet. Click "New" to create one.
                </div>
              )}

              {(config.sections || []).map((section, sIdx) => {
                const isUsed = getUsedSectionIds().has(section.id);
                return (
                  <div key={section.id} style={{ marginBottom: '12px', borderRadius: '12px', border: `1.5px solid ${isUsed ? '#DDD6FE' : theme.border}`, background: isUsed ? 'rgba(139,92,246,0.03)' : theme.bg, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${theme.border}` }}>
                      <input
                        value={section.title}
                        onChange={e => updateSectionTitle(sIdx, e.target.value)}
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontWeight: '700', fontSize: '13px', color: theme.text }}
                      />
                      {isUsed && <span style={{ fontSize: '9px', background: '#DDD6FE', color: '#6D28D9', padding: '2px 6px', borderRadius: '6px', fontWeight: '800' }}>IN USE</span>}
                      <button onClick={() => removeSection(sIdx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}>{Ico.Trash}</button>
                    </div>
                    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(section.fields || []).map((field, fIdx) => (
                        <div key={field.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            value={field.label}
                            onChange={e => updateField(sIdx, fIdx, 'label', e.target.value)}
                            placeholder="Question label"
                            style={{ flex: 1, ...st.inputSm(theme) }}
                          />
                          <select value={field.type} onChange={e => updateField(sIdx, fIdx, 'type', e.target.value)} style={st.inputSm(theme)}>
                            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: theme.textMuted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={field.required} onChange={e => updateField(sIdx, fIdx, 'required', e.target.checked)} /> Req
                          </label>
                          <button onClick={() => removeField(sIdx, fIdx)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 0 }}>{Ico.Trash}</button>
                        </div>
                      ))}
                      <button onClick={() => addField(sIdx)} disabled={(section.fields || []).length >= 10} style={{ ...st.addItemBtn('#6B7280', '#F9FAFB'), fontSize: '11px' }}>
                        {Ico.Plus} Add Question
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Terminology */}
            <div style={{ background: theme.surface, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '800', color: theme.text }}>Experience Branding</h3>
              <p style={{ margin: '0 0 14px', fontSize: '11px', color: theme.textMuted }}>Rename system labels to match your industry.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={st.label(theme)}>{getLabel('category_label', 'Program')} Label Override (current: {getLabel('category_label', 'Program')})</label>
                  <input value={config.terminology?.entity_label || ""} placeholder={getLabel('category_label', 'Program')} onChange={e => updateTerminology('entity_label', e.target.value)} style={st.input(theme)} />
                </div>
                <div>
                  <label style={st.label(theme)}>{getLabel('entity_label', 'Location')} Label Override (current: {getLabel('entity_label', 'Location')})</label>
                  <input value={config.terminology?.location_label || ""} placeholder={getLabel('entity_label', 'Location')} onChange={e => updateTerminology('location_label', e.target.value)} style={st.input(theme)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

// ── Style Helpers ─────────────────────────────────────────────────────────────
const st = {
  select:      (t) => ({ padding: '8px 14px', borderRadius: '10px', border: `1.5px solid ${t.border}`, background: t.bg, color: t.text, fontSize: '13px', fontWeight: '600', outline: 'none', cursor: 'pointer' }),
  selectSm:    (t) => ({ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'white', color: t.text, fontSize: '12px', outline: 'none' }),
  input:       (t) => ({ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '9px', border: `1.5px solid ${t.border}`, background: t.bg, color: t.text, fontSize: '13px', outline: 'none' }),
  inputSm:     (t) => ({ padding: '6px 10px', borderRadius: '7px', border: `1px solid ${t.border}`, background: 'white', color: t.text, fontSize: '12px', outline: 'none' }),
  label:       (t) => ({ display: 'block', fontSize: '11px', fontWeight: '700', color: t.textMuted, marginBottom: '5px' }),
  btnPrimary:  (isLoading) => ({ padding: '9px 18px', borderRadius: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: isLoading ? 0.7 : 1 }),
  btnSecondary:(t) => ({ padding: '9px 16px', borderRadius: '10px', background: t.surface, color: t.text, border: `1.5px solid ${t.border}`, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }),
  addBtn:      (t) => ({ background: 'none', border: `1.5px dashed ${t.border}`, borderRadius: '9px', padding: '6px 12px', color: 'var(--primary-color)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }),
  addItemBtn:  (color, bg) => ({ flex: 1, padding: '7px 10px', borderRadius: '8px', border: `1.5px dashed ${color}30`, background: bg, color: color, fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }),
  arrowBtn:    (t) => ({ border: 'none', background: 'none', cursor: 'pointer', padding: '1px', color: t.textMuted, display: 'flex' }),
};

export default AdminFormDesigner;
