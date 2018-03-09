const request = require('../requests');

/**
 * The service which provides build information by using the VSTS REST API
 *  v2.0. Although the naming of the variables suggest usage with VSTS, the
 *  code is compatible with both VSTS and TFS. The naming is simply the
 *  artifact of making the code generalised for both after initial usage
 *  with VSTS.
 * @public
 * @constructor
 * @see https://www.visualstudio.com/en-us/docs/integrate/api/build/overview
 */
function VSTSRestBuilds() {
  let basicAuth = null;
  let instance = null;
  let project = null;
  let collection = null;
  let params = null;

  /**
   * This object is the representation of resultFilter mentioned in the docs
   * @private
   * @see https://www.visualstudio.com/en-us/docs/integrate/api/build/builds
   */
  const resultFilter = Object.freeze({
    succeeded: 'succeeded',
    partiallySucceeded: 'partiallySucceeded',
    failed: 'failed',
    canceled: 'canceled',
    inProgress: 'inProgress',
    completed: 'completed'
  });

  /**
   * This object defines the color scheme used.
   * @private
   */
  const colorScheme = Object.freeze({
    succeeded: 'Green',
    partiallySucceeded: '#F8A800',
    failed: 'Red',
    canceled: 'Gray',
    inProgress: '#0078D7',
    completed: 'Green'
  });

  /** This object is the representation of statusFilter mentioned in the docs
   * @private
   * @see https://www.visualstudio.com/en-us/docs/integrate/api/build/builds
   */
  const statusFilter = Object.freeze({
    inProgress: 'inProgress',
    completed: 'completed',
    cancelling: 'cancelling',
    postponed: 'postponed',
    notStarted: 'notStarted',
    all: 'all',
  });

  /**
   * @typedef {Object} Build
   * @property {Date} startedAt Build start time
   * @property {Date} finishedAt Build finish time
   * @property {boolean} hasErrors Does the resulting build have errors?
   * @property {boolean} hasWarnings Did the build give some warnings?
   * @property {boolean} isRunning Is the build currently running?
   * @property {string} id Unique ID of the build
   * @property {string} number Build number
   * @property {string} project Name of the project
   * @property {string} reason Reason for building the project
   * @property {string} requestedFor Name of the Requester
   * @property {string} status The color to be used for displaying
   * @property {string} statusText The status of the build
   * @property {string} url URL of the project
   */

  /**
   * It is a node-style callback.
   * @callback buildsInfoRequestCallback
   * @param {Error|null} err It is an instance of Error
   * @param {Array<Build>} listOfBuilds It is an array of {@link Build}
   */

  /**
   * It exposes the API needed by the application to check the status of builds.
   * @name check
   * @function
   * @public
   * @instance
   * @memberOf VSTSRestBuilds
   * @param {buildsInfoRequestCallback} cb Callback which handles the
   *  requested build information
   */
  this.check = (callback) => {
    if (basicAuth && instance && project) {
      getListOfBuilds(callback);
      return;
    }
    callback('incomplete configuration');
    return;
  };

  /**
   * @typedef {Object} VSTSRestBuildsConfiguration
   * @property {string} instance VS Team Services account
   *  ({account}.visualstudio.com) or TFS server ({server:port}).
   * @property {string} project Team project ID or name
   * @property {string} queryparams Additional queryparams to filter the data
   *  and provide additional options
   * @property {string} username Username
   * @property {string} pat Personal Access Token with access to Builds
   *  information
   */

  /**
   * It exposes the API needed by the application to provide
   *  configuration parameters.
   * @name check
   * @function
   * @public
   * @instance
   * @memberOf VSTSRestBuilds
   * @param {VSTSRestBuildsConfiguration} config Configuration parameters
   */
  this.configure = (config) => {
    /**
     * It exposes the configuration passed to the
     * configure instance method.
     * @public
     * @instance
     */
    this.configuration = config;
    basicAuth = new Buffer(`${config.username}:${config.pat}`)
      .toString('base64');
    instance = config.instance;
    params = config.queryparams;
    project = config.project;
    collection = config.collection || 'DefaultCollection';

    console.log(config);
  };

  /**
   * @private
   * @param {buildsInfoRequestCallback} cb Callback which handles the
   *  requested build information
   */
  const getListOfBuilds = (callback) => {
    const url = `https://${instance}/${collection}/${project}/_apis/build/builds?api-version=2.0${params}`;
    const options = {
      url,
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    };
    request.makeRequest(options, (err, body) => {
      transformData(err, body, callback);
    });

    /**
     * Transforms the data received from the request to VSTS REST API
     * @private
     * @param {any} err If the value is truthy, it indicates an error has
     *  occurred.
     * @param {object} body It contains the response body from VSTS REST API
     * @param {buildsInfoRequestCallback} cb Callback which handles the
     *  requested build information
     * @return {null}
     */
    const transformData = (err, body, callback) => {
      if (err) {
        callback(err);
        return;
      }
      if (!(body && body.value)) {
        callback('No values found');
        return;
      }
      const transformedData = body.value.map(transformer);
      callback(null, transformedData);
    };

    /**
     * The function transforms the data from VSTS API to
     *  the accepted by callback
     * @name transformer
     * @private
     * @param {object} build individual build information object returned
     *  from API
     * @returns {Build} the object is in the format accepted by the application
     */
    const transformer = (build) => {
      let result = {
        finishedAt: build.finishTime ? new Date(build.finishTime) : new Date(),
        hasErrors: build.result === resultFilter.failed,
        hasWarnings: build.result === resultFilter.partiallySucceeded,
        id: build.id,
        isRunning: build.status === statusFilter.inProgress,
        number: build.buildNumber,
        project: build.definition.name,
        reason: build.reason,
        requestedFor: build.requestedFor ? build.requestedFor.displayName : '',
        startedAt: new Date(build.startTime),
        status: colorScheme[resultFilter[build.result ? build.result : resultFilter.inProgress]],
        statusText: build.result ? build.result : resultFilter.inProgress,
        url: build.url
      };

      return result;
    };
  };
}

module.exports = VSTSRestBuilds;
