/**
 * Custom validation utilities to replace Sequelize's validator
 */

/**
 * Validates if a string is a valid email address
 * @param value - The string to validate
 * @returns boolean - True if valid email, false otherwise
 */
export const isEmail = (value: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
};

/**
 * Validates if a string is a valid URL
 * @param value - The string to validate
 * @returns boolean - True if valid URL, false otherwise
 */
export const isURL = (value: string): boolean => {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
};

/**
 * Validates if a string is a valid date
 * @param value - The string to validate
 * @param format - Optional date format (default: YYYY-MM-DD)
 * @returns boolean - True if valid date, false otherwise
 */
export const isDate = (value: string, format: string = 'YYYY-MM-DD'): boolean => {
    // Basic date validation for YYYY-MM-DD format
    if (format === 'YYYY-MM-DD') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) return false;
        
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        return date.getFullYear() === year &&
               date.getMonth() === month - 1 &&
               date.getDate() === day;
    }
    
    // For other formats, we can add more validation logic
    return !isNaN(Date.parse(value));
}; 