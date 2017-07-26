define(['io'], function (io) {
    var BuildMonitorServer = function (variables) {
        var self = this,
            cachedSettings;

        this.connect = function () {
            var socket = io(variables.namespace);

            console.log(socket);

            socket.on('connect', self.onConnected);
            socket.on('disconnect', self.onDisconnected);
            socket.on('buildsLoaded', function (builds) {
                if (!builds) {
                    return;
                }

                self.onBuildsLoaded(builds);
            });

            socket.on('buildsChanged', self.onBuildsChanged);
            socket.on('settingsChanged', function (settings) {
                if (!cachedSettings) {
                    cachedSettings = settings;
                    self.onSettingsLoaded(settings);
                    return;
                }

                if(cachedSettings.version !== settings.version) {
                    self.onVersionChanged();
                }
            });
        };
    };

    return BuildMonitorServer;
});
