var request = require('request'),
    async = require('async'),
    moment = require('moment'),
    TEAMCITY_DATE_FORMAT = 'YYYYMMDDTHHmmss+Z';

module.exports = function () {
    var self = this,
        selectMany = function (array, selector) {
            return array.map(selector).reduce(function (x, y) { return x.concat(y); }, []);
        },
        getFinishedBuildsUrl = function () {
            return self.configuration.url +
                '/httpAuth/app/rest/buildTypes/id:' + self.configuration.buildConfigurationId +
                '/builds';
        },
        getCanceledBuildsUrl = function () {
            return getFinishedBuildsUrl() + '?locator=canceled:true';
        },
        getRunningBuildsUrl = function () {
            return getFinishedBuildsUrl() + '?locator=running:true';
        },
        getBuildDetailsUrl = function (url) {
            return self.configuration.url + url;
        },
        makeRequest = function (url, callback) {
            request({ 
                'url': url,
                'rejectUnauthorized': false,
                'headers': { 'Accept': 'application/json' },
                'json' : true
                },
                function(error, response, body) {
                    callback(error, body);
            });
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
                var merged = selectMany(data, function (x) { return x.build || []; });
                callback(error, merged);
            });
        },
        requestBuild = function (build, callback) {
            makeRequest(getBuildDetailsUrl(build.href), function(error, data) {
                callback(null, simplifyBuild(data));
            });
        },
        queryBuilds = function (callback) {
            requestBuilds(function (error, body) {
                async.map(body, requestBuild, function (error, results) {
                    callback(results);
                });
            });
        },
        parseStartDate = function (build) {
            return moment(build.startDate, 'YYYYMMDDTHHmmss+Z').toDate();
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
        getRequestedFor = function (build) {
            if(build.triggered.type === 'user' && build.triggered.user) {
                return build.triggered.user.username;
            } else if (build.triggered.type === 'vcs') {
                return build.triggered.details;
            }

            return null;
        },
        simplifyBuild = function (res) {
            return {
                id: res.buildTypeId + '|' + res.number,
                project: res.buildType.projectName,
                definition: res.buildType.name,
                number: res.number,
                isRunning: res.running === true,
                startedAt: parseStartDate(res),
                finishedAt: parseFinishDate(res),
                requestedFor: getRequestedFor(res),
                statusText: getStatusText(res),
                status: getStatus(res),
                reason: res.triggered.type,
                hasErrors: false,
                hasWarnings: false
            };
        };

    self.configure = function (config) {
        self.configuration = config;
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};