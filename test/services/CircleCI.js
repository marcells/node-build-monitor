var chai = require("chai"),
  expect = chai.expect,
  sinon = require("sinon"),
  sinonChai = require("sinon-chai"),
  rewire = require("rewire"),
  path = require("path");

chai.use(sinonChai);

describe("CircleCI service", function() {
  context("Group by workflow", function() {
    var circleci, requestStub;

    beforeEach(function() {
      var circleciModule = rewire("../../app/services/CircleCI");
      circleci = new circleciModule();
    });

    it("should set the default CA in the request module", function() {
      const builds = "abc";
      const expected = "def";
      expect(circleci.groupBuildsByWorkflow(builds)).toEqual(expected);
    });
  });
});
