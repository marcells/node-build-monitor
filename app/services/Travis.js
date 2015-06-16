var request = require('request'),
    async = require('async');

module.exports = function () {
    var self = this,
        requestBuilds = function (callback) {
            request({
                'url': 'https://api.' + self.configuration.url + '/repos/' + self.configuration.slug + '/builds?access_token=' + self.configuration.token,
                'json' : true
                },
                function(error, response, body) {
                    callback(body);
            });
        },
        queryBuilds = function (callback) {
            requestBuilds(function (body) {
                if (!body) {
                    callback([]);
                } else {
                    async.map(body, requestBuild, function (err, results) {
                        callback(results);
                    });
                }
            });
        },
        requestBuild = function (build, callback) {
            request({
                'url': 'https://api.' + self.configuration.url + '/repos/' + self.configuration.slug + '/builds/' + build.id + '?access_token=' + self.configuration.token,
                'json' : true
                },
                function(error, response, body) {
                    callback(error, simplifyBuild(body));
            });
        },
        parseDate = function (dateAsString) {
            return new Date(dateAsString);
        },
        getStatus = function (result, state) {
            if (state === 'started') return "Blue";
            if (state === 'created') return "Blue";
            if (state === 'canceled') return "Gray";
            if (result === null || result === 1) return "Red";
            if (result === 0) return "Green";

            return null;
        },
        simplifyBuild = function (res) {
            return {
                id: self.configuration.slug + '|' + res.number,
                project: self.configuration.slug,
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
                url: 'https://' + self.configuration.url + '/' + self.configuration.slug + '/builds/' + res.id
            };
        };

    self.configure = function (config) {
        self.configuration = config;

        self.configuration.url = self.configuration.url || 'travis-ci.org';
        self.configuration.token = self.configuration.token || '';
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
