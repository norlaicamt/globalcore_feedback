import axios from "axios";

// Base URL for your FastAPI backend
const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;
const BASE = `${API_BASE}/admin`;

const adminApi = axios.create({ baseURL: BASE });
 
// Request interceptor to add admin context headers
adminApi.interceptors.request.use((config) => {
  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "null");
  if (adminUser?.session_token) {
    config.headers["X-Session-Token"] = adminUser.session_token;
  }
  return config;
});

// Response interceptor to handle session expiry (401)
// We use a flag to prevent infinite reload loops if a subsequent request also fails 401 during unload
let isRedirecting = false;

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login');
    if (error.response?.status === 401 && !isRedirecting && !isLoginRequest) {
      isRedirecting = true;
      console.warn("Session expired or unauthorized. Logging out...");
      
      // Clear all potential admin-related session storage
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminView");
      
      // Direct redirect to the admin login page
      // Using window.location.href ensures we break out of current React state
      window.location.href = "/admin";
    }
    return Promise.reject(error);
  }
);

// Auth
export const adminLogin = (email, password) =>
  adminApi.post(`/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`).then(r => r.data);

// Analytics
export const getAnalyticsSnapshot = (dept_name = "") => adminApi.get(`/analytics/snapshot${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsSummary = (dept_name = "") => adminApi.get(`/analytics/summary${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsVolume = (days = 30, dept_name = "") => adminApi.get(`/analytics/volume?days=${days}${dept_name ? `&dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsByEntity = (dept_name = "") => adminApi.get(`/analytics/by-entity${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsByDepartment = () => adminApi.get("/analytics/by-department").then(r => r.data);
export const getAnalyticsByStatus = (dept_name = "") => adminApi.get(`/analytics/by-status${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsRatings = (dept_name = "") => adminApi.get(`/analytics/ratings${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getTopUsers = (limit = 10) => adminApi.get(`/analytics/top-users?limit=${limit}`).then(r => r.data);
export const getAnalyticsEngagement = (days = 30) => adminApi.get(`/analytics/engagement?days=${days}`).then(r => r.data);
export const getAnalyticsByLocation = (dept_name = "") => adminApi.get(`/analytics/by-location${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsSentiment = (dept_name = "") => adminApi.get(`/analytics/sentiment${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);

// Users
export const adminGetUsers = () => adminApi.get("/users").then(r => r.data);
export const adminToggleUserStatus = (id, isActive) => adminApi.put(`/users/${id}/status?is_active=${isActive}`).then(r => r.data);
export const adminUpdateUserRole = (id, role) => adminApi.put(`/users/${id}/role?role=${encodeURIComponent(role)}`).then(r => r.data);
export const adminUpdateUserDetails = (id, role, department, program, entity_id, position_title) => {
  const q = new URLSearchParams();
  if (role) q.set("role", role);
  if (department !== undefined) q.set("department", department);
  if (program !== undefined) q.set("program", program);
  if (entity_id !== undefined) q.set("entity_id", entity_id);
  if (position_title !== undefined) q.set("position_title", position_title);
  return adminApi.put(`/users/${id}/details?${q.toString()}`).then(r => r.data);
};
export const adminDeleteUser = (id) => adminApi.delete(`/users/${id}`);

// Feedbacks
export const adminGetFeedbacks = (params = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.entity_id) q.set("entity_id", params.entity_id);
  if (params.dept_name) q.set("dept_name", params.dept_name);
  q.set("skip", params.skip || 0);
  q.set("limit", params.limit || 50);
  return adminApi.get(`/feedbacks?${q.toString()}`).then(r => r.data);
};
export const adminUpdateFeedbackStatus = (id, status) => adminApi.put(`/feedbacks/${id}/status?status=${status}`).then(r => r.data);
export const adminDeleteFeedback = (id) => adminApi.delete(`/feedbacks/${id}`);

// Departments
export const adminGetDepartments = () => adminApi.get("/departments").then(r => r.data);
export const adminCreateDepartment = (name, entity_id = null) => 
  adminApi.post(`/departments?name=${encodeURIComponent(name)}${entity_id ? `&entity_id=${entity_id}` : ""}`).then(r => r.data);
export const adminUpdateDepartment = (id, name, entity_id = null) => 
  adminApi.put(`/departments/${id}?name=${encodeURIComponent(name)}${entity_id ? `&entity_id=${entity_id}` : ""}`).then(r => r.data);
export const adminDeleteDepartment = (id) => adminApi.delete(`/departments/${id}`);

// Dashboard scope options (Program/Office/Entities)
export const adminGetScopeOptions = () => adminApi.get("/scope-options").then(r => r.data);

// Entities
export const adminGetEntities = () => adminApi.get("/entities").then(r => r.data);
export const adminCreateEntity = (name, description = "", fields = [], icon = "default", organization_id = null) => 
  adminApi.post("/entities", { name, description, fields, icon, organization_id }).then(r => r.data);
export const adminUpdateEntity = (id, name, description = "", fields = [], icon = "default") => 
  adminApi.put(`/entities/${id}`, { name, description, fields, icon }).then(r => r.data);
export const adminDeleteEntity = (id) => adminApi.delete(`/entities/${id}`);

// Broadcast
export const adminBroadcast = (subject, message, broadcast_type = "announcement") => 
  adminApi.post(`/broadcast?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}&broadcast_type=${broadcast_type}`).then(r => r.data);
export const adminGetBroadcastLogs = () => adminApi.get("/broadcasts").then(r => r.data);

// Audit
export const adminGetAuditLogs = () => adminApi.get("/audit-logs").then(r => r.data);

// Profile
export const adminGetProfile = () => adminApi.get("/profile").then(r => r.data);
export const adminUpdateProfile = (payload) => adminApi.put("/profile", payload).then(r => r.data);
export const adminGetProfileActivity = (limit = 20) => adminApi.get(`/profile/activity?limit=${limit}`).then(r => r.data);

// Moderation
export const adminGetPendingSuggestions = () => adminApi.get("/pending-suggestions").then(r => r.data);
export const adminApproveSuggestion = (id, approvedName) => 
  adminApi.post(`/approve-suggestion?feedback_id=${id}&approved_name=${encodeURIComponent(approvedName)}`).then(r => r.data);

// Labels
export const getSystemLabels = () => adminApi.get("/labels").then(r => r.data);
export const updateSystemLabel = (key, value) => adminApi.post(`/labels?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`).then(r => r.data);
export const updateSystemLabelsBulk = (payload) => adminApi.post("/labels/bulk", payload).then(r => r.data);

// Settings
export const getAdminSettings = () => adminApi.get("/settings").then(r => r.data);
export const updateAdminSetting = (key, value) => adminApi.patch(`/settings/${key}?value=${encodeURIComponent(value)}`).then(r => r.data);

// Form Fields
export const getFormFields = () => adminApi.get("/form-fields").then(r => r.data);
export const saveFormFields = (fields) => adminApi.post("/form-fields/save", fields).then(r => r.data);
