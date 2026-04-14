const PREFIX = {
  USER: "user.",
  ADMIN: "admin.",
};

export const STORAGE_KEYS = {
  USER_CURRENT: `${PREFIX.USER}current`,
  USER_VIEW: `${PREFIX.USER}view`,
  ADMIN_CURRENT: `${PREFIX.ADMIN}current`,
  ADMIN_VIEW: `${PREFIX.ADMIN}view`,
  ADMIN_DARK_MODE: `${PREFIX.ADMIN}darkMode`,
  ADMIN_LANGUAGE: `${PREFIX.ADMIN}language`,
  ADMIN_DEFAULT_VIEW: `${PREFIX.ADMIN}defaultView`,
};

export const getNamespacedStorage = (namespace) => {
  const prefix = PREFIX[namespace.toUpperCase()] || "";
  return {
    getItem: (key) => localStorage.getItem(`${prefix}${key}`),
    setItem: (key, value) => localStorage.setItem(`${prefix}${key}`, value),
    removeItem: (key) => localStorage.removeItem(`${prefix}${key}`),
    clear: () => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => localStorage.removeItem(k));
    },
  };
};

export const userStorage = getNamespacedStorage("USER");
export const adminStorage = getNamespacedStorage("ADMIN");

export const storage = {
  get: (key) => {
    const val = localStorage.getItem(key);
    try {
      return val ? JSON.parse(val) : null;
    } catch {
      return val;
    }
  },
  set: (key, value) => {
    const val = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, val);
  },
  remove: (key) => localStorage.removeItem(key),
};
