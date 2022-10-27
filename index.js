const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io')
const {generateMsg} = require('./utilities')
const{addUser,removeUser,getUser,getUsersInRoom} = require('./user-util')

const app = express();
const server  = http.createServer(app)
const io = socketIo(server)

const port = process.env.PORT || 8080
const publicDirPath = path.join(__dirname,'./public')

app.use(express.static(publicDirPath))

io.on('connection', socket =>{

    console.log('New websocket connection');
    socket.on('join',({ username, room }, callBack) => {
        const{error,user} = addUser({id:socket.id,username,room})
        if(error)return callBack(error)
        socket.join(user.room)
        socket.emit('message', generateMsg('Administrator','Welcome to the Chat App!'));
        socket.broadcast.to(user.room).emit('message', generateMsg('Administrator',`${user.username} has joined`));
        io.to(user.room).emit('dataRoom',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callBack();
    })

    socket.on('sendMessage',(message, callBack) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit('message',generateMsg(user.username,message))
        callBack()
    })

    socket.on('disconnect',message =>{
        const user  = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',generateMsg(`${user.username} has left`))
            io.to(user.room).emit('dataRoom',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }   
    })
})

server.listen(port,()=> console.log(`listening on port ${port}`));

