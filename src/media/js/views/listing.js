define('views/listing',
    ['cache', 'feed_previews', 'format', 'jquery', 'l10n', 'log', 'models', 'notification', 'requests', 'settings', 'templates', 'underscore', 'urls', 'utils', 'z'],
    function(cache, feed_previews, format, $, l10n, log, models, notification, requests, settings, nunjucks, _, urls, utils, z) {
    'use strict';
    var gettext = l10n.gettext;

    z.body.on('click', '.manage-modules-listing .delete', utils._pd(function(e) {
        e.stopPropagation();

        // Delete.
        var $this = $(this);
        var $item = $this.closest('li');

        if (!window.confirm(format.format(gettext('Do you really want to delete {0}?'), $item.data('slug')))) {
            // Confirm.
            return;
        }

        var endpoint = urls.api.url('feed-app', [$item.data('slug')]);
        if ($this.hasClass('collection')) {
            endpoint = urls.api.url('collection', [$item.data('slug')]);
        } else if ($this.hasClass('brand')) {
            endpoint = urls.api.url('feed-brand', [$item.data('slug')]);
        }

        requests.del(endpoint).done(function(data) {
            notification.notification({message: gettext('Successfully deleted')});
            $item.remove();
            cache.flush();
        }).fail(function() {
            notification.notification({message: gettext('Sorry, we had an error deleting that')});
        });

    }))
    .on('input', '.search-elements', _.debounce(function() {
        var $this = $(this);
        var $clear = $this.siblings('.search-clear');

        if ($this.val().length > 1) {
            $clear.show();
            requests.get(urls.api.url('feed-element-search', [], {'q': $this.val()})).done(function(data) {
                $('.feed-api-results').hide();
                $('.feed-search-results').html(nunjucks.env.render('search_results.html', {
                    data: data
                })).show();

                cast_search_results(data);
            });
        } else {
            $clear.hide();
            $('.feed-api-results').show();
            $('.feed-search-results').hide();
        }
    }, 250))
    .on('click', '.search-clear', function(evt) {
        evt.preventDefault();
        var $this = $(this);
        $this.hide();
        $this.siblings('.search-elements').val('').trigger('input');
    });

    function cast_search_results(data) {
        models('feed-app').cast(data.apps);
        models('feed-brand').cast(data.brands);
        models('feed-collection').cast(data.collections);
        models('feed-shelf').cast(data.shelves);
    }

    return function(builder, args) {
        builder.z('title', gettext('Existing Content'));
        builder.z('type', 'edit listing');
        builder.start('listing/listing.html');

        feed_previews.empty();
    };
});
