var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    rewire = require('rewire'),
    path = require('path');

chai.use(sinonChai);

describe('GitLab service', function () {
    context('Custom root CA path', function () {

        var gitlab, requestStub;

        beforeEach(function () {
            // Set path to dummy CA cert
            this.caPath = path.resolve(__dirname, 'data', 'ca.pem');

            // Stub out request module in GitLab module
            requestStub = {
                defaults: sinon.stub()
            };
            var gitlabModule = rewire('../../app/services/GitLab');
            gitlabModule.__set__('request', requestStub);

            gitlab = new gitlabModule();
        });

        it('should set the default CA in the request module', function () {
            var expectedCert = require('fs').readFileSync(this.caPath).toString().split("\n\n");

            gitlab.configure({
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
