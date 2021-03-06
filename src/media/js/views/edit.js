define('views/edit',
    ['apps_widget', 'feed_previews', 'fields_transonic', 'core/format', 'forms_transonic', 'jquery', 'jquery.fakefilefield', 'core/l10n', 'core/log', 'core/notification', 'preview_tray', 'core/requests', 'templates', 'core/urls', 'core/utils', 'utils_local', 'core/z'],
    function(apps_widget, feed_previews, fields_transonic, format, forms_transonic, $, fakefilefield, l10n, log, notification, preview_tray, requests, nunjucks, urls, utils, utils_local, z) {
    'use strict';
    var gettext = l10n.gettext;

    // L10n: These are messages regarding the published state of operator shelves.
    var pubstrings = {
        btn_pub: gettext('Publish'),
        btn_unpub: gettext('Unpublish'),
        action_pub: gettext('Publishing&hellip;'),
        action_unpub: gettext('Unpublishing&hellip;'),
        success_pub: gettext('Operator shelf published'),
        success_unpub: gettext('Operator shelf unpublished'),
    };

    function update($btn, $form, form_updater, success_msg) {
        form_updater($form, $form.data('slug')).done(function(feed_element) {
            notification.notification({message: success_msg});
            resetButton($btn);
        }).fail(function(error) {
            utils_local.handle_error(error);
            resetButton($btn);
        });
    }

    z.body.on('click', '.transonic-form.edit button.submit', utils._pd(function(e) {
        var $this = $(this);
        var $form = $this.closest('form');
        $this.html(gettext('Updating...')).attr('disabled', true);
        $form.find('.form-errors').empty();

        if ($form.data('type') == 'apps') {
            update($this, $form, forms_transonic.feed_app,
                   gettext('Featured app successfully updated'));
        } else if ($form.data('type') == 'collections') {
            update($this, $form, forms_transonic.collection,
                   gettext('Collection successfully updated'));
        } else if ($form.data('type') == 'brands') {
            update($this, $form, forms_transonic.brand,
                   gettext('Editorial brand successfully updated'));
        } else if ($form.data('type') == 'shelves') {
            update($this, $form, forms_transonic.shelf,
                   gettext('Operator shelf successfully updated'));
        }
    }))
    .on('click', '.transonic-form.edit button.publish', utils._pd(function() {
        var $this = $(this);
        var $form = $this.closest('form');
        var is_published = $this.data('is-published');

        // Disable button during request.
        $this.html(is_published ? pubstrings.action_unpub : pubstrings.action_pub)
             .prop('disabled', true);

        if (!is_published) {
            // Publish shelf.
            forms_transonic.publish_shelf($form, $form.data('slug')).done(function() {
                notification.notification({message: pubstrings.success_pub});
                resetButton($this, pubstrings.btn_unpub);
                $this.attr('data-is-published', true);
                $('.publish-toggle').toggleClass('hidden');
            }).fail(function(error) {
                utils_local.handle_error(error);
                resetButton($this, pubstrings.btn_pub);
            });
        } else {
            // Unpublish shelf.
            forms_transonic.unpublish_shelf($form, $form.data('slug')).done(function() {
                notification.notification({message: pubstrings.success_unpub});
                resetButton($this, pubstrings.btn_pub);
                $this.attr('data-is-published', false);
                $('.publish-toggle').toggleClass('hidden');
            }).fail(function(error) {
                utils_local.handle_error(error);
                resetButton($this, pubstrings.btn_unpub);
            });
        }
    }));

    function resetButton($btn, text) {
        $btn.text(text || gettext('Update')).prop('disabled', false);
    }

    return function(builder, args) {
        var feedType = args[0];
        var slug = args[1];

        var title;
        var endpoint;
        if (feedType == 'apps') {
            title = format.format(gettext('Editing Featured App: {0}'), slug);
            endpoint = urls.api.base.url('feed-app', [slug]);
        } else if (feedType == 'collections') {
            title = format.format(gettext('Editing Collection: {0}'), slug);
            endpoint = urls.api.base.url('collection', [slug]);
        } else if (feedType == 'brands') {
            title = format.format(gettext('Editing Editorial Brand: {0}'), slug);
            endpoint = urls.api.base.url('feed-brand', [slug]);
        } else if (feedType == 'shelves') {
            title = format.format(gettext('Editing Operator Shelf: {0}'), slug);
            endpoint = urls.api.base.url('feed-shelf', [slug]);
        }

        builder.z('title', title);
        builder.z('type', 'edit detail ' + feedType);

        requests.get(endpoint, true).done(function(obj) {
            builder.start('create/' + feedType + '.html', {
                'feed_type': feedType,  // 'apps', 'collections', or 'editorial'.
                'obj': obj,
                'pubstrings': pubstrings,
                'slug': slug,
                'title': title,
            }).done(function() {
                var i;
                $('.fileinput').fakeFileField();
                fields_transonic.highlight_localized();

                if (feedType == 'apps') {
                    // App widget.
                    apps_widget.set(obj.app);

                    // Calculate which screenshot to initially select.
                    var preview_index = 0;
                    for (i = 0; i < obj.app.previews.length; i++) {
                        if (obj.app.previews[i].id === obj.preview.id) {
                            preview_index = i;
                        }
                    }
                    $('.screenshots').html(nunjucks.env.render('preview_tray.html', {app: obj.app}));
                    preview_tray.populateTray.call($('.preview-tray')[0], preview_index);
                } else if (['collections', 'brands', 'shelves'].indexOf(feedType) !== -1) {
                    // App widget.
                    var group = obj.apps.length && obj.apps[0].group;
                    if (group) {
                        apps_widget.add_group(obj.apps[0].group);
                    }
                    for (i = 0; i < obj.apps.length; i++) {
                        if (JSON.stringify(obj.apps[i].group) != JSON.stringify(group)) {
                            // If the current app's group is under a different group
                            // than the previous one, that must mean we need to
                            // render a new group.
                            apps_widget.add_group(obj.apps[i].group);
                            group = obj.apps[i].group;
                        }
                        apps_widget.append(obj.apps[i]);
                    }
                }
                feed_previews.refresh();
                utils_local.initCharCounter();
            });
        });
    };
});
