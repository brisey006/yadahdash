const express = require('express');
const router = express.Router();

const access = require('../../config/auth');
const enc = require('../../config/enc');
const slugify = require('../../functions/index').slugify;

const Member = require('../../models/member');
const Action = require('../../models/action');

router.route('/')
.get(async (req, res, next) => {
    try {
        const page = req.query.page != undefined ? req.query.page : 1;
        const limit = req.query.limit != undefined ? req.query.limit : 10;
        const query = req.query.query != undefined ? req.query.query : '';
        const sortBy = req.query.sort != undefined ? req.query.sort : 'createdAt';
        const order = req.query.order != undefined ? req.query.order : -1;
        
        const re = new RegExp(query, "gi");

        let members = await Member.paginate(
            {
                fullName: re
            },
            {
                limit,
                sort: { [sortBy]: order },
                page
            }
        );
        res.json(members);
    } catch(e) {
        next(e);
    }
})
.post(async (req, res, next) => {
    try {
        const { 
            firstName, lastName, bio, address, phoneNumber, gender, skill,
            dateOfBirth, country, partner, cellGroup, satellite, affiliation, idNumber
        } = req.body;
        
        const errors = [];

        if (!firstName) {
            errors.push('firstName');
        }
        if (!lastName) {
            errors.push('lastName');
        }

        if (!phoneNumber) {
            errors.push('phoneNumber');
        }

        if (!gender) {
            errors.push('gender');
        }

        if (!affiliation) {
            errors.push('affiliation');
        }

        if (errors.length == 0) {
            const fullName = `${firstName} ${lastName}`;
            const member = new Member({ 
                firstName, lastName, fullName, bio, address, phoneNumber, gender, skill,
                dateOfBirth, country, partner, cellGroup, satellite, affiliation, idNumber 
            });
            const result = await member.save();
            res.status(201).json(result);
        } else {
            const error = new Error(`Missing fields: ${JSON.stringify(errors)}`);
            error.status = 406;
            next(error);
        }
    } catch (e) {
        next(e);
    }
});

router.route('/:id')
.get(async (req, res, next) => {
    try {
        const member = await Member.findOne({ _id: req.params.id }).populate('leader');
        res.json(member);
    } catch (e) {
        next(e);
    }
})
.put(async (req, res, next) => {
    try {
        const memberBefore = await Member.findOne({ _id: req.params.id });
        const updatedStatus = await Member.updateOne({ _id: req.params.id }, { $set: req.body });
        if (updatedStatus.nModified == 1) {
            const member = await Member.findOne({ _id: req.params.id });
            const action = new Action({
                action: 'UPDATE', 
                affectedId: req.params.id,
                model: 'Member', 
                data: JSON.stringify(memberBefore),
                updated: JSON.stringify(member)
            });
            await action.save();
            res.json(member);
        } else {
            const error = new Error('Updating failed. Try again later');
            error.status = 500;
            next(error);
        }
    } catch (e) {
        next(e);
    }
})
.delete(access.verifyToken, async (req, res, next) => {
    try {
        const user = req.user;
        const member = await Member.findOne({ _id: req.params.id });
        const deletedStatus = await Member.deleteOne({ _id: req.params.id });
        if (deletedStatus.deletedCount == 1) {
            const action = new Action({ 
                user: user._id, 
                action: 'DELETE', 
                model: 'Member', 
                data: JSON.stringify(member)
            });
            await action.save();
            res.json(member);
        } else {
            const error = new Error('Deleting failed. Member not found in the system.');
            error.status = 500;
            next(error);
        }
    } catch (e) {
        next(e);
    }
});

router.get('/:id/update-history', async (req, res) => {
    try {
        const actions = await Action.find({ affectedId: req.params.id });
        res.json(actions);
    } catch (e) {
        next(e);
    }
});

module.exports = router;