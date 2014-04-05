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

function timeOutput(startedAt, finishedAt, isRunning) {
    if (!isRunning) { 
        return 'finished ' + moment(finishedAt).calendar() + ' [finished ' + moment(finishedAt).fromNow() + '] (ran for ' + countdown(startedAt, finishedAt).toString() + ')';
    } else {
        return 'running for ' + countdown(startedAt).toString() + ' [started ' + moment(startedAt).fromNow() + ']';
    }
}

var BuildViewModel = function (build) {
    this.isRunning = ko.observable(build.isRunning);
    this.project = ko.observable(build.project);
    this.definition = ko.observable(build.definition);
    this.number = ko.observable(build.number);
    this.startedAt = ko.observable(moment(build.startedAt));
    this.finishedAt = ko.observable(moment(build.finishedAt));
    this.status = ko.observable(build.status);
    this.reason = ko.observable(build.reason);
    this.requestedFor = ko.observable(build.requestedFor);
    this.hasWarnings = ko.observable(build.hasWarnings);
    this.hasErrors = ko.observable(build.hasErrors);

    this.cssClass = ko.computed(function () {
        return this.status() + '-color';
    }, this);

    this.duration = ko.forcibleComputed(function () {
        return timeOutput(this.startedAt(), this.finishedAt(), this.isRunning());
    }, this);
};

var AppViewModel = function() {
    this.builds = ko.observableArray([]);
};

var app = new AppViewModel();

$(function() {
    setInterval(function () {
        app.builds().forEach(function (build) {
            build.duration.evaluateImmediate();
        })
    }, 1000);

    app.builds.push(new BuildViewModel({ project: 'Loading...'}));
    ko.applyBindings(app);

    var socket = io.connect(socketEndpoint);

    socket.on('buildstate', function (builds) {
        if (builds) {
            console.log(builds);

            app.builds.removeAll();

            for(var i=0; i < builds.length; i++) {
                var build = builds[i];
                
                app.builds.push(new BuildViewModel(build));
            }
        }
    });
});