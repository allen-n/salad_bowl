var port = 3001;
var io = require('socket.io').listen(port);
console.log("Listening on allennikka.com:" + port + "/...");


var active_game_rooms = [];
var game_rooms_set = new Set(); //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

io.sockets.on('connection', function(socket) {
    console.log('New Connection from socket: ' + socket);
    // getting a unique identifier for the game room
    socket.on('get_room_id', function() {
        // console.log(generateUnique(game_rooms_set));
        var room_id = generateUnique(game_rooms_set);
        game_rooms_set.add(room_id);
        socket.emit('return_room_id', {
            room_id_s: room_id
        });
        console.log("Active Rooms: ");
        for (let item of game_rooms_set) console.log(item);
    });

    // remove a game room identifier
    socket.on('remove_room_id', function(data) {
        // console.log(generateUnique(game_rooms_set));
        var room_id = generateUnique(game_rooms_set);
        game_rooms_set.delete(data.room_id_c);
        console.log("Active Rooms: ");
        for (let item of game_rooms_set) console.log(item);
    });

    // add game paramaters to active_game_rooms[], begin card submit phase
    socket.on('goto_card_submit_master', function(data) {
        var game_room_settings = {
            master_name: data.master_name_c,
            num_teams: data.num_teams_c,
            num_players_team: data.num_players_team_c,
            turn_time_min: data.turn_time_min_c,
            turn_time_sec: data.turn_time_sec_c
        };
        var temp_room_id = data.active_room_c;
        var game_room_obj = {
            room_id: temp_room_id,
            room_settings: game_room_settings
        };
        active_game_rooms.push(game_room_obj);
        var active_room = getRoom(temp_room_id, active_game_rooms);
    });

    // master_name_c: master_name_c,
    //     num_teams_c: num_teams_c,
    //     num_players_team_c: num_players_team_c,
    //     turn_time_min_c: turn_time_min_c,
    //     turn_time_sec_c: turn_time_sec_c


    // // test code
    // socket.emit('news', {
    //     hello: 'world'
    // });
    // socket.on('my other event', function(data) {
    //     console.log(data);
    // });
});


var getRoom = function(room_id, arr) {
    var elementPos = arr.map(function(x) {
        return x.room_id;
    }).indexOf(room_id);
    return arr[elementPos];
}

// ID Generator courtesy of: https://www.fiznool.com/blog/2014/11/16/short-id-generation-in-javascript/
// var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var ALPHABET = '0123456789';
var ID_LENGTH = 8;
var UNIQUE_RETRIES = 9999;

var generate = function() {
    var rtn = '';
    for (var i = 0; i < ID_LENGTH; i++) {
        rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
}

var generateUnique = function(room_set) {
    // previous = previous || [];
    var retries = 0;
    var id;
    // Try to generate a unique ID,
    // i.e. one that isn't in the previous.
    while (!id && retries < UNIQUE_RETRIES) {
        id = generate();
        if (room_set.has(id)) {
            id = null;
            retries++;
        }
    }

    return id;
};