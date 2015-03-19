/*
    Contains things to initialize before we kick off the app.
    Exposes a promise that the `main` module should wait on.
*/
define('init',
    ['core/init', 'helpers_local', 'routes', 'settings_app', 'settings_local',
     'templates'],
    function(init, helpersLocal, routes, settingsApp, settingsLocal,
             templates) {

    return init.ready;
});
