// var server = require('http').createServer();
// var io = require('socket.io')(server);

// io.sockets.on('connection', function (socket) {
//     console.log('socket connected');

//     socket.on('disconnect', function () {
//         console.log('socket disconnected');
//     });

//     socket.emit('text', 'wow. such event. very real time.');
// });

// server.listen(3001);
var port = 3001;
var io = require('socket.io').listen(port);
console.log("Listening on allennikka.com:" + port + "/");

io.sockets.on('connection', function (socket) {
console.log('New Connection!');
socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});