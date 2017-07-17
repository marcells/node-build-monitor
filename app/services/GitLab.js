var request = require('request'),
    async = require('async');

var now = function() { return (new Date()).getTime(); },
    second = 1000,
    minute = second * 60;

module.exports = function () {
    var self = this;

    self.cache = {
        expires: now(),
        projects: {}
    };

    function log () {
      if (self.config.debug) {
        var msg = [new Date().toLocaleTimeString(), '| GitLab |'];
        for (var i in arguments) {
          msg.push(arguments[i]);
        }
        console.log.apply(this, msg);
      }
    }

    function getDefaultExpiration() {
        return now() + self.config.intervals.disabled;
    }

    function getProjectExpiration(project) {
        if (project.jobs_enabled !== true) {
            return getDefaultExpiration();
        } else if (!Object.keys(project.jobs).length) {
            return now() + self.config.intervals.empty;
        } else {
            return now() + self.config.intervals.default;
        }
    }

    function getBuildExpiration(job) {
        if (job.status !== 'running') {
            return getDefaultExpiration();
        } else {
            return now();
        }
    }

    function getRequestHeaders() {
        return {
             'PRIVATE-TOKEN': self.config.token
        };
    }

    function getProjectsApiUrl (page, per_page) {
        var base = self.config.url + '/',
            query = '?page=' + page + '&per_page=' + per_page + self.config.additional_query;
        return base + 'api/v4/projects' + query;
    }

    function getProjectBuildsApiUrl (project, page, per_page) {
        var base = self.config.url + '/',
            query = '?page=' + page + '&per_page=' + per_page;
        return base + 'api/v4/projects/' + project.id + '/jobs' + query;
    }

    function getBuildApiUrl (project, job) {
        var base = self.config.url + '/';
        return base + 'api/v4/projects/' + project.id + '/jobs/' + job.id;
    }

    function getBuildId (project, job) {
        return project.id + '-' + job.ref + '-' + job.stage;
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildNumber (project, build) {
        return project.name_with_namespace;
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildProject (project, job) {
        return job.ref;
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildIsRunning (project, job) {
        return (job.status === 'running' ||
                job.status === 'pending');
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildStartedAt (project, job) {
        return new Date(job.started_at);
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildFinishedAt (project, job) {
        return new Date(job.finished_at);
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildRequestedFor (project, job) {
        return job.commit && job.commit.author_name;
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildStatus (project, job) {
        switch (job.status) {
            case 'pending':
                return '#ffa500';
            case 'running':
                return 'Blue';
            case 'failed':
                return 'Red';
            case 'success':
                return 'Green';
            default:
                return 'Gray';
        }
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildStatusText (project, job) {
        return job.stage + ' ' + job.status;
    }

    //noinspection JSUnusedLocalSymbols
    function getBuildReason (project, job) {
        return job.commit && job.commit.title;

    }

    function getBuildUrl (project, job) {
        var base = self.config.url + '/';
        return base + project.path_with_namespace + '/-/jobs/' + job.id;
    }

    function getBuildMonitorBuild (project, job) {
        return {
            id: getBuildId(project, job),
            number: getBuildNumber(project, job),
            project: getBuildProject(project, job),
            isRunning: getBuildIsRunning(project, job),
            startedAt: getBuildStartedAt(project, job),
            finishedAt: getBuildFinishedAt(project, job),
            requestedFor: getBuildRequestedFor(project, job),
            status: getBuildStatus(project, job),
            statusText: getBuildStatusText(project, job),
            reason: getBuildReason(project, job),
            hasErrors: false,
            hasWarnings: false,
            url: getBuildUrl(project, job)
        };
    }

    function requestFirstPage(getPagedApiUrl, callback) {
        log('Fetching', getPagedApiUrl(1, 100));
        request({
            headers: getRequestHeaders(),
            url: getPagedApiUrl(1, 100),
            json: true
        }, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                process.nextTick(function() {
                    callback(body);
                });
            } else {
                log('Error', body);
                process.nextTick(function() {
                    callback([]);
                });
            }
        });
    }

    function requestAllPages(getPagedApiUrl, callback) {
        log('Fetching', getPagedApiUrl(1, 100));
        request({
            headers: getRequestHeaders(),
            url: getPagedApiUrl(1, 100),
            json: true
        }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                var urls = [], pages = Math.ceil(
                    parseInt(response.headers['x-total-pages'], 10));
                for (var i = 2; i <= pages; i = i + 1) {
                    urls.push(getPagedApiUrl(i, 100));
                }

                process.nextTick(function() {
                    callback(body);
                });

                async.mapSeries(urls, function(url, pass) {
                    log('Fetching', url);
                    request({
                        headers: getRequestHeaders(),
                        url: url,
                        json: true
                    }, function (err, response, body) {
                        if (!err && response.statusCode == 200) {
                            process.nextTick(function() {
                                callback(body);
                            });
                            process.nextTick(function() {
                                pass(null, body);
                            });
                        } else {
                            log('Error', body);
                            process.nextTick(function() {
                                callback([]);
                            });
                            process.nextTick(function() {
                                pass(null, []);
                            });
                        }
                    });
                });
            } else {
                log('Error', body);
                process.nextTick(function() {
                    callback([]);
                });
            }
        });
    }

    function updateBuild(project, build, callback) {
        log('Fetching', getBuildApiUrl(project, build));
        request({
            headers: getRequestHeaders(),
            url: getBuildApiUrl(project, build),
            json: true
        }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                body.monitor = getBuildMonitorBuild(project, body);
                body.expires = getBuildExpiration(body);
                project.jobs[body.monitor.id] = body;
                if (typeof callback === 'function') {
                    process.nextTick(function() {
                        callback(body);
                    });
                }
            } else {
                log('Error', body);
                if (typeof callback === 'function') {
                    process.nextTick(function() {
                        callback(build);
                    });
                }
            }
        });
    }

    function reduceBuilds(builds, callback) {
        const seen = {};
        let latest = null;

        results = builds
            .filter(build => {
                const key = build.monitor.id;
                if (typeof seen[key] === 'undefined') {
                    seen[key] = build;
                    return true;
                }
                else if (seen[key].monitor.startedAt < build.monitor.startedAt) {
                    seen[key] = build;
                    return true;
                } else {
                    return false;
                }
            })
            .filter(build => {
                if (!latest || build.monitor.startedAt > latest) {
                    latest = build.monitor.startedAt;
                    return true;
                } else {
                    return build.monitor.isRunning || build.status === 'failing';
                }
            });

        if (typeof callback === 'function') {
            process.nextTick(function() {
                callback(results);
            });
        }
    }

    function fetchProjectBuilds(project, callback) {
        requestFirstPage(function (page, per_page) {
            return getProjectBuildsApiUrl(project, page, per_page);
        }, function (results) {
            results.forEach((build, index) => {
                results.find(item => item.id === build.id).monitor = getBuildMonitorBuild(project, build);
                results.find(item => item.id === build.id).expires = getBuildExpiration(build);
            });

            process.nextTick(function() {
                reduceBuilds(results, function(results) {
                    if (results.length) {
                        log(project.name_with_namespace + ' | ' +
                            results.length + ' current builds.');
                    }
                    process.nextTick(function() {
                        callback(results);
                    });
                });
            });
        });
    }

    function updateProject(project, callback) {
        log('Updating project:', project.name_with_namespace);
        if (self.config.slugs.indexOf('*/*') > -1 || self.config.slugs.indexOf(project.namespace.name + "/*")  > -1 || self.config.slugs.indexOf(project.path_with_namespace) > -1) {
          if (typeof project.jobs === 'undefined') {
              project.jobs = {};
          }
          if (project.jobs_enabled === true) {
              fetchProjectBuilds(project, function(results) {
                  var i, build, builds = {};
                  for (i = 0; i < results.length; i = i + 1) {
                      build = results[i];
                      builds[build.monitor.id] = build;
                  }
                  if (Object.keys(builds).length) {
                      project.jobs = builds;
                  }
                  project.expires = getProjectExpiration(project);
                  self.cache.projects[project.id] = project;
                  if (typeof callback === 'function') {
                      process.nextTick(function() {
                          callback(project);
                      });
                  }
              });
          } else {
              project.jobs = {};
              project.expires = getProjectExpiration(project);
              self.cache.projects[project.id] = project;
              if (typeof callback === 'function') {
                  process.nextTick(function() {
                      callback(project);
                  });
              }
          }
        } else {
          if (typeof callback === 'function') {
              process.nextTick(function() {
                  callback(project);
              });
          }
        }
    }

    function fetchNewProjects(callback) {
        self.cache.expires = getDefaultExpiration();

        log('Fetching new projects...');
        requestAllPages(getProjectsApiUrl, function (projects) {
             projects
                .filter(project => project.jobs_enabled)
                .forEach(project => {
                    updateProject(project);
                });

            log('Found', projects.length + ' new projects.');
            if (typeof callback === 'function') {
                process.nextTick(function() {
                    callback(projects);
                });
            }
        });
    }

    self.check = function (callback) {
        // Trigger fetch for new projects
        if (now() > self.cache.expires) {
            process.nextTick(fetchNewProjects);
        }

        // Iterate through already cached projects
        async.mapSeries(Object.keys(self.cache.projects),
                        function(key, pass) {
            var project = self.cache.projects[key];

            // Trigger fetch for new builds for projects with expired cache
            if (now() > project.expires) {
                process.nextTick(function () {
                    updateProject(project);
                });
            }

            // Iterate through already cached builds for the project
            async.mapSeries(Object.keys(project.jobs),
                            function(key, pass) {
                var build = project.jobs[key];

                // Trigger fetch for build with expired cache
                if (now() > build.expires) {
                    process.nextTick(function() {
                        updateBuild(project, build);
                    });
                }

                // Pass along the monitor version of the build info
                process.nextTick(function() {
                    pass(null, build.monitor);
                });
            }, function(err, results) {

                // Pass along all project.jobs
                process.nextTick(function() {
                    pass(null, results);
                });
            });
        }, function(err, builds) {

            // Reduce builds from all projects into a flat array
            async.reduce(builds, [], function(memo, item, pass) {
                process.nextTick(function() {
                    pass(null, memo.concat(item));
                });
            }, function(err, builds) {
                process.nextTick(function() {
                    callback(err, builds);
                });
            });
        });
    };

    self.configure = function (config) {
        self.config = config;
        if (typeof self.config.intervals === 'undefined') {
            self.config.intervals = {};
        }
        if (typeof self.config.intervals.disabled === 'undefined') {
            self.config.intervals.disabled = 12 * 60 * minute;
        }
        if (typeof self.config.intervals.empty === 'undefined') {
            self.config.intervals.empty = 10 * minute;
        }
        if (typeof self.config.intervals.default === 'undefined') {
            self.config.intervals.default = minute;
        }
        if (typeof self.config.slugs === 'undefined') {
            self.config.slugs = ['*/*'];
        }
        if (typeof self.config.additional_query === 'undefined') {
          self.config.additional_query = "";
        }
        if (typeof process.env.GITLAB_TOKEN !== 'undefined') {
            self.config.token = process.env.GITLAB_TOKEN;
        }
        if (typeof self.config.caPath !== 'undefined') {
            request = request.defaults({
                agentOptions: {
                    ca: require('fs').readFileSync(self.config.caPath).toString().split("\n\n")
                }
            });
        }
        for (var key in self.config) {
          if (key !== 'token') {
            log(key + ':', self.config[key]);
          }
        }
    };
};
