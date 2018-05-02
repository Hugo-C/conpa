var express = require('express');
var app = express();
var server = app.listen(8080);
var io = require('socket.io').listen(server);
var db = require('./js/db');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// the different accessible routes
var index = require('./routes/index');
var users = require('./routes/users');
var editor = require('./routes/editor');
var gamerModule = require('./routes/gamerModule');
var connection = require('./routes/connection');

// view engine setup
app.set('views', [path.join(__dirname, 'views/'),
                  path.join(__dirname, 'views/mainPage/'),
                  path.join(__dirname, 'views/gamerModule/'),
                  path.join(__dirname, 'views/connection/'),
                  path.join(__dirname, 'views/cardGameEditor/')]);
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/editor', editor);
app.use('/gamerModule', gamerModule);
app.use('/connection', connection);
app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.use('/bower', express.static(__dirname + '/bower_components'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// connect to MySQL on start
db.connect(db.MODE_TEST, function(err){
    if(err){
        console.log('Unable to connect to MySQL');
        process.exit(1);
    }else{
        console.log('Connected to MySQL');
    }
});

// connect to MySQL on start
db.connect(db.MODE_TEST, function(err){
    if(err){
        console.log('Unable to connect to MySQL');
        process.exit(1);
    }else{
        console.log('Connected to MySQL');
    }
});

// manage clients connections
io.on('connection', function (socket) {
    require('./js/socketEvent')(io, socket);
});

module.exports = app;
