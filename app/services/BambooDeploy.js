var request = require('request'),
    async = require('async'),
    striptags = require('striptags'),
    _ = require('lodash');


module.exports = function () {
    var self = this,
        queryBuilds = function (callback) {
            fetchDeployments(function (error, body) {
                if (error) {
                    callback(error);
                    return;
                }

                async.map(body, fetchDeployment, function (error, results) {
                    callback(error, results);
                });
            });
        },
        fetchDeployments = function (callback) {
            const url = self.configuration.url+ "/rest/api/latest/deploy/dashboard/"+self.configuration.projectId; 
            const requestParam = {
                uri: url,
                qs: {
                    'os_authType': 'basic'
                },
                headers: { 'cache-control': 'no-cache' },
                json: true
            };
            request(requestParam, function (error, response, body) {
                try {
                    callback(error, body);
                } catch (parseError) {
                    callback(parseError, null);
                }
            });
        },
        fetchDeployment = function (build, callback) {
            const url = self.configuration.url+ "/rest/api/latest/deploy/dashboard/"+self.configuration.projectId;
            const requestParam = {
                uri: url,
                qs: {
                    'os_authType': 'basic'
                },
                headers: { 'cache-control': 'no-cache' },
                json: true
            };
            request(requestParam, function (error, response, body) {
                if (error) {
                    callback(error);
                    return;
                }
                try {
                    let result = parseDeployResponse(body);
                    callback(error, result.filter(r => r.environmentName === self.configuration.environmentName)[0]);
                } catch (parseError) {
                    callback(parseError, null);
                }
            });
        },
        parseDeployResponse = function(res){
            return _.flatMap(res, ({ environmentStatuses, deploymentProject }) =>
            _.map(environmentStatuses, ({ environment, deploymentResult }) =>
              ({
                id: self.configuration.slug + '|' + deploymentResult.id,
                project: environment.name + ' ➜ ' + deploymentProject.name + ' [' + deploymentResult.deploymentVersionName + ']',
                number: deploymentResult.key.resultNumber,
                isRunning: !deploymentResult.finishedDate,
                startedAt: deploymentResult.startedDate,
                finishedAt: deploymentResult.finishedDate,
                requestedFor: getAuthors(deploymentResult.reasonSummary),
                status: getStatus(deploymentResult.deploymentState, deploymentResult.lifeCycleState),
                statusText: deploymentResult.deploymentState,
                reason: striptags(deploymentResult.reasonSummary),
                hasErrors: 'SUCCESS' !== deploymentResult.deploymentState,
                hasWarnings: 'SUCCESS' !== deploymentResult.deploymentState,
                url: self.configuration.url + "/deploy/viewDeploymentResult.action?deploymentResultId="+deploymentResult.id,
                environmentName: environment.name
              })
            )
           );
        },
        getAuthors = function (reason) {
            var urlRegex = /<a[^>]*>([\s\S]*?)<\/a>/g;
            var links = reason.match(urlRegex);
            if (links !== null) {
                return links.map(
                    function (url) {
                        return striptags(url);
                    }
                ).join(', ');
            }
            return 'System';
        },
        getStatus = function (state, lifeCycleState) {
            if (state === 'STARTED') return "Blue";
            if (state === 'FINISHED') return "Blue";
            if (state === 'CANCELLED') return "Gray";
            if (state === 'FAILED') return "Red";
            if (state === 'UNKNOWN') {
                if (lifeCycleState === 'NOT_BUILT') return 'Gray';
                if (lifeCycleState === 'IN_PROGRESS') return '#FF8C00';  // dark orange
            }
            return "Green";
        };

    self.cache = {
        expires: 0,
        projects: {}
    };

    self.configure = function (config) {
        self.configuration = config;

        if (config.username && config.password) {
            var protocol = config.url.match(/(^|\s)(https?:\/\/)/i);
            if (Array.isArray(protocol)) {
                protocol = protocol[0];
                var url = config.url.substr(protocol.length);
                host = protocol + config.username + ":" + config.password + "@" + url;
            }
        }
        self.configuration.url = host || config.url;
    };

    self.check = function (callback) {
        queryBuilds(callback);
    };
};
