var async = require('async'),
    events = require('events'),
    log = function (text, debug) {
        if(debug) {
            console.log(new Date().toLocaleTimeString(), '|', text);
        }
    },
    generateAndApplyETags = function (newBuilds) {
        for (var i = 0; i < newBuilds.length; i++) {
            var build = newBuilds[i];

            build.etag = require('crypto')
                .createHash('md5')
                .update(JSON.stringify(build))
                .digest('hex');
        }
    },
    sortBuilds = function (newBuilds) {
        var takeDate = function (build) {
            return build.isRunning ? build.startedAt : build.finishedAt;
        };

        newBuilds.sort(function (a, b) {
            var dateA = takeDate(a);
            var dateB = takeDate(b);

            if(dateA < dateB) return 1;
            if(dateA > dateB) return -1;
            
            return 0;
        });
    },
    distinctBuildsByETag = function (newBuilds) {
        var unique = {};
        
        for (var i = newBuilds.length - 1; i >= 0; i--) {
            var build = newBuilds[i];

            if (unique[build.etag]) {
                newBuilds.splice(i, 1);
            }

            unique[build.etag] = true;
        }
    },
    onlyTake = function (numberOfBuilds, newBuilds) {
        newBuilds.splice(numberOfBuilds);
    },
    changed = function (currentBuilds, newBuilds) {
        var newbuildsHash = newBuilds
            .map(function (value) {
                return value.etag;
            })
            .join('|');

        var currentBuildsHash = currentBuilds
            .map(function (value) {
                return value.etag;
            })
            .join('|');

        return newbuildsHash !== currentBuildsHash;
    },
    detectChanges = function (currentBuilds, newBuilds) {
        var changes = {
                added: [],
                removed: [],
                updated: []
            },
            getById = function (builds, id) {
                return builds.filter(function (build) {
                    return build.id === id;
                })[0];
            };

        var currentBuildIds = currentBuilds.map(function (build) { return build.id; });
        var newBuildIds = newBuilds.map(function (build) { return build.id; });

        newBuildIds.forEach(function (newBuildId) {
            if (currentBuildIds.indexOf(newBuildId) === -1) {
                changes.added.push(getById(newBuilds, newBuildId));
            }

            if (currentBuildIds.indexOf(newBuildId) >= 0) {
                var currentBuild = getById(currentBuilds, newBuildId);
                var newBuild = getById(newBuilds, newBuildId);

                if (currentBuild.etag !== newBuild.etag) {
                    changes.updated.push(getById(newBuilds, newBuildId));
                }
            }
        });

        currentBuildIds.forEach(function (currentBuildId) {
            if (newBuildIds.indexOf(currentBuildId) === -1) {
                changes.removed.push(getById(currentBuilds, currentBuildId));
            }
        });

        changes.order = newBuildIds;

        return changes;
    };

module.exports = function () {
    var self = this;

    self.configuration = {
        interval: 5000,
        numberOfBuilds: 12,
        debug: false
    };
    self.plugins = [];
    self.currentBuilds = [];

    self.configure = function (config) {
        self.configuration = config;
    };

    self.watchOn = function (plugin) {
        self.plugins.push(plugin);
    };

    self.run = function () {
        var allBuilds = [];

        async.each(self.plugins, function (plugin, pluginCallback) {
            log('Check for builds...', self.configuration.debug);

            plugin.check(function (pluginBuilds) {
                Array.prototype.push.apply(allBuilds, pluginBuilds);
                pluginCallback();
            });
        },
        function (error) {
            log(allBuilds.length + ' builds found....', self.configuration.debug);
            
            generateAndApplyETags(allBuilds);
            distinctBuildsByETag(allBuilds);
            sortBuilds(allBuilds);
            onlyTake(self.configuration.numberOfBuilds, allBuilds);

            if(changed(self.currentBuilds, allBuilds)) {
                log('builds changed', self.configuration.debug);

                self.emit('buildsChanged', detectChanges(self.currentBuilds, allBuilds));

                self.currentBuilds = allBuilds;
            }

            setTimeout(self.run, self.configuration.interval);
        });
    };
};

module.exports.prototype = new events.EventEmitter();