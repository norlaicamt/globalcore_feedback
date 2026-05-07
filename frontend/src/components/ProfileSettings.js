import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    updateUser,
    deleteUser,
    deactivateUser,
    reactivateUser,
    changePassword
} from "../services/api";
import CustomModal from "./CustomModal";
import ImageCropperModal from "./ImageCropperModal";

// --- ICONS & REGISTRY ---

const Icons = {
    MessageSquare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    AtSign: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" /></svg>,
    ThumbsUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7L21 14v-2.5a2.5 2.5 0 0 0-2.5-2.5zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>,
    Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
    Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    Key: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
    Power: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>,
    Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
    Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    Info: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
    ChevronRight: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
    ChevronDown: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
    Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    AlertCircle: ({ color }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    UserCheck: ({ color }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>,
    Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    EyeOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
};


const calculateProfileCompletion = (user) => {
    if (!user) return 0;
    let score = 0;
    if (user.first_name && user.last_name) score += 20;
    else if (user.name) score += 5;
    if (user.email || user.phone) score += 20;
    if (user.city && user.province) score += 30;
    if (user.barangay) score += 10;
    if (user.birthdate) score += 10;
    if (user.citizenship) score += 10;
    return score;
};


// --- HELPERS & SHARED COMPONENTS ---

const PasswordRule = ({ met, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--size-metadata, 11px)', color: met ? '#10B981' : '#94A3B8', padding: '2px 0' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: met ? '#10B981' : '#E2E8F0' }} />
        <span style={{ fontWeight: '600' }}>{text}</span>
    </div>
);

const DataTile = ({ label, value, icon }) => (
    <div style={styles.dataTile}>
        <div style={styles.tileIcon}>{icon}</div>
        <div>
            <span style={styles.tileLabel}>{label}</span>
            <span style={styles.tileValue}>{value || "—"}</span>
        </div>
    </div>
);

const InputGroup = ({ label, value, onChange, placeholder, type, trailingAction }) => (
    <div style={{ marginBottom: '16px' }}>
        <div style={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: '#F8FAFC', 
            border: '1.5px solid #E2E8F0', 
            borderRadius: '16px', 
            padding: 'var(--card-padding, 10px 16px)',
            transition: 'border-color 0.2s',
            minHeight: 'var(--button-height, 64px)'
        }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <label style={{ 
                    fontSize: 'var(--size-chip, 10px)', 
                    fontWeight: '800', 
                    color: '#94A3B8', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px' 
                }}>
                    {label}
                </label>
                <input 
                    type={type || "text"}
                    style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        outline: 'none', 
                        fontSize: 'var(--size-body, 15px)', 
                        color: '#1E293B', 
                        padding: '0', 
                        width: '100%',
                        fontWeight: '600'
                    }}
                    value={value || ""}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
            {trailingAction && (
                <div style={{ marginLeft: '12px', color: '#94A3B8' }}>
                    {trailingAction}
                </div>
            )}
        </div>
    </div>
);

const ToggleCard = ({ title, desc, isOn, onToggle, icon, isDisabled }) => (
    <div style={{ ...styles.toggleCard, opacity: isDisabled ? 0.5 : 1, filter: isDisabled ? 'grayscale(0.8)' : 'none' }}>
        <div style={{ ...styles.toggleIconContainer, opacity: isDisabled ? 0.3 : 1 }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <h4 style={styles.toggleTitle}>{title}</h4>
            <p style={styles.toggleDesc}>{desc}</p>
        </div>
        <button
            disabled={isDisabled}
            onClick={onToggle}
            style={{ ...styles.toggleBtn, backgroundColor: isOn && !isDisabled ? 'var(--primary-color)' : '#F1F5F9', border: isOn && !isDisabled ? 'none' : '1px solid #E2E8F0' }}
        >
            <div style={{ ...styles.toggleCircle, transform: isOn && !isDisabled ? 'translateX(21px)' : 'translateX(3px)', background: isOn && !isDisabled ? 'white' : '#94A3B8' }} />
        </button>
    </div>
);


// --- SUB-VIEW COMPONENTS ---

const ProfileView = ({ currentUser, onUserUpdate, showToast }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...currentUser });
    const [regionList, setRegionList] = useState([]);
    const [allProvinces, setAllProvinces] = useState({});
    const [provinceList, setProvinceList] = useState([]);
    const [allCities, setAllCities] = useState({});
    const [cityList, setCityList] = useState([]);
    const [barangayList, setBarangayList] = useState([]);
    const [barangayCache, setBarangayCache] = useState({});
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [cropper, setCropper] = useState({ isOpen: false, image: null });

    const normalize = (val) => val?.toLowerCase().trim();

    // 1. Initial Load of Base Assets
    useEffect(() => {
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
    }, []);

    // 2. Chained Sync for Region -> Province
    useEffect(() => {
        if (formData.region && allProvinces[formData.region]) {
            setProvinceList(allProvinces[formData.region]);
        } else {
            setProvinceList([]);
        }
    }, [formData.region, allProvinces]);

    // 3. Chained Sync for Province -> City
    useEffect(() => {
        if (formData.province && allCities[formData.province]) {
            setCityList(allCities[formData.province]);
        } else {
            setCityList([]);
        }
    }, [formData.province, allCities]);

    // 4. Chained Sync for City -> Barangay (with Caching)
    useEffect(() => {
        const loadBarangays = async () => {
            if (!formData.city) {
                setBarangayList([]);
                return;
            }
            if (barangayCache[formData.city]) {
                setBarangayList(barangayCache[formData.city]);
                return;
            }
            setIsLoadingLocations(true);
            try {
                const safeCity = formData.city.replace(/[^a-z0-9]/gi, (x) => (" -_".includes(x) ? x : "")).trim();
                const res = await fetch(`/assets/locations/barangays/${safeCity}.json`);
                if (res.ok) {
                    const data = await res.json();
                    setBarangayList(data);
                    setBarangayCache(prev => ({ ...prev, [formData.city]: data }));
                } else {
                    setBarangayList([]);
                }
            } catch (err) {
                setBarangayList([]);
            } finally {
                setIsLoadingLocations(false);
            }
        };
        loadBarangays();
    }, [formData.city]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setCropper({ isOpen: true, image: event.target.result });
        };
        reader.readAsDataURL(file);
    };

    const handleCropConfirm = async (croppedBase64) => {
        setCropper({ isOpen: false, image: null });
        try {
            const updated = await updateUser(currentUser.id, { avatar_url: croppedBase64 });
            onUserUpdate(updated);
            showToast("Avatar updated successfully");
        } catch (err) {
            showToast("Failed to update avatar");
        }
    };

    const handleSave = async () => {
        try {
            const updatedUser = await updateUser(currentUser.id, formData);
            onUserUpdate(updatedUser);
            setIsEditing(false);
            showToast("Changes saved successfully");
        } catch (err) {
            showToast("Failed to save changes");
        }
    };


    return (
        <div style={styles.viewContainer}>
            <div style={styles.sectionHeader}>
                <h2 style={styles.viewTitle}>Professional Identity</h2>
                <p style={styles.viewSubtitle}>Manage your organizational profile and regional stewardship data.</p>
            </div>

            <div style={styles.heroCard}>
                <div style={styles.heroContent}>
                    <div style={styles.avatarLargeContainer}>
                        {currentUser.avatar_url ? (
                            <img src={currentUser.avatar_url} style={styles.avatarLarge} alt="Avatar" />
                        ) : (
                            <div style={styles.avatarLargePlaceholder}>
                                {currentUser.name?.[0] || "U"}
                            </div>
                        )}
                        <input type="file" id="citizen-avatar-upload" hidden onChange={handleAvatarChange} accept="image/*" />
                        <label htmlFor="citizen-avatar-upload" style={styles.heroEditBadge}>
                            <Icons.Edit />
                        </label>
                    </div>
                    <div style={styles.heroText}>
                        <h3 style={styles.heroName}>{currentUser.name}</h3>
                        <p style={styles.heroUsername}>@{currentUser.username || currentUser.name.toLowerCase().replace(" ", ".")}</p>

                        <div style={{ ...styles.badgeRow, marginTop: '14px' }}>
                            {currentUser.role !== 'user' && (
                                <span style={styles.roleBadge}>{currentUser.role === 'superadmin' ? 'Global Admin' : currentUser.role.toUpperCase()}</span>
                            )}
                            <span style={styles.statusBadge}>Verified</span>
                        </div>
                    </div>
                    <button 
                        style={{ 
                            ...styles.premiumEditBtn, 
                            background: isEditing ? '#F1F5F9' : 'var(--primary-color)', 
                            color: isEditing ? '#64748B' : 'white',
                            boxShadow: isEditing ? 'none' : '0 8px 16px rgba(var(--primary-rgb), 0.2)',
                            border: isEditing ? '1px solid #E2E8F0' : 'none'
                        }} 
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? "Cancel" : "Edit"}
                    </button>
                </div>

                <div style={styles.statsBar}>
                    <div style={styles.statBox}>
                        <span style={styles.statVal}>{currentUser.impact_points || 0}</span>
                        <span style={styles.statLab}>Impact Points</span>
                    </div>
                    <div style={styles.statDivider} />
                    <div style={styles.statBox}>
                        <span style={styles.statVal}>{currentUser.likes_received || 0}</span>
                        <span style={styles.statLab}>Likes Earned</span>
                    </div>
                    <div style={styles.statDivider} />
                    <div style={styles.statBox}>
                        <span style={styles.statVal}>{currentUser.posts_count || 0}</span>
                        <span style={styles.statLab}>Submissions</span>
                    </div>
                </div>
            </div>

            <div style={styles.sectionCardPremiumProfile}>
                {!isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* SECTION: PERSONAL IDENTITY */}
                        <div>
                            <div style={{ ...styles.cardHeader, borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                                <h4 style={styles.cardTitlePremium}>Personal Information</h4>
                            </div>
                            <div style={{ ...styles.dataGridPremium, marginTop: '20px' }}>
                                <DataTile label="Full Name" value={currentUser.name} icon={<Icons.Users />} />
                                <DataTile label="Citizenship" value={currentUser.citizenship} icon={<Icons.Shield />} />
                                <DataTile label="Marital Status" value={currentUser.marital_status} icon={<Icons.Info />} />
                                <DataTile label="Birthdate" value={currentUser.birthdate} icon={<Icons.Calendar />} />
                            </div>
                        </div>

                        {/* SECTION: ADDRESS INFORMATION */}
                        <div>
                            <div style={{ ...styles.cardHeader, borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                                <h4 style={styles.cardTitlePremium}>Address Information</h4>
                            </div>
                            <div style={{ ...styles.dataGridPremium, marginTop: '20px' }}>
                                <DataTile label="Region" value={currentUser.region} icon={<Icons.Activity />} />
                                <DataTile label="Province" value={currentUser.province} icon={<Icons.Activity />} />
                                <DataTile label="City / Municipality" value={currentUser.city} icon={<Icons.Activity />} />
                                <DataTile label="Barangay" value={currentUser.barangay} icon={<Icons.Activity />} />
                            </div>
                        </div>

                        {/* SECTION: ORGANIZATIONAL (Hide for standard users) */}
                        {currentUser.role !== 'user' && (
                            <div>
                                <div style={{ ...styles.cardHeader, borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                                    <h4 style={{ ...styles.cardTitlePremium, color: '#64748B' }}>Professional Metadata</h4>
                                </div>
                                <div style={{ ...styles.dataGridPremium, marginTop: '20px' }}>
                                    <DataTile label="Position Title" value={currentUser.position_title} icon={<Icons.Zap />} />
                                    <DataTile label="Unit / Department" value={currentUser.unit_name || currentUser.department} icon={<Icons.Shield />} />
                                    <DataTile label="Official Program" value={currentUser.program} icon={<Icons.Zap />} />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={styles.formPadding}>
                        {/* EDIT SECTION: PERSONAL */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ ...styles.cardHeader, borderBottom: '1.5px solid var(--primary-color)', paddingBottom: '10px', marginBottom: '24px' }}>
                                <h4 style={styles.cardTitlePremium}>Edit Personal Information</h4>
                            </div>
                            <div style={styles.formGridPremium}>
                                <InputGroup label="Full Legal Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} />
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>Citizenship</label>
                                    <select style={styles.inputField} value={formData.citizenship} onChange={e => setFormData({ ...formData, citizenship: e.target.value })}>
                                        <option value="">Select Citizenship</option>
                                        <option value="Filipino">Filipino</option>
                                        <option value="Foreign National">Foreign National</option>
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>Marital Status</label>
                                    <select style={styles.inputField} value={formData.marital_status} onChange={e => setFormData({ ...formData, marital_status: e.target.value })}>
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Separated">Separated</option>
                                    </select>
                                </div>
                                <InputGroup type="date" label="Birthdate" value={formData.birthdate} onChange={v => setFormData({ ...formData, birthdate: v })} />
                            </div>
                        </div>

                        {/* EDIT SECTION: ADDRESS */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ ...styles.cardHeader, borderBottom: '1.5px solid var(--primary-color)', paddingBottom: '10px', marginBottom: '24px' }}>
                                <h4 style={styles.cardTitlePremium}>Edit Address Information</h4>
                            </div>
                            <div style={styles.formGridPremium}>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>Region</label>
                                    <select style={styles.inputField} value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value, province: "", city: "", barangay: "" })}>
                                        <option value="">Select Region</option>
                                        {regionList.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>Province</label>
                                    <select style={styles.inputField} value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value, city: "", barangay: "" })} disabled={!formData.region}>
                                        <option value="">Select Province</option>
                                        {provinceList.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>City / Municipality</label>
                                    <select style={styles.inputField} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value, barangay: "" })} disabled={!formData.province}>
                                        <option value="">Select City / Municipality</option>
                                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>Barangay</label>
                                    <select style={styles.inputField} value={formData.barangay} onChange={e => setFormData({ ...formData, barangay: e.target.value })} disabled={!formData.city || isLoadingLocations}>
                                        <option value="">{isLoadingLocations ? "Loading Barangays..." : "Select Barangay"}</option>
                                        {barangayList.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* EDIT SECTION: ORGANIZATIONAL (Admins Only) */}
                        {currentUser.role !== 'user' && (
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ ...styles.cardHeader, borderBottom: '1.5px solid #64748B', paddingBottom: '10px', marginBottom: '24px' }}>
                                    <h4 style={{ ...styles.cardTitlePremium, color: '#64748B' }}>Edit Organizational Context</h4>
                                </div>
                                <div style={styles.formGridPremium}>
                                    <InputGroup label="Position Title" value={formData.position_title} onChange={v => setFormData({ ...formData, position_title: v })} />
                                    <InputGroup label="Unit / Department" value={formData.unit_name} onChange={v => setFormData({ ...formData, unit_name: v })} />
                                    <InputGroup label="Official Program" value={formData.program} onChange={v => setFormData({ ...formData, program: v })} />
                                </div>
                            </div>
                        )}

                        <div style={styles.formActionsPremium}>
                            <button style={styles.primaryBtnPremium} onClick={handleSave}>
                                Save Changes
                            </button>
                            <button style={styles.secondaryBtnPremium} onClick={() => setIsEditing(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
            <ImageCropperModal 
                isOpen={cropper.isOpen} 
                imageSrc={cropper.image} 
                onCrop={handleCropConfirm} 
                onCancel={() => setCropper({ isOpen: false, image: null })} 
            />
        </div>
    );
};

const NotificationsView = ({ currentUser, notifs, handleToggle }) => {
    const isAdmin = ["admin", "superadmin"].includes(currentUser.role);

    return (
        <div style={styles.viewContainer}>
            <div style={styles.sectionHeader}>
                <h2 style={styles.viewTitle}>Awareness & Notifications</h2>
                <p style={styles.viewSubtitle}>
                    {isAdmin
                        ? "Configure administrative alerts and interaction triggers for your scope."
                        : "Control how you are notified about your feedback activity."
                    }
                </p>
            </div>

            {isAdmin && (
                <div style={styles.scopeAwarenessBanner}>
                    <div style={styles.scopeIcon}><Icons.Info /></div>
                    <div style={styles.scopeText}>
                        <strong>Administrative Scope Active</strong>
                        <p>You will receive organizational alerts strictly isolated to your assigned Entity: <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>{currentUser.program || currentUser.entity_name || 'Global Scope'}</span>.</p>
                    </div>
                </div>
            )}

            <div style={styles.cardStack}>
                <div style={styles.notificationGroup}>
                    <h3 style={styles.groupHeader}>Feedback Activity</h3>
                    <div style={styles.groupStack}>
                        {isAdmin && (
                            <ToggleCard
                                title="New Feedback Submitted"
                                desc="Alert when any new feedback is created within your entity."
                                isOn={notifs.new_feedback}
                                icon={<Icons.AlertCircle color="var(--primary-color)" />}
                                onToggle={() => handleToggle("notify_new_feedback", "New Feedback alert")}
                            />
                        )}
                        <ToggleCard
                            title="Comments & Replies"
                            desc="Notify me when someone interacts with my feedback."
                            isOn={notifs.replies || notifs.comments}
                            icon={<Icons.MessageSquare />}
                            onToggle={() => handleToggle(["notify_replies", "notify_comments"], "Comments & Replies")}
                        />
                        <ToggleCard
                            title="Mentions & Tags"
                            desc="Notify me if I am tagged in a stewardship conversation."
                            isOn={notifs.mentions}
                            icon={<Icons.AtSign />}
                            onToggle={() => handleToggle("notify_mentions", "Mentions")}
                        />
                        <ToggleCard
                            title="Reactions"
                            desc="Update when users like or appreciate my submission."
                            isOn={notifs.likes}
                            icon={<Icons.ThumbsUp />}
                            onToggle={() => handleToggle("notify_likes", "Likes")}
                        />
                    </div>
                </div>

                {isAdmin && (
                    <div style={styles.notificationGroup}>
                        <h3 style={styles.groupHeader}>Admin Responsibilities</h3>
                        <div style={styles.groupStack}>
                            <ToggleCard
                                title="Feedback Assigned to Me"
                                desc="Critical alert when a feedback is officially routed to your account."
                                isOn={notifs.assigned}
                                icon={<Icons.UserCheck color="#10B981" />}
                                onToggle={() => handleToggle("notify_assigned", "Assignment alert")}
                            />
                            <ToggleCard
                                title="High Activity Alerts"
                                desc="Smart alert for feedback threads with trending activity (10+ replies)."
                                isOn={notifs.activity}
                                icon={<Icons.Zap color="#F59E0B" />}
                                onToggle={() => handleToggle("notify_high_activity", "High activity alert")}
                            />
                        </div>
                    </div>
                )}

                <div style={styles.notificationGroup}>
                    <h3 style={styles.groupHeader}>System & Broadcast</h3>
                    <div style={styles.groupStack}>
                        <ToggleCard
                            title="Broadcasting Alerts"
                            desc="Official emergency or system-wide announcements."
                            isOn={notifs.announcements}
                            icon={<Icons.Bell />}
                            onToggle={() => handleToggle("notify_announcements", "Announcements")}
                        />
                        <ToggleCard
                            title="Platform Resilience"
                            desc="Technical updates regarding platform maintenance or security."
                            isOn={notifs.system}
                            icon={<Icons.Activity />}
                            onToggle={() => handleToggle("notify_system_announcements", "System updates")}
                        />
                    </div>
                </div>

                <div style={styles.notificationGroup}>
                    <h3 style={styles.groupHeader}>Stewardship Summaries</h3>
                    <div style={styles.groupStack}>
                        <ToggleCard
                            title="Daily Summary"
                            desc="A 24-hour digest of administrative activity (Requires Email)."
                            isOn={notifs.daily}
                            isDisabled={!notifs.email}
                            icon={<Icons.Clock />}
                            onToggle={() => handleToggle("daily_summary", "Daily digest")}
                        />
                        <ToggleCard
                            title="Weekly Insight"
                            desc="Comprehensive weekly stewardship report every Friday."
                            isOn={notifs.weekly}
                            isDisabled={!notifs.email}
                            icon={<Icons.Calendar />}
                            onToggle={() => handleToggle("weekly_digest", "Weekly report")}
                        />
                    </div>
                </div>

                <div style={styles.notificationGroup}>
                    <h3 style={styles.groupHeader}>Notification Channels</h3>
                    <div style={styles.groupStack}>
                        <ToggleCard
                            title="Mobile Push Notifications"
                            desc="Instant alerts on your connected devices."
                            isOn={notifs.push}
                            icon={<Icons.Zap color="#8B5CF6" />}
                            onToggle={() => handleToggle("push_notifications", "Push Notifications")}
                        />
                        <ToggleCard
                            title="Professional Email"
                            desc="Formal notifications sent to your registered address."
                            isOn={notifs.email}
                            icon={<Icons.Mail color="var(--primary-color)" />}
                            onToggle={() => handleToggle("email_notifications", "Email Notifications")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const PrivacyView = ({ currentUser, onUserUpdate, showToast, onLogout }) => {
    const [pOld, setPOld] = useState("");
    const [pNew, setPNew] = useState("");
    const [pConfirm, setPConfirm] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [deactivateDays, setDeactivateDays] = useState(2);
    const [showHiatusConfirm, setShowHiatusConfirm] = useState(false);

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Validation 
    const isLenValid = pNew.length >= 8;
    const hasNum = /\d/.test(pNew);
    const isMatch = pNew === pConfirm && pNew.length > 0;
    const canUpdate = isLenValid && hasNum && isMatch && pOld.length > 0;

    const handlePasswordChange = async () => {
        if (!canUpdate) return;
        setIsUpdating(true);
        try {
            await changePassword(currentUser.id, pOld, pNew);
            showToast("Password updated successfully.");
            setPOld(""); setPNew(""); setPConfirm("");
        } catch (err) {
            const msg = err.response?.data?.detail || "Failed to recognize current password.";
            showToast(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeactivate = async () => {
        try {
            await deactivateUser(currentUser.id, deactivateDays);
            showToast(`Account activity paused for ${deactivateDays === 0 ? 'indefinite' : deactivateDays + ' days'}.`);
            onLogout();
        } catch (err) {
            showToast("Failed to pause account activity.");
        }
    };

    const handleReactivate = async () => {
        try {
            const updated = await reactivateUser(currentUser.id);
            onUserUpdate(updated);
            showToast("Account activity has been resumed.");
        } catch (err) {
            showToast("Failed to resume account activity.");
        }
    };

    const isPaused = currentUser.is_active === false;
    const [isExpanded, setIsExpanded] = useState(isPaused);
    const [isPassExpanded, setIsPassExpanded] = useState(false);
    const resumeDate = currentUser.deactivated_until 
        ? new Date(currentUser.deactivated_until).toLocaleString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true 
          }) 
        : "Manual resume required";

    return (
        <div style={styles.viewContainer}>
            <div style={styles.sectionHeader}>
                <h2 style={styles.viewTitle}>Security & Privacy</h2>
                <p style={styles.viewSubtitle}>Controls for your identity and account security.</p>
            </div>

            {/* SECTION 1: ACCOUNT INFORMATION */}
            <div style={styles.sectionCardPremium}>
                <h4 style={{ ...styles.cardTitlePremium, fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '24px' }}>
                    Account Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <span style={{ ...styles.fieldLabel, color: '#64748B', display: 'block', marginBottom: '4px' }}>Registered Email</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-color)' }}>{currentUser.email}</span>
                    </div>
                    <div>
                        <span style={{ ...styles.fieldLabel, color: '#64748B', display: 'block', marginBottom: '4px' }}>Registered Contact Number</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-color)' }}>{currentUser.phone || "Not set"}</span>
                    </div>
                </div>
            </div>
            {/* SECTION 2: CHANGE PASSWORD (ACCORDION) */}
            <div 
                style={{ 
                    ...styles.sectionCardPremium, 
                    padding: 0,
                    overflow: 'hidden',
                    marginBottom: '24px'
                }}
            >
                {/* Accordion Header */}
                <div 
                    onClick={() => setIsPassExpanded(!isPassExpanded)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsPassExpanded(!isPassExpanded);
                        }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isPassExpanded}
                    aria-controls="change-password-content"
                    style={{ 
                        padding: '24px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h4 style={{ ...styles.cardTitlePremium, fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
                            Change Password
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.Shield color={canUpdate ? "#10B981" : "#94A3B8"} />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: canUpdate ? "#059669" : "#64748B" }}>
                                Security Strength: {canUpdate ? "High" : "Standard"}
                            </span>
                        </div>
                    </div>
                    <div style={{ 
                        transform: isPassExpanded ? 'rotate(180deg)' : 'rotate(0)', 
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        color: '#94A3B8'
                    }}>
                        <Icons.ChevronDown />
                    </div>
                </div>

                {/* Accordion Content */}
                <div 
                    id="change-password-content"
                    style={{ 
                        maxHeight: isPassExpanded ? '1000px' : '0',
                        opacity: isPassExpanded ? 1 : 0,
                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                        visibility: isPassExpanded ? 'visible' : 'hidden',
                        borderTop: isPassExpanded ? '1px solid #F1F5F9' : '1px solid transparent'
                    }}
                >
                    <div style={{ padding: '24px' }}>
                        <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <InputGroup
                                label="Current Password"
                                value={pOld}
                                onChange={setPOld}
                                type={showOld ? "text" : "password"}
                                placeholder="••••••••"
                                trailingAction={
                                    <div onClick={() => setShowOld(!showOld)} style={{ color: '#94A3B8', cursor: 'pointer', display: 'flex' }}>
                                        {showOld ? <Icons.Eye /> : <Icons.EyeOff />}
                                    </div>
                                }
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <InputGroup
                                    label="New Password"
                                    value={pNew}
                                    onChange={setPNew}
                                    type={showNew ? "text" : "password"}
                                    placeholder="••••••••"
                                    trailingAction={
                                        <div onClick={() => setShowNew(!showNew)} style={{ color: '#94A3B8', cursor: 'pointer', display: 'flex' }}>
                                            {showNew ? <Icons.Eye /> : <Icons.EyeOff />}
                                        </div>
                                    }
                                />
                                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                    <PasswordRule met={isLenValid} text="Minimum 8 characters" />
                                    <PasswordRule met={hasNum} text="Include at least one number" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <InputGroup
                                    label="Confirm Password"
                                    value={pConfirm}
                                    onChange={setPConfirm}
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="••••••••"
                                    trailingAction={
                                        <div onClick={() => setShowConfirm(!showConfirm)} style={{ color: '#94A3B8', cursor: 'pointer', display: 'flex' }}>
                                            {showConfirm ? <Icons.Eye /> : <Icons.EyeOff />}
                                        </div>
                                    }
                                />
                                {pConfirm.length > 0 && (
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: isMatch ? '#10B981' : '#EF4444', textAlign: 'right', padding: '0 4px' }}>
                                        {isMatch ? "Passwords match ✓" : "Passwords do not match"}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '8px' }}>
                                <button
                                    style={{
                                        ...styles.primaryBtnPremium,
                                        width: '100%',
                                        justifyContent: 'center',
                                        opacity: canUpdate ? 1 : 0.5,
                                        cursor: canUpdate ? 'pointer' : 'not-allowed'
                                    }}
                                    onClick={handlePasswordChange}
                                    disabled={!canUpdate || isUpdating}
                                >
                                    {isUpdating ? "Updating Password..." : "Update Password"}
                                </button>
                                <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginTop: '16px' }}>
                                    🔒 Your password is securely encrypted and never stored in plain text.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: ACCOUNT ACTIVITY CONTROL (ACCORDION) */}
            <div 
                style={{ 
                    ...styles.sectionCardPremium, 
                    background: '#F8FAFC', 
                    borderColor: '#E2E8F0',
                    padding: 0,
                    overflow: 'hidden'
                }}
            >
                {/* Accordion Header */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsExpanded(!isExpanded);
                        }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-controls="account-activity-content"
                    style={{ 
                        padding: '24px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h4 style={{ ...styles.cardTitlePremium, fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
                            Account Activity Control
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPaused ? '#F59E0B' : '#10B981' }} />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: isPaused ? '#D97706' : '#64748B' }}>
                                Status: {isPaused ? `Paused` : 'Active'}
                            </span>
                            {isPaused && (
                                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>
                                    (Until {resumeDate})
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ 
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', 
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        color: '#94A3B8'
                    }}>
                        <Icons.ChevronDown />
                    </div>
                </div>

                {/* Accordion Content */}
                <div 
                    id="account-activity-content"
                    style={{ 
                        maxHeight: isExpanded ? '1000px' : '0',
                        opacity: isExpanded ? 1 : 0,
                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                        visibility: isExpanded ? 'visible' : 'hidden',
                        borderTop: isExpanded ? '1px solid #F1F5F9' : '1px solid transparent'
                    }}
                >
                    <div style={{ padding: '24px' }}>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '24px', fontWeight: '500' }}>
                            {isPaused 
                                ? "Your account activity is currently paused. You are invisible to other users and will not receive system notifications."
                                : "Temporarily pause your account activity. During this period, you will not receive notifications or appear as active in the system."}
                        </p>

                        {!isPaused ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Pause Duration
                                    </label>
                                    <select
                                        style={{ ...styles.selectFieldPremium, background: 'white', height: '56px' }}
                                        value={deactivateDays}
                                        onChange={(e) => setDeactivateDays(parseInt(e.target.value))}
                                    >
                                        <option value={2}>48 Hours (2 Days)</option>
                                        <option value={7}>7 Days (1 Week)</option>
                                        <option value={30}>30 Days (1 Month)</option>
                                        <option value={0}>Until Next Login</option>
                                    </select>
                                </div>

                                <div style={{ background: 'rgba(241, 245, 249, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />
                                            <span>Notifications will be paused</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />
                                            <span>Your account will appear inactive</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8' }} />
                                            <span>Activity tracking will resume after the selected duration</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        style={{ ...styles.primaryBtnPremium, width: '100%', justifyContent: 'center', background: '#475569' }}
                                        onClick={() => setShowHiatusConfirm(true)}
                                    >
                                        Pause Activity
                                    </button>
                                    <button
                                        style={{ ...styles.secondaryBtnPremium, width: '100%', border: 'none', background: 'transparent', color: '#64748B' }}
                                        onClick={() => showToast("Action cancelled.")}
                                    >
                                        Cancel
                                    </button>
                                    <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginTop: '4px' }}>
                                        You can resume your activity anytime before the selected duration ends.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <button
                                    style={{ ...styles.primaryBtnPremium, width: '100%', justifyContent: 'center', background: '#10B981' }}
                                    onClick={handleReactivate}
                                >
                                    Resume Activity Now
                                </button>
                                <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>
                                    Reactivating will restore your visibility and notification settings immediately.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CustomModal
                isOpen={showHiatusConfirm}
                type="alert"
                title="Confirm Activity Pause"
                message={
                    <div>
                        <p style={{ marginBottom: '16px' }}>You are about to pause your account for {deactivateDays === 0 ? "an indefinite period" : deactivateDays + " days"}.</p>
                        <ul style={{ paddingLeft: '20px', color: '#64748B', fontSize: '13px', lineHeight: '1.8' }}>
                            <li>You will be logged out immediately</li>
                            <li>You will not receive system notifications</li>
                            <li>Your account will appear inactive in the system</li>
                        </ul>
                        <p style={{ marginTop: '16px', fontWeight: '600' }}>Do you want to proceed?</p>
                    </div>
                }
                confirmText="Confirm Pause"
                onConfirm={handleDeactivate}
                onCancel={() => setShowHiatusConfirm(false)}
            />
        </div>
    );
};


// --- MAIN SETTINGS COMPONENT ---

const ProfileSettings = ({ currentUser, onUserUpdate, onLogout, initialSubView }) => {
    const [toast, setToast] = useState({ show: false, message: "" });

    let activeTab = "profile";
    if (initialSubView === "notifs" || initialSubView === "notifications") activeTab = "notifications";
    if (initialSubView === "privacy" || initialSubView === "security") activeTab = "privacy";
    if (initialSubView === "personal_info" || initialSubView === "profile") activeTab = "profile";

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
    };

    const handleToggleNotif = async (fieldOrFields, uiKey) => {
        try {
            let updates = {};
            if (Array.isArray(fieldOrFields)) {
                const anyTrue = fieldOrFields.some(f => currentUser[f]);
                fieldOrFields.forEach(f => {
                    updates[f] = !anyTrue;
                });
            } else {
                updates[fieldOrFields] = !currentUser[fieldOrFields];
            }

            const updated = { ...currentUser, ...updates };
            await updateUser(currentUser.id, updates);
            onUserUpdate(updated);
            showToast(`Preference updated: ${uiKey}`);
        } catch (err) {
            showToast("Failed to update notification settings");
        }
    };

    return (
        <div style={styles.container}>
            {/* CONTENT AREA ONLY */}
            <div style={styles.contentAreaOnly}>
                <div style={styles.scrollWrapper}>
                    {activeTab === "profile" && <ProfileView currentUser={currentUser} onUserUpdate={onUserUpdate} showToast={showToast} />}
                    {activeTab === "notifications" && (
                        <NotificationsView
                            currentUser={currentUser}
                            notifs={{
                                replies: currentUser.notify_replies,
                                comments: currentUser.notify_comments,
                                mentions: currentUser.notify_mentions,
                                likes: currentUser.notify_likes,
                                announcements: currentUser.notify_announcements,
                                push: currentUser.push_notifications,
                                email: currentUser.email_notifications,
                                weekly: currentUser.weekly_digest,
                                daily: currentUser.daily_summary,
                                new_feedback: currentUser.notify_new_feedback,
                                assigned: currentUser.notify_assigned,
                                activity: currentUser.notify_high_activity,
                                system: currentUser.notify_system_announcements
                            }}
                            handleToggle={handleToggleNotif}
                        />
                    )}
                    {activeTab === "privacy" && <PrivacyView currentUser={currentUser} onUserUpdate={onUserUpdate} showToast={showToast} onLogout={onLogout} />}
                </div>
            </div>

            {/* TOAST SYSTEM */}
            {toast.show && (
                <div style={styles.toast}>
                    <Icons.Check />
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};


// --- STYLES ---

const styles = {
    container: { display: 'flex', flexDirection: 'column', padding: '10px 0', background: 'transparent', fontFamily: '"Inter", sans-serif' },
    contentAreaOnly: { flex: 1 },
    scrollWrapper: { padding: '20px' },
    viewContainer: { maxWidth: '840px', margin: '0 auto', fontSize: 'var(--size-body, 14px)' },
    sectionHeader: { marginBottom: 'var(--card-padding, 48px)' },
    viewTitle: { fontSize: 'var(--size-page-title, 32px)', fontWeight: '900', color: 'var(--primary-color)', margin: '0 0 10px 0', letterSpacing: '-1.5px' },
    viewSubtitle: { fontSize: 'var(--size-secondary, 16px)', color: '#64748B', margin: 0, fontWeight: '500' },

    heroCard: { background: 'white', borderRadius: '32px', padding: 'var(--card-padding, 40px)', border: '1.5px solid #E2E8F0', boxShadow: '0 15px 40px rgba(0,0,0,0.03)', marginBottom: '32px' },
    heroContent: { display: 'flex', alignItems: 'center', gap: 'var(--card-padding, 32px)', marginBottom: 'var(--card-padding, 40px)' },
    avatarLargeContainer: { position: 'relative' },
    avatarLarge: { width: 'var(--avatar-size-large, 110px)', height: 'var(--avatar-size-large, 110px)', borderRadius: '35px', objectFit: 'cover', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    avatarLargePlaceholder: { width: 'var(--avatar-size-large, 110px)', height: 'var(--avatar-size-large, 110px)', borderRadius: '35px', background: '#F1F5F9', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--size-nav, 40px)', fontWeight: '900' },
    heroEditBadge: { position: 'absolute', bottom: '-4px', right: '-4px', width: 'var(--button-height, 32px)', height: 'var(--button-height, 32px)', borderRadius: '10px', background: 'var(--primary-color)', color: 'white', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    heroText: { flex: 1 },
    heroName: { fontSize: 'var(--size-user-name, 26px)', fontWeight: '900', color: 'var(--primary-color)', margin: '0 0 4px 0', letterSpacing: '-0.5px' },
    heroUsername: { fontSize: 'var(--size-metadata, 13px)', fontWeight: '800', color: 'var(--primary-color)', margin: '0 0 6px 0', letterSpacing: '0.5px' },
    heroEmail: { fontSize: 'var(--size-secondary, 14px)', color: '#64748B', fontWeight: '500', marginBottom: '16px' },
    badgeRow: { display: 'flex', gap: '8px' },
    roleBadge: { padding: '2px 8px', background: '#F0F9FF', color: '#0369A1', borderRadius: '20px', fontSize: 'var(--size-chip, 8.5px)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statusBadge: { padding: '2px 8px', background: '#F0FDF4', color: '#166534', borderRadius: '20px', fontSize: 'var(--size-chip, 8.5px)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' },
    premiumEditBtn: { padding: 'var(--card-padding, 8px 14px)', height: 'var(--button-height, 32px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(var(--primary-rgb), 0.04)', color: 'var(--primary-color)', border: '1.5px solid rgba(var(--primary-rgb), 0.1)', borderRadius: '10px', fontSize: 'var(--size-nav, 11px)', fontWeight: '800', cursor: 'pointer' },

    statsBar: { display: 'flex', padding: 'var(--card-padding, 24px 0)', borderTop: '1px solid #F1F5F9' },
    statBox: { flex: 1, textAlign: 'center' },
    statVal: { fontSize: 'var(--size-nav, 24px)', fontWeight: '900', color: 'var(--primary-color)', display: 'block' },
    statLab: { fontSize: 'var(--size-chip, 10px)', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' },
    statDivider: { width: '1.5px', background: '#F1F5F9' },

    sectionCardPremium: { background: 'white', borderRadius: '32px', padding: 'var(--card-padding, 40px)', border: '1.5px solid #E2E8F0', marginBottom: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' },
    sectionCardPremiumProfile: { background: 'white', borderRadius: '32px', padding: 'var(--card-padding, 40px)', border: '1.5px solid #E2E8F0', marginBottom: '32px' },
    cardTitlePremium: { fontSize: 'var(--size-card-title, 20px)', fontWeight: '900', color: 'var(--primary-color)', letterSpacing: '-0.5px' },
    cardHeader: { marginBottom: 'var(--card-padding, 32px)' },
    dataGridPremium: { display: 'grid', gridTemplateColumns: 'repeat(var(--grid-cols, 2), 1fr)', gap: 'var(--card-padding, 20px)' },
    dataTile: { padding: 'var(--card-padding, 20px)', borderRadius: '20px', background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', gap: '16px' },
    tileIcon: { width: 'var(--avatar-size, 40px)', height: 'var(--avatar-size, 40px)', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
    tileLabel: { fontSize: 'var(--size-chip, 10px)', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' },
    tileValue: { fontSize: 'var(--size-secondary, 14px)', fontWeight: '700', color: '#1E293B', display: 'block' },

    formGridPremium: { display: 'grid', gridTemplateColumns: 'repeat(var(--grid-cols, 2), 1fr)', gap: 'var(--card-padding, 20px)' },
    inputWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
    fieldLabel: { fontSize: 'var(--size-metadata, 12px)', fontWeight: '800', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px' },
    inputField: { padding: '16px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '16px', fontSize: 'var(--size-body, 15px)', color: '#1E293B' },
    selectFieldPremium: { padding: '16px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '16px', fontSize: 'var(--size-body, 15px)', outline: 'none' },
    primaryBtnPremium: { padding: '16px 28px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '18px', fontSize: 'var(--size-nav, 15px)', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', height: 'var(--button-height, 48px)', justifyContent: 'center' },
    secondaryBtnPremium: { padding: '16px 28px', background: 'transparent', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: '18px', fontSize: 'var(--size-nav, 15px)', fontWeight: '700', cursor: 'pointer', height: 'var(--button-height, 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    formActionsPremium: { display: 'flex', gap: '16px', marginTop: '40px', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '32px' },

    scopeAwarenessBanner: { display: 'flex', gap: '20px', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '24px', borderRadius: '24px', marginBottom: '40px' },
    scopeIcon: { width: '48px', height: '48px', background: '#E0F2FE', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369A1' },
    scopeText: { flex: 1, fontSize: '14px', color: '#0369A1' },

    notificationGroup: { marginBottom: 'var(--card-padding, 48px)' },
    groupHeader: { fontSize: 'var(--size-chip, 11px)', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', paddingLeft: '8px' },
    groupStack: { display: 'flex', flexDirection: 'column', gap: '12px' },
    toggleCard: { display: 'flex', alignItems: 'center', padding: 'var(--card-padding, 24px)', background: 'white', borderRadius: '24px', border: '1.5px solid #F1F5F9', transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' },
    toggleIconContainer: { width: 'var(--avatar-size, 40px)', height: 'var(--avatar-size, 40px)', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', marginRight: 'var(--card-padding, 16px)' },
    toggleTitle: { fontSize: 'var(--size-card-title, 16px)', fontWeight: '800', color: 'var(--primary-color)', margin: '0 0 4px 0' },
    toggleDesc: { fontSize: 'var(--size-body, 13px)', color: '#64748B', margin: 0, lineHeight: '1.5', paddingRight: '20px' },
    toggleBtn: { width: '40px', height: '22px', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s', flexShrink: 0 },
    toggleCircle: { width: '16px', height: '16px', borderRadius: '50%', position: 'absolute', top: '3px', left: '0', transition: 'all 0.3s' },
    cardStack: { display: 'flex', flexDirection: 'column', gap: '0' },
    formPadding: { padding: 'var(--card-padding, 24px)' },

    toast: { position: 'fixed', bottom: '40px', right: '40px', background: 'var(--primary-color)', color: 'white', padding: '20px 32px', borderRadius: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease-out', zIndex: 99999 },
};

export default ProfileSettings;