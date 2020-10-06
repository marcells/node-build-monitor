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

  context('Calculate state', function () {

    var gitlab;
    beforeEach(function () {
      var gitlabModule = rewire('../../app/services/GitLab');
      gitlab = new gitlabModule();
    });

    it('Calculate state', function (done) {
      var nock = require('nock');

      nock('http://foo')
        .get('/api/v4/projects?page=1&per_page=100').times(2)
        .reply('200', {
          "id": 4,
          "description": null,
          "default_branch": "master",
          "ssh_url_to_repo": "git@example.com:diaspora/diaspora-client.git",
          "http_url_to_repo": "http://example.com/diaspora/diaspora-client.git",
          "web_url": "http://example.com/diaspora/diaspora-client",
          "readme_url": "http://example.com/diaspora/diaspora-client/blob/master/README.md",
          "tag_list": [
            "example",
            "disapora client"
          ],
          "namespace": {
            "id": 3,
            "name": "Diaspora",
            "path": "diaspora",
            "kind": "group",
            "full_path": "diaspora"
          },
          "name": "Diaspora Client",
          "name_with_namespace": "Diaspora / Diaspora Client",
          "path": "diaspora-client",
          "path_with_namespace": "diaspora/diaspora-client",
          "created_at": "2013-09-30T13:46:02Z",
          "last_activity_at": "2013-09-30T13:46:02Z",
          "forks_count": 0,
          "avatar_url": "http://example.com/uploads/project/avatar/4/uploads/avatar.png",
          "star_count": 0,
        }, {"x-total-pages": "1"});

      nock("http://foo").get("/api/v4/projects/4/pipelines").reply(200, [{
        "id": 47,
        "status": "pending",
        "ref": "new-pipeline",
        "sha": "a91957a858320c0e17f3a0eca7cfacbff50ea29a",
        "web_url": "https://example.com/foo/bar/pipelines/47",
        "created_at": "2016-08-11T11:28:34.085Z",
        "updated_at": "2016-08-11T11:32:35.169Z",
      }]);

      nock("http://foo").get("/api/v4/projects/4/pipelines/47").reply(200, {
        "id": 47,
        "status": "success",
        "ref": "new-pipeline",
        "sha": "a91957a858320c0e17f3a0eca7cfacbff50ea29a",
        "web_url": "https://example.com/foo/bar/pipelines/47",
        "created_at": "2016-08-11T11:28:34.085Z",
        "updated_at": "2016-08-11T11:32:35.169Z",
        "detailed_status": {
          "icon": "status_warning",
          "text": "passed",
          "label": "passed with warnings",
          "group": "success-with-warnings",
          "tooltip": "passed",
          "has_details": false,
          "details_path": "/replaceWithFOooByMe/pipelines/1234567",
          "illustration": null,
          "favicon": "/assets/ci_favicons/favicon_status_success-8451333011eee8ce9f2ab25dc487fe24a8758c694827a582f17f42b0a90446a2.png"
        }
      });

      nock("http://foo").get("/api/v4/projects/4/pipelines/47/jobs/").reply(200, {
        "id": 47,
        "status": "pending",
        "ref": "new-pipeline",
        "sha": "a91957a858320c0e17f3a0eca7cfacbff50ea29a",
        "web_url": "https://example.com/foo/bar/pipelines/47",
        "created_at": "2016-08-11T11:28:34.085Z",
        "updated_at": "2016-08-11T11:32:35.169Z",
      });

      gitlab.configure({"slugs": [{"project": "diaspora/diaspora-client"}], "url": "http://foo"})

      gitlab.check(function (err, builds) {
        expect(builds.length).to.equal(1);
        expect(builds[0].hasWarnings).to.be.true;
        expect(builds[0].status).to.equal("#ffa500");

        done();
      });
    });
  });
});
