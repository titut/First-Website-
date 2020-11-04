const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    username: String,
    avatar: String,
    content: String,
    sent: Date,
    otherUser: Array,
    seenBy: Array
})

module.exports = mongoose.model('chats', schema);