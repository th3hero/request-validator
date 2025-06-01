import {Request} from 'express';
import {Pool} from 'mysql';

export interface ValidationRules {
    [key: string]: string | string[];
}

export interface ValidationError {
    [key: string]: string;
}

export interface ValidationResult {
    failed: boolean;
    errors: ValidationError | null;
}

export interface ExtendedRequest extends Request {
    body: Record<string, any>;
    files?: Record<string, any>;
    customValidators?: Record<string, CustomValidator>;
}

export type CustomValidator = (value: any, req: ExtendedRequest) => boolean | string;

let dbPool: Pool | null = null;

export const setDatabase = (pool: Pool) => {
    dbPool = pool;
};

export const getDatabase = () => dbPool; 