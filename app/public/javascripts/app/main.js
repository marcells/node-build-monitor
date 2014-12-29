require.config({
    paths: {
        io: '/socket.io/socket.io',
        ko: 'libs/knockout-3.1.0',
        moment: 'libs/moment.min',
        countdown: 'libs/countdown.min'
    }
});

define(['ko', 'io', 'bindingHandlers', 'BuildViewModel', 'AppViewModel'], function (ko, io, bindingHandlers, BuildViewModel, AppViewModel) {
    bindingHandlers.register();

    var app = new AppViewModel();

    $(function() {
        setInterval(function () {
            app.builds().forEach(function (build) {
                build.time.evaluateImmediate();
                build.duration.evaluateImmediate();
            })
        }, 1000);

        ko.applyBindings(app);
        
        var socket = io.connect();

        socket.on('connect', function() {
            if(app.isLoadingInitially) {
                app.isLoadingInitially = false;
            } else {
                app.setIsConnected(true);
            }
        });

        socket.on('disconnect', function() {
            app.setIsConnected(false);
        });

        socket.on('buildsLoaded', function (builds) {
            if (builds) {
                console.log('buildsLoaded', builds);

                app.builds.removeAll();

                builds.forEach(function (build) {
                    app.builds.push(new BuildViewModel(build));
                });

                app.setIsLoading(false);
            }
        });

        socket.on('buildsChanged', function (changes) {
            changes.removed.forEach(function (build) {
                app.builds.remove(function (item) {
                    return item.id() === build.id;
                });
            });

            changes.added.forEach(function (build, index) {
                app.builds.splice(index, 0, new BuildViewModel(build));
            });

            changes.updated.forEach(function (build) {
                var vm = app.getBuildById(build.id);
                vm.update(build);

                if (build.status === 'Red') {
                    var audio = new Audio('/audio/woop.mp3');
                    audio.play();
                }
            });

            changes.order.forEach(function (id, index) {
                var build = app.getBuildById(id);
                var from = app.builds.indexOf(build);

                if (from !== index) {
                    app.builds.splice(index, 0, app.builds.splice(from, 1)[0]);
                }
            });

            console.log('buildsChanged', changes);
            app.setIsLoading(false);
        });
    });
});