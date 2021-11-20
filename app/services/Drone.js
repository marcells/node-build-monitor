var request = require("request");

module.exports = function () {
  var self = this,
    requestBuilds = function (callback) {
      const url = `${self.api_base}/repos/${self.configuration.slug}/builds`;
      if (self.configuration.debug) {
        console.info(`Requesting GET ${url}`);
      }

      request(
        {
          method: "GET",
          url: url,
          headers: {
            Authorization: self.configuration.token
          },
          json: true
        },
        function (error, response, body) {
          if (response.statusCode !== 200 || !body || !Array.isArray(body)) {
            error = `Invalid response for GET ${url}: ${response.statusCode} with body ${JSON.stringify(response)}`;
          }
          callback(error, body);
        }
      );
    },
    filterBuilds = function (build) {
      var matchesBranch = true,
        matchesEvent = true;

      if (self.configuration.branch) {
        matchesBranch = build.target === self.configuration.branch;
      }

      if (self.configuration.event) {
        matchesEvent = build.event === self.configuration.event;
      }
      return matchesBranch && matchesEvent;
    },
    queryBuilds = function (callback) {
      requestBuilds(function (error, body) {
        if (error) {
          callback(error);
          return;
        }

        callback(
          error,
          body.filter(filterBuilds).map(build => simplifyBuild(build))
        );
      });
    },
    parseDate = function (unix_timestamp) {
      return new Date(unix_timestamp * 1000);
    },
    getStatus = function (status) {
      // Statuses : https://github.com/drone/drone/blob/5b6a3d8ff4c37283cf37df20d871cc8dfe439565/core/status.go
      switch (status) {
        case "pending":
        case "running":
        case "waiting_on_dependencies":
          return "Blue";

        case "skipped":
        case "blocked":
        case "killed":
          return "Gray";

        case "declined":
        case "failure":
        case "error":
          return "Red";

        case "success":
          return "Green";

        default:
          return "Gray";
      }
    },
    simplifyBuild = function (res) {
      return {
        id: `drone|${self.configuration.slug}|${res.id}`,
        project: self.configuration.slug,
        number: res.number,
        isRunning: res.finished === 0,
        startedAt: parseDate(res.started),
        finishedAt: parseDate(res.finished),
        requestedFor: res.author_name || res.author_login || res.author_email,
        status: getStatus(res.status),
        statusText: res.status,
        reason: res.event,
        hasErrors: res.status === "error" || res.status === "failure",
        hasWarnings: res.status === "blocked",
        url: `https://${self.configuration.url}/${self.configuration.slug}/${
          res.number
        }`
      };
    };

  self.configure = function (config) {
    self.configuration = config;

    if (!self.configuration.slug) {
      console.error(`[Drone] Please configure the [slug] parameter`);
      return;
    }

    if (!self.configuration.url) {
      console.error(
        `[Drone ${
          self.configuration.slug
        }] Please configure the [url] parameter`
      );
      return;
    }

    if (!self.configuration.token) {
      console.error(
        `[Drone ${
          self.configuration.slug
        }] Please configure the [token] parameter`
      );
      return;
    }

    self.configuration.url = self.configuration.url;
    self.configuration.token = self.configuration.token || "";

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

    self.api_base = `https://${self.configuration.url}/api`;
  };

  self.check = function (callback) {
    queryBuilds(callback);
  };
};
