const express = require('express');
const router = express.Router();

router.use('/', (req,res,next)=>{
    if(req.isAuthenticated()){
        next();
    } else {
        res.redirect('/adminBillLe/auth/login')
    }
} ,require('./home'));

module.exports = router;