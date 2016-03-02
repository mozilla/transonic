define('forms_transonic',
    ['app_selector', 'core/cache', 'core/defer', 'feed', 'core/format', 'jquery', 'jquery.fakefilefield', 'core/l10n', 'core/log', 'core/nunjucks', 'core/requests', 'core/storage', 'core/urls', 'core/utils', 'utils_local', 'validate_transonic', 'core/z'],
    function(app_select, cache, defer, feed, format, $, fakefilefield, l10n, log, nunjucks, requests, storage, urls, utils, utils_local, validate, z) {
    'use strict';
    format = format.format;
    var gettext = l10n.gettext;
    var logger = log('forms_transonic');

    var feed_app = function($form, slug) {
        /* Create or update FeedApp. */
        // Gather data.
        var data = {
            app: $form.find('[name="app"]').val(),
            background_image_upload_url: $form.find('.processed-aviary-url').val(),
            color: $form.find('.bg-color input:checked').val(),
            description: utils_local.build_localized_field('description'),
            type: $form.find('.featured-type-choices').val(),
            preview: $form.find('.screenshot li.selected').data('id'),
            pullquote_attribution: $form.find('[name="pq-attribution"]').val(),
            pullquote_rating: $form.find('.pq-rating input:checked').val(),
            pullquote_text: utils_local.build_localized_field('pq-text'),
            slug: $form.find('[name="slug"]').val(),
        };
        var $preview = $form.find('.fileinput .preview');

        // Validate.
        var errors = validate.feed_app(data, $preview);
        if (!$.isEmptyObject(errors)) {
            return defer.Deferred().reject(errors);
        }

        // Sanitize data before submitting to API.
        if (data.type !== feed.FEEDAPP_QUOTE) {
            delete data.pullquote_attribution;
            delete data.pullquote_rating;
        }
        data = populate_empty_translations(data, ['description']);

        cache.flush();
        return save_feed_app(data, slug);
    };

    var collection = function($form, slug) {
        /* Create or update FeedCollection. */
        // Check for app groups first.
        var $items = $('.apps-widget .result');
        var type = $form.find('.collection-type-choices').val();
        var is_grouped = type == feed.COLL_PROMO && $items.filter('.app-group').length;

        // Gather data.
        var data = {
            apps: is_grouped ? get_app_groups($items) : get_app_ids($items),
            background_image_upload_url: $form.find('.processed-aviary-url').val(),
            color: $form.find('.bg-color input:checked').val(),
            type: type,
            description: utils_local.build_localized_field('description'),
            name: utils_local.build_localized_field('name'),
            slug: $form.find('[name="slug"]').val(),
        };
        var $preview = $form.find('.fileinput .preview');
        logger.log(JSON.stringify(data));

        // Validate.
        var errors = {};
        $.extend(errors, is_grouped ? validate.app_group($items) : {});
        $.extend(errors, validate.collection(data, $preview));
        if (!$.isEmptyObject(errors)) {
            return defer.Deferred().reject(errors);
        }

        // Sanitize data before submitting to API.
        data = populate_empty_translations(data, ['description', 'name']);

        cache.flush();
        return save_collection(data, slug);
    };

    var brand = function($form, slug) {
        /* Create or update FeedBrand. */
        // Gather data.
        var data = {
            apps: get_app_ids($('.apps-widget .result')),
            layout: $form.find('[name="layout"]').val(),
            type: $form.find('[name="type"]').val(),
            slug: $form.find('[name="slug"]').val(),
        };

        // Validate.
        var errors = validate.brand(data);
        if (!$.isEmptyObject(errors)) {
            return defer.Deferred().reject(errors);
        }

        cache.flush();
        return save_brand(data, slug);
    };

    var shelf = function($form, slug) {
        /* Create or update FeedShelf. */
        // Gather data.
        var data = {
            apps: get_app_ids($('.apps-widget .result')),
            background_image_upload_url: $form.find('.bg-banner .processed-aviary-url').val(),
            background_image_landing_upload_url: $form.find('.bg-banner-landing .processed-aviary-url').val(),
            carrier: $form.find('[name="carrier"]').val(),
            description: utils_local.build_localized_field('description'),
            name: utils_local.build_localized_field('name'),
            region: $form.find('[name="region"]').val(),
            slug: $form.find('[name="slug"]').val(),
        };
        var $preview = $form.find('.fileinput .preview');

        // Validate.
        var errors = validate.shelf(data, $preview);
        if (!$.isEmptyObject(errors)) {
            return defer.Deferred().reject(errors);
        }

        // Sanitize data before submitting to API.
        data = populate_empty_translations(data, ['description', 'name']);

        cache.flush();
        return save_shelf(data, slug);
    };

    var feed_items = function($feeds, modified_regions) {
        /* Create feed items!
           Converts to object of regions pointing to feed-type/feed-element-id
           pairs.
           {
               'us': [['app', 32], ['collection', 5], ['brand', 231]],
           }

           -- modified_regions - list of regions that we think may have been
                                 modified so we'll just save it.
        */
        var data = {};
        modified_regions.forEach(function(region) {
            data[region] = [];

            var $region_feed = $feeds.find(format('.region-feed[data-region="{0}"]',
                                                  [region]));
            $region_feed.find('.feed-element').each(function(i, feed_element) {
                data[region].push([feed_element.getAttribute('data-type'),
                                   feed_element.getAttribute('data-id')]);
            });
        });
        logger.log(JSON.stringify(data));

        // Validate.
        var errors = validate.feed_items(data);
        if (errors.length) {
            return defer.Deferred().reject(errors);
        }

        return save_feed_items(data);
    };

    function save_feed_app(data, slug) {
        var def = defer.Deferred();
        function success(feed_app) {
            def.resolve(feed_app);
        }
        function fail(xhr) {
            def.reject(xhr.responseText);
        }

        if (slug) {
            // Update.
            requests.put(urls.api.url('feed-app', [slug]), data).then(success, fail);
        } else {
            // Create.
            requests.post(urls.api.url('feed-apps'), data).then(success, fail);
        }

        return def.promise();
    }

    function save_collection(data, slug) {
        var def = defer.Deferred();
        function success(collection) {
            def.resolve(collection);
        }
        function fail(xhr) {
            def.reject(xhr.responseText);
        }

        if (slug) {
            // Update.
            requests.put(urls.api.url('collection', [slug]), data).then(success, fail);
        } else {
            // Create.
            requests.post(urls.api.url('collections'), data).then(success, fail);
        }

        return def.promise();
    }

    function save_brand(data, slug) {
        var def = defer.Deferred();
        function success(brand) {
            def.resolve(brand);
        }
        function fail(xhr) {
            def.reject(xhr.responseText);
        }

        if (slug) {
            // Update.
            requests.put(urls.api.url('feed-brand', [slug]), data).then(success, fail);
        } else {
            // Create.
            requests.post(urls.api.url('feed-brands'), data).then(success, fail);
        }

        return def.promise();
    }

    function save_shelf(data, slug) {
        var def = defer.Deferred();
        function success(shelf) {
            def.resolve(shelf);
        }
        function fail(xhr) {
            def.reject(xhr.responseText);
        }

        if (slug) {
            // Update.
            requests.put(urls.api.url('feed-shelf', [slug]), data).then(success, fail);
        } else {
            // Create.
            requests.post(urls.api.url('feed-shelves'), data).then(success, fail);
        }

        return def.promise();
    }

    function publish_shelf($form, slug) {
        var def = defer.Deferred();
        function success(shelf) {
            def.resolve(shelf);
        }
        function fail(xhr) {
            def.reject(xhr.responseText);
        }

        requests.put(urls.api.url('feed-shelf-publish', [slug])).then(success, fail);
        return def.promise();
    }

    function unpublish_shelf($form, slug) {
        var def = defer.Deferred();
        function success(shelf) {
            def.resolve(shelf);
        }
        function fail(xhr) {
            def.reject(xhr.responseText);
        }

        requests.del(urls.api.url('feed-shelf-publish', [slug])).then(success, fail);
        return def.promise();
    }

    function save_feed_items(data) {
        // The GRAND DENOUEMENT.
        return requests.put(urls.api.url('feed-builder'), data);
    }

    function get_app_ids($items) {
        // Return a list of app IDs.
        return $.map($items.filter(':not(.app-group)'), function(app) {
            return parseInt(app.getAttribute('data-id'), 10);
        });
    }

    function get_app_groups($items) {
        // If it is a promo collection with app groupings, create an array of objects by group.
        var apps = [];
        $items.filter('.app-group').each(function(i, app_group) {
            var $app_group = $(app_group);
            var group = {
                name: utils_local.build_localized_field($app_group.find('input').data('name')),
                apps: []
            };

            var $next = $app_group.next();
            while ($next.length && !$next.hasClass('app-group')) {
                // Append apps until we get to the next group.
                group.apps.push(parseInt($next.data('id'), 10));
                $next = $next.next();
            }

            apps.push(group);
        });

        return apps;
    }

    function get_translated_locales(data, localized_fields) {
        // Iterate over each of the passed localized fields, returning an array
        // containing each language with a translation.
        var locales = [];
        localized_fields.forEach(function(field_name) {
            var field_data = data[field_name];
            $.each(field_data, function(locale, translation) {
                if (!!translation && locales.indexOf(locale) == -1) {
                    locales.push(locale);
                }
            });
        });
        return locales;
    }

    function populate_empty_translations(data, localized_fields) {
        // Santize the passed data by making sure that any locale that has
        // a translation in one of the passed fields has a translation (even if
        // it is an empty string) in each of the passed fields.
        var locales = get_translated_locales(data, localized_fields);
        localized_fields.forEach(function(field_name) {
            locales.forEach(function(locale) {
                if (!(locale in data[field_name])) {
                    data[field_name][locale] = '';
                }
            });
        });
        return data;
    }

    return {
        brand: brand,
        collection: collection,
        feed_app: feed_app,
        feed_items: feed_items,
        get_translated_locales: get_translated_locales,
        shelf: shelf,
        populate_empty_translations: populate_empty_translations,
        publish_shelf: publish_shelf,
        unpublish_shelf: unpublish_shelf,
    };
});
