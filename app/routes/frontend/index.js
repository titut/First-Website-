var express = require('express');
var router = express.Router();

router.use('/', require('./home'));
router.use('/category', require('./category'));
router.use('/search', require('./search'));
router.use('/post', require('./page'));


module.exports = router;
