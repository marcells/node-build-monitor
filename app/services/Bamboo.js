var request = require('request'),
    async = require('async'),
    striptags = require('striptags');

module.exports = function () {
    var self = this,
    queryBuilds = function (callback) {
        requestBuilds(function (error, body) {
            if (error) {
                callback(error);
                return;
            }

            async.map(body, requestBuild, function (error, results) {
                callback(error, results);
            });
        });
    },
    requestBuilds = function (callback) {
        var planUri = self.configuration.url + "/rest/api/latest/result/" + self.configuration.planKey + ".json";
        var urlParams = {
            "os_authType": "basic"
        };

        request({ uri: planUri, qs: urlParams }, function(error, response, body) {
            try {
                var bodyJson = JSON.parse(body);
                callback(error, bodyJson.results.result);
            } catch (parseError) {
                callback(parseError, null);
            }
        });
    },
    requestBuild = function (build, callback) {
        var planUri = self.configuration.url + "/rest/api/latest/result/" + self.configuration.planKey + "/" + build.number + ".json";
        var urlParams = {
            "os_authType": "basic"
        };
        request({ uri: planUri, qs: urlParams }, function(error, response, body) {
            if (error) {
                callback(error);
                return;
            }
            try {
                var bodyJson = JSON.parse(body);
                callback(error, simplifyBuild(bodyJson));
            } catch (parseError) {
                callback(parseError, null);
            }
        });
    },
    simplifyBuild = function (res) {
        return {
            id: self.configuration.slug + '|' + res.number,
            project: res.plan.shortName,
            number: res.number,
            isRunning: res.state === 'started',
            startedAt: res.buildStartedTime,
            finishedAt: res.buildCompletedTime,
            requestedFor: getAuthors(res.buildReason),
            status: getStatus(res.state),
            statusText: res.state,
            reason: striptags(res.buildReason),
            hasErrors: !res.successful,
            hasWarnings: !res.successful,
            url: self.configuration.url + '/browse/' + res.buildResultKey
        };
    },
    getAuthors = function(reason) {
        var urlRegex = /<a[^>]*>([\s\S]*?)<\/a>/g;
        var links = reason.match(urlRegex);
        if (links !== null) {
            return links.map(
                function(url) {
                    return striptags(url);
                }
            ).join(', ');
        }
        return 'System';
    },
    getStatus = function(state) {
        if (state === 'started') return "Blue";
        if (state === 'created') return "Blue";
        if (state === 'canceled') return "Gray";
        if (state === 'Failed') return "Red";
        return "Green";
    };

    self.cache = {
        expires: 0,
        projects: {}
    };

    self.configure = function (config) {
        self.configuration = config;

        if (config.username && config.password) {
            var protocol = config.url.match(/(^|\s)(https?:\/\/)/i);
            if (Array.isArray(protocol)) {
                protocol = protocol[0];
                var url = config.url.substr(protocol.length);
                host = protocol + config.username + ":" + config.password + "@" + url;
            }
        }
        self.configuration.url = host || config.url;
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
