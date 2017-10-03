var request = require('request'),
    async = require('async');

module.exports = function () {
    var self = this,
        flatten = function(arrayOfArray) {
            return [].concat.apply([], arrayOfArray);
        },
        buildProjectUrl = function(projectId) {
            return self.config.url + '/api/v4/projects/' + projectId;
        },
        buildProjectPipelinesUrl = function(projectId, ref) {
            var url = self.config.url + '/api/v4/projects/' + projectId + '/pipelines';
            if(ref) { url = url + '?ref=' + ref; }
            return url;
        },
        buildPipelineDetailsUrl = function(projectId, pipelineId) {
            return self.config.url + '/api/v4/projects/' + projectId + '/pipelines/' + pipelineId;
        },
        buildJobUrl = function(projectId, pipelineId) {
            return self.config.url + '/api/v4/projects/' + projectId + '/pipelines/' + pipelineId + '/jobs/';
        },
        getProjectsApiUrl = function(page, perPage) {
            var query = '?page=' + page + '&per_page=' + perPage + self.config.additional_query;
            return self.config.url + '/api/v4/projects' + query;
        },
        getRequestHeaders = function() {
            return { 'PRIVATE-TOKEN': self.config.token };
        },
        makeRequest = function (url, callback) {
            request({
                headers: getRequestHeaders(),
                'url': url,
                json: true
            }, function(err, response, body) {
                callback(err, body);
            });
        },
        getProjectPipelines = function(project, callback) {
            makeRequest(buildProjectPipelinesUrl(project.id, project.ref), function(err, pipelines) {
                if(err) {
                    callback(err);
                    return;
                }
                if (typeof self.config.numberOfPipelinesPerProject !== 'undefined') {
                    pipelines = pipelines.slice(0, self.config.numberOfPipelinesPerProject);
                }
                async.map(pipelines, function(pipeline, callback) {
                    getPipelineDetails(project, pipeline.id, callback);
                }, callback);
            });
        },
        getPipelineDetails = function(project, pipelineId, callback) {
            async.waterfall([
                function(callback) {
                    makeRequest(buildPipelineDetailsUrl(project.id, pipelineId), callback);
                },
                function(pipeline, callback) {
                    makeRequest(buildJobUrl(project.id, pipelineId), function(err, jobs) {
                        pipeline.jobs = jobs;
                        callback(err, simplifyBuild(project, pipeline));
                    });
                }
            ], callback);
        },
        getBuilds = function(callback) {
            if(self.projects.length === 0) {
                loadProjects();
            }
            async.map(self.projects, getProjectPipelines, function(err, builds) {
                if(err) {
                    callback(err);
                    return;
                }
                callback(err, flatten(builds));
            });
        },
        simplifyBuild = function(project, build) {
            return {
                id: project.id + '|' + build.id,
                number: build.id,
                project: project.name + '/' + build.ref,
                isRunning: ['running', 'pending'].includes(build.status),
                startedAt: getDateTime(build.started_at),
                finishedAt: getDateTime(build.finished_at),
                requestedFor: getAuthor(build),
                status: getBuildStatus(build.status),
                statusText: build.status,
                reason: getCommitMessage(build),
                hasErrors: false,
                hasWarnings: false,
                url: getBuildUrl(project, build)
            };
        },
        getDateTime = function(dateTime) {
            return dateTime ? new Date(dateTime) : dateTime;
        },
        getCommitMessage = function(build) {
            var job = build.jobs && build.jobs[0];
            return job && job.commit ? job.commit.message : undefined;
        },
        getAuthor = function(build) {
            var job = build.jobs && build.jobs[0];
            return job && job.commit ? job.commit.author_name : undefined;
        },
        getBuildStatus = function(status) {
            switch (status) {
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
        },
        getBuildUrl = function(project, build) {
            if(build.jobs && build.jobs[0]) {
                var base = self.config.url + '/';
                return base + project.path_with_namespace + '/-/jobs/' + build.jobs[0].id; //Not sure whether this works
            } else {
                return "";
            }
        },
        getAllProjects = function(callback) {
            request({
                headers: getRequestHeaders(),
                'url': getProjectsApiUrl(1, 100),
                json: true
            }, function(err, response, body) {
                if (!err && response.statusCode == 200) {
                    var urls = [], pages = Math.ceil(
                        parseInt(response.headers['x-total-pages'], 10));
                    for (var i = 1; i <= pages; i = i + 1) {
                        urls.push(getProjectsApiUrl(i, 100));
                    }

                    async.map(urls, makeRequest, function(err, projects){
                        callback(err, flatten(projects));
                    });
                }
            });
        },
        loadProjects = function() {
            var slugs = self.config.slugs,
                matchers = slugs.map(slug => slug.project);
            getAllProjects(function(err, projects){
                if(err) return;
                var indexOfAllMatch = matchers.indexOf('*/*');
                projects.forEach(function(project){
                    var indexOfNamespace = matchers.indexOf(project.namespace.name + "/*"),
                        indexOfProject = matchers.indexOf(project.path_with_namespace),
                        index = indexOfAllMatch > -1 ? indexOfAllMatch : (
                            indexOfNamespace > -1 ? indexOfNamespace : (
                            indexOfProject > -1 ? indexOfProject : null));

                    if(index !== null) {
                        if(slugs[index].ref) {
                            project.ref = slugs[index].ref;
                        }
                        self.projects.push(project);
                    }
                });
            });
        };

    self.configure = function (config) {
        self.config = config;
        self.projects = [];
        if (typeof self.config.slugs === 'undefined') {
            self.config.slugs = [{project: '*/*'}];
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
    };

    self.check = getBuilds;
};
