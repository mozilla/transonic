casper.test.begin('basic test', function(test) {
    helpers.startCasper('/curate');

    helpers.waitForPageLoaded(function() {
        test.assertVisible('.main.login');
    });

    helpers.done(test);
});
