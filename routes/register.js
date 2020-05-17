const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const router = express.Router();

const roles = require('../config/auth').roles;
const enc = require('../config/enc');

const User = require('../models/user');

router.post('/register', async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, confirmation } = req.body;
        const errors = [];

        if (!firstName) {
            errors.push('First name is required');
        }

        if (!lastName) {
            errors.push('Last name is required');
        }

        if (!email) {
            errors.push('Email is required');
        } else {
            if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))){
                errors.push('Email is invalid');
            }
        }

        if (!password) {
            errors.push('Password is required');
        } else {
            if (password.length < 6) {
                errors.push('Password must be 6 or more characters');
            }
        }

        if (!confirmation) {
            errors.push('Password confirmation is required');
        } else {
            if (confirmation !== password) {
                errors.push('Passwords not matching');
            }
        }

        if (errors.length == 0) {
            const fullName = `${firstName} ${lastName}`;
            const hashId = enc.encrypt(password);
            const num = await User.countDocuments();
            let role;
            if (num == 0) {
                role = roles.SUPER;
            } else {
                role = roles.BASIC;
            }
            const user = new User({ 
                firstName,
                lastName,
                fullName,
                email,
                role,
                password,
                hashId,
            });
        
            bcrypt.genSalt(10, (err, salt) => bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) throw err;
                user.password = hash;
                
                user.save().then(() => {
                    res.json(user);
                }).catch(err => {
                    if (err.code == 11000) {
                        const errors = [{ general: 'Email already in use' }];
                        res.json({ errors });
                    }
                })
            }));
        } else {
            const error = new Error(JSON.stringify(errors));
            error.status = 406;
            next(error);
        }
    } catch (e) {
        next(e);
    }
});

module.exports = router;