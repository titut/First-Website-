const mongoose = require('mongoose');
const databaseConfig = require(__path_configs + 'database');

var schema = new mongoose.Schema({}, {strict: false});

module.exports = mongoose.model("photos.chunks", schema);