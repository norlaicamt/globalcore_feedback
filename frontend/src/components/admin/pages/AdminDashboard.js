import React, { useEffect, useState } from "react";
import { useTerminology } from "../../../context/TerminologyContext";
import {
  getAnalyticsSummary, getAnalyticsVolume, getAnalyticsByCategory,
  getAnalyticsByDepartment, getAnalyticsByStatus, getAnalyticsRatings,
  getTopUsers, getAnalyticsEngagement, getAnalyticsSentiment,
  getAnalyticsSnapshot, adminGetScopeOptions
} from "../../../services/adminApi";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

const CHART_COLORS = ["#1f2a56", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

const KpiCard = ({ label, value, sub, onClick, theme }) => (
  <div 
    onClick={onClick}
    style={{ 
      background: theme.surface, borderRadius: "12px", padding: "18px 20px", border: `1px solid ${theme.border}`, 
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)", cursor: onClick ? "pointer" : "default",
      transition: "transform 0.1s, border-color 0.15s"
    }}
    onMouseEnter={e => { if(onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#3B82F6'; } }}
    onMouseLeave={e => { if(onClick) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = theme.border; } }}
  >
    <p style={{ fontSize: "11px", color: theme.textMuted, margin: "0 0 6px 0", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    <p style={{ fontSize: "24px", fontWeight: "800", color: theme.text, margin: "0 0 3px 0" }}>{value}</p>
    {sub && <p style={{ fontSize: "11px", color: theme.textMuted, margin: 0 }}>{sub}</p>}
  </div>
);

const Section = ({ title, children, theme }) => (
  <div style={{ background: theme.surface, borderRadius: "12px", padding: "20px", border: `1px solid ${theme.border}` }}>
    <h3 style={{ fontSize: "11px", fontWeight: "700", color: theme.textMuted, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</h3>
    {children}
  </div>
);

const AdminDashboard = ({ onNavigate, theme, darkMode, adminUser }) => {
  const { getLabel } = useTerminology();
  // Treat any admin/superadmin as "global" for scope tracking.
  // (We are moving away from strict department-based scoping.)
  const hasGlobalAdminAccess = ["admin", "superadmin"].includes(adminUser?.role);
  const tooltipStyle = { 
    fontSize: "12px", borderRadius: "8px", border: `1px solid ${theme.border}`, 
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", backgroundColor: theme.surface, color: theme.text 
  };
  const [summary, setSummary] = useState(null);
  const [volume, setVolume] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byDept, setByDept] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [sentiment, setSentiment] = useState({ positive: 0, neutral: 0, frustrated: 0 });
  const [userDistribution, setUserDistribution] = useState({ by_program: [], by_role: [] });
  const [loading, setLoading] = useState(true);
  
  const [scopeCategories, setScopeCategories] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => {
    if (hasGlobalAdminAccess) {
      adminGetScopeOptions().then(setScopeCategories).catch(console.error);
    }
  }, [adminUser, hasGlobalAdminAccess]);

  useEffect(() => {
    // If superadmin, use the selectedDept from the dropdown. 
    // If empty string (""), it means Global System Addregate.
    // If regular admin, use their strict assigned department.
    const deptFilter = hasGlobalAdminAccess ? selectedDept : (adminUser?.department || "");
    
    const fetchAnalytics = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const data = await getAnalyticsSnapshot(deptFilter);
        setSummary(data.summary);
        setVolume(data.volume);
        setByCategory(data.by_category);
        setByDept(data.by_department);
        setByStatus(data.by_status);
        setRatings(data.ratings);
        setTopUsers(data.top_users);
        setEngagement(data.engagement);
        setSentiment(data.sentiment);
        setUserDistribution(data.user_distribution || { by_program: [], by_role: [] });
      } catch (err) {
        console.error(err);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchAnalytics(true);
    
    // Auto-refresh every 15 seconds
    const intervalId = setInterval(() => fetchAnalytics(false), 15000);
    return () => clearInterval(intervalId);
  }, [adminUser, selectedDept]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#94A3B8", fontSize: "13px" }}>
      Loading analytics...
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header controls for Super Admins */}
      {hasGlobalAdminAccess ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.surface, padding: "12px 20px", borderRadius: "12px", border: `1px solid ${theme.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: theme.text }}>{getLabel("entity_label", "Department")} Scope Tracker</h3>
            {selectedDept ? (
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#3B82F6", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3B82F6" }} />
                Viewing: {selectedDept} ({getLabel("entity_label", "Department")} View)
              </p>
            ) : (
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: theme.textMuted, fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }} />
                Viewing: Global System Aggregate
              </p>
            )}
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "13px", fontWeight: "600", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="">All {getLabel("entity_label_plural", "Departments")} (Global)</option>
            {scopeCategories.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.surface, padding: "12px 20px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
           <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: theme.text }}>{adminUser?.department} Dashboard</h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#3B82F6", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3B82F6" }} />
              Scoped to your assigned program
            </p>
          </div>
        </div>
      )}

      {/* KPI Row — centered and dynamic */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px",
        justifyContent: "center"
      }}>
        <KpiCard theme={theme} label={hasGlobalAdminAccess ? `Total ${getLabel("feedback_label_plural", "Feedback")}` : `${adminUser?.department} ${getLabel("feedback_label", "Feedback")}`} value={summary?.total_feedback ?? 0} sub={hasGlobalAdminAccess ? "System-wide" : "Total reports"} onClick={() => onNavigate("feedbacks")} />
        {hasGlobalAdminAccess ? (
          <KpiCard theme={theme} label="Total Users" value={summary?.total_users ?? 0} sub="Registered" onClick={() => onNavigate("users")} />
        ) : (
          <KpiCard theme={theme} label="Dept. Users" value={summary?.total_users ?? 0} sub={`In ${adminUser?.department}`} onClick={() => onNavigate("users")} />
        )}
        <KpiCard theme={theme} label="Avg. Rating" value={summary?.avg_rating ?? 0} sub="Out of 5" />
        <KpiCard theme={theme} label="Anonymous Rate" value={`${summary?.anonymous_rate ?? 0}%`} sub={`Of all ${getLabel("feedback_label_plural", "submissions")}`} />
        <KpiCard theme={theme} label="Total Comments" value={summary?.total_comments ?? 0} sub="All replies" />
      </div>

      {/* 📊 User Insight Section */}
      <div style={{ display: "grid", gridTemplateColumns: hasGlobalAdminAccess ? "1fr 1fr" : "1fr", gap: "16px" }}>
        {hasGlobalAdminAccess && (
          <Section theme={theme} title="Program/Office distribution">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={userDistribution.by_program}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                >
                  {userDistribution.by_program.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
              {userDistribution.by_program.map((entry, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span style={{ fontSize: "10px", color: theme.textMuted }}>{entry.name}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section theme={theme} title={hasGlobalAdminAccess ? "User Role Identities (System-wide)" : `User Roles in ${adminUser?.department}`}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userDistribution.by_role} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: theme.textMuted }} width={100} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Section theme={theme} title={`${getLabel("feedback_label", "Feedback")} Volume — Last 30 Days`}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={volume}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f2a56" stopOpacity={darkMode ? 0.4 : 0.15}/>
                  <stop offset="95%" stopColor="#1f2a56" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#1f2a56" fill="url(#volGrad)" strokeWidth={2} dot={false} name={getLabel("feedback_label", "Feedback")} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section theme={theme} title="Comments — Last 30 Days">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={engagement}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="comments" stroke="#2563EB" strokeWidth={2} dot={false} name="Comments" />
            </LineChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section theme={theme} title="Organizational Mood Meter">
        <div style={{ display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
          <div style={{ width: "200px", height: "200px", flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Positive", value: sentiment.positive },
                    { name: "Neutral", value: sentiment.neutral },
                    { name: "Frustrated", value: sentiment.frustrated },
                  ]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill={darkMode ? "#475569" : "#94A3B8"} />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <p style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "20px", lineHeight: "1.5" }}>
              Automated analysis of user feedback descriptions. This meter helps you quickly gauge the emotional health of the organization.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 12px", background: darkMode ? "rgba(16, 185, 129, 0.1)" : "#F0FDF4", borderRadius: "8px", border: `1px solid ${darkMode ? "rgba(16, 185, 129, 0.2)" : "#DCFCE7"}` }}>
                <span style={{ fontWeight: "600", color: darkMode ? "#10B981" : "#166534" }}>😊 Positive</span>
                <span style={{ fontWeight: "800", color: darkMode ? "#10B981" : "#166534" }}>{sentiment.positive} {getLabel("feedback_label_plural", "Posts")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 12px", background: darkMode ? "rgba(148, 163, 184, 0.1)" : "#F8FAFC", borderRadius: "8px", border: `1px solid ${darkMode ? "rgba(148, 163, 184, 0.2)" : "#F1F5F9"}` }}>
                <span style={{ fontWeight: "600", color: theme.text }}>😐 Neutral</span>
                <span style={{ fontWeight: "800", color: theme.text }}>{sentiment.neutral} {getLabel("feedback_label_plural", "Posts")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 12px", background: darkMode ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2", borderRadius: "8px", border: `1px solid ${darkMode ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2"}` }}>
                <span style={{ fontWeight: "600", color: darkMode ? "#F87171" : "#991B1B" }}>😫 Frustrated</span>
                <span style={{ fontWeight: "800", color: darkMode ? "#F87171" : "#991B1B" }}>{sentiment.frustrated} {getLabel("feedback_label_plural", "Posts")}</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Category Analytics */}
      <Section theme={theme} title={`Submissions by ${getLabel("category_label", "Category")} Type`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byCategory} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} width={120} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#1f2a56" radius={[0, 6, 6, 0]} name={getLabel("feedback_label_plural", "Posts")}>
              {byCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={darkMode ? CHART_COLORS[index % CHART_COLORS.length] : CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Status + Ratings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Section theme={theme} title="Status Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStatus}>
              <XAxis dataKey="status" tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section theme={theme} title="Rating Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratings}>
              <XAxis dataKey="rating" tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} tickFormatter={v => `${v}★`} />
              <YAxis tick={{ fontSize: 10, fill: theme.textMuted }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#1f2a56" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* Top Users */}
      <Section theme={theme} title="Most Active Users">
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {topUsers.map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: darkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: `1px solid ${theme.border}` }}>
              <span style={{ width: "20px", fontSize: "12px", fontWeight: "700", color: theme.textMuted, textAlign: "center" }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: theme.text }}>{u.name}</p>
                <p style={{ margin: 0, fontSize: "11px", color: theme.textMuted }}>{u.email}</p>
              </div>
              <span style={{ fontSize: "13px", fontWeight: "700", color: theme.text }}>{u.total_posts} {getLabel("feedback_label_plural", "posts")}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default AdminDashboard;
