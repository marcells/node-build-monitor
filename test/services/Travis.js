var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    rewire = require('rewire'),
    path = require('path');

chai.use(sinonChai);

describe('Travis service', function () {
    context('Custom root CA path', function () {

        var travis, requestStub;

        beforeEach(function () {
            // Set path to dummy CA cert
            this.caPath = path.resolve(__dirname, 'data', 'ca.pem');

            // Stub out request module in Travis module
            requestStub = {
                defaults: sinon.stub()
            };
            var travisModule = rewire('../../app/services/Travis');
            travisModule.__set__('request', requestStub);

            travis = new travisModule();
        });

        it('should set the default CA in the request module', function () {
            var expectedCert = require('fs').readFileSync(this.caPath).toString().split("\n\n");

            travis.configure({
                caPath: this.caPath
            });

            expect(requestStub.defaults).to.have.been.calledWithExactly({
                agentOptions: {
                    ca: expectedCert
                }
            });
        });
    });
});
