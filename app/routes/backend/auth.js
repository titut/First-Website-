var express = require('express');
const { validationResult } = require('express-validator/check');
var router = express.Router();
const folderView	 = __path_views_admin + 'pages/auth';
const ValidateItems	= require(__path_validates + 'auth');
const systemConfig  = require(__path_configs + 'system');
var passport = require('passport')
const User	= require(__path_schemas + 'users');

router.get('/login', (req,res,next)=>{

    res.render(`${folderView}/index`, {layout: false, errors: null});

});

router.get('/logout', (req,res,next)=>{

    req.logout();
    res.redirect(`/${systemConfig.prefixAdmin}/auth/login`);

});

router.post('/login',
    passport.authenticate("local", {failureRedirect: `/${systemConfig.prefixAdmin}/auth/login`}),
    (req, res, next)=>{
        res.redirect('/chat');
    }
)

module.exports = router;