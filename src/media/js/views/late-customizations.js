define('views/late-customizations',
    ['apps_widget', 'core/cache', 'core/defer', 'core/l10n', 'core/requests',
     'core/urls', 'core/z'],
    function(apps_widget, cache, defer, l10n, requests,
             urls, z) {
    'use strict';

    var gettext = l10n.gettext;

    function getFormData() {
        var $form = $('form.late-customizations');
        return {
            carrier: $form.find('[name="carrier"]').val(),
            region: $form.find('[name="region"]').val(),
        };
    }

    function clearForm($form) {
        $form.removeClass('late-customizations--manage');
        $form.find('select').removeAttr('disabled');
        $form.find('.manage-late-customizations').empty();
    }

    function manageForm($form) {
        var data = getFormData();
        cache.flush();
        requests.get(urls.api.url('late-customizations', [], data))
                .then(function(response) {
            var template = document.getElementById(
                'manage-late-customizations-template');
            var manageApps = document.importNode(template.content, true);
            $form.addClass('late-customizations--manage');
            $form.find('select').attr('disabled', 'disabled');
            $form.find('.manage-late-customizations').append(manageApps);
            response.objects.forEach(function(app) {
                apps_widget.append(app, {app: app});
            });
        }, function() {
            alert('something went wrong loading the data');
        });
    }

    function addAppToSet(app) {
        var data = getFormData();
        data.app = app.id;
        data.type = 'webapp';
        requests.post(urls.api.url('late-customizations'), data)
                .then(function(app) {
            apps_widget.append(app, {app: app});
        }, function() {
            alert("Error adding app");
        });
    }

    function removeAppFromSet(app) {
        var data = getFormData();
        requests
            .del(urls.api.url('late-customization',
                              [app.latecustomization_id]))
            .then(function() {
                console.log('Deleted app from set');
            }, function() {
                alert('Error removing app from set');
            });
    }

    z.page.on('click', '[name="change"]', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $form = $(this).closest('form');
        clearForm($form);
    }).on('submit', '.late-customizations', function(e) {
        e.preventDefault();
        manageForm($(this));
    }).on('app-selected', function(e, app) {
        addAppToSet(app);
    }).on('app-deleted', function(e, data) {
        removeAppFromSet(data.data.app);
    });

    return function(builder, args) {
        var title = gettext('Late Customizations');

        builder.z('title', title);
        builder.z('type', 'create detail customizations');
        builder.start('late-customizations.html', {
            'title': title,
        });
    };
});
