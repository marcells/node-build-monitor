define(['ko'], function (ko) {
    this.register = function () {
        ko.forcibleComputed = function(readFunc, context, options) {
            var trigger = ko.observable(),
                target = ko.computed(function() {
                    trigger();
                    return readFunc.call(context);
                }, null, options);
            target.evaluateImmediate = function() {
                trigger.valueHasMutated();
            };
            return target;
        };

        ko.bindingHandlers.animateCss = {
            update: function(element, valueAccessor) {
                var value = valueAccessor();
                var unwrap = ko.unwrap(value);

                if(unwrap) {
                    $(element).animate(unwrap, 1000);
                }
            }
        };

        ko.bindingHandlers.fade = {
            update: function(element, valueAccessor) {
                var value = valueAccessor();
                var unwrap = ko.unwrap(value);

                if(unwrap) {
                    $(element).fadeIn(300);
                } else {
                    $(element).fadeOut(1500);
                }
            }
        };

        var namingConventionLoader = {
            getConfig: function(name, callback) {
                var templateConfig = {
                    templateUrl: '/templates/themes/' + name + '.html',
                    cssUrl: '/stylesheets/themes/' + name + '/style.css'
                };

                callback({ template: templateConfig });
            }
        };

        ko.components.loaders.unshift(namingConventionLoader);

        var templateFromUrlLoader = {
            loadTemplate: function(name, templateConfig, callback) {
                function loadCss(filename) {
                    var linkElement = document.createElement("link");
                    linkElement.setAttribute("rel", "stylesheet");
                    linkElement.setAttribute("type", "text/css");
                    linkElement.setAttribute("href", filename);

                    $("head").append(linkElement);
                }

                if (templateConfig.templateUrl) {
                    $.get(templateConfig.templateUrl, function(markupString) {
                        ko.components.defaultLoader.loadTemplate(name, markupString, callback);
                        loadCss(templateConfig.cssUrl);
                    });
                } else {
                    callback(null);
                }
            }
        };

        ko.components.loaders.unshift(templateFromUrlLoader);
    };

    return this;
});