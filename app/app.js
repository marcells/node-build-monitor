var express = require('express');
var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var config = require('./config');

var app = express();

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

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    res.render('index', {
        title: 'Running builds'
    });
});

var server = http.createServer(app);
var io = socketio.listen(server);
io.set('log level', 1);

server.listen(app.get('port'), function() {
  console.log('node-build-monitor is listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {
  socket.emit('buildsLoaded', monitor.currentBuilds);
});

var Monitor = require('./monitor'),
    monitor = new Monitor();

for (var i = 0; i < config.services.length; i++) {
    var serviceConfig = config.services[i];
    var service = new (require('./services/' + serviceConfig.name))();
    
    service.configure(serviceConfig.configuration);

    monitor.watchOn(service);
};

monitor.configure(config.monitor);

monitor.on('buildsLoaded', function (builds) {
  io.sockets.emit('buildsLoaded', monitor.currentBuilds);
});

monitor.on('buildsChanged', function (changes) {
  io.sockets.emit('buildsChanged', changes);
});

monitor.run();