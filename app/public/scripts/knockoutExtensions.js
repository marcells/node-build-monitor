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
            update: function(element, valueAccessor, allBindings) {
                var value = valueAccessor();
                var unwrap = ko.unwrap(value);

                var fadeInDuration = allBindings.get('fadeInDuration') || 300;
                var fadeOutDuration = allBindings.get('fadeOutDuration') || 1500;

                if(unwrap) {
                    $(element).fadeIn(fadeInDuration);
                } else {
                    $(element).fadeOut(fadeOutDuration);
                }
            }
        };

        ko.bindingHandlers.hover = {
            init: function(element, valueAccessor) {
                var value = valueAccessor();
                var timeout;

                $(element).mousemove(function (event) {
                    value(true);

                    window.clearTimeout(timeout);
                    timeout = window.setTimeout(function () {
                        value(false);
                    }, 2000);
                });

                $(element).mouseleave(function (event) {
                    value(false);

                    if (timeout) {
                        window.clearTimeout(timeout);
                        timeout = null;
                    }
                });
            }
        };

        ko.bindingHandlers.changeFavicon = {
          update: function(element, valueAccessor, allBindings) {
              function changeFavicon(src) {
                var link = document.createElement('link'),
                oldLink = document.getElementById('dynamic-favicon');
                link.id = 'dynamic-favicon';
                link.rel = 'shortcut icon';
                link.href = src + '?=' + Math.random();

                if (oldLink) {
                  document.head.removeChild(oldLink);
                }
                document.head.appendChild(link);
              }

              var value = valueAccessor();
              var unwrap = ko.unwrap(value);

              changeFavicon(unwrap);
          }
        };

        var namingConventionLoader = {
            getConfig: function(name, callback) {
                var templateConfig = {
                    templateUrl: 'templates/themes/' + name + '.html',
                    cssUrl: 'stylesheets/themes/' + name + '/style.css'
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
