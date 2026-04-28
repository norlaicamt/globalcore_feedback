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
const SectionHeader = ({ title, icon, theme, subtitle, timeContext }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', marginTop: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <h2 style={{ fontSize: '12px', fontWeight: '800', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{title}</h2>
      <div style={{ flex: 1, height: '1px', background: theme.border, marginLeft: '12px' }} />
      {timeContext && (
        <div style={{ 
          padding: '2px 8px', borderRadius: '4px', background: theme.bg, 
          border: `1px solid ${theme.border}`, fontSize: '9px', fontWeight: '700', 
          color: theme.textMuted, textTransform: 'uppercase' 
        }}>
          {timeContext}
        </div>
      )}
    </div>
    {subtitle && <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted, fontWeight: '600', marginLeft: '26px' }}>{subtitle}</p>}
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
      <div style={{ height: '10px', width: '100%', display: 'flex', borderRadius: '5px', overflow: 'hidden', background: theme.bg, marginBottom: '20px', gap: '2px' }}>
        <div style={{ width: `${getPct(positive)}%`, background: '#10B981', transition: '0.3s' }} />
        <div style={{ width: `${getPct(neutral)}%`, background: '#94A3B8', transition: '0.3s' }} />
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
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#94A3B8' }} />
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

const KpiCard = ({ label, value, sub, onClick, theme, color, priority, statusLabel, light }) => (
  <div
    onClick={onClick}
    style={{
      background: priority ? (color ? `${color}15` : theme.surface) : (light ? 'transparent' : theme.surface), 
      borderRadius: "12px", padding: priority ? "16px 20px" : "10px 14px", 
      border: priority ? `2px solid ${color || 'var(--primary-color)'}` : (light ? `1px dashed ${theme.border}` : `1px solid ${theme.border}`),
      boxShadow: priority ? `0 4px 12px ${color ? `${color}25` : 'rgba(0,0,0,0.05)'}` : "none", 
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s",
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      flex: 1
    }}
  >
    {statusLabel && (
      <div style={{ 
        position: 'absolute', top: '10px', right: '10px', padding: '2px 6px', 
        borderRadius: '4px', background: color, color: 'white', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase' 
      }}>
        {statusLabel}
      </div>
    )}
    <p style={{ fontSize: priority ? "10px" : "8px", color: theme.textMuted, margin: "0 0 2px 0", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <p style={{ fontSize: priority ? "26px" : "16px", fontWeight: "900", color: color || theme.text, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
      {priority && <span style={{ fontSize: '10px', color: theme.textMuted, fontWeight: '700' }}>pending</span>}
    </div>
    {sub && <p style={{ fontSize: "9px", color: theme.textMuted, margin: "2px 0 0 0", fontWeight: "600" }}>{sub}</p>}
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

  // Helper to get status counts for Overview
  const getStatusCount = (s) => byStatus.find(b => b.status === s)?.count || 0;
  const newCount = getStatusCount("OPEN");
  const inReviewCount = getStatusCount("IN_PROGRESS");
  const resolvedCount = getStatusCount("RESOLVED");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

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

      {/* 🔷 SECTION 1: COMMAND CENTER (Tiers) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="Command Center"
          subtitle="Priority actions and contextual system volume."
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
          theme={theme}
          timeContext="Real-time"
        />
        
        {/* Tier 1: Actionable (Dominant) */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
          <KpiCard
            label="New Submissions"
            value={newCount}
            sub={newCount > 0 ? "Action required" : "All cleared"}
            theme={theme}
            color="#EAB308"
            priority={newCount > 0}
            statusLabel="High Priority"
            onClick={() => onNavigate("feedbacks")}
          />
          <KpiCard
            label="In Review"
            value={inReviewCount}
            sub="Active handling"
            theme={theme}
            color="#3B82F6"
            priority={inReviewCount > 0}
            statusLabel="Processing"
            onClick={() => onNavigate("feedbacks")}
          />
        </div>

        {/* Tier 2: Contextual (Lightweight) */}
        <div style={{ display: "flex", gap: "12px" }}>
          <KpiCard
            label="Total Citizens"
            value={summary?.global_total_users ?? 0}
            theme={theme}
            light
          />
          <KpiCard
            label="Engaged"
            value={summary?.total_users ?? 0}
            theme={theme}
            light
          />
          <KpiCard
            label="Resolved"
            value={resolvedCount}
            theme={theme}
            light
            color="#10B981"
          />
        </div>
      </div>

      {/* 🔷 SECTION 2: ACTIVITY TRENDS (Interpretation Layer) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="Activity Trends"
          subtitle="Monitoring submission volume and engagement spikes."
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}
          theme={theme}
          timeContext={`Last ${days} days`}
        />
        <Section theme={theme} title="Volume & Engagement Analysis" empty={volume.length === 0} emptyText="No activity data detected for this scope.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '20px' }}>
            <ResponsiveContainer width="100%" height={240}>
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
            <div style={{ 
              background: theme.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}`,
              display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              <h4 style={{ margin: 0, fontSize: '9px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Summary</h4>
              {(() => {
                const recent = volume.slice(-3).reduce((acc, v) => acc + v.count, 0);
                const previous = volume.slice(-6, -3).reduce((acc, v) => acc + v.count, 0);
                const diff = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
                
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: diff >= 0 ? '#10B981' : '#EF4444' }}>
                        {diff >= 0 ? '+' : ''}{Math.round(diff)}%
                      </p>
                      <p style={{ margin: 0, fontSize: '9px', color: theme.textMuted }}>vs prev.</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.text, lineHeight: '1.4', fontWeight: '500' }}>
                      {diff >= 0 
                        ? `Activity is trending up.`
                        : `Activity is trending down.`
                      }
                    </p>
                    <div style={{ marginTop: 'auto', padding: '8px', background: theme.surface, borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                      <p style={{ margin: 0, fontSize: '9px', color: theme.textMuted }}>Next step:</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: '700', color: theme.text }}>
                        {newCount > 0 ? `Review pending` : "Check backlog"}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </Section>
      </div>

      {/* 🔷 SECTION 3: FEEDBACK QUALITY (Interpretation Layer) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="Feedback Quality"
          subtitle="Analyzing sentiment, scores, and categorical focus areas."
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
          theme={theme}
          timeContext="Aggregate"
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <Section theme={theme} title="Overall Mood (Sentiment)">
            <HorizontalSentimentBar data={sentiment} theme={theme} />
          </Section>

          <Section theme={theme} title="Service Quality Score (Rating)" empty={summary?.total_feedback === 0}>
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

          <Section theme={theme} title="Category (Focus Areas)" empty={Object.keys(feedbackTypeDist).length === 0}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SectionHeader
          title="Programs & Participation"
          subtitle="Performance benchmarking and active contributor visibility."
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>}
          theme={theme}
          timeContext="All-time"
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
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programRankings.all.slice(0, 8)} layout="vertical" barGap={0} categoryGap="20%">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: theme.textMuted }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="avg_rating" fill="var(--primary-color)" radius={[0, 4, 4, 0]} barSize={16}>
                    {programRankings.all.slice(0, 8).map((entry, index) => (
                      <Cell key={`p-${index}`} fill={entry.avg_rating >= 4 ? "#10B981" : entry.avg_rating < 3 ? "#EF4444" : "#3B82F6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section theme={theme} title="Community Participation" empty={topUsers.length === 0} emptyText="No community activity detected.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topUsers.slice(0, 5).map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                  <div style={{ 
                    width: '28px', height: '28px', borderRadius: '50%', 
                    background: theme.bg, border: `1.5px solid ${theme.border}`,
                    color: theme.textMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' 
                  }}>
                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                    <p style={{ margin: 0, fontSize: '9px', color: theme.textMuted }}>Recent Contribution</p>
                  </div>
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
