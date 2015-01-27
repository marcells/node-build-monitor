define(['ko', 'helper', 'settings', 'notification'], function (ko, helper, settings, notification) {
    var OptionsViewModel = function (app) {
        var self = this;

        self.isMenuVisible = ko.observable(false);
        self.isMenuButtonVisible = ko.observable(false);
        self.theme = ko.observable(helper.getUrlParameter('theme') || settings.theme);
        self.themes = ko.observableArray(['default', 'list', 'lingo']);
        self.browserNotificationSupported = ko.observable(notification.isSupportedAndNotDenied());
        self.browserNotificationEnabled = ko.observable(notification.isSupportedAndNotDenied() && settings.browserNotificationEnabled);
        self.soundNotificationEnabled = ko.observable(settings.soundNotificationEnabled);
        self.version = app.version;
        
        helper.detectGlobalInteraction(
            function() { 
                self.isMenuButtonVisible(!self.isMenuVisible());
            },
            function() {
                self.isMenuButtonVisible(self.isMenuVisible());
            });

        self.changeTheme = function (theme) {
            settings.theme = theme;
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

        self.browserNotificationEnabled.subscribe(function (enabled) {
            if (enabled) {
                notification.ensureGranted(
                    function () {
                        settings.browserNotificationEnabled = true;
                    },
                    function () { 
                        self.browserNotificationEnabled(false);
                        settings.browserNotificationEnabled = false;
                    });
            } else {
                settings.browserNotificationEnabled = false;
            }
        });

        self.soundNotificationEnabled.subscribe(function (enabled) {
            settings.soundNotificationEnabled = enabled;
        });
    };

    return OptionsViewModel;
});