import { userStorage, adminStorage } from "./storage";

/**
 * Completely logs out the standard user by clearing all keys in the user namespace.
 * This does NOT affect the admin session.
 */
export const logoutUser = () => {
  // 1. Clear namespaced storage
  userStorage.clear();

  // 2. Aggressively clear legacy keys to prevent re-migration on reload
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
  localStorage.removeItem("userView");

  window.location.href = "/";
};

/**
 * Completely logs out the admin by clearing all keys in the admin namespace.
 * This does NOT affect the standard user session.
 */
export const logoutAdmin = () => {
  // 1. Clear namespaced storage
  adminStorage.clear();

  // 2. Aggressively clear legacy keys
  localStorage.removeItem("adminUser");
  localStorage.removeItem("adminView");

  window.location.href = "/admin";
};
