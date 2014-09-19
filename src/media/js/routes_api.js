define('routes_api', [], function() {
    return {
        'login': '/api/v1/account/login/',
        'logout': '/api/v1/account/logout/',

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
        'search': '/api/v1/apps/search/suggest?cache=1&vary=0&filtering=0',
    };
});
