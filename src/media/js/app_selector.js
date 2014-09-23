define('app_selector',
    ['jquery', 'format', 'l10n', 'log', 'requests', 'settings', 'templates', 'underscore', 'urls', 'utils', 'z'],
    function($, format, l10n, log, requests, settings, nunjucks, _, urls, utils, z) {
    'use strict';

    var gettext = l10n.gettext;
    var results_map = {};

    z.page.on('keypress input', '.app-selector input', _.debounce(function() {
        var $app_selector = $('.app-selector');
        $app_selector.find('.paginator').attr('data-offset', 0);
        if (this.value.length > 2) {
            $('.loading').show();
            $app_selector.addClass('focused');
            search_handler(this.value, 0);
        } else {
            $app_selector.removeClass('focused');
            $('.results').hide();
        }
    }, 250))

    .on('click', '.app-selector .paginator a:not(.disabled)', function() {
        var $this = $(this);
        var $paginator = $this.closest('.paginator');
        $('.results').hide();
        $('.loading').show();
        var offset = parseInt($paginator.data('offset') || 0, 10);
        offset = $this.hasClass('prev') ? (offset - 5) : (offset + 5);
        search_handler($('.app-selector input').val(), offset);
        $paginator.data('offset', offset);
    })

    .on('click', '.app-selector .result', function(evt) {
        evt.preventDefault();  // To prevent click-off to app detail page.
        var $app_selector = $('.app-selector');
        var $this = $(this);
        $app_selector.find('input[name="app"]').val($this.data('id'));
        // Trigger with ID.
        $('.results').hide();
        $app_selector.removeClass('focused');
        $('#app-selector').val('');
        if (z.body.is('[data-page-type~="apps"]')) {
            $('#slug').val(utils.slugify($this.find('.name a').text()));
        }
        z.page.trigger('app-selected', [results_map[$this.attr('data-id')]]);
    });

    function get_disabled_regions(app) {
        // Given app, do set difference between all regions and app's regions
        // to get the disabled regions.
        return Object.keys(settings.REGION_CHOICES_SLUG).filter(function(slug) {
            return app.regions
                      .map(function(region) { return region.slug; })
                      .indexOf(slug) < 0;
        });
    }

    var render_result = function(app, with_actions) {
        return nunjucks.env.render('app_selector/app_selector_result.html', {
            author: app.author,
            detail_url: settings.api_url + '/app/' + app.slug,
            device_types: app.device_types,
            disabled_regions: get_disabled_regions(app),
            icon: app.icons['32'],
            id: app.id,
            name: utils.translate(app.name),
            price: app.payment_required ? app.price_locale : gettext('Free'),
            rating: app.ratings.average,
            with_actions: with_actions
        });
    };

    function search_handler(q, offset) {
        var $paginator = $('.app-selector .paginator');
        var $results = $('.results');

        // Search.
        var search_url = urls.api.params(
            'search', {'q': q, 'limit': 5, 'offset': offset});
        requests.get(search_url).done(function(data) {
            $results.find('.result').remove();
            $results.show();

            // Append results.
            if (data.objects.length === 0) {
                var no_results = nunjucks.env.render(
                    'app_selector/app_selector_no_results.html', {});
                $paginator.hide();
                $results.append(no_results);
            } else {
                $paginator.show();
                for (var i = 0; i < data.objects.length; i++) {
                    $results.append(render_result(data.objects[i]));
                    results_map[data.objects[i].id] = data.objects[i];
                }
            }

            var $desc = $paginator.find('.desc');
            var $next = $paginator.find('.next');
            var $prev = $paginator.find('.prev');
            var meta = data.meta;

            if (!meta.previous && !meta.next) {
                $paginator.hide();
            } else {
                $paginator.show();

                if (meta.previous) {
                    $prev.removeClass('disabled');
                } else {
                    $prev.addClass('disabled');
                }

                if (meta.next) {
                    $next.removeClass('disabled');
                } else {
                    $next.addClass('disabled');
                }

                // Calculate app range for last page (bug 1055157).
                var upper_limit = meta.offset + meta.limit;
                if (upper_limit > meta.total_count) {
                    upper_limit = meta.total_count;
                }

                // L10n: {0} refers to the position of the first app on the page,
                // {1} refers to the position of the last app on the page,
                // and {2} refers to the total number of apps across all pages.
                var desc = format.format(gettext('Apps {0}-{1} of {2}.'),
                    meta.offset + 1, upper_limit, meta.total_count);
                $desc.text(desc);
            }

            $('.loading').hide();
        });
    }

    return {
        render_result: render_result
    };
});
