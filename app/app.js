var express = require('express');
var http = require('http');
var path = require('path');
var socketio = require('socket.io');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    res.render('index', {
        title: 'Running builds',
        socket: process.env.socket || 'http://localhost:3000/'
    });
});

var server = http.createServer(app);
var io = socketio.listen(server);
io.set('log level', 1);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {
  socket.emit('buildsLoaded', monitor.currentBuilds);
});

var Monitor = require('./monitor'),
    Tfs = require('./monitor-tfs'),
    Travis = require('./monitor-travis'),
    monitor = new Monitor(),
    tfs,
    tfs2,
    travis;

if(process.env.TFS1_ACTIVE) {
    tfs = new Tfs(),

    tfs.configure({
        server: process.env.TFS1_ODATA_WRAPPER, // 'https://odatawrapper'
        user: process.env.TFS1_USER, // 'Domain\User'
        password: process.env.TFS1_PASSWORD, // 'Password'
        collection: process.env.TFS1_COLLECTION || 'DefaultCollection'
    });

    monitor.watchOn(tfs);
}

if(process.env.TFS2_ACTIVE) {
    tfs2 = new Tfs(),

    tfs2.configure({
        server: process.env.TFS2_ODATA_WRAPPER, // 'https://odatawrapper'
        user: process.env.TFS2_USER, // 'Domain\User'
        password: process.env.TFS2_PASSWORD, // 'Password'
        collection: process.env.TFS2_COLLECTION || 'DefaultCollection'
    });

    monitor.watchOn(tfs2);
}

if(process.env.TRAVIS1_ACTIVE) {
    travis = new Travis();

    travis.configure({
        slug: process.env.TRAVIS1_SLUG
    });

    monitor.watchOn(travis);
}

monitor.configure({
    interval: 5000,
    numberOfBuilds: 12
});

monitor.on('buildsLoaded', function (builds) {
  io.sockets.emit('buildsLoaded', monitor.currentBuilds);
});

monitor.on('buildsChanged', function (changes) {
  io.sockets.emit('buildsChanged', changes);
});

monitor.run();