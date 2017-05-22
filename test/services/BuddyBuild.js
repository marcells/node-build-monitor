describe('BuddyBuild service', function () {
    var BB; // class instance

    function assert(expr, msg) {
        if (!expr) throw new Error(msg || 'failed');
    }

    beforeEach(function () {
        BB = new ( require('../../app/services/BuddyBuild'))();
        BB.configure({
            interval: 1,
            numberOfBuilds: 3
        });

    });

    describe('getStatus', function (){
        "use strict";
        it('success should return color Green', function(){
            var result = BB.getStatus('success');
            assert(result == 'Green', "Expecting Green Got: " + result );
        });

        it('failed should return color Red', function(){
            var result = BB.getStatus('failed');
            assert(result == 'Red', "Expecting Red  Got: " + result);
        });

        it('running should return color Blue', function(){
            var result = BB.getStatus('running');
            assert(result == 'Blue', "Expecting Blue Got: " + result);
        });

        it('canceled should return color Orange #FFA500', function(){
            var result = BB.getStatus('canceled');
            assert(result == '#FFA500', "Expecting FFA500 Got: " + result);
        });

        it('queued should return color Blue', function(){
            var result = BB.getStatus('queued');
            assert(result == 'Blue', "Expecting Blue Got: " + result);
        });

        it('should return default color Gray', function(){
            var result = BB.getStatus('default');
            assert(result == 'Gray', "Expecting Gray Got: " + result);
        });
    });

    describe('makeUrl', function () {
        it('should return valid url to the latest build of the specified branch', function () {
            var url = "https://buddybuild.com/APPID/build/latest?branch=develop";
            var sampleParam = BB.makeURL('APPID', '', 'develop', "https://buddybuild.com");
            assert(url === sampleParam, "Expecting Format: " + url + " Received: " + sampleParam);
        });

        it('should return valid url to specified build', function () {
            var url = "https://buddybuild.com/BUILDID";
            var sampleParam = BB.makeURL('', 'BUILDID', '', "https://buddybuild.com");
            assert(url === sampleParam, "Expecting Format: " + url + " Received: " + sampleParam);
        });

        it('should return valid url to all given token when app_is is not given', function () {
            var url = "https://api.buddybuild.com/v1/apps";
            var sampleParam = BB.makeURL('', '', '', "https://api.buddybuild.com/v1/apps");
            assert(url === sampleParam, "Expecting Format: " + url + " Received: " + sampleParam);
        });
    });
});
