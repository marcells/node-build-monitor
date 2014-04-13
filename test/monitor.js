describe('monitor', function () {
    var monitor = new (require('../app/monitor'))();

    describe('when created', function () {
        it('should the plugins be empty', function() {
            monitor.plugins.should.be.empty;
        });

        it('should the list of builds be empty', function() {
            monitor.plugins.should.be.empty;
        });
    });
});