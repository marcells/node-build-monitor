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
    };

    return this;
});