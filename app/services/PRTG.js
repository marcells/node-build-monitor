// PRTG format: https://{prtgserver}/api/getsensordetails.json?id={Id}&username={myuser}&passhash={mypasshash}

var request = require('../requests');

const status = Object.freeze({
    ok: "3",
    error: "5",
    errorConfirmed: "13",
    warning: "4",
    paused: "7",
    unusual: "10",
  });

module.exports = function () {
    var self = this,
        getSensors = function(callback) {
            var url =  self.configuration.url +
                '/api/getsensordetails.json?id=' + self.configuration.sensorId +
                '&username=' + self.configuration.username +
                '&passhash=' + self.configuration.passhash;

            request.makeRequest({ 
                url: url 
            }, (err, body) => {
                transformData(err, body, callback);
            });
        },
        transformData = function (err, body, callback) {
            if (err) {
                callback(err);
                return;
            }
            if (!(body && body.sensordata)) {
                callback('No sensor data found');
                return;
            }
            
            var data = body.sensordata;

            var transformedData = {
                id: self.configuration.sensorId,
                number: data.name,
                project: data.parentgroupname,
                isRunning: false,
                // Errors first, then warnings, ok, paused and unknown should go to the end of the list.
                startedAt: hasErrors(data) || hasWarnings(data) ? new Date(Date.now() - getLastCheckedNumber(data.lastcheck)) : Date.parse('1970-01-01 00:00'),
                finishedAt: hasErrors(data) ? new Date() : (hasWarnings(data) ? new Date(Date.now() - 1) : Date.parse('1970-01-01 00:01')),
                status: getBuildStatus(data),
                statusText: getBuildStatusText(data),
                hasErrors: hasErrors(data),
                hasWarnings: hasWarnings(data),
                url: "https://alerts.bbt.local/sensor.htm?id=" + self.configuration.sensorId,
                reason: "sensor",
                requestedFor: ""
            };

            callback(null, [ transformedData ]);
        },
        getLastCheckedNumber = function(str){
            return str.substr(0, str.indexOf('.'));
        },
        getBuildStatus = function(data) {
            if (data.statusid === status.ok) {
                return 'Green';
            }
            else if (data.statusid === status.error) {
                return 'Red';
            }
            else if (data.statusid === status.errorConfirmed) {
                return '#e67278';
            } 
            else if (data.statusid === status.warning) {
                return '#f5c500';
            }
            else if (data.statusid === status.paused) {
                return '#477ec0';
            }
            else if (data.statusid === status.unusual) {
                return '#f59c00';
            }
            else {
                return 'Gray';
            }
        },
        getBuildStatusText = function(data) {
            if (data.statusid === status.ok) {
                return 'OK';
            }
            else if (data.statusid === status.error) {
                return 'Error';
            }
            else if (data.statusid === status.errorConfirmed) {
                return 'Error (Confirmed)';
            } 
            else if (data.statusid === status.warning) {
                return 'Warning';
            }
            else if (data.statusid === status.paused) {
                return 'Paused';
            }
            else if (data.statusid === status.unusual) {
                return 'Unusual';
            }
            else {
                return 'Unknown';
            }
        },
        hasErrors = function(data) {
            return data.statusid === status.error || data.statusid === status.errorConfirmed;
        };
        hasWarnings = function(data) {
            return data.statusid === status.warning || data.statusid === status.unusual;
        };

    self.configure = function (config) {
        self.configuration = config;
    };

    self.check = getSensors;
};
