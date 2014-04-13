module.exports = function () {
    var self = this,
        clone = function (obj) {
            return JSON.parse(JSON.stringify(obj));
        };

    self.builds = [];

	self.check = function (callback) {
        callback(clone(self.builds));
    };

    self.add = function () {
        var build = {
            id: 'project_' + (self.builds.length + 1),
            project: 'project',
            number: 'number',
            isRunning: true,
            startedAt: new Date(2000, 0, 1),
            finishedAt: new Date(2000, 0, 1),
            requestedFor: 'author',
            status: 'status',
            statusText: 'statusText',
            reason: 'reason',
            hasErrors: true,
            hasWarnings: true
        };

        self.builds.push(build);
        return build;
    };

    self.addLater = function () {
        var build = self.add();

        build.startedAt = new Date(2001, 0, 1);
        build.finishedAt = new Date(2001, 0, 2);

        return build;
    };

    self.update = function (index) {
        self.builds[0].status = 'newStatus';
    };

    self.add();

    return self;
};