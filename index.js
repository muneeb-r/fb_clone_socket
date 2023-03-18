const app = require('express')();
const http = require('http').Server(app);

const io = require("socket.io")(http, {
    cors: {
        // origin: "http://localhost:3000"
        origin: "https://eledoc.netlify.app"
    }
})

let users = [];

app.get('/', function(req, res) {
    res.status(200).json({status: 'socket server is running...'});
 });

const addUser = (userId, socketId) => {
    userId && !users.some(user => user.userId === userId) &&
        users.push({
            userId: userId,
            socketId: socketId
        })
}

const removeUser = (socketId) => {
    users = users.filter(user => user.socketId !== socketId)
}

const getUser = (receiverId) => {
    return users.find(user => user.userId === receiverId?user: false)
}

io.on("connection", (socket) => {

    socket.on("addUser", (userId) => {
        addUser(userId, socket.id)
        io.emit("getUsers", users)
        // console.log(users)
    })

    socket.on("sendMessage", ({ sender, receiverId, text }) => {
        const user = getUser(receiverId)
        if(user){
            socket.to(user.socketId).emit("getMessage", {
                sender,
                receiverId,
                text
            })
        }
    })

    socket.on('typing', ({userId})=>{
        const user = getUser(userId)
        if(user){
            socket.to(user.socketId).emit('getTyping', true)
        }
    })

    socket.on('likeUpdate', (data)=>{
        socket.broadcast.emit('getLike', data)
    })

    socket.on('newPost', ({post, toUsers})=>{
        toUsers.forEach(userId => {
            const user = getUser(userId)
            if(user){
                socket.to(user.socketId).emit('getPost', post)
            }
        });
    })

    socket.on("disconnect", () => {
        removeUser(socket.id)
        io.emit("getUsers", users)
        console.log(users)
    })
})

http.listen(process.env.PORT || 8901, function() {
    console.log('listening on *:8901');
 });

module.exports = app