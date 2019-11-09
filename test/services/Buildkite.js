const chai = require("chai"),
  expect = chai.expect,
  sinon = require("sinon"),
  sinonChai = require("sinon-chai"),
  rewire = require("rewire"),
  path = require("path");

const graphql = require("graphql.js");
const Buildkite = rewire("../../app/services/Buildkite");

process.env.BUILDKITE_TOKEN = "FAKE_BUILDKITE_TOKEN";
chai.use(sinonChai);

describe("Buildkite service", function() {
  const buildkiteReturnData = noCreatedByUserData();
  let buildkite;

  // Scheduled builds no longer have a created by user set.
  context("Should process builds without a created by user", function() {
    this.beforeAll(function() {
      const graphqlStub = sinon.stub().callsFake(() => {
        return {
          query: () => new Promise(resolve => resolve(buildkiteReturnData))
        };
      });

      Buildkite.__set__("graphql", graphqlStub);
      buildkite = Buildkite();
      buildkite.configure({
        orgSlug: "org_slug",
        teamSlug: "everyone"
      });
    });

    it("should return a null 'requestedFor' for the build without a createdBy User", function(done) {
      buildkite.check((_, results) => {
        try {
          expect(results[0].requestedFor).to.be.equal("John Doe");
          expect(results[1].requestedFor).to.be.null;
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});

//Some fake buildkite data to test builds that do not have a created by user
function noCreatedByUserData() {
  return {
    organization: {
      name: "Org name",
      pipelines: {
        edges: [
          {
            node: {
              id: "RANDOMONID_1",
              name: "pipeline name 1",
              slug: "pipeline_slug_1",
              builds: {
                edges: [
                  {
                    node: {
                      id: "RANDOMONID_2",
                      branch: "master",
                      message: ":sparkles: linting",
                      number: 7,
                      state: "PASSED",
                      startedAt: "2019-10-29T22:30:43Z",
                      finishedAt: "2019-10-29T22:44:34Z",
                      url:
                        "https://buildkite.com/org_slug/pipeline_slug_1/builds/7",
                      createdBy: {
                        name: "John Doe"
                      }
                    }
                  }
                ]
              }
            }
          },
          {
            node: {
              id: "RANDOMONID_3",
              name: "pipeline name 2",
              slug: "pipeline_slug_2",
              builds: {
                edges: [
                  {
                    node: {
                      id: "RANDOMONID_4",
                      branch: "master",
                      message: ":rocket: deployment sceripts",
                      number: 170,
                      state: "PASSED",
                      startedAt: "2019-11-03T20:44:06Z",
                      finishedAt: "2019-11-03T20:56:53Z",
                      url:
                        "https://buildkite.com/org_slug/trust-pipeline_slug_2/builds/170",
                      createdBy: null
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    }
  };
}
