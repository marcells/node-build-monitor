var request = require('request'),
    ntlm = require('httpntlm');
    http = require('http');

module.exports = {
  makeRequest: function (opts, callback) {
    if (opts.authentication && opts.authentication.trim() === 'ntlm') {
      ntlm.get({
        url: opts.url,
        username: opts.username,
        password: opts.password,
        headers: opts.headers || {}
      }, function (error, response) {
        callback(error, JSON.parse(response.body));
      });
    } else {
      request({
          url: opts.url,
          rejectUnauthorized: false,    // Don't validate SSL certs
          headers: opts.headers || {},
          json: true
        },
        function (error, response, body) {
          if (response.statusCode === 200) {
            callback(error, body);
          } else {
            callback('HTTP Reponse: '+response.statusCode+' '+http.STATUS_CODES[response.statusCode]);
          }
        });
    }
  }
};
