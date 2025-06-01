# @th3hero/request-validator

A powerful and flexible request validation library for Node.js applications, built with TypeScript. This library provides a comprehensive set of validation rules and supports both synchronous and asynchronous validation.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Validation Rules](#validation-rules)
- [Database Integration](#database-integration)
- [File Upload Validation](#file-upload-validation)
- [Custom Validation Rules](#custom-validation-rules)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [Testing](#testing)
- [License](#license)

## Features

- 🚀 **Simple Function-Based API**: Easy to use with a clean, intuitive interface
- 📦 **Zero Dependencies**: Lightweight and fast
- 🔍 **Comprehensive Validation Rules**: Over 20 built-in validation rules
- 🎯 **Database Integration**: Built-in support for unique/exists validations
- 📁 **File Upload Validation**: Support for file uploads with MIME type checking
- 🧪 **Extensive Test Coverage**: Thoroughly tested with Jest
- ⚡️ **High Performance**: Optimized for speed and efficiency
- 🔒 **Secure by Default**: Built-in security features
- 📝 **TypeScript Support**: Full TypeScript support with type definitions
- 🔄 **Async Validation**: Support for asynchronous validation rules
- 🎨 **Customizable**: Easy to extend with custom validation rules

## Installation

```bash
# Using npm
npm install @th3hero/request-validator

# Using yarn
yarn add @th3hero/request-validator

# Using pnpm
pnpm add @th3hero/request-validator
```

## Quick Start

### Basic Usage

```typescript
import { validateInput } from '@th3hero/request-validator';
import { Request } from 'express';

// Define validation rules
const rules = {
    username: 'required|min:3|max:15',
    email: 'required|email|unique:users,email',
    password: 'required|min:8',
    age: 'integer|min:18',
    status: 'in:active,inactive,pending'
};

// Validate request
app.post('/users', async (req: Request, res) => {
    const result = await validateInput(req, rules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process valid request...
});
```

### With File Upload

```typescript
const rules = {
    username: 'required|min:3',
    avatar: 'file|mimetype:image/jpeg,image/png',
    documents: 'file|mimetype:application/pdf'
};

app.post('/upload', async (req: Request, res) => {
    const result = await validateInput(req, rules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process valid file upload...
});
```

## Validation Rules

### Basic Rules

| Rule | Description | Example | Error Message |
|------|-------------|---------|---------------|
| `required` | Field must be present and not empty | `username: 'required'` | "username is required" |
| `nullable` | Field can be null or undefined | `middle_name: 'nullable'` | - |
| `not-empty` | Field cannot be empty | `description: 'not-empty'` | "description cannot be empty" |

### String Rules

| Rule | Description | Example | Error Message |
|------|-------------|---------|---------------|
| `min:length` | Minimum string length | `username: 'min:3'` | "username must be at least 3 characters long" |
| `max:length` | Maximum string length | `username: 'max:15'` | "username must not exceed 15 characters" |
| `string` | Must be a string | `note: 'string'` | "note must be a string" |
| `alpha` | Must contain only letters | `name: 'alpha'` | "name must contain only letters" |
| `alphanumeric` | Must contain only letters and numbers | `username: 'alphanumeric'` | "username must contain only letters and numbers" |
| `regex:/pattern/` | Must match the regular expression | `username: 'regex:/^[a-z0-9-]+$/'` | "username format is invalid" |

### Type Rules

| Rule | Description | Example | Error Message |
|------|-------------|---------|---------------|
| `email` | Valid email address | `email: 'email'` | "Invalid email address for email" |
| `integer` | Must be an integer | `age: 'integer'` | "age must be an integer" |
| `boolean` | Must be a boolean | `active: 'boolean'` | "active must be a boolean" |
| `date:format` | Valid date with format | `birth_date: 'date:YYYY-MM-DD'` | "birth_date must be a valid date with format YYYY-MM-DD" |
| `url` | Must be a valid URL | `website: 'url'` | "website must be a valid URL" |
| `array` | Must be an array | `tags: 'array'` | "tags must be an array" |
| `object` | Must be an object | `settings: 'object'` | "settings must be an object" |

### File Rules

| Rule | Description | Example | Error Message |
|------|-------------|---------|---------------|
| `file` | Must be a file upload | `profile_picture: 'file'` | "profile_picture is required" |
| `mimetype:types` | Valid MIME types | `avatar: 'mimetype:image/jpeg,image/png'` | "Invalid file format for avatar. Supported media types are image/jpeg, image/png" |

### Database Rules

| Rule | Description | Example | Error Message |
|------|-------------|---------|---------------|
| `unique:table,column` | Must be unique in database | `email: 'unique:users,email'` | "email already exists" |
| `exists:table,column` | Must exist in database | `user_id: 'exists:users,id'` | "user_id does not exist" |

### Enum Rules

| Rule | Description | Example | Error Message |
|------|-------------|---------|---------------|
| `in:values` | Must be one of the values | `status: 'in:active,inactive,pending'` | "status must be one of the following values: active, inactive, pending" |

### Conditional Rules

| Rule | Description | Example | Error Message |
|------|-------------|---------|---------------|
| `required_if:field,value` | Required if field equals value | `spouse_name: 'required_if:marital_status,married'` | "spouse_name is required when marital_status is married" |

## Database Integration

### Setup

```typescript
import { setDatabase } from '@th3hero/request-validator';
import { createPool } from 'mysql';

// Create database connection
const pool = createPool({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'database'
});

// Set database connection
setDatabase(pool);
```

### Usage with Database Rules

```typescript
const rules = {
    email: 'required|email|unique:users,email',
    user_id: 'required|exists:users,id',
    role_id: 'required|exists:roles,id'
};

app.post('/users', async (req: Request, res) => {
    const result = await validateInput(req, rules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process valid request...
});
```

## File Upload Validation

### Basic File Upload

```typescript
const rules = {
    avatar: 'file|mimetype:image/jpeg,image/png'
};

app.post('/upload', async (req: Request, res) => {
    const result = await validateInput(req, rules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process valid file upload...
});
```

### Multiple Files

```typescript
const rules = {
    documents: 'file|mimetype:application/pdf'
};

app.post('/upload-documents', async (req: Request, res) => {
    const result = await validateInput(req, rules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process valid file uploads...
});
```

## Custom Validation Rules

### Define Custom Validator

```typescript
const customValidators = {
    isFortyTwo: (value: any) => value === 42 || 'Value must be 42',
    isAdult: (value: any) => {
        const age = parseInt(value);
        return age >= 18 || 'Must be at least 18 years old';
    }
};

const req = {
    body: { value: 42, age: 20 },
    customValidators
};
```

### Use Custom Validator

```typescript
const rules = {
    value: 'isFortyTwo',
    age: 'isAdult'
};

app.post('/validate', async (req: Request, res) => {
    const result = await validateInput(req, rules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process valid request...
});
```

## Error Handling

### Basic Error Handling

```typescript
const result = await validateInput(req, rules);

if (result.failed) {
    return res.status(400).json({ errors: result.errors });
}
```

### Custom Error Handling

```typescript
try {
    const result = await validateInput(req, rules);
    
    if (result.failed) {
        // Log validation errors
        console.error('Validation failed:', result.errors);
        
        // Return custom error response
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.errors
        });
    }
    
    // Process valid request...
} catch (error) {
    // Handle unexpected errors
    console.error('Validation error:', error);
    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
}
```

## TypeScript Support

### Type Definitions

```typescript
import { Request } from 'express';
import { ValidationRules, ValidationResult } from '@th3hero/request-validator';

interface UserRequest extends Request {
    body: {
        username: string;
        email: string;
        password: string;
    };
    files?: {
        avatar?: Express.Multer.File[];
    };
}

const rules: ValidationRules = {
    username: 'required|min:3',
    email: 'required|email',
    password: 'required|min:8',
    avatar: 'file|mimetype:image/jpeg,image/png'
};

app.post('/users', async (req: UserRequest, res) => {
    const result: ValidationResult = await validateInput(req, rules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process valid request...
});
```

## Best Practices

1. **Always Validate Input**
   ```typescript
   // Good
   app.post('/users', async (req, res) => {
       const result = await validateInput(req, rules);
       if (result.failed) return res.status(400).json({ errors: result.errors });
       // Process request...
   });

   // Bad
   app.post('/users', async (req, res) => {
       // Process request without validation...
   });
   ```

2. **Use Specific Rules**
   ```typescript
   // Good
   const rules = {
       email: 'required|email|unique:users,email',
       password: 'required|min:8|max:20'
   };

   // Bad
   const rules = {
       email: 'required',
       password: 'required'
   };
   ```

3. **Handle File Uploads Properly**
   ```typescript
   // Good
   const rules = {
       avatar: 'file|mimetype:image/jpeg,image/png'
   };

   // Bad
   const rules = {
       avatar: 'file'
   };
   ```

4. **Use Custom Validators for Complex Rules**
   ```typescript
   // Good
   const customValidators = {
       isAdult: (value) => parseInt(value) >= 18 || 'Must be at least 18 years old'
   };

   // Bad
   const rules = {
       age: 'integer|min:18' // Less flexible
   };
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

- [@GitHub](https://github.com/th3hero)
- [@LinkedIn](https://www.linkedin.com/in/thealokkumarsingh/)
- [@Instagram](https://www.instagram.com/thealokkumarsingh/)