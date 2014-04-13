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
        self.builds.push({
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
        });
    };

    self.update = function (index) {
        self.builds[0].status = 'newStatus';
    };

    self.add();

    return self;
};