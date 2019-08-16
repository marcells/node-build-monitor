var request = require("request");

module.exports = function() {
  var self = this,
    requestBuilds = function (callback) {
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
        function (error, response, body) {
          if (!body) {
            error = `Invalid response ${JSON.stringify(response)}`;
          }
          callback(error, body);
        }
      );
    },
    queryBuilds = function (callback) {
      requestBuilds(function (error, body) {
        if (error) {
          callback(error);
          return;
        }

        if (self.configuration.groupByWorkflow) {
          callback(
            error,
            groupBuildsByWorkflow(body).reduce((accumulator, build) => {
              accumulator.push(...formatWorkflow(build));
              return accumulator;
            }, [])
          );
        } else {
          callback(error, body.map(build => formatBuild(build)));
        }
      });
    },

    groupBuildsByWorkflow = function (builds) {
      return Object.values(
        builds.reduce(function (accumulator, curBuild, index) {
          if (!curBuild.workflows) {
            curBuild.in_workflow = false;
            accumulator[index] = [curBuild];
          } else {
            curBuild.in_workflow = true;

            if (!accumulator[curBuild.workflows.workflow_id]) {
              accumulator[curBuild.workflows.workflow_id] = [];
            }

            accumulator[curBuild.workflows.workflow_id].push(curBuild);
          }

          return accumulator;
        }, {})
      );
    },
    parseDate = function (isoString) {
      return new Date(isoString);
    },
    getStatus = function (status) {
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
    orderStatuses = function (a, b) {
      const order = [
        "failed", "infrastructure_failed", "timedout",
        "retried", "running", "queued", "not_run", "not_running", "no_tests", "scheduled", "canceled",
        "fixed", "success"
      ];

      return order.indexOf(a) - order.indexOf(b);
    },
    formatBuild = function (build) {
      const { vcs, username, project } = self.configuration;

      return {
        id: `circle|${vcs}|${username}|${project}|${build.build_num}`,
        project: `${username}/${project}`,
        branch: build.branch,
        commit: build.vcs_revision,
        definition: build.subject,
        number: build.build_num,
        isQueued: build.status === "queued",
        isRunning: build.status === "running",
        startedAt: parseDate(build.start_time),
        finishedAt: parseDate(build.stop_time),
        requestedFor: build.author_name || build.author_email,
        status: getStatus(build.status),
        statusText: build.status,
        reason: build.why,
        hasErrors: build.outcome === "infrastructure_fail" || build.outcome === "no_tests" || build.outcome === "timedout",
        hasWarnings: false,
        url: build.build_url
      };
    },
    formatWorkflow = function (buildsGroup) {
      const { vcs, username, project } = self.configuration;

      if (buildsGroup.some(build => build.in_workflow=== false)) {
        return buildsGroup.map(build => self.formatBuild(build));
      }

      return [{
        id: `circle|${vcs}|${username}|${project}|workflow/${
          buildsGroup[0].workflows.workflow_id
          }`,
        project: `${username}/${project}`,
        branch: buildsGroup[0].branch,
        commit: buildsGroup[0].vcs_revision,
        definition: buildsGroup[0].subject,
        number: buildsGroup.map(b => b.build_num).join(', '),
        isQueued: buildsGroup.every(b => b.status === "queued"),
        isRunning: buildsGroup.some(b => b.status === "running"),
        startedAt: parseDate( buildsGroup.map(b => b.start_time).sort().shift() ),
        finishedAt: (buildsGroup.every(b => b.lifecycle !== "running") ?
          parseDate( buildsGroup.map(b => b.stop_time).sort().reverse().shift() ) :
          null),
        requestedFor: buildsGroup[0].author_name || buildsGroup[0].author_email,
        status: getStatus(buildsGroup.map(b => b.status).sort(orderStatuses).shift()),
        statusText: buildsGroup.map(b => b.status).sort(orderStatuses).shift(),
        reason: buildsGroup[0].why,
        hasErrors: buildsGroup.some(b => b.outcome === "infrastructure_fail" || b.outcome === "no_tests" || b.outcome === "timedout"),
        hasWarnings: false,
        url: `https://circleci.com/workflow-run/${buildsGroup[0].workflows.workflow_id}`
      }];
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
  self.formatWorkflow = formatWorkflow;
};
