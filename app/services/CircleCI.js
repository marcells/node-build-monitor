var request = require("request");

module.exports = function() {
  var self = this,
    requestBuilds = function(callback) {
      const {
        vcs,
        username,
        project,
        token,
        limit,
        branch
      } = self.configuration;

      let branchSuffix = "";
      if (branch) {
        branchSuffix = `/tree/${branch}`;
      }

      const url = `${
        self.api_base
      }/project/${vcs}/${username}/${project}${branchSuffix}`;

      if (self.configuration.debug) {
        console.info(`Requesting GET ${url}`);
      }

      request(
        {
          method: "GET",
          url: url,
          qs: {
            shallow: "true",
            "circle-token": token,
            limit: limit
          },
          json: true
        },
        function(error, response, body) {
          if (!body) {
            error = `Invalid response ${JSON.stringify(response)}`;
          }
          callback(error, body);
        }
      );
    },
    queryBuilds = function(callback) {
      requestBuilds(function(error, body) {
        if (error) {
          callback(error);
          return;
        }

        if (self.configuration.groupByWorkflow) {
          callback(
            error,
            groupBuildsByWorkflow(body).map(build => formatWorkflowBuild(build))
          );
        } else {
          callback(error, body.map(build => formatBuild(build)));
        }
      });
    },
    parseDate = function(isoString) {
      return new Date(isoString);
    },
    getStatus = function(status) {
      switch (status) {
        case "retried":
        case "running":
          return "Blue";

        case "queued":
        case "not_run":
        case "not_running":
        case "no_tests":
        case "scheduled":
        case "canceled":
          return "Gray";

        case "failed":
        case "infrastructure_failed":
        case "timedout":
          return "Red";

        case "fixed":
        case "success":
          return "Green";

        default:
          return null;
      }
    },
    formatBuild = function(res) {
      const { vcs, username, project } = self.configuration;

      return {
        id: `circle|${vcs}|${username}|${project}|${res.build_num}`,
        project: `${username}/${project}`,
        branch: res.branch,
        commit: res.vcs_revision,
        definition: res.subject,
        number: res.build_num,
        isQueued: res.status === "queued",
        isRunning: res.stop_time === null,
        startedAt: parseDate(res.start_time),
        finishedAt: parseDate(res.stop_time),
        requestedFor: res.author_name || res.author_email,
        status: getStatus(res.status),
        statusText: res.status,
        reason: res.why,
        hasErrors:
          res.status === "failed" || res.status === "infrastructure_failed",
        hasWarnings: res.status === "timedout",
        url: res.build_url
      };
    },
    formatWorkflowBuild = function(res) {
      const { vcs, username, project } = self.configuration;

      return {
        id: `circle|${vcs}|${username}|${project}|workflow/${
          res.workflows.workflow_id
        }`,
        project: `${username}/${project}`,
        branch: res.branch,
        commit: res.vcs_revision,
        definition: res.subject,
        number: `${res.workflows.workflow_name}/${res.build_num}`,
        isQueued: res.status === "queued",
        isRunning: res.stop_time === null,
        startedAt: parseDate(res.start_time),
        finishedAt: parseDate(res.stop_time),
        requestedFor: res.author_name || res.author_email,
        status: getStatus(res.status),
        statusText: `${res.status} (${res.workflows.job_name})`,
        reason: res.why,
        hasErrors:
          res.status === "failed" || res.status === "infrastructure_failed",
        hasWarnings: res.status === "timedout",
        url: res.build_url
      };
    },
    groupBuildsByWorkflow = function(builds) {
      const groupedByWorkflowId = Object.values(
        builds.reduce(function(accumulator, curBuild, index) {
          if (!curBuild.workflows) {
            accumulator[index] = curBuild;
          } else {
            accumulator[curBuild.workflows.workflow_id] = [
              ...(accumulator[curBuild.workflows.workflow_id] || []),
              curBuild
            ];
          }
          return accumulator;
        }, {})
      );

      const selectedBuilds = groupedByWorkflowId.map(function(builds) {
        const mostRecentOngoingOne = builds
          .filter(
            build => build.lifecycle == "queued" || build.lifecycle == "running"
          )
          .filter(build => build.start_time)
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
          .shift();
        const latestFinishedOne = builds
          .filter(build => build.lifecycle == "finished")
          .filter(build => build.stop_time)
          .sort((a, b) => new Date(a.stop_time) - new Date(b.stop_time))
          .shift();

        return mostRecentOngoingOne || latestFinishedOne;
      });

      return selectedBuilds;
    };

  self.configure = function(config) {
    self.configuration = config;

    if (!self.configuration.vcs) {
      console.error(`[CircleCI] Please configure the [vcs] parameter`);
      return;
    }
    if (!self.configuration.username) {
      console.error(`[CircleCI] Please configure the [username] parameter`);
      return;
    }
    if (!self.configuration.project) {
      console.error(`[CircleCI] Please configure the [project] parameter`);
      return;
    }

    if (!self.configuration.token) {
      console.error(
        `[CircleCI ${self.configuration.vcs}/${self.configuration.username}/${
          self.configuration.project
        }] Please configure the [token] parameter`
      );
      return;
    }

    self.configuration.limit = self.configuration.limit || 30;

    if (typeof self.configuration.caPath !== "undefined") {
      request = request.defaults({
        agentOptions: {
          ca: require("fs")
            .readFileSync(self.configuration.caPath)
            .toString()
            .split("\n\n")
        }
      });
    }

    self.api_base = "https://circleci.com/api/v1.1";
  };

  self.check = function(callback) {
    queryBuilds(callback);
  };

  self.groupBuildsByWorkflow = groupBuildsByWorkflow;
};
