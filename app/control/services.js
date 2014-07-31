/* global module, require */
var config = require('../config/services.json');
var creds  = require('../config/credentials.json');
var NoSuchServiceError = require('../errors/no_such_service');
var MissingCredentialsError = require('../errors/missing_credentials');

var ServiceController = function(name) {
    if(!config.hasOwnProperty(name)) {
        throw new NoSuchServiceError(name);
    }
    if(!creds.hasOwnProperty(name)) {
        throw new MissingCredentialsError(name);
    }

    this.service = config[name];
    this.login   = creds[name];
};

ServiceController.prototype.getService     = function() {
    return this.service;
};
ServiceController.prototype.getCredentials = function() {
    return this.login;
};

module.exports = {
    load: function(name) {
        return new ServiceController(name);
    }
};