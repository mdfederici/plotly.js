var fs = require('fs');

var constants = require('../../tasks/util/constants');
var comparePixels = require('./assets/compare_pixels');

// packages inside the image server docker
var test = require('tape');

var BASE_TIMEOUT = 500;  // base timeout time
var BATCH_SIZE = 5;      // size of each test 'batch'
var running = 0;         // number of tests currently running



// make artifact folders
if(!fs.existsSync(constants.pathToTestImagesDiff)) {
    fs.mkdirSync(constants.pathToTestImagesDiff);
}
if(!fs.existsSync(constants.pathToTestImages)) {
    fs.mkdirSync(constants.pathToTestImages);
}

var userFileName = process.argv[2];

// run the test(s)
if(!userFileName) runAll();
else runSingle(userFileName);

function runAll() {
    test('testing mocks', function(t) {

        var fileNames = fs.readdirSync(constants.pathToTestImageMocks);

        // eliminate pollutants (e.g .DS_Store) that can accumulate in the mock directory
        var allMocks = fileNames.filter(function(name) {return name.slice(-5) === '.json';});

        /* Test cases:
         *
         * - font-wishlist
         * - all gl2d
         *
         * don't behave consistently from run-to-run and/or
         * machine-to-machine; skip over them.
         *
         */
        var mocks = allMocks.filter(function(mock) {
            return !(
                mock === 'font-wishlist.json' ||
                mock.indexOf('gl2d') !== -1
            );
        });

        // skip mapbox mocks for now
        mocks = mocks.filter(function(mock) {
            return mock.indexOf('mapbox_') === -1;
        });

        t.plan(mocks.length);

        for(var i = 0; i < mocks.length; i++) {
            testMock(mocks[i], t);
        }

    });
}

function runSingle(userFileName) {
    test('testing single mock: ' + userFileName, function(t) {
        t.plan(1);
        testMock(userFileName, t);
    });
}

function testMock(fileName, t) {

    // throttle the number of tests running concurrently
    if(running >= BATCH_SIZE) {
        setTimeout(function() { testMock(fileName, t); }, BASE_TIMEOUT);
        return;
    }
    running++;

    comparePixels(fileName, function(isEqual, imageFileName) {
        running--;
        t.ok(isEqual, imageFileName + ' should be pixel perfect');
    });
}
