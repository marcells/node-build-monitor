const request = require('../requests');
const async = require('async');

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
  let includeQueued = null;
  let previousBuildsToGet = [];
  let apiVersion = null;
  let showBuildStep = null;

  /**
   * This object is the representation of resultFilter mentioned in the docs
   * @private
   * @see https://www.visualstudio.com/en-us/docs/integrate/api/build/builds
   */
  const resultFilter = Object.freeze({
    succeeded:          'succeeded',
    partiallySucceeded: 'partiallySucceeded',
    failed:             'failed',
    canceled:           'canceled'
  });

  /** This object is the representation of statusFilter mentioned in the docs
   * @private
   * @see https://www.visualstudio.com/en-us/docs/integrate/api/build/builds
   */
  const statusFilter = Object.freeze({
    inProgress: 'inProgress',
    completed:  'completed',
    cancelling: 'cancelling',
    postponed:  'postponed',
    notStarted: 'notStarted',
    all:        'all',
  });

  const timelineRecordState = Object.freeze({
    completed:  'completed',
    inProgress: 'inProgress',
    pending:    'pending'
  });

  /**
   * This object defines the color scheme used.
   * @private
   */
  const colorScheme = Object.freeze({
    succeeded:          'Green',
    partiallySucceeded: '#F8A800',
    failed:             'Red',
    canceled:           'Gray',
    inProgress:         '#0078D7',
    completed:          'Green',
    cancelling:         '#0078D7',
    postponed:          'Gray',
    notStarted:         'Gray',
    all:                'Gray'
  });

  /**
   * This object defines the compatable api versions that we are allowed to use
   * @private
   */
  const allowedAPIVersions = Object.freeze({
    '2.0':      '2.0',
    undefined:  '2.0'
  });

  /**
   * @typedef {Object} Build
   * @property {string} definition Build definition id
   * @property {Date} startedAt Build start time
   * @property {Date} finishedAt Build finish time
   * @property {boolean} hasErrors Does the resulting build have errors?
   * @property {boolean} hasWarnings Did the build give some warnings?
   * @property {boolean} isRunning Is the build currently running?
   * @property {boolean} isQueued Is the build currently waiting in the queue?
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
   * @property {boolean} includeQueued Show queued builds
   * @property {string} apiVersion The api version to use
   * @property {boolean} showBuildStep Adds the current build step to the statusString of the build variable
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
    includeQueued = config.includeQueued || false;
    apiVersion = allowedAPIVersions[config.apiVersion] || '2.0';
    showBuildStep = config.showBuildStep || false;


    console.log(config,apiVersion);
  };

  /**
   * @private
   * @param {buildsInfoRequestCallback} cb Callback which handles the
   *  requested build information
   */
  const getListOfBuilds = (callback) => {
    const url = `https://${instance}/${collection}/${project}/_apis/build/builds?api-version=${apiVersion}${params}`;
    let options = {
      url,
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    };

    // Set up our dependency tree, similar to angular
    // https://caolan.github.io/async/docs.html#autoInject
    async.autoInject({
      // ### 1. Get the list of builds ###
      get_builds: (callback) => {
        request.makeRequest(options, (err, body) => {
          transformData(err, body, callback);
        });
      },
      // ### 2. Get any previous builds ###
      get_previous_builds: (get_builds, callback) => {
        // No builds to get ? then nothing to add
        if (previousBuildsToGet.length === 0) { callback(null); return; }
        getPreviousBuilds(get_builds, callback);
      },
      // ### 3. Merge our 2 arrays ###
      merge_builds: (get_builds, get_previous_builds, callback) => {
        let builds = [];
        if (get_previous_builds && get_previous_builds.shift()) {
          builds = [...new Set([...get_builds.shift(),...get_previous_builds.shift()])]; // Merge arrays, removing duplicates
        } else {
          builds = get_builds;
        }
        callback(null, builds);
      },
      // ### 4. Get the current build steps/stage for each build ###
      get_build_steps: (merge_builds, callback) => {
        // Only get the build step if we are allowed to
        if (!showBuildStep) { callback(null, merge_builds); return; }
        async.map(merge_builds, (build, callback) => {
          getLatestBuildStep(build, callback);
        }, (err, results) => {
          callback(null, results);
        });
      }
    }, (err, results) => {
      // Pass back to the monitor app
      callback(err, results.get_build_steps);
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
      // Filter out any dummy empty objects
      const transformedData = body.value.map(transformer).filter((val) => { return Object.keys(val).length; });
      
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
      let color = colorScheme[
        build.result ?
          resultFilter[build.result] :
          (build.status === statusFilter.notStarted ?
            statusFilter[statusFilter.notStarted] :
            statusFilter[statusFilter.inProgress]
          )
      ];

      let text = build.result ?
      build.result :
        (build.status === statusFilter.notStarted ?
          statusFilter.notStarted :
          statusFilter.inProgress
        );

      let webUrl = build._links ?
        (build._links.web ? build._links.web.href : build.url) :
        build.url;

      let result = {
        definition: build.definition.id,
        finishedAt: build.finishTime ? new Date(build.finishTime) : new Date(),
        hasErrors: build.result === resultFilter.failed,
        hasWarnings: build.result === resultFilter.partiallySucceeded,
        id: build.id,
        isRunning: build.status === statusFilter.inProgress,
        isQueued: build.status === statusFilter.notStarted,
        number: build.buildNumber,
        project: build.definition.name,
        queuedAt: build.queueTime ? new Date(build.queueTime) : new Date(),
        reason: build.reason,
        requestedFor: build.requestedFor ? build.requestedFor.displayName : '',
        startedAt: new Date(build.startTime),
        status: color,
        statusText: text,
        timeline: build._links.timeline ? build._links.timeline.href : '',
        url: webUrl
      };

      // Only show queued builds if we're told to
      if (result.isQueued && !includeQueued) {
        previousBuildsToGet.push(result);
        return {};  // Return a dummy empty object (that we will remove later)
      }

      return result;
    };
  };

  /**
   * This function makes an individual API call for each build we need
   *  to get the previous version for
   * @private
   * @param {buildsInfoRequsetCallback} callback Callback which handles the
   *  requested build information
   */
  const getPreviousBuilds = (currentBuilds, callback) => {
    async.map(previousBuildsToGet, (build, callback) => {
      let def = build.definition;

      // If we already have a previous build, then we don't need to get another one
      const hasPreviousBuild = (val) => { return (val.definition === build.definition) && (val.project === build.project); };
      if (currentBuilds.some(hasPreviousBuild)) {
        callback(null);
        return;
      }

      // Get the second to last build instead
      options.url = `https://${instance}/${collection}/${project}/_apis/build/builds?api-version=${apiVersion}&definitions=${def}&$top=2`;
      request.makeRequest(options, (err, body) => {
        if (err) { callback(err); return; }
        if (!(body && body.value)) {
          console.log('No previous builds found'); // Don't break the rest of the builds if we can't get a previous one
          callback(null);
          return;
         }

        let prevBuild = [body.value[1]];

        if (prevBuild) {
          const transformedData = prevBuild.map(transformer);
          callback(null, transformedData[0]);
          return;
        }

        console.log('Unable to fetch previous build');  // Don't break the rest of the builds if we can't get a previous one
        callback(null);

      });

    }, (err, results) => {
      callback(null, results);
      previousBuildsToGet = [];
    });
  };

  /**
   * This function gets the most recent timeline record (aka step) for a build
   * @private
   * @param {string} timelineURL the url to the timeline VSTS API
   */
  const getLatestBuildStep = (build, callback) => {
    const timelineURL = build.timeline;
    if (!timelineURL || timelineURL === '') {
      console.log("no timeline url");
      callback(null);
      return;
    }
    
    const url = timelineURL;
    const options = {
      url,
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    };

    request.makeRequest(options, (err, body) => {
      if (err) { callback(null); return; }
      if (!(body && body.records)) { callback(null); return; }

      // As of API version 2.0 there is no better way of doing this, we *have* to retrieve everything
      let records = body.records.sort( (a, b) => {
        return a.order - b.order;
      });

      for (let key in records) {
        let record = records[key];
        if (record.state === timelineRecordState.inProgress) {
          build.statusText += ' - ' + record.name;
        }
      }
      callback(null, build);
    });
  };
}

module.exports = VSTSRestBuilds;
