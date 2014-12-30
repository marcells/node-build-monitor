[![Stories in Ready](https://badge.waffle.io/marcells/node-build-monitor.png?label=ready&title=Ready)](https://waffle.io/marcells/node-build-monitor)
[![Build Status](https://travis-ci.org/marcells/node-build-monitor.svg?branch=master)](https://travis-ci.org/marcells/node-build-monitor)
[![Code Climate](https://codeclimate.com/github/marcells/node-build-monitor/badges/gpa.svg)](https://codeclimate.com/github/marcells/node-build-monitor)
[![Dependency Status](https://david-dm.org/marcells/node-build-monitor.svg)](https://david-dm.org/marcells/node-build-monitor)

## node-build-monitor

> A __Build Monitor__ written in __Node.js__, which supports several build services. It can __be easily extended__ to support new services. You can __mix different services__ as you like and you'll always see the newest builds in its __responsive web frontend__ automatically. And finally, everything is prepared to run as a __Docker__ container.

__Here's a demo:__ http://builds.mspi.es
<br />
<sub>(automatically deployed from [this repository](docker/) with [Tutum](https://www.tutum.co) as a [Docker](https://www.docker.com/) container to the [Microsoft Azure Cloud](http://azure.microsoft.com/))</sub>

[![Screenshot](docs/node-build-monitor.png?raw=true)](docs/node-build-monitor.png?raw=true)

### Supported services

- [Travis CI](https://travis-ci.org/) <sub><sup>([Configuration](#travis-ci))</sup></sub>
- [Jenkins](http://jenkins-ci.org/) <sub><sup>([Configuration](#jenkins))</sup></sub>
- [TeamCity](https://www.jetbrains.com/teamcity/) <sub><sup>([Configuration](#teamcity))</sup></sub>
- [Visual Studio Online](http://www.visualstudio.com/) <sub><sup>([Configuration](#visual-studio-online))</sup></sub>
- [Team Foundation Server (on-premise) via tfs-proxy](https://github.com/marcells/tfs-proxy) <sub><sup>([Configuration](#team-foundation-server-on-premise))</sup></sub>

Feel free to make a [Fork](https://github.com/marcells/node-build-monitor/fork) of this repository and add another service.

Jump to the [configuration documentation](#configuration) and see how the services are configured.

### Quickstart

You have two options:

- Run node-build-monitor [manually with node](#run-it-manually-during-development) <sub><sup>(preferred during development)</sup></sub>
- Run node-build-monitor [with Docker](#run-it-with-docker-in-production) <sub><sup>(preferred when you just want to run it)</sup></sub>

### Configuration

The build monitor is configured in the file `config.json` in the app directory.

```json
{
  "monitor": {
    "interval": 30000,
    "numberOfBuilds": 12,
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
- the update interval (in milliseconds)
- the number of builds, which will be read and displayed in the web frontend
- enable or disable some debug output on the console

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

| Setting      | Description                                                                |
|--------------|----------------------------------------------------------------------------|
| `slug`       | The name of the build (usually your GitHub user name and the project name) |

#### Jenkins

Supports the [Jenkins](http://jenkins-ci.org/) build service.

```json
{
  "name": "Jenkins",
  "configuration": {
    "url": "http://jenkins_username:jenkins_password@jenkins-server:8080",
    "job": "JenkinsJobName"
  }
}
```

| Setting      | Description                                                                                                                |
|--------------|----------------------------------------------------------------------------------------------------------------------------|
| `url`        | The url to the Jenkins server. It has to be in the [following format](https://github.com/jansepar/node-jenkins-api#setup). |
| `job`        | The name of the Jenkins Job                                                                                                |

#### TeamCity

Supports the [TeamCity](https://www.jetbrains.com/teamcity/) build service.

```json
{
  "name": "TeamCity",
  "configuration": {
    "url": "http://teamcity_username:teamcity_password@teamcity-server:8111",
    "buildConfigurationId": "TeamCityProject_TeamCityBuildConfiguration"
  }
}
```

| Setting                 | Description                                                                                                     |
|-------------------------|-----------------------------------------------------------------------------------------------------------------|
| `url`                   | The url to the TeamCity server (including the credentials without a trailing backslash).                        |
| `buildConfigurationId`  | The id of the TeamCity build configuration                                                                      |

#### Visual Studio Online

Supports the [Visual Studio Online](http://www.visualstudio.com/) build service.

```json
{
  "name": "Tfs",
  "configuration": {
    "server": "https://myusername.visualstudio.com",
    "collection": "DefaultCollection",
    "username": "vs_online_username",
    "password": "vs_online_password"
  }
}
```

| Setting      | Description                                                                                                                             |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| `server`     | Your Visual Studio Online account main page                                                                                             |
| `collection` | The name of the collection, which builds are displayed (selecting single team projects or build definitions is not supported currently) |
| `username`   | Your Visual Studio Online user name                                                                                                     |
| `password`   | Your Visual Studio Online password                                                                                                      |

#### Team Foundation Server (on-premise) 

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

| Setting       | Description                                                                                                                                                                                          |
|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `tfsProxyUrl` | The url to the [tfs-proxy](https://github.com/marcells/tfs-proxy). If you use Docker to run node-build-monitor and tfs-proxy, this setting can be omitted (see details below in the Docker section). |
| `url`         | The full Team Collection Url, which builds are displayed (selecting single team projects or build definitions is not supported currently)                                                            |
| `username`    | User with permission to query build details                                                                                                                                                          |
| `password`    | Your Visual Studio Online password                                                                                                                                                                   |

### Run it with Docker (in production)

You can try out or install the build monitor with [Docker](https://www.docker.com/) easily.

__TL;DR:__ Go to the [docker directory](docker/), edit the file `config.json` and execute the script, which you need.

Below, each step of the script is explained in detail.

#### 1. Create Dockerfile

Create a `Dockerfile` with the following content (just this one line). You can find information about the base image [here](https://registry.hub.docker.com/u/marcells/node-build-monitor/dockerfile/).
```
FROM marcells/node-build-monitor
```

#### 2. Create configuration and set up the build monitor
Place a file `config.json` next to the `Dockerfile` and configure the services:
```json
{
  "monitor": {
    "interval": 30000,
    "numberOfBuilds": 12,
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

#### 3. Build your custom build monitor image

Build your custom node-build-monitor docker image. This will also include your configuration from the previous step.
```
docker build -t my-node-build-monitor .
```

#### 4. Run the container

##### a. Without tfs-proxy

Run a new container from your custom image and provide the exposed port 3000 a port number you want.
```
docker run -d -p 12345:3000 my-node-build-monitor
```

##### b. With tfs-proxy

If you want to get access to the tfs-proxy, then you need a slighly different command, which allows the build monitor container to access the tfs-proxy container.

1. Run the tfs-proxy container and give it a unique name.
2. Run a new container from your custom image, link the tfs-proxy container into it and provide the exposed port 3000 a port number you want (in this sample 12345).
```
docker run -d --name tfs-proxy marcells/tfs-proxy
docker run -d -p 12345:3000 --link tfs-proxy:tfs-proxy my-node-build-monitor
```

Ensure that you omit the `tfsProxyUrl` setting in your `config.json`, so that it can be determined automatically. [Here](https://docs.docker.com/userguide/dockerlinks/#container-linking) you'll get more information about container linking.

#### 5. Access it with your browser

Now open your browser and navigate to [http://localhost:12345](http://localhost:12345) to see your running or finished builds. Switch to fullscreen for the best experience.

### Run it manually (during development)

1. Pull the repository
2. Run `npm install`
3. Place a file `config.json` in the app folder (see the description of the file in the configuration section above)
4. Run the build monitor with `node app/app.js`
5. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) (switch to fullscreen for the best experience)

Run `grunt` to execute the tests and check the source code with [JSHint](http://jshint.com/).

### Additional: Raspberry Pi Configuration

Here are some useful links, how to run the build monitor frontend on a Raspberry Pi.

- [Boot to browser](http://www.niteoweb.com/blog/raspberry-pi-boot-to-browser)
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

Copyright (c) 2014 Marcell Spies ([@marcells](https://twitter.com/marcells) | http://mspi.es)

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