const chatModel = require('./app/schemas/chats');
var users = [];

module.exports = function(io){
    
    io.on('connection', async (socket)=>{
        socket.emit('connected', socket.id);
        socket.on('user connected', (data)=>{
            users.push(data);
            io.emit('users online', users);
        })
        socket.on('chat', (data)=>{
            var bannedwords = ['fuck', 'shit', 'wtf'];
            var repeat = '*';
            let toAdd = data;
            for(let ban of bannedwords){
                console.log(ban);
                toAdd.content = toAdd.content.replace(ban, repeat.repeat(ban.length));
            }
            console.log(toAdd);
            toAdd.sent = new Date();
            chatModel.create(toAdd)
            io.emit('chat message', data);
        })
        socket.on('user typing', (data)=>{
            socket.broadcast.emit('user typing', data + " is typing...");
        })
        socket.on('disconnect', ()=>{
            let newArray = [];
            for(let index of users){
                if(index.socketID != socket.id){
                    newArray.push(index);
                }
            }
            users = newArray;
            io.emit('users online', users);
        });
    })
}