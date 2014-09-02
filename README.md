# node-build-monitor

## Team Foundation Services

https://tfsodata.visualstudio.com

## Your local TFS installation

1. Install [Team Foundation Server 2012 Update 4 Object Model Installer](http://visualstudiogallery.msdn.microsoft.com/f30e5cc7-036e-449c-a541-d522299445aa)
2. Install & configure [OData Service for Team Foundation Server v2](http://www.microsoft.com/en-us/download/details.aspx?id=36230)

## Raspberry Configuration

http://www.niteoweb.com/blog/raspberry-pi-boot-to-browser
http://glframebuffer.wordpress.com/2013/08/28/raspberrypi-how-to-turn-off-hdmi-from-raspberry-pi/

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