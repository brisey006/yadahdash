const express = require('express');
const router = express.Router();

router.get('/routes', (req, res) => {
    res.json(req.app._router.stack);
});

router.use('/users', require('./users'));
router.use('/actions', require('./actions'));
router.use('/affiliations', require('./affiliations'));
router.use('/venues', require('./venues'));
router.use('/members', require('./members'));



module.exports = router;

