var request = require('request'),
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
    },
    makeRequest = function (requestWithDefaults, url, callback) {
        requestWithDefaults({
            'url': url,
            'headers': { 'Accept': 'application/json' }
            },
            function(error, response, body) {
              if (error || response.statusCode !== 200) {
                callback(error || true);
                return;
              }

              try {
                var json = JSON.parse(body);
                callback(error, json);
              } catch (e) {
                callback (e);
              }
        });
    };

module.exports = function () {
    var self = this,
      requestWithDefaults,
        requestBuilds = function (callback) {
            makeRequest(requestWithDefaults, self.configuration.url + '/job/' + self.configuration.job + '/api/json', function(error, data) {
                if (error) {
                  callback(error);
                  return;
                }

                callback(error, data.builds);
            });
        },
        requestBuild = function (build, callback) {
            makeRequest(requestWithDefaults, self.configuration.url + '/job/' + self.configuration.job + '/' + build.number + '/api/json', function(error, data) {
                if (error) {
                  callback(error);
                  return;
                }

                callback(error, simplifyBuild(data));
            });
        },
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
        parseDate = function (dateAsString) {
            return new Date(dateAsString);
        },
        getStatus = function (build) {
	    if (build.building) return "Blue";
	    var result = build.result;
            if (result === 'FAILURE') return "Red";
            if (result === 'SUCCESS') return "Green";
            if (result === 'UNSTABLE') return "#ffa500";
            if (result === 'NOT_BUILT') return "Blue";
            if (result === 'ABORTED') return "Gray";
            if (result === null) return "Blue";

            return null;
	},
        getStatusText = function (build) {
	    if (build.building) return "Running";
	    var result = build.result;
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
                status: getStatus(res),
                statusText: getStatusText(res),
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

        requestWithDefaults = request.defaults(makeRequestConfiguration(self.configuration));
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
