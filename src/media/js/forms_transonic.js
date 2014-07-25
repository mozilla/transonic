define('forms_transonic',
    ['app_selector', 'cache', 'defer', 'feed', 'format', 'jquery', 'jquery.fakefilefield', 'l10n', 'log', 'notification', 'nunjucks', 'requests', 'storage', 'urls', 'utils', 'utils_local', 'validate_transonic', 'z'],
    function(app_select, cache, defer, feed, format, $, fakefilefield, l10n, log, notification, nunjucks, requests, storage, urls, utils, utils_local, validate, z) {
    'use strict';
    var format = format.format;
    var gettext = l10n.gettext;
    var console = log('forms_transonic');

    var feed_app = function($form, slug) {
        /* Create or update FeedApp. */
        // Gather data.
        var data = {
            app: $form.find('[name="app"]').val(),
            background_color: $form.find('.bg-color input:checked').val(),
            description: utils_local.build_localized_field('description'),
            type: $form.find('.featured-type-choices').val(),
            preview: $form.find('.screenshot li.selected').data('id'),
            pullquote_attribution: $form.find('[name="pq-attribution"]').val(),
            pullquote_rating: $form.find('.pq-rating input:checked').val(),
            pullquote_text: utils_local.build_localized_field('pq-text'),
            slug: get_slug($form.find('[name="slug"]')),
        };
        var $file_input = $form.find('[name="background-image-feed-banner"]');
        var $preview = $form.find('.fileinput .preview');
        console.log(JSON.stringify(data));

        // Validate.
        var errors = validate.feed_app(data, $file_input, $preview);
        errors = errors.concat(validate.image($file_input));
        if (errors.length) {
            return defer.Deferred().reject(errors);
        }

        cache.flush();
        return save_feed_app(data, slug, $file_input);
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
            background_color: $form.find('.bg-color input:checked').val(),
            type: type,
            description: utils_local.build_localized_field('description'),
            name: utils_local.build_localized_field('name'),
            slug: get_slug($form.find('[name="slug"]')),
        };
        var $file_input = $form.find('[name="background-image-feed-banner"]');
        var $preview = $form.find('.fileinput .preview');
        console.log(JSON.stringify(data));

        // Validate.
        var errors = is_grouped ? validate.app_group($items) : [];
        errors = errors.concat(validate.collection(data, $file_input, $preview));
        errors = errors.concat(validate.image($file_input));
        if (errors.length) {
            return defer.Deferred().reject(errors);
        }
        $('.form-errors').empty();

        cache.flush();
        return save_collection(data, slug, $file_input);
    };

    var brand = function($form, slug) {
        /* Create or update FeedBrand. */
        // Gather data.
        var data = {
            apps: get_app_ids($('.apps-widget .result')),
            layout: $form.find('[name="layout"]').val(),
            type: $form.find('[name="type"]').val(),
            slug: get_slug($form.find('[name="slug"]')),
        };
        console.log(JSON.stringify(data));

        // Validate.
        var errors = validate.brand(data);
        if (errors.length) {
            return defer.Deferred().reject(errors);
        }
        $('.form-errors').empty();

        cache.flush();
        return save_brand(data, slug);
    };

    var shelf = function($form, slug) {
        /* Create or update FeedShelf. */
        // Gather data.
        var data = {
            apps: get_app_ids($('.apps-widget .result')),
            background_color: $form.find('.bg-color input:checked').val(),
            carrier: $form.find('[name="carrier"]').val(),
            description: utils_local.build_localized_field('description'),
            name: utils_local.build_localized_field('name'),
            region: $form.find('[name="region"]').val(),
            slug: get_slug($form.find('[name="slug"]')),
        };
        var $file_input = $form.find('[name="background-image-feed-banner"]');
        var $preview = $form.find('.fileinput .preview');
        console.log(JSON.stringify(data));

        // Validate.
        var errors = validate.shelf(data, $file_input, $preview);
        errors = errors.concat(validate.image($file_input));
        if (errors.length) {
            return defer.Deferred().reject(errors);
        }
        $('.form-errors').empty();

        cache.flush();
        return save_shelf(data, slug, $file_input);
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
        for (var i = 0; i < modified_regions.length; i++) {
            var region = modified_regions[i];
            data[region] = [];

            var $region_feed = $feeds.find(format('.region-feed[data-region="{0}"]', [region]));
            $region_feed.find('.feed-element').each(function(i, feed_element) {
                data[region].push([feed_element.getAttribute('data-type'),
                                   feed_element.getAttribute('data-id')]);
            });
        }
        console.log(JSON.stringify(data));

        // Validate.
        var errors = validate.feed_items(data);
        if (errors.length) {
            return defer.Deferred().reject(errors);
        }
        $('.form-errors').empty();

        return save_feed_items(data);
    };

    function save_feed_app(data, slug, $file_input) {
        // Post FeedApp.
        var def = defer.Deferred();

        function success(feed_app) {
            // Upload background image if needed.
            if ($file_input.val()) {
                upload_feed_image(feed_app, 'feed-app-image', $file_input).done(function(feed_image) {
                    def.resolve(feed_app);
                }).fail(function(error) {
                    def.reject(error);
                });
            } else {
                def.resolve(feed_app);
            }
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

    function save_collection(data, slug, $file_input) {
        var def = defer.Deferred();

        function success(collection) {
           if ($file_input.val()) {
                upload_feed_image(collection, 'collection-image', $file_input).done(function(feed_image) {
                    def.resolve(collection);
                }).fail(function(error) {
                    def.reject(error);
                });
            } else {
                def.resolve(collection);
            }
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

    function save_shelf(data, slug, $file_input) {
        var def = defer.Deferred();

        function success(shelf) {
            if ($file_input.val()) {
                upload_feed_image(shelf, 'feed-shelf-image', $file_input).done(function(feed_image) {
                    def.resolve(shelf);
                }).fail(function(error) {
                    def.reject(error);
                });
            } else {
                def.resolve(shelf);
            }
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

    function upload_feed_image(obj, endpoint, $file_input) {
        // Upload feed app background image (header graphic).
        var def = defer.Deferred();
        var reader = new FileReader();

        reader.onloadend = function() {
            // Read from file input to data URL and send image to API upload endpoint.
            requests.put(urls.api.url(endpoint, [obj.id]), reader.result).done(function(data) {
                def.resolve(data);
            });
        };
        reader.readAsDataURL($file_input[0].files[0]);
        return def.promise();
    }

    function get_slug($slug) {
        if ($slug.val().length) {
            return $slug.val();
        } else if ($slug.attr('placeholder').length) {
            return $slug.attr('placeholder');
        }
        return $slug.val();
    }

    return {
        brand: brand,
        collection: collection,
        feed_app: feed_app,
        feed_items: feed_items,
        shelf: shelf,
        publish_shelf: publish_shelf,
    };
});
