// Casper run script, only to be executed by CasperJS not by Node
//

var casper = require('casper').create({
    pageSettings: {
        javascriptEnabled: true,
        loadImages: false,
        loadPlugins: false
    },
    logLevel: 'error',
    verbose: true
});

var opts = casper.cli.options;
var headers = JSON.parse(opts.headers);
var service = JSON.parse(opts.service);
var creds   = JSON.parse(opts.credentials);

casper.options.pageSettings.userAgent = headers['User-Agent'];

casper.log(service, 'debug');

casper.start();

// Open the login page
casper.open('https://' + service.loginPage, {
    headers: headers
});


// do login
casper.then(function() {
    if(service.hasOwnProperty('simpleLogin')) {
        this.fill(service.simpleLogin.form, creds, true);
    } else {
        var pageFunction = require('./' + service.name + '_login').createLoginScript();
        this.evaluate(pageFunction, creds);
    }
});

// finish login
casper.then(function() {
    this.echo('---COOKIES_START---');
    this.echo(JSON.stringify(this.page.cookies));
    this.echo('---COOKIES_END---');
});

// run
casper.run();
