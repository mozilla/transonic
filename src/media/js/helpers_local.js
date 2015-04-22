define('helpers_local',
    ['carriers', 'collection_colors', 'feed', 'core/nunjucks', 'regions',
     'underscore', 'core/urls', 'utils_local', 'core/z'],
    function(carriers, collection_colors, feed, nunjucks, regions, _, urls,
             utils_local, z) {
    var filters = nunjucks.require('filters');
    var globals = nunjucks.require('globals');

    globals.COLLECTION_COLORS = utils_local.items(
        collection_colors.COLLECTION_COLORS);
    globals.feed = feed;
    globals.REGIONS = regions.REGION_CHOICES_SLUG;
    globals.REGION_CHOICES = regionTransform(regions.REGION_CHOICES_SLUG);
    globals.CARRIERS = carriers.CARRIER_SLUGS;

    function unslug(str) {
        // Change underscores to spaces and text-transform uppercase.
        return str.replace(/_/g, ' ')
                  .replace(/(^| )(\w)/g, function(x) {
                      return x.toUpperCase();
                  });
    }

    function indexOf(arr, val) {
        return arr.indexOf(val);
    }

    function regionTransform(regions) {
        // Turn regions dict into sorted list of tuples.
        return _.sortBy(utils_local.items(regions), function(region) {
            return region[1];
        });
    }

    function keys(obj) {
        return Object.keys(obj);
    }

    // Functions provided in the default context.
    var helpers = {
        keys: keys,
        indexOf: indexOf,
        api_base: urls.api.base.url,
    };

    var filters_map = {
        json: JSON.stringify,
        items: utils_local.items,
        unslug: unslug
    };

    // Put the helpers into the nunjucks global.
    for (var i in helpers) {
        if (helpers.hasOwnProperty(i)) {
            globals[i] = helpers[i];
        }
    }

    for (var filtersProp in filters_map) {
        if (filters_map.hasOwnProperty(filtersProp)) {
            if (nunjucks.env) {
                nunjucks.env.addFilter(filtersProp, filters_map[filtersProp]);
            }
            filters[filtersProp] = filters_map[filtersProp];
        }
    }

    return helpers;
});
