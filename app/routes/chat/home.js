const express = require('express');
const router = express.Router();
const folderView = __path_views;
const chatModel = require('./../../schemas/chats');
const userModel = require('./../../schemas/users');

router.get('/', async (req,res,next)=>{
    let chats = await chatModel.find({otherUser: ['home']}).exec();
    let user = await userModel.find({_id: req.user._id}).exec();
    res.render(`${folderView}/chat/home`, {layout: false, user: user[0], chats, page:['home']});
});

router.get('/deleteChat', async(req,res,next)=>{
    for(let id of await chatModel.find({}).exec()){
        await chatModel.deleteOne({_id: id._id});
    }       
    res.redirect('/chat');
});

router.get('/addFriends/:id', async (req,res,next)=>{
    await userModel.updateOne({name: req.user.name}, {$push: {sentTo: req.params.id}});
    await userModel.updateOne({name: req.params.id}, {$push: {sentFrom: req.user.name}});
    let newFriend = await userModel.find({name: req.params.id}).exec();
    let friendItem = {
        username: newFriend[0].name,
        avatar: newFriend[0].avatar
    }
    //await userModel.update({_id: req.user._id}, {$push: {friends: friendItem}});
    res.redirect('/chat');
});

router.get('/removeFriend/:id', async(req,res,next)=>{
    let newFriend = await userModel.find({name: req.params.id}).exec();
    let friendItem = {
        name: newFriend[0].name,
        avatar: newFriend[0].avatar
    }
    await userModel.update({_id: req.user._id}, {$pull: {friends: friendItem}});
    await userModel.update({_id: newFriend._id}, {$pull: {friends: {name: req.user.name, avatar: req.user.avatar}}})
    res.redirect('/chat');
});

router.get('/acceptFriends/:id', async(req,res,next)=>{
    await userModel.update({name: req.user.name}, {$pull: {sentFrom: req.params.id}});
    await userModel.update({name: req.params.id}, {$pull: {sentTo: req.user.name}});
    await userModel.update({name: req.params.id}, {$push: {friends: {name: req.user.name, avatar: req.user.avatar}}});
    let addFriends = await userModel.findOne({name: req.params.id}).exec();
    await userModel.update({name: req.user.name}, {$push: {friends: {name: addFriends.name, avatar: addFriends.avatar}}})
    res.redirect('/chat');
});

router.get('/denyFriends/:id', async(req,res,next)=>{
    await userModel.update({name: req.user.name}, {$pull: {sentFrom: req.params.id}});
    await userModel.update({name: req.params.id}, {$pull: {sentTo: req.user.name}});
    res.redirect('/chat');
});

router.get('/:id1/:id2', async(req,res,next)=>{
    let chats = await chatModel.find({otherUser: { $all: [req.params.id1, req.params.id2]}}).exec();
    res.render(`${folderView}/chat/home`, {layout: false, user:req.user, chats, page:['Bill Le','Aaron Zhang']});
});

module.exports = router;