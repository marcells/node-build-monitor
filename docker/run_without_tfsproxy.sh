#!/bin/bash

docker build -t my-node-build-monitor-image $(pwd)
docker run -d -p 12345:3000 --name node-build-monitor my-node-build-monitor-image