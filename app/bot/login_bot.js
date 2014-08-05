/* global module */

var Phantom = require('phantom');
var Vent    = require('event.js');

var LoginBot = function(serviceController) {
    var self = this;

    this.service = serviceController.getService();
    this.credentials = serviceController.getCredentials();

    this.state = 0;
    this.timer = false;

    this.subscribe('load', this.onLoad);
};

LoginBot.TIMEOUT = 15000;

/**
 * Mimics a browser by examining a request
 * @param  {IncomingMessage} request the original request from the user's browser
 * @return {void}
 */
LoginBot.prototype.mimic = function (request) {
    var headers = ['connection', 'accept', 'user-agent', 'accept-encoding', 'accept-language'];
    var store = {};

    headers.forEach(function(header) {
        var sepChar = '-';
        var correctCaseHeader = header.split(sepChar).map(function(v) { return v[0].toUpperCase() + v.substr(1); }).join(sepChar);
        store[correctCaseHeader] = request.headers[header];
    });

    console.log('- mimicking headers: ');
    console.log(JSON.stringify(store));

    this.headers = store;
};

/**
 * Gets the login page URL
 */
LoginBot.prototype.getLoginURL = function () {
    return 'https://' + this.service.loginPage;
};

/**
 * Initiates the login process
 * @param {Function} callback to be called when login is complete
 */
LoginBot.prototype.initiateLogin = function (onLogin, onLoginError) {
    var self = this;

    if(this.timer) {
        console.log('- new login created while in progress... aborting new request.');
        return false;
    } else {
        this.timer = setTimeout(this.loginTimedOut.bind(this), LoginBot.TIMEOUT);
    }

    if(typeof onLogin == 'function') {
        this.subscribe('login', onLogin);
    }
    if(typeof onLoginError == 'function') {
        this.subscribe('error', onLoginError);
    }

    Phantom.create(function(ph) {
        self.phantom = ph;
        ph.createPage(function(page) {
            self.page = page;

            // Listen to onLoadFinished events
            page.onLoadFinished = function(status) {
                console.log('load');
                //self.botLoaded(status);
            };

            // set headers
            page.customHeaders  = self.headers;

            // open the login page
            page.open(self.getLoginURL(), function(status) {
                self.publish('load', status);
            });
        });
    });
};

/**
 * Extracts the relevant cookies from the login process.
 */
LoginBot.prototype.extractCookies = function () {
    var names = this.service.loginCookies;
    var cookies = {};

    names.forEach(function(n) {
        cookies[n] = this.page.cookies[n];
    });

    return cookies;
};

/**
 * Called onLoadFinished on Phantom WebPage
 * @param  {String} status  the phantom status message
 */
LoginBot.prototype.onLoad = function (status) {
    if(status !== 'success') {
        console.log('problem: status not OK');
    } else {
        switch(this.state++) {
        case 0:
            // login page loaded
            console.log('- Login page loaded');

            // inject credentials
            // hopefully JSON evaluation makes this safe
            this.page.evaluate(new Function('window.deadbolt = ' + JSON.stringify({ credentials: this.credentials })));

            // fill and submit login form
            var pageFunction = require('./' + this.service.name + '_login').createLoginScript();
            this.page.evaluate(pageFunction);
            break;
        case 1:
            // have submitted login form
            console.log('- Login form submitted');
            this.publish('login', this.extractCookies());
            this.close();
            break;
        }
    }
};

/**
 * Close everything down
 */
LoginBot.prototype.close = function () {
    try {
        this.page.close();
        this.phantom.exit();

        if(this.timer) {
            clearTimeout(this.timer);
            this.timer = false;
        }
    } catch(e) { /* do nothing */ }

    this.state = 0;
};

/**
 * Called when the login times out
 */
LoginBot.prototype.loginTimedOut = function () {
    console.log('- [!] login action timed out.');
    try {
        this.page.close();
    } catch(e) {
        console.log('- [!] unable to close page');
    } finally {
        this.publish('timeout');
        clearTimeout(this.timer);
        this.phantom.exit();
    }
};

Vent.implementOn(LoginBot.prototype);

module.exports = LoginBot;
