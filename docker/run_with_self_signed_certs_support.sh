#!/bin/bash

docker build -t my-node-build-monitor-image $(pwd)

# -e NODE_TLS_REJECT_UNAUTHORIZED=0 is needed to allow node-build-monitor to query builds from build servers, which use self signed certificates
docker run -d -p 12345:3000 -e NODE_TLS_REJECT_UNAUTHORIZED=0 --name node-build-monitor my-node-build-monitor-image
