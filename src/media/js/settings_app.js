define('settings_app',
    ['core/settings', 'settings_local'],
    function(settings, localSettings) {

    settings._extend({
        api_url: 'http://' + window.location.hostname,

        param_whitelist: ['q', 'sort'],
        api_param_blacklist: null,

        // Used for feed builder.
        model_prototypes: {
            'feed-app': 'slug',
            'feed-brand': 'slug',
            'feed-collection': 'slug',
            'feed-shelf': 'slug',
        },

        fragment_error_template: 'errors/fragment.html',
        pagination_error_template: 'errors/pagination.html',

        tracking_id: 'UA-36116321-6',

        title_suffix: 'Firefox Marketplace Curation Tools',

        languages: [
            'af', 'ar', 'bg', 'bn-BD', 'bn-IN', 'ca', 'cs', 'cy', 'da', 'de',
            'dsb', 'ee', 'el', 'en-US', 'es', 'eu', 'ff', 'fr', 'fy', 'ga-IE',
            'ha', 'hsb', 'hu', 'id', 'ig', 'it', 'ja', 'ko', 'nb-NO', 'nl',
            'pl', 'pt-BR', 'ro', 'ru', 'sk', 'sq', 'sr', 'sr-Latn', 'sv-SE', 'sw',
            'tr', 'uk', 'wo', 'xh', 'zh-CN', 'zh-TW', 'zu'
        ],
    });

    settings._extend(localSettings);
});
