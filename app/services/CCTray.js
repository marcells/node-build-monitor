// CCTray format: https://github.com/erikdoe/ccmenu/wiki/Multiple-Project-Summary-Reporting-Standard
// Sample CCTray data: https://api.travis-ci.org/repos/erikdoe/ccmenu/cc.xml

var request = require('request'),
    xml2jsParser = require('xml2js').parseString;

module.exports = function () {
    var self = this,
        getBuilds = function(callback) {
            makeRequest(self.config.url, function(err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(err, result.Projects.Project.map(function(project) {
                    return simplifyBuild(project.$);
                }));
            });
        },
        makeRequest = function (url, callback) {
            request({
                    url: url
                },
                function (error, response, body) {
                    if (error) {
                        callback(error);
                        return;
                    }

                    xml2jsParser(body, function(err, result) {
                        callback(err, result);
                    });
                });
        },
        simplifyBuild = function (res) {
            return {
                id: res.lastBuildLabel,
                project: res.name,
                number: res.lastBuildLabel,
                isRunning: isRunning(res.activity),
                startedAt: res.lastBuildTime,
                finishedAt: res.lastBuildTime,
                requestedFor: "",
                status: getBuildStatus(res),
                statusText: getBuildStatusText(res),
                reason: "",
                hasErrors: hasErrors(res.lastBuildStatus),
                hasWarnings: hasErrors(res.lastBuildStatus),
                url: res.webUrl
            };
        },
        isRunning = function(activity) {
            return activity === 'Building';
        },
        getBuildStatus = function(res) {
            if (res.activity === 'Building') {
                return 'Blue';
            } else if (res.lastBuildStatus === 'Success') {
                return 'Green';
            } else if (res.lastBuildStatus === 'Failure' || res.lastBuildStatus === 'Exception') {
                return 'Red';
            } else {
                return 'Gray';
            }
        },
        getBuildStatusText = function(res) {
            if (res.activity === 'Building') {
                return res.activity;
            } else {
                return res.lastBuildStatus;
            }
        },
        hasErrors = function(buildStatus) {
            return buildStatus === 'Failure' || buildStatus === 'Exception';
        };

    self.configure = function (config) {
        self.config = config;
    };

    self.check = getBuilds;
};
