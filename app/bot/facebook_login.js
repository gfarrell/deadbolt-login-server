var loginScript = function(credentials) {
    var email = credentials.email;
    var password = credentials.password;

    return function() {
        var form = document.getElementById('login_form');
        var eml  = document.getElementById('email');
        var pwd  = document.getElementById('pass');

        eml.value = email;
        pwd.value = password;

        form.submit();
    };
};

module.exports = {
    createLoginScript: loginScript
};
