const { group } = require('console');
var request = require('request'),
    path = require('path'),
    async = require('async');

const throttledQueue = require('throttled-queue');
const throttle = throttledQueue(3, 1000);

module.exports = function () {

    var getLineNumber = function () {
        const orig = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const err = new Error();
        Error.captureStackTrace(err, global);
        const callee = err.stack[2];
        Error.prepareStackTrace = orig;

        const callerFile = path.relative(process.cwd(), callee.getFileName());
        return callerFile +":"+ callee.getLineNumber() + " ==> ";
    }

    var log = function(message){
        if(self.config.debug){
            console.log(getLineNumber() + message);
        }
    }

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
        getProjectsByGroupUrl = function(page, perPage, projectGroup) {
            var query = '?page=' + page + '&per_page=' + perPage + self.config.additional_query;
            const projectGroupUrl = self.config.url + '/api/v4/groups/'+ projectGroup +'/projects' +query;
            return projectGroupUrl;
        },
        getDescendantGroupsUrl = function(mainGroup){
            var query = '?page=' + 1 + '&per_page=' + 100;
            return self.config.url + '/api/v4/groups/' + mainGroup + '/descendant_groups' + query;
        },
        getRequestHeaders = function() {
            return { 'PRIVATE-TOKEN': self.config.token };
        },
        makeRequest = function (url, callback) {
            throttle(() => {
                log('makeRequest to ' +url);
                request({
                    headers: getRequestHeaders(),
                    'url': url,
                    json: true
                }, function(err, response, body) {
                    log("calling callback for: "+url); 
                    callback(err, response, body);
                }); 
            });
        },
        getProjectPipelines = function(project, callback) {
            makeRequest(buildProjectPipelinesUrl(project.id, project.ref), function(err, response, pipelines) {
                log("callback of project pipelines...");
                if(err) {
                    callback(err);
                    return;
                }

                if(pipelines && pipelines.slice) {
                    if(typeof pipelines === "string"){
                        log(pipelines);
                    }
                    pipelines = pipelines.sort(function(a,b){
                        // Turn your strings into dates, and then subtract them
                        // to get a value that is either negative, positive, or zero.
                        return new Date(b.updated_at) - new Date(a.updated_at);
                    }).slice(0,1);

                    pipelines = pipelines.filter(function(pipeline) {
                        //console.log(pipeline);
                        return (self.config.pipeline.status.includes(pipeline.status));
                    });

                    if(typeof self.config.numberOfPipelinesPerProject !== 'undefined') {
                        pipelines = pipelines.slice(0, self.config.numberOfPipelinesPerProject);
                    }
                } else {
                    pipelines = [];
                }
                log("number of pipelines fetched: " + pipelines.length);
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
                function(pipeline,response, callback) {
                    makeRequest(buildJobUrl(project.id, pipelineId), function(err, response, jobs) {
                        pipeline = pipeline.body;
                        pipeline.jobs = jobs;
                        if (typeof callback === 'function') {
                            callback(err, simplifyBuild(project, pipeline));
                        } else {
                            console.dir("callback is not a function: " + callback);
                        }
                    });
                }
            ], callback);
        },
        getBuilds = function(callback) {
            self.projects = [];
            loadProjects(function () {
                _getBuilds(callback);
            });
        },
        _getBuilds = function(callback) {
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
                project: project.name_with_namespace + ' @ ' + build.ref,
                branch: build.ref,
                commit: build.sha ? build.sha.substr(0, 7) : undefined,
                isRunning: ['running', 'pending'].includes(build.status),
                startedAt: getDateTime(build.started_at),
                finishedAt: getDateTime(build.finished_at),
                requestedFor: getAuthor(build),
                status: getBuildStatus(build.status, build.detailed_status, build.jobs),
                statusText: build.status,
                reason: getCommitMessage(build),
                hasErrors: false,
                hasWarnings: getHasWarnings(build.detailed_status),
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
        getHasWarnings = function (detailed_status) {
            if (detailed_status === undefined) {
                return false;
            }
            return detailed_status.icon === "status_warning";
        },
        getBuildStatus = function (status, detailed_status, jobs) {
            switch (status) {
                case 'pending':
                    return '#ffa500';
                case 'running':
                    return 'Blue';
                case 'failed':
                    return 'Red';
                case 'success':
                    // if (getHasWarnings(detailed_status)) {
                    //   return '#ffa500';
                    // }
                    return 'Green';
                case 'manual':
                    return getStatusForManual(detailed_status, jobs);
                default:
                  return 'Gray';
            }
        },
        getStatusForManual = function (detailed_status, jobs) {
            return getBuildStatus(jobs
                .map(job => job.status)
                .includes('running') ? 'running' : 'success',
                detailed_status);
        },
        getBuildUrl = function(project, build) {
            if(build.jobs && build.jobs[0]) {
                var base = self.config.url + '/';
                return base + project.path_with_namespace + '/-/jobs/' + build.jobs[0].id; //Not sure whether this works
            } else {
                return "";
            }
        },
        getAllSubGroups = function(callback) {
            makeRequest(getDescendantGroupsUrl(self.config.main_group), function(err, response, body){
                if(!err && response.statusCode === 200){
                    log("supgroups successfully acquired:");
                    const groupUrls = body.map(group =>  group.id);
                    log(groupUrls);
                    callback(groupUrls);
                }
            });
        },
        getAllProjects = function (group, callback) {
            makeRequest(getProjectsByGroupUrl(1, 50, group),function (err, response, body) {
                log("get all projects...");
                if(err){
                    log( "ERROR: "+err);
                }
                if (response.statusCode !== 200){
                    log( "Getting all projects failed for: " + group);
                    log("reason: " + body);
                }
                if (!err && response.statusCode === 200) {
                    log("getting projects...");
                    const radix = 10;
                    var urls = [], pages = Math.ceil(
                        parseInt(response.headers['x-total-pages'], radix));
                    for (var i = 1; i <= pages; i = i + 1) {
                        urls.push(getProjectsByGroupUrl(i, 50, group));
                    }
                    log("all urls: ");
                    log( urls);
                    async.map(urls, makeRequest, function (err, projects) {
                        callback(err, flatten(projects));
                    });
                }
            });
        },        
        loadProjects = function (callback) {
            log("loading projects...");
            var slugs = self.config.slugs,
                matchers = slugs.map(slug => slug.project),
                findNamespaceIndexInMatchers = function (namespace) {
                    for (var i = 0; i < matchers.length; i++) {
                        var matcher = matchers[i];
                        if (matcher.endsWith("/**")) {
                            prefix = matcher.replace("/**", "");
                            if (namespace.full_path.startsWith(prefix)) return i;
                        } else {
                            if (matcher === namespace.full_path + "/*") return i;
                        }
                    }
                    return -1;
                };
            var allProjectsCallback = function (err, projects) {
                log("all projects callback ...");
                if (err) {
                    console.log("failed before allProjects Callback: " + err);
                    return;
                }

                var indexOfAllMatch = matchers.indexOf('*/*');
                projects.flat().forEach(function (projectRaw) {
                    projectRaw.body.flat().forEach(function(project){
                        if (project.namespace) {
                            var indexOfNamespace = findNamespaceIndexInMatchers(project.namespace),
                                indexOfProject = matchers.indexOf(project.path_with_namespace),
                                index = indexOfAllMatch > -1 ? indexOfAllMatch : (
                                    indexOfNamespace > -1 ? indexOfNamespace : (
                                        indexOfProject > -1 ? indexOfProject : null));
    
                            if (index !== null) {
                                if (slugs[index].ref) {
                                    project.ref = slugs[index].ref;
                                }
                                self.projects.push(project);
                            }
                        }
                    });
                    

                });
                log("all projects so far: ");
                log(self.projects.length);
                callback();
            };

            // getAllProjects(self.config.main_group, allProjectsCallback);

            getAllSubGroups(function (groupUrls) {
                async.map(groupUrls, getAllProjects, allProjectsCallback);
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
        if(typeof self.config.pipeline === 'undefined' || typeof self.config.pipeline.status === 'undefined') {
            self.config.pipeline = {
              status: ['running', 'pending', 'success', 'failed', 'canceled', 'skipped']
            };
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
