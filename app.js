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
            let problemStatement = ProblemStatement.getTestProblemStatement(); //todo!
            rooms[roomname] = {
                data: {
                    boardData: [],
                    messages: []
                },
                members: [username],
                problemStatement: problemStatement,
                timeRemaining: 0,
                solutions : {},
            };
            console.log("Created new room " + roomname);
            
            rooms[roomname].timeRemaining = 10; // 10 seconds to answer the solution after problem statement send!!
            let theInterval = setInterval(function(){
                io.in(socket.roomname).emit('time remaining', rooms[roomname].timeRemaining);
                if(rooms[roomname].timeRemaining == 0){ 
                    console.log("times up boys!!");
                    clearInterval(theInterval);
                    io.in(socket.roomname).emit('start voting', rooms[roomname].solutions);
                }else
                    rooms[roomname].timeRemaining--;
            }, 1000)
        }

        socket.join(data.roomname);
        socket.roomname = data.roomname;
        socket.username = data.username;
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
        if(thisRoom.timeRemaining > 0){
            thisRoom.solutions[socket.username] = data;
            console.log('added solution by : ['+socket.username+'] is', data, "time:", socket.timeRemaining);
        }else{
            console.log('IGNORED solution by : ['+socket.username+'] is', data, "time:", socket.timeRemaining);
        }
    });

    // io.in().emit(,)
});



console.log("Listening to " + port);
http.listen(port, process.env.IP);