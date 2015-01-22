define([], function () {
    var notificationsAreSupported = 'Notification' in window;
    
    var permissionIsGranted = function () {
        return Notification.permission === 'granted';
    };

    var permissionIsNotDenied = function () {
        return Notification.permission !== 'denied';
    };

    var isSupportedAndNotDenied = function () {
        return notificationsAreSupported && permissionIsNotDenied();
    };

    var ensureGranted = function (granted, notAvailable) {
        if(!notificationsAreSupported) {
            notAvailable();
        } else if (permissionIsGranted()) {
            granted();
        } else if (permissionIsNotDenied()) {
            Notification.requestPermission(function (permission) {
                if (permissionIsGranted()) {
                    granted();
                } else {
                    notAvailable();
                }
            });
        } else {
            notAvailable();
        }
    };

    var show = function (build) {
        if (permissionIsGranted()) {
            var notification = new Notification(build.number + " failed!");
        }
    };

    return {
        isSupportedAndNotDenied: isSupportedAndNotDenied,
        ensureGranted: ensureGranted,
        show: show
    };
});