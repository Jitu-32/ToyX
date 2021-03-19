var express = require('express');
var ejs = require('ejs');
var port = process.env.PORT || 3000;
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

//bring in method override
const methodOverride = require('method-override');

const blogRouter = require('./routes/blogs');
const Blog = require('./models/Blog');



mongoose.connect('mongodb://localhost/ManualAuth',{

  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});




//aman
var http = require('http').Server(app);
var io = require('socket.io')(http);
///
//aman
// must use cookieParser before expressSession

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(require('express').static(path.join(__dirname, 'public')));
////



var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
});

app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));


app.use(express.static(__dirname + '/views'));

var index = require('./routes/index');
app.use('/', index);

//route for the index

app.get('/community', (req, res, next) => {
	console.log("profile");
	User.findOne({ unique_id: req.session.userId }, async (err, data) => {
		console.log("data");
		console.log(data);
		if (!data) {
			res.redirect('/register');
		} else {
			//console.log("found");
            req.session.data = data
      let blogs = await Blog.find().sort({ timeCreated: 'desc' });
			res.render('community', { blogs: blogs, data : data });
		}
	});
});



//app.get('/community', async (request, response) => {
  //let blogs = await Blog.find().sort({ timeCreated: 'desc' });

  //response.render('community', { blogs: blogs });
//});
//listen to routes 
app.use('/blogs', blogRouter);




///aman
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

//app.get('/community', function (req, res) {
  //res.render('community');
//});

app.get('/contact', function (req, res) {
  res.render('contact');
});

app.get('/drawboard', function (req, res) {
  res.render('drawboard');
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

      res.render('index', {
          roomname: roomname,
          username: username
      });

  }

});

app.get('/profile',  function(req, res) {
    
    var user = req.data
    console.log(req.session.userId)
    console.log(req.session.data)
    //console.log(req)

    res.render('profile', { title: 'Profile Page', data : req.session.data });
}); 

app.get('/sss',  function(req, res) {
    
  var user = req.data
  //console.log(req)
  console.log(req.body)
  //console.log(req)

  res.render('sss', { title: 'Image Page', data : req.session.data });
}); 


var rooms = {};

io.on('connection', function (socket) {


    var timer, flag = 0;

    socket.on('coming', function (data) {

        var roomname = data.roomname;
        var username = data.username;

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
                members: [username]
            };
            console.log("Created new room " + roomname);
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

        socket.broadcast.to(room).emit('drawing', data); // send to all others except the sender

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

    //    socket.on('disconnect', function () {
    //        console.log(socket.id + " disconnected from " + socket.roomname);
    //
    //        // if all users have left  the room
    //        if (rooms[socket.roomname].members.length === 1) {
    //
    //            //delete the room if users doesn't connect in 1 minute
    //            flag = 1;
    //            timer = setTimeout(function () {
    //
    //                if (flag) {
    //                    rooms[socket.roomname] = null;
    //                    console.log(socket.roomname + " deleted");
    //                }
    //
    //            }, 10000);
    //
    //            console.log("Timer set");
    //
    //
    //        } else {
    //            //only delete the leaving user
    //            rooms[socket.roomname].members.splice(rooms[socket.roomname].members.indexOf(socket.username), 1);
    //        }
    //
    //        //notify other members
    //        io.in(socket.roomname).emit('left', rooms[socket.roomname].members);
    //
    //    });

});




////





















// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send(err.message);
});


// listen on port 3000
console.log("Listening to " + port);
http.listen(port, process.env.IP);