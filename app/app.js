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

function printStartupInformation() {
    const importantEnvironmentVariables = [
        {
            name : 'PORT',
            defaultValue : '3000'
        },
        {
            name : 'NODE_TLS_REJECT_UNAUTHORIZED',
            defaultValue : '1'
        }];

    console.log(`Printing environment Variables...`);
    importantEnvironmentVariables
        .map(x => ({ variable : x, stringValue : process.env.hasOwnProperty(x.name) ? process.env[x.name] : `unset (Default: ${x.defaultValue})` }))
        .forEach(x => console.log(`    ${x.variable.name} = ${x.stringValue}`));

    console.log('node-build-monitor is starting...');
}

printStartupInformation();

var config = getConfig();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(morgan('combined', { skip: (req, res) => res.statusCode < 400 }));
app.get('/', function(req, res) {
    res.render('index', {
        title: 'Build Monitor'
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
  console.log(`node-build-monitor ${version} is listening on port ${app.get('port')}...`);
});

// run socket.io
io.sockets.on('connection', function (socket) {
  socket.emit('settingsChanged', {
    version: version
  });

  socket.emit('buildsLoaded', monitor.currentBuilds);
});

// configure monitor
var Monitor = require('./monitor'),
    monitor = new Monitor();

for (var i = 0; i < config.services.length; i++) {
    var serviceConfig = config.services[i],
        service = new (require('./services/' + serviceConfig.name))();

    service.configure(tryExpandEnvironmentVariables(config.monitor, serviceConfig.configuration));

    monitor.watchOn(service);
}

monitor.configure(config.monitor);

monitor.on('buildsChanged', function (changes) {
  io.emit('buildsChanged', changes);
});

// run monitor
monitor.run();

// helpers
function tryExpandEnvironmentVariables(monitorConfiguration, serviceConfiguration) {
    if (monitorConfiguration.expandEnvironmentVariables) {
        for (var property in serviceConfiguration) {
            serviceConfiguration[property] = tryExpandEnvironmentVariable(serviceConfiguration[property]);
        }
    }

    return serviceConfiguration;
}

function tryExpandEnvironmentVariable(value) {
    const environmentPattern = /^\${(.*?)}$/g;

    if (typeof value === 'string') {
        let match = environmentPattern.exec(value);

        if (match && match.length == 2) {
            return process.env[match[1]];
        }
    }

    return value;
}