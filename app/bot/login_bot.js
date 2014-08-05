/* global module */

var Casper = require('casper');
var Vent   = require('event.js');

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
    var headers = ['connection', 'accept', 'user-agent', 'accept-encoding', 'accept-language'];
    var store = {};

    headers.forEach(function(header) {
        var sepChar = '-';
        var correctCaseHeader = header.split(sepChar).map(function(v) { return v[0].toUpperCase() + v.substr(1); }).join(sepChar);
        store[correctCaseHeader] = request.headers[header];
    });

    this.headers = store;
};

/**
 * Gets the login page URL
 */
LoginBot.prototype.getLoginURL = function () {
    return 'https://' + this.service.loginPage;
};

/**
 * Indicated if currently loading
 * @param {Boolean} isLoading set loading status
 */
LoginBot.prototype.isLoading = function (isLoading) {
    if(isLoading !== undefined) {
        this._loading = !!isLoading;
    }

    return this._loading;
};

/**
 * Initiates the login process
 * @param {Function} callback to be called when login is complete
 */
LoginBot.prototype.initiateLogin = function (onLogin, onLoginError) {
    var instance = this;
    var browser;

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

    browser = Casper.create({
        pageSettings: {
            javascriptEnabled: true,
            loadImages: false,
            loadPlugins: false,
            userAgent: this.headers['User-Agent']
        }
    });
    browser.start();

    // Open the login page
    browser.open(this.getLoginURL(), {
        headers: self.headers
    });

    // do login
    browser.then(function() {
        // fill and submit login form
        if(instance.service.hasOwnProperty('simpleLogin')) {
            this.fill(instance.service.simpleLogin.form, instance.credentials, true);
        } else {
            var pageFunction = require('./' + instance.service.name + '_login').createLoginScript();
            this.evaluate(pageFunction, instance.credentials);
        }
    });

    // finish login
    browser.then(function() {
        instance.finishLogin(this.cookies);
    });

    // run
    browser.run();
};

/**
 * Extracts the relevant cookies from the login process.
 */
LoginBot.prototype.extractCookies = function (cookies) {
    var names = this.service.loginCookies;
    var cookies = {};

    names.forEach(function(n) {
        cookies[n] = this.page.cookies[n];
    });

    return cookies;
};

LoginBot.prototype.finishLogin = function (cookies) {
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
