import React, { useState, useEffect } from "react";
import { useTerminology } from "../../../context/TerminologyContext";
import {
  adminGetEntities,
  getEntityFormConfig,
  updateEntityFormConfig,
  getSystemLabels,
  adminGetWorkflowTemplates,
  adminCreateWorkflowTemplate,
  adminUpdateWorkflowTemplate,
  adminDeleteWorkflowTemplate
} from "../../../services/adminApi";
import GeneralFeedback from "../../GeneralFeedback";
import { IconRegistry } from "../../IconRegistry";
import CustomModal from "../../CustomModal";

// --- UI Constants ---
const st = {
  select: (t) => ({ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.bg, color: t.text, outline: 'none' }),
  input: (t) => ({ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontSize: '13px', outline: 'none', lineHeight: '1.4' }),

  // Base button style for consistency
  btnBase: (t) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    height: '36px', padding: '0 16px', borderRadius: '10px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
    outline: 'none', whiteSpace: 'nowrap'
  }),

  btnPrimary: (isLoading) => ({
    ...st.btnBase({}), background: 'var(--primary-color)', color: 'white',
    opacity: isLoading ? 0.7 : 1, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }),
  btnOutline: (t) => ({
    ...st.btnBase(t), background: 'none', border: `1.5px solid ${t.border}`, color: t.text
  }),
  btnTertiary: (t) => ({
    ...st.btnBase(t), background: 'none', border: `1.5px dashed ${t.border}`, color: t.textMuted
  }),
  btnGhost: (t) => ({
    ...st.btnBase(t), background: 'none', color: t.textMuted, padding: '0 12px'
  }),

  addBtn: (t) => ({ background: 'none', border: `1px dashed ${t.border}`, borderRadius: '10px', padding: '8px 16px', color: 'var(--primary-color)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }),
  addItemBtn: (color, bg) => ({ flex: 1, padding: '8px 12px', borderRadius: '10px', border: `1.5px dashed ${color}30`, background: bg, color, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }),
  libraryBtn: (t) => ({ padding: '12px 10px', borderRadius: '12px', background: 'white', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', height: '100%' }),
  librarySearch: (t) => ({ width: '100%', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${t.border}`, background: 'white', fontSize: '12px', marginBottom: '12px', outline: 'none' }),
  toggle: (active) => ({ width: '28px', height: '14px', borderRadius: '20px', background: active ? 'var(--primary-color)' : '#E2E8F0', position: 'relative', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-block' }),
  toggleKnob: (active) => ({ width: '10px', height: '10px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: active ? '16px' : '2px', transition: 'all 0.2s' }),

  segmentedControl: (t) => ({ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '10px', border: `1px solid ${t.border}`, height: '36px', boxSizing: 'border-box' }),
  segment: (active, t) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 16px', borderRadius: '8px', background: active ? 'white' : 'transparent',
    color: active ? 'var(--primary-color)' : t.textMuted, fontSize: '14px', fontWeight: '600',
    border: 'none', cursor: 'pointer', transition: 'all 0.2s', height: '100%',
    boxShadow: active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
  })
};

const Ico = {
  Plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  ChevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  ChevronUp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>,
  Save: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
  Eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  Layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  Box: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>,
  Grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  Check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  AlertTriangle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  User: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Mic: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  Paperclip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>,
  EyeOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  MapPin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  MessageSquare: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  Building: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12" y2="18" /><line x1="9" y1="14" x2="9" y2="14" /><line x1="15" y1="14" x2="15" y2="14" /><line x1="12" y1="10" x2="12" y2="10" /><line x1="9" y1="6" x2="9" y2="6" /><line x1="15" y1="6" x2="15" y2="6" /></svg>,
  Smile: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
  Sliders: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="2" y1="14" x2="6" y2="14" /><line x1="10" y1="12" x2="14" y2="12" /><line x1="18" y1="16" x2="22" y2="16" /></svg>,
  Type: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>,
  FileText: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  Users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M7 21v-2a4 4 0 0 1 3-3.87" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><circle cx="19" cy="7" r="4" /></svg>,
  List: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  Phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  Hash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>,
  Home: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Globe: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  Search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Unlock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>,
  ArrowRight: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  X: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Undo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>,
  RotateCcw: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>,
};

const FIELD_TYPES = [
  { value: "text", label: "Text Field" },
  { value: "dropdown", label: "Dropdown Menu" },
  { value: "rating", label: "Star Rating" },
  { value: "number", label: "Number Input" },
  { value: "date", label: "Date Picker" }
];

// ── Premium Entity Selector ──────────────────────────────────────────────────
const PremiumEntitySelector = ({ entities, selectedId, onSelect, theme, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef(null);
  const activeEntity = entities.find(e => e.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = entities.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', borderRadius: '12px',
          height: '40px', border: `1.5px solid ${isOpen ? 'var(--primary-color)' : theme.border}`,
          background: theme.surface, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', minWidth: '180px'
        }}
      >
        <div style={{ color: 'var(--primary-color)', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
          {(() => {
            const Icon = IconRegistry[activeEntity?.icon] || IconRegistry.default;
            return Icon ? <Icon width="16" height="16" strokeWidth="2.5" /> : Ico.Building;
          })()}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '8px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1' }}>Active Program</div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: theme.text, lineHeight: '1.2' }}>{activeEntity?.name || "Select..."}</div>
        </div>
        <div style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', display: 'flex', alignItems: 'center' }}>{Ico.ChevronDown}</div>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '260px', background: theme.surface,
          borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          zIndex: 1000, overflow: 'hidden', animation: 'fadeIn 0.2s ease'
        }}>
          {entities.length > 5 && (
            <div style={{ padding: '12px', borderBottom: `1px solid ${theme.border}` }}>
              <input
                placeholder="Search entities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...st.input(theme), padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
          )}
          <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '6px' }}>
            <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' }}>Select Entity</div>
            {filtered.map(ent => (
              <button
                key={ent.id}
                onClick={() => { onSelect(ent.id); setIsOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px',
                  border: 'none', background: ent.id === selectedId ? 'rgba(59,130,246,0.08)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: '0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = ent.id === selectedId ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = ent.id === selectedId ? 'rgba(59,130,246,0.08)' : 'transparent'}
              >
                <div style={{ color: ent.id === selectedId ? 'var(--primary-color)' : theme.textMuted, opacity: 0.7, display: 'flex', alignItems: 'center' }}>
                  {(() => {
                    const Icon = IconRegistry[ent.icon] || IconRegistry.default;
                    return Icon ? <Icon width="14" height="14" /> : Ico.Building;
                  })()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: ent.id === selectedId ? 'var(--primary-color)' : theme.text }}>{ent.name}</div>
                  <div style={{ fontSize: '10px', color: theme.textMuted }}>{ent.id === selectedId ? "Currently editing" : "Service Provider"}</div>
                </div>
                {ent.id === selectedId && <div style={{ color: 'var(--primary-color)' }}>{Ico.Check}</div>}
              </button>
            ))}
            {filtered.length === 0 && <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: theme.textMuted }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const MODULE_OPTIONS = [
  {
    group: 'RATINGS', items: [
      { key: 'star_rating', label: 'Star Rating', desc: '1-5 Star feedback', icon: Ico.Star },
      { key: 'emoji_rating', label: 'Emoji Rating', desc: 'Feeling based feedback', icon: Ico.Smile },
      { key: 'slider_scale', label: 'Slider Scale', desc: 'Percentage or 1-100', icon: Ico.Sliders },
      { key: 'rating_matrix', label: 'Rating Matrix', desc: 'TER-style 1-5 evaluation', icon: Ico.Grid },
    ]
  },
  {
    group: 'IDENTITIES', items: [
      { key: 'full_name', label: 'Full Name', desc: 'Citizen identity name', icon: Ico.User },
      { key: 'contact_number', label: 'Contact Number', desc: 'Mobile/Phone number', icon: Ico.Phone },
      { key: 'email_address', label: 'Email Address', desc: 'Verification email', icon: Ico.Mail },
      { key: 'mailing_address', label: 'Home Address', desc: 'Physical location', icon: Ico.Home },
    ]
  },
  {
    group: 'INPUT', items: [
      { key: 'short_text', label: 'Short Answer', desc: 'Single line text', icon: Ico.Type },
      { key: 'long_text', label: 'Long Answer', desc: 'Comment/Details box', icon: Ico.FileText },
      { key: 'number_input', label: 'Numbers Only', desc: 'Numeric values', icon: Ico.Hash },
      { key: 'multiple_choice', label: 'Multiple Choice', desc: 'Radio selections', icon: Ico.List },
    ]
  },
  {
    group: 'MEDIA', items: [
      { key: 'photo_upload', label: 'Photo Upload', desc: 'Snap or upload image', icon: Ico.Camera },
      { key: 'voice_record', label: 'Voice Recording', desc: 'Speak your feedback', icon: Ico.Mic },
    ]
  },
  {
    group: 'SYSTEM', items: [
      { key: 'entity_picker', label: 'Service Selection', desc: 'Select Service (Required)', icon: Ico.Globe },
      { key: 'location_picker', label: 'Location Picker', desc: 'Select Branch/Office', icon: Ico.MapPin },
      { key: 'staff_mention', label: 'Staff Mention', desc: 'Tag specific staff', icon: Ico.Users },
    ]
  }
];

// ── Normalize for safe rendering ──────────────────────────────────────────────
function normalizeConfig(config) {
  if (!config) return config;
  
  // Create a flat map of default module labels for quick lookup
  const defaultLabels = {};
  MODULE_OPTIONS.forEach(group => {
    group.items.forEach(item => {
      defaultLabels[item.key] = item.label;
    });
  });

  config.steps = (config.steps || []).map((s, idx) => {
    const norm = { 
      ...s, 
      items: (s.items || []).map(it => ({
        ...it,
        label_override: it.label_override || defaultLabels[it.key] || "New Interaction"
      }))
    };
    return norm;
  });
  
  config.sections = config.sections || [];
  config.toggles = config.toggles || {};
  config.terminology = config.terminology || {};
  config.layout_mode = config.layout_mode || 'custom';
  return config;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateConfig(config) {
  const errors = [];
  if (!config.steps || config.steps.length === 0) {
    errors.push("Workflow is empty. Add at least one step.");
  }
  config.steps.forEach((step, i) => {
    if (step.enabled && (!step.items || step.items.length === 0)) {
      errors.push(`Empty Step: Step ${i + 1} ("${step.label}") has no interactions. It will be skipped.`);
    }
  });
  return errors;
}

function AdminFormDesigner({ theme, darkMode, adminUser }) {
  const { getLabel } = useTerminology();
  const [entities, setEntities] = useState([]);
  const [selectedEntId, setSelectedEntId] = useState("");
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [showGallery, setShowGallery] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [previewTpl, setPreviewTpl] = useState(null);
  const [isSavingTpl, setIsSavingTpl] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Default to Design mode
  const [isLoadingTpl, setIsLoadingTpl] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // { sIdx, itIdx }
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [searchTerm, setSearchTerm] = useState("");
  const [initialConfig, setInitialConfig] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null); // Track if current config is based on a template
  const [galleryFilter, setGalleryFilter] = useState('ALL');
  const [history, setHistory] = useState([]);
  const previewChannel = React.useRef(null);

  useEffect(() => {
    if (!config || !initialConfig) {
      setIsDirty(false);
      return;
    }
    // Deep comparison for dirtiness
    const isChanged = JSON.stringify(config) !== JSON.stringify(initialConfig);
    setIsDirty(isChanged);
  }, [config, initialConfig]);

  React.useEffect(() => {
    previewChannel.current = new BroadcastChannel('form_preview_v1');
    return () => previewChannel.current?.close();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    adminGetEntities()
      .then(data => {
        const visible = !adminUser?.entity_id ? data : data.filter(e => e.id === adminUser.entity_id);
        setEntities(visible);
        if (visible.length > 0) setSelectedEntId(visible[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEntId) return;
    setLoading(true);
    // Clear old state to prevent data leakage between entities
    setConfig(null);
    setInitialConfig(null);
    setSelectedItem(null);
    setExpandedSteps({});

    getEntityFormConfig(selectedEntId)
      .then(data => {
        const norm = normalizeConfig(data);
        const draftKey = `form_draft_${selectedEntId}`;
        const savedDraft = localStorage.getItem(draftKey);
        
        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            const isDifferent = JSON.stringify(parsedDraft) !== JSON.stringify(norm);
            if (isDifferent) {
              setModal({
                isOpen: true,
                title: "Draft Recovery",
                message: "We found an unsaved draft from your previous session. Would you like to restore it?",
                type: "confirm",
                confirmText: "Restore Draft",
                cancelText: "Discard Draft",
                onConfirm: () => {
                  setConfig(parsedDraft);
                  setInitialConfig(norm);
                  setModal({ isOpen: false });
                },
                onCancel: () => {
                  localStorage.removeItem(draftKey);
                  setConfig(norm);
                  setInitialConfig(JSON.parse(JSON.stringify(norm)));
                  setModal({ isOpen: false });
                }
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem(draftKey);
          }
        }

        setConfig(norm);
        setInitialConfig(JSON.parse(JSON.stringify(norm)));
      })
      .catch(() => { setConfig(null); setInitialConfig(null); })
      .finally(() => setLoading(false));
  }, [selectedEntId]);

  useEffect(() => {
    if (config && selectedEntId && isDirty) {
      localStorage.setItem(`form_draft_${selectedEntId}`, JSON.stringify(config));
    }
  }, [config, selectedEntId, isDirty]);

  useEffect(() => {
    if (config && previewChannel.current) {
      previewChannel.current.postMessage({
        type: 'config_update',
        config: normalizeConfig({ ...config }),
        entity_id: selectedEntId
      });
    }
  }, [config, selectedEntId]);

  // Handle history snapshots
  const pushHistory = (newConfig) => {
    setHistory(prev => {
      const next = [JSON.stringify(config), ...prev].slice(0, 20); // Keep last 20
      return next;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[0];
    setHistory(history.slice(1));
    setConfig(JSON.parse(prev));
  };

  const handleReset = () => {
    setModal({
      isOpen: true,
      title: "Reset Interaction Flow?",
      message: "This will remove all custom steps and reset to a clean slate. This action cannot be undone.",
      type: "confirm",
      confirmText: "Reset to Zero",
      isDestructive: true,
      onConfirm: () => {
        pushHistory(config);
        const resetConfig = {
          ...config,
          steps: [{
            id: `step_${Date.now()}`,
            label: "Service Selection",
            enabled: true,
            items: [{
              id: `mod_init_${Date.now()}`,
              type: "module",
              key: "entity_picker",
              label_override: "Select Service",
              required: true,
              config: {}
            }]
          }]
        };
        setConfig(resetConfig);
        setModal({ isOpen: false });
      }
    });
  };

  const handleSave = async () => {
    const errors = validateConfig(config);
    const hasErrors = errors.length > 0;

    // Validation Checklist for Modal
    const totalModules = config.steps.reduce((acc, s) => acc + (s.items?.length || 0), 0);
    const hasRouting = config.steps[0]?.items?.some(it => it.key === 'entity_picker');
    const emptySteps = config.steps.filter((s, i) => i > 0 && s.enabled && (!s.items || s.items.length === 0));

    const validationContent = (
      <div style={{ textAlign: 'left', marginTop: '16px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: '11px', fontWeight: '900', color: theme.textMuted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deployment Checklist</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <div style={{ color: hasRouting ? '#10B981' : theme.textMuted }}>{hasRouting ? Ico.Check : Ico.Minus}</div>
            <span style={{ fontWeight: '600', color: hasRouting ? theme.text : theme.textMuted }}>
              Service Selection: {hasRouting ? 'Included' : 'Direct (Single Service)'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <div style={{ color: totalModules > 0 ? '#10B981' : '#EF4444' }}>{totalModules > 0 ? Ico.Check : Ico.AlertTriangle}</div>
            <span style={{ fontWeight: '600', color: theme.text }}>{totalModules} Interaction modules configured</span>
          </div>
          {totalModules > 0 && !config.steps.some(s => s.items?.some(it => ['star_rating', 'emoji_rating', 'rating_matrix', 'rating'].includes(it.key))) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', background: 'rgba(234, 179, 8, 0.05)', padding: '8px', borderRadius: '8px', marginTop: '4px' }}>
              <div style={{ color: '#EAB308' }}>{Ico.AlertTriangle}</div>
              <span style={{ fontWeight: '600', color: '#854D0E', fontSize: '12px' }}>
                Suggestion: Adding a rating helps measure satisfaction.
              </span>
            </div>
          )}
          {emptySteps.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <div style={{ color: '#EAB308' }}>{Ico.AlertTriangle}</div>
              <span style={{ fontWeight: '600', color: '#EAB308' }}>{emptySteps.length} steps require content</span>
            </div>
          )}
        </div>
      </div>
    );

    setModal({
      isOpen: true,
      title: "Deploy Interaction Flow?",
      message: `You are about to push this workflow to live for ${entities.find(e => e.id === selectedEntId)?.name}.`,
      content: validationContent,
      type: hasErrors ? "warning" : "confirm",
      confirmText: hasErrors ? "Resolve Issues" : "Deploy Flow",
      onConfirm: async () => {
        if (hasErrors) {
          setModal({ isOpen: false });
          return;
        }
        setIsSaving(true);
        try {
          await updateEntityFormConfig(selectedEntId, config);
          localStorage.removeItem(`form_draft_${selectedEntId}`);
          setInitialConfig(JSON.parse(JSON.stringify(config)));
          setIsDirty(false);
          setModal({ isOpen: false });
          setTimeout(() => {
            setModal({ isOpen: true, title: "Success", message: "Workflow is now live!", type: "success" });
          }, 300);
        } catch (e) {
          setModal({ isOpen: true, title: "Error", message: "Failed to deploy configuration.", type: "warning" });
        } finally {
          setIsSaving(false);
        }
      }
    });
  };


  const getDefaultItem = (key) => {
    const module = MODULE_OPTIONS.flatMap(g => g.items).find(m => m.key === key);
    let defaultLabel = module?.label || "New Question";
    
    // Smart Defaults
    if (key === 'star_rating') defaultLabel = "How would you rate your overall experience?";
    if (key === 'emoji_rating') defaultLabel = "How do you feel about our service today?";
    if (key === 'long_text') defaultLabel = "Please share any additional comments or suggestions.";
    if (key === 'multiple_choice') defaultLabel = "Which service did you use?";
    if (key === 'rating_matrix') defaultLabel = "Please evaluate the following criteria:";
    if (key === 'full_name') defaultLabel = "May we know your name? (Optional)";

    return {
      id: `it_${Date.now()}`,
      type: 'module',
      key,
      label_override: defaultLabel,
      required: false,
      config: {
        options: ['Option 1', 'Option 2'],
        criteria: ['Staff Professionalism', 'Cleanliness', 'Response Time'],
        placeholder: "Type your answer here...",
        min: 1,
        max: 5
      }
    };
  };

  const addStep = () => {
    const isFirst = !config.steps || config.steps.length === 0;
    const getSuggestedName = () => {
      const count = (config.steps || []).length;
      return `Interaction Step ${count + 1}`;
    };

    const newStep = {
      id: `step_${Date.now()}`,
      label: getSuggestedName(),
      enabled: true,
      items: isFirst ? [{
        id: `mod_init_${Date.now()}`,
        type: "module",
        key: "entity_picker",
        label_override: "Select Service",
        required: true,
        config: {}
      }] : []
    };
    pushHistory(config);
    setConfig({ ...config, steps: [...(config.steps || []), newStep] });
    setExpandedSteps(prev => ({ ...prev, [newStep.id]: true }));
  };

  const removeStep = (sIdx) => {
    if (config.steps.length <= 1) {
      setModal({
        isOpen: true,
        title: "Minimum Step Required",
        message: "You must have at least one step in your workflow to collect feedback.",
        type: "alert"
      });
      return;
    }
    pushHistory(config);
    const steps = config.steps.filter((_, i) => i !== sIdx);
    setConfig({ ...config, steps });
    setSelectedItem(null);
  };

  const updateStep = (sIdx, key, val) => {
    pushHistory(config);
    const steps = [...config.steps];
    steps[sIdx] = { ...steps[sIdx], [key]: val };
    setConfig({ ...config, steps });
  };

  const addModuleItem = (sIdx, key) => {
    if (config.steps[sIdx]?.locked) return; // Prevent adding if locked
    const steps = [...config.steps];
    const newItem = getDefaultItem(key);

    pushHistory(config);
    steps[sIdx].items = [...(steps[sIdx].items || []), newItem];
    setConfig({ ...config, steps });
    setSelectedItem({ sIdx, itIdx: steps[sIdx].items.length - 1 });
  };

  const updateItem = (sIdx, iIdx, key, val) => {
    if (config.steps[sIdx]?.locked) return; // Prevent updates if locked
    pushHistory(config);
    const steps = [...config.steps];
    const items = [...steps[sIdx].items];
    items[iIdx] = { ...items[iIdx], [key]: val };
    steps[sIdx].items = items;
    setConfig({ ...config, steps });
  };

  const removeItem = (sIdx, iIdx) => {
    if (config.steps[sIdx]?.locked) return; // Prevent removal if locked
    pushHistory(config);
    const steps = [...config.steps];
    steps[sIdx].items = steps[sIdx].items.filter((_, i) => i !== iIdx);
    setConfig({ ...config, steps });
  };

  const updateTerminology = (key, val) => {
    setConfig({ ...config, terminology: { ...config.terminology, [key]: val } });
  };

  const updateTheme = (key, val) => {
    setConfig({ ...config, theme: { ...config.theme, [key]: val } });
  };

  const handleLayoutModeChange = (mode) => {
    if (mode === 'smart') {
      setModal({
        isOpen: true,
        title: "Switch to Smart Layout?",
        message: "Smart Layout automatically reorganizes modules into logical groups (Experience, Feedback, Info) to improve the user journey. Your original configuration remains untouched.",
        type: "confirm",
        confirmText: "Apply Smart Layout",
        onConfirm: () => {
          setConfig({ ...config, layout_mode: 'smart' });
          setModal({ isOpen: false });
        }
      });
    } else {
      setConfig({ ...config, layout_mode: 'custom' });
    }
  };

  const handleUseTemplate = async () => {
    await fetchTemplates();
    setShowGallery(true);
  };

  const fetchTemplates = async () => {
    setIsLoadingTpl(true);
    try {
      const data = await adminGetWorkflowTemplates();
      setTemplates(data);
    } catch (e) {
      console.error("Templates load failed");
      setModal({ isOpen: true, title: "Error", message: "Could not load templates.", type: "warning" });
    } finally {
      setIsLoadingTpl(false);
    }
  };

  const getTemplateBadge = (tpl) => {
    if (tpl.is_system) return { label: 'SYSTEM', color: '#6366F1', bg: 'rgba(99,102,241,0.1)', icon: Ico.Lock };
    if (tpl.is_global) return { label: 'ORG', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: Ico.Building };
    if (tpl.entity_id) return { label: 'PROGRAM', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Ico.Box };
    return { label: 'PRIVATE', color: '#64748B', bg: 'rgba(100,116,139,0.1)', icon: Ico.Lock };
  };

  const applyTemplate = (tpl) => {
    if (!tpl) return;
    const newConfig = JSON.parse(JSON.stringify(tpl.config));
    setConfig(newConfig);
    // Removed setInitialConfig to allow 'Deploy' button to activate relative to program's original config
    setShowGallery(false);
    setModal({
      isOpen: true,
      title: "Template Applied",
      message: "Template successfully applied. You can now customize this workflow.",
      type: "success"
    });
  };

  const executeSaveTemplate = async (name, category) => {
    setIsSavingTpl(true);
    try {
      await adminCreateWorkflowTemplate({
        name,
        description: "Custom template created by workspace admin.",
        category,
        config: config,
        is_global: false,
        is_system: false,
        entity_id: selectedEntId || null,
        version: 1
      });
      setModal({ isOpen: true, title: "Success", message: "New template saved to library!", type: "success" });
      fetchTemplates();
    } catch (e) {
      setModal({ isOpen: true, title: "Error", message: "Failed to save template.", type: "warning" });
    } finally {
      setIsSavingTpl(false);
    }
  };

  const executeUpdateTemplate = async (tpl) => {
    setIsSavingTpl(true);
    try {
      await adminUpdateWorkflowTemplate(tpl.id, {
        config: config
      });
      setModal({ isOpen: true, title: "Success", message: "Template updated!", type: "success" });
      fetchTemplates();
    } catch (e) {
      setModal({ isOpen: true, title: "Error", message: "Failed to update template.", type: "warning" });
    } finally {
      setIsSavingTpl(false);
    }
  };

  const saveAsTemplate = async () => {
    console.log("SAVE AS TEMPLATE CLICKED - VERSION 2");
    await fetchTemplates(); // Ensure we have latest list
    const editableTemplates = templates.filter(t => !t.is_system);

    setModal({
      isOpen: true,
      title: "Save as Template",
      message: "Define a name and category for this organizational standard.",
      type: "confirm",
      confirmText: "Save Template",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Template Name</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input
                id="modal-tpl-name"
                list="tpl-datalist"
                placeholder="e.g., Q1 Service Evaluation"
                style={{ ...st.input(theme), paddingRight: '40px' }}
                autoFocus
                onInput={(e) => {
                  const val = e.target.value;
                  const tpl = editableTemplates.find(t => t.name.toLowerCase() === val.toLowerCase());
                  const confirmBtn = document.querySelector('[data-modal-confirm]');
                  
                  if (tpl) {
                    const catEl = document.getElementById('modal-tpl-cat');
                    if (catEl) catEl.value = tpl.category || "General";
                    if (confirmBtn) confirmBtn.innerText = "Overwrite Template";
                  } else {
                    if (confirmBtn) confirmBtn.innerText = "Save Template";
                  }
                }}
              />
              <datalist id="tpl-datalist">
                {editableTemplates.map(t => <option key={t.id} value={t.name} />)}
              </datalist>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: theme.textMuted, opacity: 0.5 }}>
                {Ico.ChevronDown}
              </div>
            </div>
            {editableTemplates.length > 0 && (
              <p style={{ margin: '6px 0 0', fontSize: '10px', color: theme.textMuted, fontStyle: 'italic' }}>
                Tip: Type a name or select from the dropdown to overwrite an existing template.
              </p>
            )}
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
            <input
              id="modal-tpl-cat"
              defaultValue="General"
              placeholder="e.g., Healthcare, Retail"
              style={{ ...st.input(theme), marginTop: '6px' }}
            />
          </div>
        </div>
      ),
      onConfirm: async () => {
        const name = document.getElementById('modal-tpl-name')?.value;
        const category = document.getElementById('modal-tpl-cat')?.value || "General";

        if (!name) {
          setModal({ isOpen: true, title: "Name Required", message: "Please provide a name for the template.", type: "warning" });
          return;
        }

        const targetTpl = editableTemplates.find(t => t.name.toLowerCase() === name.toLowerCase());

        if (targetTpl) {
          setModal({ isOpen: false });
          setModal({
            isOpen: true,
            title: "Confirm Overwrite",
            message: `A template named "${targetTpl.name}" already exists. Do you want to replace it with your current design?`,
            type: "confirm",
            confirmText: "Yes, Overwrite",
            onConfirm: () => {
              setModal({ isOpen: false });
              executeUpdateTemplate(targetTpl);
            }
          });
        } else {
          setModal({ isOpen: false });
          executeSaveTemplate(name, category);
        }
      }
    });
  };

  const handleEditTemplateStructure = (tpl) => {
    const startEditing = () => {
      applyTemplate(tpl);
      setEditingTemplateId(tpl.id);
      setShowGallery(false);
    };

    if (tpl.is_system) {
      setModal({ isOpen: true, title: "Protected Template", message: "System templates cannot be modified directly. Please save as a copy if you wish to customize it.", type: "info" });
      return;
    }

    if (tpl.created_by_id !== adminUser.id) {
      setModal({
        isOpen: true,
        title: "Shared Template",
        message: "You are editing a shared template. Changes will affect all users using this as a base. Would you like to save as a copy instead?",
        type: "confirm",
        confirmText: "Edit Original",
        onConfirm: () => { setModal({ isOpen: false }); startEditing(); },
        onCancel: () => { setModal({ isOpen: false }); handleCopyTemplate(tpl); }
      });
    } else {
      startEditing();
    }
  };

  const handleRenameTemplate = async (tpl) => {
    setModal({
      isOpen: true,
      title: "Rename Template",
      message: `Enter a new name for "${tpl.name}".`,
      type: "confirm",
      confirmText: "Rename",
      content: (
        <div style={{ marginTop: '8px' }}>
          <label style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Name</label>
          <input
            autoFocus
            defaultValue={tpl.name}
            id="modal-rename-input"
            style={{ ...st.input(theme), marginTop: '6px' }}
          />
        </div>
      ),
      onConfirm: async () => {
        const newName = document.getElementById('modal-rename-input')?.value;
        if (!newName || newName === tpl.name) {
          setModal({ isOpen: false });
          return;
        }
        try {
          await adminUpdateWorkflowTemplate(tpl.id, { name: newName });
          const updated = templates.map(t => t.id === tpl.id ? { ...t, name: newName } : t);
          setTemplates(updated);
          setPreviewTpl({ ...tpl, name: newName });
          setModal({ isOpen: false });
        } catch (e) {
          setModal({ isOpen: true, title: "Error", message: "Failed to rename.", type: "warning" });
        }
      }
    });
  };

  const handleCopyTemplate = async (tpl) => {
    setModal({
      isOpen: true,
      title: "Save as Copy",
      message: `Create a duplicate of "${tpl.name}".`,
      type: "confirm",
      confirmText: "Create Copy",
      content: (
        <div style={{ marginTop: '8px' }}>
          <label style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Copy Name</label>
          <input
            autoFocus
            defaultValue={`Copy of ${tpl.name}`}
            id="modal-copy-input"
            style={{ ...st.input(theme), marginTop: '6px' }}
          />
        </div>
      ),
      onConfirm: async () => {
        const copyName = document.getElementById('modal-copy-input')?.value;
        if (!copyName) return;
        try {
          await adminCreateWorkflowTemplate({
            name: copyName,
            description: tpl.description,
            category: tpl.category,
            config: tpl.config,
            is_global: false,
            version: tpl.version
          });
          setModal({ isOpen: false });
          fetchTemplates();
        } catch (e) {
          setModal({ isOpen: true, title: "Error", message: "Failed to copy.", type: "warning" });
        }
      }
    });
  };

  const handleDeleteTemplate = async (tpl) => {
    if (tpl.is_system) return;
    setModal({
      isOpen: true,
      title: "Delete Template?",
      message: `Are you sure you want to delete "${tpl.name}"? Deleting this template will not affect existing workflows already deployed.`,
      type: "confirm",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await adminDeleteWorkflowTemplate(tpl.id);
          fetchTemplates();
          setPreviewTpl(null);
          setModal({ isOpen: false });
        } catch (e) {
          setModal({ isOpen: true, title: "Error", message: "Failed to delete.", type: "warning" });
        }
      }
    });
  };

  const handleApplyTemplateFromGallery = () => {
    if (!previewTpl) return;

    const finalizeApply = () => {
      applyTemplate(previewTpl);
      setShowGallery(false);
    };

    if (isDirty) {
      setModal({
        isOpen: true,
        title: "Overwrite Current Work?",
        message: `Applying "${previewTpl.name}" will replace your current unsaved configuration. Continue?`,
        type: "confirm",
        confirmText: "Use Template",
        onConfirm: () => { setModal({ isOpen: false }); finalizeApply(); }
      });
    } else {
      finalizeApply();
    }
  };

  const toggleStepExpand = (id) => setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));

  const onDragStart = (e, sIdx, iIdx) => {
    e.dataTransfer.setData("itemIndex", JSON.stringify({ fromSIdx: sIdx, fromIIdx: iIdx }));
    e.currentTarget.style.opacity = '0.4';
  };

  const onDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const onLibraryDragStart = (e, moduleKey) => {
    e.dataTransfer.setData("newModuleKey", moduleKey);
  };

  const onDrop = (e, targetStepIdx, targetItemIdx = null) => {
    e.preventDefault();
    if (config.steps[targetStepIdx]?.locked) return; // Prevent drops if locked
    const itemIndexRaw = e.dataTransfer.getData('itemIndex');
    const newModuleKey = e.dataTransfer.getData('newModuleKey');

    const steps = [...config.steps];
    let itemToPlace = null;

    if (itemIndexRaw) {
      const { fromSIdx, fromIIdx } = JSON.parse(itemIndexRaw);
      itemToPlace = steps[fromSIdx].items[fromIIdx];
      steps[fromSIdx].items = steps[fromSIdx].items.filter((_, i) => i !== fromIIdx);
    } else if (newModuleKey) {
      itemToPlace = getDefaultItem(newModuleKey);
    }

    if (!itemToPlace) return;

    const targetItems = [...(steps[targetStepIdx].items || [])];
    const newIdx = targetItemIdx === null ? targetItems.length : targetItemIdx;
    
    if (targetItemIdx === null) targetItems.push(itemToPlace);
    else targetItems.splice(targetItemIdx, 0, itemToPlace);

    steps[targetStepIdx].items = targetItems;
    setConfig({ ...config, steps });
    setSelectedItem({ sIdx: targetStepIdx, itIdx: newIdx });
  };

  const onDragOver = (e) => {
    e.preventDefault();
    
    // Only apply highlight styles to actual drop targets (steps), not the main container
    if (e.currentTarget.dataset?.isStep) {
      e.currentTarget.style.borderColor = 'var(--primary-color)';
      e.currentTarget.style.background = 'rgba(59,130,246,0.02)';
    }

    // Auto-scroll logic: Scroll window if dragging near top/bottom edges
    const threshold = 120; // px from edge
    const speed = 25; // px per tick
    if (e.clientY < threshold) {
      window.scrollBy(0, -speed);
    } else if (e.clientY > window.innerHeight - threshold) {
      window.scrollBy(0, speed);
    }
  };

  const onDragLeave = (e) => {
    e.currentTarget.style.borderColor = theme.border;
    e.currentTarget.style.background = theme.surface;
  };

  if (loading && !entities.length) return <div style={{ padding: '20px', color: theme.textMuted }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>

      {/* ── Studio Header ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.surface,
        padding: '24px 32px', borderRadius: '20px', border: `1px solid ${theme.border}`,
        boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)', position: 'relative'
      }}>

        {/* LEFT: Context & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            {Ico.Layers}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: theme.text, letterSpacing: '-0.02em' }}>Studio</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted }}>Editing:</span>
              <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {(() => {
                  const ent = entities.find(e => e.id === selectedEntId);
                  const Icon = IconRegistry[ent?.icon] || IconRegistry.default;
                  return Icon ? <Icon width="12" height="12" /> : Ico.Building;
                })()}
                {entities.find(e => e.id === selectedEntId)?.name || "Select Service"}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: Context Toggles */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={st.segmentedControl(theme)}>
            <button onClick={() => setShowPreview(false)} style={st.segment(!showPreview, theme)}>Design</button>
            <button onClick={() => setShowPreview(true)} style={st.segment(showPreview, theme)}>Preview</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={saveAsTemplate} disabled={isSavingTpl} style={{ ...st.btnOutline(theme), height: '36px', padding: '0 12px' }}>
              {Ico.Save} <span style={{ marginLeft: '4px' }}>{isSavingTpl ? "..." : "Save"}</span>
            </button>
            <button onClick={handleUseTemplate} disabled={isLoadingTpl} style={{ ...st.btnOutline(theme), height: '36px', padding: '0 12px' }}>
              {Ico.Layers} <span style={{ marginLeft: '4px' }}>{isLoadingTpl ? "..." : "Template"}</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '32px', background: theme.border, opacity: 0.6 }} />

          <PremiumEntitySelector
            entities={entities}
            selectedId={selectedEntId}
            onSelect={setSelectedEntId}
            theme={theme}
            darkMode={darkMode}
          />

          <div style={{ width: '1px', height: '32px', background: theme.border, opacity: 0.6 }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', justifyContent: 'center', position: 'relative' }}>
            <button onClick={handleSave} disabled={isSaving || !isDirty} style={{ ...st.btnPrimary(isSaving || !isDirty), minWidth: '140px', height: '36px' }}>
              {isSaving ? "Deploying..." : "Deploy Flow"}
            </button>
            {isDirty && (
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#EAB308', display: 'flex', alignItems: 'center', gap: '4px', animation: 'fadeIn 0.3s ease', position: 'absolute', bottom: '-18px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EAB308' }} /> Changes not live yet
              </div>
            )}
          </div>
        </div>

        {/* Subtle Bottom Divider */}
        <div style={{ position: 'absolute', bottom: '-1px', left: '32px', right: '32px', height: '1px', background: `linear-gradient(to right, transparent, ${theme.border}, transparent)` }} />
      </div>

      {showGallery && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: theme.surface, width: '900px', height: '600px', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Workflow Template Library</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: theme.textMuted }}>Select a professional starting point for your interaction.</p>
              </div>
              <button onClick={() => setShowGallery(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.textMuted }}>×</button>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: '320px', borderRight: `1px solid ${theme.border}`, padding: '20px', overflowY: 'auto', background: 'rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' }}>Filter Discovery</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {['ALL', 'SYSTEM', 'ORG', 'PROGRAM', 'PRIVATE'].map(f => (
                      <button
                        key={f}
                        onClick={() => setGalleryFilter(f)}
                        style={{
                          fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', border: 'none',
                          background: galleryFilter === f ? 'var(--primary-color)' : theme.border,
                          color: galleryFilter === f ? 'white' : theme.textMuted, cursor: 'pointer'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {templates
                    .filter(tpl => {
                      if (galleryFilter === 'ALL') return true;
                      if (galleryFilter === 'SYSTEM') return tpl.is_system;
                      if (galleryFilter === 'ORG') return tpl.is_global && !tpl.is_system;
                      if (galleryFilter === 'PROGRAM') return tpl.entity_id && !tpl.is_global;
                      if (galleryFilter === 'PRIVATE') return !tpl.entity_id && !tpl.is_global && !tpl.is_system;
                      return true;
                    })
                    .map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => setPreviewTpl(tpl)}
                        style={{
                          textAlign: 'left', padding: '12px', borderRadius: '12px', border: `1px solid ${previewTpl?.id === tpl.id ? 'var(--primary-color)' : theme.border}`,
                          background: previewTpl?.id === tpl.id ? 'rgba(59,130,246,0.05)' : 'none', cursor: 'pointer', transition: '0.2s',
                          position: 'relative', overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: previewTpl?.id === tpl.id ? 'var(--primary-color)' : theme.text }}>{tpl.name}</div>
                          {(() => {
                            const badge = getTemplateBadge(tpl);
                            return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px', background: badge.bg, color: badge.color }}>
                                <span style={{ fontSize: '10px' }}>{badge.icon}</span>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>{tpl.category}</div>
                      </button>
                    ))}
                </div>
              </div>

              <div style={{ flex: 1, padding: '24px', background: 'rgba(0,0,0,0.01)', overflowY: 'auto' }}>
                {previewTpl ? (
                  <div style={{ animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>{previewTpl.name}</h3>
                          {previewTpl.is_system && <span title="System templates are read-only" style={{ color: '#6366F1' }}>{Ico.Lock}</span>}
                        </div>
                        <p style={{ fontSize: '13px', color: theme.textMuted, lineHeight: '1.5', maxWidth: '400px' }}>{previewTpl.description}</p>
                        <div style={{ marginTop: '8px', fontSize: '11px', color: theme.textMuted, display: 'flex', gap: '12px' }}>
                          <span>Created by: <b>{previewTpl.creator?.name || 'System'}</b></span>
                          <span>Version: <b>v{previewTpl.version || "1.0"}</b></span>
                          {previewTpl.updated_at && <span>Updated: <b>{new Date(previewTpl.updated_at).toLocaleDateString()}</b></span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditTemplateStructure(previewTpl)}
                          title="Edit Structure"
                          disabled={previewTpl.is_system}
                          style={{ ...st.btnTertiary(theme), padding: '8px 12px', opacity: previewTpl.is_system ? 0.5 : 1 }}
                        >
                          {Ico.Pencil} Edit
                        </button>
                        <button onClick={() => handleCopyTemplate(previewTpl)} title="Save as Copy" style={{ ...st.btnTertiary(theme), padding: '8px 12px' }}>{Ico.Layers} Copy</button>
                        {!previewTpl.is_system && (
                          <>
                            <button onClick={() => handleRenameTemplate(previewTpl)} title="Rename" style={{ ...st.btnGhost(theme), padding: '8px' }}>Rename</button>
                            <button onClick={() => handleDeleteTemplate(previewTpl)} title="Delete" style={{ ...st.btnGhost(theme), padding: '8px', color: '#EF4444' }}>{Ico.Trash}</button>
                          </>
                        )}
                      </div>
                    </div>

                    <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, display: 'block', marginBottom: '12px' }}>WORKFLOW PREVIEW</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {previewTpl.config.steps.map((s, idx) => (
                        <div key={idx} style={{ padding: '14px', background: 'white', borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--primary-color)' }}>Step {idx + 1}: {s.label}</div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {s.items.map((it, iIdx) => (
                              <span key={iIdx} style={{ fontSize: '10px', padding: '4px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', fontWeight: '700' }}>
                                {it.label_override || it.key}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '13px' }}>
                    Select a template to preview its structure.
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '20px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end', gap: '12px', background: theme.surface }}>
              <button onClick={() => setShowGallery(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: 'none', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleApplyTemplateFromGallery}
                disabled={!previewTpl}
                style={{ ...st.btnPrimary(!previewTpl), padding: '10px 24px' }}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      {config && (
        <div 
          onDragOver={onDragOver}
          style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}
        >

          {/* LEFT COLUMN: Library & Branding */}
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>
            <div style={{ background: theme.surface, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}`, background: 'rgba(59,130,246,0.02)' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900' }}>Library</h3>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '10px', color: theme.textMuted }}>{Ico.Search}</div>
                  <input
                    placeholder="Search interactions..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ ...st.librarySearch(theme), paddingLeft: '32px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {MODULE_OPTIONS.map(g => {
                    const filteredItems = g.items.filter(m =>
                      m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.desc.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    if (filteredItems.length === 0) return null;
                    return (
                      <div key={g.group}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, display: 'block', marginBottom: '8px' }}>{g.group}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {filteredItems.map(m => (
                            <button
                              key={m.key}
                              draggable={true}
                              onDragStart={(e) => onLibraryDragStart(e, m.key)}
                              onClick={() => {
                                const firstEnabledIdx = config.steps.findIndex(s => s.enabled);
                                addModuleItem(firstEnabledIdx === -1 ? 0 : firstEnabledIdx, m.key);
                              }}
                              style={st.libraryBtn(theme)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ color: 'var(--primary-color)' }}>{m.icon}</div>
                                <span style={{ fontSize: '11px', fontWeight: '800' }}>{m.label}</span>
                              </div>
                              <span style={{ fontSize: '10px', color: theme.textMuted, marginLeft: '22px' }}>{m.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Branding & Style */}
            <div style={{ background: theme.surface, borderRadius: '14px', padding: '18px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '800' }}>Branding & Style</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="color" 
                    value={config.theme?.primary_color || "#10B981"} 
                    onChange={e => updateTheme('primary_color', e.target.value)}
                    style={{ width: '32px', height: '32px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: theme.text }}>Theme Color</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '9px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' }}>Background Style</label>
                  <select 
                    value={config.theme?.bg_style || "abstract"} 
                    onChange={e => updateTheme('bg_style', e.target.value)}
                    style={{ ...st.input(theme), height: '32px', fontSize: '11px' }}
                  >
                    <option value="minimal">Minimal (Clean White)</option>
                    <option value="abstract">Abstract Blobs (Premium)</option>
                    <option value="gradient">Soft Linear Gradient</option>
                    <option value="modern">Modern Glassmorphism</option>
                  </select>
                </div>
                <div style={{ width: '100%', height: '1px', background: theme.border, margin: '4px 0' }} />
                <input value={config.terminology?.entity_label || ""} placeholder="Service Label Override" onChange={e => updateTerminology('entity_label', e.target.value)} style={st.input(theme)} />
                <input value={config.terminology?.location_label || ""} placeholder="Location Label Override" onChange={e => updateTerminology('location_label', e.target.value)} style={st.input(theme)} />
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Workflow Steps */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: theme.text, margin: 0 }}>Workflow Steps</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: `1px solid ${theme.border}`, paddingLeft: '12px', marginLeft: '4px' }}>
                  <button 
                    onClick={handleUndo} 
                    disabled={history.length === 0} 
                    title="Undo Last Action"
                    style={{ ...st.btnGhost(theme), width: '28px', height: '28px', padding: 0, opacity: history.length === 0 ? 0.3 : 0.7 }}
                  >
                    {Ico.Undo}
                  </button>
                  <button 
                    onClick={handleReset} 
                    title="Reset Workflow"
                    style={{ ...st.btnGhost(theme), width: '28px', height: '28px', padding: 0, opacity: 0.7 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
                  >
                    {Ico.RotateCcw}
                  </button>
                </div>
                {entities.length === 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' }}>
                    {Ico.Check} SINGLE SERVICE MODE: ROUTING SKIPPED
                  </div>
                )}
              </div>
              <button onClick={addStep} style={{ ...st.addBtn(theme), display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}>{Ico.Plus} Add Step</button>
            </div>

            {config.steps.map((step, sIdx) => {
              const stepIcon = sIdx === 0 ? Ico.Globe : sIdx === 1 ? Ico.Star : Ico.FileText;
              const stepGuidance = sIdx === 0
                ? "Displays available services to route user feedback correctly."
                : sIdx === 1
                  ? "Add rating or primary evaluation questions here."
                  : "Optional: Collect additional photos, voice, or final comments.";

              return (
                <div
                  key={step.id}
                  data-is-step={true}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => { onDragLeave(e); onDrop(e, sIdx); }}
                  style={{
                    borderRadius: '14px',
                    border: `2px solid ${selectedItem?.sIdx === sIdx && selectedItem?.itIdx === null ? 'var(--primary-color)' : theme.border}`,
                    background: theme.surface,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    opacity: 1
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => { toggleStepExpand(step.id); setSelectedItem({ sIdx, itIdx: null }); }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>{stepIcon}</span>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, opacity: 0.5 }}>STEP {sIdx + 1}</span>
                      <input
                        value={step.label}
                        disabled={step.locked}
                        onChange={e => updateStep(sIdx, 'label', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: 'none', border: 'none', fontWeight: '800', fontSize: '14px',
                          color: step.locked ? theme.textMuted : theme.text,
                          outline: 'none', cursor: step.locked ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStep(sIdx, 'locked', !step.locked); }}
                        style={{ background: 'none', border: 'none', color: step.locked ? 'var(--primary-color)' : theme.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={step.locked ? "Unlock Step" : "Lock Step"}
                      >
                        {step.locked ? Ico.Lock : Ico.Unlock}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStep(sIdx); }}
                        disabled={step.locked}
                        style={{ background: 'none', border: 'none', color: '#EF4444', opacity: step.locked ? 0.3 : 1, cursor: step.locked ? 'not-allowed' : 'pointer' }}
                      >
                        {Ico.Trash}
                      </button>
                    </div>
                  </div>

                  {expandedSteps[step.id] !== false && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, marginBottom: '4px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                        {stepGuidance}
                      </div>

                      {step.items.map((item, iIdx) => {
                        const mod = MODULE_OPTIONS.flatMap(g => g.items).find(m => m.key === item.key);
                        return (
                          <div
                            key={item.id}
                            draggable={!step.locked}
                            onDragStart={(e) => !step.locked && onDragStart(e, sIdx, iIdx)}
                            onDragEnd={onDragEnd}
                            onDrop={(e) => { e.stopPropagation(); !step.locked && onDrop(e, sIdx, iIdx); }}
                            onClick={(e) => { e.stopPropagation(); setSelectedItem({ sIdx, itIdx: iIdx }); }}
                            style={{
                              display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px',
                              background: theme.bg, borderRadius: '12px', 
                              border: `1.5px solid ${selectedItem?.sIdx === sIdx && selectedItem?.itIdx === iIdx ? 'var(--primary-color)' : theme.border}`,
                              boxShadow: selectedItem?.sIdx === sIdx && selectedItem?.itIdx === iIdx ? '0 0 0 3px var(--primary-soft)' : 'none',
                              cursor: step.locked ? 'default' : 'pointer', transition: 'all 0.2s',
                              opacity: step.locked ? 0.8 : 1,
                              transform: selectedItem?.sIdx === sIdx && selectedItem?.itIdx === iIdx ? 'scale(1.02)' : 'scale(1)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {!step.locked && (
                                <div style={{ cursor: 'grab', color: theme.textMuted, opacity: 0.5 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h2v2H8V6zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm6-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" /></svg>
                                </div>
                              )}
                              <div style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', opacity: step.locked ? 0.6 : 1 }}>
                                {mod?.icon || Ico.Box}
                              </div>
                              <input
                                value={item.label_override}
                                disabled={step.locked}
                                onChange={e => updateItem(sIdx, iIdx, 'label_override', e.target.value)}
                                style={{ flex: 1, background: 'none', border: 'none', fontSize: '13px', fontWeight: '700', color: step.locked ? theme.textMuted : theme.text, outline: 'none', cursor: step.locked ? 'not-allowed' : 'text' }}
                              />

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: step.locked ? 'not-allowed' : 'pointer', opacity: step.locked ? 0.5 : 1 }}
                                  onClick={(e) => { e.stopPropagation(); !step.locked && updateItem(sIdx, iIdx, 'required', !item.required); }}
                                >
                                  <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted }}>REQ</span>
                                  <div style={st.toggle(item.required)}>
                                    <div style={st.toggleKnob(item.required)}></div>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => { e.stopPropagation(); removeItem(sIdx, iIdx); }}
                                  disabled={step.locked}
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: step.locked ? 'not-allowed' : 'pointer', opacity: step.locked ? 0.3 : 1 }}
                                >
                                  {Ico.Trash}
                                </button>
                              </div>
                            </div>

                            {/* Inline Complex Settings */}
                            {selectedItem?.sIdx === sIdx && selectedItem?.itIdx === iIdx && !step.locked && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '15px', animation: 'fadeIn 0.3s ease' }}>
                                {['multiple_choice', 'dropdown'].includes(item.key) && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted }}>OPTIONS</label>
                                    {(item.config?.options || []).map((opt, idx) => (
                                      <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                                        <input 
                                          value={opt} 
                                          onChange={e => {
                                            const newOpts = [...item.config.options];
                                            newOpts[idx] = e.target.value;
                                            updateItem(sIdx, iIdx, 'config', { ...item.config, options: newOpts });
                                          }}
                                          style={{ ...st.input(theme), flex: 1, height: '32px', fontSize: '12px' }} 
                                        />
                                        <button 
                                          onClick={() => {
                                            const newOpts = item.config.options.filter((_, i) => i !== idx);
                                            updateItem(sIdx, iIdx, 'config', { ...item.config, options: newOpts });
                                          }}
                                          style={{ ...st.btnGhost(theme), padding: '4px', color: '#EF4444' }}
                                        >
                                          {Ico.Trash}
                                        </button>
                                      </div>
                                    ))}
                                    <button 
                                      onClick={() => updateItem(sIdx, iIdx, 'config', { ...item.config, options: [...(item.config?.options || []), `Option ${item.config?.options?.length + 1}`] })}
                                      style={{ ...st.btnTertiary(theme), width: 'fit-content', fontSize: '10px', padding: '6px 12px' }}
                                    >
                                      {Ico.Plus} Add Option
                                    </button>
                                  </div>
                                )}

                                {item.key === 'rating_matrix' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted }}>CRITERIA</label>
                                    {(item.config?.criteria || []).map((crit, idx) => (
                                      <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                                        <input 
                                          value={crit} 
                                          onChange={e => {
                                            const newCrits = [...item.config.criteria];
                                            newCrits[idx] = e.target.value;
                                            updateItem(sIdx, iIdx, 'config', { ...item.config, criteria: newCrits });
                                          }}
                                          style={{ ...st.input(theme), flex: 1, height: '32px', fontSize: '12px' }} 
                                        />
                                        <button 
                                          onClick={() => {
                                            const newCrits = item.config.criteria.filter((_, i) => i !== idx);
                                            updateItem(sIdx, iIdx, 'config', { ...item.config, criteria: newCrits });
                                          }}
                                          style={{ ...st.btnGhost(theme), padding: '4px', color: '#EF4444' }}
                                        >
                                          {Ico.Trash}
                                        </button>
                                      </div>
                                    ))}
                                    <button 
                                      onClick={() => updateItem(sIdx, iIdx, 'config', { ...item.config, criteria: [...(item.config?.criteria || []), `Criteria ${item.config?.criteria?.length + 1}`] })}
                                      style={{ ...st.btnTertiary(theme), width: 'fit-content', fontSize: '10px', padding: '6px 12px' }}
                                    >
                                      {Ico.Plus} Add Criteria
                                    </button>
                                  </div>
                                )}

                                {['short_text', 'long_text', 'message_input', 'number_input'].includes(item.key) && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted }}>PLACEHOLDER</label>
                                    <input 
                                      value={item.config?.placeholder || ""} 
                                      onChange={e => updateItem(sIdx, iIdx, 'config', { ...item.config, placeholder: e.target.value })}
                                      style={{ ...st.input(theme), height: '32px', fontSize: '12px' }}
                                      />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Live Preview */}
          {showPreview && (
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ background: theme.surface, borderRadius: '28px', border: `12px solid #111827`, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', height: '760px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', background: '#111827', borderRadius: '50%', zIndex: 10, border: '1px solid rgba(255,255,255,0.1)' }}></div>
                <div style={{ padding: '30px 20px 10px', background: 'white', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#111827' }}>Live Simulation</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '8px', fontWeight: '900', color: '#64748B', display: 'flex', alignItems: 'center', gap: '2px' }}>{Ico.Building} {config.steps.length > 0 ? "1 of " + config.steps.length : "0"}</span>
                      <span style={{ fontSize: '8px', fontWeight: '900', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>LIVE PREVIEW</span>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                  <GeneralFeedback overrideConfig={config} isPreview={true} />
                </div>
                {/* Android Navigation Bar */}
                <div style={{ height: '36px', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ width: '12px', height: '12px', border: '2px solid #94A3B8', borderRadius: '2px', opacity: 0.6 }}></div>
                  <div style={{ width: '12px', height: '12px', border: '2px solid #94A3B8', borderRadius: '50%', opacity: 0.6 }}></div>
                  <div style={{ width: '12px', height: '12px', borderLeft: '2px solid #94A3B8', borderBottom: '2px solid #94A3B8', transform: 'rotate(45deg)', opacity: 0.6, marginLeft: '4px' }}></div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm || (() => setModal({ ...modal, isOpen: false }))}
        onCancel={modal.onCancel || (modal.type === 'confirm' ? (() => setModal({ ...modal, isOpen: false })) : null)}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        content={modal.content}
        isDestructive={modal.isDestructive}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default AdminFormDesigner;
