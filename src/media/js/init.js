/*
    Contains things to initialize before we kick off the app.
    Exposes a promise that the `main` module should wait on.
*/
define('init',
    ['core/init', 'routes', 'settings_app', 'templates',
     'helpers_local'],
    function(init, routes, settingsApp, templates,
             helpers_local) {

    return init.ready;
});
