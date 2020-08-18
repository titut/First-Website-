const express = require('express');
const router = express.Router();
const folderView = __path_views;
const chatModel = require('./../../schemas/chats');

router.get('/', async (req,res,next)=>{
    let chats = await chatModel.find({}).exec();
    res.render(`${folderView}/chat/home`, {layout: false, user:req.user, chats});

});

router.get('/deleteChat', async(req,res,next)=>{
    for(let id of await chatModel.find({}).exec()){
        await chatModel.deleteOne({_id: id._id});
    }       
    res.redirect('/chat');
})

module.exports = router;