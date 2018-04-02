[![Build Status](https://travis-ci.org/marcells/node-build-monitor.svg?branch=master)](https://travis-ci.org/marcells/node-build-monitor)
[![Code Climate](https://codeclimate.com/github/marcells/node-build-monitor/badges/gpa.svg)](https://codeclimate.com/github/marcells/node-build-monitor)
[![Dependency Status](https://david-dm.org/marcells/node-build-monitor.svg)](https://david-dm.org/marcells/node-build-monitor)
[![Known Vulnerabilities](https://snyk.io/test/github/marcells/node-build-monitor/badge.svg)](https://snyk.io/test/github/marcells/node-build-monitor)
[![Stories in Ready](https://badge.waffle.io/marcells/node-build-monitor.png?label=ready&title=Ready)](https://waffle.io/marcells/node-build-monitor)

## node-build-monitor

> A __Build Monitor__ written in __Node.js__, which supports several build services. It can __be easily extended__ to support new services. You can __mix different services__ as you like and you'll always see the newest builds in its __responsive and themable web frontend__ automatically. And finally, everything is prepared to run as a __Docker__ container.

__Here's a demo:__ http://builds.mspi.es <sub><sup>([other themes](#theming-support))</sup></sub>
<br />
<sub>(automatically deployed from [this repository](docker/) with [Tutum](https://www.tutum.co) as a [Docker](https://www.docker.com/) container to the [Microsoft Azure Cloud](http://azure.microsoft.com/))</sub>

[![Screenshot](docs/node-build-monitor.png?raw=true)](docs/node-build-monitor.png?raw=true)

### Supported services

- [Travis CI](https://travis-ci.org/) <sub><sup>([Configuration](#travis-ci))</sup></sub>
- [Jenkins](http://jenkins-ci.org/) <sub><sup>([Configuration](#jenkins))</sup></sub>
- [TeamCity](https://www.jetbrains.com/teamcity/) <sub><sup>([Configuration](#teamcity))</sup></sub>
- [Visual Studio Team Services and Team Foundation Server](http://www.visualstudio.com/) <sub><sup>([Configuration](#visual-studio-team-services-and-team-foundation-server))</sup></sub>
- [VSTS and TFS Releases](http://www.visualstudio.com/) <sub><sup>([Configuration](#visual-studio-team-services-and-team-foundation-server-releases))</sup></sub>
- [Team Foundation Server 2013 and lower (on-premise) via tfs-proxy](https://github.com/marcells/tfs-proxy) <sub><sup>([Configuration](#team-foundation-server-2013-and-lower-on-premise))</sup></sub>
- [Team Foundation Server 2015/2017 (on-premise) ](https://www.visualstudio.com/en-us/products/tfs-overview-vs.aspx) <sub><sup>([Configuration](#team-foundation-server-20152017-on-premise))</sup></sub>
- [GitLab (on-premise, beta)](https://gitlab.com) <sub><sup>([Configuration](#gitlab-on-premise-beta))</sup></sub>
- [BuddyBuild](https://buddybuild.com) <sub><sup>([Configuration](#buddybuild))</sup></sub>
- [Bamboo](https://www.atlassian.com/software/bamboo) <sub><sup>([Configuration](#bamboo))</sup></sub>
- [Bitbucket Pipelines](https://bitbucket.org/product/features/pipelines) <sub><sup>([Configuration](#bitbucket-pipelines))</sup></sub>
- [Buildkite](https://buildkite.com/) <sub><sup>([Configuration](#buildkite))</sup></sub>

Feel free to make a [Fork](https://github.com/marcells/node-build-monitor/fork) of this repository and add another service.

Jump to the [configuration documentation](#configuration) and see how the services are configured.

### Quickstart

You have three options:

- Run node-build-monitor [by downloading the standalone version](#run-the-standalone-version-easiest-way) <sub><sup>(easiest way to run it)</sup></sub>
- Run node-build-monitor [manually with node](#run-it-manually-during-development) <sub><sup>(preferred during development)</sup></sub>
- Run node-build-monitor [with Docker Compose](#run-it-with-docker-compose-in-production) <sub><sup>(preferred in production)</sup></sub>

### Configuration

The build monitor configuration can be placed in one of the following locations:
1. `%HomeDirectory%/node-build-monitor-config.json`
2. `%PathOfExecutable%/config.json` (only for the standalone version)
3. `app/config.json`

```json
{
  "monitor": {
    "interval": 30000,
    "numberOfBuilds": 12,
    "latestBuildOnly": false,
    "sortOrder": "date",
    "expandEnvironmentVariables": false,
    "debug": true
  },
  "services": [
    {
      "name": "Travis",
      "configuration": {
        "slug": "node-build-monitor"
      }
    },
    {
      "name": "Travis",
      "configuration": {
        "slug": "marcells/bloggy"
      }
    }
  ]
}
```

In the `monitor` section you can set up some general settings:

| Setting                      | Description
|------------------------------|---------------------------------------------------------------------------------------------------------------------
| `interval`                   | The update interval (in milliseconds)
| `numberOfBuilds`             | The number of builds, which will be read and displayed in the web frontend (ignored if `latestBuildOnly` is enabled)
| `latestBuildOnly`            | Will only retrieve single latest build from each service configuration
| `sortOrder`                  | The sort order for buils, options : `project`, `date`
| `expandEnvironmentVariables` | Tries to expand root service configuration properties from environment variables (e.g.: "${MY_PASSWORD}" will look for an environment variable `MY_PASSWORD` and will use that)
| `debug`                      | Enable or disable some debug output on the console

The `services` section accepts an array, each describing a single build service configuration (you are allowed to mix different services):
- the `name` setting refers to the used service
- the `configuration` setting refers to its configuration, which may differ from each service (see below)

#### Travis CI

Supports the [Travis CI](https://travis-ci.org/) build service.

```json
{
  "name": "Travis",
  "configuration": {
    "slug": "marcells/node-build-monitor"
  }
}
```

| Setting      | Description
|--------------|--------------------------------------------------------------------------------------------
| `slug`       | The name of the build (usually your GitHub user name and the project name)
| `url`        | The Travis CI server (travis-ci.org, travis-ci.com). Defaults to travis-ci.org.
| `token`      | The Travis access token, to access your private builds (can be found on your Accounts page)

#### Jenkins

Supports the [Jenkins](http://jenkins-ci.org/) build service. The service can
operate in single-job or single-view mode. In single-job mode, the builds of
a selected Jenkins job are shown. In single-view mode, the builds of all the
jobs in a given Jenkins view are shown. In both modes, one can limit the
maximum number of recent builds per job.

```json
{
  "name": "Jenkins",
  "configuration": {
    "url": "http://jenkins-server:8080",
    "username": "jenkins_username",
    "password": "jenkins_password",
    "job": "JenkinsJobName",
    "numberOfBuildsPerJob": 3,
    "options": {
      "strictSSL": false
    }
  }
}
```

| Setting      | Description
|--------------|------------------------------------------------------------------------------------------------------------------
| `url`        | The url to the Jenkins server
| `username`   | Your Jenkins user name
| `password`   | Your Jenkins password
| `job`        | The name of the Jenkins job whose builds are to be shown in single-job mode. Takes precedence over `view` if both are given.
| `view`       | The name of the Jenkins view whose jobs and builds are to be shown in single-view mode. Optional.
| `options`    | The request options.
|              | Refer to [request module](https://github.com/request/request#requestdefaultsoptions) options for possible values
| `numberOfBuildsPerJob` | Limit the number of builds fetched for each job. Optional, defaults to no limitation.

#### TeamCity

Supports the [TeamCity](https://www.jetbrains.com/teamcity/) build service.

```json
{
  "name": "TeamCity",
  "configuration": {
    "url": "http://teamcity_username:teamcity_password@teamcity-server:8111",
    "buildConfigurationId": "TeamCityProject_TeamCityBuildConfiguration",
    "branch": "master",
    "authentication": "ntlm",
    "username": "teamcity_username",
    "password": "teamcity_password"
  }
}
```

| Setting                 | Description
|-------------------------|-----------------------------------------------------------------------------------------
| `url`                   | The url to the TeamCity server (including the credentials without a trailing backslash).
| `buildConfigurationId`  | The id of the TeamCity build configuration
| `branch`                | The name of branch that needs to be monitored. Will monitor all branches if not specified.
| `authentication`        | This option is only required if using 'ntlm' other option have no meaning
| `username`              | Your TeamCity user name (if required)
| `password`              | Your TeamCity password (if required)

#### Visual Studio Team Services and Team Foundation Server

Supports the [Visual Studio Team Services](http://www.visualstudio.com/) and [Team Foundation Server](https://www.visualstudio.com/tfs/) build service.

```json
{
  "name": "Tfs",
  "configuration": {
    "instance": "instance",
    "collection": "DefaultCollection",
    "project": "projectname",
    "username": "username",
    "pat": "personalaccesstoken",
    "queryparams": "&branchName=refs/heads/master&definitions=4,5,6,7&maxBuildsPerDefinition=1",
    "includeQueued": false,
    "showBuildStep": false
  }
}
```

| Setting         | Description
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------
| `instance`      | VS Team Services account ({account}.visualstudio.com) or TFS server ({server:port})
| `collection`    | Collection name. Defaults to DefaultCollection.
| `project`       | Team project ID or name
| `username`      | Username used to login
| `pat`           | Personal Access Token with access to builds
| `queryparams`   | Any query params that REST API accepts, more info: https://www.visualstudio.com/en-us/docs/integrate/api/build/builds
| `includeQueued` | Set to `true`, if queued builds should be shown on the monitor. Defaults to `false`.
| `showBuildStep` | Set to `true`, to add the current step/stage to the text show for the status. Defaults to `false`.

_Note_:
- [Create a peronal access token](https://docs.microsoft.com/en-us/vsts/accounts/use-personal-access-tokens-to-authenticate) with access to read builds.
- The url formed is of the following format: https://{instance}/{collection}/{project}/_apis/build/builds?api-version=2.0[queryparams]
- Please note that all the configuration fields are mandatory. If a field is not required like queryparams, please provide empty string in the configuration.


#### Visual Studio Team Services and Team Foundation Server (Releases)

Supports the [Visual Studio Team Services (Releases)](http://www.visualstudio.com/) and [Team Foundation Server (Releases)](https://www.visualstudio.com/tfs/) release service.

```json
{
  "name": "TfsRelease",
  "configuration": {
    "project": "projectname",
    "instance": "instance",
    "username": "username",
    "pat": "personalaccesstoken",
    "queryparams" : "&$top=10"
  }
}
```

| Setting         | Description
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------
| `project`       | Team project ID or name
| `instance`      | VS Team Services account ({account}.vsrm.visualstudio.com) or TFS server ({server:port})
| `username`      | Username used to login
| `pat`           | Personal Access Token with access to releases
| `queryparams`   | Any query params that REST API accepts, more info: https://docs.microsoft.com/en-us/rest/api/vsts/release/deployments/list#URI_Parameters

_Note_: [Create a peronal access token](https://docs.microsoft.com/en-us/vsts/accounts/use-personal-access-tokens-to-authenticate) with access to read builds.
- The url formed is of the following format: https://{instance}/DefaultCollection/{project}/_apis/release/deployments?api-version=4.1-preview[queryparams]
- Please note that all the configuration fields are mandatory. If a field is not required like queryparams, please provide empty string in the configuration.




#### Team Foundation Server 2013 and lower (on-premise)

Supports an on-premise Microsoft Team Foundation Server via the [tfs-proxy](https://github.com/marcells/tfs-proxy) bridge.

```json
{
  "name": "TfsProxy",
  "configuration": {
    "tfsProxyUrl": "http://tfs-proxy:4567/builds",
    "url": "http://tfs-server:8080/tfs/DefaultCollection",
    "username": "domain\\buildadmin",
    "password": "buildadmin_password"
  }
}
```

| Setting          | Description
|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `tfsProxyUrl`    | The url to the [tfs-proxy](https://github.com/marcells/tfs-proxy). If you use Docker to run node-build-monitor and tfs-proxy, this setting can be omitted (see details below in the Docker section).
| `url`            | The full Team Collection Url, which builds are displayed (selecting single team projects or build definitions is not supported currently)
| `authentication` | This option is only required if using 'ntlm' other option have no meaning
| `username`       | User with permission to query build details
| `password`       | The password for the user

#### Team Foundation Server 2015/2017 (on-premise)

Supports an on-premise Microsoft Team Foundation Server 2015/2017 (and later).

```json
{
  "name": "Tfs2015",
  "configuration": {
    "url": "http://tfs-server:8080/tfs/DefaultCollection/TeamProject",
    "username": "domain\\buildadmin",
    "password": "buildadmin_password"
  }
}
```

| Setting         | Description
|-----------------|-------------------------------------------------------------------------------------
| `url`           | The full Team Collection Url, including the TeamProject, which builds are displayed
| `authentication`| This option is only required if using 'ntlm' other option have no meaning
| `username`      | User with permission to query build details
| `password`      | The password for the user (if using TFS 2017 see notes below)

_Important_: For TFS 2017 you have to [create a personal access token](https://www.visualstudio.com/en-us/docs/setup-admin/team-services/use-personal-access-tokens-to-authenticate). It only needs
the permission to read builds. Please use your username and the generated token as the password.


#### GitLab (on-premise, beta)

Supports an on-premise [GitLab](http://gitlab.com) Community Edition/Enterprise Edition with built-in CI server. Also supports [hosted gitlab](https://gitlab.com).

```json
{
  "name": "GitLab",
  "configuration": {
    "url": "http://gitlab.example.com:8080",
    "token": "secret_user_token",
    "additional_query": "&search=gitlab-org&starred=true",
    "numberOfPipelinesPerProject": 3,
    "slugs": [
      {
        "project": "gitlab-org/gitlab-ci-multi-runner",
        "ref": "master"
      }
    ]
  }
}
```

| Setting            | Description
|--------------------|-------------------------------------------------------------------------------------------------------------
| `url`              | GitLab server http(s) address string
| `token`            | Secret token string for the existing user to be used to authenticate against GitLab REST API
| `slugs`            | List of project slugs to display and check for builds. Defaults to `*/*` for all projects you have access to. Use `/*` when specifying group slug to include projects only from current group and `/**` to also include subgroups. Optional 'ref' attribute can be used to specify the branch.
| `intervals`        | How often (in integer of milliseconds) ...
| `additional_query` | Add [additional query parameters](https://gitlab.com/help/api/projects.md) so not too many projects are fetched.
| `numberOfPipelinesPerProject` | Limit the number of pipelines fetched for each project. Optional, defaults to no limitation.

Because API V4 returns **all** internal and public projects by default, you propably
want to set `additional_query` as well. Good choices could be `&owned=true` or `&membership=true`.

#### BuddyBuild

Supports [BuddyBuild](https://buddybuild.com/) build service

```json
{
  "name": "BuddyBuild",
  "configuration": {
    "project_name": "Android",
    "app_id": "Your-App-ID",
    "url": "https://api.buddybuild.com/v1/apps",
    "access_token": "Your-Access-Token",
    "build_id": "",
    "branch": "develop"
  }
}
```

| Setting          | Description
|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
| `project_name`   | Label of the project name, normally IOS or Android. Required only, if your app_id is provided.
| `app_id`         | BuddyBuild Application ID. Leave empty to get all the builds for your user token.
| `url`            | BuddyBuild Build Query url
| `access_token`   | Secret token string for the existing user to be used to authenticate against BuddyBuild REST API (if `BUILDBUDDY_ACCESS_TOKEN` environment variable is set, this setting is overwritten)
| `build_id`       | Leave empty to get the latest build. Provide the build ID to query that specific build.
| `branch`         | Name of the branch

#### Bamboo

Supports [Bamboo](https://www.atlassian.com/software/bamboo) build service

```json
{
  "name": "Bamboo",
  "configuration": {
    "url": "http://yourbamboo.com",
    "planKey": "Plan-Key",
    "username": "user",
    "password": "pass"
  }
}
```

| Setting          | Description
|------------------|------------------------------------
| `url`            | URL of the Bamboo host
| `planKey`        | Plan-Key
| `username`       | HTTP-Basic-Auth Username (optional)
| `password`       | HTTP-Basic-Auth Password (optional)

#### Bitbucket Pipelines

Supports [Bitbucket Pipelines](https://bitbucket.org/product/features/pipelines) build service

```json
{
  "name": "BitbucketPipelines",
  "configuration": {
    "apiKey": "key",
    "username": "username",
    "slug": "slug"
  }
}
```

| Setting          | Description
|------------------|------------------------------------
| `apiKey`         | The API key on the Bitbucket settings
| `username`       | The account username
| `slug`           | The name of the project

#### Buildkite

Supports [Buildkite](https://buildkite.com) build service

```json
{
  "name": "Buildkite",
  "configuration": {
    "orgSlug": "your-organisation-slug",
    "teamSlug": "everyone"
  }
}
```

| Setting           | Description
|------------------ |------------------------------------
| `orgSlug`         | Organization slug, visible in the url when on the pipelines page (e.g `https://buildkite.com/<your-organisation-slug>`)
| `teamSlug`        | An team slug to filter the pipelines on, set to `everyone` for all pipelines
| `BUILDKITE_TOKEN` | An **ENVIRONMENT VARIABLE** with your access token. See: https://buildkite.com/docs/graphql-api for instructions on generating your token.

### Run the standalone version (easiest way)

1. Download the [latest release](https://github.com/marcells/node-build-monitor/releases/latest) for Linux (x64), MacOS (x64) or Windows (x64)
2. Place a file `config.json` next to the executable (see the description of the file in the [configuration section](#configuration) above)
3. Run the executable
4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) (switch to fullscreen for the best experience)

### Run it manually (during development)

1. Pull the repository
2. Run `npm install`
3. Place a file `config.json` in the app folder (see the description of the file in the [configuration section](#configuration) above)
4. *If you connect to services, which are using self signed certificates, then you have to set the environment variable`NODE_TLS_REJECT_UNAUTHORIZED=0`. ([More Info](https://github.com/marcells/node-build-monitor/issues/79))*
5. Run the build monitor with `node app/app.js`
6. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) (switch to fullscreen for the best experience)

Run `grunt` to execute the tests and check the source code with [JSHint](http://jshint.com/).

### Run it with Docker Compose (in production)

You can try out or install the build monitor with [Docker Compose](https://docs.docker.com/compose/) easily.

__TL;DR:__ Go to the [docker directory](docker/), rename the file `config.example.json` to `config.json` and edit with your configuration or create `config.json` file directly. Then run the following commands, which you need.

Below, each commands is explained in detail.

#### 1. Create configuration and set up the build monitor
Place a file `config.json` next to the `docker-compose.*.yml` and configure the services:
```json
{
  "monitor": {
    "interval": 30000,
    "numberOfBuilds": 12,
    "latestBuildOnly": false,
    "sortOrder": "date",
    "debug": true
  },
  "services": [
    {
      "name": "Travis",
      "configuration": {
        "slug": "marcells/bloggy"
      }
    },
    {
      "name": "Travis",
      "configuration": {
        "slug": "marcells/node-build-monitor"
      }
    }
  ]
}
```

See the description of this file in the configuration section above.

#### 2. Build your custom build monitor image and run the container

Build your custom node-build-monitor docker image. This will also include your configuration from the previous step. Afterwards the container is started.

##### a. Without tfs-proxy

Installing and running node-build-monitor in a docker container for use on the same machine is simple with the following commands:

Run docker-compose from your custom `docker-compose.yml`:
```
docker-compose build --pull
docker-compose up -d
```

##### b. With tfs-proxy

If you want to get access to the tfs-proxy, then you need a slighly different command, which allows the build monitor container to access the tfs-proxy container.

Run docker-compose from your custom `docker-compose.with-tfs-proxy.yml`:
```
docker-compose -f docker-compose.with-tfs-proxy.yml build --pull
docker-compose -f docker-compose.with-tfs-proxy.yml up -d
```
Ensure that you omit the `tfsProxyUrl` setting in your `config.json`, so that it can be determined automatically. [Here](https://docs.docker.com/userguide/dockerlinks/#container-linking) you'll get more information about container linking.

##### c. With self-signed-certs

If you connect to services which are using self signed certificates, run docker-compose from your custom `docker-compose.with-self-signed-certs.yml`:
```
docker-compose -f docker-compose.with-self-signed-certs.yml build --pull
docker-compose -f docker-compose.with-self-signed-certs.yml up -d
```

#### 3. Access it with your browser

Now open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see your running or finished builds. Switch to fullscreen for the best experience.

#### (4. Access logs)

You can take a look at the logs of the build monitor by using this command:
```
docker-compose logs
```

### Theming support

Here you can check out the existing themes. Feel free to [add your own](#creating-a-new-theme) and make a pull request. It can be done very easy.

| Theme   | Description                                                                        | Preview
|---------|------------------------------------------------------------------------------------|-------------------------------------------
| default | Works best on bigger screens with a high resolution                                | [Demo](http://builds.mspi.es)
| lowres  | Works best on screens with a lower resolution                                      | [Demo](http://builds.mspi.es?theme=lowres)
| list    | Displays the builds as a list, instead of tiles                                    | [Demo](http://builds.mspi.es?theme=list)
| lingo   | Describes the build status in form of a hand-written sentence                      | [Demo](http://builds.mspi.es?theme=lingo)

You can switch the themes by the url parameter `theme`.
e.g.: [http://localhost:3000?theme=list](http://localhost:3000?theme=list)

#### Creating a new theme

If you want to create a new theme, you simply have to create one template file and one stylesheet in the following paths.
- Stylesheet: `app/public/stylesheets/themes/[name of theme]/style.css` (you can place dependent css files in this folder)
- Template: `app/public/templates/themes/[name of theme]/.html`

Please use a unique class prefix like `[name of theme]-theme` for your css, so that we do not run into any conflicts with other themes.

A list with the name `builds` with Knockout.js ViewModels [BuildViewModel](app/public/scripts/BuildViewModel.js) will be bound to the template. [Knockout.js](http://knockoutjs.com/) has a very low learning curve and provides a powerful data-binding mechanism.

Just check out the other themes to get sample code. It's quite easy to create new themes.

### Additional: Raspberry Pi Configuration

Here are some useful links, how to run the build monitor frontend on a Raspberry Pi.

- [Boot to browser](http://blog.niteoweb.com/raspberry-pi-boot-to-browser/)
- [Automatically turn the monitor off in the evening](http://glframebuffer.wordpress.com/2013/08/28/raspberrypi-how-to-turn-off-hdmi-from-raspberry-pi/)

This sample script can be used in a cronjob to automatically send your screen to sleep mode in the evening and wake it up in the morning.

```bash
#!/bin/bash

if [ $1 = 'on' ]; then
  tvservice -p;
  fbset -depth 8;
  fbset -depth 16;
  chvt 6;
  chvt 7;
  echo 'Switched Screen ON!'
fi

if [ $1 = 'off' ]; then
  tvservice -o
  echo 'Switched Screen OFF!'
fi
```

### License

The MIT License (MIT)

Copyright (c) 2017 Marcell Spies ([@marcells](https://twitter.com/marcells) | http://mspi.es)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
