module.exports = {
    createLoginScript: function() {
        return function() {
            var form = document.getElementById('login_form');
            var eml  = document.getElementById('email');
            var pwd  = document.getElementById('pass');

            // set via injection
            eml.value = window.deadbolt.credentials.email;
            pwd.value = window.deadbolt.credentials.password;

            form.submit();
        };
    }
};
