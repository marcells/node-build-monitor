var request = require('../requests');

module.exports = function () {
    var self = this,
        tryGetTfsProxyUrlOfDocker = function () {
            return 'http://' +
                process.env.TFS_PROXY_PORT_4567_TCP_ADDR +
                ':' +
                process.env.TFS_PROXY_PORT_4567_TCP_PORT +
                '/builds';
        },
        makeRequest = function (url, callback) {
          request.makeRequest({
            authentication: self.configuration.authentication,
            url: self.configuration.tfsProxyUrl || tryGetTfsProxyUrlOfDocker(),
            username: self.configuration.username,
            password: self.configuration.password,
            headers:{
              Accept: 'application/json',
              url: self.configuration.url,
              username: self.configuration.username,
              password: self.configuration.password
            }
          }, callback);
        },
        parseDate = function (dateAsString) {
            return new Date(dateAsString);
        },
        forEachResult = function (body, callback) {
            for (var i = 0; i < body.builds.length; i++) {
                callback(body.builds[i]);
            }
        },
        getStatus = function (statusText) {
            if (statusText === "Succeeded") return "Green";
            if (statusText === "Failed") return "Red";
            if (statusText === "In Progress") return "Blue";
            if (statusText === "Stopped") return "Gray";
            if (statusText === "Partially Succeeded") return "'#FFA500'";

            return null;
        },
        simplifyBuild = function (res) {
            return {
                id: res.teamProjectDefinition + '|' + res.buildDefinition + '|' + res.buildNumber,
                project: res.teamProjectDefinition,
                definition: res.buildDefinition,
                number: res.buildNumber,
                isRunning: !res.isBuildFinished,
                startedAt: parseDate(res.startTime),
                finishedAt: parseDate(res.finishTime),
                requestedFor: res.requestedFor,
                statusText: res.buildStatusText,
                status: getStatus(res.buildStatusText),
                reason: res.buildReasonText,
                hasErrors: false,
                hasWarnings: false,
                url: self.configuration.url + '/' + res.teamProjectDefinition + '/_build#buildUri=' + res.uri + '&_a=summary'
            };
        },
        queryBuilds = function (callback) {
            makeRequest(function (error, body) {
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
