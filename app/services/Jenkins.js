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
        flatten = function(arrayOfArray) {
            return [].concat.apply([], arrayOfArray);
        },
        requestBuildsForJob = function (job, callback) {
            requestBuildsForJobByUrl(job, self.configuration.url + '/job/' + job, callback);
        },
        requestBuildsForJobByUrl = function (job, url, callback) {
            if (url.substr(url.length - 1, 1) !== '/') {
                url = url + '/';
            }
            makeRequest(requestWithDefaults, url + 'api/json', function(error, data) {
                if (error) {
                    callback(error);
                    return;
                }

                if (typeof self.configuration.numberOfBuildsPerJob !== 'undefined') {
                    data.builds = data.builds.slice(0, self.configuration.numberOfBuildsPerJob);
                }

                data.builds.forEach(function (build) {
                    build.jobId = job;
                });

                callback(error, data.builds);
            });
        },
        requestBuild = function (build, callback) {
            makeRequest(requestWithDefaults, self.configuration.url + '/job/' + build.jobId + '/' + build.number + '/api/json', function(error, data) {
                if (error) {
                    callback(error);
                    return;
                }

                data.jobId = build.jobId;

                callback(error, simplifyBuild(data));
            });
        },
        requestJobsForView = function (viewId, callback) {
            makeRequest(requestWithDefaults, self.configuration.url + '/view/' + viewId + '/api/json', function(error, data) {
                if (error) {
                    callback(error);
                    return;
                }

                callback(error, data.jobs);
            });
        },
        queryBuildsForJob = function (jobId, callback) {
            requestBuildsForJob(jobId, function (error, body) {
                if (error) {
                    callback(error);
                    return;
                }

                async.map(body, requestBuild, function (error, results) {
                    callback(error, results);
                });
            });
        },
        queryBuildsForView = function (viewId, callback) {
            requestJobsForView(viewId, function (error, body) {
                if (error) {
                  callback(error);
                  return;
                }

                async.map(body, function (job, callback) {
                    queryBuildsForJob(job.name, callback);
                }, function (error, results) {
                    callback(error, flatten(results));
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
                id: res.jobId + '|' + res.id,
                project: res.jobId,
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
                url: self.configuration.url + '/job/' + res.jobId + '/' + res.number
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
        if (self.configuration.view) {
            queryBuildsForView(self.configuration.view, callback);
        } else {
            queryBuildsForJob(self.configuration.job, callback);
        }
    };
};
