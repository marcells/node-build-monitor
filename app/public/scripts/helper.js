define(function () {
    var getUrlParameter = function(parameter) {
        var pageUrl = window.location.search.substring(1),
            urlParameters = pageUrl.split('&');

        for (var i = 0; i < urlParameters.length; i++) {
            var parameterName = urlParameters[i].split('=');
            if (parameterName[0] == parameter) {
                return parameterName[1];
            }
        }
    };

    return {
        getUrlParameter: getUrlParameter
    };
});