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
            let httpErrRes = 'HTTP Reponse: '+response.statusCode+' '+http.STATUS_CODES[response.statusCode];
            if (error) {
              error.message += ' ('+httpErrRes+')';
              callback(error);
            } else {
              // If the request never reached the server, then chances are the error object is null, so lets return a status code error instead
              callback(new Error(httpErrRes));
            }
          }
        });
    }
  }
};
