require('dotenv').config();
const {createPool} = require('mysql');
const fs = require('fs');
const {validator} = require("sequelize/lib/utils/validator-extras");
const moment = require("moment");
const connection = createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'validator',
    connectionLimit: 10
});

/**
 * Validate the input provided by the user according to a set of validation rules.
 * @param req
 * @param {object} rules - An object containing the validation rules for each input field.
 * @returns {Promise<Array|null>} - An array of validation error messages, or null if there are no errors.
 */
const validateInput = async (req, rules) => {
    const body = req.body;
    let files = req.files;
    const errors = {};
    for (const [key, value] of Object.entries(rules)) {
        const input = body[key] ?? null;
        const rulesArr = value.split('|');
        for (let i = 0; i < rulesArr.length; i++) {
            const [rule, param] = rulesArr[i].split(':');
            if (errors[key]) {
                continue;
            }
            if (rulesArr.includes('nullable') && input === null) {
                continue;
            }
            if (rulesArr.join(', ').includes('required_if')) {
                if (rule === 'required_if') {
                    const values = param.split(',') ?? false;
                    if (values.length !== 2) {
                        errors[key] = `${key} is required if expects at least 2 parameters`;
                    }
                    if (body[values[0]] === values[1]) {
                        if (input === '' || input === null) {
                            errors[key] = `${key} is required when ${values[0]} is ${values[1]}`;
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    }
                } else {
                    if (input === '' || input === null) {
                        continue;
                    }
                }
            }
            switch (rule) {
                case 'required':
                    if (input === '' || input === null) {
                        errors[key] = `${key} is required`;
                    }
                    break;
                case 'not-empty':
                    if (input === '') errors[key] = `${key} can not be blank`;
                case 'nullable':
                    if (input === null || input === undefined) {
                        continue;
                    }
                    break;
                case 'min':
                    if (input?.length < parseInt(param)) {
                        errors[key] = `${key} must be at least ${param} characters long`;
                    }
                    break;
                case 'max':
                    if (input?.length > parseInt(param)) {
                        errors[key] = `${key} cannot be more than ${param} characters long`;
                    }
                    break;
                case 'digits':
                    if (input?.length !== parseInt(param)) {
                        errors[key] = `${key} should be exactly ${param} characters long`;
                    }
                    break;
                case 'file':
                    let medias = null;
                    if (files && files[key] !== undefined) {
                        medias = files[key];
                    }
                    for (rules of rulesArr) {
                        if (rulesArr.includes('important') && !medias) {
                            errors[key] = `${key} file is required`;
                        }
                        if (medias) {
                            const tear = rules.split(':')
                            const condition = tear[0];
                            if (condition === 'mimetype' && medias.length > 0) {
                                const allowed = tear[1].split(",");
                                for (const media of medias) {
                                    const fileMime = media.mimetype.split("/")[1];
                                    if (!allowed.includes(fileMime)) {
                                        errors[key] = `Invalid file format for ${key}. Supported media types are ${allowed.join(', ')}`;
                                    }
                                }
                            }
                        }
                    }
                    break;
                case 'unique':
                    const [table, column] = param.split(',');
                    let matchValue;
                    if (key !== 'phone') {
                        matchValue = input;
                    } else {
                        matchValue = `${body.phone_code}`+`${input}`;
                    }
                    const count = await new Promise((resolve, reject) => {
                        try {
                            connection.query(`SELECT COUNT(*) as count
                                          FROM ${table}
                                          WHERE ${column} = ?`, [matchValue], (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result[0].count);
                                }
                            });
                        } catch (e) {
                            console.log(`Something is wrong with mysql, check your db connection or credentials`);
                            console.log(e.message);
                            reject(e.message)
                        }
                    });
                    if (count > 0) {
                        errors[key] = `${key} already exists`;
                    }
                    break;
                case 'exists':
                    const [tab, col] = param.split(',');
                    const exist = await new Promise((clear, issue) => {
                        try {
                            connection.query(`SELECT COUNT(*) as count FROM ${tab} WHERE ${col} = ?`, [input], (error, result) => {
                                if (error) {
                                    issue(error);
                                } else {
                                    clear(result[0].count);
                                }
                            });
                        } catch (e) {
                            console.log(`Something is wrong with mysql, check your db connection or credentials`);
                            console.log(e.message);
                            issue(e.message)
                        }
                    });
                    if (exist === 0) {
                        errors[key] = `${key} must exist in database`;
                    }
                    break;
                case 'email':
                    if (input !== undefined && !validator.isEmail(input)) {
                        errors[key] = `Invalid email address for ${key}`;
                    }
                    break;
                case 'in':
                    const validValues = param.split(',');
                    if (!input || !validValues.includes(input)) {
                        errors[key] = `${key} must be one of the following values: ${validValues.join(', ')}`;
                    }
                    break;
                case 'date':
                    const dateFormat = param || 'YYYY-MM-DD';
                    if (input !== undefined && !moment(input, dateFormat, true).isValid()) {
                        errors[key] = `${key} must be a valid date with format ${dateFormat}`;
                    }
                    break;
                case 'string':
                    if (input !== null || input !== '' || input !== undefined) {
                        if (typeof input !== "string") {
                            errors[key] = `${key} must be a string`;
                        }
                    }
                    break;
                case 'integer':
                    if (input !== null || input !== '' || input !== undefined) {
                        if (typeof input !== "number") {
                            errors[key] = `${key} must be an integer`;
                        }
                    }
                    break;
                case 'boolean':
                    if (input !== null || input !== '' || input !== undefined) {
                        if (typeof input !== "boolean") {
                            errors[key] = `${key} must be a boolean`;
                        }
                    }
                    break;
                // Add more rules as needed
            }
        }
    }
    // Remove uploaded files if there is an error
    if (Object.keys(errors).length > 0) {
        if (files) {
            for (const key of Object.keys(files)) {
                const medias = files[key];
                medias.forEach(function (value) {
                    fs.unlink(value.path, function (err) {
                        console.error(err);
                    });
                })
            }
        }
        return {
            failed: true,
            errors: errors
        }
    } else {
        return {
            failed: false,
            errors: null
        }
    }
}

module.exports = {
    validateInput
}