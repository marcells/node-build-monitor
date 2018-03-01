const request = require('../requests');

/** 
 * The service which provides release information by using the VSTS REST API
 *  v2.0. Although the naming of the variables suggest usage with VSTS, the
 *  code is compatible with both VSTS and TFS. The naming is simply the
 *  artifact of making the code generalised for both after initial usage
 *  with VSTS.
 * @public
 * @constructor
 * @see https://docs.microsoft.com/en-us/rest/api/vsts/release/
 */
function TfsRestRelease() {
  let basicAuth = null;
  let instance = null;
  let project = null;
  let params = null;

  /**
   * This object is the representation of resultFilter mentioned in the docs
   * @private
   * @see https://docs.microsoft.com/en-us/rest/api/vsts/release/deployments/list#microsoft.visualstudio.services.releasemanagement.webapi.deploymentstatus
   */
  const resultFilter = Object.freeze({
    all: 'all',
    failed: 'failed',
    inProgress: 'inProgress',
    notDeployed: 'notDeployed',
    partiallySucceeded: 'partiallySucceeded',
    succeeded: 'succeeded',
    undefined: 'undefined'
  });

  /**
   * This object defines the color scheme used.
   * @private
   */
  const colorScheme = Object.freeze({
    all: 'Gray',
    failed: 'Red',
    inProgress: '#0078D7',
    notDeployed: 'Gray',
    partiallySucceeded: '#F8A800',
    succeeded: 'Green',
    undefined: 'Gray'
  });

  /**
   * @typedef {Object} Release
   * @property {Date} startedAt Release start time
   * @property {Date} finishedAt Release finish time
   * @property {boolean} hasErrors Does the resulting Release have errors?
   * @property {boolean} hasWarnings Did the Release give some warnings?
   * @property {boolean} isRunning Is the Release currently running?
   * @property {string} id Unique ID of the Release
   * @property {string} number Release number
   * @property {string} project Name of the project
   * @property {string} reason Reason for Release the project
   * @property {string} requestedFor Name of the Requester
   * @property {string} status The color to be used for displaying 
   * @property {string} statusText The status of the Release
   * @property {string} url URL of the project
   */

  /**
   * It is a node-style callback.
   * @callback releaseInfoRequestCallback
   * @param {Error|null} err It is an instance of Error
   * @param {Array<Release>} listOfRelease It is an array of {@link Release}
   */

  /**
   * It exposes the API needed by the application to check the status of release.
   * @name check
   * @function
   * @public
   * @instance
   * @memberOf TfsRestRelease
   * @param {releaseInfoRequestCallback} cb Callback which handles the
   *  requested Release information
   */
  this.check = (callback) => {
    if (basicAuth && instance && project) {
      getListOfRelease(callback);
      return;
    }
    callback('incomplete configuration');
    return;
  };

  /**
   * @typedef {Object} TfsRestReleaseConfiguration
   * @property {string} instance VS Team Services account
   *  ({account}.visualstudio.com) or TFS server ({server:port}).
   * @property {string} project Team project ID or name
   * @property {string} queryparams Additional queryparams to filter the data
   *  and provide additional options
   * @property {string} username Username
   * @property {string} pat Personal Access Token with access to Release
   *  information
   */

  /**
   * It exposes the API needed by the application to provide
   *  configuration parameters.
   * @name check
   * @function
   * @public
   * @instance
   * @memberOf TfsRestRelease
   * @param {TfsRestReleaseConfiguration} config Configuration parameters
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

    console.log(config);
  };

  /**
   * @private
   * @param {releaseInfoRequestCallback} cb Callback which handles the
   *  requested Release information
   */
  const getListOfRelease = (callback) => {
    const url = `https://${instance}/${project}/_apis/release/deployments?api-version=4.1-preview${params}`;

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
     * @param {releaseInfoRequestCallback} cb Callback which handles the
     *  requested Release information
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
     * @param {object} Release individual Release information object returned
     *  from API
     * @returns {Release} the object is in the format accepted by the application
     */
    const transformer = (release) => {
      let result = {
        finishedAt: release.completedOn ? new Date(release.completedOn) : new Date(),
        hasErrors: release.deploymentStatus === resultFilter.failed || release.deploymentStatus === resultFilter.notDeployed,
        hasWarnings: release.deploymentStatus === resultFilter.partiallySucceeded,
        id: release.id,
        isRunning: release.deploymentStatus === resultFilter.inProgress,
        number: release.release.name,
        project: release.releaseDefinition.name,
        reason: release.reason,
        requestedFor: release.requestedFor.displayName,
        startedAt: new Date(release.queuedOn),
        status: colorScheme[resultFilter[release.deploymentStatus ? release.deploymentStatus : resultFilter.inProgress]],
        statusText: release.deploymentStatus ? release.deploymentStatus : resultFilter.inProgress,
        url: release.release.url
      };

      return result;
    };
  };
}

module.exports = TfsRestRelease;
