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
        interval: 5000
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
        var results = [];

        async.each(self.plugins, function (plugin, pluginCallback) {
            log('Check for builds...');

            plugin.check(function (result) {
                for (var i = 0; i < result.length; i++) {
                    results.push(result[i]);
                };

                pluginCallback();
            });
        },
        function (error) {
            log(results.length + ' builds found....');
            
            generateAndApplyETags(results);

            if(changed(self.currentBuilds, results)) {
                log('builds changed');

                self.currentBuilds = results;
                self.emit('updateAll', results);
            }

            setTimeout(self.run, self.configuration.interval);
        });
    };
};

exports.Monitor.prototype = new events.EventEmitter();