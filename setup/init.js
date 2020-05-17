const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const slugify = require('../functions/index').slugify;
const enc = require('../config/enc');

const User = require('../models/user');

router.route('/user')
.get((req, res) => {
    User.countDocuments().then(num => {
        res.json({ userCount: num });
    }).catch(err => {
        console.log(err);
    });
})
.post(async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const fullName = `${firstName} ${lastName}`;
        const user = new User({ firstName, lastName, email, fullName, password, userType: 'Super User' });

        const num = await User.countDocuments();
        if (num => 0) {
            bcrypt.genSalt(10, (err, salt) => bcrypt.hash(user.password, salt, async (err, hash) => {
                if (err) next(err);
                user.password = hash;
                
                try {
                    const data = await user.save();
                    res.send(data);
                } catch (e) {
                    next(e);
                }
            }));
        }
    } catch (e) {
        next(e);
    }
});

router.get('/enc/:key', (req, res) => {
    res.send(enc.decrypt(req.params.key));
});

module.exports = router;
