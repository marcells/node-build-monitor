var request = require('../requests');

module.exports = function () {
    var self = this,
        makeUrl = function (url, odata) {
            var baseUrl = 'https://tfsodata.visualstudio.com/' + self.configuration.collection + url;

            if (odata) {
                baseUrl += '?' + odata;
            }

            return baseUrl;
        },
        makeRequest = function (url, callback) {
          request.makeRequest({
            authentication: self.configuration.authentication,
            url: self.configuration.tfsProxyUrl || tryGetTfsProxyUrlOfDocker(),
            username: self.configuration.accountname + '\\' + self.configuration.username,
            password: self.configuration.password,
            headers: {Accept: 'application/json'}
          }, callback);
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
        getStatus = function (statusText) {
            if (statusText === "Succeeded") return "Green";
            if (statusText === "Failed") return "Red";
            if (statusText === "InProgress") return "Blue";
            if (statusText === "Stopped") return "Gray";
            if (statusText === "PartiallySucceeded") return "'#FFA500'";

            return null;
        },
        simplifyBuild = function (res) {
            return {
                id: res.Project + '|' + res.Definition + '|' + res.Number,
                project: res.Project,
                definition: res.Definition,
                number: res.Number,
                isRunning: !res.BuildFinished,
                startedAt: parseDate(res.StartTime),
                finishedAt: parseDate(res.FinishTime),
                requestedFor: res.RequestedFor,
                statusText: res.Status,
                status: getStatus(res.Status),
                reason: res.Reason,
                hasErrors: !isNullOrWhiteSpace(res.Errors),
                hasWarnings: !isNullOrWhiteSpace(res.Warnings)
            };
        },
        queryBuilds = function (callback) {
            makeRequest(makeUrl('/Builds', '$top=12&$orderby=StartTime%20desc'), function (error, body) {
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
