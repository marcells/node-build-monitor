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
    .replyWithError({'message': 'unexpected error', 'code': 'UNEXPECTED_ERROR'});

  return nock;
}
