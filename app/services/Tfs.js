var request = require('../requests');

module.exports = function () {
    var self = this,
        makeUrl = function (url, params) {
            var baseUrl = 'https://' + self.configuration.pat + '@' + self.configuration.accountname + '.visualstudio.com/' + self.configuration.accountname + '/_apis/build/builds?api-version=4.1-preview';

            if (self.configuration.queryparams)
            {
                baseUrl += self.configuration.queryparams;
                
            }
            if (params) {
                baseUrl += params;
            }
            return baseUrl;
        },
        makeRequest = function (url, callback) {
          request.makeRequest({
            url: url,
            headers: {Accept: 'application/json'}
          }, callback);
        },
        parseDate = function (dateAsString) {
            if (dateAsString == null) return null;
            return new Date(dateAsString);
        },
        forEachResult = function (body, callback) {
            for (var i = 0; i < body.value.length; i++) {
                callback(body.value[i]);
            }
        },
        isNullOrWhiteSpace = function (string) {
            if(!string) {
                return true;
            }

            return string === null || string.match(/^ *$/) !== null;
        },
        getStatus = function (statusText) {
            if (statusText === "succeeded") return "Green";
            if (statusText === "failed") return "Red";
            if (statusText === "inProgress") return "Blue";
            if (statusText === "stopped") return "Gray";
            if (statusText === "partiallySucceeded") return "'#FFA500'";

            return null;
        },
        simplifyBuild = function (res) {
            return {
                id: res.project.name + '|' + res.definition.name + '|' + res.buildNumber,
                project: res.project.name,
                definition: res.definition.name,
                number: res.buildNumber,
                isRunning: res.result=='inProgress',
                startedAt: parseDate(res.startTime),
                finishedAt: parseDate(res.finishTime),
                requestedFor: res.requestedFor.displayName,
                statusText: (typeof res.result === 'undefined' || res.result==null)?res.status:res.result,
                status: getStatus((typeof res.result === 'undefined' || res.result==null)?res.status:res.result),
                reason: res.reason,
                url: res._links.web.href,
                hasErrors: !isNullOrWhiteSpace(res.errors),
                hasWarnings: !isNullOrWhiteSpace(res.warnings)
            };
        },
        queryBuilds = function (callback) {
            makeRequest(makeUrl(null, null), function (error, body) {
                if (error) {
                  callback(error);
                  return;
                }

                if (body.error) {
                  callback(new Error(body.error.message.value));
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
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
