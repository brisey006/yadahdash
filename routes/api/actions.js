const express = require('express');
const router = express.Router();

const access = require('../../config/auth');
const Action = require('../../models/action');

router.route('/')
.get(access.superAdmin,async (req, res, next) => {
    try {
        const page = req.query.page != undefined ? req.query.page : 1;
        const limit = req.query.limit != undefined ? req.query.limit : 10;
        const query = req.query.query != undefined ? req.query.query : '';
        const sortBy = req.query.sort != undefined ? req.query.sort : 'createdAt';
        const order = req.query.order != undefined ? req.query.order : -1;
        
        const re = new RegExp(query, "gi");

        let actions = await Action.paginate(
            {
                data: re,
                user: req.user._id
            },
            {
                limit,
                sort: { [sortBy]: order },
                page
            }
        );
        res.json(actions);
    } catch(e) {
        next(e);
    }
});

router.route('/:id')
.get(async (req, res, next) => {
    try {
        const action = await Action.findOne({ _id: req.params.id });
        res.json(action);
    } catch (e) {
        next(e);
    }
});

module.exports = router;