const chatModel = require('./app/schemas/chats');
var users = [];

function compareArray(array1, array2){
    for(let item of array2){
        if(!array1.includes(item)){
            return false;
        }
    }
    return true;
}
function removeFromArray(item, array){
    var newArray = [];
    for(let index of array){
        if(index != item){
            newArray.push(index);
        }
    }
    return newArray;
}

module.exports = function(io){
    
    io.on('connection', async (socket)=>{
        socket.emit('connected', socket.id);
        socket.on('user connected', (data)=>{
            users.push(data);
            io.emit('users online', users);
        })
        socket.on('chat', async(data)=>{
            var bannedwords = ['fuck', 'shit', 'wtf'];
            var repeat = '*';
            let toAdd = data;
            for(let ban of bannedwords){
                toAdd.content = toAdd.content.replace(ban, repeat.repeat(ban.length));
            }
            toAdd.seenBy = [];
            for(let user of users){
                if(compareArray(user.page,toAdd.otherUser)){
                    toAdd.seenBy.push(user.username);
                }
            }
            toAdd.seenBy = removeFromArray(toAdd.username, toAdd.seenBy);
            toAdd.sent = new Date();
            console.log(toAdd);
            let latest = await chatModel.findOne().sort({sent: 'desc'}).exec();
            if(latest != null){
                console.log(latest.content);
                await chatModel.updateOne({_id: latest._id}, {seenBy: []});
            }
            chatModel.create(toAdd);
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
        socket.on('deny/accept', (data)=>{
            for(let index in users){
                if(users[index].username == data.userSent){
                    users[index].sentTo = removeFromArray(data.userReceived ,users[index].sentTo)
                }
            }
        })
    })
}