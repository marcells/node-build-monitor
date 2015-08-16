FROM node

RUN npm install -g forever

WORKDIR /build-mon

ADD app /build-mon/app
ADD package.json /build-mon/package.json
ADD README.md /build-mon/README.md

RUN npm install

ONBUILD ADD config.json /build-mon/app/config.json

EXPOSE 3000

CMD [ "forever", "/build-mon/app/app.js" ]
