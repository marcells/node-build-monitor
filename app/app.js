var request = require('request'),
    async = require('async'),
    server = process.env.server, // 'https://odatawrapper'
    user = process.env.user, // 'Domain\User'
    password = process.env.password, // 'Password'
    collection = process.env.collection || 'DefaultCollection',
    urls = [ '/Builds' ];

// Some helpers
var makeUrl = function (url, odata) {
    var baseUrl = server + '/' + collection + url;

    if (odata) {
        baseUrl += '?' + odata;
    }

    return baseUrl;
};

var makeRequest = function (url, callback) {
    // console.log("REQUEST:", url);

    request({ 
        'url': url,
        'rejectUnauthorized': false,
        'headers': { 'Accept': 'application/json' },
        'json' : true,
        'auth': { 'user': user, 'pass': password }
        },
        function(error, response, body) {
            // console.log("DONE:", body);
            callback(body);
    });
};

var parseDate = function (dateAsString) {
    return new Date(parseInt(dateAsString.substr(6)));
};

var forEachResult = function (body, callback) {
    for (var i = 0; i < body.d.results.length; i++) {
        callback(body.d.results[i]);
    }
};

var simplifyBuild = function (res) {
    //console.log(res);
    return {
        project: res.Project,
        definition: res.Definition,
        number: res.Number,
        requestedFor: res.RequestedFor,
        status: res.Status,
        reason: res.Reason,
        errors: res.Errors,
        warnings: res.Warnings,
        startedAt: parseDate(res.StartTime),
        finishedAt: parseDate(res.FinishTime),
        buildFinished: res.BuildFinished,
        changesetsUri: res.Changesets.__deferred.uri,
        changesets: []
    };
};

var simplifyChangeset = function (res) {
    return {
        id: res.Id,
        comment: res.Comment,
        committedBy: res.Committer,
        createdAt: parseDate(res.CreationDate),
        changesUri: res.Changes.__deferred.uri,
        workItemsUri: res.WorkItems.__deferred.uri,
        changes: [],
        workItems: []
    };
};

var simplifyChange = function (res) {
    return {
        id: res.ChangeSet,
        changeType: res.ChangeType,
        path: res.Path,
        type: res.Type
    };
};

var simplifyWorkItem = function (res) {
    return {
        id: res.Id,
        title: res.Title,
        type: res.Type
    };
};

var getAllChangesetsForAllBuilds = function(builds) {
    var allChangesets = [];

    builds.forEach(function(build) {
        build.changesets.forEach(function (changeset) {
            allChangesets.push(changeset);
        });
    });

    return allChangesets;
};

var queryBuilds = function (resultCallback) {
    var details = { builds: [] };

    async.series([
        // Builds
        function (callback) {
            makeRequest(makeUrl(urls[0], '$top=100&$orderby=StartTime%20desc'), function (body) {
                forEachResult(body, function (res) {
                    details.builds.push(simplifyBuild(res));
                });

                callback();
            });
        },
        // Changesets
        function (callback) {
            async.each(details.builds, function (build, callbackInner) {
                if (build.status !== 'NotStarted') {
                    makeRequest(build.changesetsUri, function (body) {
                        forEachResult(body, function (res) {                    
                            build.changesets.push(simplifyChangeset(res));
                        });

                        callbackInner();
                    });
                } else {
                    callbackInner();
                }
            }, function (err) {
                callback();
            });
        },
        // Changes
        function (callback) {
            var allChangesets = getAllChangesetsForAllBuilds(details.builds);

            async.each(allChangesets, function (changeset, callbackInner) {
                makeRequest(changeset.changesUri, function (body) {
                    forEachResult(body, function (res) {
                        changeset.changes.push(simplifyChange(res));
                    });

                    callbackInner();
                });
            }, function (err) {
                callback();
            });
        },
        // WorkItems
        function (callback) {
            var allChangesets = getAllChangesetsForAllBuilds(details.builds);

            async.each(allChangesets, function (changeset, callbackInner) {
                makeRequest(changeset.workItemsUri, function (body) {
                    forEachResult(body, function (res) {
                        changeset.workItems.push(simplifyWorkItem(res));
                    });

                    callbackInner();
                });
            }, function (err) {
                callback();
            });
        }
    ], function (err) {
        // console.log('FINISHED:', err);
        resultCallback(details);
    });
};

var queryBuildIds = function (resultCallback) {
    makeRequest(makeUrl(urls[0], '$top=100&$orderby=StartTime%20desc&$select=Project,Number,Status'), function (body) {
        var builds = [];
        
        forEachResult(body, function (res) {
            builds.push(res.Project + '_' + res.Number + '_' + res.Status);
        });

        resultCallback(builds.join('|'));
    });
};

// Check for changes
var buildIds = '';

var run = function () {
    queryBuildIds(function(result) {
        console.log(result);

        if (buildIds !== result) {
            queryBuilds(function(buildDetails) {
                // console.log(require('util').inspect(buildDetails, {showHidden: false, depth: null}));
                console.log('Update build details...');

                buildIds = result;
                setTimeout(run, 5000);
            });
        } else {
            setTimeout(run, 5000);
        }
    });
};

run();