var request = require('request'),
    async = require('async');

module.exports = function () {
    var self = this,
        getRequestHeaders = function () { // build request header
            if (typeof process.env.BUILDBUDDY_ACCESS_TOKEN !== 'undefined') {
                self.configuration.access_token = process.env.BUILDBUDDY_ACCESS_TOKEN;
            }
            return {
                'ACCESS-TOKEN': self.configuration.access_token,
                'Authorization': 'Bearer ' + self.configuration.access_token,
                'accept-encoding': 'application/json'
            };
        },
        makeUrl = function (app_id, build_id, branch, baseUrl) { //assemble url with designated branch id
            if (build_id) { // to query one build provide a build_id
                baseUrl += '/' + build_id;
            } else if (app_id) { // to get lastest build provide app_id but no build_id
                baseUrl += "/" + app_id + "/build/latest?branch=" + branch;
            }

            return baseUrl;
        },
        makeRequest = function (url, callback) { //make http request to BuildBuddy API
            request({
                    headers: getRequestHeaders(),
                    url: url,
                    json: true
                },
                function (error, response, body) {
                    if (error) {
                      callback(error);
                      return;
                    }

                    if (response.statusCode === 500) {
                      callback(new Error(response.statusMessage));
                      return;
                    }

                    callback(error, body);
                });
        },
        parseDate = function (dateAsString) {
            return new Date(dateAsString);
        },
        forEachResult = function (body, callback) {

            callback(body);

        },
        forEachApp = function (body, callback) {
          for (var i = 0; i < body.length; i++) {
            callback(body[i]);
          }

        },
        isNullOrWhiteSpace = function (string) {
            if (!string) {
                return true;
            }

            return string === null || string.match(/^ *$/) !== null;
        },
        getStatus = function (statusText) {
            switch (statusText) {
                case "success":
                    return "Green";
                case "failed":
                    return "Red";
                case "running":
                    return "Blue";
                case "stopped":
                    return "Red";
                case "queued":
                    return "Blue";
                case "canceled":
                    return "#FFA500";
                default:
                    return "Gray";
            }
        },
        parseLink = function (appId, buildId) { // point to the build
            return 'https://dashboard.buddybuild.com/apps/' + appId + '/build/' + buildId;
        },
        simplifyBuild = function (app, res) {
            return {
                id: res._id,
                platform: app ? app.platform : self.configuration.project_name,
                project: app ? app.app_name : self.configuration.project_name + ': ' + res.commit_info.branch,
                number: 'Build: ' + res.build_number,
                isRunning: res.BuildFinished,
                startedAt: parseDate(res.started_at),
                finishedAt: parseDate(res.finished_at),
                requestedFor: res.commit_info.author,
                statusText: res.build_status,
                status: getStatus(res.build_status),
                reason: res.commit_info.message,
                finished: res.finished,
                hasErrors: !isNullOrWhiteSpace(res.Errors),
                hasWarnings: !isNullOrWhiteSpace(res.Warnings),
                branch: res.commit_info.branch,
                url: parseLink(res.app_id, res._id)
            };
        },
        queryBuilds = function (callback) { // query the build
            makeRequest(makeUrl(self.configuration.app_id, self.configuration.build_id, self.configuration.branch, self.configuration.url), function (error, body) {
                if (error) {
                  callback(error);
                  return;
                }

                var builds = [];

                forEachResult(body, function (res) {
                    builds.push(simplifyBuild(null, res));
                });

                callback(error, builds);
            });
        },
        queryBuildsAsync = function (app) { // query the build
          return new Promise(function (resolve, reject) {
            makeRequest(makeUrl(app._id, null, self.configuration.branch, self.configuration.url), function (error, body) {
              if (error) {
                reject(error);
                return;
              }
              resolve(simplifyBuild(app, body));
            });
          });
        },
        queryAllAppBuilds = function (callback) { // query the build
          makeRequest(makeUrl(null, null, self.configuration.branch, self.configuration.url), function (error, body) {
            if (error) {
              callback(error);
              return;
            }
            var asyncBuildsQuery = body.map(function (app) {
              return queryBuildsAsync(app);
            });

            Promise.all(asyncBuildsQuery).then(function (builds) {
              callback(error, builds);
            });
          });
        };

    self.configure = function (config) {
        self.configuration = config;
    };

    self.check = function (callback) {
        if (self.configuration.app_id) {
          console.log('Fetching builds for app : ' + self.configuration.app_id);
          queryBuilds(callback);
        } else {
          console.log('app_id not specified, fetching builds for all apps ...');
          queryAllAppBuilds(callback);
        }
    };

    self.makeURL = function (app_id, build_id, branch, url) {
        return makeUrl(app_id, build_id, branch, url);
    };

    self.getHeaders = function (access_token) {
        self.configuration.access_token = access_token;
        return getRequestHeaders();
    };

    self.getStatus = function (statusText) {
        "use strict";
        return getStatus(statusText);
    };
};
