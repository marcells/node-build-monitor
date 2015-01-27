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

    var detectGlobalInteraction = function (show, hide) {
        detectInteraction(window, show, hide);
    };

    var detectInteraction = function (elementName, show, hide) {
        var isShown = false;
        var nextTimeout = new Date();
        var element = $(elementName) || $(window);

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

        element.keydown(function (event) {
            interactionDetected();
        });

        element.mousemove(function (event) {
            interactionDetected();
        });

        element.mousedown(function (event) {
            interactionDetected();
        });
    };

    return {
        getUrlParameter: getUrlParameter,
        detectGlobalInteraction: detectGlobalInteraction,
        detectInteraction: detectInteraction
    };
});