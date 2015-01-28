var jenkinsapi = require('jenkins-api'),
    async = require('async'),
    makeRequestConfiguration = function (serviceConfiguration) {
        var tryApplyAuthHeader = function (requestConfig, key, value) {
            if (!value) return;

            requestConfig.auth = requestConfig.auth || {};
            requestConfig.auth[key] = value;
        };

        var requestConfig = serviceConfiguration.options || {};

        tryApplyAuthHeader(requestConfig, 'user', serviceConfiguration.username);
        tryApplyAuthHeader(requestConfig, 'pass', serviceConfiguration.password);

        return requestConfig;
    };

module.exports = function () {
    var self = this,
        jenkins,
        requestBuilds = function (callback) {
            jenkins.job_info(self.configuration.job, function(error, data) {
                callback(data.builds);
            });
        },
        requestBuild = function (build, callback) {
            jenkins.build_info(self.configuration.job, build.number, function(error, data) {
                callback(error, simplifyBuild(data));
            });
        },
        queryBuilds = function (callback) {
            requestBuilds(function (body) {
                async.map(body, requestBuild, function (error, results) {
                    callback(results);
                });
            });
        },
        parseDate = function (dateAsString) {
            return new Date(dateAsString);
        },
        getStatus = function (result) {
            if (result === 'FAILURE') return "Red";
            if (result === 'SUCCESS') return "Green";
            if (result === 'UNSTABLE') return "Green";
            if (result === 'NOT_BUILT') return "Blue";
            if (result === 'ABORTED') return "Gray";
            if (result === null) return "Blue";

            return null;
        },
        getStatusText = function (result) {
            if (result === 'FAILURE') return "Failure";
            if (result === 'SUCCESS') return "Success";
            if (result === 'UNSTABLE') return "Unstable";
            if (result === 'NOT_BUILT') return "Running";
            if (result === 'ABORTED') return "Aborted";
            if (result === null) return "Running";

            return null;
        },
        getRequestedFor = function (build) {
            if(build.actions) {
                for (var i = 0; i < build.actions.length; i++) {
                    var action = build.actions[i];
                    if ((action) && (action.causes)) {
                        for (var j = 0; j < action.causes.length; j++) {
                            var cause = action.causes[j];
                            if(cause && cause.userName) {
                                return cause.userName;
                            }
                        }
                    }
                }
            }

            return "Unknown";
        },
        simplifyBuild = function (res) {
            return {
                id: self.configuration.job + '|' + res.id,
                project: self.configuration.job,
                number: res.number,
                isRunning: res.building,
                startedAt: parseDate(res.timestamp),
                finishedAt: parseDate(res.timestamp + res.duration),
                requestedFor: getRequestedFor(res),
                status: getStatus(res.result),
                statusText: getStatusText(res.result),
                reason: "Build",
                hasErrors: false,
                hasWarnings: res.result == 'UNSTABLE',
                url: self.configuration.url + '/job/' + self.configuration.job + '/' + res.number
            };
        };

    self.configure = function (config) {
        self.configuration = config;

        if (self.configuration.url.indexOf('@') > -1) {
            throw new Error(
                'Breaking Configuration change:\n' +
                'To display build details, the url parameter is now published to the client. \n' +
                'This leads to a security risk, cause your credentials would also be published. \n' +
                'Please use now the \'username\' and \'password\' options. \n' +
                'More information on: https://github.com/marcells/node-build-monitor#jenkins \n\n');
        }

        jenkins = jenkinsapi.init(self.configuration.url, makeRequestConfiguration(self.configuration));
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
