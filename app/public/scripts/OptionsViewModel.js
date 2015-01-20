define(['ko', 'helper', 'cookies'], function (ko, helper, cookies) {
    var OptionsViewModel = function (app) {
        var self = this;

        self.isVisible = ko.observable(false);
        self.isMenuVisible = ko.observable(false);
        self.theme = ko.observable(helper.getUrlParameter('theme') || cookies.get('theme') || 'default');
        self.themes = ko.observableArray(['default', 'list', 'lingo']);

        helper.detectInteraction(
            function() { 
                self.isMenuVisible(!self.isVisible());
            },
            function() {
                self.isMenuVisible(self.isVisible());
            });

        self.changeTheme = function (theme) {
            cookies.set('theme', theme);
            self.theme(theme);
        };

        self.show = function () {
            self.isVisible(true);
            self.isMenuVisible(false);
        };

        self.hide = function () {
            self.isVisible(false);
            self.isMenuVisible(true);
        };
    };

    return OptionsViewModel;
});