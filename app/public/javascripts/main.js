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

function isNullOrWhiteSpace(str) {
    if(!str) {
        return true;
    }

    return str === null || str.match(/^ *$/) !== null;
}

function timeOutput(startedAt, finishedAt, lastChangeAt, buildFinished) {
    var output = moment(startedAt).calendar();

    if (buildFinished) { 
        output += ' till ' + moment(finishedAt).calendar() + ' (' + moment(finishedAt.diff(startedAt)).seconds() + ' seconds) [finished ' + moment(finishedAt).fromNow() + ']';
    } else {
        output += ' (currently running: ' + moment.duration(moment().diff(startedAt)).seconds() + ' seconds) [started ' + moment(startedAt).fromNow() + ']';
    }

    return output;
}

var BuildViewModel = function (build) {
    this.buildFinished = ko.observable(build.buildFinished);
    this.project = ko.observable(build.project);
    this.definition = ko.observable(build.definition);
    this.number = ko.observable(build.number);
    this.startedAt = ko.observable(moment(build.startedAt));
    this.finishedAt = ko.observable(moment(build.finishedAt));
    this.lastChangeAt = ko.observable(moment(build.lastChangeAt));
    this.status = ko.observable(build.status);
    this.reason = ko.observable(build.reason);
    this.requestedFor = ko.observable(build.requestedFor);
    this.hasWarnings = ko.observable(!isNullOrWhiteSpace(build.warnings));
    this.hasErrors = ko.observable(!isNullOrWhiteSpace(build.errors));

    this.cssClass = ko.computed(function () {
        return this.status() + '-color';
    }, this);

    this.duration = ko.forcibleComputed(function () {
        return timeOutput(this.startedAt(), this.finishedAt(), this.lastChangeAt(), this.buildFinished());
    }, this);

    setInterval(function (buildViewModel) {
        buildViewModel.duration.evaluateImmediate();
    }, 1000, this);
};

var AppViewModel = function() {
    this.builds = ko.observableArray([]);
};

var app = new AppViewModel();

$(function() {
    app.builds.push(new BuildViewModel({ project: 'Loading...'}));
    ko.applyBindings(app);

    var socket = io.connect(socketEndpoint);

    socket.on('buildstate', function (data) {
        if (data) {
            console.log(data);

            app.builds.removeAll();

            for(var i=0; i < data.builds.length; i++) {
                var build = data.builds[i];
                
                app.builds.push(new BuildViewModel(build));
            }
        }
    });
});