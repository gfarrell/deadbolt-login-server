module.exports = {
    createLoginScript: function() {
        return function(credentials) {
            var form = document.getElementById('login_form');
            var eml  = document.getElementById('email');
            var pwd  = document.getElementById('pass');

            // set via injection
            eml.value = credentials.email;
            pwd.value = credentials.password;

            form.submit();
        };
    }
};
