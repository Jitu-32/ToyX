// ********************** Socket.io game events ********************** 
// 
// 
// Event List:
//  1. coming
//  2. drawing
//  3. chatMsg
//  4. disconnect
//  5. solution
//  6. votedSolution
//  7. isPlayerReady
// 


const ColoredLog = require('../utils/coloredlogger').ColoredLog
const ProblemStatement = require("../models/battlefield/problem").ProblemStatement;
const Constants = require("./socketConstants")


var rooms = {}; // Note: ony one instance throught the server
var io = null;

function initSocketIoCallbacks(_io) {

    // no need to reinitialise io!
    if (io)
        return;

    console.log(ColoredLog.red("initSocketIoCallbacks called!", true));
    io = _io;

    io.on('connection', (socket) => {
        onConnection(socket)
    });
}

function getDefaultInitialisedRoom() {
    return {
        data: {
            boardData: [],
            messages: []
        },
        members: [],
        allPlayersReadyMap: new Map(),
        solutions: new Map(),
        votes: new Map(),
    };
}

function onConnection(socket) {
    console.log(ColoredLog.blue("\tio.on('connection')"));

    socket.on(Constants.SOCKET_EVENT_COMING, function (data) {

        console.log("\tsocket.on('" + Constants.SOCKET_EVENT_COMING + "')");

        var roomname = data.roomname;
        var username = data.username;

        if (rooms[roomname]) {

            if (rooms[roomname].members.indexOf(username) === -1) {
                rooms[roomname].members.push(username);
                console.log(username + " added to existing room : " + roomname);
            }
        } else {

            rooms[roomname] = getDefaultInitialisedRoom();
            rooms[roomname].members.push(username) // adding current member
            console.log("Created new room " + roomname);
        }

        socket.to(roomname).emit("isPlayerReady", false);

        socket.join(data.roomname);
        socket.roomname = data.roomname;
        socket.username = data.username;
        socket.roundRunning = false;
        console.log(socket.id + " joined " + socket.roomname);
        io.in(socket.roomname).emit('joinConfirmed', rooms[roomname]);

    });

    socket.on(Constants.SOCKET_EVENT_DRAWING, function (data) {

        var room = data.room;

        rooms[room].data.boardData.push(data.boardData); // add it to the room

        socket.broadcast.to(room).emit('drawing', data); // send to all others except the sender

    });

    socket.on(Constants.SOCKET_EVENT_CHAT_MSG, function (data) {
        var roomname = data.roomname;
        rooms[roomname].data.messages.push({
            from: data.from,
            msg: data.msg
        });
        socket.broadcast.to(roomname).emit('chatMsg', data); // send to all others except the sender
        console.log(rooms[roomname].data.messages);
    });

    socket.on(Constants.SOCKET_EVENT_DISCONNECT, function () {
        console.log(socket.id + ":" + socket.username + " disconnected from " + socket.roomname);

        if (!rooms[socket.roomname]) {
            console.error(ColoredLog.red("\nCAUGHT ERROR in socket.on('disconnect') ", true) +
                "\n\t rooms[" + socket.roomname + "] is undefined!\n");
            // return;
        }

        // if all users have left  the room
        if (rooms[socket.roomname].members.length === 1) {

            //delete the room
            rooms[socket.roomname] = null;
            console.log("Room " + socket.roomname + " deleted");

        } else {
            //only delete the leaving user
            let room = rooms[socket.roomname];

            if (room.members.indexOf(socket.username) != -1) {
                room.members.splice(room.members.indexOf(socket.username), 1);
            }

            allPlayersReadyMap.delete(socket.username)
            solutions.delete(socket.username)
            votes.delete(socket.username)

            //notify other members
            io.in(socket.roomname).emit('left', rooms[socket.roomname].members);

        }

    });

    socket.on(Constants.SOCKET_EVENT_SOLUTION, function (data) {
        // data contains username and imageUrl

        thisRoom = rooms[socket.roomname];
        thisRoom.solutions.set(socket.username, data);

        console.log('added solution by : [' + socket.username + ']');
        // if(waitingForSoln){
        //     thisRoom.solutions.push(data);
        //     console.log('added solution by : ['+socket.username+'] is');
        // }else{
        //     console.log('IGNORED solution by : ['+socket.username+'] is');
        // }
    });

    socket.on(Constants.SOCKET_EVENT_VOTED_SOLUTION, function (solution) {
        console.log(socket.username, " voted for: ", solution);
        let thisRoom = rooms[socket.roomname];
        thisRoom.votes.set(socket.username, solution['username']);

        if (thisRoom.votes.size == rooms[socket.roomname].members.length) {
            let winner = calculateWinner(thisRoom.votes);
            console.log("roundWinner : ", winner);
            io.in(socket.roomname).emit("roundWinner", winner);
        }
    });

    socket.on(Constants.SOCKET_EVENT_IS_PLAYER_READY, function (isPlayerReady) {

        console.log(ColoredLog.blue("\n-----------------------------------------\n"));
        console.log("NEW EVENT: isPlayerReady:", isPlayerReady);
        console.log("socket: ", {
            "socket.roomname": socket.roomname,
            "socket.username": socket.username,
            "socket.roundRunning": socket.roundRunning,
        });
        console.log("rooms[socket.roomname] = ", rooms[socket.roomname], "\n\n")

        allPlayersReadyMap = rooms[socket.roomname].allPlayersReadyMap;
        allPlayersReadyMap.set(socket.username, isPlayerReady);

        console.log("allPlayersReadyMap: ", allPlayersReadyMap);
        io.in(socket.roomname).emit("updatePlayersList", [...allPlayersReadyMap]);

        // checking if all players ready:
        let allReady = true;
        allPlayersReadyMap.forEach(function (isReady, username) {
            if (!isReady)
                allReady = false;
        });

        if (socket.roundStartInterval != null)
            clearInterval(socket.roundStartInterval);

        // all ready:=> start round timmer:
        if (!allReady)
            return;


        console.log("All are ready! starting timer!");

        let secBeforeRoundStart = 5;

        socket.roundStartInterval = setInterval(() => {
            if (secBeforeRoundStart == 0) {
                clearInterval(socket.roundStartInterval);

                let problemStatement = ProblemStatement.getTestProblemStatement(); //todo!
                io.in(socket.roomname).emit("startRound", {
                    problemStatement: problemStatement,
                    round: 1,
                });

                if (!socket.roundRunning) {
                    socket.roundRunning = true;
                    startRound(socket.roomname);
                }

            } else {
                secBeforeRoundStart--;
                io.in(socket.roomname).emit("roundStartTimeRemaining", secBeforeRoundStart);
            }

        }, 1000);

    });
}



//  ------- Utility functions -------

function calculateWinner(votes) {
    let voteCounts = new Map();
    votes.forEach(function (votedTo, votedBy) {
        let temp = 0; // previous votes
        if (voteCounts.has(votedTo)) {
            temp = voteCounts.get(votedTo);
        }
        voteCounts.set(votedTo, temp + 1);
    });
    // get max voted user
    let uservotes = [...voteCounts.entries()].reduce((a, e) => e[1] > a[1] ? e : a);
    return {
        "username": uservotes[0],
        "votes": uservotes[1],
    }
}

function startRound(roomname) {
    rooms[roomname].timeRemaining = 20; // seconds to answer the solution after problem statement send!!
    let theInterval = setInterval(function () {
        io.in(roomname).emit('timeRemaining', rooms[roomname].timeRemaining);
        if (rooms[roomname].timeRemaining == 0) {
            clearInterval(theInterval);
            console.log("times up boys!!");

            // waiting for 5 seconds to recieve all solutions
            setTimeout(() => {
                // socket.removeAllListeners("solution"); // no more solutions allowed!
                io.in(roomname).emit('startVoting', Array.from(rooms[roomname].solutions.values()));
            }, 5000);

        } else
            rooms[roomname].timeRemaining--;
    }, 1000)
}


// Exports

module.exports = {
    initSocketIoCallbacks: initSocketIoCallbacks,
}
