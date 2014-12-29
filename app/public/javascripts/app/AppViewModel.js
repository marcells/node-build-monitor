define(['ko'], function (ko) {
    var AppViewModel = function() {
        var self = this;

        this.isLoadingInitially = true;

        this.isIntercepted = ko.observable();
        this.infoType = ko.observable();
        this.builds = ko.observableArray([]);

        this.setIsConnected = function (value) {
            self.isIntercepted(!value);
            self.infoType('connection');
        };

        this.setIsLoading = function (value) {
            self.isIntercepted(value);
            self.infoType('loading');
        };

        this.getBuildById = function (id) {
            return self.builds().filter(function (build) {
                return build.id() === id;
            })[0];
        };

        this.setIsLoading(true);
    };

    return AppViewModel;
});