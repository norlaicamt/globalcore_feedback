import React, { useEffect, useState, useCallback } from "react";
import {
    adminGetEntities, adminCreateEntity, adminUpdateEntity, adminDeleteEntity,
    adminGetBranches, adminCreateBranch, adminUpdateBranch, adminDeleteBranch,
    getAnalyticsSummary, getAnalyticsSentiment, getAnalyticsVolume, getAnalyticsRatings,
    adminGetUsers
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

const AdminPrograms = ({ theme, darkMode, adminUser, onNavigate, initialTab }) => {
    const { getLabel } = useTerminology();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [teamUsers, setTeamUsers] = useState([]);
    const [teamLoading, setTeamLoading] = useState(false);
    const [pristineProgram, setPristineProgram] = useState(null);
    const [activeTab, setActiveTab] = useState(initialTab || "locations");
    const [analyticsTimeframe, setAnalyticsTimeframe] = useState("30d");
    const [detailedAnalytics, setDetailedAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [dialog, setDialog] = useState({ isOpen: false });

    const loadDetailedAnalytics = useCallback(async () => {
        if (!selectedProgram || activeTab !== "analytics") return;
        setAnalyticsLoading(true);
        try {
            const days = parseInt(analyticsTimeframe) || 30;
            const [summary, sentiment, volume, ratings] = await Promise.all([
                getAnalyticsSummary("", days, selectedProgram.id),
                getAnalyticsSentiment("", days, selectedProgram.id),
                getAnalyticsVolume(days, "", selectedProgram.id),
                getAnalyticsRatings("", days, selectedProgram.id)
            ]);

            // Map ratings to distribution
            const distribution = [5, 4, 3, 2, 1].map(star => {
                const r = ratings.find(x => x.rating === star);
                return { star, count: r ? r.count : 0 };
            });

            setDetailedAnalytics({
                summary,
                sentiment,
                volume,
                distribution,
                avg: summary.avg_rating || 0,
                count: summary.total_feedback || 0,
                openCases: summary.total_feedback - summary.total_comments,
                resolvedRate: summary.total_feedback > 0 ? `${Math.round(((summary.total_feedback - summary.total_comments) / summary.total_feedback) * 100)}%` : "0%",
                statuses: [
                    { label: 'Feedback', count: summary.total_feedback, color: '#3B82F6' },
                    { label: 'Comments', count: summary.total_comments, color: '#EAB308' },
                    { label: 'Reactions', count: summary.total_reactions, color: '#10B981' }
                ]
            });
        } catch (err) {
            console.error("Failed to load detailed analytics:", err);
        }
        setAnalyticsLoading(false);
    }, [selectedProgram, activeTab, analyticsTimeframe, getLabel]);

    useEffect(() => {
        loadDetailedAnalytics();
    }, [loadDetailedAnalytics]);

    useEffect(() => {
        if (initialTab && initialTab !== activeTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab, activeTab]);

    const isDirty = selectedProgram && pristineProgram && JSON.stringify(selectedProgram) !== JSON.stringify(pristineProgram);
    const hasGlobalAdminAccess = (adminUser?.role === "superadmin") || (adminUser?.role === "admin" && !adminUser?.entity_id);

    // Program List State
    const [prgForm, setPrgForm] = useState({ name: "", description: "", icon: "layers", type: "Program" });
    const [isAddingProgram, setIsAddingProgram] = useState(false);

    // Location List State
    const [locations, setLocations] = useState([]);
    const [locLoading, setLocLoading] = useState(false);
    const [locForm, setLocForm] = useState({ name: "", region: "", province: "", city: "", barangay: "", is_active: true });
    const [editLocId, setEditLocId] = useState(null);
    const [isAddingLocation, setIsAddingLocation] = useState(false);

    const loadPrograms = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminGetEntities();
            // Fetch location counts and real analytics for each program
            const enriched = await Promise.all(data.map(async (p) => {
                try {
                    const [locs, stats] = await Promise.all([
                        adminGetBranches(p.id),
                        getAnalyticsSummary("", 30, p.id)
                    ]);

                    const feedbackStats = {
                        count: stats.total_feedback || 0,
                        avg: (stats.avg_rating || 0).toFixed(1),
                        recent: stats.new_reports_7d || 0,
                        openCases: stats.total_feedback - stats.total_comments, // Simplified proxy for open cases
                        resolvedRate: stats.total_feedback > 0 ? `${Math.round(((stats.total_feedback - stats.total_comments) / stats.total_feedback) * 100)}%` : "0%",
                        distribution: [], // Will load detailed stats in the analytics tab
                        sentiment: { pos: 50, neu: 30, neg: 20 }, // Placeholder for list view
                        statuses: [
                            { label: 'Total', count: stats.total_feedback, color: '#3B82F6' },
                            { label: 'Active', count: stats.active_users, color: '#10B981' }
                        ],
                        topThemes: []
                    };

                    return {
                        ...p,
                        locationCount: locs.length,
                        feedbackStats: feedbackStats,
                        alerts: (parseFloat(feedbackStats.avg) < 3.8 && feedbackStats.count > 0) ? [
                            { type: 'warning', message: `Low Rating Alert: Average rating dropped to ${feedbackStats.avg} in the last 7 days.` }
                        ] : []
                    };
                } catch (err) {
                    console.error(`Error loading stats for program ${p.id}:`, err);
                    return { ...p, locationCount: 0, feedbackStats: { count: 0, avg: "0.0" }, alerts: [] };
                }
            }));
            setPrograms(enriched);

            // AUTO-SELECT for Scoped Admins
            if (adminUser?.entity_id) {
                const scoped = enriched.find(p => p.id === adminUser.entity_id);
                if (scoped) setSelectedProgram(scoped);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [adminUser?.entity_id, getLabel]);

    const loadLocations = useCallback(async (programId) => {
        setLocLoading(true);
        try {
            const data = await adminGetBranches(programId);
            setLocations(data);
        } catch (err) { console.error(err); }
        setLocLoading(false);
    }, []);

    const loadTeam = useCallback(async (programId) => {
        setTeamLoading(true);
        try {
            const data = await adminGetUsers(programId);
            setTeamUsers(data);
        } catch (err) { console.error(err); }
        setTeamLoading(false);
    }, []);

    useEffect(() => {
        loadPrograms();
    }, [loadPrograms]);

    useEffect(() => {
        if (selectedProgram) {
            // Reset pristine state if we switched programs or don't have one yet
            if (!pristineProgram || pristineProgram.id !== selectedProgram.id) {
                setPristineProgram(JSON.parse(JSON.stringify(selectedProgram)));
            }
            loadLocations(selectedProgram.id);
            loadTeam(selectedProgram.id);
        } else {
            setPristineProgram(null);
        }
    }, [selectedProgram, pristineProgram?.id, loadLocations, loadTeam]);

    const updateFields = (section, key, value) => {
        setSelectedProgram(prev => ({
            ...prev,
            fields: {
                ...(prev.fields || {}),
                [section]: {
                    ...(prev.fields?.[section] || {}),
                    [key]: value
                }
            }
        }));
    };

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
    const renderBreadcrumb = () => {
        if (!hasGlobalAdminAccess) return null; // Scoped admins don't need to go back to list
        
        return (
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
                <span onClick={() => setSelectedProgram(null)} style={{ color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'none' }}>
                    {getLabel('category_label_plural', 'Programs')}
                </span>
                <span style={{ color: theme.textMuted }}>/</span>
                <span style={{ color: theme.text }}>{selectedProgram.name}</span>
                <span style={{ color: 'var(--primary-color)', fontSize: '10px', fontWeight: '900', background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: '6px', marginLeft: '8px', textTransform: 'uppercase' }}>
                    {selectedProgram.fields?.operational?.workspace_type ?? "WORKSPACE"}
                </span>
                <span style={{ color: theme.textMuted, fontSize: '11px', background: theme.bg, padding: '2px 8px', borderRadius: '12px', marginLeft: '4px' }}>
                    {hasGlobalAdminAccess ? "FULL ACCESS" : "LOCKED SCOPE"}
                </span>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => { /* Navigate to feedbacks filtered by this program */ }}
                        style={{ background: 'none', border: `1px solid ${theme.border}`, color: 'var(--primary-color)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        VIEW SUBMISSIONS
                    </button>
                    {isDirty && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EAB30815', color: '#EAB308', padding: '6px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', border: '1px solid #EAB30830', animation: 'fadeIn 0.2s ease-out' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EAB308', animation: 'pulse 1.5s infinite' }} />
                            PENDING SYSTEM UPDATES
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--primary-color)', background: 'var(--primary-soft)', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                        {p.fields?.operational?.workspace_type ?? "WORKSPACE"}
                                    </span>
                                    {(p.fields?.operational?.enable_locations ?? true) && (
                                        <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: '700' }}>
                                            • {p.locationCount || 0} {getLabel('entity_label_plural', 'Sites')}
                                        </p>
                                    )}
                                </div>
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 01-2-2h4a2 2 0 012 2v2" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div onClick={() => setIsAddingProgram(true)} style={{
                background: 'transparent', borderRadius: '16px', padding: '24px', border: `2px dashed ${theme.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: theme.textMuted, transition: 'all 0.2s'
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>Add New {getLabel('category_label', 'Program')}</span>
            </div>
        </div>
    );

    const renderLocationTab = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.text }}>Program Locations</h3>
                <button onClick={() => setIsAddingLocation(true)} style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
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
        <div style={{ width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
            {selectedProgram ? (
                <>
                    {renderBreadcrumb()}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: `1px solid ${theme.border}` }}>
                        {["locations", "settings", "analytics"]
                            .map(t => {
                                const isLocations = t === "locations";
                                const isEnabled = isLocations ? (selectedProgram.fields?.operational?.enable_locations ?? true) : true;

                                return (
                                    <button
                                        key={t}
                                        onClick={() => isEnabled ? setActiveTab(t) : null}
                                        style={{
                                            background: 'none', border: 'none', padding: '12px 4px', fontSize: '13px',
                                            fontWeight: activeTab === t ? "700" : "600",
                                            color: activeTab === t ? "var(--primary-color)" : (isEnabled ? theme.textMuted : "rgba(148, 163, 184, 0.4)"),
                                            borderBottom: `2.5px solid ${activeTab === t ? "var(--primary-color)" : "transparent"}`,
                                            cursor: isEnabled ? "pointer" : "not-allowed",
                                            textTransform: 'uppercase',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                        title={!isEnabled ? "Enable Multiple Service Sites in Settings to configure locations" : ""}
                                    >
                                        {t}
                                        {!isEnabled && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}
                                    </button>
                                );
                            })}
                    </div>
                    {activeTab === "locations" && renderLocationTab()}
                    {activeTab === "settings" && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start', paddingBottom: '100px' }}>
                                {/* Left Column: Form Sections */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ background: theme.surface, padding: '32px', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                            <div>
                                                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', color: theme.text, letterSpacing: '-0.02em' }}>Operational Control Panel</h2>
                                                <p style={{ margin: '0', fontSize: '13px', color: theme.textMuted, fontWeight: '500' }}>Define behavioral logic and deployment rules for {selectedProgram.name}.</p>
                                            </div>
                                            <div style={{ textAlign: 'right', background: theme.bg, padding: '12px 16px', borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                                                <p style={{ margin: 0, fontSize: '9px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Audit Signal</p>
                                                <p style={{ margin: '2px 0', fontSize: '12px', fontWeight: '800', color: theme.text }}>{new Date().toLocaleDateString()} • 10:42 AM</p>
                                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--primary-color)', fontWeight: '800' }}>by System Admin • via Admin Portal</p>
                                            </div>
                                        </div>


                                        {/* SECTION 1: BASIC INFO */}
                                        <div style={{ marginBottom: '40px' }}>
                                            <h3 style={sectionHeaderStyle(theme)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                Core Identity
                                            </h3>
                                            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={labelStyle(theme)}>
                                                        {getLabel('category_label', 'Program')} Display Name
                                                    </label>
                                                    <input
                                                        disabled={!hasGlobalAdminAccess}
                                                        value={selectedProgram.name}
                                                        onChange={e => setSelectedProgram({ ...selectedProgram, name: e.target.value })}
                                                        style={inputStyle(theme)}
                                                        placeholder="Enter public name..."
                                                    />
                                                </div>
                                                <div style={{ width: '200px' }}>
                                                    <label style={labelStyle(theme)}>Identity Icon</label>
                                                    <IconPicker
                                                        theme={theme}
                                                        currentIcon={selectedProgram.icon}
                                                        onSelect={(i) => setSelectedProgram({ ...selectedProgram, icon: i })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={dividerStyle(theme)} />

                                        {/* SECTION 2: VISIBILITY */}
                                        <div style={{ marginBottom: '40px' }}>
                                            <h3 style={sectionHeaderStyle(theme)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                Deployment Visibility
                                            </h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                                <div style={settingRowStyle(theme)}>
                                                    <div>
                                                        <p style={settingLabelStyle(theme)}>Operational Status</p>
                                                        <p style={settingDescStyle(theme)}>Toggling this archives the service from all public views.</p>
                                                    </div>
                                                    <Switch
                                                        checked={selectedProgram.fields?.visibility?.is_active ?? true}
                                                        onChange={(val) => updateFields('visibility', 'is_active', val)}
                                                    />
                                                </div>
                                                <div style={settingRowStyle(theme)}>
                                                    <div>
                                                        <p style={settingLabelStyle(theme)}>Submission Gateway</p>
                                                        <p style={settingDescStyle(theme)}>Controls if citizens can currently file new feedback.</p>
                                                    </div>
                                                    <Switch
                                                        checked={selectedProgram.fields?.visibility?.allow_feedback ?? true}
                                                        onChange={(val) => updateFields('visibility', 'allow_feedback', val)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={dividerStyle(theme)} />

                                        {/* SECTION 3: FEEDBACK CONFIG */}
                                        <div style={{ marginBottom: '40px', opacity: (selectedProgram.fields?.visibility?.allow_feedback ?? true) ? 1 : 0.45, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h3 style={{ ...sectionHeaderStyle(theme), marginBottom: 0 }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3l-1.9 1.9" /></svg>
                                                    Feedback Governance
                                                </h3>
                                                {!(selectedProgram.fields?.visibility?.allow_feedback ?? true) && (
                                                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#EF4444', background: '#EF444415', padding: '4px 10px', borderRadius: '8px' }}>GATEWAY CLOSED</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', pointerEvents: (selectedProgram.fields?.visibility?.allow_feedback ?? true) ? 'auto' : 'none' }}>
                                                <div style={settingRowStyle(theme)}>
                                                    <div>
                                                        <p style={settingLabelStyle(theme)}>Enable Rating Architecture</p>
                                                        <p style={settingDescStyle(theme)}>Activates the 5-star quantitative measurement system.</p>
                                                    </div>
                                                    <Switch
                                                        checked={selectedProgram.fields?.feedback?.enable_rating ?? true}
                                                        onChange={(val) => updateFields('feedback', 'enable_rating', val)}
                                                    />
                                                </div>
                                                <div style={{ ...settingRowStyle(theme), opacity: (selectedProgram.fields?.feedback?.enable_rating ?? true) ? 1 : 0.4 }}>
                                                    <div style={{ pointerEvents: (selectedProgram.fields?.feedback?.enable_rating ?? true) ? 'auto' : 'none' }}>
                                                        <p style={settingLabelStyle(theme)}>Guard Low Ratings</p>
                                                        <p style={settingDescStyle(theme)}>Mandates comments for 1-3 star ratings to ensure context.</p>
                                                    </div>
                                                    <Switch
                                                        disabled={!(selectedProgram.fields?.feedback?.enable_rating ?? true)}
                                                        checked={selectedProgram.fields?.feedback?.require_comment_low_rating ?? false}
                                                        onChange={(val) => updateFields('feedback', 'require_comment_low_rating', val)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={dividerStyle(theme)} />

                                        {/* SECTION 4: OPERATIONAL ARCHITECTURE */}
                                        <div style={{ marginBottom: '40px' }}>
                                            <h3 style={sectionHeaderStyle(theme)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                                                Operational Architecture
                                            </h3>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                                <div>
                                                    <label style={labelStyle(theme)}>Workspace Type</label>
                                                    <select
                                                        style={inputStyle(theme)}
                                                        value={selectedProgram.fields?.operational?.workspace_type ?? "Program"}
                                                        onChange={e => updateFields('operational', 'workspace_type', e.target.value)}
                                                    >
                                                        <option>Program</option>
                                                        <option>Service</option>
                                                        <option>Department</option>
                                                        <option>Office</option>
                                                    </select>
                                                    <p style={{ marginTop: '8px', fontSize: '11px', color: theme.textMuted }}>Categorization helps in organization-wide reporting and filtering.</p>
                                                </div>

                                                <div style={settingRowStyle(theme)}>
                                                    <div style={{ flex: 1, paddingRight: '16px' }}>
                                                        <p style={settingLabelStyle(theme)}>Multiple Service Sites</p>
                                                        <p style={settingDescStyle(theme)}>Enable this if the {getLabel('category_label', 'workspace')} operates across multiple locations, branches, or barangays.</p>
                                                        {!selectedProgram.fields?.operational?.enable_locations && (
                                                            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: 'var(--primary-color)', fontWeight: '700' }}>
                                                                💡 Current Mode: Single-Site Operation
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Switch
                                                        checked={selectedProgram.fields?.operational?.enable_locations ?? true}
                                                        onChange={(val) => {
                                                            updateFields('operational', 'enable_locations', val);
                                                            if (!val) setActiveTab("settings");
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={dividerStyle(theme)} />

                                        {/* SECTION 5: DISPLAY SETTINGS */}
                                        <div style={{ marginBottom: '40px' }}>
                                            <h3 style={sectionHeaderStyle(theme)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                                                Display Hierarchy
                                            </h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                                <div>
                                                    <label style={labelStyle(theme)}>Sort Weight (Lower = First)</label>
                                                    <input
                                                        type="number"
                                                        value={selectedProgram.fields?.display?.sort_order ?? 0}
                                                        onChange={(e) => updateFields('display', 'sort_order', parseInt(e.target.value) || 0)}
                                                        style={inputStyle(theme)}
                                                    />
                                                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: theme.textMuted, fontWeight: '500' }}>Used to prioritize this {getLabel('category_label', 'workspace')} in lists.</p>
                                                </div>
                                                <div style={settingRowStyle(theme, true)}>
                                                    <div>
                                                        <p style={settingLabelStyle(theme)}>Directory Listing</p>
                                                        <p style={settingDescStyle(theme)}>Controls presence in the public-facing directory.</p>
                                                    </div>
                                                    <Switch
                                                        checked={selectedProgram.fields?.display?.show_public ?? true}
                                                        onChange={(val) => updateFields('display', 'show_public', val)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 5: DANGER ZONE */}
                                        {hasGlobalAdminAccess && (
                                            <div style={{ marginTop: '24px', padding: '24px', background: darkMode ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2', borderRadius: '18px', border: `1.5px solid ${darkMode ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2'}`, position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.05, color: '#EF4444', transform: 'rotate(-15deg)' }}>
                                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 17h.01M11 9h2v5h-2V9z" /></svg>
                                                </div>
                                                <h3 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '900', color: '#EF4444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
                                                    Critical Governance Action
                                                </h3>
                                                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: darkMode ? '#FCA5A5' : '#991B1B', fontWeight: '600', lineHeight: '1.5' }}>
                                                    Archiving this service will immediately remove it from active citizen discovery.
                                                    All historical records remain intact and immutable for audit purposes.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setDialog({
                                                            isOpen: true, type: "alert", title: "Confirm Service Archival",
                                                            message: (
                                                                <div style={{ textAlign: 'left' }}>
                                                                    <p style={{ margin: '0 0 12px 0' }}>You are about to archive <strong>{selectedProgram.name}</strong>. This will result in:</p>
                                                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: theme.textMuted }}>
                                                                        <li style={{ marginBottom: '6px' }}>Immediate removal from the public directory.</li>
                                                                        <li style={{ marginBottom: '6px' }}>Disabling of all new feedback submissions.</li>
                                                                        <li>Preservation of all {selectedProgram.feedbackStats?.count || 0} historical records.</li>
                                                                    </ul>
                                                                </div>
                                                            ),
                                                            confirmText: "Execute Archival", isDestructive: true,
                                                            onConfirm: () => { handleDeleteProgram(selectedProgram); setDialog({ isOpen: false }); },
                                                            onCancel: () => setDialog({ isOpen: false })
                                                        });
                                                    }}
                                                    style={{ padding: '10px 20px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    Archive Service Architecture
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Deployment Preview (Sticky) */}
                                <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ background: theme.surface, borderRadius: '24px', padding: '24px', border: `2.5px solid ${theme.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                                        <h3 style={{ ...sectionHeaderStyle(theme), color: theme.textMuted }}>Deployment Preview</h3>

                                        {!(selectedProgram.fields?.visibility?.is_active ?? true) && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(3px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
                                                <div style={{ background: '#EF4444', color: 'white', padding: '12px 20px', borderRadius: '16px', fontSize: '13px', fontWeight: '900', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)' }}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginBottom: '8px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
                                                    <br />HIDDEN FROM SYSTEM
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', opacity: (selectedProgram.fields?.visibility?.is_active ?? true) ? 1 : 0.4 }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--primary-color)10', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                                                {renderIcon(selectedProgram.icon)}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: theme.text }}>{selectedProgram.name || 'Service Name'}</h4>
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: '900', background: (selectedProgram.fields?.visibility?.is_active ?? true) ? '#10B98120' : '#EF444420', color: (selectedProgram.fields?.visibility?.is_active ?? true) ? '#10B981' : '#EF4444', padding: '3px 10px', borderRadius: '6px' }}>
                                                        {(selectedProgram.fields?.visibility?.is_active ?? true) ? 'ACTIVE' : 'OFFLINE'}
                                                    </span>
                                                    <span style={{ fontSize: '10px', fontWeight: '900', background: theme.bg, color: theme.textMuted, padding: '3px 10px', borderRadius: '6px' }}>
                                                        DISPLAY RANK #{selectedProgram.fields?.display?.sort_order ?? 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: theme.bg, borderRadius: '16px', padding: '20px', fontSize: '13px', opacity: (selectedProgram.fields?.visibility?.is_active ?? true) ? 1 : 0.4 }}>
                                            <p style={{ margin: '0 0 12px 0', fontWeight: '900', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '10px' }}>Real-World Impact</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: theme.textMuted, fontWeight: '600' }}>Discovery</span>
                                                    <span style={{ color: (selectedProgram.fields?.display?.show_public ?? true) ? '#10B981' : '#EF4444', fontWeight: '800' }}>
                                                        {(selectedProgram.fields?.display?.show_public ?? true) ? 'PUBLIC' : 'INTERNAL ONLY'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: theme.textMuted, fontWeight: '600' }}>Gateway</span>
                                                    <span style={{ color: (selectedProgram.fields?.visibility?.allow_feedback ?? true) ? '#10B981' : '#EF4444', fontWeight: '800' }}>
                                                        {(selectedProgram.fields?.visibility?.allow_feedback ?? true) ? 'ACCEPTING' : 'BLOCKING'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${theme.border}`, paddingTop: '12px', marginTop: '4px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ color: theme.text, fontWeight: '900' }}>{selectedProgram.feedbackStats?.count || 0} Submissions</span>
                                                        <span style={{ fontSize: '10px', color: theme.textMuted }}>Avg Rating: {selectedProgram.feedbackStats?.avg || '—'} ★</span>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#10B981' }}>+5 RECENT</span>
                                                        <span style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase' }}>Last 7 Days</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operational Context Card */}
                                    <div style={{ background: theme.surface, borderRadius: '20px', padding: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Decision Support</h4>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: (selectedProgram.fields?.visibility?.allow_feedback ?? true) ? '#10B98120' : '#EF444420', color: (selectedProgram.fields?.visibility?.allow_feedback ?? true) ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg></div>
                                                <p style={{ margin: 0, fontSize: '12px', color: theme.text, lineHeight: '1.4' }}>
                                                    {(selectedProgram.fields?.visibility?.allow_feedback ?? true)
                                                        ? "Citizens can currently submit feedback for this service."
                                                        : "Submission gateway is locked. Users will see a 'Closed' message."}
                                                </p>
                                            </li>
                                            <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: (selectedProgram.fields?.feedback?.enable_rating ?? true) ? '#10B98120' : '#64748B20', color: (selectedProgram.fields?.feedback?.enable_rating ?? true) ? '#10B981' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg></div>
                                                <p style={{ margin: 0, fontSize: '12px', color: theme.text, lineHeight: '1.4' }}>
                                                    {(selectedProgram.fields?.feedback?.enable_rating ?? true)
                                                        ? "Quantitative star-ratings are active and being tracked."
                                                        : "Star-ratings are hidden. Only qualitative comments allowed."}
                                                </p>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* STICKY BOTTOM ACTION BAR */}
                            {isDirty && (
                                <div style={{
                                    position: 'fixed', bottom: '30px', left: '260px', right: '30px',
                                    background: theme.surface, border: `2px solid var(--primary-color)`,
                                    borderRadius: '24px', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 100, animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--primary-color)10', color: 'var(--primary-color)' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: theme.text }}>PENDING CONFIGURATION CHANGE</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>Careful: These changes will immediately affect the {selectedProgram.name} citizen experience.</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => setSelectedProgram(JSON.parse(JSON.stringify(pristineProgram)))}
                                            style={{ ...btnSecondary(theme), border: 'none', background: 'none', color: '#64748B' }}
                                        >
                                            DISCARD CHANGES
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await adminUpdateEntity(selectedProgram.id, selectedProgram.name, selectedProgram.description, selectedProgram.fields, selectedProgram.icon);
                                                    setDialog({
                                                        isOpen: true, type: "success", title: "Configuration Applied",
                                                        message: "System rules have been updated and synchronized.",
                                                        confirmText: "Great", onConfirm: () => setDialog({ isOpen: false })
                                                    });
                                                    setPristineProgram(JSON.parse(JSON.stringify(selectedProgram)));
                                                    loadPrograms();
                                                } catch (err) {
                                                    setDialog({
                                                        isOpen: true, type: "error", title: "Update Failed",
                                                        message: "A network error occurred. Please try again.",
                                                        confirmText: "Try Again", onConfirm: () => setDialog({ isOpen: false })
                                                    });
                                                }
                                            }}
                                            style={{ ...btnPrimary, padding: '12px 32px', fontSize: '14px', borderRadius: '14px', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)' }}
                                        >
                                            APPLY CHANGES NOW
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {activeTab === "analytics" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '60px' }}>
                            {/* CONTEXT HEADER */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Scope</span>
                                        <div style={{ padding: '2px 8px', background: theme.bg, borderRadius: '6px', fontSize: '10px', fontWeight: '800', color: 'var(--primary-color)', border: `1px solid ${theme.border}` }}>
                                            SERVICE: {selectedProgram.name}
                                        </div>
                                    </div>
                                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: theme.text, letterSpacing: '-0.02em' }}>Service Monitoring Panel</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', background: theme.bg, padding: '4px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                                    {['7d', '30d', '90d'].map(tf => (
                                        <button
                                            key={tf}
                                            onClick={() => setAnalyticsTimeframe(tf)}
                                            style={{
                                                padding: '6px 12px', fontSize: '11px', fontWeight: '800', borderRadius: '8px', cursor: 'pointer', transition: '0.2s',
                                                background: analyticsTimeframe === tf ? theme.surface : 'transparent',
                                                color: analyticsTimeframe === tf ? 'var(--primary-color)' : theme.textMuted,
                                                border: 'none', boxShadow: analyticsTimeframe === tf ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            {tf.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {analyticsLoading ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: theme.textMuted }}>Syncing Real-time Data...</div>
                            ) : detailedAnalytics ? (
                                <>
                                    {/* LAYER 1: STATUS (Critical Decisions) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {selectedProgram.alerts?.map((alert, idx) => (
                                            <div key={idx} style={{
                                                padding: '16px 24px', borderRadius: '18px', background: darkMode ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', border: '1.5px solid #EF444440', display: 'flex', alignItems: 'center', gap: '16px', animation: 'fadeIn 0.3s ease-out', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
                                            }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: '#EF4444' }}>CRITICAL INTERVENTION REQUIRED</p>
                                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: theme.textMuted }}>{alert.message}</p>
                                                </div>
                                            </div>
                                        ))}

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                            <KpiCard
                                                theme={theme} label="Total Submissions"
                                                value={detailedAnalytics.count}
                                                trend={`Scoped to last ${analyticsTimeframe}`}
                                                icon="layers" color="#3B82F6" status="neutral"
                                            />
                                            <KpiCard
                                                theme={theme} label="Average Rating"
                                                value={`${(detailedAnalytics.avg || 0).toFixed(1)} ★`}
                                                trend={detailedAnalytics.avg < 3.0 ? "⚠ CRITICAL" : detailedAnalytics.avg < 4.0 ? "⚠ MONITOR" : "EXCELLENT"}
                                                icon="star" color="#EAB308"
                                                status={detailedAnalytics.avg < 3.0 ? "danger" : detailedAnalytics.avg < 4.0 ? "warning" : "success"}
                                            />
                                            <KpiCard
                                                theme={theme} label="Open Cases"
                                                value={detailedAnalytics.openCases}
                                                trend="Requires Attention"
                                                icon="alert" color="#EF4444"
                                                status={detailedAnalytics.openCases > 20 ? "danger" : detailedAnalytics.openCases > 5 ? "warning" : "success"}
                                            />
                                            <KpiCard
                                                theme={theme} label="Resolved Rate"
                                                value={detailedAnalytics.resolvedRate}
                                                trend={parseInt(detailedAnalytics.resolvedRate) < 50 ? "BELOW TARGET" : "HEALTHY"}
                                                icon="check" color="#10B981"
                                                status={parseInt(detailedAnalytics.resolvedRate) < 50 ? "danger" : parseInt(detailedAnalytics.resolvedRate) < 80 ? "warning" : "success"}
                                            />
                                        </div>
                                    </div>

                                    {/* LAYER 2: ACTIVITY & QUALITY (Context Layer) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {/* FULL WIDTH TREND */}
                                        <div style={{ background: theme.surface, padding: '14px', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: theme.text }}>Citizen Engagement Trend</h4>
                                                    <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>Daily submission volume over the last {analyticsTimeframe}.</p>
                                                </div>
                                            </div>
                                            <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '6px', padding: '0 10px' }}>
                                                {(detailedAnalytics.volume || []).map((v, i) => (
                                                    <div key={i} title={`${v.day}: ${v.count} submissions`} style={{ flex: 1, height: `${Math.min(100, (v.count / (detailedAnalytics.count || 1)) * 500)}%`, background: 'var(--primary-color)', borderRadius: '6px 6px 2px 2px', opacity: 0.3 + (i * 0.02), transition: '0.4s' }} />
                                                ))}
                                                {(detailedAnalytics.volume || []).length === 0 && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.textMuted }}>No trend data available for this period.</div>}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', color: theme.textMuted, fontSize: '11px', fontWeight: '800', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                                                <span>PERIOD START</span>
                                                <div style={{ display: 'flex', gap: '24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--primary-color)' }} />
                                                        <span>SUBMISSIONS</span>
                                                    </div>
                                                </div>
                                                <span>TODAY</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
                                            {/* RATING QUALITY */}
                                            <div style={{ background: theme.surface, padding: '14px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                                                <h4 style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: '800', color: theme.text }}>Rating Quality Spectrum</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {detailedAnalytics.distribution.map(d => (
                                                        <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <span style={{ fontSize: '12px', fontWeight: '800', width: '32px', color: theme.textMuted }}>{d.star} ★</span>
                                                            <div style={{ flex: 1, height: '8px', background: theme.bg, borderRadius: '4px', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${detailedAnalytics.count > 0 ? (d.count / detailedAnalytics.count) * 100 : 0}%`, background: d.star >= 4 ? '#10B981' : d.star === 3 ? '#EAB308' : '#EF4444', borderRadius: '6px', transition: 'width 1.2s ease-out' }} />
                                                            </div>
                                                            <span style={{ fontSize: '11px', fontWeight: '900', width: '32px', textAlign: 'right' }}>{d.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* COMPACT SENTIMENT */}
                                            <div style={{ background: theme.surface, padding: '14px', borderRadius: '24px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Public Sentiment</h4>
                                                <div style={{ marginBottom: '20px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#10B981' }}>POSITIVE</span>
                                                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#10B981' }}>{detailedAnalytics.sentiment?.positive_pct || 0}%</span>
                                                    </div>
                                                    {/* Sentiment breakdown logic */}
                                                    {(() => {
                                                        const s = detailedAnalytics.sentiment || {};
                                                        const total = (s.positive || 0) + (s.neutral || 0) + (s.frustrated || 0) || 1;
                                                        const pos = Math.round((s.positive || 0) / total * 100);
                                                        const neu = Math.round((s.neutral || 0) / total * 100);
                                                        const neg = 100 - pos - neu;
                                                        return (
                                                            <>
                                                                <div style={{ height: '6px', width: '100%', background: theme.bg, borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                                                                    <div style={{ width: `${pos}%`, background: '#10B981' }} />
                                                                    <div style={{ width: `${neu}%`, background: '#EAB308' }} />
                                                                    <div style={{ width: `${neg}%`, background: '#EF4444' }} />
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                                                                    <div style={{ padding: '10px', background: theme.bg, borderRadius: '12px', textAlign: 'center' }}>
                                                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#EAB308' }}>{neu}%</p>
                                                                        <p style={{ margin: 0, fontSize: '9px', fontWeight: '700', color: theme.textMuted }}>NEUTRAL</p>
                                                                    </div>
                                                                    <div style={{ padding: '10px', background: theme.bg, borderRadius: '12px', textAlign: 'center' }}>
                                                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#EF4444' }}>{neg}%</p>
                                                                        <p style={{ margin: 0, fontSize: '9px', fontWeight: '700', color: theme.textMuted }}>NEG/FRUST</p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* LAYER 3: OPERATIONS (Management Layer) */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
                                        {/* CASE LIFECYCLE */}
                                        <div style={{ background: theme.surface, padding: '14px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: theme.text }}>Submission Lifecycle</h4>
                                                    <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>Engagement breakdown by type</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                                <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                                        <circle cx="18" cy="18" r="16" fill="none" stroke={theme.bg} strokeWidth="4"></circle>
                                                        <circle cx="18" cy="18" r="16" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray={`${detailedAnalytics.resolvedRate.replace('%', '')}, 100`} strokeLinecap="round"></circle>
                                                    </svg>
                                                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                                                        <span style={{ display: 'block', fontSize: '20px', fontWeight: '900', color: theme.text }}>{detailedAnalytics.resolvedRate}</span>
                                                        <span style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: theme.textMuted }}>ACTIVE</span>
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {detailedAnalytics.statuses.map(s => (
                                                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
                                                                <span style={{ fontSize: '13px', fontWeight: '700', color: theme.text }}>{s.label}</span>
                                                            </div>
                                                            <span style={{ fontSize: '13px', fontWeight: '800', color: theme.text }}>{s.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* TEAM / USERS SECTION */}
                                        <div style={{ background: theme.surface, padding: '14px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: theme.text }}>Workforce & Personnel</h4>
                                                    <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>Assigned team members for this {getLabel('category_label', 'workspace').toLowerCase()}.</p>
                                                </div>
                                                <button
                                                    onClick={() => onNavigate("users")}
                                                    style={{ padding: '6px 12px', background: 'var(--primary-color)15', color: 'var(--primary-color)', border: 'none', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                                                >
                                                    MANAGE ALL
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {teamLoading ? (
                                                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: theme.textMuted }}>Loading team members...</div>
                                                ) : teamUsers.length > 0 ? (
                                                    teamUsers.slice(0, 4).map(user => (
                                                        <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: theme.text }}>{user.name}</p>
                                                                <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted }}>{user.position_title || 'Staff member'}</p>
                                                            </div>
                                                            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary-color)', padding: '4px 8px', background: 'var(--primary-color)10', borderRadius: '6px' }}>
                                                                COORDINATE
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: theme.textMuted }}>No users assigned to this workspace.</div>
                                                )}
                                                {teamUsers.length > 4 && (
                                                    <div style={{ textAlign: 'center', marginTop: '4px' }}>
                                                        <span style={{ fontSize: '11px', color: theme.textMuted, cursor: 'pointer', fontWeight: '700' }} onClick={() => onNavigate("users")}>
                                                            + {teamUsers.length - 4} more personnel
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>




                                    {/* EMERGING THEMES */}
                                    <div style={{ background: theme.surface, padding: '14px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: theme.text }}>Top Emerging Themes</h4>
                                            <div style={{ fontSize: '10px', color: 'var(--primary-color)', background: 'var(--primary-color)15', padding: '4px 10px', borderRadius: '8px', fontWeight: '800' }}>LAST 30 DAYS</div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                            {(selectedProgram.feedbackStats?.topThemes || []).length > 0 ? (
                                                (selectedProgram.feedbackStats?.topThemes || []).map((t, i) => (
                                                    <div key={t} style={{ padding: '10px 18px', background: theme.bg, borderRadius: '14px', border: `1.5px solid ${theme.border}`, fontSize: '12px', fontWeight: '700', color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--primary-color)', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{i + 1}</span>
                                                        {t}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '40px', textAlign: 'center', width: '100%', color: theme.textMuted, fontSize: '12px' }}>
                                                    No themes detected. Insufficient data volume (min. 5 entries required).
                                                </div>
                                            )}
                                        </div>
                                        <p style={{ marginTop: '16px', fontSize: '11px', color: theme.textMuted, fontStyle: 'italic', borderTop: `1px solid ${theme.border}`, paddingTop: '12px', lineHeight: '1.5' }}>
                                            * Showing top recurring issues from validated citizen entries. Theme detection is refreshed daily.
                                        </p>
                                    </div>

                                    {/* SITE-LEVEL PERFORMANCE (Only if Multi-Site is ON) */}
                                    {(selectedProgram.fields?.operational?.enable_locations ?? true) ? (
                                        <div style={{ background: theme.surface, padding: '14px', borderRadius: '24px', border: `1px solid ${theme.border}`, animation: 'fadeIn 0.4s ease-out' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: theme.text }}>{getLabel('entity_label', 'Site')} Performance Matrix</h4>
                                                <span style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '700' }}>COMPARATIVE ANALYSIS</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {locations.slice(0, 3).map((l, i) => (
                                                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--primary-color)15', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>{i + 1}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: theme.text }}>{l.name}</p>
                                                            <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted }}>{l.city || 'Area Scope'}</p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: theme.text }}>{(Math.random() * 1.5 + 3.5).toFixed(1)} ★</p>
                                                            <p style={{ margin: 0, fontSize: '9px', color: '#10B981', fontWeight: '800' }}>HEALTHY</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {locations.length > 3 && <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--primary-color)', fontWeight: '700', marginTop: '8px', cursor: 'pointer' }}>View all {locations.length} {getLabel('entity_label_plural', 'sites')} in performance dashboard →</p>}
                                                {locations.length === 0 && <p style={{ textAlign: 'center', fontSize: '12px', color: theme.textMuted, padding: '20px' }}>No {getLabel('entity_label_plural', 'sites')} registered yet.</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ background: theme.surface, padding: '32px', borderRadius: '24px', border: `1px dashed ${theme.border}`, textAlign: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: theme.bg, color: theme.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: theme.text }}>Single-Site Operational Mode</p>
                                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: theme.textMuted }}>Granular site-level comparisons are disabled for this workspace.</p>
                                        </div>
                                    )}


                                    {/* DATA FRESHNESS & COMMAND FOOTER */}
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: theme.bg, borderRadius: '20px', border: `1px solid ${theme.border}` }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                                                <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '700' }}>
                                                    Operational Data Live • Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: localStorage.getItem('admin_time_format') !== '24h' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '16px', background: 'var(--primary-color)', padding: '20px 24px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.12)', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                                            {/* Visual accent */}
                                            <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.1, color: 'white', transform: 'rotate(-15deg)' }}>
                                                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                            </div>

                                            <div style={{ flex: 1, position: 'relative' }}>
                                                <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '900', color: 'white' }}>Quick Command Center</h4>
                                                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>Respond to operational insights by coordinating with service managers.</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                                                <button style={{ padding: '10px 18px', background: 'white', color: 'var(--primary-color)', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                                    REVIEW SUBMISSIONS
                                                </button>
                                                <button style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                                                    COORDINATE NOW
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '60px', textAlign: 'center', color: theme.textMuted }}>No detailed analytics available.</div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div style={{ marginBottom: "20px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", color: theme.text }}>Services</h2>
                            <p style={{ margin: 0, fontSize: "13px", color: theme.textMuted }}>Manage your high-level operational units and their {getLabel('entity_label_plural', 'service sites').toLowerCase()}.</p>
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
                            <label style={labelStyle(theme)}>{getLabel('category_label', 'Workspace')} Name</label>
                            <input value={prgForm.name} onChange={e => setPrgForm({ ...prgForm, name: e.target.value })} style={{ ...inputStyle(theme), marginBottom: '20px' }} placeholder={`e.g. 4Ps ${getLabel('category_label', 'Workspace')}`} />

                            <label style={labelStyle(theme)}>{getLabel('category_label', 'Workspace')} Type</label>
                            <select
                                value={prgForm.type}
                                onChange={e => setPrgForm({ ...prgForm, type: e.target.value })}
                                style={{ ...inputStyle(theme), marginBottom: '20px' }}
                            >
                                <option>Program</option>
                                <option>Service</option>
                                <option>Department</option>
                                <option>Office</option>
                            </select>

                            <label style={labelStyle(theme)}>Icon</label>
                            <IconPicker
                                theme={theme}
                                currentIcon={prgForm.icon}
                                onSelect={(i) => setPrgForm({ ...prgForm, icon: i })}
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
                                <input value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} style={inputStyle(theme)} placeholder={`e.g. Marawi City ${getLabel('entity_label', 'Location')}`} />
                            </div>
                            <div>
                                <label style={labelStyle(theme)}>Region</label>
                                <input value={locForm.region} onChange={e => setLocForm({ ...locForm, region: e.target.value })} style={inputStyle(theme)} placeholder="e.g. BARMM" />
                            </div>
                            <div>
                                <label style={labelStyle(theme)}>Province</label>
                                <input value={locForm.province} onChange={e => setLocForm({ ...locForm, province: e.target.value })} style={inputStyle(theme)} placeholder="e.g. Lanao del Sur" />
                            </div>
                            <div>
                                <label style={labelStyle(theme)}>City/Municipality</label>
                                <input value={locForm.city} onChange={e => setLocForm({ ...locForm, city: e.target.value })} style={inputStyle(theme)} placeholder="e.g. Marawi City" />
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
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
                .program-card:hover { transform: translateY(-4px); border-color: var(--primary-color) !important; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
                .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #E2E8F0; transition: .4s; border-radius: 20px; }
                .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                input:checked + .slider { background-color: var(--primary-color); }
                input:checked + .slider:before { transform: translateX(22px); }
                .kpi-card:hover { transform: translateY(-2px); border-color: var(--primary-color)10 !important; }
            `}</style>
        </div>
    );
};

// --- HELPER COMPONENTS ---
const KpiCard = ({ theme, label, value, trend, icon, color, status }) => {
    const getStatusColor = () => {
        if (status === 'success') return '#10B981';
        if (status === 'danger') return '#EF4444';
        return theme.textMuted;
    };

    return (
        <div style={{ background: theme.surface, padding: '12px 14px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: '0.2s', position: 'relative' }} className="kpi-card">
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '4px', height: '4px', borderRadius: '50%', background: getStatusColor() }} />
            <p style={{ margin: '0 0 2px 0', fontSize: '9px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', color: theme.text, letterSpacing: '-0.02em' }}>{value}</h4>
            <div style={{ fontSize: '8.5px', fontWeight: '800', color: getStatusColor(), display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                {status === 'danger' && <span>⚠</span>}
                {trend}
            </div>
        </div>
    );
};

const Switch = ({ checked, onChange, disabled }) => (
    <label className="switch" style={{ margin: 0, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={e => !disabled && onChange(e.target.checked)} disabled={disabled} />
        <span className="slider round"></span>
    </label>
);

// --- STYLES ---
const sectionHeaderStyle = (theme) => ({
    margin: '0 0 20px 0', fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)',
    textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px'
});
const dividerStyle = (theme) => ({ height: '1px', background: theme.border, margin: '32px 0', opacity: 0.6 });
const settingRowStyle = (theme, noMargin = false) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: noMargin ? 0 : '16px'
});
const settingLabelStyle = (theme) => ({ margin: 0, fontSize: '14px', fontWeight: '700', color: theme.text });
const settingDescStyle = (theme) => ({ margin: '2px 0 0 0', fontSize: '12px', color: theme.textMuted });

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const modalContent = { width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' };

const labelStyle = (theme) => ({ display: 'block', fontSize: '11px', fontWeight: '800', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' });
const inputStyle = (theme) => ({ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none' });
const btnPrimary = { padding: '12px 24px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' };
const btnSecondary = (theme) => ({ padding: '12px 24px', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' });

export default AdminPrograms;
