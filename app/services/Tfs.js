import request from 'request';

export default function() {
  let makeUrl = (url, odata) => {
      let baseUrl = 'https://tfsodata.visualstudio.com/' + this.configuration.collection + url;

      if (odata) {
        baseUrl += '?' + odata;
      }

      return baseUrl;
    },
    makeRequest = (url, callback) => {
      request({
        'url': url,
        'rejectUnauthorized': false,
        'headers': {
          'Accept': 'application/json'
        },
        'json': true,
        'auth': {
          'user': this.configuration.accountname + '\\' + this.configuration.username,
          'pass': this.configuration.password
        }
      }, (error, response, body) => callback(body));
    },
    parseDate = dateAsString => new Date(parseInt(dateAsString.substr(6))),
    forEachResult = (body, callback) => {
      for (let result of body.d.results) {
        callback(result);
      }
    },
    isNullOrWhiteSpace = string => !string || string === null || string.match(/^ *$/) !== null,
    getStatus = statusText => {
      if (statusText === "Succeeded") return "Green";
      if (statusText === "Failed") return "Red";
      if (statusText === "InProgress") return "Blue";
      if (statusText === "Stopped") return "Gray";
      if (statusText === "PartiallySucceeded") return "'#FFA500'";

      return null;
    },
    simplifyBuild = res => {
      return {
        id: res.Project + '|' + res.Definition + '|' + res.Number,
        project: res.Project,
        definition: res.Definition,
        number: res.Number,
        isRunning: !res.BuildFinished,
        startedAt: parseDate(res.StartTime),
        finishedAt: parseDate(res.FinishTime),
        requestedFor: res.RequestedFor,
        statusText: res.Status,
        status: getStatus(res.Status),
        reason: res.Reason,
        hasErrors: !isNullOrWhiteSpace(res.Errors),
        hasWarnings: !isNullOrWhiteSpace(res.Warnings)
      };
    },
    queryBuilds = callback => {
      let builds = [];
      makeRequest(makeUrl('/Builds', '$top=12&$orderby=StartTime%20desc'), body => {
        forEachResult(body, res => {
          builds.push(simplifyBuild(res));
        });

        callback(builds);
      });
    };

  this.configure = config => {
    this.configuration = config;
  };

  this.check = callback => {
    queryBuilds(callback);
  };
}
