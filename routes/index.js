const express = require('express');
const router = express.Router();

/** API REQUESTS */
router.use(require('./register'));
router.use(require('./login'));
router.use('/api', require('./api/'));

module.exports = router;