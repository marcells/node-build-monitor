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

        ko.bindingHandlers.fadeOverlay = {
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
                var templateConfig = { fromUrl: '/themes/' + name + '.html' };
                callback({ template: templateConfig });
            }
        };

        ko.components.loaders.unshift(namingConventionLoader);

        var templateFromUrlLoader = {
            loadTemplate: function(name, templateConfig, callback) {
                if (templateConfig.fromUrl) {
                    var fullUrl = '/templates/' + templateConfig.fromUrl + '?cacheAge=' + templateConfig.maxCacheAge;
                    $.get(fullUrl, function(markupString) {
                        ko.components.defaultLoader.loadTemplate(name, markupString, callback);
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