const compression = require('compression');
const express = require('express');
const app = express();
const server = app.listen(8080);
const io = require('socket.io').listen(server);
const logger = require('./js/logger.js');
const db = require('./js/db');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

app.use(compression());

// the different accessible routes
const index = require('./routes/index');
const users = require('./routes/users');
const editor = require('./routes/editor');
const gamerModule = require('./routes/gamerModule');
const connection = require('./routes/connection');

// view engine setup
app.set('views', [path.join(__dirname, 'views/'),
                  path.join(__dirname, 'views/mainPage/'),
                  path.join(__dirname, 'views/gamerModule/'),
                  path.join(__dirname, 'views/connection/'),
                  path.join(__dirname, 'views/cardGameEditor/')]);
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));
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
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    logger.error(err);
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// connect to MySQL on start
db.connect(db.MODE_PRODUCTION, function(err){
    if(err){
        logger.error('Unable to connect to MySQL');
        process.exit(1);
    }else{
        logger.info('Connected to MySQL');
    }
});

// manage clients connections
io.on('connection', function (socket) {
    require('./js/socketEvent')(io, socket);
});

module.exports = app;
