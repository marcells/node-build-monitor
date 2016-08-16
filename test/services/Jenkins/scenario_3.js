var job_info_result = { actions: [ null, {}, {} ],
  description: 'This job run bestpractices testcases.<br/>\r\n\r\nrepo [https://dev.jazzteam.org/projects/xml2selenium-bestpractices]<br/>',
  displayName: 'xml2selenium-bestpractices',
  displayNameOrNull: null,
  name: 'xml2selenium-bestpractices',
  url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/',
  buildable: true,
  builds:
   [ { number: 338,
       url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/338/' },
     { number: 337,
       url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/337/' } ],
  color: 'blue',
  firstBuild:
   { number: 319,
     url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/319/' },
  healthReport:
   [ { description: 'Test Result: 0 tests failing out of a total of 101 tests.',
       iconClassName: 'icon-health-80plus',
       iconUrl: 'health-80plus.png',
       score: 100 },
     { description: 'Build stability: No recent builds failed.',
       iconClassName: 'icon-health-80plus',
       iconUrl: 'health-80plus.png',
       score: 100 } ],
  inQueue: false,
  keepDependencies: false,
  lastBuild: { number: 338, url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/338/' },
  lastCompletedBuild: { number: 338, url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/338/' },
  lastFailedBuild: null,
  lastStableBuild: { number: 338, url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/338/' },
  lastSuccessfulBuild: { number: 338, url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/338/' },
  lastUnstableBuild: { number: 337, url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/337/' },
  lastUnsuccessfulBuild: { number: 337, url: 'http://dev.jazzteam.org:8080/job/xml2selenium-bestpractices/337/' },
  nextBuildNumber: 339,
  property: [ {} ],
  queueItem: null,
  concurrentBuild: false,
  downstreamProjects: [],
  scm: {},
  upstreamProjects: [] };

var build_info_337_result = "Illegal JSON data is returned";
var build_info_338_result = "Illegal JSON data is returned";

exports.configuration = {
  "url": "http://dev.jazzteam.org:8080",
  "username": "x2sdemo",
  "password": "x2sdemo",
  "job": "xml2selenium-bestpractices"
};

exports.setup = function () {
  var nock = require('nock');

  nock('http://dev.jazzteam.org:8080')
    .get('/job/xml2selenium-bestpractices/api/json')
    .reply('200', job_info_result);

  nock('http://dev.jazzteam.org:8080')
    .get('/job/xml2selenium-bestpractices/338/api/json')
    .reply('200', build_info_338_result);

  nock('http://dev.jazzteam.org:8080')
    .get('/job/xml2selenium-bestpractices/337/api/json')
    .reply('200', build_info_337_result);

  return nock;
}
