var app = require('express')();
var port = process.env.PORT || 3000;
var path = require('path');
var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body`

var http = require('http').Server(app);
var io = require('socket.io')(http);

const ProblemStatement = require("./problem").ProblemStatement;
// const ProblemProvider = require("./problem").ProblemProvider;


// must use cookieParser before expressSession

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(require('express').static(path.join(__dirname, 'public')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// routing
app.get('/login', function (req, res) {
    res.render('login', {
        visibility: 'hidden',
        msg: null
    });
});

// ROUTES
app.get('/', function (req, res) {
    res.render('home');
});

app.get('/home', function (req, res) {
    res.render('home');
});

app.get('/community', function (req, res) {
    res.render('community');
});

app.get('/contact', function (req, res) {
    res.render('contact');
});

app.post('/login', function (req, res) {

    var roomname = req.body.roomname;
    var username = req.body.username;

    if (roomname.indexOf(' ') > -1 || roomname.length === 0) {
        res.render('login', {
            visibility: 'visible',
            msg: 'Invalid Roomname'
        });
    } else {
        // res.redirect({
        //     roomname: roomname,
        //     username: username
        // }, '/index');
        res.render('index', {
            roomname: roomname,
            username: username
        });

    }

});

var rooms = {};

io.on('connection', function (socket) {

    var timer, flag = 0;

    socket.on('coming', function (data) {
        
        var roomname = data.roomname;
        var username = data.username;

        console.log("coming event logged " + data)

        if (rooms[roomname]) {

            if (rooms[roomname].members.indexOf(username) === -1) {
                rooms[roomname].members.push(username);
                console.log(username + " added to existing room : " + roomname);
            }
            clearTimeout(timer); // look code below for deleting the room
            flag = 0;
            console.log("Timer cleared");
        } else {
            
            rooms[roomname] = {
                data: {
                    boardData: [],
                    messages: []
                },
                members: [username],
                allPlayersReadyMap : new Map(),
                solutions : [],
                votes : new Map(),
            };
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

    socket.on('drawing', function (data) {

        var room = data.room;

        rooms[room].data.boardData.push(data.boardData); // add it to the room

        // socket.broadcast.to(room).emit('drawing', data); // send to all others except the sender

    });

    socket.on('chatMsg', function (data) {
        var roomname = data.roomname;
        rooms[roomname].data.messages.push({
            from: data.from,
            msg: data.msg
        });
        socket.broadcast.to(roomname).emit('chatMsg', data); // send to all others except the sender
        console.log(rooms[roomname].data.messages);
    });

    socket.on('disconnect', function () {
        console.log(socket.id + " disconnected from " + socket.roomname);
        return; // TODO!!

        // if all users have left  the room
        if (rooms[socket.roomname].members.length === 1) {

            //delete the room if users doesn't connect in 1 minute
            flag = 1;
            timer = setTimeout(function () {

                if (flag) {
                    rooms[socket.roomname] = null;
                    console.log(socket.roomname + " deleted");
                }

            }, 10000);

            console.log("Timer set");


        } else {
            //only delete the leaving user
            rooms[socket.roomname].members.splice(rooms[socket.roomname].members.indexOf(socket.username), 1);
        }

        //notify other members
        io.in(socket.roomname).emit('left', rooms[socket.roomname].members);

    });

    socket.on('solution', function(data){
        thisRoom = rooms[socket.roomname];
        thisRoom.solutions.push(data);
        console.log('added solution by : ['+socket.username+']');
        // if(waitingForSoln){
        //     thisRoom.solutions.push(data);
        //     console.log('added solution by : ['+socket.username+'] is');
        // }else{
        //     console.log('IGNORED solution by : ['+socket.username+'] is');
        // }
    });

    socket.on('votedSolution', function(solution){
        console.log(socket.username," voted for: ", solution);
        let thisRoom = rooms[socket.roomname];
        thisRoom.votes.set(socket.username, solution['username']);
        
        if(thisRoom.votes.size == rooms[socket.roomname].members.length){
            let winner = calculateWinner(thisRoom.votes);
            console.log("roundWinner : ", winner);
            io.in(socket.roomname).emit("roundWinner", winner);
        }
    });

    socket.on("isPlayerReady", function(isPlayerReady){
        console.log("NEW EVENT: isPlayerReady:", isPlayerReady, "& username:", socket.username);
        let info = {
            username : socket.username, 
            isPlayerReady : isPlayerReady
        };
        allPlayersReadyMap = rooms[socket.roomname].allPlayersReadyMap;
        allPlayersReadyMap.set(info.username, info.isPlayerReady);

        console.log("allPlayersReadyMap: ", allPlayersReadyMap);
        io.in(socket.roomname).emit("updatePlayersList",[...allPlayersReadyMap]);

        // checking if all players ready:
        let allReady = true;
        allPlayersReadyMap.forEach(function(isReady, username){
            if(!isReady) allReady = false;
        });

        if(socket.roundStartInterval != null)
            clearInterval(socket.roundStartInterval);
            
        // all ready:=> start round timmer:
        if(!allReady)
            return;
        

        console.log("All are ready! starting timer!");

        let secBeforeRoundStart = 5;

        socket.roundStartInterval = setInterval(()=>{ 
            if(secBeforeRoundStart == 0){
                clearInterval(socket.roundStartInterval);

                let problemStatement = ProblemStatement.getTestProblemStatement(); //todo!
                io.in(socket.roomname).emit("startRound", {
                    problemStatement : problemStatement, 
                    round : 1,
                });

                if(!socket.roundRunning){
                    socket.roundRunning = true;
                    startRound(socket.roomname);
                }
                    
            }else{
                secBeforeRoundStart--;
                io.in(socket.roomname).emit("roundStartTimeRemaining", secBeforeRoundStart);
            }
            
        }, 1000);

    });
});

function calculateWinner(votes){
    let voteCounts = new Map();
    votes.forEach(function(votedTo, votedBy){
        let temp = 0; // previous votes
        if(voteCounts.has(votedTo)){
            temp = voteCounts.get(votedTo);
        }
        voteCounts.set(votedTo, temp + 1);
    });
    // get max voted user
    let uservotes = [...voteCounts.entries()].reduce((a, e ) => e[1] > a[1] ? e : a);
    return {
        "username" : uservotes[0],
        "votes" : uservotes[1],
    }
}

function startRound(roomname) {
    rooms[roomname].timeRemaining = 20; // seconds to answer the solution after problem statement send!!
    let theInterval = setInterval(function(){
        io.in(roomname).emit('timeRemaining', rooms[roomname].timeRemaining);
        if(rooms[roomname].timeRemaining == 0){ 
            clearInterval(theInterval);
            console.log("times up boys!!");
            
            // waiting for 5 seconds to recieve all solutions
            setTimeout(()=>{
                // socket.removeAllListeners("solution"); // no more solutions allowed!
                io.in(roomname).emit('startVoting', rooms[roomname].solutions);
            },5000);

        }else
            rooms[roomname].timeRemaining--;
    }, 1000)
}

console.log("Listening to " + port);
http.listen(port, process.env.IP);