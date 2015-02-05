import request from 'request';
import async from 'async';

export default function() {
  let requestBuilds = callback => {
      request({
        'url': 'https://api.travis-ci.org/repos/' + this.configuration.slug + '/builds',
        'json': true
      }, (error, response, body) => callback(body));
    },

    queryBuilds = callback => {
      requestBuilds(function(body) {
        if (!body) {
          callback([]);
        } else {
          async.map(body, requestBuild, function(err, results) {
            callback(results);
          });
        }
      });
    },

    requestBuild = (build, callback) => {
      request({
        'url': 'https://api.travis-ci.org/repos/' + this.configuration.slug + '/builds/' + build.id,
        'json': true
      }, (error, response, body) => callback(error, simplifyBuild(body)));
    },

    parseDate = dateAsString => new Date(dateAsString),

    getStatus = (result, state) => {
      if (state === 'started') return "Blue";
      if (state === 'created') return "Blue";
      if (state === 'canceled') return "Gray";
      if (result === null || result === 1) return "Red";
      if (result === 0) return "Green";

      return null;
    },

    simplifyBuild = res => {
      return {
        id: this.configuration.slug + '|' + res.number,
        project: this.configuration.slug,
        number: res.number,
        isRunning: res.state === 'started',
        startedAt: parseDate(res.started_at),
        finishedAt: parseDate(res.finished_at),
        requestedFor: res.author_name,
        status: getStatus(res.result, res.state),
        statusText: res.state,
        reason: res.event_type,
        hasErrors: false,
        hasWarnings: false,
        url: 'https://travis-ci.org/' + this.configuration.slug + '/builds/' + res.id
      };
    };

  this.configure = function(config) {
    this.configuration = config;
  };

  this.check = function(callback) {
    queryBuilds(callback);
  };
}
