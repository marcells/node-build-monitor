var should = require('should');
var scenario_1 = require('./scenario_1');
var scenario_2 = require('./scenario_2');

describe('Jenkins service', function () {
    var service, nock;

    beforeEach(function () {
        service = new (require('../../../app/services/Jenkins'))();
        service.configure(scenario_1.configuration);
    });

    afterEach(function () {
        nock.cleanAll();
    });

    describe('builds are checked', function () {
        before(function() {
          nock = scenario_1.setup();
        });

        it('should return the valid builds', function (done) {
            service.check(function(error, builds) {
                if (error) {
                    done(error);
                    return;
                }

                builds.should.eql(scenario_1.expected);

                done();
              });
          });
      });

      describe('a problem occurs while checking the builds', function () {
        before(function() {
            nock = scenario_2.setup();
        });

        it('should handle the request error', function (done) {
            service.check(function(error, builds) {
                should.not.exist(builds);
                error.should.eql({ message: 'unexpected error', code: 'UNEXPECTED_ERROR' });

                done();
            });
        });
    });
});
