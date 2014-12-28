var express = require('express');
var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var config = require('./config');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var errorhandler = require('errorhandler');
var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(path.join(__dirname, 'public/images/favicon.ico')));
app.use(morgan('combined'));
app.get('/', function(req, res) {
    res.render('index', {
        title: 'Build Monitor'
    });
});
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(errorhandler());
}

var server = http.createServer(app);
var io = socketio.listen(server);

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
}

monitor.configure(config.monitor);

monitor.on('buildsChanged', function (changes) {
  io.emit('buildsChanged', changes);
});

monitor.run();