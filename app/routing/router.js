/* global module, require */
var route    = require('./route');
var services = require('../control/services');

var router = {
    makeRoute: function(url, data) {
        console.log('routing ' + url);

        var parts = url.split('/');
        parts.shift();

        var action = parts[0] === '' ? 'index' : parts.shift();

        console.log('- action: ' + action);
        console.log('- params: ' + parts);

        var m = (router.hasOwnProperty(action)) ? router[action] : router.error404;

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
        try {
            var service = services.load(route.params[0]);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            var data = service.getCredentials();
            res.write(JSON.stringify(data));
            res.end();

        } catch(e) {
            console.log('- ' + e.message);
            router.error404(res);
        }
    },

    // action: error404
    error404: function(res) {
        console.log('- 404 not found');
        res.writeHead(404);
        res.end('Not found');
    }
};

module.exports = router;