const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require('../models/user');

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    User.findOne({ email: email })
    .then(user => {
        if(!user) {
            const error = new Error('User not found');
            error.status = 404;
            next(error);
        } else {
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    next(err);
                }
      
                if (isMatch) {
                  jwt.sign(
                    {
                      id: user._id,
                      lastLogin: Date.now
                    },
                    process.env.JWT_KEY,
                    (err, token) => {
                      if (err) {
                          next(err);
                      } else {
                          res.json({ token });
                      }
                    }
                  );
                } else {
                    const error = new Error('Email or password incorrect');
                    error.status = 403;
                    next(error);
                }
            });
        }
    })
    .catch(err => next(err));
});

module.exports = router;