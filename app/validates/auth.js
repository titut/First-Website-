const util  = require('util');
const notify= require(__path_configs + 'notify');

const options = {
    name: { min: 5, max: 30 },
    ordering: { min: 0, max: 100 },
    status: { value: 'novalue' }
}

module.exports = {
    validator: (req) => {
        // NAME
        req.checkBody('username', 'Invalid Username Length').isLength({ min: 5, max: 18});
        req.checkBody('password', 'Invalid Password Length').isLength({ min: 5});
    }
}