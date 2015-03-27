define('tests/unit/permissions',
    ['Squire'],
    function(Squire) {

    describe('permissions.authenticationRequired', function() {
        function setupRoutes(test) {
            return function(done) {
                new Squire()
                .require(['core/router', 'require'],
                         function(router, require) {
                    router.addRoutes([
                        {pattern: '^/login$', view_name: 'login'},
                        {pattern: '^/core/fxa-authorize$',
                         view_name: 'core/fxa_authorize'},
                    ]);
                    require(['permissions'], function(permissions) {
                        test(permissions);
                        done();
                    });
                });
            };
        }

        it('is not required for login', setupRoutes(function(permissions) {
            assert(!permissions.authenticationRequired('/login'));
        }));

        it('is not required for fxa_authorize',
           setupRoutes(function(permissions) {
            assert(!permissions.authenticationRequired('/core/fxa-authorize'));
        }));

        it('is not required for fxa_authorize with its state',
           setupRoutes(function(permissions) {
            var url = '/core/fxa-authorize?state=my-state';
            assert(!permissions.authenticationRequired(url));
        }));

        it('is required for other routes', setupRoutes(function(permissions) {
            assert(permissions.authenticationRequired('/something-else'));
        }));
    });

    describe('permissions.allowed', function() {
        it('is true when authentication is not required',
           new Squire().run(['core/user', 'permissions'],
                            function(user, permissions) {
            sinon.stub(permissions, 'authenticationRequired').returns(false);
            assert(permissions.allowed('/my-url'));
        }));

        it('is true when authentication is required and authenticated',
           new Squire().run(['core/user', 'permissions'],
                            function(user, permissions) {
            sinon.stub(permissions, 'authenticationRequired').returns(true);
            sinon.stub(user, 'logged_in').returns(true);
            assert(permissions.allowed('/my-url'));
        }));

        it('is false when authentication is required and not authenticated',
           new Squire().run(['core/user', 'permissions'],
                            function(user, permissions) {
            sinon.stub(permissions, 'authenticationRequired').returns(true);
            sinon.stub(user, 'logged_in').returns(false);
            assert(!permissions.allowed('/my-url'));
        }));
    });
});
