const express = require('express');
const router = express.Router();

const enc = require('../../config/enc');
const slugify = require('../../functions/index').slugify;
const verifyToken = require('../../config/auth').verifyToken;

const Affiliation = require('../../models/affiliation');
const Action = require('../../models/action');

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

        let affiliations = await Affiliation.paginate(
            {
                name: re
            },
            {
                limit,
                sort: { [sortBy]: order },
                page
            }
        );
        res.json(affiliations);
    } catch(e) {
        next(e);
    }
})
.post(verifyToken, administrator, async (req, res, next) => {
    try {
        const { name, acronym } = req.body;
        const user = req.user;
        const errors = [];
        if (!name) {
            errors.push('name');
        }
        if (!acronym) {
            errors.push('acronym');
        }

        if (errors.length == 0) {
            const affiliation = new Affiliation({ name, acronym, createdBy: user.id });
            const action = new Action({ user: user._id, action: 'CREATE', model: 'Affiliation', data: JSON.stringify(affiliation) });
            const result = await affiliation.save();
            await action.save();
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
        const affiliation = await Affiliation.findOne({ _id: req.params.id });
        res.json(affiliation);
    } catch (e) {
        next(e);
    }
})
.put(verifyToken, administrator, async (req, res, next) => {
    try {
        const user = req.user;
        const affiliationBefore = await Affiliation.findOne({ _id: req.params.id });
        const updatedStatus = await Affiliation.updateOne({ _id: req.params.id }, { $set: req.body });
        if (updatedStatus.nModified == 1) {
            const affiliation = await Affiliation.findOne({ _id: req.params.id });
            const action = new Action({ 
                user: user._id, 
                action: 'UPDATE', 
                model: 'Affiliation', 
                data: JSON.stringify(affiliationBefore),
                updated: JSON.stringify(affiliation)
            });
            await action.save();
            res.json(affiliation);
        } else {
            const error = new Error('Updating failed. Try again later');
            error.status = 500;
            next(error);
        }
    } catch (e) {
        next(e);
    }
})
.delete(verifyToken, administrator, async (req, res, next) => {
    try {
        const user = req.user;
        const affiliation = await Affiliation.findOne({ _id: req.params.id });
        const deletedStatus = await Affiliation.deleteOne({ _id: req.params.id });
        if (deletedStatus.deletedCount == 1) {
            const action = new Action({ 
                user: user._id, 
                action: 'DELETE', 
                model: 'Affiliation', 
                data: JSON.stringify(affiliation)
            });
            await action.save();
            res.json(affiliation);
        } else {
            const error = new Error('Deleting failed. Affiliation not found in the system.');
            error.status = 500;
            next(error);
        }
    } catch (e) {
        next(e);
    }
});

module.exports = router;