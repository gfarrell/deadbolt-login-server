/* global module, require */
var route  = require('./route');

module.exports = {
    makeRoute: function(url, data) {
        console.log('routing ' + url);

        var parts = url.split('/');
        parts.shift();

        var action = parts[0] === '' ? 'index' : parts.shift();

        console.log('- action: ' + action);

        var m = (this.hasOwnProperty(action)) ? this[action] : this.error404;

        return route.make(m)
                    .withParameters(parts)
                    .withData(data)
                    .create();
    },

    // action: index
    index: function(res) {
        res.writeHead(200);
        res.end('Welcome to the Deadbolt testing server');
    },

    // action: getServiceCredentials
    getServiceCredentials: function(res, route) {
        res.writeHead(501);
        res.end('Not implemented');
    },

    // action: error404
    error404: function(res) {
        console.log('- 404 not found');
        res.writeHead(404);
        res.end('Not found');
    }
};