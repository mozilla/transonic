define('apps_widget',
    ['app_selector', 'jquery', 'jquery-sortable', 'core/nunjucks', 'core/requests', 'core/settings', 'underscore', 'core/utils', 'core/urls', 'core/z'],
    function(app_select, $, sortable, nunjucks, requests, settings, _, utils, urls, z) {
    'use strict';

    function get_app_ids() {
        var ids = [];
        $('.apps-widget .result').map(function() {
            ids.push(parseInt(this.getAttribute('data-id'), 10));
        });
        return ids;
    }

    z.page.on('click', '.apps-widget .actions .delete', function() {
        /* Remove app. */
        var $this = $(this);
        var $result = $this.closest('.result');
        var id = $result.data('id');
        $result.trigger('app-deleted', $result.data());
        $result.remove();
        z.page.trigger('refresh_preview');
    })

    .on('click', '[data-page-type~="create"] .apps-widget-single .delete', function() {
        set(null);
        $('.app-selector').show().find('input[name="app"]').val('');
        $('.apps-widget-single').hide();
        $('#app-selector').trigger('focus');
        $('#slug').val('');
        z.page.trigger('refresh_preview');
    })

    .on('click', '.apps-widget .delete-app-group', function() {
        /* Remove app group. */
        $(this).closest('.result').remove();
        z.page.trigger('refresh_preview');
    })

    .on('click', '.apps-widget .actions .reorder', function() {
        /* Reorder elements. */
        var $this = $(this);
        var $app = $this.closest('.result');
        var is_prev = $this.hasClass('prev');
        var $items = $this.closest('.apps-widget').find('.result:not(.hidden)');  // Hidden for the localized fields.
        var pos = $items.index($app);

        if ((is_prev && pos === 0) || (!is_prev && pos == $items.length - 1)) {
            // Don't swap if trying to move the first element up or last element down.
            return;
        }

        var swap_pos = is_prev ? pos - 1 : pos + 1;
        var $swap_with = $items.filter(':not(.hidden)').eq(swap_pos);

        if (is_prev) {
            $app.clone().insertBefore($swap_with);
        } else {
            $app.clone().insertAfter($swap_with);
        }
        $app.remove();
        z.page.trigger('refresh_preview');
    });

    var set = function(app) {
        var $app_selector = $('.app-selector');
        var $apps_widget = $('.apps-widget-single');
        var $input = $app_selector.find('input[name="app"]');

        if (!app) {
            $input.val('').data('app', null);
            $app_selector.show();
            $apps_widget.hide();
            return;
        }

        /* Given an app object, render it in the widget. */
        if (_.isObject(app.name)) {
            // Choose an app name translation.
            app.name = app.name['en-US'] || app.name[Object.keys(app.name)[0]];
        }

        // Set placeholder and hide results list.
        var fake_input = nunjucks.env.render('apps_widget/apps_widget_single.html', {
            icon: app.icons['48'],
            name: utils.translate(app.name)
        });
        $apps_widget.replaceWith(fake_input);

        $app_selector.hide();
        $apps_widget.show();

        $app_selector.find('#app-selector').val('').text();
        $app_selector.find('.result').remove();
        $input.val(app.id).data('app', app);
        z.page.trigger('refresh_preview');
    };

    var append = function(app, data) {
        if (get_app_ids().indexOf(parseInt(app.id, 10)) !== -1) {
            return;
        }

        // Render it in the widget.
        var $apps_widget = $('.apps-widget');
        var $row = $(app_select.render_result(app, true));
        if (data) {
            $row.data('data', data);
        }
        $apps_widget.find('.apps').append($row);
        $apps_widget.find('.placeholder-text').hide();
        $apps_widget.find('.apps').sortable({
            onDrop: function($item) {
                $item.removeClass('dragged').removeAttr('style');
                z.body.removeClass('dragging');
                z.page.trigger('refresh_preview');
            }
        });
        z.page.trigger('refresh_preview');
    };

    var add_group = function(app_group) {
        /* Add a localizable text field as the header of an app group. */
        var $apps_widget = $('.apps-widget');
        var new_id = 'app-group-' + $('.app-group').length;
        $apps_widget.find('.apps').append(nunjucks.env.render('fields/app_group.html', {
            app_group: app_group || {},
            app_group_id: new_id
        }));
        $apps_widget.find('.placeholder-text').hide();
        $('[name="' + new_id + '-' + $('#locale-switcher').val() + '"]').trigger('focus');
        z.page.trigger('refresh_preview');
    };

    return {
        add_group: add_group,
        append: append,
        get_app_ids: get_app_ids,
        set: set,
    };
});
