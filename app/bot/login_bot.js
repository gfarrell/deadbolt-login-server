/* global module */

var Phantom = require('phantom');

var LoginBot = function(serviceController) {
    var self = this;

    this.service = serviceController.getService();
    this.credentials = serviceController.getCredentials();

    this.state = 0;
};

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

    this.loginCallback = callback;

    Phantom.create(function(ph) {
        ph.createPage(function(page) {
            self.page = page;

            page.onLoadFinished = self.botLoaded.bind(self);

            // set headers
            page.customHeaders  = self.headers;

            // open the login page
            page.open(this.getLoginURL(), function() {
                // fill and submit login form
                var pageFunction = require('./' + self.service.name + '_login').createLoginScript(self.credentials);
                self.phantom.evaluate(pageFunction);
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
        }
    }
};

module.exports = LoginBot;
