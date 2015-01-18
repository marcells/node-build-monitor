describe('monitor', function () {
    var monitor;

    beforeEach(function () {
        monitor = new (require('../app/monitor'))();

        monitor.configure({
            interval: 1,
            numberOfBuilds: 3
        });
    });

    describe('a new monitor', function () {
        it('should not have plugins', function () {
            monitor.plugins.should.be.empty;
        });

        it('should not display any builds', function () {
            monitor.currentBuilds.should.be.empty;
        });
    });

    describe('watching a plugin', function () {
        var fake;

        beforeEach(function () {
            fake = new (require('./fake'))();
            monitor.watchOn(fake);
        });

        it('should have one plugin', function () {
            monitor.plugins.should.have.lengthOf(1);
        });

        describe('a running monitor', function () {
            it('should invoke the buildsChanged event', function (done) {
                monitor.once('buildsChanged', function (changes) {
                    changes.added.should.have.lengthOf(1);
                    changes.order.should.have.lengthOf(1);

                    done();
                });

                monitor.run();
            });

            it('should invoke the buildsChanged event and contain an etag', function (done) {
                monitor.once('buildsChanged', function (changes) {
                    changes.added[0].should.have.ownProperty('etag');
                    
                    done();
                });

                monitor.run();
            });

            it('should invoke the buildsChanged two times, when a build is updated', function (done) {
                monitor.once('buildsChanged', function (firstChanges) {
                    monitor.once('buildsChanged', function (secondChanges) {
                        firstChanges.added.should.have.lengthOf(1);
                        secondChanges.updated.should.have.lengthOf(1);
                        secondChanges.order.should.have.lengthOf(1);

                        done();
                    });

                    fake.update(0);
                });

                monitor.run();
            });

            it('should invoke the buildsChanged two times, when a build is added', function (done) {
                monitor.once('buildsChanged', function (firstChanges) {
                    monitor.once('buildsChanged', function (secondChanges) {
                        firstChanges.added.should.have.lengthOf(1);
                        secondChanges.added.should.have.lengthOf(1);
                        secondChanges.order.should.eql(['project_2', 'project_1']);

                        done();
                    });

                    fake.addLater();
                });

                monitor.run();
            });
        });
    });
});
