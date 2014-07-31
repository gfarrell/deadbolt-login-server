/* global module */

var maker = function(action) {
    this.action = action;
    this.parameters = [];
    this.data = {};
};

maker.prototype.withParameters = function(params) {
    this.parameters = params;
    return this;
};

maker.prototype.withData = function(data) {
    for(var x in data) {
        this.data[x] = data[x];
    }
    return this;
};
maker.prototype.create = function() {
    var r =  new Route(this.action);
    r.setParameters(this.parameters);
    r.setData(this.data);

    return r;
};

var Route = function(action) {
    this.action = action;
};
Route.prototype.setParameters = function(params) {
    this.params = params;
};
Route.prototype.setData = function(data) {
    this.data = data;
};
Route.prototype.respond = function(res) {
    this.action(res, this);
};

module.exports = {
    make: function(action) {
        return new maker(action);
    },
    Route: Route
};