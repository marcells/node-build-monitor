define(['io'], function (io) {
    var BuildServer = function () {
        var self = this;

        this.connect = function () {
            var socket = io.connect();

            socket.on('connect', self.onConnected);
            socket.on('disconnect', self.onDisconnected);
            socket.on('buildsLoaded', function (builds) {
                if (!builds) {
                    return;
                }
                
                self.onBuildsLoaded(builds);
            });

            socket.on('buildsChanged', self.onBuildsChanged);
        };
    };

    return BuildServer;
});