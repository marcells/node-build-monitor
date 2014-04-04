var request = require('request'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    server = process.env.server, // 'https://odatawrapper'
    user = process.env.user, // 'Domain\User'
    password = process.env.password, // 'Password'
    collection = process.env.collection || 'DefaultCollection',
    urls = [ '/Builds' ];

// Check for changes
var buildIds = '';
var runEvery = 1000;

var run = function (buildsChanged) {
    log('Check for build changes...');

    queryBuildIds(function(result) {
        if (buildIds !== result) {
            log('New build identifier: ' + result);
            log('Update build details...');

            queryBuilds(function(buildDetails) {
                // log(require('util').inspect(buildDetails, {showHidden: false, depth: null}));
                log('Finished updating build details (' + buildDetails.builds.length + ' Builds) ...');
                writeBuildLog(buildDetails.builds);
                buildsChanged(buildDetails);

                buildIds = result;
                
                setTimeout(run, runEvery, buildsChanged);
            });
        } else {
            setTimeout(run, runEvery, buildsChanged);
        }
    });
};

exports.go = function(buildsChanged) {
    run(buildsChanged);
};