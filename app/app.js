var express = require('express'),
    http = require('http'),
    path = require('path'),
    socketio = require('socket.io'),
    config = require('./config'),
    morgan = require('morgan'),
    errorhandler = require('errorhandler'),
    app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(morgan('combined'));
app.get('/', function(req, res) {
    res.render('index', {
        title: 'Build Monitor'
    });
});
app.use(express.static(path.join(__dirname, 'public')));

if ('development' === app.get('env')) {
  app.use(errorhandler());
}

// run express
var server = http.createServer(app),
    io = socketio.listen(server);

server.listen(app.get('port'), function() {
  console.log('node-build-monitor is listening on port ' + app.get('port'));
});

// run socket.io
io.sockets.on('connection', function (socket) {
  socket.emit('settingsChanged', {
    version: require('../package').version
  });

  socket.emit('buildsLoaded', monitor.currentBuilds);
});

// configure monitor
var Monitor = require('./monitor'),
    monitor = new Monitor();

for (var i = 0; i < config.services.length; i++) {
    var serviceConfig = config.services[i],
        service = new (require('./services/' + serviceConfig.name))();

    service.configure(serviceConfig.configuration);

    monitor.watchOn(service);
}

monitor.configure(config.monitor);

monitor.on('buildsChanged', function (changes) {
  io.emit('buildsChanged', changes);
});

// run monitor
monitor.run();
