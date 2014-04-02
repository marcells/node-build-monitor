function isNullOrWhiteSpace(str) {
    if(!str) {
        return true;
    }

    return str === null || str.match(/^ *$/) !== null;
}

function timeOutput(startedAt, finishedAt, lastChangeAt, buildFinished) {
    var output = startedAt.toLocaleString();

    if (buildFinished) { 
        output += ' - ' + finishedAt.toLocaleString() + ' (' + (finishedAt.getTime() - startedAt.getTime()) / 1000 + ' seconds)';
    } else {
        output += ' (currently running: ' + (lastChangeAt.getTime() - startedAt.getTime()) / 1000 + ')';
    }

    return output;
}

var BuildViewModel = function (build) {
    this.buildFinished = ko.observable(build.buildFinished);
    this.project = ko.observable(build.project);
    this.definition = ko.observable(build.definition);
    this.number = ko.observable(build.number);
    this.startedAt = ko.observable(new Date(build.startedAt));
    this.finishedAt = ko.observable(new Date(build.finishedAt));
    this.lastChangeAt = ko.observable(new Date(build.lastChangeAt));
    this.status = ko.observable(build.status);
    this.reason = ko.observable(build.reason);
    this.requestedFor = ko.observable(build.requestedFor);
    this.hasWarnings = ko.observable(!isNullOrWhiteSpace(build.warnings));
    this.hasErrors = ko.observable(!isNullOrWhiteSpace(build.errors));

    this.cssClass = ko.computed(function () {
        return this.status() + '-color';
    }, this);

    this.duration = ko.computed(function () {
        return timeOutput(this.startedAt(), this.finishedAt(), this.lastChangeAt(), this.buildFinished());
    }, this);
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