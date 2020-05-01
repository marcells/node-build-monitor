var chai = require('chai'),
  expect = chai.expect,
  sinonChai = require('sinon-chai'),
  nock = require('nock');

chai.use(sinonChai);

describe('Drone service', function () {
  var droneCIUrl = 'droneserver.com';
  var droneSlug = 'someSlug';

  context('Filtering Builds', function () {
    var droneService;

    beforeEach(function () {
      nock('https://' + droneCIUrl)
        .get('/api/repos/' + droneSlug + '/builds')
        .reply('200',
          JSON.stringify([
            createDroneBuildEvent('master', 'push'),
            createDroneBuildEvent('branch1', 'push'),
            createDroneBuildEvent('master', 'promote'),
            createDroneBuildEvent('master', 'tag'),
            createDroneBuildEvent('master', 'cron'),
            createDroneBuildEvent('branch2', 'pull_request')
          ])
        );
      droneService = new (require('../../app/services/Drone'));
    });

    afterEach(function () {
      nock.cleanAll()
    });

    it('should filter out no builds when no branch or event', function (done) {
      droneService.configure({
        url: droneCIUrl,
        token: 'someToken',
        slug: droneSlug
      });

      droneService.check(function (error, builds) {
        expect(error).to.be.null;
        expect(builds.length).to.equal(6);

        var pushMasterBuild = builds[0];
        expect(pushMasterBuild.project).to.equal('someSlug');
        expect(pushMasterBuild.reason).to.equal('push');
        expect(pushMasterBuild.requestedFor).to.equal('pushmaster');

        var pushBranch1Build = builds[1];
        expect(pushBranch1Build.project).to.equal('someSlug');
        expect(pushBranch1Build.reason).to.equal('push');
        expect(pushBranch1Build.requestedFor).to.equal('pushbranch1');

        var promoteBranch1Build = builds[2];
        expect(promoteBranch1Build.project).to.equal('someSlug');
        expect(promoteBranch1Build.reason).to.equal('promote');
        expect(promoteBranch1Build.requestedFor).to.equal('promotemaster');

        var tagMasterBuild = builds[3];
        expect(tagMasterBuild.project).to.equal('someSlug');
        expect(tagMasterBuild.reason).to.equal('tag');
        expect(tagMasterBuild.requestedFor).to.equal('tagmaster');

        var cronBranch1Build = builds[4];
        expect(cronBranch1Build.project).to.equal('someSlug');
        expect(cronBranch1Build.reason).to.equal('cron');
        expect(cronBranch1Build.requestedFor).to.equal('cronmaster');

        var prBranch2Build = builds[5];
        expect(prBranch2Build.project).to.equal('someSlug');
        expect(prBranch2Build.reason).to.equal('pull_request');
        expect(prBranch2Build.requestedFor).to.equal('pull_requestbranch2');

        done();
      });
    });

    it('should filter out builds when only branch', function (done) {
      droneService.configure({
        url: droneCIUrl,
        token: 'someToken',
        slug: droneSlug,
        branch: 'master'
      });

      droneService.check(function (error, builds) {
        expect(error).to.be.null;
        expect(builds.length).to.equal(4);
        var pushMasterBuild = builds[0];
        expect(pushMasterBuild.project).to.equal('someSlug');
        expect(pushMasterBuild.reason).to.equal('push');
        expect(pushMasterBuild.requestedFor).to.equal('pushmaster');

        var promoteBranch1Build = builds[1];
        expect(promoteBranch1Build.project).to.equal('someSlug');
        expect(promoteBranch1Build.reason).to.equal('promote');
        expect(promoteBranch1Build.requestedFor).to.equal('promotemaster');

        var tagMasterBuild = builds[2];
        expect(tagMasterBuild.project).to.equal('someSlug');
        expect(tagMasterBuild.reason).to.equal('tag');
        expect(tagMasterBuild.requestedFor).to.equal('tagmaster');

        var cronBranch1Build = builds[3];
        expect(cronBranch1Build.project).to.equal('someSlug');
        expect(cronBranch1Build.reason).to.equal('cron');
        expect(cronBranch1Build.requestedFor).to.equal('cronmaster');

        done();
      });

    });

    it('should filter out builds when only event', function (done) {
      droneService.configure({
        url: droneCIUrl,
        token: 'someToken',
        slug: droneSlug,
        event: 'push'
      });

      droneService.check(function (error, builds) {
        expect(error).to.be.null;
        expect(builds.length).to.equal(2);
        var pushMasterBuild = builds[0];
        expect(pushMasterBuild.project).to.equal('someSlug');
        expect(pushMasterBuild.reason).to.equal('push');
        expect(pushMasterBuild.requestedFor).to.equal('pushmaster');

        var pushBranch1Build = builds[1];
        expect(pushBranch1Build.project).to.equal('someSlug');
        expect(pushBranch1Build.reason).to.equal('push');
        expect(pushBranch1Build.requestedFor).to.equal('pushbranch1');

        done();
      });
    });

    it('should filter out builds when branch and event', function (done) {
      droneService.configure({
        url: droneCIUrl,
        token: 'someToken',
        slug: droneSlug,
        event: 'push',
        branch: 'master'
      });

      droneService.check(function (error, builds) {
        expect(error).to.be.null;
        expect(builds.length).to.equal(1);

        var pushMasterBuild = builds[0];
        expect(pushMasterBuild.project).to.equal('someSlug');
        expect(pushMasterBuild.reason).to.equal('push');
        expect(pushMasterBuild.requestedFor).to.equal('pushmaster');

        done();
      });
    });
  });
});

function createDroneBuildEvent(branch, event) {
  return {
    "id": 154736,
    "repo_id": 101,
    "trigger": "@hook",
    "number": 1,
    "status": "success",
    "event": event,
    "action": "",
    "link": "https://github.com/SOMESLUG/compare/8ef93561d40c...fb3e1feeb697",
    "timestamp": 0,
    "message": "SOME COMMIT MESSAGE",
    "before": "8ef93561d40c1985af0826f4c69482563fb05ee0",
    "after": "fb3e1feeb6977f88b3f6cbc25e465885db4f3465",
    "ref": "refs/heads/master",
    "source_repo": "",
    "source": "master",
    "target": branch,
    "author_login": "someUser",
    "author_name": event + branch,
    "author_email": "someone@example.com",
    "author_avatar": "https://github.com/avatars/u/123?",
    "sender": "someUser",
    "started": 1587499541,
    "finished": 1587499853,
    "created": 1587499540,
    "updated": 1587499541,
    "version": 3
  };
}
