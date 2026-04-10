import React, { useState, useEffect, useRef } from "react";
import CustomModal from "./CustomModal";
import { deleteUser, deactivateUser, changePassword, updateUser, getUserById, getEntities } from "../services/api";

// --- MODERN PREMIUM ICONS ---
const Icons = {
  Profile: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Gear: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1-2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Chevron: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Key: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Power: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  Briefcase: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  MapPin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Phone: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  MessageSquare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  AtSign: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>,
  ThumbsUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7L22 14v-2a2 2 0 0 0-2-2h-3"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
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
    replies: currentUser?.notify_replies ?? true,
    comments: currentUser?.notify_comments ?? true,
    mentions: currentUser?.notify_mentions ?? true,
    likes: currentUser?.notify_likes ?? true,
    announcements: currentUser?.notify_announcements ?? true,
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
        getEntities()
            .then(cats => {
                const names = (cats || []).map(c => c.name).filter(Boolean);
                setProgramOptions(names);
            })
            .catch(err => console.error("Failed to load entities", err));
            
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

            <div style={styles.sectionCardPremiumProfile}>
                <div style={{...styles.cardHeader, paddingBottom: '20px', borderBottom: '1px solid #F1F5F9', marginBottom: '24px'}}>
                    <div>
                        <h3 style={styles.cardTitlePremium}>Identity & Professional Profile</h3>
                        <p style={{fontSize: '12px', color: '#64748B', marginTop: '4px'}}>Manage your public presence and organizational details.</p>
                    </div>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} style={styles.premiumEditBtn}>
                            <Icons.Edit /> Edit Profile
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    <div style={styles.dataGridPremium}>
                        <DataTile label="Global Username" value={currentUser.username} icon="@" />
                        <DataTile label="Professional Role" value={currentUser.position_title} icon={<Icons.Briefcase />} />
                        <DataTile label="Assigned Program/Office" value={currentUser.program} icon={<Icons.Shield />} />
                        <DataTile label="Mobile Contact" value={currentUser.phone} icon={<Icons.Phone />} />
                        <div style={{gridColumn: '1 / -1'}}>
                             <DataTile label="Official Reach (Location)" value={`${currentUser.barangay || ""} ${currentUser.city || ""} ${currentUser.province || ""}`} icon={<Icons.MapPin />} />
                        </div>
                    </div>
                ) : (
                    <div style={styles.formPadding}>
                        <div style={styles.formGridPremium}>
                            <InputGroup label="Display Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. John Doe" />
                            <InputGroup label="System Username" value={formData.username} onChange={v => setFormData({...formData, username: v})} placeholder="johndoe123" />
                            <InputGroup label="Official Email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="name@organization.com" />
                            <InputGroup label="Phone Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+63 9XX XXX XXXX" />
                            
                            <div style={styles.inputWrap}>
                                <label style={styles.fieldLabelPremium}>Program / Office</label>
                                <select style={styles.selectFieldPremium} value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})}>
                                    <option value="">Select Option</option>
                                    {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <InputGroup label="Current Position" value={formData.position_title} onChange={v => setFormData({...formData, position_title: v})} placeholder="e.g. Senior Analyst" />
                        </div>
                        
                        {/* PREMIUM LOCATION BOX */}
                        <div style={styles.locationSectionPremium}>
                            <div style={styles.locationHeader}>
                                <Icons.MapPin />
                                <h4 style={{margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E40AF'}}>Primary Jurisdiction</h4>
                            </div>
                            <div style={styles.locationGridPremium}>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabelPremium}>Region</label>
                                    <select style={styles.selectFieldPremium} value={formData.region} onChange={e => setFormData({...formData, region: e.target.value, province: "", city: "", barangay: ""})}>
                                        <option value="">Select Region</option>
                                        {regionList.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabelPremium}>Province</label>
                                    <select style={styles.selectFieldPremium} value={formData.province} onChange={e => setFormData({...formData, province: e.target.value, city: "", barangay: ""})} disabled={!formData.region}>
                                        <option value="">Select Province</option>
                                        {provinceList.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabelPremium}>City / Municipality</label>
                                    <select style={styles.selectFieldPremium} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value, barangay: ""})} disabled={!formData.province}>
                                        <option value="">Select City / Municipality</option>
                                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={styles.inputWrap}>
                                    <label style={styles.fieldLabelPremium}>Barangay</label>
                                    <select style={styles.selectFieldPremium} value={formData.barangay} onChange={e => setFormData({...formData, barangay: e.target.value})} disabled={!formData.city || isLoadingLocations}>
                                        <option value="">{isLoadingLocations ? "Loading..." : "Select Barangay"}</option>
                                        {barangayList.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div style={styles.formActionsPremium}>
                            <button style={styles.primaryBtnPremium} onClick={handleSave}>
                                <Icons.Check /> Save Changes
                            </button>
                            <button style={styles.secondaryBtnPremium} onClick={() => setIsEditing(false)}>Cancel</button>
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

const InputGroup = ({ label, value, onChange, placeholder, type }) => (
    <div style={styles.inputWrap}>
        <label style={styles.fieldLabel}>{label}</label>
        <input 
            type={type || "text"}
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
            <h2 style={styles.viewTitle}>Notification Preferences</h2>
            <p style={styles.viewSubtitle}>Control which interactions trigger alerts and select your preferred delivery channels.</p>
        </div>

        <div style={styles.cardStack}>
            {/* FEEDBACK ACTIVITY */}
            <div style={styles.notificationGroup}>
                <h3 style={styles.groupHeader}>Feedback Activity</h3>
                <div style={styles.groupStack}>
                    <ToggleCard 
                        title="Replies to Your Feedback" 
                        desc="When someone answers your feedback directly" 
                        isOn={notifs.replies} 
                        icon={<Icons.MessageSquare />}
                        onToggle={() => handleToggle("notify_replies", "replies")} 
                    />
                    <ToggleCard 
                        title="New Comments" 
                        desc="When someone comments on your post" 
                        isOn={notifs.comments} 
                        icon={<Icons.Users />}
                        onToggle={() => handleToggle("notify_comments", "comments")} 
                    />
                    <ToggleCard 
                        title="Mentions" 
                        desc="When someone tags you in a discussion" 
                        isOn={notifs.mentions} 
                        icon={<Icons.AtSign />}
                        onToggle={() => handleToggle("notify_mentions", "mentions")} 
                    />
                    <ToggleCard 
                        title="Reactions" 
                        desc="When someone likes your feedback" 
                        isOn={notifs.likes} 
                        icon={<Icons.ThumbsUp />}
                        onToggle={() => handleToggle("notify_likes", "likes")} 
                    />
                </div>
            </div>

            {/* SYSTEM UPDATES */}
            <div style={styles.notificationGroup}>
                <h3 style={styles.groupHeader}>System Updates</h3>
                <div style={styles.groupStack}>
                    <ToggleCard 
                        title="Announcements" 
                        desc="Official broadcasts from administrators" 
                        isOn={notifs.announcements} 
                        icon={<Icons.Bell />}
                        onToggle={() => handleToggle("notify_announcements", "announcements")} 
                    />
                    <ToggleCard 
                        title="Weekly Digest" 
                        desc="Summary of your activity every Friday (Requires Email ON)" 
                        isOn={notifs.weekly} 
                        isDisabled={!notifs.email}
                        icon={<Icons.Calendar />}
                        onToggle={() => handleToggle("weekly_digest", "weekly")} 
                    />
                </div>
            </div>

            {/* CHANNELS */}
            <div style={styles.notificationGroup}>
                <h3 style={styles.groupHeader}>Notification Channels</h3>
                <div style={styles.groupStack}>
                    <ToggleCard 
                        title="Push Notifications" 
                        desc="Get real-time alerts on your mobile device" 
                        isOn={notifs.push} 
                        icon={<Icons.Zap />}
                        onToggle={() => handleToggle("push_notifications", "push")} 
                    />
                    <ToggleCard 
                        title="Email Updates" 
                        desc="Receive formal reports to your professional email" 
                        isOn={notifs.email} 
                        icon={<Icons.Mail />}
                        onToggle={() => handleToggle("email_notifications", "email")} 
                    />
                </div>
            </div>
        </div>
    </div>
);

const ToggleCard = ({ title, desc, isOn, onToggle, icon, isDisabled }) => (
    <div style={{...styles.toggleCard, opacity: isDisabled ? 0.6 : 1, cursor: isDisabled ? 'not-allowed' : 'default'}}>
        <div style={{width: '40px', height: '40px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', marginRight: '16px'}}>
            {icon}
        </div>
        <div style={{flex: 1}}>
            <h4 style={styles.toggleTitle}>{title}</h4>
            <p style={styles.toggleDesc}>{desc}</p>
        </div>
        <button 
            disabled={isDisabled}
            onClick={onToggle} 
            style={{...styles.toggleBtn, backgroundColor: isOn && !isDisabled ? '#1f2a56' : '#E2E8F0'}}
        >
            <div style={{...styles.toggleCircle, transform: isOn && !isDisabled ? 'translateX(24px)' : 'translateX(2px)'}} />
        </button>
    </div>
);

const PrivacyView = ({ currentUser, onUserUpdate, showToast, onLogout }) => {
    const [showDelete, setShowDelete] = useState(false);
    const [showDeactivate, setShowDeactivate] = useState(false);
    const [deactivateDays, setDeactivateDays] = useState(7);

    // Password States
    const [pOld, setPOld] = useState("");
    const [pNew, setPNew] = useState("");
    const [pConfirm, setPConfirm] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const handlePasswordChange = async () => {
        if (!pOld || !pNew || !pConfirm) {
            showToast("Please fill in all password fields");
            return;
        }
        if (pNew !== pConfirm) {
            showToast("Passwords do not match");
            return;
        }
        if (pNew.length < 8) {
            showToast("New password must be at least 8 characters");
            return;
        }

        setIsUpdating(true);
        try {
            await changePassword(currentUser.id, pOld, pNew);
            showToast("Password updated successfully");
            setPOld(""); setPNew(""); setPConfirm("");
        } catch (err) {
            const msg = err.response?.data?.detail || "Failed to update password";
            showToast(msg);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeactivate = async () => {
        try {
            await deactivateUser(currentUser.id, deactivateDays);
            showToast(`Account deactivated for ${deactivateDays} days`);
            onLogout();
        } catch (err) {
            showToast("Failed to deactivate account");
        }
    };

    return (
        <div style={styles.viewContainer}>
            <div style={{...styles.sectionHeader, display: 'flex', alignItems: 'center', gap: '20px'}}>
                <div style={{width: '64px', height: '64px', background: 'rgba(31, 42, 86, 0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f2a56'}}>
                    <Icons.Shield />
                </div>
                <div>
                    <h2 style={styles.viewTitle}>Security & Stewardship</h2>
                    <p style={styles.viewSubtitle}>Professional controls for your privacy and account status.</p>
                </div>
            </div>

            {/* PASSWORD SECTION */}
            <div style={styles.sectionCardPremium}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9'}}>
                    <div style={{color: '#3B82F6'}}><Icons.Key /></div>
                    <h4 style={styles.cardTitle}>Authentication Management</h4>
                </div>
                <p style={{fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px'}}>
                    Update your password regularly to maintain high security standards. 
                    Your account data is encrypted and protected.
                </p>
                
                <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px', maxWidth: '450px'}}>
                    <InputGroup type="password" label="Current Access Key" value={pOld} onChange={setPOld} placeholder="••••••••" />
                    
                    <div style={{padding: '24px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                            <InputGroup type="password" label="New Access Key" value={pNew} onChange={setPNew} placeholder="••••••••" />
                            <InputGroup type="password" label="Confirm Access Key" value={pConfirm} onChange={setPConfirm} placeholder="••••••••" />
                        </div>
                    </div>

                    <button 
                        style={{...styles.primaryBtn, width: 'fit-content'}}
                        onClick={handlePasswordChange}
                        disabled={isUpdating}
                    >
                        {isUpdating ? "Updating..." : "Update Credentials"}
                    </button>
                </div>
            </div>

            {/* DEACTIVATION SECTION */}
            <div style={{...styles.sectionCardPremium, borderLeft: '6px solid #3B82F6'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px'}}>
                    <div style={{color: '#3B82F6'}}><Icons.Power /></div>
                    <h4 style={{...styles.cardTitle, color: '#1E40AF'}}>Temporary Stewardship</h4>
                </div>
                <p style={{fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px'}}>
                    Stepping away? Temporarily hide your profile and feedback submissions. 
                    Restoration happens the moment you log back in.
                </p>
                <div style={{display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', background: '#F0F7FF', padding: '24px', borderRadius: '20px'}}>
                    <div style={{...styles.inputWrap, flex: '1', minWidth: '200px'}}>
                        <label style={{...styles.fieldLabel, color: '#1E40AF'}}>Reactivation Schedule</label>
                        <select 
                            style={styles.selectField} 
                            value={deactivateDays} 
                            onChange={(e) => setDeactivateDays(parseInt(e.target.value))}
                        >
                            <option value={2}>2 Days</option>
                            <option value={3}>3 Days</option>
                            <option value={7}>1 Week</option>
                            <option value={14}>2 Weeks</option>
                            <option value={30}>1 Month</option>
                            <option value={0}>Don't reactivate automatically</option>
                        </select>
                    </div>
                    <button 
                        style={{...styles.secondaryBtn, height: '48px', borderColor: '#3B82F6', color: '#3B82F6', fontWeight: '800'}}
                        onClick={() => setShowDeactivate(true)}
                    >
                        Deactivate Status
                    </button>
                </div>
            </div>

            {/* DELETE SECTION */}
            <div style={{...styles.sectionCardPremium, borderLeft: '6px solid #EF4444', backgroundColor: '#FFF5F5'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px'}}>
                    <div style={{color: '#EF4444'}}><Icons.Trash /></div>
                    <h4 style={{...styles.cardTitle, color: '#991B1B'}}>Account Termination</h4>
                </div>
                <p style={{fontSize: '14px', color: '#991B1B', lineHeight: '1.6', marginBottom: '24px', opacity: 0.8}}>
                    This action is final. All historical feedback, impact points, and profile data will be 
                    permanently scrubbed from our systems and cannot be restored.
                </p>
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                    <button 
                        style={{...styles.secondaryBtn, color: '#EF4444', borderColor: '#FCA5A5', backgroundColor: 'white', fontWeight: '800'}} 
                        onClick={() => setShowDelete(true)}
                    >
                        Terminate Account
                    </button>
                </div>
            </div>

            {showDeactivate && (
                <CustomModal 
                    isOpen={true} 
                    title="Initiate Deactivation?" 
                    message={deactivateDays === 0 
                        ? "Your account will be hidden until you manually log back in."
                        : `Your account will be hidden for ${deactivateDays} days. You can reactivate anytime by logging back in.`}
                    onConfirm={handleDeactivate}
                    onCancel={() => setShowDeactivate(false)}
                    confirmText="Deactivate"
                />
            )}

            {showDelete && (
                <CustomModal 
                    isOpen={true} title="Terminate Account Permanently?" 
                    message="Warning: This is an irreversible process. All associated data will be lost forever. Do you wish to proceed?" 
                    onConfirm={() => deleteUser(currentUser.id).then(onLogout)}
                    onCancel={() => setShowDelete(false)}
                    isDestructive={true}
                    confirmText="Confirm Termination"
                />
            )}
        </div>
    );
};

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
    sectionCardPremium: { background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '40px', marginBottom: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' },
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
    inputWrap: { marginBottom: '4px' },
    fieldLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#1f2a56', marginBottom: '8px' },
    inputField: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease' },
    selectField: { padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', color: '#1E293B', outline: 'none', cursor: 'pointer' },
    
    primaryBtn: { padding: '14px 28px', background: '#1f2a56', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31, 42, 86, 0.2)' },
    secondaryBtn: { padding: '14px 28px', background: 'white', color: '#1f2a56', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
    
    // Notifications styles
    notificationGroup: { marginBottom: '32px' },
    groupHeader: { fontSize: '14px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', paddingLeft: '4px' },
    groupStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
    
    toggleCard: { display: 'flex', alignItems: 'center', padding: '16px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #F1F5F9', transition: 'all 0.2s ease' },
    toggleTitle: { fontSize: '15px', fontWeight: '600', color: '#1f2a56', marginBottom: '2px' },
    toggleDesc: { fontSize: '12px', color: '#64748B', lineHeight: '1.4' },
    toggleBtn: { width: '48px', height: '26px', borderRadius: '13px', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 },
    toggleCircle: { width: '22px', height: '22px', background: '#FFFFFF', borderRadius: '50%', position: 'absolute', top: '2px', left: '0', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    
    toast: { position: 'fixed', bottom: '30px', right: '30px', background: '#1f2a56', color: 'white', padding: '16px 24px', borderRadius: '16px', fontWeight: '700', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out', zIndex: 9999 },

    // PREMIUM PROFILE ADDITIONS
    sectionCardPremiumProfile: { background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '40px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
    cardTitlePremium: { fontSize: '20px', fontWeight: '900', color: '#1f2a56', margin: 0, letterSpacing: '-0.5px' },
    premiumEditBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#F0F7FF', color: '#3B82F6', border: '1px solid #DBEAFE', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' },
    dataGridPremium: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' },
    
    formPadding: { paddingTop: '8px' },
    formGridPremium: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' },
    fieldLabelPremium: { fontSize: '12px', fontWeight: '800', color: '#1f2a56', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 },
    selectFieldPremium: { padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', fontSize: '15px', color: '#1E293B', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' },
    
    locationSectionPremium: { marginTop: '32px', padding: '32px', background: '#F0F7FF', borderRadius: '24px', border: '1px solid #DBEAFE' },
    locationHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', color: '#1E40AF' },
    locationGridPremium: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
    
    formActionsPremium: { marginTop: '32px', display: 'flex', gap: '16px', alignItems: 'center' },
    primaryBtnPremium: { display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 32px', background: '#1f2a56', color: 'white', border: 'none', borderRadius: '18px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 25px rgba(31, 42, 86, 0.15)' },
    secondaryBtnPremium: { padding: '16px 32px', background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '18px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
};

export default ProfileSettings;