const mongoose = require('mongoose');
const { text } = require('express');
const databaseConfig = require(__path_configs + 'database');

var schema = new mongoose.Schema({ 
    name: String, 
    status: String,
    ordering: Number,
    picture: String,
    content: String,
    created: {
        user_id: Number,
        username: String,
        time: Date
    },
    modified: {
        user_id: Number,
        username: String,
        time: Date
    },
    category: {
        id: String,
        name: String
    }
});

module.exports = mongoose.model(databaseConfig.col_items, schema);