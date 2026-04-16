import React, { useEffect, useState } from "react";
import { 
    adminGetEntities, adminCreateEntity, adminUpdateEntity, adminDeleteEntity,
    adminGetBranches, adminCreateBranch, adminUpdateBranch, adminDeleteBranch
} from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import CustomModal from "../../CustomModal";
import { IconRegistry, ICONS_LIST as ICONS } from "../../IconRegistry";

const renderIcon = (iconName) => {
    const IconComp = IconRegistry[iconName] || IconRegistry.default;
    return <IconComp />;
};

const IconPicker = ({ currentIcon, onSelect, theme }) => {
    const [open, setOpen] = useState(false);
    
    if (!open) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-color)', color: '#fff', display: 'flex' }}>
                    {renderIcon(currentIcon || 'layers')}
                </div>
                <button type="button" onClick={() => setOpen(true)} style={{ background: 'none', border: `1px solid ${theme.border}`, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: theme.text, fontSize: '13px', fontWeight: '600' }}>
                    Choose Icon
                </button>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '24px', background: theme.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textMuted }}>Select an Icon</span>
                <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Done</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ICONS.map(i => (
                     <div 
                         key={i} 
                         onClick={() => { onSelect(i); setOpen(false); }}
                         style={{ 
                             padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center',
                             background: currentIcon === i ? 'var(--primary-color)' : theme.surface,
                             color: currentIcon === i ? '#fff' : theme.textMuted,
                             border: `1px solid ${currentIcon === i ? 'var(--primary-color)' : theme.border}`,
                             transition: 'all 0.1s'
                         }}
                     >
                         {renderIcon(i)}
                     </div>
                ))}
            </div>
        </div>
    );
};

const AdminPrograms = ({ theme, darkMode, adminUser }) => {
    const { getLabel } = useTerminology();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [activeTab, setActiveTab] = useState("locations");
    const [dialog, setDialog] = useState({ isOpen: false });

    // Program List State
    const [prgForm, setPrgForm] = useState({ name: "", description: "", icon: "layers" });
    const [isAddingProgram, setIsAddingProgram] = useState(false);

    // Location List State
    const [locations, setLocations] = useState([]);
    const [locLoading, setLocLoading] = useState(false);
    const [locForm, setLocForm] = useState({ name: "", region: "", province: "", city: "", barangay: "", is_active: true });
    const [editLocId, setEditLocId] = useState(null);
    const [isAddingLocation, setIsAddingLocation] = useState(false);

    const loadPrograms = async () => {
        setLoading(true);
        try {
            const data = await adminGetEntities();
            // Fetch location counts for each program
            const enriched = await Promise.all(data.map(async (p) => {
                const locs = await adminGetBranches(p.id);
                return { ...p, locationCount: locs.length };
            }));
            setPrograms(enriched);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const loadLocations = async (programId) => {
        setLocLoading(true);
        try {
            const data = await adminGetBranches(programId);
            setLocations(data);
        } catch (err) { console.error(err); }
        setLocLoading(false);
    };

    useEffect(() => {
        loadPrograms();
    }, []);

    useEffect(() => {
        if (selectedProgram) {
            loadLocations(selectedProgram.id);
        }
    }, [selectedProgram]);

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        if (!prgForm.name.trim()) return;
        try {
            await adminCreateEntity(prgForm.name.trim(), prgForm.description, {}, prgForm.icon);
            setPrgForm({ name: "", description: "", icon: "layers" });
            setIsAddingProgram(false);
            loadPrograms();
        } catch (err) { 
            setDialog({
                isOpen: true, type: "error", title: "Error",
                message: "Failed to create program. Ensure the name is unique.",
                confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
            });
        }
    };

    const handleCreateLocation = async (e) => {
        e.preventDefault();
        if (!locForm.name.trim() || !selectedProgram) return;
        try {
            const payload = { ...locForm, entity_id: selectedProgram.id };
            if (editLocId) {
                await adminUpdateBranch(editLocId, payload);
            } else {
                await adminCreateBranch(payload);
            }
            setLocForm({ name: "", region: "", province: "", city: "", barangay: "", is_active: true });
            setEditLocId(null);
            setIsAddingLocation(false);
            loadLocations(selectedProgram.id);
            // Refresh program count in background
            loadPrograms();
        } catch (err) { 
            setDialog({
                isOpen: true, type: "error", title: "Error",
                message: "Failed to save location. Please check your inputs.",
                confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
            });
        }
    };

    const handleDeleteProgram = (p) => {
        setDialog({
            isOpen: true, type: "alert", title: "Delete Program",
            message: `Are you sure you want to delete "${p.name}"? This action cannot be undone and may affect existing feedbacks.`,
            confirmText: "Delete", isDestructive: true,
            onConfirm: async () => {
                try {
                    await adminDeleteEntity(p.id);
                    setDialog({ isOpen: false });
                    loadPrograms();
                } catch (err) { 
                    setDialog({
                        isOpen: true, type: "alert", title: "Error",
                        message: "Failed to delete program. It might be in use by active feedbacks or users.",
                        confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
                    });
                }
            },
            onCancel: () => setDialog({ isOpen: false })
        });
    };

    const handleDeleteLocation = (l) => {
        setDialog({
            isOpen: true, type: "alert", title: l.is_active ? "Deactivate Location" : "Reactivate Location",
            message: l.is_active ? `Deactivate "${l.name}"?` : `Reactivate "${l.name}"?`,
            confirmText: l.is_active ? "Deactivate" : "Reactivate", isDestructive: l.is_active,
            onConfirm: async () => {
                try {
                    if (l.is_active) await adminDeleteBranch(l.id);
                    else await adminUpdateBranch(l.id, { is_active: true });
                    setDialog({ isOpen: false });
                    loadLocations(selectedProgram.id);
                    loadLocations(selectedProgram.id);
                    loadPrograms();
                } catch (err) { 
                    setDialog({
                        isOpen: true, type: "error", title: "Error",
                        message: "Failed to update location status.",
                        confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
                    });
                }
            },
            onCancel: () => setDialog({ isOpen: false })
        });
    };

    // --- RENDER HELPERS ---
    const renderBreadcrumb = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <button 
                onClick={() => setSelectedProgram(null)}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', background: theme.bg, color: theme.text,
                    border: `1.5px solid ${theme.border}`, padding: '6px 12px', borderRadius: '8px',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
                <span onClick={() => setSelectedProgram(null)} style={{ color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'none' }}>
                    {getLabel('category_label_plural', 'Programs')}
                </span>
                <span style={{ color: theme.textMuted }}>/</span>
                <span style={{ color: theme.text }}>{selectedProgram.name}</span>
            </div>
        </div>
    );

    const renderProgramList = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {programs.map(p => {
                return (
                    <div key={p.id} onClick={() => setSelectedProgram(p)} style={{ 
                        background: theme.surface, borderRadius: '16px', padding: '24px', border: `1.5px solid ${theme.border}`, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' 
                    }} className="program-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {renderIcon(p.icon)}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: theme.text }}>{p.name}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>
                                    {p.locationCount || 0} {getLabel('entity_label_plural', 'Locations')}
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '10px', color: theme.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Created by:</span>
                                <span style={{ fontWeight: '700', color: theme.text }}>{p.created_by?.name || 'System'}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: theme.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Last Updated:</span>
                                <span style={{ fontWeight: '700', color: theme.text }}>{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', borderTop: `1px solid ${theme.border}`, paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '800', textTransform: 'uppercase' }}>Active</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProgram(p); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 01-2-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div onClick={() => setIsAddingProgram(true)} style={{ 
                background: 'transparent', borderRadius: '16px', padding: '24px', border: `2px dashed ${theme.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: theme.textMuted, transition: 'all 0.2s'
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>Add New {getLabel('category_label', 'Program')}</span>
            </div>
        </div>
    );

    const renderLocationTab = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.text }}>Program Locations</h3>
                <button onClick={() => setIsAddingLocation(true)} style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Location
                </button>
            </div>

            <div style={{ background: theme.surface, borderRadius: '14px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                {locLoading ? <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>Loading...</div> : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                            <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                                {[`${getLabel('entity_label', 'Location')} Name`, "City / Area", "Last Updated", "Status", ""].map(h => (
                                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map(l => (
                                <tr key={l.id} style={{ borderBottom: `1px solid ${theme.border}`, opacity: l.is_active ? 1 : 0.6 }}>
                                    <td style={{ padding: "14px 16px", fontWeight: "700", color: theme.text }}>{l.name}</td>
                                    <td style={{ padding: "14px 16px", color: theme.textMuted }}>{l.city ? `${l.city}, ` : ''}{l.province || l.region || "—"}</td>
                                    <td style={{ padding: "14px 16px", color: theme.textMuted, fontSize: '12px' }}>
                                        {l.updated_at ? new Date(l.updated_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <div style={{ 
                                            display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', 
                                            background: l.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: l.is_active ? '#10B981' : '#EF4444' 
                                        }}>
                                            {l.is_active ? "ACTIVE" : "INACTIVE"}
                                        </div>
                                    </td>
                                    <td style={{ padding: "14px 16px", textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setEditLocId(l.id); setLocForm(l); setIsAddingLocation(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Edit</button>
                                            <button onClick={() => handleDeleteLocation(l)} style={{ background: 'none', border: 'none', color: l.is_active ? '#EF4444' : '#10B981', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>{l.is_active ? 'Deactivate' : 'Reactivate'}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {locations.length === 0 && (
                                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>No locations registered for this program.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: selectedProgram ? '1000px' : '100%', animation: 'fadeIn 0.3s ease-out' }}>
            {selectedProgram ? (
                <>
                    {renderBreadcrumb()}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: `1px solid ${theme.border}` }}>
                        {["locations", "settings", "analytics"].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} style={{ 
                                background: 'none', border: 'none', padding: '12px 4px', fontSize: '13px', fontWeight: activeTab === t ? "700" : "600", color: activeTab === t ? "var(--primary-color)" : theme.textMuted, borderBottom: `2.5px solid ${activeTab === t ? "var(--primary-color)" : "transparent"}`, cursor: "pointer", textTransform: 'uppercase'
                            }}>
                                {t}
                            </button>
                        ))}
                    </div>
                    {activeTab === "locations" && renderLocationTab()}
                    {activeTab === "settings" && (
                        <div style={{ background: theme.surface, padding: '24px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: theme.text }}>{getLabel('category_label', 'Program')} Configuration</h3>
                            <div style={{ maxWidth: '400px' }}>
                                <label style={labelStyle(theme)}>{getLabel('category_label', 'Program')} Name</label>
                                <input 
                                    value={selectedProgram.name} 
                                    onChange={e => setSelectedProgram({ ...selectedProgram, name: e.target.value })} 
                                    style={{ ...inputStyle(theme), marginBottom: '20px' }} 
                                />

                                <label style={labelStyle(theme)}>Icon</label>
                                <IconPicker 
                                    theme={theme} 
                                    currentIcon={selectedProgram.icon} 
                                    onSelect={(i) => setSelectedProgram({...selectedProgram, icon: i})} 
                                />

                                <button 
                                    onClick={async () => {
                                        try {
                                            await adminUpdateEntity(selectedProgram.id, selectedProgram.name, selectedProgram.description, null, selectedProgram.icon);
                                            setDialog({
                                                isOpen: true, type: "success", title: "Success",
                                                message: "Settings updated successfully!",
                                                confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
                                            });
                                            loadPrograms();
                                        } catch (err) { 
                                            setDialog({
                                                isOpen: true, type: "error", title: "Error",
                                                message: "Update failed. Please check your network or try again.",
                                                confirmText: "OK", onConfirm: () => setDialog({ isOpen: false })
                                            });
                                        }
                                    }}
                                    style={btnPrimary}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === "analytics" && (
                        <div style={{ textAlign: 'center', padding: '60px', background: theme.surface, borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                            <div style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', color: theme.text }}>Program-Level Insights</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted, maxWidth: '400px', margin: '0 auto' }}>
                                Interactive charts and specific feedback distributions for <strong>{selectedProgram.name}</strong> will be displayed here soon. Use the main <span onClick={() => window.location.href='/admin/dashboard'} style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}>Insights Hub</span> for aggregated reports.
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", color: theme.text }}>{getLabel('category_label_plural', 'Programs')} & Services</h2>
                            <p style={{ margin: 0, fontSize: "13px", color: theme.textMuted }}>Manage your high-level service {getLabel('category_label_plural', 'programs').toLowerCase()} and their physical {getLabel('entity_label_plural', 'locations').toLowerCase()}.</p>
                        </div>
                    </div>
                    {loading ? <div style={{ padding: '60px', textAlign: 'center', color: theme.textMuted }}>Loading {getLabel('category_label_plural', 'programs').toLowerCase()}...</div> : renderProgramList()}
                </>
            )}

            {/* Modals for Add/Edit */}
            {isAddingProgram && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, background: theme.surface }}>
                        <h3 style={{ margin: '0 0 16px 0', color: theme.text }}>Register New {getLabel('category_label', 'Program')}</h3>
                        <form onSubmit={handleCreateProgram}>
                            <label style={labelStyle(theme)}>{getLabel('category_label', 'Program')} Name</label>
                            <input value={prgForm.name} onChange={e => setPrgForm({...prgForm, name: e.target.value})} style={{...inputStyle(theme), marginBottom: '20px'}} placeholder={`e.g. 4Ps ${getLabel('category_label', 'Program')}`} />

                            <label style={labelStyle(theme)}>Icon</label>
                            <IconPicker 
                                theme={theme} 
                                currentIcon={prgForm.icon} 
                                onSelect={(i) => setPrgForm({...prgForm, icon: i})} 
                            />

                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" style={btnPrimary}>Create {getLabel('category_label', 'Program')}</button>
                                <button type="button" onClick={() => setIsAddingProgram(false)} style={btnSecondary(theme)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddingLocation && (
                <div style={modalOverlay}>
                    <div style={{ ...modalContent, background: theme.surface, maxWidth: '500px' }}>
                        <h3 style={{ margin: '0 0 16px 0', color: theme.text }}>{editLocId ? `Edit ${getLabel('entity_label', 'Location')}` : `New ${getLabel('entity_label', 'Location')}`}</h3>
                        <form onSubmit={handleCreateLocation} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle(theme)}>{getLabel('entity_label', 'Location')} Name</label>
                                <input value={locForm.name} onChange={e => setLocForm({...locForm, name: e.target.value})} style={inputStyle(theme)} placeholder={`e.g. Marawi City ${getLabel('entity_label', 'Location')}`} />
                            </div>
                            <div>
                                <label style={labelStyle(theme)}>Region</label>
                                <input value={locForm.region} onChange={e => setLocForm({...locForm, region: e.target.value})} style={inputStyle(theme)} placeholder="e.g. BARMM" />
                            </div>
                            <div>
                                <label style={labelStyle(theme)}>Province</label>
                                <input value={locForm.province} onChange={e => setLocForm({...locForm, province: e.target.value})} style={inputStyle(theme)} placeholder="e.g. Lanao del Sur" />
                            </div>
                            <div>
                                <label style={labelStyle(theme)}>City/Municipality</label>
                                <input value={locForm.city} onChange={e => setLocForm({...locForm, city: e.target.value})} style={inputStyle(theme)} placeholder="e.g. Marawi City" />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" style={btnPrimary}>{editLocId ? "Update" : `Register ${getLabel('entity_label', 'Location')}`}</button>
                                <button type="button" onClick={() => { setIsAddingLocation(false); setEditLocId(null); setLocForm({ name: "", region: "", province: "", city: "", barangay: "", is_active: true }); }} style={btnSecondary(theme)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
                confirmText={dialog.confirmText} isDestructive={dialog.isDestructive} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .program-card:hover { transform: translateY(-4px); border-color: var(--primary-color) !important; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
            `}</style>
        </div>
    );
};

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const modalContent = { width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' };

const labelStyle = (theme) => ({ display: 'block', fontSize: '11px', fontWeight: '800', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' });
const inputStyle = (theme) => ({ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none' });
const btnPrimary = { padding: '12px 24px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' };
const btnSecondary = (theme) => ({ padding: '12px 24px', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' });

export default AdminPrograms;
