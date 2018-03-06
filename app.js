var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var db = require('./js/db');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var editor = require('./routes/editor');
var gamerModule = require('./routes/gamerModule');

server.listen(8080);
io.listen(server);

// view engine setup
app.set('views', [path.join(__dirname, 'views/'),
                  path.join(__dirname, 'views/gamerModule/'),
                  path.join(__dirname, 'views/cardGameEditor/')]);
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/editor', editor);
app.use('/gamerModule', gamerModule);
app.use('/scripts', express.static(__dirname + '/node_modules/'));

// connect to MySQL on start
db.connect(db.MODE_TEST, function(err){
    if(err){
        console.log('Unable to connect to MySQL');
        process.exit(1);
    }else{
        console.log('Connected to MySQL');
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


io.on('connection', function (socket) {
    console.log("wow");
    socket.emit('news', { hello: 'world' });
    var clients = Object.keys(io.sockets.sockets);
    console.log("my clients : " + clients);
    socket.broadcast.emit("players", clients);
    socket.on('message', function(data){
        console.log("dest : " + data["dest"] + " msg : " + data["msg"]);
        if(data["dest"] === "all"){
            socket.broadcast.emit('msg', data['msg']);
        } else {
            io.sockets.connected[data["dest"]].emit("message", data['msg']);  // FIXME
        }
    });
});

module.exports = app;
exports.io = io;

