var express = require('express');
var router = express.Router();

router.use('/', require('./home'));
router.use('/dashboard', require('./dashboard'));
router.use('/items', require('./items'));
router.use('/group', require('./group'));
router.use('/users', require('./users'));
router.use('/category', require('./category'));

module.exports = router;
