// Please leave quotes around keys! They're needed for Space Heater.

define('routes', [
    'core/router',
], function(router) {
    var root = '^/curate/';

    router.addRoutes([
        {pattern: root + '?$', view_name: 'home'},
        {pattern: root + '403$', view_name: '403'},
        {pattern: root + 'feed$', view_name: 'feed_builder'},
        {pattern: root + 'create/([^/<>"\']+)$', view_name: 'create'},
        {pattern: root + 'login$', view_name: 'login'},
        {pattern: root + 'manage$', view_name: 'listing'},
        {pattern: root + 'manage/([^/<>"\']+)/([^/<>"\']+)$', view_name: 'edit'},
        {pattern: root + 'late-customizations$',
         view_name: 'late-customizations'},
    ]);

    router.api.addRoutes({
        'app': '/api/v1/apps/app/{0}/?cache=1&vary=0',
        'collections': '/api/v2/feed/collections/',
        'collections-list': '/api/v2/transonic/feed/collections/?limit=5',
        'collection': '/api/v2/feed/collections/{0}/',
        'feed-apps': '/api/v2/feed/apps/',
        'feed-apps-list': '/api/v2/transonic/feed/apps/?limit=5',
        'feed-app': '/api/v2/feed/apps/{0}/',
        'feed-brands': '/api/v2/feed/brands/',
        'feed-brands-list': '/api/v2/transonic/feed/brands/?limit=5',
        'feed-brand': '/api/v2/feed/brands/{0}/',
        'feed-shelves': '/api/v2/feed/shelves/',
        'feed-shelves-list': '/api/v2/transonic/feed/shelves/?limit=5',
        'feed-shelf': '/api/v2/feed/shelves/{0}/',
        'feed-shelf-publish': '/api/v2/feed/shelves/{0}/publish/',
        'feed-items': '/api/v2/feed/get/?cache=0&vary=0',
        'feed-builder': '/api/v2/feed/builder/',
        'feed-element-search': '/api/v2/feed/elements/search/',
        'late-customization': '/api/v2/late-customization/{0}/',
        'late-customizations': '/api/v2/late-customization/',
        'search': '/api/v2/apps/search/no-region/?cache=1&vary=0',
    });
});
