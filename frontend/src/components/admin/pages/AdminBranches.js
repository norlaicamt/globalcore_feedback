import React, { useEffect, useState } from "react";
import { adminGetBranches, adminCreateBranch, adminUpdateBranch, adminDeleteBranch, adminGetEntities } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const AdminBranches = ({ theme, darkMode, adminUser }) => {
  const [branches, setBranches] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ isOpen: false });

  // Form State
  const [form, setForm] = useState({
    name: "",
    entity_id: adminUser?.entity_id || "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    is_active: true
  });

  const [editId, setEditId] = useState(null);

  const load = () => {
    setLoading(true);
    // Fetch only entities applicable to this admin
    // If admin has entity_id, they can only manage branches for THAT entity.
    Promise.all([
      adminGetBranches(adminUser?.entity_id), 
      adminGetEntities()
    ])
      .then(([b, e]) => {
        setBranches(b);
        // If scoped admin, they might only see their own entity in the list
        setEntities(adminUser?.entity_id ? e.filter(ent => ent.id === adminUser.entity_id) : e);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [adminUser.entity_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.entity_id) return;

    try {
      if (editId) {
        await adminUpdateBranch(editId, form);
      } else {
        await adminCreateBranch(form);
      }
      setForm({ name: "", entity_id: adminUser?.entity_id || "", region: "", province: "", city: "", barangay: "", is_active: true });
      setEditId(null);
      load();
    } catch (err) {
      console.error(err);
      alert("Error saving branch. Please check selection.");
    }
  };

  const handleDeactivate = (branch) => {
    setDialog({
      isOpen: true, 
      type: "alert", 
      title: branch.is_active ? "Deactivate Branch" : "Reactivate Branch",
      message: branch.is_active 
        ? `Are you sure you want to deactivate "${branch.name}" (Location)? It will no longer be selectable for new feedback, but historical data will be preserved.`
        : `Reactivate "${branch.name}" (Location)? Users will be able to select it again.`,
      confirmText: branch.is_active ? "Deactivate" : "Reactivate", 
      isDestructive: branch.is_active,
      onConfirm: async () => { 
        if (branch.is_active) {
            await adminDeleteBranch(branch.id); 
        } else {
            await adminUpdateBranch(branch.id, { is_active: true });
        }
        setDialog({ isOpen: false }); 
        load(); 
      },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const inputStyle = {
    padding: "10px 14px", 
    border: `1.5px solid ${theme.border}`, 
    borderRadius: "10px", 
    fontSize: "13px", 
    outline: "none", 
    fontFamily: "inherit",
    background: theme.bg,
    color: theme.text,
    width: '100%'
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Form Card */}
      <div style={{ background: theme.surface, borderRadius: "16px", padding: "24px", border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: theme.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {editId ? "Edit Branch (Location)" : "Register New Branch (Location)"}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle(theme)}>Branch/Office Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. 4Ps - Marawi City" style={inputStyle} />
          </div>
          
          <div>
            <label style={labelStyle(theme)}>Program / Service (Entity)</label>
            <select 
              value={form.entity_id} 
              onChange={e => setForm({...form, entity_id: e.target.value})} 
              style={{...inputStyle, cursor: 'pointer'}}
              disabled={!!adminUser?.entity_id}
            >
              <option value="">-- Select Program --</option>
              {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle(theme)}>Region</label>
            <input value={form.region} onChange={e => setForm({...form, region: e.target.value})} placeholder="e.g. BARMM" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle(theme)}>Province</label>
            <input value={form.province} onChange={e => setForm({...form, province: e.target.value})} placeholder="e.g. Lanao del Sur" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle(theme)}>City / Municipality</label>
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="e.g. Marawi City" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle(theme)}>Barangay</label>
            <input value={form.barangay} onChange={e => setForm({...form, barangay: e.target.value})} placeholder="e.g. Bangon" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '10px', gridColumn: '1 / -1' }}>
             {editId && (
               <button type="button" onClick={() => { setEditId(null); setForm({ name: "", entity_id: adminUser?.entity_id || "", region: "", province: "", city: "", barangay: "", is_active: true }); }} 
                 style={{ ...btnBase, background: 'transparent', color: theme.text, border: `1px solid ${theme.border}` }}>
                 Cancel
               </button>
             )}
             <button type="submit" style={{ ...btnBase, background: "var(--primary-color)", color: "white" }}>
              {editId ? "Update Branch" : "+ Register Office"}
            </button>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div style={{ background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>Loading locations...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                {["#", "Branch Name", "Program", "Location Details", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: `1px solid ${theme.border}`, opacity: b.is_active ? 1 : 0.6 }}>
                  <td style={{ padding: "16px", color: theme.textMuted }}>{i + 1}</td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: "700", color: theme.text }}>{b.name}</div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ color: theme.textMuted }}>{entities.find(e => e.id === b.entity_id)?.name || "—"}</span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontSize: '11px', color: theme.textMuted }}>
                        {b.barangay && `${b.barangay}, `}{b.city && `${b.city}, `}{b.province && `${b.province}`}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ 
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        background: b.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: b.is_active ? '#10B981' : '#EF4444'
                    }}>
                        {b.is_active ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => { setEditId(b.id); setForm(b); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={actBtn("#3B82F6", theme)}>Edit</button>
                      <button onClick={() => handleDeactivate(b)} style={actBtn(b.is_active ? "#EF4444" : "#10B981", theme)}>
                        {b.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: theme.textMuted }}>No locations registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
        confirmText={dialog.confirmText} isDestructive={dialog.isDestructive} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
    </div>
  );
};

const labelStyle = (theme) => ({
  display: 'block', 
  fontSize: '10px', 
  fontWeight: '800', 
  color: theme.textMuted, 
  marginBottom: '6px', 
  textTransform: 'uppercase'
});

const btnBase = {
  padding: "10px 24px", 
  border: "none", 
  borderRadius: "10px", 
  fontSize: "13px", 
  fontWeight: "700", 
  cursor: "pointer", 
  fontFamily: "inherit", 
  transition: 'all 0.2s'
};

const actBtn = (color, theme) => ({
  padding: "4px 10px", 
  background: "none", 
  color: color, 
  border: `1.5px solid ${color}30`,
  borderRadius: "6px", 
  fontSize: "11px", 
  fontWeight: "700", 
  cursor: "pointer", 
  fontFamily: "inherit",
  transition: 'all 0.15s'
});

export default AdminBranches;
