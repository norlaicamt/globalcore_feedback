/**
 * Ensures the provided data is an array.
 * If data is not an array (e.g. null, object, or string from a 404 HTML response),
 * it returns an empty array to prevent frontend runtime crashes.
 * 
 * @param {any} data - The data to validate.
 * @returns {Array} - The validated array or an empty array.
 */
export const safeArray = (data) => {
  if (data && Array.isArray(data)) return data;
  
  // Handle some common API wrappers if they exist
  if (data && typeof data === 'object' && Array.isArray(data.items)) {
    return data.items;
  }

  // Explicitly return a fresh empty array if it's anything else (null, object, etc.)
  return [];
};

/**
 * Ensures the provided data is an object.
 * @param {any} data 
 * @returns {Object}
 */
export const safeObject = (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  return {};
};
