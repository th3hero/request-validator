import { validateInput, setDatabase } from '../validator';
import fs from 'fs';
import { CustomValidator } from '../types';

// Define MockRequest type inline
export type MockRequest = {
    body: Record<string, any>;
    files?: Record<string, any[]>;
    customValidators?: Record<string, (value: any) => boolean | string>;
    [key: string]: any;
};

jest.mock('fs', () => ({
    unlink: jest.fn((path, callback) => callback(null))
}));

describe('RequestValidator', () => {
    let mockPool: any;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        setDatabase(mockPool);
        jest.clearAllMocks();
    });

    describe('validateInput', () => {
        it('should validate required fields', async () => {
            const req: MockRequest = {
                body: {},
                files: {}
            };

            const rules = {
                name: 'required'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('name', 'name is required');
        });

        it('should validate email format', async () => {
            const req: MockRequest = {
                body: {
                    email: 'invalid-email'
                },
                files: {}
            };

            const rules = {
                email: 'email'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('email', 'Invalid email address for email');
        });

        it('should validate min length', async () => {
            const req: MockRequest = {
                body: {
                    password: '123'
                },
                files: {}
            };

            const rules = {
                password: 'min:8'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('password', 'password must be at least 8 characters long');
        });

        it('should validate unique constraint', async () => {
            mockPool.query.mockImplementation((query: string, values: any[], callback: Function) => {
                callback(null, [{ count: 1 }]);
            });

            const req: MockRequest = {
                body: {
                    email: 'test@example.com'
                },
                files: {}
            };

            const rules = {
                email: 'unique:users,email'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('email', 'email already exists');
        });

        it('should validate file uploads', async () => {
            const req: MockRequest = {
                body: {},
                files: {
                    avatar: [{
                        fieldname: 'avatar',
                        originalname: 'test.jpg',
                        encoding: '7bit',
                        mimetype: 'image/jpeg',
                        destination: '/tmp',
                        filename: 'test.jpg',
                        path: '/tmp/test.jpg',
                        size: 1234
                    }]
                }
            };

            const rules = {
                avatar: 'file|mimetype:image/jpeg,image/png'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should validate file uploads with invalid mimetype', async () => {
            const req: MockRequest = {
                body: {},
                files: {
                    avatar: [{
                        fieldname: 'avatar',
                        originalname: 'test.pdf',
                        encoding: '7bit',
                        mimetype: 'application/pdf',
                        destination: '/tmp',
                        filename: 'test.pdf',
                        path: '/tmp/test.pdf',
                        size: 1234
                    }]
                }
            };

            const rules = {
                avatar: 'file|mimetype:image/jpeg,image/png'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('avatar', 'Invalid file format for avatar. Supported media types are image/jpeg, image/png');
        });

        it('should validate date format', async () => {
            const req: MockRequest = {
                body: {
                    birthdate: '2023-13-45'
                },
                files: {}
            };

            const rules = {
                birthdate: 'date:YYYY-MM-DD'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('birthdate', 'birthdate must be a valid date with format YYYY-MM-DD');
        });

        it('should validate enum values', async () => {
            const req: MockRequest = {
                body: {
                    status: 'invalid'
                },
                files: {}
            };

            const rules = {
                status: 'in:active,inactive,pending'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('status', 'status must be one of the following values: active, inactive, pending');
        });

        it('should handle nullable fields', async () => {
            const req: MockRequest = {
                body: {
                    middleName: null
                },
                files: {}
            };

            const rules = {
                middleName: 'nullable|string'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should validate required_if condition', async () => {
            const req: MockRequest = {
                body: {
                    type: 'business',
                    business_name: ''
                },
                files: {}
            };

            const rules = {
                business_name: 'required_if:type,business'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('business_name', 'business_name is required when type is business');
        });

        it('should handle database errors gracefully', async () => {
            mockPool.query.mockImplementation((query: string, values: any[], callback: Function) => {
                callback(new Error('Database error'));
            });

            const req: MockRequest = {
                body: {
                    email: 'test@example.com'
                },
                files: {}
            };

            const rules = {
                email: 'unique:users,email'
            };

            await expect(validateInput(req as any, rules)).rejects.toThrow('Database error');
        });

        it('should validate phone number with country code', async () => {
            mockPool.query.mockImplementation((query: string, values: any[], callback: Function) => {
                callback(null, [{ count: 1 }]);
            });

            const req: MockRequest = {
                body: {
                    phone_code: '+1',
                    phone: '1234567890'
                },
                files: {}
            };

            const rules = {
                phone: 'phone'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should validate string type', async () => {
            const req: MockRequest = {
                body: {
                    name: 123
                },
                files: {}
            };

            const rules = {
                name: 'string'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('name', 'name must be a string');
        });

        it('should validate integer type', async () => {
            const req: MockRequest = {
                body: {
                    age: 'not-a-number'
                },
                files: {}
            };

            const rules = {
                age: 'integer'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('age', 'age must be an integer');
        });

        it('should validate boolean type', async () => {
            const req: MockRequest = {
                body: {
                    is_active: 'not-a-boolean'
                },
                files: {}
            };

            const rules = {
                is_active: 'boolean'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('is_active', 'is_active must be a boolean');
        });

        it('should validate regex pattern', async () => {
            const req: MockRequest = {
                body: {
                    username: 'valid-username'
                },
                files: {}
            };

            const rules = {
                username: 'regex:/^[a-z0-9-]+$/'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should fail regex pattern', async () => {
            const req: MockRequest = {
                body: {
                    username: 'invalid username'
                },
                files: {}
            };

            const rules = {
                username: 'regex:/^[a-z0-9-]+$/'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('username', 'username format is invalid');
        });

        it('should validate url', async () => {
            const req: MockRequest = {
                body: {
                    website: 'https://example.com'
                },
                files: {}
            };

            const rules = {
                website: 'url'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should fail url', async () => {
            const req: MockRequest = {
                body: {
                    website: 'not-a-url'
                },
                files: {}
            };

            const rules = {
                website: 'url'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('website', 'website must be a valid URL');
        });

        it('should validate alpha', async () => {
            const req: MockRequest = {
                body: {
                    name: 'John123'
                },
                files: {}
            };

            const rules = {
                name: 'alpha'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('name', 'name must contain only letters');
        });

        it('should fail alpha', async () => {
            const req: MockRequest = {
                body: {
                    name: 'John123'
                },
                files: {}
            };

            const rules = {
                name: 'alpha'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('name', 'name must contain only letters');
        });

        it('should validate alphanumeric', async () => {
            const req: MockRequest = {
                body: {
                    username: 'John123'
                },
                files: {}
            };

            const rules = {
                username: 'alphanumeric'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should fail alphanumeric', async () => {
            const req: MockRequest = {
                body: {
                    username: 'John@123'
                },
                files: {}
            };

            const rules = {
                username: 'alphanumeric'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('username', 'username must contain only letters and numbers');
        });

        it('should validate array', async () => {
            const req: MockRequest = {
                body: {
                    tags: ['tag1', 'tag2']
                },
                files: {}
            };

            const rules = {
                tags: 'array'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should fail array', async () => {
            const req: MockRequest = {
                body: {
                    tags: 'not-an-array'
                },
                files: {}
            };

            const rules = {
                tags: 'array'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('tags', 'tags must be an array');
        });

        it('should validate object', async () => {
            const req: MockRequest = {
                body: {
                    settings: { theme: 'dark' }
                },
                files: {}
            };

            const rules = {
                settings: 'object'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should fail object', async () => {
            const req: MockRequest = {
                body: {
                    settings: 'not-an-object'
                },
                files: {}
            };

            const rules = {
                settings: 'object'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('settings', 'settings must be an object');
        });

        it('should validate custom function (on req)', async () => {
            const req: MockRequest = {
                body: {
                    value: 42
                },
                files: {},
                customValidators: {
                    isFortyTwo: (value: any) => value === 42 || 'Value must be 42'
                }
            };

            const rules = {
                value: 'isFortyTwo'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should fail custom function (on req)', async () => {
            const req: MockRequest = {
                body: {
                    value: 43
                },
                files: {},
                customValidators: {
                    isFortyTwo: (value: any) => value === 42 || 'Value must be 42'
                }
            };

            const rules = {
                value: 'isFortyTwo'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('value', 'Value must be 42');
        });

        it('should handle missing custom validator function', async () => {
            const req: MockRequest = {
                body: {
                    value: 42
                },
                files: {}
            };

            const rules = {
                value: 'customValidator'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('value', 'Custom validator customValidator not found');
        });

        it('should handle global custom validator function', async () => {
            const req: MockRequest = {
                body: {
                    value: 42
                },
                files: {}
            };

            const rules = {
                value: 'isFortyTwo'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('value', 'Custom validator isFortyTwo not found');
        });

        it('should handle file validation with missing files', async () => {
            const req: MockRequest = {
                body: {},
                files: {}
            };

            const rules = {
                avatar: 'file'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('avatar', 'avatar is required');
        });

        it('should handle file validation with empty files array', async () => {
            const req: MockRequest = {
                body: {},
                files: {
                    avatar: []
                }
            };

            const rules = {
                avatar: 'file'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('avatar', 'avatar is required');
        });

        it('should handle database error in unique validation', async () => {
            mockPool.query.mockImplementation((query: string, values: any[], callback: Function) => {
                callback(new Error('Database error'));
            });

            const req: MockRequest = {
                body: {
                    email: 'test@example.com'
                },
                files: {}
            };

            const rules = {
                email: 'unique:users,email'
            };

            await expect(validateInput(req as any, rules)).rejects.toThrow('Database error');
        });

        it('should handle database error in exists validation', async () => {
            mockPool.query.mockImplementation((query: string, values: any[], callback: Function) => {
                callback(new Error('Database error'));
            });

            const req: MockRequest = {
                body: {
                    user_id: 1
                },
                files: {}
            };

            const rules = {
                user_id: 'exists:users,id'
            };

            await expect(validateInput(req as any, rules)).rejects.toThrow('Database error');
        });

        it('should handle required_if with invalid parameters', async () => {
            const req: MockRequest = {
                body: {
                    type: 'business'
                },
                files: {}
            };

            const rules = {
                business_name: 'required_if:type'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('business_name', 'Invalid required_if rule format');
        });

        it('should handle nullable with undefined input', async () => {
            const req: MockRequest = {
                body: {
                    middleName: undefined
                },
                files: {}
            };

            const rules = {
                middleName: 'nullable|string'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should handle file cleanup on validation error', async () => {
            const req: MockRequest = {
                body: {},
                files: {
                    avatar: [{
                        fieldname: 'avatar',
                        originalname: 'test.pdf',
                        encoding: '7bit',
                        mimetype: 'application/pdf',
                        destination: '/tmp',
                        filename: 'test.pdf',
                        path: '/tmp/test.pdf',
                        size: 1234
                    }]
                }
            };

            const rules = {
                avatar: 'file|mimetype:image/jpeg,image/png'
            };

            await validateInput(req as any, rules);
            expect((fs.unlink as unknown as jest.Mock)).toHaveBeenCalledWith('/tmp/test.pdf', expect.any(Function));
        });

        it('should handle file cleanup error gracefully', async () => {
            const req: MockRequest = {
                body: {},
                files: {
                    avatar: [{
                        fieldname: 'avatar',
                        originalname: 'test.pdf',
                        encoding: '7bit',
                        mimetype: 'application/pdf',
                        destination: '/tmp',
                        filename: 'test.pdf',
                        path: '/tmp/test.pdf',
                        size: 1234
                    }]
                }
            };

            const rules = {
                avatar: 'file|mimetype:image/jpeg,image/png'
            };

            (fs.unlink as jest.Mock).mockImplementation((path, callback) => callback(new Error('Cleanup error')));

            await expect(validateInput(req as any, rules)).resolves.not.toThrow();
        });

        it('should handle multiple validation rules for the same field', async () => {
            const req: MockRequest = {
                body: {
                    password: '123'
                },
                files: {}
            };

            const rules = {
                password: 'required|min:8|max:20'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('password', 'password must be at least 8 characters long');
        });

        it('should handle required_if with multiple conditions', async () => {
            const req: MockRequest = {
                body: {
                    type: 'business',
                    status: 'active',
                    business_name: ''
                },
                files: {}
            };

            const rules = {
                business_name: 'required_if:type,business|required_if:status,active'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('business_name', 'business_name is required when type is business');
        });

        it('should handle nullable with multiple rules', async () => {
            const req: MockRequest = {
                body: {
                    middleName: null
                },
                files: {}
            };

            const rules = {
                middleName: 'nullable|string|min:2'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should handle custom validator returning string error', async () => {
            const req: MockRequest = {
                body: {
                    value: 43
                },
                files: {},
                customValidators: {
                    isFortyTwo: (value: any) => value === 42 || 'Value must be 42'
                }
            };

            const rules = {
                value: 'isFortyTwo'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('value', 'Value must be 42');
        });

        it('should handle custom validator returning boolean false', async () => {
            const req: MockRequest = {
                body: {
                    value: 43
                },
                files: {},
                customValidators: {
                    isFortyTwo: (value: any) => value === 42
                }
            };

            const rules = {
                value: 'isFortyTwo'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('value', 'value validation failed');
        });

        it('should handle file validation with multiple files', async () => {
            const req: MockRequest = {
                body: {},
                files: {
                    documents: [
                        {
                            fieldname: 'documents',
                            originalname: 'doc1.pdf',
                            encoding: '7bit',
                            mimetype: 'application/pdf',
                            destination: '/tmp',
                            filename: 'doc1.pdf',
                            path: '/tmp/doc1.pdf',
                            size: 1234
                        },
                        {
                            fieldname: 'documents',
                            originalname: 'doc2.pdf',
                            encoding: '7bit',
                            mimetype: 'application/pdf',
                            destination: '/tmp',
                            filename: 'doc2.pdf',
                            path: '/tmp/doc2.pdf',
                            size: 1234
                        }
                    ]
                }
            };

            const rules = {
                documents: 'file|mimetype:application/pdf'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(false);
            expect(result.errors).toBeNull();
        });

        it('should handle file validation with mixed mimetypes', async () => {
            const req: MockRequest = {
                body: {},
                files: {
                    documents: [
                        {
                            fieldname: 'documents',
                            originalname: 'doc1.pdf',
                            encoding: '7bit',
                            mimetype: 'application/pdf',
                            destination: '/tmp',
                            filename: 'doc1.pdf',
                            path: '/tmp/doc1.pdf',
                            size: 1234
                        },
                        {
                            fieldname: 'documents',
                            originalname: 'image.jpg',
                            encoding: '7bit',
                            mimetype: 'image/jpeg',
                            destination: '/tmp',
                            filename: 'image.jpg',
                            path: '/tmp/image.jpg',
                            size: 1234
                        }
                    ]
                }
            };

            const rules = {
                documents: 'file|mimetype:application/pdf'
            };

            const result = await validateInput(req as any, rules);
            expect(result.failed).toBe(true);
            expect(result.errors).toHaveProperty('documents', 'Invalid file format for documents. Supported media types are application/pdf');
        });
    });
}); 