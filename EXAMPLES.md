# @th3hero/request-validator Examples

## 🚀 Real-World Usage Examples

### E-commerce API Validation

```typescript
import { validateInput } from '@th3hero/request-validator';
import { Request } from 'express';

// Product creation validation
const productRules = {
    name: 'required|min:3|max:100',
    price: 'required|numeric|min:0',
    category: 'required|in:electronics,clothing,books,home',
    description: 'max:500',
    images: 'file|mimetype:image/jpeg,image/png|max:5',
    sku: 'required|unique:products,sku',
    stock: 'integer|min:0'
};

app.post('/products', async (req: Request, res) => {
    const result = await validateInput(req, productRules);
    
    if (result.failed) {
        return res.status(400).json({ 
            success: false, 
            errors: result.errors 
        });
    }
    
    // Create product...
    res.status(201).json({ success: true, product: newProduct });
});
```

### User Registration with Custom Validators

```typescript
const customValidators = {
    isStrongPassword: (value: string) => {
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            return 'Password must contain uppercase, lowercase, number, and special character';
        }
        return true;
    },
    
    isAdult: (value: string) => {
        const age = parseInt(value);
        const today = new Date();
        const birthDate = new Date(value);
        const ageDiff = today.getFullYear() - birthDate.getFullYear();
        
        return ageDiff >= 18 || 'Must be at least 18 years old';
    }
};

const registrationRules = {
    username: 'required|min:3|max:20|unique:users,username',
    email: 'required|email|unique:users,email',
    password: 'required|min:8|isStrongPassword',
    confirmPassword: 'required|same:password',
    birthDate: 'required|date|isAdult',
    terms: 'required|accepted'
};

app.post('/register', async (req: Request, res) => {
    const result = await validateInput(req, {
        ...registrationRules,
        customValidators
    });
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Create user account...
});
```

### File Upload with Multiple Types

```typescript
const uploadRules = {
    profilePicture: 'file|mimetype:image/jpeg,image/png|max:2',
    documents: 'file|mimetype:application/pdf,application/msword|max:10',
    video: 'file|mimetype:video/mp4,video/avi|max:50'
};

app.post('/upload', async (req: Request, res) => {
    const result = await validateInput(req, uploadRules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process uploads...
    const files = result.data;
    // files.profilePicture, files.documents, files.video
});
```

### API Rate Limiting with Validation

```typescript
const apiKeyRules = {
    'x-api-key': 'required|exists:api_keys,key',
    'x-user-id': 'required|exists:users,id'
};

app.use('/api/*', async (req: Request, res, next) => {
    const result = await validateInput(req, apiKeyRules);
    
    if (result.failed) {
        return res.status(401).json({ 
            error: 'Invalid API credentials',
            details: result.errors 
        });
    }
    
    // Add user info to request
    req.user = result.data;
    next();
});
```

### Form Validation with Conditional Rules

```typescript
const surveyRules = {
    name: 'required|min:2',
    email: 'required|email',
    age: 'required|integer|min:13',
    occupation: 'required|in:student,employed,unemployed,retired',
    salary: 'required_if:occupation,employed|numeric|min:0',
    education: 'required_if:occupation,student|in:high_school,college,university',
    interests: 'array|min:1|max:5'
};

app.post('/survey', async (req: Request, res) => {
    const result = await validateInput(req, surveyRules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Process survey...
});
```

### Database-Driven Validation

```typescript
// Set up database connection
import { setDatabase } from '@th3hero/request-validator';
import mysql from 'mysql';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

setDatabase(pool);

// Validation with database checks
const orderRules = {
    productId: 'required|exists:products,id',
    userId: 'required|exists:users,id',
    quantity: 'required|integer|min:1',
    shippingAddress: 'required|min:10'
};

app.post('/orders', async (req: Request, res) => {
    const result = await validateInput(req, orderRules);
    
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }
    
    // Create order...
});
```

## 🎯 Best Practices Demonstrated

1. **Specific Validation Rules**: Use detailed rules instead of generic ones
2. **Custom Validators**: For complex business logic
3. **Database Integration**: For data integrity
4. **File Upload Security**: Proper MIME type validation
5. **Error Handling**: Consistent error responses
6. **Conditional Validation**: Based on other field values

## 📚 More Examples

<!-- Link to Express.js Integration Examples removed -->
<!-- Link to Next.js API Routes removed -->
<!-- Link to Fastify Plugin Examples removed -->
<!-- Link to Testing Examples removed -->