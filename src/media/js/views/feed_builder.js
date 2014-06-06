define('views/feed_builder', ['forms_transonic', 'jquery', 'jquery-sortable', 'format', 'l10n', 'notification', 'utils', 'z'],
    function(forms_transonic, $, sortable, format, l10n, notification, utils, z) {
    'use strict';
    var format = format.format;
    var gettext = l10n.gettext;

    // Keep track of what regions we look at to limit the queries on the backend if we publish.
    var modified_regions = ['restofworld'];

    z.page.on('change', '.feed-region-switcher', function() {
        /* Look at a different feed. */
        var region = this.value;
        $('.localized').addClass('hidden')
                       .filter('[data-region=' + region + ']').removeClass('hidden');
        modified_regions.push(region);
    })
    .on('click', '.feed-builder .manage-modules-listing .feed-element', function() {
        /* Add feed element to feed. */
        append(get_region_feed(), $(this));
    })
    .on('click', '.feed-builder .feed .feed-element .delete', function() {
        /* Remove element from feed. */
        remove($(this).closest('.feed-element'));
    })
    .on('click', '.feed-builder .submit', utils._pd(function() {
        /* Publish changes. */
        forms_transonic.feed_items($('.feeds'), modified_regions).done(function() {
            notification.notification({message: gettext('Feed changes successfully published!')});
        }).fail(function(err) {
            notification.notification({message: gettext('Sorry, there was an error publishing your changes.')});
        });
    }));

    function append($feed, $feed_element) {
        var type = $feed_element.data('type');
        var id = $feed_element.data('id');
        if ($feed.find(format('[data-type="{0}"][data-id="{1}"]', [type, id])).length) {
            // Already exists.
            return;
        }
        $feed.find('.empty-results').hide();
        $feed.find('.feed-elements').append($feed_element.clone());
        $('.feed-elements').sortable();
    }

    function remove($feed_element) {
        var $feed= $feed_element.closest('.feed');
        $feed_element.remove();
        if (!$feed.find('.feed-element').length) {
            $feed.find('.empty-results').show();
        }
    }

    function get_region_feed() {
        var region = $('.feed-region-switcher :checked').val();
        return $('.feed[data-region="' + region + '"]');
    }

    return function(builder) {
        builder.z('title', gettext('Feed Builder'));
        builder.z('type', 'builder');
        builder.start('feed_builder.html', {
            is_builder: true  // To flip some stuff in the included manage_listing.html.
        }).done(function() {
            modified_regions = ['restofworld'];
        });
    };
});
