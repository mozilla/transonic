/*
    The main file that initializes the app.
    Only put initialization code in here. Everything else should go into
    separate and appropriate modules. This is not your diaper.
*/
console.log('Firefox Marketplace Curation Tools');

define('main', ['init'], function(init) {
init.done(function() {
require(
    [// Modules actually used in main.
     'core/l10n', 'core/log', 'core/navigation', 'core/nunjucks', 'core/urls',
     'core/user', 'core/z', 'permissions',
     // Modules we require to initialize global stuff.
     'core/login', 'feed_previews', 'views/listing'],
    function(l10n, log, navigation, nunjucks, urls,
             user, z, permissions) {
    var logger = require('core/log')('main');

    z.body.addClass('html-' + l10n.getDirection());

    z.page.one('loaded', function() {
        logger.log('Hiding splash screen');
        $('#splash-overlay').addClass('hide');
        $('main').append(
            nunjucks.env.render('feed_aside.html'));
        z.body.addClass('loaded');
    });

    // Do some last minute template compilation.
    z.page.on('reload_chrome', function() {
        logger.log('Reloading chrome');
        $('#site-header').html(
            nunjucks.env.render('header.html'));
        $('#site-footer').html(
            nunjucks.env.render('footer.html'));

        z.body.toggleClass('logged-in', user.logged_in());
        z.page.trigger('reloaded_chrome');
    }).trigger('reload_chrome');

    z.body.on('click', '.site-header .back', function(e) {
        e.preventDefault();
        logger.log('← button pressed');
        navigation.back();
    }).on('click', 'aside', function() {
        $(this).toggleClass('active');
    });

    z.page.on('loaded logged_in', function() {
        if (user.logged_in() && !user.get_permission('curator') &&
            !user.get_permission('admin')) {
            z.page.trigger('navigate', [urls.reverse('403')]);
        }
    });

    z.page.on('logged_out', function() {
        z.page.trigger('navigate', [urls.reverse('login')]);
    });

    z.page.on('navigate', function(e, url) {
        if (!permissions.allowed(url)) {
            z.page.trigger('divert', [urls.reverse('login')]);
        }
    });

    z.page.on('click', '.loadmore', function() {
        var $btn = $(this).find('button');
        $btn.text(gettext('Loading...'));
        z.page.one('loaded_more', function() {
            $btn.text(gettext('More'));
        });
    });

    // Perform initial navigation.
    logger.log('Triggering initial navigation');
    z.page.trigger('navigate', [window.location.pathname + window.location.search]);
    z.page.trigger('loaded');

    logger.log('Done');
});
});
});
