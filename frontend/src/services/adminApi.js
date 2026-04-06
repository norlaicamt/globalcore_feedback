import axios from "axios";

// Base URL for your FastAPI backend
const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;
const BASE = `${API_BASE}/admin`;

const adminApi = axios.create({ baseURL: BASE });


// Auth
export const adminLogin = (email, password) =>
  adminApi.post(`/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`).then(r => r.data);

// Analytics (Modified to include dept_name)
export const getAnalyticsSnapshot = (dept_name = "") => adminApi.get(`/analytics/snapshot${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsSummary = (dept_name = "") => adminApi.get(`/analytics/summary${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsVolume = (days = 30, dept_name = "") => adminApi.get(`/analytics/volume?days=${days}${dept_name ? `&dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsByCategory = (dept_name = "") => adminApi.get(`/analytics/by-category${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsByDepartment = () => adminApi.get("/analytics/by-department").then(r => r.data);
export const getAnalyticsByStatus = (dept_name = "") => adminApi.get(`/analytics/by-status${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsRatings = (dept_name = "") => adminApi.get(`/analytics/ratings${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getTopUsers = (limit = 10) => adminApi.get(`/analytics/top-users?limit=${limit}`).then(r => r.data);
export const getAnalyticsEngagement = (days = 30) => adminApi.get(`/analytics/engagement?days=${days}`).then(r => r.data);
export const getAnalyticsByLocation = (dept_name = "") => adminApi.get(`/analytics/by-location${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);
export const getAnalyticsSentiment = (dept_name = "") => adminApi.get(`/analytics/sentiment${dept_name ? `?dept_name=${encodeURIComponent(dept_name)}` : ""}`).then(r => r.data);

// Users
// Users
export const adminGetUsers = () => adminApi.get("/users").then(r => r.data);
export const adminToggleUserStatus = (id, isActive) => adminApi.put(`/users/${id}/status?is_active=${isActive}`).then(r => r.data);
export const adminUpdateUserRole = (id, role) => adminApi.put(`/users/${id}/role?role=${encodeURIComponent(role)}`).then(r => r.data);
export const adminDeleteUser = (id) => adminApi.delete(`/users/${id}`);

// Feedbacks
export const adminGetFeedbacks = (params = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.category_id) q.set("category_id", params.category_id);
  if (params.dept_name) q.set("dept_name", params.dept_name);
  q.set("skip", params.skip || 0);
  q.set("limit", params.limit || 50);
  return adminApi.get(`/feedbacks?${q.toString()}`).then(r => r.data);
};
export const adminUpdateFeedbackStatus = (id, status) => adminApi.put(`/feedbacks/${id}/status?status=${status}`).then(r => r.data);
export const adminDeleteFeedback = (id) => adminApi.delete(`/feedbacks/${id}`);

// Departments
export const adminGetDepartments = () => adminApi.get("/departments").then(r => r.data);
export const adminCreateDepartment = (name) => adminApi.post(`/departments?name=${encodeURIComponent(name)}`).then(r => r.data);
export const adminUpdateDepartment = (id, name) => adminApi.put(`/departments/${id}?name=${encodeURIComponent(name)}`).then(r => r.data);
export const adminDeleteDepartment = (id) => adminApi.delete(`/departments/${id}`);

// Categories
export const adminGetCategories = () => adminApi.get("/categories").then(r => r.data);
export const adminCreateCategory = (name, description = "", fields = [], icon = "default") => 
  adminApi.post("/categories", { name, description, fields, icon }).then(r => r.data);
export const adminUpdateCategory = (id, name, description = "", fields = [], icon = "default") => 
  adminApi.put(`/categories/${id}`, { name, description, fields, icon }).then(r => r.data);
export const adminDeleteCategory = (id) => adminApi.delete(`/categories/${id}`);

// Broadcast
export const adminBroadcast = (subject, message) => 
  adminApi.post(`/broadcast?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`).then(r => r.data);
export const adminGetBroadcastLogs = () => adminApi.get("/broadcasts").then(r => r.data);

// Moderation
export const adminGetPendingSuggestions = () => adminApi.get("/pending-suggestions").then(r => r.data);
export const adminApproveSuggestion = (id, approvedName) => 
  adminApi.post(`/approve-suggestion?feedback_id=${id}&approved_name=${encodeURIComponent(approvedName)}`).then(r => r.data);
