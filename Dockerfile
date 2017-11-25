FROM node:7.7.3-slim

RUN npm install -g forever

WORKDIR /build-mon

ADD app /build-mon/app
ADD package.json /build-mon/package.json
ADD README.md /build-mon/README.md

RUN npm install

ONBUILD ADD config.json /build-mon/app/config.json

EXPOSE 3000

CMD [ "forever","--watch", "--watchDirectory", "/build-mon/app", "/build-mon/app/app.js"]
