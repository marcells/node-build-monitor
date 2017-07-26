var express = require('express'),
    http = require('http'),
    path = require('path'),
    socketio = require('socket.io'),
    fs = require('fs'),
    morgan = require('morgan'),
    errorhandler = require('errorhandler'),
    version = require('../package').version,
    app = express();

function getConfig() {
  const defaultConfigFileName = 'config.json';
  const userConfigFileName = 'node-build-monitor-config.json';
  const possibleFileNames = [
    path.join(require('os').homedir(), userConfigFileName),
    ...(process.pkg !== undefined ? [ path.join(path.dirname(process.execPath), defaultConfigFileName) ] : []),
    path.join(__dirname, defaultConfigFileName)
  ];

  const availableFileNames = possibleFileNames.filter(possibleFileName => fs.existsSync(possibleFileName));

  if (availableFileNames.length === 0) {
    const humanReadableFileList = possibleFileNames.map((value, index) => `    ${index + 1}. ${value}`).join('\n');
    throw new Error(`Please provide a configuration file at one of the following locations: \n${humanReadableFileList}`);
  }

  return JSON.parse(fs.readFileSync(availableFileNames[0], 'utf8'));
}

var configs = getConfig();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(morgan('combined', { skip: (req, res) => res.statusCode < 400 }));

app.get('/', function(req, res) {
    res.render('index', {
        title: 'Build Monitor Groups',
        configs: configs
    });
});
app.get('/health', function(req, res) {
    res.render('health', {
        title: 'Build Monitor Health'
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
  console.log('node-build-monitor ' + version + ' is listening on port ' + app.get('port'));
});

// run socket.io
var Monitor = require('./monitor');

for (var configId = 0; configId < configs.length; configId++) {
    createAndRunMonitor(configId, configs[configId]);
}

function createAndRunMonitor(configId, config) {
  console.log('Create /monitor' + configId);

  let namespace = '/monitor-' + configId;
  let monitorSocket = io.of(namespace);
  let monitor = new Monitor(configId);

  monitorSocket.on('connection', function (socket) {
    socket.emit('settingsChanged', {
      version: version
    });

    socket.emit('buildsLoaded', monitor.currentBuilds);
  });

  app.get('/monitor/' + configId, function(req, res) {
      res.render('monitor', {
          title: 'Build Monitor',
      });
  });

  app.get('/monitor/'+ configId + '/variables', function(req, res) {
      res.json({ namespace: namespace });
  });

  for (var i = 0; i < config.services.length; i++) {
      let serviceConfig = config.services[i];
      let service = new (require('./services/' + serviceConfig.name))();

      service.configure(serviceConfig.configuration);

      monitor.watchOn(service);
  }

  monitor.configure(config.monitor);

  monitor.on('buildsChanged', function (changes) {
    console.log('emit buildsChanged to ' + configId);
    monitorSocket.emit('buildsChanged', changes);
  });

  // run monitor
  monitor.run();
}
