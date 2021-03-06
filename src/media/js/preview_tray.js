/* A Transonic-specific preview tray that selects even when a single image
   and allows passing in an initial selected image. */
define('preview_tray',
    ['flipsnap', 'core/log', 'core/models', 'templates', 'core/capabilities', 'shothandles', 'underscore', 'core/z'],
    function(Flipsnap, log, models, nunjucks, caps, handles, _, z) {

    var logger = log('previews');

    // Magic numbers!
    var THUMB_WIDTH = 150;
    var THUMB_PADDED = 165;

    var slider_pool = [];

    z.page.on('click', '.dot', function() {
        var $this = $(this);
        $this.closest('.preview-tray')[0].slider.moveToPoint($this.index());
        z.page.trigger('refresh_preview');
    });

    var populateTray = function(point) {
        var $tray = $(this);
        if ($tray.hasClass('init')) {
            return;
        }

        var numPreviews = $tray.find('li').length;
        var $content = $tray.find('.content');

        var width = numPreviews * THUMB_PADDED - 15;

        $content.css({
            width: width + 'px',
            margin: '0 ' + ($tray.width() - THUMB_WIDTH) / 2 + 'px'
        });

        $tray.addClass('init');
        var slider = Flipsnap(
            $tray.find('.content')[0],
            {distance: THUMB_PADDED}
        );
        this.slider = slider;
        var $pointer = $tray.find('.dots .dot');

        slider.element.addEventListener('fsmoveend', setActiveDot, false);

        slider.moveToPoint(point || 0);

        slider_pool.push(slider);

        function setActiveDot() {
            $pointer.filter('.current').removeClass('current');
            $pointer.eq(slider.currentPoint).addClass('current');
            $tray.find('li').removeClass('selected')
                            .eq(slider.currentPoint).addClass('selected');
            z.page.trigger('refresh_preview');
        }
        setActiveDot();

        handles.attachHandles(slider, $tray.find('.slider'));
    };

    // Reinitialize Flipsnap positions on resize.
    z.doc.on('saferesize.preview-tray', function() {
        $('.preview-tray').each(function() {
            var $tray = $(this);
            $tray.find('.content').css('margin', '0 ' + ($tray.width() - THUMB_WIDTH) / 2 + 'px');
        });
        for (var i = 0; i < slider_pool.length; i++) {
            slider_pool[i].refresh();
        }
    });

    // We're leaving the page, so destroy Flipsnap.
    z.win.on('unloading.preview-tray', function() {
        for (var i = 0; i < slider_pool.length; i++) {
            slider_pool[i].destroy();
        }
        slider_pool = [];
    });

    z.page.on('dragstart dragover', function(e) {
        e.preventDefault();
    }).on('populatetray', function() {
        $('.preview-tray').each(populateTray);
    });

    return {
        populateTray: populateTray
    };
});
