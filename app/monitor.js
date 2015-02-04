import async from 'async';
import events from 'events';

function log (text, debug) {
  if(debug) {
    console.log(new Date().toLocaleTimeString(), '|', text);
  }
}

class Builds {
  constructor () {
    this.builds = [];
  }

  add (newBuilds) {
    Array.prototype.push.apply(this.builds, newBuilds);
    return this;
  }

  generateAndApplyETags () {
    this.builds.forEach(build => {
      build.etag = require('crypto')
        .createHash('md5')
        .update(JSON.stringify(build))
        .digest('hex');
    });

    return this;
  }

  sortBuilds () {
    let takeDate = build => build.isRunning ? build.startedAt : build.finishedAt;

    this.builds.sort((a, b) => {
      let dateA = takeDate(a);
      let dateB = takeDate(b);

      if(dateA < dateB) return 1;
      if(dateA > dateB) return -1;

      return 0;
    });

    return this;
  }

  distinctBuildsByETag () {
    let unique = {};

    for (let i = this.builds.length - 1; i >= 0; i--) {
      let build = this.builds[i];

      if (unique[build.etag]) {
        this.builds.splice(i, 1);
      }

      unique[build.etag] = true;
    }

    return this;
  }

  onlyTake (numberOfBuilds) {
    this.builds.splice(numberOfBuilds);
    return this;
  }

  changed (currentBuilds) {
    let newbuildsHash = this.builds
        .map(value => value.etag)
        .join('|');

    let currentBuildsHash = currentBuilds
        .map(value => value.etag)
        .join('|');

    return newbuildsHash !== currentBuildsHash;
  }

  detectChanges (currentBuilds) {
    let changes = {
          added: [],
          removed: [],
          updated: []
        };
    let getById = (builds, id) =>
        (builds.filter(build => build.id === id)[0]);

    let currentBuildIds = currentBuilds.map(build => build.id);
    let newBuildIds = this.builds.map(build => build.id);

    newBuildIds.forEach(newBuildId => {
      if (currentBuildIds.indexOf(newBuildId) === -1) {
        changes.added.push(getById(this.builds, newBuildId));
      }

      if (currentBuildIds.indexOf(newBuildId) >= 0) {
        let currentBuild = getById(currentBuilds, newBuildId);
        let newBuild = getById(this.builds, newBuildId);

        if (currentBuild.etag !== newBuild.etag) {
            changes.updated.push(getById(this.builds, newBuildId));
        }
      }
    });

    currentBuildIds.forEach(currentBuildId => {
      if (newBuildIds.indexOf(currentBuildId) === -1) {
        changes.removed.push(getById(currentBuilds, currentBuildId));
      }
    });

    changes.order = newBuildIds;

    return changes;
  }
}

export default class Monitor extends events.EventEmitter {
    constructor() {
      this.configuration = {
        interval: 5000,
        numberOfBuilds: 12,
        debug: false
      };

      this.plugins = [];
      this.currentBuilds = [];
    }

    configure (config) {
      this.configuration = config;
    }

    watchOn (plugin) {
      this.plugins.push(plugin);
    }

    run () {
      let builds = new Builds();

      async.each(
        this.plugins,
        (plugin, pluginCallback) => {
          log('Check for builds...', this.configuration.debug);

          plugin.check(pluginBuilds => {
            builds.add(pluginBuilds);
            pluginCallback();
          });
        },
        error => {
          log(builds.builds.length + ' builds found....', this.configuration.debug);

          builds
            .generateAndApplyETags()
            .distinctBuildsByETag()
            .sortBuilds()
            .onlyTake(this.configuration.numberOfBuilds);

          if(builds.changed(this.currentBuilds)) {
              log('builds changed', this.configuration.debug);

              this.emit('buildsChanged', builds.detectChanges(this.currentBuilds));

              this.currentBuilds = builds.builds;
          }

          setTimeout(() => this.run(), this.configuration.interval);
        });
    }
}
