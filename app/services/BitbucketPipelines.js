var request = require('../requests');

module.exports = function () {
    var self = this,
        makeUrl = function () {
            return 'https://api.bitbucket.org/2.0/repositories/' + self.configuration.username + '/' + self.configuration.slug + '/pipelines/?sort=-created_on&pagelen=1';
        },
        makeBasicAuthToken = function() {
           return Buffer.from(self.configuration.username + ':' + self.configuration.apiKey).toString('base64');
        },
        makeRequest = function (url, callback) {
          request.makeRequest({
            url: url,
            headers: {Authorization: 'Basic ' + makeBasicAuthToken()}
          }, callback);
        },
        parseDate = function (dateAsString) {
            return dateAsString ? new Date(dateAsString) : null;
        },
        forEachResult = function (body, callback) {
            for (var i = 0; i < body.values.length; i++) {
                callback(body.values[i]);
            }
        },
        getStatus = function (statusText, resultText) {
            if (statusText === "COMPLETED" && resultText === "SUCCESSFUL") return "Green";
            if (statusText === "COMPLETED" && resultText === "FAILED") return "Red";
            if (statusText === "COMPLETED" && resultText === "STOPPED") return "Gray";
            if (statusText === "PENDING") return "'#FFA500'";
            if (statusText === "IN_PROGRESS") return "Blue";
        },
        getStatusText = function (statusText, resultText) {
          if (statusText === "COMPLETED" && resultText === "SUCCESSFUL") return "Succeeded";
          if (statusText === "COMPLETED" && resultText === "FAILED") return "Failed";
          if (statusText === "COMPLETED" && resultText === "STOPPED") return "Stopped";
          if (statusText === "PENDING") return "Pending";
          if (statusText === "IN_PROGRESS") return "In Progress";

          return statusText;
        },
        simplifyBuild = function (res) {
            return {
                id: res.uuid,
                project: res.repository.name,
                number: res.build_number,
                isRunning: !res.completed_on,
                startedAt: parseDate(res.created_on),
                finishedAt: parseDate(res.completed_on),
                requestedFor: res.creator.display_name,
                statusText: getStatusText(res.state.name, (res.state.result || {}).name),
                status: getStatus(res.state.name, (res.state.result || {}).name),
                url: res.repository.links.self.href
            };
        },
        queryBuilds = function (callback) {
            makeRequest(makeUrl(), function (error, body) {
                if (error || body.type === 'error') {
                  callback(error || body.error);
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
