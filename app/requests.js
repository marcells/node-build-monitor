var request = require('request'),
    ntlm = require('httpntlm');

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
          rejectUnauthorized: false,
          headers: opts.headers || {},
          json: true
        },
        function (error, response, body) {
          callback(error, body);
        });
    }
  }
};
