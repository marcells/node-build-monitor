module.exports = function () {
	this.check = function (callback) {
        callback([{
            id: '0',
            project: 'project',
            number: 'number',
            isRunning: true,
            startedAt: new Date(),
            finishedAt: new Date(),
            requestedFor: 'author',
            status: 'status',
            statusText: 'statusText',
            reason: 'reason',
            hasErrors: true,
            hasWarnings: true
        }]);
    };
};