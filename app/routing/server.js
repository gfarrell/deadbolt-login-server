/* global require, module */
var https = require('https');
var fs = require('fs');
var querystring = require('querystring');
var router = require('./router');

module.exports = {
    create: function(port) {
        var options = {
            key:  fs.readFileSync('keys/key.pem'),
            cert: fs.readFileSync('keys/cert.pem')
        };

        return https.createServer(options, function(req, res) {
            var fullBody = '';

            req.on('data', function(chunk) {
                fullBody += chunk.toString();
            });

            req.on('end', function() {
                var data = querystring.parse(fullBody);
                router.makeRoute(req.url, data).respond(res);
            });
        }).listen(port);
    }
};