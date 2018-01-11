var request = require("request");
var graphql = require("graphql.js");

module.exports = function() {
  var configuration = {};
  var graph;

  return {
    configure: function(options) {
      configuration = Object.assign(configuration, options);
      configuration.orgSlug = process.env.BUILDKITE_ORGANISATION_SLUG || configuration.orgSlug;
      configuration.teamSlug = process.env.BUILDKITE_TEAM_SLUG || configuration.teamSlug;

      if (!configuration.orgSlug) throw new Error("Must configure the orgSlug property for the buildkite plugin");
      if (!configuration.teamSlug) throw new Error("Must configure the teamSlug property for the buildkite plugin");
      if (!process.env.BUILDKITE_TOKEN) throw new Error("Must configure the BUILDKITE_TOKEN environment variable with your bk token.");

      graph = graphql("https://graphql.buildkite.com/v1", {
        asJSON: true,
        headers: {
          Authorization: `Bearer ${process.env.BUILDKITE_TOKEN}`
        }
      });
    },
    check: function(callback) {
      graph
        .query(
          `
      SimpleQuery {
        organization(slug: "${configuration.orgSlug}") {
          name
          pipelines(first: 100, team: "${configuration.teamSlug}") {
            edges {
              node {
                id
                name
                slug
                builds(first: 1) {
                  edges {
                    node {
                      id
                      branch
                      message
                      number
                      state
                      startedAt
                      finishedAt
                      url
                      createdBy {
                        ... on User {
                          name
                        }
                        ... on UnregisteredUser {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      `,
          {}
        )
        .then(function(response) {
          const result = response.organization.pipelines.edges.map(x => {
            const pipeline = x.node;
            const build = x.node.builds.edges[0].node;

            const buildStates = {
              SKIPPED: { desc: "The build was skipped", status: "Gray", warning: true, statusText: "Skipped" },
              SCHEDULED: { desc: "The build has yet to start running jobs", status: "Blue", statusText: "Scheduled" },
              RUNNING: { desc: " The build is currently running jobs", status: "Blue", statusText: "Running" },
              PASSED: { desc: "The build passed", status: "Green", statusText: "Passed" },
              FAILED: { desc: "The build failed", status: "Red", error: true, statusText: "Failed" },
              CANCELING: { desc: "The build is currently being canceled", status: "Gray", warning: true, statusText: "Canceling" },
              CANCELED: { desc: "The build was canceled", status: "Gray", warning: true, statusText: "Cancelled" },
              BLOCKED: { desc: "The build is blocked", status: "Blue", warning: true, statusText: "Blocked" },
              NOT_RUN: { desc: "The build wasn't run", status: "Gray", statusText: "Not Run" }
            };

            return {
              id: build.id,
              project: pipeline.name,
              branch: build.branch,
              commit: build.commit,
              number: build.number,
              isRunning: build.state === "RUNNING",
              startedAt: new Date(build.startedAt),
              finishedAt: new Date(build.finishedAt),
              requestedFor: build.createdBy.name || "",
              status: buildStates[build.state].status,
              statusText: buildStates[build.state].statusText,
              reason: build.message,
              hasErrors: buildStates[build.state].error || false,
              hasWarnings: buildStates[build.state].warning || false,
              url: build.url
            };
          });
          callback(null, result);
        })
        .catch(function(error) {
          console.log(error);
          callback(error);
        });
    }
  };
};
