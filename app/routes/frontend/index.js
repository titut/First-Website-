var express = require('express');
var router = express.Router();

router.use('/', require('./home'));
router.use('/category', require('./category'));


module.exports = router;
