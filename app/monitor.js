var async = require('async'),
    events = require('events');

var log = function (text) {
    console.log(new Date().toLocaleTimeString(), '|', text);
};

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

            self.currentBuilds = results;
            self.emit('update', results);

            setTimeout(self.run, 5000);
        });
    };
};

exports.Monitor.prototype = new events.EventEmitter();