import React, { useState, useRef, useEffect } from "react";

const ExportDropdown = ({ onExport, theme, darkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formats = [
    { 
      id: 'pdf', 
      label: 'Executive PDF', 
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> 
    },
    { 
      id: 'xls', 
      label: 'Executive Excel', 
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg> 
    },
    { 
      id: 'docx', 
      label: 'Executive DOCX', 
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> 
    },
    { 
      id: 'csv', 
      label: 'CSV (Legacy)', 
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> 
    }
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          background: theme.surface,
          color: theme.text,
          border: `1.5px solid ${theme.border}`,
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "0.2s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary-color)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export Report
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "42px",
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 100,
            minWidth: "200px",
            padding: "6px"
          }}
        >
          <p style={{ margin: "6px 12px 10px", fontSize: "10px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Report Format</p>
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => {
                onExport(fmt.id);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                borderRadius: "8px",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: "600",
                color: theme.text,
                cursor: "pointer",
                transition: "0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span style={{ color: fmt.id === 'csv' ? '#94A3B8' : 'var(--primary-color)' }}>{fmt.icon}</span>
              {fmt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
