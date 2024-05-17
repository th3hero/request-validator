
# @th3hero/request-validator

The **@th3hero/request-validator** is a Node.js module for validating incoming HTTP requests, ensuring that the provided data meets specified rules and requirements.


## Author

- [@GitHub](https://github.com/th3hero)
- [@LinkedIn](https://www.linkedin.com/in/thealokkumarsingh/)
- [@Instagram](https://www.instagram.com/thealokkumarsingh/)


## Installation
You can install the @th3hero/request-validator package via npm. Open your terminal and run the following command:

```bash
  npm install @th3hero/request-validator
```

## Usage
**Importing the Validator**

To use the validator in your Node.js application, import it as follows:

```javascript
  const { validateInput } = require('@th3hero/request-validator');
```

**Defining Validation Rules**

Define validation rules as an object where the keys represent the fields to validate, and the values represent the validation rules. Here's an example:

```javascript
const rules = {
    username: 'required|min:3|max:15',
    email: 'required|email|unique:users,email',
    password: 'required|min:8',
    profile_picture: 'file|mimetype:image/jpeg,image/png'
};
```

**Performing Validation**

You can perform validation on incoming requests using the validateInput function. Here's how you can use it:

```javascript
app.post('/submit', async (req, res) => {
    const result = await validateInput(req, rules);
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }

    // Proceed with processing the request...
});
```
## Documentation
[Documentation](https://github.com/th3hero/request-validator)

**Rule Syntax**

The validation rules are defined using a simple syntax:

- `required`: Field must be present and not empty.
```javascript
username: 'required'
```
- `min:length`: Field must have a minimum `length` of length.
```javascript
username: 'min:3'
```
- `max:length`: Field must have a maximum `length` of length.
```javascript
username: 'max:3'
```
- `email`: Field must be a valid email address.
```javascript
email: 'email'
```
- `file`: Field must be a file upload.
```javascript
profile_picture: 'file'
```
- `file|important`: Field must be a file upload & `file` is required.
```javascript
profile_picture: 'file|important'
```
- `mimetype:types`: File mimetype must be one of the specified `types`.
```javascript
profile_picture: 'mimetype:image/jpeg,image/png'
```
-`unique:table,column`: Field must be unique in the specified database `table` and `column`.
```javascript
email: 'unique:users,email'
```
-`exists:table,column`: Field value must exist in the specified database `table` and `column`.
```javascript
user_id: 'exists:users,id'
```
-`not-empty`: Field cannot be empty.
```javascript
description: 'not-empty'
```
-`nullable`: Field can be null or undefined.
```javascript
middle_name: 'nullable'
```
-`digits:length`: Field must be a string with exactly `length` characters.
```javascript
postal_code: 'digits:6' //this will accept 6 characters only.
```
-`in:values`: Field must be one of the specified `values`.
```javascript
gender: 'in:male,female,other'
```
-`date:format`: Field must be a valid date with the specified `format`.
```javascript
birth_date: 'date:YYYY-MM-DD'
```
-`string`: Field must be a string.
```javascript
note: 'string'
```
-`integer`: Field must be a integer.
```javascript
age: 'integer'
```
-`boolean`: Field must be a boolean.
```javascript
active: 'boolean'
```

## Example
Here's a basic example of how you can use the validator in an Express.js application:

```javascript
const express = require('express');
const { validateInput } = require('@th3hero/request-validator');

const app = express();

const rules = {
    username: 'required|min:3|max:15',
    email: 'required|email|unique:users,email',
    password: 'required|min:8',
    gender: 'required|string|in:male,female,others',
    married: 'required_if:gender,male|in:0,1',
    profile_picture: 'file|important|mimetype:image/jpeg,image/png'
};

app.post('/submit', async (req, res) => {
    const result = await validateInput(req, rules);
    if (result.failed) {
        return res.status(400).json({ errors: result.errors });
    }

    // Proceed with processing the request...
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```

## Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to submit issues, pull requests, or suggestions.

## License
This project is licensed under the MIT License.