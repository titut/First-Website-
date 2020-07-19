const mongoose = require('mongoose');
const databaseConfig = require(__path_configs + 'database');

var schema = new mongoose.Schema({ 
    name: String, 
    status: String,
    avatar: String,
    group: {
        id: String,
        name: String
    },
    created: {
        user_id: Number,
        username: String,
        time: Date
    },
    modified: {
        user_id: Number,
        username: String,
        time: Date
    }
});

module.exports = mongoose.model(databaseConfig.col_users, schema);