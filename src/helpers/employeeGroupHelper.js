// Helper to manage employee groups (For-Thread employee -> RC process employees)
const STORAGE_KEY = 'employee_groups';

/**
 * Save employee group: For-Thread employee -> RC process employees (single, fatlock, kansai)
 * @param {string} forThreadEmployeeId - The For-Thread employee ID
 * @param {object} rcEmployees - Object with single, fatlock, kansai employee IDs
 */
export const saveEmployeeGroup = (forThreadEmployeeId, rcEmployees) => {
  if (!forThreadEmployeeId || !rcEmployees) return;
  
  try {
    const groups = getEmployeeGroups();
    groups[forThreadEmployeeId] = {
      single: rcEmployees.single || null,
      fatlock: rcEmployees.fatlock || null,
      kansai: rcEmployees.kansai || null,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error('Error saving employee group:', error);
  }
};

/**
 * Get employee group for a For-Thread employee
 * @param {string} forThreadEmployeeId - The For-Thread employee ID
 * @returns {object|null} - Object with single, fatlock, kansai or null
 */
export const getEmployeeGroup = (forThreadEmployeeId) => {
  if (!forThreadEmployeeId) return null;
  
  try {
    const groups = getEmployeeGroups();
    return groups[forThreadEmployeeId] || null;
  } catch (error) {
    console.error('Error getting employee group:', error);
    return null;
  }
};

/**
 * Get all employee groups
 * @returns {object} - All saved groups
 */
export const getEmployeeGroups = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error getting employee groups:', error);
    return {};
  }
};

/**
 * Update employee group (when RC process is updated)
 * @param {string} forThreadEmployeeId - The For-Thread employee ID
 * @param {object} rcEmployees - Updated RC employees
 */
export const updateEmployeeGroup = (forThreadEmployeeId, rcEmployees) => {
  if (!forThreadEmployeeId || !rcEmployees) return;
  
  try {
    const groups = getEmployeeGroups();
    if (groups[forThreadEmployeeId]) {
      groups[forThreadEmployeeId] = {
        ...groups[forThreadEmployeeId],
        single: rcEmployees.single !== undefined ? rcEmployees.single : groups[forThreadEmployeeId].single,
        fatlock: rcEmployees.fatlock !== undefined ? rcEmployees.fatlock : groups[forThreadEmployeeId].fatlock,
        kansai: rcEmployees.kansai !== undefined ? rcEmployees.kansai : groups[forThreadEmployeeId].kansai,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    }
  } catch (error) {
    console.error('Error updating employee group:', error);
  }
};

/**
 * Clear all employee groups (optional utility)
 */
export const clearEmployeeGroups = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing employee groups:', error);
  }
};
