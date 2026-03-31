import React, { useState } from "react";

const AdminUserInfoFields = ({ theme, darkMode }) => {
  const [fields, setFields] = useState([
    { id: 1, name: "Employee ID", type: "number", required: true, active: true },
    { id: 2, name: "Department", type: "dropdown", required: true, active: true },
    { id: 3, name: "Job Title", type: "text", required: false, active: true },
    { id: 4, name: "Office Location", type: "text", required: false, active: false },
    { id: 5, name: "Phone Number", type: "text", required: false, active: true },
  ]);

  const toggleStatus = (id, key) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: !f[key] } : f));
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ padding: "20px", background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "800", color: theme.text }}>Personal Information Control</h2>
        <p style={{ margin: 0, fontSize: "14px", color: theme.textMuted }}>
          Define which personal information fields are required for user profiles and which are currently active in the system.
        </p>
      </div>

      <div style={{ background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
              <th style={thStyle(theme)}>Field Name</th>
              <th style={thStyle(theme)}>Type</th>
              <th style={thStyle(theme)}>Required</th>
              <th style={thStyle(theme)}>Active</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(f => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ ...tdStyle, fontWeight: "600", color: theme.text }}>{f.name}</td>
                <td style={{ ...tdStyle, color: theme.textMuted, textTransform: "capitalize" }}>{f.type}</td>
                <td style={tdStyle}>
                   <Toggle 
                     checked={f.required} 
                     onChange={() => toggleStatus(f.id, 'required')} 
                     theme={theme}
                   />
                </td>
                <td style={tdStyle}>
                   <Toggle 
                     checked={f.active} 
                     onChange={() => toggleStatus(f.id, 'active')} 
                     theme={theme}
                   />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "20px", background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: "13px", color: theme.textMuted }}>
          Changes to visibility and requirements take effect for new registrations and profile edits.
        </p>
        <button style={{ 
          padding: "10px 24px", 
          background: "#1f2a56", 
          color: "white", 
          borderRadius: "10px", 
          border: "none", 
          fontWeight: "700", 
          cursor: "pointer" 
        }}>
          Save Config
        </button>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange, theme }) => (
  <div 
    onClick={onChange}
    style={{
      width: "36px", height: "18px", borderRadius: "9px", padding: "2px",
      background: checked ? "#34D399" : theme.bg, cursor: "pointer", 
      transition: "background 0.2s", display: "flex", alignItems: "center",
      border: `1px solid ${theme.border}`
    }}
  >
    <div style={{
      width: "14px", height: "14px", borderRadius: "50%", background: "white",
      transition: "transform 0.2s", transform: checked ? "translateX(16px)" : "translateX(0)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
    }} />
  </div>
);

const thStyle = (theme) => ({ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" });
const tdStyle = { padding: "14px 20px", verticalAlign: "middle" };

export default AdminUserInfoFields;
