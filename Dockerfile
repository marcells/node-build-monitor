FROM node:7.7.3-slim

RUN npm install -g forever

WORKDIR /build-mon

ADD package.json /build-mon/package.json
RUN npm install

ADD app /build-mon/app
ADD README.md /build-mon/README.md

ONBUILD ADD config.json /build-mon/app/config.json

EXPOSE 3000

CMD [ "forever","--watch", "--watchDirectory", "/build-mon/app", "/build-mon/app/app.js"]
