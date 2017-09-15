var request = require('../requests'),
    async = require('async'),
    moment = require('moment'),
    TEAMCITY_DATE_FORMAT = 'YYYYMMDDTHHmmss+Z';

module.exports = function () {
    var self = this,
        selectMany = function (array, selector) {
            return array.map(selector).reduce(function (x, y) { return x.concat(y); }, []);
        },
        getBuildsUrl = function(status) {
            var url =  self.configuration.url +
                '/httpAuth/app/rest/buildTypes/id:' + self.configuration.buildConfigurationId +
                '/builds';
            var locators = [];
            if(self.configuration.branch) {
                locators.push('branch:' + self.configuration.branch);
            }
            if(status) {
                locators.push(status + ':true');
            }
            if(locators.length > 0) {
                url = url + '?locator=' + locators.join(',');
            }
            return url;
        },
        getFinishedBuildsUrl = function () {
            return getBuildsUrl();
        },
        getCanceledBuildsUrl = function () {
            return getBuildsUrl('canceled');
        },
        getRunningBuildsUrl = function () {
            return getBuildsUrl('running');
        },
        getHrefUrl = function (url) {
            return self.configuration.url + url;
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
        requestBuilds = function (callback) {
            var requestFinishedBuilds = makeRequest.bind(this, getFinishedBuildsUrl());
            var requestCanceledBuilds = makeRequest.bind(this, getCanceledBuildsUrl());
            var requestRunningBuilds = makeRequest.bind(this, getRunningBuildsUrl());

            async.parallel([
                requestFinishedBuilds,
                requestRunningBuilds,
                requestCanceledBuilds
            ], function (error, data) {
                if (error) {
                  callback(error);
                  return;
                }

                var merged = selectMany(data, function (x) { return x.build || []; });
                callback(error, merged);
            });
        },
        requestLastCommitDetails = function(build, callback) {
            if(build.lastChanges && build.lastChanges.change && build.lastChanges.change[0]) {
                makeRequest(getHrefUrl(build.lastChanges.change[0].href), function(error, data) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    build.lastCommit = data;
                    callback(error, build);
                });
            } else {
                callback(null, build);
            }
        },
        requestBuild = function (build, callback) {
            async.waterfall([
                function(callback) {
                    makeRequest(getHrefUrl(build.href), callback);
                },
                requestLastCommitDetails
            ], function(error, build) {
                if(error){
                    callback(error);
                    return;
                }
                callback(error, simplifyBuild(build));
            });
        },
        queryBuilds = function (callback) {
            requestBuilds(function (error, body) {
                async.map(body, requestBuild, function (error, results) {
                    callback(error, results);
                });
            });
        },
        parseStartDate = function (build) {
            return moment(build.startDate, TEAMCITY_DATE_FORMAT).toDate();
        },
        parseFinishDate = function (build) {
            if (build.finishDate) {
                return moment(build.finishDate, TEAMCITY_DATE_FORMAT).toDate();
            }

            return null;
        },
        getStatus = function (build) {
            if (build.running) return "Blue";
            if (build.canceledInfo) return "Gray";

            if (build.status === "SUCCESS") return "Green";
            if (build.status === "FAILURE") return "Red";
            if (build.status === "ERROR") return "Red";
            if (build.status === "UNKNOWN") return "Gray";

            return null;
        },
        getStatusText = function (build) {
            if (build.running) return "Running";
            if (build.canceledInfo) return "Canceled";

            if (build.status === "SUCCESS") return "Success";
            if (build.status === "FAILURE") return "Failure";
            if (build.status === "ERROR") return "Error";
            if (build.status === "UNKNOWN") return "Unknown";

            return null;
        },
        getCommitMessage = function (build) {
            if(build.lastCommit) {
                return build.lastCommit.comment;
            }
            return null;
        },
        getRequestedBy = function (build) {
            if(build.lastCommit) {
                return build.lastCommit.username;
            }
            return null;
        },
        simplifyBuild = function (res) {
            return {
                id: res.buildTypeId + '|' + res.number,
                project: res.buildType.projectName,
                definition: res.buildType.name + '|' + res.branchName,
                number: res.number,
                isRunning: res.running === true,
                startedAt: parseStartDate(res),
                finishedAt: parseFinishDate(res),
                requestedFor: getRequestedBy(res),
                statusText: getStatusText(res),
                status: getStatus(res),
                reason: getCommitMessage(res),
                hasErrors: false,
                hasWarnings: false,
                url: self.configuration.url.replace(/(https?):\/\/([\w]*:[\w]*@)/, '$1://') + '/viewLog.html?buildId=' + res.id + '&buildTypeId=' + res.buildTypeId
            };
        };

    self.configure = function (config) {
        self.configuration = config;
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
