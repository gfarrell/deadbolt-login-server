/* global module */

var Phantom = require('phantom');

var LoginBot = function(serviceController) {
    var self = this;

    this.service = serviceController.getService();
    this.credentials = serviceController.getCredentials();

    this.state = 0;
    this.timer = false;
};

LoginBot.TIMEOUT = 10000;

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

LoginBot.prototype.getLoginURL = function () {
    return 'https://' + this.service.loginPage;
};

LoginBot.prototype.initiateLogin = function (callback) {
    var self = this;

    if(this.timer) {
        console.log('- new login created while in progress... aborting new request.');
        return false;
    } else {
        this.timer = setTimeout(this.loginTimedOut.bind(this), LoginBot.TIMEOUT);
    }

    this.loginCallback = callback;

    Phantom.create(function(ph) {
        self.phantom = ph;
        ph.createPage(function(page) {
            self.page = page;

            page.onLoadFinished = self.botLoaded.bind(self);

            // set headers
            page.customHeaders  = self.headers;

            // open the login page
            page.open(self.getLoginURL(), function() {
                // inject credentials
                // hopefully JSON evaluation makes this safe
                page.evaluate(new Function('window.deadbolt = ' + JSON.stringify({ credentials: self.credentials })));

                // fill and submit login form
                var pageFunction = require('./' + self.service.name + '_login').createLoginScript();
                page.evaluate(pageFunction);
                page.render('test.png');
            });
        });
    });
};

LoginBot.prototype.extractCookies = function () {
    var names = this.service.loginCookies;
    var cookies = {};

    names.forEach(function(n) {
        cookies[n] = this.page.cookies[n];
    });

    return cookies;
};

LoginBot.prototype.botLoaded = function (status) {
    if(status !== 200) {
        console.log('problem: status not OK ('+status+')');
    } else {
        switch(state++) {
        case 0:
            // login page loaded
            console.log('- 0 Login page loaded');
            break;
        case 1:
            // have submitted login form
            console.log('- 1 Login form submitted');
            this.loginCallback(this.extractCookies());
            this.page.close();
            this.phantom.exit();
            clearTimeout(this.timer);
            break;
        }
    }
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
        clearTimeout(this.timer);
        this.phantom.exit();
    }
};

module.exports = LoginBot;
