/* global module */
var MissingCredentialsError = function(serviceName) {
    this.message = 'No credentials found for ' + serviceName + '.';
};

MissingCredentialsError.prototype = new Error();

module.exports = MissingCredentialsError;