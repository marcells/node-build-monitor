var request = require('request'),
    configuration,
    requestBuilds = function (callback) {
        request({ 
            'url': 'https://api.travis-ci.org/repos/' + configuration.slug + '/builds',
            'json' : true
            },
            function(error, response, body) {
                callback(body);
        });
    },
    parseDate = function (dateAsString) {
        return new Date(dateAsString);
    },
    getStatus = function (result, state) {
        if (state === 'started') return "Blue";
        if (state === 'canceled') return "Gray";
        if (result === null || result === 1) return "Red";
        if (result === 0) return "Green";
        
        return null;
    },
    simplifyBuild = function (res) {
        return {
            id: configuration.slug + '|' + res.number,
            project: configuration.slug,
            definition: 'TODO',
            number: res.number,
            isRunning: res.state === 'started',
            startedAt: parseDate(res.started_at),
            finishedAt: parseDate(res.finished_at),
            requestedFor: 'TODO',
            status: getStatus(res.result, res.state),
            statusText: res.state,
            reason: res.event_type,
            hasErrors: false,
            hasWarnings: false
        };
    },
    queryBuilds = function (callback) {
        requestBuilds(function (body) {
            callback(body.map(simplifyBuild));
        });
    };

exports.configure = function (config) {
    configuration = config;
};

exports.check = function (callback) {
    queryBuilds(callback);
};