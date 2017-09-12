var request = require('../requests');

module.exports = function () {
    var self = this,
        makeUrl = function (url, odata) {
            var baseUrl = self.configuration.url + '/_apis/build' + url;

            if (odata) {
                baseUrl += '?' + odata;
            }

            return baseUrl;
        },
        makeRequest = function (url, callback) {
          request.makeRequest({
            authentication: self.configuration.authentication,
            url: url,
            username: self.configuration.username,
            password: self.configuration.password,
            headers: {Accept: 'application/json'}
          }, callback);
        },
        parseDate = function (dateAsString) {
            return dateAsString ? new Date(dateAsString) : null;
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
        getStatus = function (statusText, resultText) {
            if (statusText === "completed" && resultText === "succeeded") return "Green";
            if (statusText === "completed" && resultText === "failed") return "Red";
            if (statusText === "completed" && resultText === "canceled") return "Gray";
            if (statusText === "inProgress") return "Blue";
            if (statusText === "stopped") return "Gray";

            return "'#FFA500'";
        },
        getStatusText = function (statusText, resultText) {
            if (statusText === "completed" && resultText === "succeeded") return "Succeeded";
            if (statusText === "completed" && resultText === "failed") return "Failed";
            if (statusText === "inProgress") return "In Progress";
            if (statusText === "stopped") return "Stopped";

            return statusText + "/" + resultText;
        },
        simplifyBuild = function (res) {
            return {
                id: res.id,
                project: res.project.name,
                definition: res.definition.name,
                number: res.buildNumber,
                isRunning: !res.finishTime,
                startedAt: parseDate(res.startTime),
                finishedAt: parseDate(res.finishTime),
                requestedFor: res.requestedFor.displayName,
                statusText: getStatusText(res.status, res.result),
                status: getStatus(res.status, res.result),
                reason: res.reason,
                hasErrors: !isNullOrWhiteSpace(res.Errors),
                hasWarnings: !isNullOrWhiteSpace(res.Warnings),
                url: res._links.web.href
            };
        },
        queryBuilds = function (callback) {
            makeRequest(makeUrl('/Builds', '$top=30'), function (error, body) {
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
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
