import React, { useState, useEffect, useRef } from "react";
import CustomModal from "./CustomModal";
import { deleteUser, updateUser, getUserById, getCategories } from "../services/api";

// --- MODERN PREMIUM ICONS ---
const Icons = {
  Profile: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Gear: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1-2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Chevron: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

const ProfileSettings = ({ currentUser, onBack, onLogout, onUserUpdate, initialSubView = "personal_info" }) => {
  const [activeTab, setActiveTab] = useState(initialSubView);
  
  useEffect(() => {
    setActiveTab(initialSubView);
  }, [initialSubView]);
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  // States for stats
  const [stats, setStats] = useState({ impact_points: 0, posts_count: 0, likes_received: 0 });

  // Notification states
  const [notifs, setNotifs] = useState({
    push: currentUser?.push_notifications ?? true,
    email: currentUser?.email_notifications ?? false,
    status: currentUser?.status_updates ?? true,
    replies: currentUser?.reply_notifications ?? true,
    weekly: currentUser?.weekly_digest ?? false,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.id) return;
      try {
        const data = await getUserById(currentUser.id);
        setStats({
          impact_points: data.impact_points,
          posts_count: data.posts_count,
          likes_received: data.likes_received
        });
      } catch(e) { console.error(e); }
    };
    fetchStats();
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTogglePreference = async (field, key) => {
    const next = !notifs[key];
    try {
      const updated = await updateUser(currentUser.id, { [field]: next });
      setNotifs(prev => ({ ...prev, [key]: next }));
      if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated });
      showToast("Preference updated successfully");
    } catch { showToast("Failed to update preference"); }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const updated = await updateUser(currentUser.id, { avatar_url: reader.result });
        if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated, avatar_url: reader.result });
        showToast("Profile image updated");
      } catch { showToast("Upload failed"); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.contentAreaOnly}>
        <div style={styles.scrollWrapper}>
            {activeTab === "personal_info" && <PersonalInfoView currentUser={currentUser} onUserUpdate={onUserUpdate} showToast={showToast} stats={stats} fileInputRef={fileInputRef} handleAvatarUpload={handleAvatarUpload} />}
            {activeTab === "notifs" && <NotificationsView notifs={notifs} handleToggle={handleTogglePreference} />}
            {activeTab === "privacy" && <PrivacyView currentUser={currentUser} onUserUpdate={onUserUpdate} showToast={showToast} onLogout={onLogout} />}
        </div>
        {toastMessage && <div style={styles.toast}>{toastMessage}</div>}
    </div>
  );
};

const NavBtn = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} style={{...styles.navBtn, backgroundColor: active ? 'rgba(31, 42, 86, 0.08)' : 'transparent', color: active ? '#1f2a56' : '#64748B'}}>
        <div style={{...styles.iconContainer, color: active ? '#1f2a56' : '#94A3B8'}}>{icon}</div>
        <span style={{fontWeight: active ? '700' : '500'}}>{label}</span>
        {active && <div style={styles.activeIndicator} />}
    </button>
);

const PersonalInfoView = ({ currentUser, onUserUpdate, showToast, stats, fileInputRef, handleAvatarUpload }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...currentUser });
    const [programOptions, setProgramOptions] = useState([]);
    
    // LOCATION STATES
    const [regionList, setRegionList] = useState([]);
    const [allProvinces, setAllProvinces] = useState({});
    const [provinceList, setProvinceList] = useState([]);
    const [allCities, setAllCities] = useState({});
    const [cityList, setCityList] = useState([]);
    const [barangayList, setBarangayList] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    useEffect(() => {
        getCategories()
            .then(cats => {
                const names = (cats || []).map(c => c.name).filter(Boolean);
                setProgramOptions(names);
            })
            .catch(err => console.error("Failed to load categories", err));
            
        // LOAD LOCATIONS
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
            } catch (err) { console.error("Failed to load locations", err); }
        };
        loadBaseLocations();
    }, []);

    // CASCADE LOCATION LOGIC
    useEffect(() => {
        if (formData.region && allProvinces[formData.region]) {
            setProvinceList(allProvinces[formData.region]);
        } else { setProvinceList([]); }
    }, [formData.region, allProvinces]);

    useEffect(() => {
        if (formData.province && allCities[formData.province]) {
            setCityList(allCities[formData.province]);
        } else { setCityList([]); }
    }, [formData.province, allCities]);

    useEffect(() => {
        const loadBarangays = async () => {
            if (formData.city) {
                setIsLoadingLocations(true);
                try {
                    const safeCity = formData.city.replace(/[^a-z0-9]/gi, (x) => (" -_".includes(x) ? x : "")).trim();
                    const res = await fetch(`/assets/locations/barangays/${safeCity}.json`);
                    if (res.ok) setBarangayList(await res.json());
                    else setBarangayList([]);
                } catch (err) { setBarangayList([]); }
                finally { setIsLoadingLocations(false); }
            } else { setBarangayList([]); }
        };
        loadBarangays();
    }, [formData.city]);

    const handleSave = async () => {
        try {
            const updated = await updateUser(currentUser.id, formData);
            if (onUserUpdate) onUserUpdate({ ...currentUser, ...updated });
            showToast("Profile details updated");
            setIsEditing(false);
        } catch { showToast("Failed to save changes"); }
    };

    return (
        <div style={styles.viewContainer}>
            {/* PROFILE HEADER CARD */}
            <div style={styles.heroCard}>
                <div style={styles.heroContent}>
                    <div style={styles.avatarLargeContainer}>
                        {currentUser?.avatar_url ? (
                            <img src={currentUser.avatar_url} style={styles.avatarLarge} alt="profile" />
                        ) : (
                            <div style={styles.avatarLargePlaceholder}>{currentUser?.name?.charAt(0)}</div>
                        )}
                        <button style={styles.heroEditBadge} onClick={() => fileInputRef.current?.click()}><Icons.Edit /></button>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload} />
                    </div>
                    <div style={styles.heroText}>
                        <h1 style={styles.heroName}>{currentUser?.name}</h1>
                        <p style={styles.heroUsername}>@{currentUser?.username || "username"}</p>
                        <div style={styles.badgeRow}>
                            <span style={styles.roleBadge}>{currentUser?.role_identity || "Member"}</span>
                            <span style={styles.statusBadge}>{currentUser?.is_active ? "Verified" : "Pending"}</span>
                        </div>
                    </div>
                </div>
                
                <div style={styles.statsBar}>
                    <div style={styles.statBox}>
                        <span style={styles.statVal}>{stats.posts_count}</span>
                        <span style={styles.statLab}>POSTS</span>
                    </div>
                    <div style={styles.statDivider} />
                    <div style={styles.statBox}>
                        <span style={styles.statVal}>{stats.impact_points}</span>
                        <span style={styles.statLab}>POINTS</span>
                    </div>
                    <div style={styles.statDivider} />
                    <div style={styles.statBox}>
                        <span style={styles.statVal}>{stats.likes_received}</span>
                        <span style={styles.statLab}>LIKES</span>
                    </div>
                </div>
            </div>

            {/* DETAILS SECTION */}
            <div style={styles.sectionCard}>
                <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Basic Information</h3>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} style={styles.actionLink}>
                            Edit Details
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    <div style={styles.dataGrid}>
                        <DataTile label="Username" value={currentUser.username} icon="@" />
                        <DataTile label="Position" value={currentUser.position_title} icon="💼" />
                        {currentUser.role_identity === "Employee" && <DataTile label="Company" value={currentUser.company_name} icon="🏢" />}
                        <DataTile label="Program / Office" value={currentUser.program} icon="🏫" />
                        <DataTile label="Phone" value={currentUser.phone} icon="📞" />
                        <DataTile label="Address" value={`${currentUser.barangay || ""} ${currentUser.city || ""} ${currentUser.province || ""}`} icon="📍" />
                    </div>
                ) : (
                    <div style={styles.formGrid}>
                        <InputGroup label="Full Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
                        <InputGroup label="Username" value={formData.username} onChange={v => setFormData({...formData, username: v})} />
                        <InputGroup label="Email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                        <InputGroup label="Phone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
                        
                        <div style={styles.inputWrap}>
                            <label style={styles.fieldLabel}>Program / Office</label>
                            <select style={styles.selectField} value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})}>
                                <option value="">Select Option</option>
                                {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <InputGroup label="Position" value={formData.position_title} onChange={v => setFormData({...formData, position_title: v})} />
                        {formData.role_identity === "Employee" && <InputGroup label="Company" value={formData.company_name} onChange={v => setFormData({...formData, company_name: v})} />}
                        
                        {/* LOCATION INPUTS */}
                        <div style={{gridColumn: '1 / -1', marginTop: '24px', padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0'}}>
                            <h4 style={{margin: '0 0 16px 0', fontSize: '15px', color: '#1f2a56'}}>Location & Address</h4>
                            <div style={{...styles.formGrid, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', padding: 0}}>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>Region</label>
                                    <select style={styles.selectField} value={formData.region} onChange={e => setFormData({...formData, region: e.target.value, province: "", city: "", barangay: ""})}>
                                        <option value="">Select Region</option>
                                        {regionList.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>Province</label>
                                    <select style={styles.selectField} value={formData.province} onChange={e => setFormData({...formData, province: e.target.value, city: "", barangay: ""})} disabled={!formData.region}>
                                        <option value="">Select Province</option>
                                        {provinceList.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>City / Municipality</label>
                                    <select style={styles.selectField} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value, barangay: ""})} disabled={!formData.province}>
                                        <option value="">Select City / Municipality</option>
                                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabel}>Barangay</label>
                                    <select style={styles.selectField} value={formData.barangay} onChange={e => setFormData({...formData, barangay: e.target.value})} disabled={!formData.city || isLoadingLocations}>
                                        <option value="">{isLoadingLocations ? "Loading..." : "Select Barangay"}</option>
                                        {barangayList.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div style={{...styles.inputWrap, gridColumn: '1 / -1'}}>
                                    <InputGroup label="Exact Address (Optional)" value={formData.exact_address} onChange={v => setFormData({...formData, exact_address: v})} placeholder="House no, Street, etc." />
                                </div>
                            </div>
                        </div>
                        
                        <div style={{gridColumn: '1 / -1', marginTop: '20px', display: 'flex', gap: '12px'}}>
                            <button style={styles.primaryBtn} onClick={handleSave}>Save Changes</button>
                            <button style={styles.secondaryBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DataTile = ({ label, value, icon }) => (
    <div style={styles.dataTile}>
        <div style={styles.tileIcon}>{icon}</div>
        <div>
            <span style={styles.tileLabel}>{label}</span>
            <span style={styles.tileValue}>{value || "—"}</span>
        </div>
    </div>
);

const InputGroup = ({ label, value, onChange, placeholder }) => (
    <div style={styles.inputWrap}>
        <label style={styles.fieldLabel}>{label}</label>
        <input 
            style={styles.inputField}
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

const NotificationsView = ({ notifs, handleToggle }) => (
    <div style={styles.viewContainer}>
        <div style={styles.sectionHeader}>
            <h2 style={styles.viewTitle}>Alert Preferences</h2>
            <p style={styles.viewSubtitle}>Choose how and when you want to be notified by the system.</p>
        </div>

        <div style={styles.cardStack}>
            <ToggleCard title="Push Notifications" desc="Get real-time alerts on your mobile device" isOn={notifs.push} onToggle={() => handleToggle("push_notifications", "push")} />
            <ToggleCard title="Email Updates" desc="Receive formal reports to your professional email" isOn={notifs.email} onToggle={() => handleToggle("email_notifications", "email")} />
            <ToggleCard title="Status Changes" desc="Notify when your feedback is marked resolved" isOn={notifs.status} onToggle={() => handleToggle("status_updates", "status")} />
            <ToggleCard title="Weekly Digest" desc="A summary of system activity every Friday" isOn={notifs.weekly} onToggle={() => handleToggle("weekly_digest", "weekly")} />
        </div>
    </div>
);

const ToggleCard = ({ title, desc, isOn, onToggle }) => (
    <div style={styles.toggleCard}>
        <div style={{flex: 1}}>
            <h4 style={styles.toggleTitle}>{title}</h4>
            <p style={styles.toggleDesc}>{desc}</p>
        </div>
        <button onClick={onToggle} style={{...styles.toggleBtn, backgroundColor: isOn ? '#1f2a56' : '#E2E8F0'}}>
            <div style={{...styles.toggleCircle, transform: isOn ? 'translateX(24px)' : 'translateX(2px)'}} />
        </button>
    </div>
);

const PrivacyView = ({ currentUser, onUserUpdate, showToast, onLogout }) => {
    const [showDelete, setShowDelete] = useState(false);
    return (
        <div style={styles.viewContainer}>
            <div style={styles.sectionHeader}>
                <h2 style={styles.viewTitle}>Account & Security</h2>
                <p style={styles.viewSubtitle}>Manage your access and data privacy settings.</p>
            </div>

            <div style={styles.sectionCard}>
                <h4 style={styles.cardTitle}>Change Password</h4>
                <div style={styles.formGrid}>
                    <InputGroup label="New Password" placeholder="Minimum 8 characters" />
                    <button style={{...styles.primaryBtn, width: 'fit-content', gridColumn: '1 / -1'}}>Update Password</button>
                </div>
            </div>

            <div style={{...styles.sectionCard, borderColor: '#FCA5A5', background: '#FFF5F5'}}>
                <h4 style={{...styles.cardTitle, color: '#B91C1C'}}>Danger Zone</h4>
                <p style={{fontSize: '13px', color: '#991B1B', marginBottom: '16px'}}>Once deleted, your account and all associated feedback cannot be restored.</p>
                <button style={{...styles.secondaryBtn, color: '#EF4444', borderColor: '#FCA5A5'}} onClick={() => setShowDelete(true)}>Delete Permanentally</button>
            </div>

            {showDelete && (
                <CustomModal 
                    isOpen={true} title="Delete Account?" 
                    message="Are you sure? This action is irreversible." 
                    onConfirm={() => deleteUser(currentUser.id).then(onLogout)}
                    onCancel={() => setShowDelete(false)}
                    isDestructive={true}
                />
            )}
        </div>
    );
}

// --- STYLES ---
const styles = {
    contentAreaOnly: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%' },
    scrollWrapper: { flex: 1, overflowY: 'auto', padding: '24px' },

    viewContainer: { maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' },
    sectionHeader: { marginBottom: '32px' },
    viewTitle: { fontSize: '28px', fontWeight: '800', color: '#1f2a56', margin: '0 0 8px 0' },
    viewSubtitle: { fontSize: '15px', color: '#64748B', margin: 0 },

    heroCard: { background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' },
    heroContent: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' },
    avatarLargeContainer: { position: 'relative' },
    avatarLarge: { width: '100px', height: '100px', borderRadius: '30px', objectFit: 'cover', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' },
    avatarLargePlaceholder: { width: '100px', height: '100px', borderRadius: '30px', background: '#F1F5F9', color: '#1f2a56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '800' },
    heroEditBadge: { position: 'absolute', bottom: '-4px', right: '-4px', width: '32px', height: '32px', borderRadius: '10px', background: '#1f2a56', color: 'white', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' },
    
    heroText: { flex: 1 },
    heroName: { fontSize: '24px', fontWeight: '800', color: '#1f2a56', margin: '0 0 2px 0' },
    heroUsername: { fontSize: '13px', fontWeight: '800', color: '#3B82F6', margin: '0 0 4px 0', opacity: 0.8 },
    heroEmail: { fontSize: '14px', color: '#64748B', margin: '0 0 16px 0' },
    badgeRow: { display: 'flex', gap: '8px' },
    roleBadge: { padding: '4px 12px', background: '#E0E7FF', color: '#4338CA', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' },
    statusBadge: { padding: '4px 12px', background: '#D1FAE5', color: '#065F46', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' },
    
    statsBar: { display: 'flex', background: '#F8FAFC', borderRadius: '16px', padding: '16px 0', border: '1px solid #F1F5F9' },
    statBox: { flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column' },
    statVal: { fontSize: '20px', fontWeight: '800', color: '#1f2a56' },
    statLab: { fontSize: '10px', color: '#94A3B8', fontWeight: '800', letterSpacing: '0.1em', marginTop: '4px' },
    statDivider: { width: '1px', background: '#E2E8F0', height: '30px', alignSelf: 'center' },

    sectionCard: { background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1f2a56', margin: 0 },
    actionLink: { background: 'none', border: 'none', color: '#3B82F6', fontWeight: '700', fontSize: '14px', cursor: 'pointer', padding: 0 },
    
    dataGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
    dataTile: { display: 'flex', gap: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9' },
    tileIcon: { fontSize: '18px', opacity: 0.7 },
    tileLabel: { display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' },
    tileValue: { display: 'block', fontSize: '15px', fontWeight: '700', color: '#1E293B' },

    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
    inputWrap: { display: 'flex', flexDirection: 'column' },
    fieldLabel: { fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px', paddingLeft: '4px' },
    inputField: { padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', color: '#1E293B', outline: 'none', transition: 'border-color 0.2s' },
    selectField: { padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', color: '#1E293B', outline: 'none', cursor: 'pointer' },
    
    primaryBtn: { padding: '14px 28px', background: '#1f2a56', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31, 42, 86, 0.2)' },
    secondaryBtn: { padding: '14px 28px', background: 'white', color: '#1f2a56', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
    
    cardStack: { display: 'flex', flexDirection: 'column', gap: '12px' },
    toggleCard: { display: 'flex', alignItems: 'center', padding: '20px 24px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', transition: 'transform 0.2s' },
    toggleTitle: { fontSize: '16px', fontWeight: '800', color: '#1f2a56', margin: '0 0 4px 0' },
    toggleDesc: { fontSize: '13px', color: '#64748B', margin: 0 },
    toggleBtn: { width: '52px', height: '28px', borderRadius: '14px', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s' },
    toggleCircle: { width: '24px', height: '24px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
    
    toast: { position: 'fixed', bottom: '30px', right: '30px', background: '#1f2a56', color: 'white', padding: '16px 24px', borderRadius: '16px', fontWeight: '700', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out', zIndex: 9999 }
};

export default ProfileSettings;