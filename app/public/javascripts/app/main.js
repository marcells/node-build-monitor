require.config({
    paths: {
        io: '/socket.io/socket.io',
        ko: 'libs/knockout-3.1.0',
        moment: 'libs/moment.min',
        countdown: 'libs/countdown.min'
    }
});

define(['ko', 'bindingHandlers', 'BuildServer', 'AppViewModel'], function (ko, bindingHandlers, BuildServer, AppViewModel) {
    bindingHandlers.register();

    var app = new AppViewModel();

    $(function() {
        ko.applyBindings(app);

        var buildServer = new BuildServer();

        buildServer.onConnected = function() {
            app.setIsConnected(true);
        };

        buildServer.onDisconnected = function() {
            app.setIsConnected(false);
        };

        buildServer.onBuildsLoaded = function (builds) {
            app.loadBuilds(builds);
            app.setIsLoading(false);
        };

        buildServer.onBuildsChanged = function (changes) {
            app.updateCurrentBuildsWithChanges(changes);
            app.setIsLoading(false);
        };

        buildServer.connect();

        setInterval(app.updateBuildTimes, 1000);
    });
});