const express = require('express');
const router = express.Router();

router.use('/', require('./users'));
router.use('/actions', require('./actions'));
router.use('/affiliations', require('./affiliations'));
router.use('/venues', require('./venues'));
router.use('/members', require('./members'));

module.exports = router;

