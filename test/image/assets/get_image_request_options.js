/*
 * For image testing
 *
 * Give it a json object for the body,
 * it'll return an options object ready for request().
 */

var DEFAULT_URL = 'http://localhost:9010/';

module.exports = function getOptions(body, url) {
    var opts = {
        url: url || DEFAULT_URL,
        method: 'POST'
    };

    if(body) opts.body = JSON.stringify(body);

    return opts;
};
