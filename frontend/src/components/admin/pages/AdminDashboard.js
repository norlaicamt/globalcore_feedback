import React, { useEffect, useState } from "react";
import { useTerminology } from "../../../context/TerminologyContext";
import {
  getAnalyticsSnapshot, adminGetScopeOptions
} from "../../../services/adminApi";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";

const CHART_COLORS = ["var(--primary-color)", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

// --- COMPONENT: Section Header ---
const SectionHeader = ({ title, icon, theme }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '8px' }}>
    <span style={{ fontSize: '18px' }}>{icon}</span>
    <h2 style={{ fontSize: '13px', fontWeight: '800', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{title}</h2>
    <div style={{ flex: 1, height: '1px', background: theme.border, marginLeft: '12px' }} />
  </div>
);

// --- COMPONENT: Horizontal Sentiment Bar ---
const HorizontalSentimentBar = ({ data, theme }) => {
  const positive = data.positive || 0;
  const neutral = data.neutral || 0;
  const frustrated = data.frustrated || 0;
  const total = positive + neutral + frustrated;
  
  if (total === 0) return <p style={{ fontSize: '12px', color: theme.textMuted }}>No sentiment data available.</p>;

  const getPct = (val) => (val / total) * 100;

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ height: '12px', width: '100%', display: 'flex', borderRadius: '6px', overflow: 'hidden', background: theme.bg, marginBottom: '20px' }}>
        <div style={{ width: `${getPct(positive)}%`, background: '#10B981', transition: '0.3s' }} />
        <div style={{ width: `${getPct(neutral)}%`, background: '#64748B', transition: '0.3s' }} />
        <div style={{ width: `${getPct(frustrated)}%`, background: '#EF4444', transition: '0.3s' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: theme.text }}>Positive</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#10B981' }}>{Math.round(getPct(positive))}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#64748B' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: theme.text }}>Neutral</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted }}>{Math.round(getPct(neutral))}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: theme.text }}>Frustrated</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#EF4444' }}>{Math.round(getPct(frustrated))}%</span>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, sub, onClick, theme, color }) => (
  <div
    onClick={onClick}
    style={{
      background: theme.surface, borderRadius: "12px", padding: "12px 14px", border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.02)", cursor: onClick ? "pointer" : "default",
      transition: "transform 0.1s, border-color 0.15s",
      position: 'relative', overflow: 'hidden'
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = color || '#3B82F6'; } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = theme.border; } }}
  >
    <p style={{ fontSize: "9px", color: theme.textMuted, margin: "0 0 2px 0", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    <p style={{ fontSize: "18px", fontWeight: "900", color: color || theme.text, margin: "0 0 2px 0", letterSpacing: "-0.02em" }}>{value}</p>
    {sub && <p style={{ fontSize: "9px", color: theme.textMuted, margin: 0, fontWeight: "600" }}>{sub}</p>}
  </div>
);

const Section = ({ title, children, theme, empty, emptyText = "No data available for this program." }) => (
  <div style={{ background: theme.surface, borderRadius: "12px", padding: "16px", border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
    <h3 style={{ fontSize: "11px", fontWeight: "700", color: theme.textMuted, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</h3>
    {empty ? (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 10px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: theme.textMuted, margin: 0 }}>{emptyText}</p>
      </div>
    ) : children}
  </div>
);

const ScopeSelector = ({ value, options, onChange, theme, darkMode, hasGlobalAccess, adminUser }) => {
  if (!hasGlobalAccess) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: theme.bg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Viewing:</span>
        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary-color)' }}>{adminUser.department || "Your Assigned Program"}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{value ? "Viewing as:" : "Viewing:"}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
          background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`,
          cursor: 'pointer', outline: 'none', transition: 'all 0.2s', appearance: 'none',
          paddingRight: '36px', position: 'relative',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? '%2394A3B8' : '%2364748B'}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px'
        }}
      >
        <option value="">All Programs</option>
        {options.map(opt => (
          <option key={opt.name} value={opt.name}>{opt.name}</option>
        ))}
      </select>
    </div>
  );
};

const TimeFilter = ({ value, onChange, theme }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <span style={{ fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' }}>Last {value} Days</span>
    <div style={{ display: 'flex', gap: '4px', background: theme.bg, padding: '4px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
      {[7, 30, 90].map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          style={{
            padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: 'none',
            background: value === d ? 'var(--primary-color)' : 'transparent',
            color: value === d ? 'white' : theme.textMuted,
            transition: 'all 0.2s'
          }}
        >
          {d}d
        </button>
      ))}
    </div>
  </div>
);

const AdminDashboard = ({ onNavigate, theme, darkMode, adminUser }) => {
  const { getLabel } = useTerminology();
  const hasGlobalAdminAccess = (adminUser?.role === "superadmin") || (adminUser?.role === "admin" && !adminUser?.entity_id);
  const tooltipStyle = {
    fontSize: "12px", borderRadius: "8px", border: `1px solid ${theme.border}`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", backgroundColor: theme.surface, color: theme.text
  };

  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [volume, setVolume] = useState([]);
  const [byEntity, setByEntity] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [sentiment, setSentiment] = useState({ positive: 0, neutral: 0, frustrated: 0 });
  const [userDistribution, setUserDistribution] = useState({ by_entity: [], by_role: [] });
  const [programRankings, setProgramRankings] = useState({ top: [], lowest: [], all: [] });
  const [feedbackTypeDist, setFeedbackTypeDist] = useState({});
  const [performanceFilter, setPerformanceFilter] = useState("top");
  const [loading, setLoading] = useState(true);

  const [scopeCategories, setScopeCategories] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => {
    if (hasGlobalAdminAccess) {
      adminGetScopeOptions().then(setScopeCategories).catch(console.error);
    }
  }, [adminUser, hasGlobalAdminAccess]);

  useEffect(() => {
    const deptFilter = hasGlobalAdminAccess ? selectedDept : (adminUser?.department || "");

    const fetchAnalytics = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        console.log("DEBUG DASHBOARD: Fetching with filter:", deptFilter);
        const data = await getAnalyticsSnapshot(deptFilter, days);
        console.log("DEBUG DASHBOARD: Received data:", data);
        setSummary(data.summary);
        setVolume(data.volume);
        setByEntity(data.by_entity);
        setByStatus(data.by_status);
        setRatings(data.ratings);
        setTopUsers(data.top_users);
        setEngagement(data.engagement);
        setSentiment(data.sentiment);
        setUserDistribution(data.user_distribution || { by_entity: [], by_role: [] });
        setProgramRankings(data.program_rankings || { top: [], lowest: [], all: [] });
        setFeedbackTypeDist(data.feedback_type_distribution || {});
      } catch (err) {
        console.error(err);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchAnalytics(true);
    const intervalId = setInterval(() => fetchAnalytics(false), 15000);
    return () => clearInterval(intervalId);
  }, [adminUser, selectedDept, hasGlobalAdminAccess, days]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#94A3B8", fontSize: "13px" }}>
      Loading dashboard...
    </div>
  );

  const lowestRated = programRankings.lowest[0];
  const hasActionableIssue = lowestRated && lowestRated.avg_rating < 3 && lowestRated.count >= 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* 🧭 Top Navigation & Multi-Tenant Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Insight Hub</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
            <span style={{ color: 'var(--primary-color)' }}>{hasGlobalAdminAccess ? "System Overview" : (adminUser?.department || "Program Portal")}</span>
          </div>

          <ScopeSelector
            value={selectedDept}
            options={scopeCategories}
            onChange={setSelectedDept}
            theme={theme}
            darkMode={darkMode}
            hasGlobalAccess={hasGlobalAdminAccess}
            adminUser={adminUser}
          />
        </div>

        <TimeFilter value={days} onChange={setDays} theme={theme} />
      </div>

      {/* 🔷 SECTION 1: USER OVERVIEW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="User Overview"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
          theme={theme}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <KpiCard
            label="Total Citizens"
            value={summary?.global_total_users ?? 0}
            sub="Total Organization Reach"
            theme={theme}
          />
          <KpiCard
            label={!selectedDept ? "Engaged Citizens" : "Program Users"}
            value={summary?.total_users ?? 0}
            sub={!selectedDept ? "Interaction-based" : "Participating in service"}
            theme={theme}
            color="#3B82F6"
          />
          <KpiCard
            label="Cross-Program Reach"
            value={summary?.cross_program_reach ?? 0}
            sub="Users in 2+ services"
            theme={theme}
            color="var(--primary-color)"
          />
          <KpiCard
            label="Average Experience"
            value={
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {summary?.avg_rating ?? 0}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
            }
            sub="Based on ratings" theme={theme}
          />
        </div>
      </div>
      {/* 🔷 SECTION 2: CASE MANAGEMENT (OPERATIONAL) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="Case Management"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>}
          theme={theme}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {(() => {
            const getCount = (s) => byStatus.find(b => b.status === s)?.count || 0;
            const open = getCount("OPEN");
            const inProgress = getCount("IN_PROGRESS");
            const resolved = getCount("RESOLVED");
            const closed = getCount("CLOSED");
            const total = open + inProgress + resolved + closed;
            const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

            return (
              <>
                <KpiCard
                  label="New Submissions" value={open} sub="Awaiting review"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>}
                  theme={theme} color="#EAB308"
                />
                <KpiCard
                  label="In Review" value={inProgress} sub="Ongoing handling"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>}
                  theme={theme} color="#3B82F6"
                />
                <KpiCard
                  label="Resolved" value={resolved} sub="Completed cases"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                  theme={theme} color="#10B981"
                />
                <KpiCard
                  label="Resolution Rate (%)" value={`${resolvedRate}%`} sub={`Out of ${total} total`}
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>}
                  theme={theme}
                />
              </>
            );
          })()}
        </div>
      </div>

      {/* 🔷 SECTION 3: ACTIVITY TRENDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="Activity Trends"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}
          theme={theme}
        />
        <Section theme={theme} title="Submission & Engagement Volume" empty={volume.length === 0} emptyText="No submissions yet. Data will appear once users start submitting feedback.">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={volume.map((v, i) => ({ ...v, engagement: engagement[i]?.comments || 0 }))}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={darkMode ? 0.4 : 0.15} />
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="var(--primary-color)" fill="url(#volGrad)" strokeWidth={2} dot={false} name="Reports" />
              <Area type="monotone" dataKey="engagement" stroke="#2563EB" fill="transparent" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Comments" />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* 🔷 SECTION 4: EXPERIENCE & SENTIMENT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="Experience & Feedback"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>}
          theme={theme}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <Section theme={theme} title="Overall Sentiment">
            <HorizontalSentimentBar data={sentiment} theme={theme} />
          </Section>

          <Section theme={theme} title="Rating Distribution" empty={summary?.total_feedback === 0}>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={ratings}>
                <XAxis dataKey="rating" tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} tickFormatter={v => `${v}★`} />
                <YAxis tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} hide />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                  {ratings.map((entry, index) => (
                    <Cell key={`r-${index}`} fill={entry.rating >= 4 ? "#10B981" : entry.rating <= 2 ? "#EF4444" : "#FBBF24"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section theme={theme} title="Feedback Category" empty={Object.keys(feedbackTypeDist).length === 0}>
            <div style={{ position: 'relative', height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(feedbackTypeDist).map(([name, value]) => ({ name, value }))}
                    cx="50%" cy="50%" innerRadius={40} outerRadius={52} paddingAngle={4} dataKey="value"
                    stroke="none"
                  >
                    {Object.entries(feedbackTypeDist).map((entry, index) => (
                      <Cell key={`type-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ 
                position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', 
                textAlign: 'center', pointerEvents: 'none' 
              }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: theme.text }}>{summary?.total_feedback || 0}</p>
                <p style={{ margin: 0, fontSize: '7px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Total</p>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* 🔷 SECTION 5: PROGRAM PERFORMANCE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="Program Performance"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="2"></line><line x1="15" y1="22" x2="15" y2="2"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="10" x2="20" y2="10"></line><line x1="4" y1="14" x2="20" y2="14"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>}
          theme={theme}
        />

        {/* 🚨 Actionable Alert Bar */}
        {hasActionableIssue && (
          <div style={{
            background: darkMode ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
            border: `1px solid ${darkMode ? "rgba(239, 68, 68, 0.3)" : "#FEE2E2"}`,
            borderRadius: "12px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px"
          }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EF4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: darkMode ? "#F87171" : "#991B1B" }}>Urgent Attention Required</h4>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: darkMode ? "#FCA5A5" : "#B91C1C" }}>
                <strong>{lowestRated.name}</strong> is performing significantly below average (<strong>{lowestRated.avg_rating}★</strong> from {lowestRated.count} reports).
              </p>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
          <Section theme={theme} title={`Performance Across ${getLabel("category_label_plural", "Programs")}`} empty={programRankings.all.length === 0}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={programRankings.all.slice(0, 5)} layout="vertical" barGap={0} categoryGap="20%">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: theme.textMuted }} width={120} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="avg_rating" fill="var(--primary-color)" radius={[0, 4, 4, 0]} barSize={16}>
                  {programRankings.all.map((entry, index) => (
                    <Cell key={`p-${index}`} fill={entry.avg_rating >= 4 ? "#10B981" : entry.avg_rating < 3 ? "#EF4444" : "#3B82F6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Section 
              theme={theme} 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>Performing Programs</span>
                  <select 
                    value={performanceFilter} 
                    onChange={(e) => setPerformanceFilter(e.target.value)}
                    style={{
                      padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
                      background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`,
                      cursor: 'pointer', outline: 'none', textTransform: 'uppercase'
                    }}
                  >
                    <option value="top">Top</option>
                    <option value="neutral">Neutral</option>
                    <option value="lowest">Lowest</option>
                  </select>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(() => {
                  let filtered = [];
                  if (performanceFilter === "top") {
                    filtered = programRankings.all.filter(p => p.avg_rating >= 4.0).sort((a, b) => b.avg_rating - a.avg_rating);
                  } else if (performanceFilter === "lowest") {
                    filtered = programRankings.all.filter(p => p.avg_rating < 3.0).sort((a, b) => a.avg_rating - b.avg_rating);
                  } else {
                    filtered = programRankings.all.filter(p => p.avg_rating >= 3.0 && p.avg_rating < 4.0).sort((a, b) => b.avg_rating - a.avg_rating);
                  }

                  if (filtered.length === 0) {
                    return <p style={{ fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '10px' }}>
                      No {performanceFilter} performing programs.
                    </p>;
                  }

                  return filtered.slice(0, 5).map((p, i) => (
                    <div key={i} style={{ 
                      display: 'flex', justifyContent: 'space-between', padding: '8px 12px', 
                      background: performanceFilter === 'top' ? (darkMode ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4') : 
                                 performanceFilter === 'lowest' ? (darkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2') :
                                 (darkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF'), 
                      borderRadius: '8px', 
                      border: `1px solid ${performanceFilter === 'top' ? (darkMode ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7') : 
                                          performanceFilter === 'lowest' ? (darkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2') :
                                          (darkMode ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE')}` 
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: theme.text }}>{p.name}</span>
                        <span style={{ fontSize: '10px', color: theme.textMuted }}>{p.count} reports</span>
                      </div>
                      <div style={{ 
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: "800", 
                        color: performanceFilter === 'top' ? "#10B981" : performanceFilter === 'lowest' ? "#EF4444" : "#3B82F6" 
                      }}>
                        {p.avg_rating}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </Section>
          </div>
        </div>
      </div>

      {/* 🔷 SECTION 6: USER MONITORING */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="User Monitoring"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>}
          theme={theme}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
          <Section theme={theme} title="User Engagement Status" empty={summary?.total_users === 0} emptyText="No users registered yet.">
            <div style={{ position: 'relative', height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Active (7d)", value: summary?.active_users || 0 },
                      { name: "Inactive", value: summary?.inactive_users || 0 }
                    ]}
                    cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill={darkMode ? "#334155" : "#E2E8F0"} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ 
                position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', 
                textAlign: 'center', pointerEvents: 'none' 
              }}>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: theme.text }}>
                  {Math.round(((summary?.active_users || 0) / (summary?.total_users || 1)) * 100)}%
                </p>
                <p style={{ margin: 0, fontSize: '8px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Active</p>
              </div>
            </div>
          </Section>

          <Section theme={theme} title="Most Active Users" empty={topUsers.length === 0} emptyText="User activity will appear once feedback is submitted.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topUsers.slice(0, 5).map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: theme.bg, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: theme.text }}>{i + 1}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: theme.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{u.name}</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#10B981' }}>{u.impact_points} pts</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
