var async = require('async'),
    events = require('events')
    log = function (text) {
        console.log(new Date().toLocaleTimeString(), '|', text);
    },
    generateAndApplyETags = function (newBuilds) {
        for (var i = 0; i < newBuilds.length; i++) {
            var build = newBuilds[i];

            build.etag = require('crypto')
                .createHash('md5')
                .update(JSON.stringify(build))
                .digest('hex');
        };
    },
    sortBuilds = function (newBuilds) {
        newBuilds.sort(function (a, b) {
            
        });
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
    };

exports.Monitor = function () {
    var self = this;

    self.configuration = {
        interval: 5000,
        numberOfBuilds: 12
    };
    self.plugins = [];
    self.currentBuilds = [];

    self.configure = function (config) {
        self.configuration = config;
    };

    self.extendWith = function (plugin) {
        self.plugins.push(plugin);
    };

    self.run = function () {
        var allBuilds = [];

        async.each(self.plugins, function (plugin, pluginCallback) {
            log('Check for builds...');

            plugin.check(function (pluginBuilds) {
                Array.prototype.push.apply(allBuilds, pluginBuilds);
                pluginCallback();
            });
        },
        function (error) {
            log(allBuilds.length + ' builds found....');
            
            sortBuilds(allBuilds);
            onlyTake(self.configuration.numberOfBuilds, allBuilds);
            generateAndApplyETags(allBuilds);

            if(changed(self.currentBuilds, allBuilds)) {
                log('builds changed');

                self.currentBuilds = allBuilds;
                self.emit('updateAll', allBuilds);
            }

            setTimeout(self.run, self.configuration.interval);
        });
    };
};

exports.Monitor.prototype = new events.EventEmitter();