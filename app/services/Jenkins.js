import jenkinsapi from 'jenkins-api';
import async from 'async';

let makeRequestConfiguration = serviceConfiguration => {
  let tryApplyAuthHeader = (requestConfig, key, value) => {
    if (!value) return;

    requestConfig.auth = requestConfig.auth || {};
    requestConfig.auth[key] = value;
  };

  let requestConfig = serviceConfiguration.options || {};

  tryApplyAuthHeader(requestConfig, 'user', serviceConfiguration.username);
  tryApplyAuthHeader(requestConfig, 'pass', serviceConfiguration.password);

  return requestConfig;
};

export default function() {
  let jenkins,
    requestBuilds = callback => {
      jenkins.job_info(this.configuration.job, (error, data) => {
        callback(data.builds);
      });
    },
    requestBuild = (build, callback) => {
      jenkins.build_info(this.configuration.job, build.number, (error, data) => {
        callback(error, simplifyBuild(data));
      });
    },
    queryBuilds = callback => {
      requestBuilds(body => {
        async.map(body, requestBuild, (error, results) => callback(results));
      });
    },
    parseDate = dateAsString => new Date(dateAsString),
    getStatus = result => {
      if (result === 'FAILURE') return "Red";
      if (result === 'SUCCESS') return "Green";
      if (result === 'UNSTABLE') return "Green";
      if (result === 'NOT_BUILT') return "Blue";
      if (result === 'ABORTED') return "Gray";
      if (result === null) return "Blue";

      return null;
    },
    getStatusText = result => {
      if (result === 'FAILURE') return "Failure";
      if (result === 'SUCCESS') return "Success";
      if (result === 'UNSTABLE') return "Unstable";
      if (result === 'NOT_BUILT') return "Running";
      if (result === 'ABORTED') return "Aborted";
      if (result === null) return "Running";

      return null;
    },
    getRequestedFor = build => {
      if (build.actions) {
        for (let action of build.actions) {
          if (action && action.causes) {
            for (let cause of action.causes) {
              if (cause && cause.userName) {
                return cause.userName;
              }
            }
          }
        }
      }

      return "Unknown";
    },
    simplifyBuild = res => {
      return {
        id: this.configuration.job + '|' + res.id,
        project: this.configuration.job,
        number: res.number,
        isRunning: res.building,
        startedAt: parseDate(res.timestamp),
        finishedAt: parseDate(res.timestamp + res.duration),
        requestedFor: getRequestedFor(res),
        status: getStatus(res.result),
        statusText: getStatusText(res.result),
        reason: "Build",
        hasErrors: false,
        hasWarnings: res.result == 'UNSTABLE',
        url: this.configuration.url + '/job/' + this.configuration.job + '/' + res.number
      };
    };

  this.configure = config => {
    this.configuration = config;

    if (this.configuration.url.indexOf('@') > -1) {
      throw new Error(
        'Breaking Configuration change:\n' +
        'To display build details, the url parameter is now published to the client. \n' +
        'This leads to a security risk, cause your credentials would also be published. \n' +
        'Please use now the \'username\' and \'password\' options. \n' +
        'More information on: https://github.com/marcells/node-build-monitor#jenkins \n\n');
    }

    jenkins = jenkinsapi.init(this.configuration.url, makeRequestConfiguration(this.configuration));
  };

  this.check = callback => {
    queryBuilds(callback);
  };
}
