var request = require('request');

module.exports = function () {
    var self = this,
        getRequestHeaders = function () {
            if (typeof process.env.SHIPPABLE_API_TOKEN !== 'undefined') {
                self.configuration.token = process.env.SHIPPABLE_API_TOKEN;
            }
            return {
                'Accept': 'application/json',
                'Authorization': 'apiToken ' + self.configuration.token
            };
        },
        makeUrl = function () {
            var url = self.configuration.url + '/runs?sortBy=createdAt&sortOrder=-1';
            if (self.configuration.projects) {
                url += '&projectIds=' + self.configuration.projects;
            }
            if (self.configuration.branch) {
                url += '&branch=' + self.configuration.branch;
            }
            if (self.configuration.limit) {
                url += '&limit=' + self.configuration.limit;
            }

            return url;
        },
        makeRequest = function (url, callback) {
            request({
                    headers: getRequestHeaders(),
                    url: url,
                    json: true
                },
                function (error, response, body) {
                    if (error) {
                        callback(error);
                        return;
                    }

                    callback(error, body);
                });
        },
        parseDate = function (dateAsString) {
            return new Date(dateAsString);
        },
        forEachResult = function (body, callback) {
            for (var i = 0; i < body.length; i++) {
                callback(body[i]);
            }
        },
        getStatus = function (statusCode) {
            switch (statusCode) {
                case 20: // Processing
                    return 'Blue';
                case 30: // Success
                    return 'Green';
                case 70: // Cancelled
                    return '#FFA500';
                case 60: // Timeout
                case 80: // Failed
                    return 'Red';
                default:
                    return 'Gray';
            }
        },
        simplifyBuild = function (res) {
            return {
                id: res.id,
                project: res.projectName,
                number: res.runNumber,
                isRunning: res.endedAt === null,
                startedAt: parseDate(res.startedAt),
                finishedAt: parseDate(res.endedAt),
                requestedFor: res.triggeredBy.displayName,
                status: getStatus(res.statusCode),
                statusText: res.lastCommitShortDescription,
                reason: res.branchName,
                hasErrors: false,
                hasWarnings: false,
                branch: res.branchName,
            };
        },
        queryBuilds = function (callback) {
            makeRequest(makeUrl(), function (error, body) {
                if (error) {
                    callback(error);
                    return;
                }

                var builds = [];

                forEachResult(body, function (res) {
                    builds.push(simplifyBuild(res));
                });

                callback(error, builds);
            });
        };

    self.configure = function (config) {
        self.configuration = config;
        self.configuration.url = self.configuration.url || 'https://api.shippable.com';
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
