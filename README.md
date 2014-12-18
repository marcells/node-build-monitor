## node-build-monitor

[![Build Status](https://travis-ci.org/marcells/node-build-monitor.svg?branch=master)](https://travis-ci.org/marcells/node-build-monitor)

### Supported services

- [Visual Studio Online](http://www.visualstudio.com/)
- [Team Foundation Server (on-premise) via tfs-proxy](https://github.com/marcells/tfs-proxy)
- [Travis CI](https://travis-ci.org/)

Feel free to make a [Fork](https://github.com/marcells/node-build-monitor/fork) of this repository and add another service.

__Documentation is following soon.__

### Docker

You can try out or install the build monitor server with [Docker](https://www.docker.com/) easily.

Create a `Dockerfile` with the following content (just this one line). You can find information about the base image [here](https://registry.hub.docker.com/u/marcells/node-build-monitor/dockerfile/).
```
FROM marcells/node-build-monitor
```

Place a file `config.json` next to the `Dockerfile` and configure the services:
```json
{
  "monitor": {
    "interval": 5000,
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

Build your custom node-build-monitor docker image. This will also include your configuration from the previous step.
```
docker build -t my-node-build-monitor .
```

Run a new container from your custom image and provide the exposed port 3000 a port number you want.
```
docker run -d -p 12345:3000 my-node-build-monitor
```


### Raspberry Pi Configuration

Here are some useful links, how to run the build monitor frontend on a Raspberry Pi.

1. [Boot to browser](http://www.niteoweb.com/blog/raspberry-pi-boot-to-browser)
2. [Automatically turn the monitor of in the evening](http://glframebuffer.wordpress.com/2013/08/28/raspberrypi-how-to-turn-off-hdmi-from-raspberry-pi/)

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