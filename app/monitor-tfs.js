var request = require('request'),
    configuration,
    makeUrl = function (url, odata) {
        var baseUrl = configuration.server + '/' + configuration.collection + url;

        if (odata) {
            baseUrl += '?' + odata;
        }

        return baseUrl;
    },
    makeRequest = function (url, callback) {
        request({ 
            'url': url,
            'rejectUnauthorized': false,
            'headers': { 'Accept': 'application/json' },
            'json' : true,
            'auth': { 'user': configuration.user, 'pass': configuration.password }
            },
            function(error, response, body) {
                callback(body);
        });
    },
    parseDate = function (dateAsString) {
        return new Date(parseInt(dateAsString.substr(6)));
    },
    forEachResult = function (body, callback) {
        for (var i = 0; i < body.d.results.length; i++) {
            callback(body.d.results[i]);
        }
    },
    isNullOrWhiteSpace = function (string) {
        if(!string) {
            return true;
        }

        return string === null || string.match(/^ *$/) !== null;
    },
    simplifyBuild = function (res) {
        return {
            project: res.Project,
            definition: res.Definition,
            number: res.Number,
            isRunning: !res.BuildFinished,
            startedAt: parseDate(res.StartTime),
            finishedAt: parseDate(res.FinishTime),
            requestedFor: res.RequestedFor,
            status: res.Status,
            reason: res.Reason,
            hasErrors: !isNullOrWhiteSpace(res.Errors),
            hasWarnings: !isNullOrWhiteSpace(res.Warnings)
        };
    },
    queryBuildIds = function (callback) {
        makeRequest(makeUrl('/Builds', '$top=12&$orderby=StartTime%20desc&$select=Project,Number,Status'), function (body) {
            var builds = [];
            
            forEachResult(body, function (res) {
                builds.push(res.Project + '_' + res.Number + '_' + res.Status);
            });

            callback(builds.join('|'));
        });
    },
    queryBuilds = function (callback) {
        var builds = [];
        makeRequest(makeUrl('/Builds', '$top=12&$orderby=StartTime%20desc'), function (body) {
            forEachResult(body, function (res) {
                builds.push(simplifyBuild(res));
            });

            callback(builds);
        });
    };

exports.configure = function (config) {
    configuration = config;
};

exports.check = function (callback) {
    queryBuilds(callback);
};