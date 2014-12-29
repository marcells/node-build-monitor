#!/bin/bash

docker build -t my-node-build-monitor-image $(pwd)
docker run -d --name tfs-proxy marcells/tfs-proxy
docker run -d -p 12345:3000 --link tfs-proxy:tfs-proxy --name node-build-monitor my-node-build-monitor-image