const path = require ('path');
const http = require ('http');
const express = require('express');
const socketIO = require ('socket.io');
const {Users} = require('./utils/users');

const publicPath = path.join(__dirname , '../public');
const port = process.env.PORT || 3000;

var app = express();
var server = http.createServer( app );
var io = socketIO(server);
var users = new Users();

app.use ( express.static(publicPath)  );

io.on('connection' , (socket) => {

    console.log('New User Connected');

    socket.on('create or join' , (room) => {

        var clientsInRoom = users.getUserList(room);
        var numOfClients = clientsInRoom.length;

        if ( numOfClients == 0  ){

            socket.join(room);
            console.log('Client ID ' + socket.id + ' created room ' + room );
            users.addUser(socket.id , 'User 1' , room);
            socket.emit('created', room, socket.id);

        }
        else if (numOfClients == 1){

            io.sockets.in(room).emit('join', room);
            socket.join(room);
            console.log('Client ID ' + socket.id + ' joined room ' + room );
            users.addUser(socket.id , 'User 2' , room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');

        }
        else{
            socket.emit('full', room)
        }

    });

    socket.on('message', function(message) {

//        log('Client said: ', message);
        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message);

    });

    socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

    socket.on('bye', function(){
        console.log('received bye');
        users.removeUser(socket.id);
    });

    socket.on('disconnect' , function(){
        console.log('User Disconnected');
        users.removeUser(socket.id);
    });

})

server.listen(port,() => {
   console.log(`Server is up at ${port}`)
});
