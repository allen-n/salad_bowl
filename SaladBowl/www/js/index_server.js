var port = 3001;
var io = require('socket.io').listen(port);
console.log("Listening on allennikka.com:" + port + "/...");


var active_game_rooms = [];
var game_rooms_set = new Set(); //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

io.sockets.on('connection', function(socket) {
    console.log('New Connection from socket: ' + socket);
    // getting a unique identifier for the game room

    // Master Functions-----------------------------------
    socket.on('get_room_id', function() {
        // console.log(generateUnique(game_rooms_set));
        var room_id = generateUnique(game_rooms_set);
        game_rooms_set.add(room_id);
        socket.room_id = room_id;
        socket.is_master = true;
        socket.emit('return_room_id', {
            room_id_s: room_id
        });
        console.log("Active Rooms: ");
        for (let item of game_rooms_set) console.log(item);
        console.log("My rom ID: " + socket.room_id);
        console.log("active game arr len: " + active_game_rooms.length);
    });

    // add game paramaters to active_game_rooms[], begin card submit phase
    socket.on('goto_card_submit_master', function(data) {
        var temp_room_id = socket.room_id;
        var game_room_settings = {
            master_name: data.master_name_c,
            num_teams: data.num_teams_c,
            num_players: data.num_players_c,
            num_cards: data.num_cards_c,
            turn_time_min: data.turn_time_min_c,
            turn_time_sec: data.turn_time_sec_c
        };
        var room_card_set = new Set();
        var team_arr = [];
        for (var i = 0; i < data.num_teams_c; i++) {
            var team_list = [];
            team_arr.push(team_list);
        }
        var game_room_obj = {
            room_id: temp_room_id,
            room_settings: game_room_settings,
            room_card_set: room_card_set,
            room_team_arr: team_arr
        };
        socket.room_settings = game_room_settings;
        active_game_rooms.push(game_room_obj);
        var active_room = getRoom(temp_room_id, active_game_rooms);
        socket.emit('send_game_settings', {
            room_settings: active_room.room_settings
        });
        // console.log("Room ID " + socket.room_id);
        // console.log(socket.room_settings);
        socket.join(temp_room_id)
        console.log("Joined room " + temp_room_id);
        io.in(socket.room_id).emit('ui_update', {
            room_obj: game_room_obj
        });
    });



    // User Functions-----------------------------------
    socket.on('goto_join_game', function(data) {
        socket.is_master = false;
        socket.room_id = data.game_id_c;
        socket.player_name = data.player_name_C;
        var room_id_temp = socket.room_id;
        var join_success = false;
        var game_settings = null;
        if (game_rooms_set.has(room_id_temp)) {
            socket.join(room_id_temp);
            join_success = true;
            console.log("non master joined room with id " + socket.room_id);
            socket.to(room_id_temp).emit('alert_msg', 'New User Socket has joined!');
            var active_room = getRoom(room_id_temp, active_game_rooms);
            game_settings = active_room.room_settings;
        }
        socket.emit('goto_join_game_success', {
            join_success: join_success,
            room_id: room_id_temp,
            room_settings: game_settings
        });
    });



    // Mixed Functions-----------------------------------
    socket.on('submit_card_data', function(data) {
        socket.card_arr = data.card_arr;
        var active_room = getRoom(socket.room_id, active_game_rooms);
        var set1 = active_room.room_card_set;
        var set2 = new Set(data.card_arr);
        // for (let item of set1) console.log(item);
        // for (let item of set2) console.log(item);
        var merged = getUnion(set1, set2);
        for (let item of merged) console.log(item);
        active_room.room_card_set = [...merged];
        io.in(socket.room_id).emit('ui_update', {
            room_obj: active_room
        });
    });

    // remove a game room identifier
    socket.on('remove_room_id', function(data) {
        if (socket.is_master) {
            console.log("ID being removed: " + socket.room_id);
            game_rooms_set.delete(socket.room_id);
            clearRoom(socket.room_id, active_game_rooms);
            console.log("Active Rooms: ");
            for (let item of game_rooms_set) console.log(item);
            console.log("active game arr len: " + active_game_rooms.length);
        } else {
            console.log("Client left, room not being deleted");
        }

    });

});

// Other Functions-----------------------------------

var getRoom = function(room_id, arr) {
    var elementPos = arr.map(function(x) {
        return x.room_id;
    }).indexOf(room_id);
    return arr[elementPos];
}

var clearRoom = function(room_id, arr) {
    var elementPos = arr.map(function(x) {
        return x.room_id;
    }).indexOf(room_id);
    if (elementPos !== -1) arr.splice(elementPos, 1);
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

var getUnion = function(setA, setB) {
    var union = new Set(setA);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
}