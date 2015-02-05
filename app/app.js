import express from 'express';
import http from 'http';
import path from 'path';
import socketio from 'socket.io';
import config from './config';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import errorhandler from 'errorhandler';

let app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(path.join(__dirname, 'public/images/favicon.ico')));
app.use(morgan('combined'));
app.get('/', (req, res) => res.render('index', {
  title: 'Build Monitor'
}));
app.use(express.static(path.join(__dirname, 'public')));

if ('development' === app.get('env')) {
  app.use(errorhandler());
}

// run express
let server = http.createServer(app),
  io = socketio.listen(server);

server.listen(
  app.get('port'), () => console.log(`node-build-monitor is listening on port ${app.get('port')}`));

// run socket.io
io.sockets.on('connection', socket => {
  socket.emit('settingsChanged', {
    version: require('../package').version
  });

  socket.emit('buildsLoaded', monitor.currentBuilds);
});

// configure monitor
import Monitor from './monitor';
let monitor = new Monitor();

for (let serviceConfig of config.services) {
  let service = new(require('./services/' + serviceConfig.name))();

  service.configure(serviceConfig.configuration);

  monitor.watchOn(service);
}

monitor.configure(config.monitor);

monitor.on(
  'buildsChanged',
  changes => io.emit('buildsChanged', changes));

monitor.run();
