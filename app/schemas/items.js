const mongoose = require('mongoose');
const databaseConfig = require(__path_configs + 'database');

var schema = new mongoose.Schema({ 
    name: String, 
    status: String,
    ordering: Number,
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

module.exports = mongoose.model(databaseConfig.col_items, schema );