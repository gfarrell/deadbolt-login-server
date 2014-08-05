/* global module */

var Phantom = require('phantom');
var Vent    = require('event.js');

var LoginBot = function(serviceController) {
    var self = this;

    this.service = serviceController.getService();
    this.credentials = serviceController.getCredentials();

    this.state = 0;
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

            // Listen to onLoadStarted
            page.onLoadStarted = function() {
                console.log('- loading...');
                self.isLoading(true);
            };

            // Listen to onLoadFinished events
            page.onLoadFinished = function(status) {
                console.log('- finished loading');
                self.isLoading(false);
            };

            // start the process
            self.step();
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

LoginBot.prototype.doLogin = function () {
    // inject credentials
    // hopefully JSON evaluation makes this safe
    this.page.evaluate(new Function('window.deadbolt = ' + JSON.stringify({ credentials: this.credentials })));

    // fill and submit login form
    var pageFunction = require('./' + this.service.name + '_login').createLoginScript();
    this.page.evaluate(pageFunction);
};

LoginBot.prototype.finishLogin = function () {
    this.publish('loggedIn', this.extractCookies());
    this.close();
};

/**
 * Stepping function
 */
LoginBot.prototype.step = function () {
    if(!this.isLoading()) {
        switch(this.state++) {
            case 0:
                // start process
                console.log('- [0] loading login page');
                this.page.customHeaders = this.headers;
                this.page.open(this.getLoginURL());
                this.steppingTimer = setInterval(this.step.bind(this), 100);
                break;
            case 1:
                // loaded login page
                console.log('- [1] login page has loaded');
                this.doLogin();
                break;
            case 2:
                // form has submitted and next page has loaded
                console.log('- [2] form has been submitted');
                this.finishLogin();
                break;
            default:
                this.publish('error', 'invalid state');
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
        if(this.steppingTimer) {
            clearInterval(this.steppingTimer);
            this.steppingTimer = false;
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
