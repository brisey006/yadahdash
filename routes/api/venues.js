const express = require('express');
const router = express.Router();

const access = require('../../config/auth');
const enc = require('../../config/enc');
const slugify = require('../../functions/index').slugify;

const Venue = require('../../models/venue');
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

        let satellites = await Venue.paginate(
            {
                name: re,
            },
            {
                limit,
                sort: { [sortBy]: order },
                page
            }
        );
        res.json(satellites);
    } catch(e) {
        next(e);
    }
})
.post(access.superAdmin, async (req, res, next) => {
    try {
        const { name, address, city, country, leader, isSatellite, isCellGroup } = req.body;
        const user = req.user;
        const errors = [];
        if (!name) {
            errors.push('name');
        }
        if (!address) {
            errors.push('address');
        }

        if (!city) {
            errors.push('city');
        }

        if (!country) {
            errors.push('country');
        }

        if (errors.length == 0) {
            const satellite = new Venue({ name, address, city, createdBy: user._id, country, leader, isSatellite, isCellGroup });
            const action = new Action({ user: user._id, action: 'CREATE', model: 'Venue', data: JSON.stringify(satellite) });
            const result = await satellite.save();
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

router.route('/satellites')
.get(async (req, res, next) => {
    try {
        const page = req.query.page != undefined ? req.query.page : 1;
        const limit = req.query.limit != undefined ? req.query.limit : 10;
        const query = req.query.query != undefined ? req.query.query : '';
        const sortBy = req.query.sort != undefined ? req.query.sort : 'createdAt';
        const order = req.query.order != undefined ? req.query.order : -1;
        
        const re = new RegExp(query, "gi");

        let satellites = await Venue.paginate(
            {
                name: re,
                isSatellite: true
            },
            {
                limit,
                sort: { [sortBy]: order },
                page
            }
        );
        res.json(satellites);
    } catch(e) {
        next(e);
    }
})
.post(access.superAdmin, async (req, res, next) => {
    try {
        const { name, address, city, country, leader } = req.body;
        const user = req.user;
        const errors = [];
        if (!name) {
            errors.push('name');
        }
        if (!address) {
            errors.push('address');
        }

        if (!city) {
            errors.push('city');
        }

        if (!country) {
            errors.push('country');
        }

        if (errors.length == 0) {
            const satellite = new Venue({ name, address, city, createdBy: user._id, country, leader, isSatellite: true });
            const action = new Action({ user: user._id, action: 'CREATE', model: 'Venue', data: JSON.stringify(satellite) });
            const result = await satellite.save();
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

router.route('/cellgroups')
.get(async (req, res, next) => {
    try {
        const page = req.query.page != undefined ? req.query.page : 1;
        const limit = req.query.limit != undefined ? req.query.limit : 10;
        const query = req.query.query != undefined ? req.query.query : '';
        const sortBy = req.query.sort != undefined ? req.query.sort : 'createdAt';
        const order = req.query.order != undefined ? req.query.order : -1;
        
        const re = new RegExp(query, "gi");

        let satellites = await Venue.paginate(
            {
                name: re,
                isCellGroup: true
            },
            {
                limit,
                sort: { [sortBy]: order },
                page
            }
        );
        res.json(satellites);
    } catch(e) {
        next(e);
    }
})
.post(access.superAdmin, async (req, res, next) => {
    try {
        const { name, address, city, country, leader } = req.body;
        const user = req.user;
        const errors = [];
        if (!name) {
            errors.push('name');
        }
        if (!address) {
            errors.push('address');
        }

        if (!city) {
            errors.push('city');
        }

        if (!country) {
            errors.push('country');
        }

        if (errors.length == 0) {
            const satellite = new Venue({ name, address, city, createdBy: user._id, country, leader, isCellGroup: true });
            const action = new Action({ user: user._id, action: 'CREATE', model: 'Venue', data: JSON.stringify(satellite) });
            const result = await satellite.save();
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
        const satellite = await Venue.findOne({ _id: req.params.id })
        .populate({ path: 'leader', model: Member });
        res.json(satellite);
    } catch (e) {
        next(e);
    }
})
.put(access.superAdmin, async (req, res, next) => {
    try {
        const user = req.user;
        const satelliteBefore = await Venue.findOne({ _id: req.params.id });
        const updatedStatus = await Venue.updateOne({ _id: req.params.id }, { $set: req.body });
        if (updatedStatus.nModified == 1) {
            const satellite = await Venue.findOne({ _id: req.params.id });
            const action = new Action({ 
                user: user._id, 
                action: 'UPDATE', 
                model: 'Venue', 
                data: JSON.stringify(satelliteBefore),
                updated: JSON.stringify(satellite)
            });
            await action.save();
            res.json(satellite);
        } else {
            const error = new Error('Updating failed. Try again later');
            error.status = 500;
            next(error);
        }
    } catch (e) {
        next(e);
    }
})
.delete(access.superAdmin, async (req, res, next) => {
    try {
        const user = req.user;
        const satellite = await Venue.findOne({ _id: req.params.id });
        const deletedStatus = await Venue.deleteOne({ _id: req.params.id });
        if (deletedStatus.deletedCount == 1) {
            const action = new Action({ 
                user: user._id, 
                action: 'DELETE', 
                model: 'Venue', 
                data: JSON.stringify(satellite)
            });
            await action.save();
            res.json(satellite);
        } else {
            const error = new Error('Deleting failed. Venue not found in the system.');
            error.status = 500;
            next(error);
        }
    } catch (e) {
        next(e);
    }
});

module.exports = router;