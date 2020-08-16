const chatModel = require('./app/schemas/chats');

module.exports = function(io){
    
    io.on('connection', (socket)=>{
        socket.on('chat', (data)=>{
            let toAdd = data;
            toAdd.sent = new Date();
            chatModel.create(toAdd)
            io.emit('chat message', data);
        })
    })

}