define(['ko', 'notification', 'BuildViewModel', 'OptionsViewModel'], function (ko, notification, BuildViewModel, OptionsViewModel) {
    var AppViewModel = function() {
        var self = this;

        var isLoadingInitially = true;

        this.isIntercepted = ko.observable();
        this.infoType = ko.observable();
        this.builds = ko.observableArray([]);
        this.version = ko.observable();
        this.options = new OptionsViewModel(self);

        this.setIsConnected = function (value) {
            if(isLoadingInitially) {
                isLoadingInitially = false;
                return;
            }

            self.isIntercepted(!value);
            self.infoType('connection');
        };

        this.setIsLoading = function (value) {
            self.isIntercepted(value);
            self.infoType('loading');
        };

        var getBuildById = function (id) {
            return self.builds().filter(function (build) {
                return build.id() === id;
            })[0];
        };

        this.loadBuilds = function (builds) {
            self.builds.removeAll();

            builds.forEach(function (build) {
                self.builds.push(new BuildViewModel(build));
            });
        };

        this.updateCurrentBuildsWithChanges = function (changes)  {
            changes.removed.forEach(function (build) {
                self.builds.remove(function (item) {
                    return item.id() === build.id;
                });
            });

            changes.added.forEach(function (build, index) {
                self.builds.splice(index, 0, new BuildViewModel(build));
            });

            changes.updated.forEach(function (build) {
                var vm = getBuildById(build.id);
                vm.update(build);

                if (build.status === 'Red') {
                    if (self.options.soundNotificationEnabled()) {
                        var audio = new Audio('/audio/woop.mp3');
                        audio.play();
                    }

                    if (self.options.browserNotificationEnabled()) {
                        notification.show(build);
                    }
                }
            });

            changes.order.forEach(function (id, index) {
                var build = getBuildById(id);
                var from = self.builds.indexOf(build);

                if (from !== index) {
                    self.builds.splice(index, 0, self.builds.splice(from, 1)[0]);
                }
            });
        };

        this.updateBuildTimes = function () {
            self.builds().forEach(function (build) {
                build.time.evaluateImmediate();
                build.duration.evaluateImmediate();
            });
        };

        this.setIsLoading(true);
    };

    return AppViewModel;
});