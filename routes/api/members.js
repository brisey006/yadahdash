const express = require('express');
const router = express.Router();

const enc = require('../../config/enc');
const slugify = require('../../functions/index').slugify;

const Member = require('../../models/member');
const Action = require('../../models/action');

const verifyToken = require('../../config/auth').verifyToken;
const { superUser, administrator, basicUser } = require('../../config/permissions');

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
.post(verifyToken, basicUser,async (req, res, next) => {
    try {
        const { 
            partner,
            cellGroup,
            satellite,
            affiliation
        } = req.body;
        const user = req.user._id;
        
        const errors = [];

        if (!affiliation) {
            errors.push('affiliation');
        }

        if (errors.length == 0) {
            const member = new Member({
                user,
                partner,
                cellGroup,
                satellite,
                affiliation
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
.delete(verifyToken, async (req, res, next) => {
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