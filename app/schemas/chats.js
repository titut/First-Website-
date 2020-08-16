const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    username: String,
    avatar: String,
    content: String,
    sent: Date
})

module.exports = mongoose.model('chats', schema);