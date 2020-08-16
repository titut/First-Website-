const express = require('express');
const router = express.Router();
const folderView = __path_views;
const chatModel = require('./../../schemas/chats');

router.get('/', async (req,res,next)=>{
    let chats = await chatModel.find({}).exec();
    res.render(`${folderView}/chat/home`, {layout: false, user:req.user, chats});

});

module.exports = router;