var request = require("request");
var graphql = require("graphql.js");

module.exports = function() {
  var configuration = {};
  var graph;

  return {
    configure: function(options) {
      configuration = Object.assign(configuration, options);
      configuration.orgSlug =
        process.env.BUILDKITE_ORGANISATION_SLUG || configuration.orgSlug;
      configuration.teamSlug =
        process.env.BUILDKITE_TEAM_SLUG || configuration.teamSlug;

      if (!configuration.orgSlug)
        throw new Error(
          "Must configure the orgSlug property for the buildkite plugin"
        );
      if (!configuration.teamSlug)
        throw new Error(
          "Must configure the teamSlug property for the buildkite plugin"
        );
      if (!process.env.BUILDKITE_TOKEN)
        throw new Error(
          "Must configure the BUILDKITE_TOKEN environment variable with your bk token."
        );

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
                name
                slug
                builds(first: 1) {
                  edges {
                    node {
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
            const build =
              x.node.builds.edges.length > 0 ?
                x.node.builds.edges[0].node :
                {
                  branch: "master",
                  isRunning: false,
                  createdBy: {
                    name: ""
                  },
                  state: "NOT_RUN",
                  message: "Pipeline Created",
                  number: "N/A"
                };

            const buildStates = {
              SKIPPED: { desc: "The build was skipped", color: "#ffff00" },
              SCHEDULED: {
                desc: "The build has yet to start running jobs",
                color: "#0000ff"
              },
              RUNNING: {
                desc: " The build is currently running jobs",
                color: "#ffa500"
              },
              PASSED: { desc: "The build passed", color: "#008000" },
              FAILED: { desc: "The build failed", color: "#ff0000" },
              CANCELING: {
                desc: "The build is currently being canceled",
                color: "#ffb3b3"
              },
              CANCELED: { desc: "The build was canceled", color: "#ff4d4d" },
              BLOCKED: { desc: "The build is blocked", color: "#003300" },
              NOT_RUN: { desc: "The build wasn't run", color: "#808080" }
            };

            return {
              id: pipeline.slug + "/" + build.number,
              project: pipeline.name,
              branch: build.branch,
              number: build.number,
              isRunning: build.state === "RUNNING",
              startedAt: new Date(build.startedAt),
              finishedAt: new Date(build.finishedAt),
              requestedFor: build.createdBy.name || "x",
              status: buildStates[build.state].color,
              statusText: build.state,
              reason: build.message,
              hasErrors: false,
              hasWarnings: false,
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
