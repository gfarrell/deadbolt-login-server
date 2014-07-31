/* global require */
var https = require('https');
var fs    = require('fs');

var options = {
    key:  fs.readFileSync('keys/key.pem'),
    cert: fs.readFileSync('keys/cert.pem')
};

var a = https.createServer(options, function(req, res) {
    res.writeHead(200);
    res.end('Hello World\n');
}).listen(8081);