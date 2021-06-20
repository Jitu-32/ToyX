//
require('dotenv').config();

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

// blogs
const blogRouter = require('./routes/blogs');
const Blog = require('./models/Blog');

// battleground
const battlegroundRouter = require('./routes/battleground');
const battlegroundSocket = require('./battleground/socketEventSetup');

// Mongoos connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/ManualAuth', {

    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});


// Http and Socket.io connection
const http = require('http').Server(app);
const io = require('socket.io')(http);

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
app.use(express.static("static"));
app.use(express.static("public"));

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
            res.render('community', { blogs: blogs, data: data });
        }
    });
});



//app.get('/community', async (request, response) => {
//let blogs = await Blog.find().sort({ timeCreated: 'desc' });

//response.render('community', { blogs: blogs });
//});
//listen to routes
app.use('/blogs', blogRouter);




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

// video_call
app.get('/video', function (req, res) {
    res.render('video_call');
  });


app.get('/profile', function (req, res) {

    var user = req.data
    console.log(req.session.userId)
    console.log(req.session.data)
    //console.log(req)

    res.render('profile', { title: 'Profile Page', data: req.session.data });
});

app.get('/sss', function (req, res) {

    var user = req.data
    //console.log(req)
    console.log(req.body)
    //console.log(req)

    res.render('sss', { title: 'Image Page', data: req.session.data });
});

app.use('/battleground', (req, res, next) => {
    battlegroundSocket.initSocketIoCallbacks(io)
    next()
}, battlegroundRouter)

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