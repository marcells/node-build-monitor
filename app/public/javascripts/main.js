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
    this.id = ko.observable();
    this.isRunning = ko.observable();
    this.project = ko.observable();
    this.definition = ko.observable();
    this.number = ko.observable();
    this.startedAt = ko.observable();
    this.finishedAt = ko.observable();
    this.status = ko.observable(build.status);
    this.statusText = ko.observable();
    this.reason = ko.observable();
    this.requestedFor = ko.observable();
    this.hasWarnings = ko.observable();
    this.hasErrors = ko.observable();

    this.update = function (build) {
        this.id(build.id);
        this.isRunning(build.isRunning);
        this.project(build.project);
        this.definition(build.definition);
        this.number(build.number);
        this.startedAt(moment(build.startedAt));
        this.finishedAt(moment(build.finishedAt));
        this.status(build.status);
        this.statusText(build.statusText);
        this.reason(build.reason);
        this.requestedFor(build.requestedFor);
        this.hasWarnings(build.hasWarnings);
        this.hasErrors(build.hasErrors);
    };

    this.update(build);

    this.cssClass = ko.computed(function () {
        return this.status() + '-color';
    }, this);

    this.duration = ko.forcibleComputed(function () {
        return timeOutput(this.startedAt(), this.finishedAt(), this.isRunning());
    }, this);
};

var AppViewModel = function() {
    var self = this;

    this.builds = ko.observableArray([]);

    this.getBuildById = function (id) {
        return self.builds().filter(function (build) {
            return build.id() === id;
        })[0];
    };
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

    socket.on('buildsLoaded', function (builds) {
         if (builds) {
             console.log('buildsLoaded', builds);

             app.builds.removeAll();

             builds.forEach(function (build) {
                app.builds.push(new BuildViewModel(build));
             });
        }
    });

    socket.on('buildsChanged', function (changes) {
        changes.added.forEach(function (build, index) {
            app.builds.splice(index, 0, new BuildViewModel(build));
        });

        changes.removed.forEach(function (build, index) {
            app.builds.remove(function (item) {
                return item.id === build.id;
            });
        });

        changes.updated.forEach(function (build) {
            var vm = app.getBuildById(build.id);
            vm.update(build);

            console.log('updated', build);
        });

        console.log('buildsChanged', changes);
    });
});