/* global module */

var Vent   = require('event.js');
var spawn  = require('child_process').spawn;

var LoginBot = function(serviceController) {
    var self = this;

    this.service = serviceController.getService();
    this.credentials = serviceController.getCredentials();

    this.timer = false;

    this.subscribe('error', function(message) {
        console.log('[!] ' + message);
    });
};

LoginBot.TIMEOUT = 15000;

/**
 * Mimics a browser by examining a request
 * @param  {IncomingMessage} request the original request from the user's browser
 * @return {void}
 */
LoginBot.prototype.mimic = function (request) {
    var headers = ['connection', 'accept', 'user-agent', /* 'accept-encoding', */ 'accept-language'];
    var store = {};

    headers.forEach(function(header) {
        var sepChar = '-';
        var correctCaseHeader = header.split(sepChar).map(function(v) { return v[0].toUpperCase() + v.substr(1); }).join(sepChar);
        store[correctCaseHeader] = request.headers[header];
    });

    this.headers = store;
};

/**
 * Initiates the login process
 * @param {Function} callback to be called when login is complete
 */
LoginBot.prototype.initiateLogin = function (onLogin, onLoginError) {
    var self = this;
    var casper;

    if(this.timer) {
        console.log('- new login created while in progress... aborting new request.');
        return false;
    } else {
        this.timer = setTimeout(this.loginTimedOut.bind(this), LoginBot.TIMEOUT);
    }

    if(typeof onLogin == 'function') {
        this.subscribe('loggedIn', onLogin);
    }
    if(typeof onLoginError == 'function') {
        this.subscribe('error', onLoginError);
    }

    // spawn the friendly ghost
    casper = spawn('casperjs',
        [
            './app/bot/casper.js',
            '--headers='    + JSON.stringify(this.headers)     + '',
            '--service='    + JSON.stringify(this.service)     + '',
            '--credentials='+ JSON.stringify(this.credentials) + ''
        ]
    );
    casper.stdout.on('data', function(data) {
        var data = data.toString(); // data is a Buffer object
        if(/\[error\]/g.test(data)) {
            self.publish('error', data);
        } else if(/---COOKIES_START---/.test(data) && /---COOKIES_END---/.test(data)){
            // COOKIE MONSTER IS HAPPY
            var cookies_string = data.replace(/---COOKIES_(START|END)---/g, '');
            var cookies = JSON.parse(cookies_string);

            self.finishLogin(cookies);
        }
    });

    this.subscribeOnce('timeout', function() {
        try {
            console.log('- killing casper process...');
            casper.kill();
        } catch(e) {
            console.log('- failed to kill casper');
        }
    });
};

/**
 * Extracts the relevant cookies from the login process.
 */
LoginBot.prototype.extractCookies = function (cookies) {
    var names = this.service.loginCookies;
    var store = {};

    cookies.forEach(function(cookie) {
        if(names.indexOf(cookie.name) != -1) {
            store[cookie.name] = cookie;
        }
    });

    return store;
};

LoginBot.prototype.finishLogin = function (cookies) {
    console.log('- login finished');
    this.publish('loggedIn', this.extractCookies(cookies));
    this.close();
};

/**
 * Close everything down
 */
LoginBot.prototype.close = function () {
    try {
        if(this.timer) {
            clearTimeout(this.timer);
            this.timer = false;
        }
    } catch(e) { /* do nothing */ }
};

/**
 * Called when the login times out
 */
LoginBot.prototype.loginTimedOut = function () {
    console.log('- [!] login action timed out.');

    this.publish('timeout');
    clearTimeout(this.timer);
};

Vent.implementOn(LoginBot.prototype);

module.exports = LoginBot;
