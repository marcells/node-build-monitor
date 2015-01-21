define(['ko', 'helper', 'cookies'], function (ko, helper, cookies) {
    var OptionsViewModel = function (app) {
        var self = this;

        self.isMenuVisible = ko.observable(false);
        self.isMenuButtonVisible = ko.observable(false);
        self.theme = ko.observable(helper.getUrlParameter('theme') || cookies.get('theme') || 'default');
        self.themes = ko.observableArray(['default', 'list', 'lingo']);
        self.browserNotificationEnabled = ko.observable(false);
        self.soundEnabled = ko.observable(false);

        helper.detectInteraction(
            function() { 
                self.isMenuButtonVisible(!self.isMenuVisible());
            },
            function() {
                self.isMenuButtonVisible(self.isMenuVisible());
            });

        self.changeTheme = function (theme) {
            cookies.set('theme', theme);
            self.theme(theme);
        };

        self.show = function () {
            self.isMenuVisible(true);
            self.isMenuButtonVisible(false);
        };

        self.hide = function () {
            self.isMenuVisible(false);
            self.isMenuButtonVisible(true);
        };
    };

    return OptionsViewModel;
});