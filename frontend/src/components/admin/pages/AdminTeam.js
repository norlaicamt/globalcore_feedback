import React, { useState, useEffect } from "react";
import { adminGetTeam, adminGetEntities, adminGetUnassignedFeedbacks, adminAssignFeedback, adminGetUsers, adminUpdateUserDetails } from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import CustomModal from "../../CustomModal";

export default function AdminTeam({ adminUser, onNavigate }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [overview, setOverview] = useState({ total_active_cases: 0, unassigned_cases: 0 });
  const [entities, setEntities] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteConfirmModal, setInviteConfirmModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [unassignedCases, setUnassignedCases] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [targetAssignUser, setTargetAssignUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isGlobalAdmin = ["superadmin", "GlobalOverseer"].includes(adminUser?.role);
  const canInvite = isGlobalAdmin || adminUser?.role === "admin";

  useEffect(() => {
    if (isGlobalAdmin) {
      adminGetEntities().then((res) => {
        setEntities(res);
        if (res.length > 0 && !selectedEntityId) {
          setSelectedEntityId(res[0].id);
        }
      }).catch(err => {
        console.error("Failed to load entities:", err);
      });
    } else {
      fetchTeam(null);
    }
  }, [isGlobalAdmin]);

  useEffect(() => {
    if (isGlobalAdmin && selectedEntityId) {
      fetchTeam(selectedEntityId);
    }
  }, [selectedEntityId, isGlobalAdmin]);

  const fetchTeam = async (entityId) => {
    setLoading(true);
    setError("");
    try {
      const data = await adminGetTeam(entityId);
      setTeamMembers(data?.members || []);
      setOverview({
        total_active_cases: data?.total_active_cases || 0,
        unassigned_cases: data?.unassigned_cases || 0
      });
    } catch (err) {
      setError("Failed to load team members. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = async (userId = null) => {
    setTargetAssignUser(userId);
    setIsAssignModalOpen(true);
    setAssignLoading(true);
    try {
      const cases = await adminGetUnassignedFeedbacks(selectedEntityId);
      setUnassignedCases(cases || []);
    } catch (e) {
      console.error(e);
    } finally {
      setAssignLoading(false);
    }
  };

  const assignToUser = async (feedbackId, userId) => {
    try {
      await adminAssignFeedback(feedbackId, userId);
      setUnassignedCases(prev => prev.filter(c => c.id !== feedbackId));
      fetchTeam(selectedEntityId); // refresh stats
    } catch (e) {
      console.error("Failed to assign case", e);
      alert("Failed to assign case.");
    }
  };

  const handleOpenInvite = async () => {
    setIsInviteModalOpen(true);
    setInviteLoading(true);
    setSearchTerm("");
    try {
      const allUsers = await adminGetUsers();
      let potential = [];

      if (isGlobalAdmin) {
        // Global Admins see people who are not yet administrators (to promote them)
        potential = allUsers.filter(u => u.role !== "admin" && u.role !== "superadmin");
      } else {
        // Regular SPA Admins only see users who are already administrators but not assigned to a service
        potential = allUsers.filter(u => u.role === "admin" && !u.entity_id);
      }

      potential = potential.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setCandidates(potential);
    } catch (e) {
      console.error("Failed to fetch candidates", e);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteUser = (candidate) => {
    setSelectedCandidate(candidate);
    setInviteConfirmModal(true);
  };

  const confirmInvite = async () => {
    if (!selectedCandidate) return;

    setInviteLoading(true);
    setInviteConfirmModal(false);
    try {
      // Promote user to admin and assign to current entity
      await adminUpdateUserDetails(selectedCandidate.id, "admin", undefined, undefined, selectedEntityId, "Service Admin");
      setIsInviteModalOpen(false);
      fetchTeam(selectedEntityId); // Refresh team list
    } catch (e) {
      console.error("Failed to invite user", e);
      alert("Failed to add user to team. Check if you have sufficient permissions.");
    } finally {
      setInviteLoading(false);
      setSelectedCandidate(null);
    }
  };

  const getPresence = (lastActiveDate) => {
    if (!lastActiveDate) return "offline";
    const diffMins = (new Date() - new Date(lastActiveDate)) / 60000;
    if (diffMins < 5) return "online";
    if (diffMins <= 30) return "idle";
    return "offline";
  };

  const getWorkloadIcon = (cases) => {
    if (cases <= 3) return "🟢";
    if (cases <= 6) return "🟡";
    return "🔴";
  };

  const groupMembers = () => {
    const you = teamMembers.filter(m => m.is_you);
    const others = teamMembers.filter(m => !m.is_you);

    const coreTeam = others.filter(m => ["Admin", "Global Admin", "Coordinator", "Service_admin", "Superadmin"].includes(m.role))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const supportTeam = others.filter(m => !["Admin", "Global Admin", "Coordinator", "Service_admin", "Superadmin"].includes(m.role))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return { you, coreTeam, supportTeam };
  };

  const { you, coreTeam, supportTeam } = groupMembers();

  const availableCount = teamMembers.filter(m => getPresence(m.last_active) === "online").length;
  const overloadedCount = teamMembers.filter(m => m.active_cases >= 7).length;

  const renderMemberCard = (m) => {
    const presence = getPresence(m.last_active);

    let dotColor = "#9CA3AF";
    if (presence === "online") dotColor = "#22C55E";
    if (presence === "idle") dotColor = "#F59E0B";

    const isCore = ["Admin", "Global Admin", "Coordinator", "Service_admin", "Superadmin"].includes(m.role);

    return (
      <div key={m.user_id} style={{
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        backgroundColor: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
      }}>
        {/* Avatar Area */}
        <div style={{ position: "relative" }}>
          {m.avatar_url ? (
            <img src={m.avatar_url} alt={m.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280",
              fontWeight: "600", fontSize: "13px"
            }}>
              {m.name ? m.name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
          <div style={{
            position: "absolute", top: "-2px", right: "-2px",
            width: "10px", height: "10px", borderRadius: "50%",
            backgroundColor: dotColor, border: "2px solid #fff"
          }} />
        </div>

        {/* Text Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {m.name} {m.is_you && <span style={{ color: "#6B7280", fontWeight: "normal" }}>(You)</span>}
          </div>

          <div style={{ fontSize: "11px", color: isCore ? "#4B5563" : "#6B7280", marginTop: "2px", fontWeight: isCore ? "500" : "normal" }}>
            {m.role} {m.entities && m.entities.length > 0 && ` • ${m.entities.join(" • ")}`}
          </div>

          <div style={{ display: "block", marginTop: "4px" }}>
            <span
              style={{ fontSize: "11px", color: "#2563EB", fontWeight: "500", cursor: "pointer", display: "inline-block" }}
              onClick={() => {
                if (m.is_you) {
                  localStorage.setItem("admin_feedback_filter", "MY_CASES");
                } else {
                  localStorage.setItem("admin_feedback_filter", m.name);
                }
                onNavigate("feedbacks");
              }}
            >
              Handling: {m.active_cases} {m.active_cases === 1 ? 'case' : 'cases'} {getWorkloadIcon(m.active_cases)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: "600",
              color: "#374151",
              backgroundColor: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
            onClick={() => handleOpenAssign(m.user_id)}
          >
            Assign &rarr;
          </button>
        </div>
      </div>
    );
  };

  const renderGroup = (title, members, showEmpty = false) => {
    if (!showEmpty && (!members || members.length === 0)) return null;
    return (
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {title} • {members.length} {members.length === 1 ? 'member' : 'members'}
        </h3>

        {members.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#F9FAFB", borderRadius: "12px", border: "1px dashed #E5E7EB" }}>
            <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px" }}>No staff assigned to this tier yet.</div>
            {canInvite && (
              <button
                onClick={handleOpenInvite}
                style={{ padding: "6px 12px", fontSize: "11px", fontWeight: "600", color: "#111827", backgroundColor: "white", border: "1px solid #D1D5DB", borderRadius: "6px", cursor: "pointer" }}
              >
                Invite Team Member
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
            {members.map(renderMemberCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "30px", width: "100%", boxSizing: "border-box" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>Service Team</h2>

            {isGlobalAdmin && (
              <select
                value={selectedEntityId || ""}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                style={{ padding: "4px 28px 4px 10px", background: "#F3F4F6", fontSize: "13px", fontWeight: "600", color: "#111827", border: "1px solid #E5E7EB", borderRadius: "6px", outline: "none", cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111827%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px top 50%", backgroundSize: "10px auto" }}
              >
                {entities.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            )}
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>Manage workload and assignments for this service</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {canInvite && (
            <button
              onClick={handleOpenInvite}
              style={{ padding: "8px 14px", fontSize: "12px", fontWeight: "600", color: "#111827", backgroundColor: "white", border: "1px solid #D1D5DB", borderRadius: "6px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              Invite Team Member
            </button>
          )}
          <button
            onClick={() => {
              localStorage.setItem("admin_feedback_filter", "UNASSIGNED");
              onNavigate("feedbacks");
            }}
            style={{ padding: "8px 14px", fontSize: "12px", fontWeight: "600", color: "white", backgroundColor: "#111827", border: "none", borderRadius: "6px", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
          >
            Assign Unassigned Cases
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: "13px", color: "#6B7280", padding: "20px 0" }}>Loading operational data...</div>
      ) : error ? (
        <div style={{ padding: "12px", backgroundColor: "#FEE2E2", color: "#B91C1C", borderRadius: "8px", fontSize: "13px" }}>{error}</div>
      ) : (
        <>
          {/* KPI STRIP */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
            <div style={{ background: "#F3F4F6", height: "48px", padding: "0 16px", borderRadius: "8px", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{overview.total_active_cases}</span>
              <span style={{ fontSize: "12px", color: "#4B5563", fontWeight: "500" }}>Active Cases</span>
            </div>
            <div
              style={{ background: overview.unassigned_cases > 0 ? "#FEF2F2" : "#F3F4F6", height: "48px", padding: "0 16px", borderRadius: "8px", border: overview.unassigned_cases > 0 ? "1px solid #FECACA" : "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              onClick={() => {
                localStorage.setItem("admin_feedback_filter", "UNASSIGNED");
                onNavigate("feedbacks");
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: "700", color: overview.unassigned_cases > 0 ? "#991B1B" : "#111827" }}>{overview.unassigned_cases}</span>
              <span style={{ fontSize: "12px", color: overview.unassigned_cases > 0 ? "#B91C1C" : "#4B5563", fontWeight: "500" }}>Unassigned {overview.unassigned_cases > 0 && "⚠️"}</span>
            </div>
          </div>

          {/* MAIN GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "30px" }}>

            {/* LEFT PANEL */}
            <div>
              {renderGroup("You", you)}
              {renderGroup("Core Team", coreTeam, true)}
              {renderGroup("Support Team", supportTeam, true)}
            </div>

            {/* RIGHT PANEL */}
            <div>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB", position: "sticky", top: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: "700", color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.5px" }}>Team Snapshot</h3>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <span style={{ color: "#6B7280" }}>Core Team:</span>
                  <span style={{ fontWeight: "600", color: "#111827" }}>{coreTeam.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "13px", paddingBottom: "16px", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ color: "#6B7280" }}>Support Team:</span>
                  <span style={{ fontWeight: "600", color: "#111827" }}>{supportTeam.length}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <span style={{ color: "#6B7280" }}>Available:</span>
                  <span style={{ fontWeight: "600", color: "#111827" }}>{availableCount} 🟢</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "13px" }}>
                  <span style={{ color: "#6B7280" }}>Overloaded:</span>
                  <span style={{ fontWeight: "600", color: "#111827" }}>{overloadedCount} 🔴</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ASSIGNMENT MODAL */}
      {isAssignModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", width: "550px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                {targetAssignUser ? "Assign Case to Team Member" : "Distribute Unassigned Cases"}
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#6B7280" }}>✕</button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              {assignLoading ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#6B7280", fontSize: "13px" }}>Loading unassigned cases...</div>
              ) : unassignedCases.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#6B7280", fontSize: "13px", backgroundColor: "#F9FAFB", borderRadius: "8px", border: "1px dashed #D1D5DB" }}>
                  All caught up! No unassigned cases available for this service.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {unassignedCases.map(fb => (
                    <div key={fb.id} style={{ padding: "14px", border: "1px solid #E5E7EB", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F9FAFB" }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}>
                        <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          #{fb.id} - {fb.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                          From: {fb.sender_name || "Anonymous"} • {new Date(fb.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        {targetAssignUser ? (
                          <button
                            onClick={() => assignToUser(fb.id, targetAssignUser)}
                            style={{ padding: "6px 14px", background: "#111827", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}
                          >
                            Assign Here
                          </button>
                        ) : (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                assignToUser(fb.id, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #D1D5DB", outline: "none", cursor: "pointer", backgroundColor: "white", color: "#111827", fontWeight: "500" }}
                            defaultValue=""
                          >
                            <option value="" disabled>Select Assignee...</option>
                            {teamMembers.map(m => (
                              <option key={m.user_id} value={m.user_id}>
                                {m.name} ({m.active_cases} cases)
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INVITATION MODAL */}
      {isInviteModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", width: "500px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>Assign Service Admin</h3>
              <button onClick={() => setIsInviteModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#6B7280" }}>✕</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Search unassigned admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              {inviteLoading && candidates.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#6B7280", fontSize: "13px" }}>Searching for unassigned admins...</div>
              ) : candidates.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#6B7280", fontSize: "13px", backgroundColor: "#F9FAFB", borderRadius: "8px", border: "1px dashed #D1D5DB" }}>
                  {searchTerm ? "No admins match your search." : "No unassigned admins available."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {candidates
                    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(u => (
                      <div key={u.id} style={{ padding: "12px", border: "1px solid #E5E7EB", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#4B5563" }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{u.name}</div>
                            <div style={{ fontSize: "11px", color: "#6B7280" }}>{u.email}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInviteUser(u)}
                          disabled={inviteLoading}
                          style={{ padding: "6px 12px", background: "#2563EB", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}
                        >
                          Add to Team
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <CustomModal
        isOpen={inviteConfirmModal}
        title="Assign Service Admin?"
        message={`Are you sure you want to assign ${selectedCandidate?.name} to this service team? They will be granted administrative access to ${entities.find(e => e.id === selectedEntityId)?.name || 'this workspace'}.`}
        type="info"
        confirmText="Confirm Assignment"
        onConfirm={confirmInvite}
        onCancel={() => {
          setInviteConfirmModal(false);
          setSelectedCandidate(null);
        }}
      />
    </div>
  );
}
