var async = require('async'),
    events = require('events');

exports.Monitor = function () {
    var self = this;

    self.plugins = [];
    self.currentBuilds = [];

    self.extendWith = function (plugin) {
        self.plugins.push(plugin);
    };

    self.run = function () {
        var results = [];

        async.each(self.plugins, function (plugin, pluginCallback) {
            plugin.check(function (result) {
                for (var i = 0; i < result.length; i++) {
                    results.push(result[i]);
                };

                pluginCallback();
            });
        },
        function (error) {
            self.currentBuilds = results;
            self.emit('update', results);

            setTimeout(self.run, 5000);
        });
    };
};

exports.Monitor.prototype = new events.EventEmitter();