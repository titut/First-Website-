var express = require('express');
var router = express.Router();

router.use('/auth', require('./auth'));
router.use('/', (req,res,next)=>{
    if(req.isAuthenticated()){
        if(req.user.group.name == "Bill's Friend Group"){
            next();
        } else {
            res.redirect("/");
        }
    } else {
        res.redirect('/adminBillLe/auth/login')
    }
},require('./home'));
router.use('/dashboard', require('./dashboard'));
router.use('/items', require('./items'));
router.use('/group', require('./group'));
router.use('/users', require('./users'));
router.use('/category', require('./category'));

module.exports = router;
