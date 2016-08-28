define(['cookies'], function (cookies) {
    var parseBool = function (boolAsString) {
        return boolAsString === 'true';
    };

    var settings = { };

    Object.defineProperty(settings, 'theme', {
        get: function() { return cookies.get('theme') || 'default'; },
        set: function(value) { cookies.set('theme', value); },
        enumerable: true
    });

    Object.defineProperty(settings, 'browserNotificationEnabled', {
        get: function() { return parseBool(cookies.get('browserNotificationEnabled')) || false; },
        set: function(value) { cookies.set('browserNotificationEnabled', value); },
        enumerable: true
    });

    Object.defineProperty(settings, 'soundNotificationEnabled', {
        get: function() { return parseBool(cookies.get('soundNotificationEnabled')) || false; },
        set: function(value) { cookies.set('soundNotificationEnabled', value); },
        enumerable: true
    });

    Object.defineProperty(settings, 'notificationFilterEnabled', {
        get: function() { return parseBool(cookies.get('notificationFilterEnabled')) || false; },
        set: function(value) { cookies.set('notificationFilterEnabled', value); },
        enumerable: true
    });

    Object.defineProperty(settings, 'notificationFilterValue', {
        get: function() { return cookies.get('notificationFilterValue') || ''; },
        set: function(value) { cookies.set('notificationFilterValue', value); },
        enumerable: true
    });

    return settings;
});
