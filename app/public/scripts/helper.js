define(function () {
    var getUrlParameter = function (parameter) {
        var pageUrl = window.location.search.substring(1),
            urlParameters = pageUrl.split('&');

        for (var i = 0; i < urlParameters.length; i++) {
            var parameterName = urlParameters[i].split('=');
            if (parameterName[0] == parameter) {
                return parameterName[1];
            }
        }
    };

    var detectInteraction = function (show, hide) {
        var isShown = false;
        var nextTimeout = new Date();

        setInterval(function() {
            if (isShown && (new Date() - nextTimeout > 2000)) {
                isShown = false;
                hide();
            }

        }, 1000);

        function interactionDetected () {
            nextTimeout = new Date();

            if(!isShown) {
                show();
                isShown = true;
            }
        }

        $(window).keydown(function(event) {
            interactionDetected();
        });

        $(window).mousemove(function(event) {
            interactionDetected();
        });

        $(window).mousedown(function(event) {
            interactionDetected();
        });
    };

    return {
        getUrlParameter: getUrlParameter,
        detectInteraction: detectInteraction
    };
});