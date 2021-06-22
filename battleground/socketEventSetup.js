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
const ProblemStatement = require("../models/battleground/problem").ProblemStatement;
const ProblemProvider = require("../battleground/problemProvider").ProblemProvider;
const Constants = require("./socketConstants")


var rooms = {}; // Note: ony one instance throught the server
var io = null;

function getRoomGameType(roomname) {
    if (roomname in rooms) {
        return rooms[roomname].gameType
    }
    return null;
}

// returns null if user is not in any of the rooms
// else returns roomname
function getJoinedRoomname(username) {
    // console.log("getJoinedRoomname(" + username + ")")
    let joinedRoomname = null;

    for (const roomname in rooms) {
        if (Object.hasOwnProperty.call(rooms, roomname)) {
            const aRoom = rooms[roomname];
            // console.log("aRoom.members: " + aRoom.members)
            // console.log("username in aRoom.members: " +  (username in aRoom.members))
            // console.log("aRoom: " + aRoom)
            if (aRoom.members.indexOf(username) !== -1)
                joinedRoomname = roomname;
        }
    }

    return joinedRoomname;
}

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

function getDefaultInitialisedRoom(gameType) {
    return {
        data: {
            boardData: [],
            messages: []
        },
        gameType: gameType,
        members: [],
        allPlayersReadyMap: new Map(),
        solutions: new Map(),
        votes: new Map(),
    };
}

function onConnection(socket) {
    console.log(ColoredLog.blue("\tio.on('connection')"));

    socket.on(Constants.GAME_EVENTS.SOCKET_EVENT_COMING, function (data) {

        console.log("\tsocket.on('" + Constants.GAME_EVENTS.SOCKET_EVENT_COMING + "')");

        let roomname = data.roomname;
        let username = data.username;
        let gameType = data.gameType;

        if(!roomname || !username || !gameType){
            console.log(ColoredLog.red("Rejected socket.on SOCKET_EVENT_COMING ", true));
            return;
        }

        if (rooms[roomname]) {

            if (rooms[roomname].members.indexOf(username) === -1) {
                rooms[roomname].members.push(username);
                console.log(username + " added to existing room : " + roomname);
            }
        } else {

            rooms[roomname] = getDefaultInitialisedRoom(gameType);
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

    socket.on(Constants.GAME_EVENTS.SOCKET_EVENT_DRAWING, function (data) {

        // var room = data.room;

        // rooms[room].data.boardData.push(data.boardData); // add it to the room

        // socket.broadcast.to(room).emit('drawing', data); // send to all others except the sender

    });

    socket.on(Constants.GAME_EVENTS.SOCKET_EVENT_CHAT_MSG, function (data) {
        var roomname = data.roomname;

        if(!roomname){
            console.log(ColoredLog.red("Rejected socket.on SOCKET_EVENT_CHAT_MSG ", true));
            return;
        }

        rooms[roomname].data.messages.push({
            from: data.from,
            msg: data.msg
        });
        socket.broadcast.to(roomname).emit('chatMsg', data); // send to all others except the sender
        console.log(rooms[roomname].data.messages);
    });

    socket.on(Constants.GAME_EVENTS.SOCKET_EVENT_DISCONNECT, function () {
        console.log(socket.id + ":" + socket.username + " disconnected from " + socket.roomname);

        if (!socket.roomname || !socket.username || !rooms[socket.roomname]) {
            console.error(ColoredLog.red("\nCAUGHT ERROR in socket.on('disconnect') ", true) +
                "\n\t rooms[" + socket.roomname + "] is undefined!\n");
            return;
        }

        // if all users have left  the room
        if (rooms[socket.roomname].members.length === 1) {

            //delete the room
            delete rooms[socket.roomname]
            console.log("Room " + socket.roomname + " deleted");

        } else {
            //only delete the leaving user
            let room = rooms[socket.roomname];

            if (room.members.indexOf(socket.username) != -1) {
                room.members.splice(room.members.indexOf(socket.username), 1);
            }

            room.allPlayersReadyMap.delete(socket.username)
            room.solutions.delete(socket.username)
            room.votes.delete(socket.username)

            //notify other members
            io.in(socket.roomname).emit('left', rooms[socket.roomname].members);

        }

    });

    socket.on(Constants.GAME_EVENTS.SOCKET_EVENT_SOLUTION, function (data) {
        // data contains username and imageUrl

        if (!socket.roomname || !socket.username || !rooms[socket.roomname]) {
            console.log(ColoredLog.red("Rejected socket.on SOCKET_EVENT_SOLUTION ", true));
            return
        }

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

    socket.on(Constants.GAME_EVENTS.SOCKET_EVENT_VOTED_SOLUTION, function (solution) {
        console.log(socket.username, " voted for: ", solution);

        if (!socket.roomname || !socket.username || !rooms[socket.roomname]) {
            console.log(ColoredLog.red("Rejected socket.on SOCKET_EVENT_VOTED_SOLUTION ", true));
            return
        }

        let thisRoom = rooms[socket.roomname];
        thisRoom.votes.set(socket.username, solution['username']);

        if (thisRoom.votes.size == rooms[socket.roomname].members.length) {
            let roundResults = aggregateAndSortVotes(thisRoom.votes, thisRoom.members);
            io.in(socket.roomname).emit("roundResults", roundResults);
            console.log("roundResults:", roundResults)
        }
    });

    socket.on(Constants.GAME_EVENTS.SOCKET_EVENT_IS_PLAYER_READY, function (isPlayerReady) {

        // console.log(ColoredLog.blue("\n-----------------------------------------\n"));
        console.log("NEW EVENT: isPlayerReady:", isPlayerReady, " by socket.username = ", socket.username);
        // console.log("socket: ", {
        //     "socket.roomname": socket.roomname,
        //     "socket.username": socket.username,
        //     "socket.roundRunning": socket.roundRunning,
        // });
        // console.log("rooms[socket.roomname] = ", rooms[socket.roomname], "\n\n")

        if (!socket.roomname || !socket.username || !rooms[socket.roomname]) {
            console.log(ColoredLog.red("Rejected socket.on SOCKET_EVENT_IS_PLAYER_READY ", true));
            return
        }

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
                let gameType = rooms[socket.roomname].gameType;
                let problemStatement;
                switch (gameType) {
                    case ProblemStatement.WORD_TYPE:
                        problemStatement = ProblemProvider.getRandomWordProblem();
                        break;

                    case ProblemStatement.PICTURE_TYPE:
                        problemStatement = ProblemProvider.getRandomPictureProblem();
                        break;

                    default:
                        throw new Error("Unknown Problem type: " + gameType)
                }
                console.log("Emiting: problemStatement = " + problemStatement + "] "+gameType);
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

// ARGS : 
//      votes (Map)  : voteBy (key) -> voteTo (value) (all these are username)
//      members ([]) : list of all players (usernames) in the current game
// 
// RETURNS array of votes as [aVote...] where aVote is {username, vote}
//      (sorted aggregated votes based on votedTo username)
function aggregateAndSortVotes(votes, members) {
    let voteCounts = new Map();

    members.forEach(username => {
        voteCounts.set(username, 0);
    });

    votes.forEach(function (votedTo, votedBy) { // fucntion format is (value, key)=>{}
        let temp = 0; // previous votes
        if (voteCounts.has(votedTo)) {
            temp = voteCounts.get(votedTo);
        }
        voteCounts.set(votedTo, temp + 1);
    });
    // descending inplace sort
    let sortedAggregatedVotes2DArr = [...voteCounts.entries()].sort((f, s) => s[1] - f[1]);

    let sortedAggregatedVotes = []; // [aVote] where aVote is {username, vote}

    sortedAggregatedVotes2DArr.forEach((aggVotes) => { //aggregated Votes
        sortedAggregatedVotes.push({
            username: aggVotes[0],
            votes: aggVotes[1]
        })
    })
    return sortedAggregatedVotes
}

function startRound(roomname) {
    rooms[roomname].timeRemaining = 30; // seconds to answer the solution after problem statement send!!
    let theInterval = setInterval(function () {
        io.in(roomname).emit('timeRemaining', rooms[roomname].timeRemaining);
        if (rooms[roomname].timeRemaining == 0) {
            clearInterval(theInterval);
            console.log("times up boys and girls!!");

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

    RoomStaticUtils: Object.freeze({
        getRoomGameType: getRoomGameType,
        getJoinedRoomname: getJoinedRoomname
    })

}
