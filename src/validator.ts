import {Pool} from 'mysql';
import fs from 'fs';
import {
    ValidationRules,
    ValidationResult,
    ExtendedRequest,
} from './types';
import { isEmail, isURL, isDate } from './utils/validators';

let dbPool: Pool | null = null;

export const setDatabase = (pool: Pool) => {
    dbPool = pool;
};

export const getDatabase = () => dbPool;

/**
 * Validate the input provided by the user according to a set of validation rules.
 * @param req - The Express request object
 * @param rules - An object containing the validation rules for each input field
 * @returns Promise<ValidationResult> - An object containing validation status and errors
 */
export const validateInput = async (req: ExtendedRequest, rules: ValidationRules): Promise<ValidationResult> => {
    const errors: Record<string, string> = {};
    const db = getDatabase();

    for (const [field, rule] of Object.entries(rules)) {
        const value = req.body[field];
        const ruleParts = Array.isArray(rule) ? rule : rule.split('|');
        for (const part of ruleParts) {
            const [ruleName, ...params] = part.split(':');
            switch (ruleName) {
                case 'file': {
                    if (!req.files || !req.files[field] || req.files[field].length === 0) {
                        errors[field] = `${field} is required`;
                    }
                    break;
                }
                case 'mimetype': {
                    if (req.files && req.files[field] && req.files[field].length > 0) {
                        const allowedMimetypes = params[0].split(',');
                        const files = Array.isArray(req.files[field]) ? req.files[field] : [req.files[field]];
                        for (const file of files) {
                            if (!allowedMimetypes.includes(file.mimetype)) {
                                errors[field] = `Invalid file format for ${field}. Supported media types are ${allowedMimetypes.join(', ')}`;
                                try {
                                    await new Promise<void>((resolve, reject) => {
                                        fs.unlink(file.path, (err: Error | null) => {
                                            if (err) reject(err);
                                            else resolve();
                                        });
                                    });
                                } catch (error) {
                                    // Ignore file cleanup errors
                                }
                                break;
                            }
                        }
                    }
                    break;
                }
                case 'required':
                    if (!value && value !== 0) {
                        errors[field] = `${field} is required`;
                    }
                    break;
                case 'not-empty':
                    if (value === '' || value === null || value === undefined) {
                        errors[field] = `${field} cannot be empty`;
                    }
                    break;
                case 'min':
                    if (value && value.length < parseInt(params[0])) {
                        errors[field] = `${field} must be at least ${params[0]} characters long`;
                    }
                    break;
                case 'max':
                    if (value && value.length > parseInt(params[0])) {
                        errors[field] = `${field} must not exceed ${params[0]} characters`;
                    }
                    break;
                case 'unique':
                    if (!db) {
                        throw new Error('Database connection not set. Please install mysql package and set up database connection using setDatabase()');
                    }
                    if (value) {
                        const [table, column] = params[0].split(',');
                        await new Promise((resolve, reject) => {
                            db.query(
                                `SELECT COUNT(*) as count FROM ${table} WHERE ${column} = ?`,
                                [value],
                                (err, results) => {
                                    if (err) reject(err);
                                    else if (results[0].count > 0) {
                                        errors[field] = `${field} already exists`;
                                    }
                                    resolve(null);
                                }
                            );
                        });
                    }
                    break;
                case 'exists':
                    if (!db) {
                        throw new Error('Database connection not set. Please install mysql package and set up database connection using setDatabase()');
                    }
                    if (value) {
                        const [table, column] = params[0].split(',');
                        await new Promise((resolve, reject) => {
                            db.query(
                                `SELECT COUNT(*) as count FROM ${table} WHERE ${column} = ?`,
                                [value],
                                (err, results) => {
                                    if (err) reject(err);
                                    else if (results[0].count === 0) {
                                        errors[field] = `${field} does not exist`;
                                    }
                                    resolve(null);
                                }
                            );
                        });
                    }
                    break;
                case 'email':
                    if (value && !isEmail(value)) {
                        errors[field] = `Invalid email address for ${field}`;
                    }
                    break;
                case 'date':
                    if (value && !isDate(value, params[0])) {
                        errors[field] = `${field} must be a valid date with format ${params[0] || 'YYYY-MM-DD'}`;
                    }
                    break;
                case 'in':
                    if (value && !params[0].split(',').includes(value)) {
                        errors[field] = `${field} must be one of the following values: ${params[0].split(',').join(', ')}`;
                    }
                    break;
                case 'nullable':
                    if (value === null || value === undefined) {
                        break;
                    }
                    break;
                case 'required_if': {
                    // params[0] = 'type,business'
                    if (!params[0] || params[0].split(',').length < 2) {
                        errors[field] = 'Invalid required_if rule format';
                        break;
                    }
                    const [conditionField, conditionValue] = params[0].split(',');
                    if (req.body[conditionField] === conditionValue && (!value || value === '')) {
                        errors[field] = `${field} is required when ${conditionField} is ${conditionValue}`;
                    }
                    break;
                }
                case 'string':
                    if (value !== null && value !== undefined && typeof value !== 'string') {
                        errors[field] = `${field} must be a string`;
                    }
                    break;
                case 'integer':
                    if (value !== null && value !== undefined && !Number.isInteger(Number(value))) {
                        errors[field] = `${field} must be an integer`;
                    }
                    break;
                case 'boolean':
                    if (value !== null && value !== undefined && typeof value !== 'boolean') {
                        errors[field] = `${field} must be a boolean`;
                    }
                    break;
                case 'regex':
                    if (value && params[0]) {
                        // Remove leading and trailing slashes if present
                        const pattern = params[0].replace(/^\/|\/$/g, '');
                        if (!new RegExp(pattern).test(value)) {
                            errors[field] = `${field} format is invalid`;
                        }
                    }
                    break;
                case 'url':
                    if (value && !isURL(value)) {
                        errors[field] = `${field} must be a valid URL`;
                    }
                    break;
                case 'alpha':
                    if (value && !/^[a-zA-Z]+$/.test(value)) {
                        errors[field] = `${field} must contain only letters`;
                    }
                    break;
                case 'alphanumeric':
                    if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
                        errors[field] = `${field} must contain only letters and numbers`;
                    }
                    break;
                case 'array':
                    if (value && !Array.isArray(value)) {
                        errors[field] = `${field} must be an array`;
                    }
                    break;
                case 'object':
                    if (value && (typeof value !== 'object' || Array.isArray(value))) {
                        errors[field] = `${field} must be an object`;
                    }
                    break;
                case 'phone':
                    if (value && !/^\+?[1-9]\d{1,14}$/.test(value)) {
                        errors[field] = `${field} must be a valid phone number`;
                    }
                    break;
                default:
                    if (req.customValidators && req.customValidators[ruleName]) {
                        const result = req.customValidators[ruleName](value, req);
                        if (result !== true) {
                            errors[field] = typeof result === 'string' ? result : `${field} validation failed`;
                        }
                    } else if (ruleName !== '') {
                        errors[field] = `Custom validator ${ruleName} not found`;
                    }
            }
            if (errors[field]) break;
        }
    }

    return {
        failed: Object.keys(errors).length > 0,
        errors: Object.keys(errors).length > 0 ? errors : null
    };
}; 