var JSONResponse = function(serverResponseStream) {
    this.res = serverResponseStream;
    this.o   = {
        messages: []
    };

    this.setHeaders();
};

JSONResponse.prototype.setHeaders = function () {
    this.res.setHeader('Content-Type', 'application/json');
};

JSONResponse.prototype.message = function (text) {
    this.o.messages.push(text);
};

JSONResponse.prototype.set = function (key, val) {
    if(key != 'messages') {
        this.o[key] = val;
    } else {
        throw new Error('"messages" is a protected key, please use JSONResponse.message(text) to add a new message');
    }
};

JSONResponse.prototype.error = function (close) {
    this.o.error = true;
    if(close) {
        this.write();
    }
};

JSONResponse.prototype.write = function () {
    this.res.end(JSON.stringify(this.o));
};

module.exports = {
    create: function(serverResponseStream) {
        return new JSONResponse(serverResponseStream);
    }
};
