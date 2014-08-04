/* global module, require */
var route    = require('./route');
var services = require('../control/services');
var LoginBot = require('../bot/login_bot');

var router = {
    makeRoute: function(req, data) {
        var url = req.url;
        console.log('routing ' + url);

        var parts = url.split('/');
        parts.shift();

        var action = parts[0] === '' ? 'index' : parts.shift();

        console.log('- action: ' + action);
        console.log('- params: ' + parts);
        console.log('- data: ' + JSON.stringify(data));

        var m = (router.hasOwnProperty(action)) ? router[action] : router.error404;

        return route.make(m)
                    .withParameters(parts)
                    .withData(data)
                    .create(req);
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
            res.write(JSON.stringify(route.request.headers));
            res.end();

        } catch(e) {
            console.log('- ' + e.message);
            router.error404(res);
        }
    },

    // action: requestLogin
    requestLogin: function(res, route) {
        try {
            console.log('- loading service data');
            var service = services.load(route.data.service);

            var bot = new LoginBot(service);
            bot.mimic(route.request);

            res.write('Login requested to ' + route.data.service);
            bot.initiateLogin(function(cookies) {
                res.write('Login Complete');
                res.write('<br/>');
                res.write(JSON.stringify(cookies));
                res.end();
            });
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
    },

    // action: error403
    error403: function(res) {
        console.log('- 403 forbidden');
        res.writeHead(403);
        res.end('Forbidden');
    }
};

module.exports = router;
