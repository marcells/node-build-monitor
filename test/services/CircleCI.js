var chai = require("chai"),
  expect = chai.expect,
  sinonChai = require("sinon-chai"),
  shallowDeepEqualChai = require('chai-shallow-deep-equal'),
  rewire = require("rewire");

chai.use(sinonChai);
chai.use(shallowDeepEqualChai);

describe("CircleCI service", function () {
  var circleci, requestStub;

  beforeEach(function () {
    var circleciModule = rewire("../../app/services/CircleCI");
    circleci = new circleciModule();
    circleci.configure({
      token: "dummy-node-build-monitor-test-token",
      vcs: "SomeVCS",
      username: "SomeUser",
      project: "SomeProject"
    });
  });

  context("Group by workflow", function() {
    it("groups various builds by workflow", function () {
      const builds = [
        { "build": "in_workflow_A_1", "workflows": { "workflow_id": "A" } },
        { "build": "in_workflow_A_2", "workflows": { "workflow_id": "A" } },
        { "build": "in_workflow_B_1", "workflows": { "workflow_id": "B" } },
        { "build": "in_workflow_B_2", "workflows": { "workflow_id": "B" } }
      ];

      const expected = [
        [
          { "in_workflow": true, "build": "in_workflow_A_1", "workflows": { "workflow_id": "A" } },
          { "in_workflow": true, "build": "in_workflow_A_2", "workflows": { "workflow_id": "A" } }
        ],
        [
          { "in_workflow": true, "build": "in_workflow_B_1", "workflows": { "workflow_id": "B" } },
          { "in_workflow": true, "build": "in_workflow_B_2", "workflows": { "workflow_id": "B" } }
        ]
      ];
      
      expect(circleci.groupBuildsByWorkflow(builds)).shallowDeepEqual(expected);
    });

    it("keeps the jobs without a workflow", function () {
      const builds = [
        { "build": "without_workflow_1" },
        { "build": "without_workflow_2" },
      ];

      const expected = [
        [{ "in_workflow": false, "build": "without_workflow_1" }],
        [{ "in_workflow": false, "build": "without_workflow_2" }],
      ];

      expect(circleci.groupBuildsByWorkflow(builds)).shallowDeepEqual(expected);
    });


    it("flags the items with and without a worfklow", function () {
      const builds = [
        { "build": "without_workflow_1" },
        { "build": "in_workflow_A_1", "workflows": { "workflow_id": "A" } },
        { "build": "without_workflow_2" },
        { "build": "in_workflow_A_2", "workflows": { "workflow_id": "A" } },
        { "build": "in_workflow_B_1", "workflows": { "workflow_id": "B" } },
        { "build": "in_workflow_B_2", "workflows": { "workflow_id": "B" } }
      ];

      const expected = [
        [{ "in_workflow": false, "build": "without_workflow_1" }],
        [{ "in_workflow": false, "build": "without_workflow_2" }],
        [
          { "in_workflow": true, "build": "in_workflow_A_1" },
          { "in_workflow": true, "build": "in_workflow_A_2" }
        ],
        [
          { "in_workflow": true, "build": "in_workflow_B_1" },
          { "in_workflow": true, "build": "in_workflow_B_2" }
        ]
      ];

      expect(circleci.groupBuildsByWorkflow(builds)).shallowDeepEqual(expected);
    });
  });

  context("Format workflows", function () {

    it("uses the workflow ID of the first build as the build id", function () {
      const workflow = [
        {
          "in_workflow": true,
          "workflows": {
            "workflow_id": "Some_Workflow_ID"
          }
        },
        {
          "in_workflow": true,
          "workflows": {
            "workflow_id": "Some_Workflow_ID"
          }
        },
        {
          "in_workflow": true,
          "workflows": {
            "workflow_id": "Some_Other_Workflow_ID"
          }
        }
      ];

      const expected = [
        { id: "circle|SomeVCS|SomeUser|SomeProject|workflow/Some_Workflow_ID" }
      ];
      
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });
    

    it("uses the first build of the workflow to get the branch, commit, definition, requested for and reason", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "branch": "SomeBranch",
          "vcs_revision": "SomeRevision",
          "subject": "SomeSubject",
          "author_name": "SomeAuthor",
          "why": "SomeWhy"
        }, workflowData),
        Object.assign({
          "branch": "BadValue",
          "vcs_revision": "BadRevision",
          "subject": "BadSubject",
          "author_name": "BadAuthor",
          "why": "BadWhy"
        }, workflowData)
      ];

      const expected = [
        {
          "branch": "SomeBranch",
          "commit": "SomeRevision",
          "definition": "SomeSubject",
          "requestedFor": "SomeAuthor",
          "reason": "SomeWhy"
        },
      ];
      
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("merges the job numbers", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign(
          {
            "build_num": 456
          }, workflowData),
        Object.assign(
          {
            "build_num": 123
          }, workflowData)
      ];

      const expected = [
        {
          "number": "456, 123"
        },
      ];

      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("is queued if all the jobs of the workflow are queued", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign(
          {
            "status": "queued"
          }, workflowData),
        Object.assign({
          "status": "queued"
        }, workflowData)
      ];

      const expected = [
        {
          "isQueued": true
        },
      ];

      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("is not queued if all the jobs of the workflow are not queued", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "status": "queued"
        }, workflowData),
        Object.assign({
          "build_num": "not_queued"
        }, workflowData)
      ];

      const expected = [
        {
          "isQueued": false
        },
      ];

      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("is running if one jobs of the workflow is running", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "status": "running"
        }, workflowData),
        Object.assign({
          "status": "running"
        }, workflowData)
      ];

      const expected = [
        {
          "isRunning": true
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("is not running if one jobs of the workflow is not running", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "status": "queued"
        }, workflowData),
        Object.assign({
          "status": "queued"
        }, workflowData)
      ];

      const expected = [
        {
          "isRunning": false
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("takes the earliest job start as the startedAt", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "start_time": "1980-01-01T00:00:00Z"
        }, workflowData),
        Object.assign({
          "start_time": "1969-01-01T00:00:00Z"
        }, workflowData),
        Object.assign({
          "start_time": "1970-01-01T00:00:00Z"
        }, workflowData)
      ];

      const expected = [
        {
          "startedAt": new Date("1969-01-01T00:00:00Z")
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("when all the jobs are not running, it takes the latest job stop as the finishedAt", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "lifecycle": "finished",
          "stop_time": "1970-01-01T00:00:00Z"
        }, workflowData),
        Object.assign({
          "lifecycle": "finished",
          "stop_time": "1980-01-01T00:00:00Z"
        }, workflowData),
        Object.assign({
          "lifecycle": "finished",
          "stop_time": "1969-01-01T00:00:00Z"
        }, workflowData)
      ];

      const expected = [
        {
          "finishedAt": new Date("1980-01-01T00:00:00Z")
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("when at least a job is running, finishedAt is null", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "lifecycle": "finished",
          "stop_time": "1970-01-01T00:00:00Z"
        }, workflowData),
        Object.assign({
          "lifecycle": "running",
        }, workflowData),
        Object.assign({
          "lifecycle": "finished",
          "stop_time": "1969-01-01T00:00:00Z"
        }, workflowData)
      ];

      const expected = [
        {
          "finishedAt": null
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("priorizes the Red statuses over others", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "status": "no_tests" // Gray
        }, workflowData),
        Object.assign({
          "status": "failed", // Red
        }, workflowData)
      ];

      const expected = [
        {
          "status": "Red"
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("priorizes the Blue statuses after the Red", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "status": "no_tests" // Gray
        }, workflowData),
        Object.assign({
          "status": "running", // Blue
        }, workflowData)
      ];

      const expected = [
        {
          "status": "Blue"
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("priorizes the Gray status over the Green", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "status": "success", // Green
        }, workflowData),
        Object.assign({
          "status": "no_tests" // Gray
        }, workflowData)
      ];

      const expected = [
        {
          "status": "Gray"
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("priorizes the Green status after all the others", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "status": "success", // Green
        }, workflowData),
        Object.assign({
          "status": "success" // Green
        }, workflowData)
      ];

      const expected = [
        {
          "status": "Green"
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("has errors if one of the jobs has outcome no_tests, timedout or infrastructure_failed", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        Object.assign({
          "outcome": "success",
        }, workflowData),
        Object.assign({
          "outcome": "timedout"
        }, workflowData)
      ];

      const expected = [
        {
          "hasErrors": true
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });

    it("uses the workflow link instead of the job link", function () {
      const workflowData = {
        "in_workflow": true,
        "workflows": {
          "workflow_id": "Some_Workflow_ID"
        },
      };

      const workflow = [
        workflowData,
        workflowData
      ];

      const expected = [
        {
          "url": "https://circleci.com/workflow-run/Some_Workflow_ID"
        },
      ];
      expect(circleci.formatWorkflow(workflow)).shallowDeepEqual(expected);
    });
  });
});