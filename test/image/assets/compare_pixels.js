var fs = require('fs');
var path = require('path');

var constants = require('../../../tasks/util/constants');
var getRequestOpts = require('./get_image_request_options');

// packages inside the image server docker
var request = require('request');
var gm = require('gm');

// pixel comparison tolerance
var TOLERANCE = 1e-6;


module.exports = function comparePixels(fileName, cb) {
    var figure = require(path.join(constants.pathToTestImageMocks, fileName));
    var opts = getRequestOpts({
        figure: figure,
        format: 'png',
        scale: 1
    });

    var imageFileName = fileName.split('.')[0] + '.png',
        savedImagePath = path.join(constants.pathToTestImages, imageFileName),
        diffPath = path.join(constants.pathToTestImagesDiff, 'diff-' + imageFileName),
        savedImageStream = fs.createWriteStream(savedImagePath);

    function checkImage() {
        var options = {
            file: diffPath,
            highlightColor: 'purple',
            tolerance: TOLERANCE
        };

        /*
         * N.B. The non-zero tolerance was added in
         * https://github.com/plotly/plotly.js/pull/243
         * where some legend mocks started generating different png outputs
         * on `npm run test-image` and `npm run test-image -- mock.json`.
         *
         * Note that the svg outputs for the problematic mocks were the same
         * and playing around with the batch size and timeout durations
         * did not seem to affect the results.
         *
         * With the above tolerance individual `npm run test-image` and
         * `npm run test-image -- mock.json` give the same result.
         *
         * Further investigation is needed.
         */

        gm.compare(
            savedImagePath,
            path.join(constants.pathToTestImageBaselines, imageFileName),
            options,
            onEqualityCheck
        );
    }

    function onEqualityCheck(err, isEqual) {
        if(err) {
            touch(diffPath);
            return console.error(err, imageFileName);
        }
        if(isEqual) {
            fs.unlinkSync(diffPath);
        }

        cb(isEqual, imageFileName);

    }

    request(opts)
        .pipe(savedImageStream)
        .on('close', checkImage);
};

function touch(fileName) {
    fs.closeSync(fs.openSync(fileName, 'w'));
}
