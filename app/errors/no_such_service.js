/* global module */
var NoSuchServiceError = function(serviceName) {
    this.message = 'No such service ' + serviceName + '.';
};

NoSuchServiceError.prototype = new Error();

module.exports = NoSuchServiceError;