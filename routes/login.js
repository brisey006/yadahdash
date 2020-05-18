const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require('../models/user');

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if(!user) {
            const error = new Error('User not found');
            error.status = 404;
            return next(error);
        }
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return next(err);
            }

            if (isMatch) {
                jwt.sign(
                    {
                        id: user._id,
                        role: user.role,
                        lastLogin: Date.now
                    }, process.env.JWT_KEY,
                    (err, token) => {
                        if (err) {
                            next(err);
                        } else {
                            delete user._doc.password;
                            res.json({ token, ...user._doc });
                        }
                    }
                );
            } else {
                const error = new Error('Email or password incorrect');
                error.status = 403;
                next(error);
            }
        });
    } catch (e) {
        next(e);
    }
});

module.exports = router;