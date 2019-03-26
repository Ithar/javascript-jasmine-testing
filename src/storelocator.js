var STORE_LOCATOR = {
    VERSION: 'v2.0.1',
    api : {
        "endpoint" : "/api",
        "version" : "/v3"
    },
    config : {
        "env" : undefined,
        "brand" : undefined,
        "build" : undefined
    },
    host : {
        "DEV" : "http://127.0.0.1:8080",
        "UI" : "https://storelocatorbackend-dev.spika.com",
        "QA" : "https://storelocatorbackend-dev.spika.com",
        "STG" : "https://sl-bacardi-com-staging.bacardistaging.com",
        "PROD" : "https://bacardi.com/"
    },
    init : function() {

        if (this.checkConfig()) {
            AJAX_SERVICE.setBrandConfigAjax();
        } else {
            MESSAGES_SERVICE.showSetUpError();
        }
    },
    checkConfig : function() {

        var storeLocator = document.getElementById('sl-store-locator');

        if (storeLocator === undefined) {
            console.log('ERROR: SL-LOAD-a188e01: store locator element cannot be found in document.');
            return false;
        }

        var env = storeLocator.getAttribute('data-env');
        var brand = storeLocator.getAttribute('data-brand');
        var build = storeLocator.getAttribute('data-build');

        if (env === undefined || brand === undefined) {
            console.log('ERROR: SL-LOAD-60b7cfb: store locator element MUST have a data-brand and data-host.');
            return false;
        }

        this.config.env = env;
        this.config.brand = brand;
        this.config.build = (build === undefined) ? 'static' : build;

        console.log('INFO: SL-BRAND-CONFIG-fd9c929: [env='+env+', brand='+brand+', build='+build+']');
        return true;
    },
    boot : function() {
        this.addEventListeners();
        EXPERIENCE_SERVICE.init();
        MAPS_SERVICE.init();
        GEOLOCATION_SERVICE.init();
        PLACES_SERVICE.init();
        MESSAGES_SERVICE.init();
        AJAX_SERVICE.getProductsAjax();
        MESSAGES_SERVICE.setInfoWindowMsg(MESSAGES_SERVICE.getMessages().info.landing);
    },
    addEventListeners : function () {

        console.log('addEventListeners');

        var barDiv = document.getElementById('slBarContainer');
        var storeDiv = document.getElementById('slStoreContainer');

        var showAll = $('#slProductFilterToggleAll');

        // Search Form
        $('#slSearchForm').submit(function (e) {
            e.preventDefault();
        });

        $('#slSearchText').keypress(function (e) {
            if (e.which === 13) {
                $(this).blur();
                SEARCH_SERVICE.searchByAddress();
            }
        });

        // Tabs - Bars/Stores/Experiences
        var tabLinks = $('.slTabLink');
        tabLinks.click(function () {

            if ($(this).hasClass('active')) {
                return;
            }

            var tabId = $(this).attr('id');

            console.log('Tab click:' + tabId);

            tabLinks.removeClass('active');
            $(this).addClass('active');

            $('#slContainer').removeClass('slDetailedAddressItem');

            var loadedResults = RESULTS_SERVICE.getLoadedResults();

            if (NAVIGATION_SERVICE.isExperienceActive()) {

                tabLinks.removeAttr("disabled");
                EXPERIENCE_SERVICE.initMap();
                FILTER_SERVICE.resetFilters();
                COMMON_SERVICE.containerChange('experiences');
                COMMON_SERVICE.scrollToTop();

            } else if (!RESULTS_SERVICE.hasResults(loadedResults)) {

                var msg = MESSAGES_SERVICE.getMessages().info.landing;
                SEARCH_SERVICE.processEmptyResults(msg);
                COMMON_SERVICE.containerChange('info');

            } else if (NAVIGATION_SERVICE.isBarTabActive()) {

                barDiv.style.display = 'block';
                storeDiv.style.display = 'none';

                if (loadedResults.bars.length === 0) {
                    LOADING_SERVICE.activateLoadMoreBtn(false);
                } else {
                    MESSAGES_SERVICE.showSearchInProgress();
                    ADDRESS_SERVICE.amalgamateAndProcessAddresses(loadedResults);
                    COMMON_SERVICE.containerChange('map');
                }

            } else if (NAVIGATION_SERVICE.isStoreTabActive()) {

                barDiv.style.display = 'none';
                storeDiv.style.display = 'block';

                if (loadedResults.stores.length === 0) {
                    LOADING_SERVICE.activateLoadMoreBtn(false);
                } else {
                    MESSAGES_SERVICE.showSearchInProgress();
                    ADDRESS_SERVICE.amalgamateAndProcessAddresses(loadedResults);
                    COMMON_SERVICE.containerChange('map');
                }
            }
        });

        // Show List/Map
        $('#slShowList').on('click', function () {
            $('.slAddressItem').removeClass('active');
            COMMON_SERVICE.containerChange('list');
            $(this).addClass('active');
            $('#slShowMap').removeClass('active');
        });

        $('#slShowMap').on('click', function () {
            COMMON_SERVICE.containerChange('map');
            $('#slShowList').removeClass('active');
        });

        // Product Filter - Toggle all
        showAll.on('click', function () {

            var showAllBtn = $(this);

            var isActive = showAllBtn.hasClass('active');

            console.log('toggle all:' + isActive);

            if (isActive) {
                showAllBtn.removeClass('active');
                PRODUCT_FILTER_SERVICE.productsDisabled();
            } else {
                PRODUCT_FILTER_SERVICE.productsEnabled();
                showAllBtn.addClass('active');
                $('.slProductCheckbox').addClass('active');
            }

            PRODUCT_FILTER_SERVICE.populateProductFilterResults();
        });

        // Product Filter - Apply
        $(document).on('click', '#slProductFilterApply', function () {
            console.log('Product filter apply');
            COMMON_SERVICE.containerChange('map');
        });

        // Product Filter - Item Row
        $(document).on('click', '.slProductCheckbox', function (e) {
            e.stopPropagation();
            console.log('Product filter item');
            var filterBtn = $(this);

            if (filterBtn.hasClass('active')) {
                filterBtn.removeClass('active');
            } else {
                filterBtn.addClass('active');
            }

            var totalCount = $('.slProductCheckbox').length;
            var activeCount = $('.slProductCheckbox.active').length;

            if (totalCount === activeCount) {
                showAll.addClass('active');
            } else {
                showAll.removeClass('active');
            }

            if (activeCount === 0) {
                PRODUCT_FILTER_SERVICE.productsDisabled();
            } else {
                PRODUCT_FILTER_SERVICE.productsEnabled();
            }

            PRODUCT_FILTER_SERVICE.populateProductFilterResults();
        });

        // Geolocation
        $('#slUserLocationBtn').on('click', function () {
            GEOLOCATION_SERVICE.geocodeUserLocation();
        });

        // Direction
        $(document).on('click', '.slDirectionLink', function (e) {
            e.stopPropagation();

            var id = $(this).data('id');
            DIRECTION_SERVICE.openExternalMap(id);

            var placeId = $('#slAddressItem-'+id).attr('data-place-id');
            if (placeId === undefined || placeId === '') {
                placeId = ANALYTICS_SERVICE.placeDatalayerDefaultPlaceId;
            }

            ANALYTICS_SERVICE.pushDirectionClickEvent(ANALYTICS_SERVICE.createPlaceDataLayer(placeId));
        });

        // Telephone
        $(document).on('click', '.slTelephone', function () {

            var id = $(this).data('id');
            var placeId = $('#slAddressItem-'+id).attr('data-place-id');
            if (placeId !== undefined) {
                ANALYTICS_SERVICE.pushTelephoneClickEvent(ANALYTICS_SERVICE.createPlaceDataLayer(placeId));
            }
        });

        // Address Item Click
        $(document).on('click', '.slAddressItem', function () {

            if (MAPS_SERVICE.mapInfoWindow !== undefined) {
                MAPS_SERVICE.mapInfoWindow.close();
            }

            ADDRESS_SERVICE.showAddressDetails($(this));
        });

        // Address Item opening times
        $(document).on('click', '#openingTimesControl', function () {
            var id = $(this).attr('data-id');
            $('#openingTimes-' + id).toggleClass('sl-opening-times-list--show-all');
            $(this).parents('.sl-opening-times-container').toggleClass('sl-opening-times-container--show-all');
        });

        // Address Details Back
        $(document).on('click', '#slAddressDetailsBack', function (e) {
            e.stopPropagation();
            $('#slContainer').removeClass('slDetailedAddressItem');
            var id = $(this).attr('data-id');
            $('#slAddressItem-' + id).removeClass('active');

            if (COMMON_SERVICE.isMobile()) {

                if ($('#slShowList').hasClass('active')) {
                    COMMON_SERVICE.containerChange('list');
                }
            }
        });

        // Filters
        $('.slFilterOption').on('click', function () {

            if ($('#slFilterContainer').hasClass('sl-filter--disabled')) {
                return;
            }

            var filterType = $(this).attr('data-filter');
            var isActive = $(this).hasClass('active');
            var filters = $('.slFilterOption');

            console.log('filterType:' + filterType + ' active:' + isActive);

            filters.removeClass('active');
            $(this).addClass('active');

            if (filterType === 'PRODUCT') {
                PRODUCT_FILTER_SERVICE.activateProductFilter($(this), isActive);
                return;
            }

            if (filterType === 'RESET') {
                filters.removeClass('active');
            } else if (filterType === 'OPEN' && isActive) {
                filters.removeClass('active');
                filterType = 'RESET';
            }

            if (!COMMON_SERVICE.isMobile()) {
                COMMON_SERVICE.containerChange('map');
            }

            NAVIGATION_SERVICE.enableTabs();
            var filteredResults = FILTER_SERVICE.filterLocations($(this), filterType);
            SEARCH_SERVICE.processSearch(filteredResults);
        });

        // Load More
        $('#loadMore').on('click', function () {
            LOADING_SERVICE.loadMoreData();
        });
    }
};
var AJAX_SERVICE =  {

    setBrandConfigAjax : function() {

        var endpoint = AJAX_SERVICE.getEndpoint();
        var brandName = BRAND_SERVICE.getBrandName();
        var url = endpoint+'/brand/'+brandName;
        console.log('Ajax: '+url);

        $.getJSON(url)
        .done(function(data) {
            console.log('setBrandConfigAjax() success');
            BRAND_SERVICE.saveBrandConfig(data);
            AJAX_SERVICE.loadTemplate();
        })
        .fail(function() {
            console.log('ERROR: SL-BRAND-CONFIG-aba0605: Failed to get brand config at:'+url);
            MESSAGES_SERVICE.showSetUpError();
        });
    },
    loadTemplate : function() {

        var buildType = STORE_LOCATOR.config.build;

        if (buildType === 'embedded') {
            AJAX_SERVICE.loadTemplateEmbedded();
        } else if(buildType === 'dynamic') {
            AJAX_SERVICE.loadTemplateDynamic();
        } else if (buildType === 'static') {
            AJAX_SERVICE.loadTemplateStatic();
        }
    },
    loadTemplateEmbedded : function() {
        console.log('loadTemplateEmbedded()');
        document.getElementById('sl-store-locator').innerHTML = HTML_TEMPLATES.main_template;
        boot();
    },
    loadTemplateDynamic : function() {

        var url = AJAX_SERVICE.getTemplateURL();
        console.log('Ajax: '+url);

        $.get(url)
        .done(function(html) {
            console.log('loadTemplateDynamic()');
            document.getElementById('sl-store-locator').innerHTML = html;
            boot();
        })
        .fail(function() {
            console.log('ERROR: SL-TEMPLATE-c17051e: Failed to load template at:'+url);
            MESSAGES_SERVICE.showTemplateLoadError();
        });
    },
    loadTemplateStatic : function() {
        console.log('loadTemplateStatic()');
        STORE_LOCATOR.boot();
    },
    getProductsAjax: function() {

        var endpoint = AJAX_SERVICE.getEndpoint();
        var brandId = BRAND_SERVICE.getBrandId();
        var url = endpoint+'/brand/'+brandId+'/products/';
        console.log('Ajax: '+url);

        $.getJSON(url)
        .done(function(data) {
            console.log('getProductsAjax() success');
            PRODUCT_FILTER_SERVICE.init(data);
        })
        .fail(function() {
            console.log('ERROR: SL-PRODUCT-bc7b5e1: Failed to get products via url:'+url);
        });
    },
    searchLocationAjax : function(location, searchDatalayer) {

        if (location !== undefined) {

            var endpoint = AJAX_SERVICE.getEndpoint();
            var brandId = BRAND_SERVICE.getBrandId();
            var lat = location.lat;
            var lng = location.lng;
            var url = endpoint+'/search/location/?brandId='+brandId+'&lat='+lat+'&lng='+lng;
            MESSAGES_SERVICE.showSearchInProgress();
            RESULTS_SERVICE.clearResults();
            console.log('Ajax: '+url);

            $.getJSON(url)
            .done(function(data) {
                console.log('searchLocationAjax() success');
                var prunedData = RESULTS_SERVICE.prunedSearchResults(data);
                SEARCH_SERVICE.processNewSearch(prunedData);
                RESULTS_SERVICE.saveLoadedResults(prunedData);
                RESULTS_SERVICE.saveFilteredResults(prunedData);
                RESULTS_SERVICE.saveStoredResults(data);

                searchDatalayer.search_status = ANALYTICS_SERVICE.getSearchEventStatus(RESULTS_SERVICE.getStoredResults());
                ANALYTICS_SERVICE.pushSearchEvent(searchDatalayer);
            })
            .fail(function() {
                console.log('ERROR: SL-SEARCH-LOCATION-4ca01f3: Failed to perform location search:'+url);
                MESSAGES_SERVICE.hideSearchInProgress();
                COMMON_SERVICE.showNoStoreView();
            });
        }
    },
    getTemplateURL : function() {

        if (STORE_LOCATOR.config.env === 'DEV' || STORE_LOCATOR.config.env === 'UI') {
            return 'http://localhost:3000/templates/'+STORE_LOCATOR.config.brand+'.html';
        }

        return BRAND_SERVICE.getBrandConfig().template;
    },
    getEndpoint : function () {

        var host = AJAX_SERVICE.getHost(STORE_LOCATOR.config.env);
        var api = STORE_LOCATOR.api.endpoint;
        var version = STORE_LOCATOR.api.version;

        return host+version+api;
    },
    getHost : function(env) {

        switch(env) {
            case "DEV":
                return STORE_LOCATOR.host.DEV;
            case "UI":
                return STORE_LOCATOR.host.UI;
            case "QA":
                return STORE_LOCATOR.host.QA;
            case "STG":
                return STORE_LOCATOR.host.STG;
            default:
                return STORE_LOCATOR.host.PROD;
        }
    }
};
// Service that deals with loading more data.
var LOADING_SERVICE = {

    loadLimit : 5,
    loadMoreData : function() {

        FILTER_SERVICE.disableFilter();
        MESSAGES_SERVICE.showSearchInProgress();
        LOADING_SERVICE.activateLoadMoreBtn(false);

        var searchResult = RESULTS_SERVICE.getStoredResults();
        var loadedResult = RESULTS_SERVICE.getLoadedResults();
        var limit, count;

        if (NAVIGATION_SERVICE.isBarTabActive()) {

            limit = loadedResult.bars.length + LOADING_SERVICE.loadLimit;
            count = 0;
            $.each(searchResult.bars, function (index, location) {
                if (loadedResult.bars[count] === undefined) {

                    if (count >= limit) {
                        return false;
                    }

                    loadedResult.bars[count] = location;
                }
                count++;
            });
        } else if (NAVIGATION_SERVICE.isStoreTabActive()) {
            limit = loadedResult.stores.length + LOADING_SERVICE.loadLimit;
            count = 0;
            $.each(searchResult.stores, function (index, location) {
                if (loadedResult.stores[count] === undefined) {

                    if (count >= limit) {
                        return false;
                    }

                    loadedResult.stores[count] = location;
                }
                count++;
            });
        }

        console.log('LOAD MORE [bars='+loadedResult.bars.length+', stores='+loadedResult.stores.length+']');
        RESULTS_SERVICE.saveLoadedResults(loadedResult);

        ADDRESS_SERVICE.amalgamateAndProcessAddresses(loadedResult);
    },
    loadMoreBtnVisibilityCheck : function () {

        console.log('loadMoreBtnVisibilityCheck()');

        var storedResults = RESULTS_SERVICE.getStoredResults();
        var loadedResults = RESULTS_SERVICE.getLoadedResults();

        if (NAVIGATION_SERVICE.isBarTabActive()) {

            if (storedResults.bars.length === loadedResults.bars.length) {
                LOADING_SERVICE.activateLoadMoreBtn(false);
            } else {
                LOADING_SERVICE.activateLoadMoreBtn(true);
            }

        } else if (NAVIGATION_SERVICE.isStoreTabActive()) {

            if (storedResults.stores.length === loadedResults.stores.length) {
                LOADING_SERVICE.activateLoadMoreBtn(false);
            } else {
                LOADING_SERVICE.activateLoadMoreBtn(true);
            }
        }
    },
    activateLoadMoreBtn : function(on) {

        var loadMoreBtn = $('#loadMore');
        if (on) {
            loadMoreBtn.addClass('active');
            loadMoreBtn.prop('disabled', false);
        } else {
            loadMoreBtn.removeClass('active');
            loadMoreBtn.prop('disabled', true);
        }
    }

};
var BRAND_SERVICE = {
    brandConfigJSON : undefined,
    getBrandConfig : function() {
        return BRAND_SERVICE.brandConfigJSON;
    },
    saveBrandConfig : function(configJson) {
        BRAND_SERVICE.brandConfigJSON = configJson
    },
    getBrandId : function () {
        return BRAND_SERVICE.getBrandConfig().id;
    },
    getBrandName : function () {
        return STORE_LOCATOR.config.brand;
    },
    getBrandStockImage : function (type) {

        switch (type) {
            case "ICON":
                return 'https://s3-eu-west-1.amazonaws.com/dev.storelocator-front/brands/greggoose/images/stock_icon.jpg';
            case "LARGE":
                return 'https://s3-eu-west-1.amazonaws.com/dev.storelocator-front/brands/greggoose/images/stock_details.jpg';
        }
    },
    getMapStyle : function() {
        return BRAND_SERVICE.getBrandConfig().map.style;
    }
};
var ADDRESS_SERVICE = {

    removalableIds : [],
    amalgamateAndProcessAddresses : function(searchResults) {

        var activeLocations;

        var effectiveTab = NAVIGATION_SERVICE.getEffectiveTab(searchResults);

        if (effectiveTab === 'BARS') {
            activeLocations = searchResults.bars;
        } else if (effectiveTab === 'STORES') {
            activeLocations = searchResults.stores;
        }

        PLACES_SERVICE.amalgamateWithGoogleData(searchResults, activeLocations);
    },
    processAddresses : function(searchResults) {

        console.log('processAddresses() [bars='+searchResults.bars.length+', stores='+searchResults.stores.length+']');

        if (NAVIGATION_SERVICE.isBarTabActive()) {
            ADDRESS_SERVICE.populateAddresses(searchResults.bars, $('#slBarContainer'), 'bars');
        } else if (NAVIGATION_SERVICE.isStoreTabActive()) {
            ADDRESS_SERVICE.populateAddresses(searchResults.stores, $('#slStoreContainer'), 'stores');
        }

    },
    populateAddresses : function(locations, containerDiv, type) {

        console.log('populateAddresses(): '+type);

        ADDRESS_SERVICE.removalableIds = [];

        var addresses = '';
        var count = 1;
        $.each(locations, function (index, location) {

            var addressTemplate = location.place_id === 'UNKNOWN' ? HTML_TEMPLATES.address_item : HTML_TEMPLATES.address_item_google;
            addressTemplate = ADDRESS_SERVICE.populateAddressData(location, addressTemplate, type, index);
            addresses = addresses + addressTemplate;

            if (count === locations.length) {
                containerDiv[0].innerHTML = addresses;
            }

            count++;
        });

        ADDRESS_SERVICE.removalableIds.forEach(function(element) {
            $(element).remove();
        });
    },
    populateAddressData: function(location, addressTemplate, type, index) {

        console.log('populateAddressData():'+location.place_id);

        try {
            addressTemplate = addressTemplate.replace(/PLACEHOLDER_ID/g, location.id)
            .replace('PLACEHOLDER_TYPE', type)
            .replace('PLACEHOLDER_COUNTER', index)
            .replace('PLACEHOLDER_LAT', location.latitude)
            .replace('PLACEHOLDER_LNG', location.longitude)
            .replace(/PLACEHOLDER_NAME/g, location.name)
            .replace('PLACEHOLDER_LINE1', location.address.line1)
            .replace('PLACEHOLDER_CITY', location.address.city)
            .replace('PLACEHOLDER_ZIPCODE', location.address.zipcode)
            .replace('PLACEHOLDER_PHONE', location.address.phone)
            .replace('PLACEHOLDER_ICON', location.icon)
            .replace('PLACEHOLDER_PHOTO_LARGE', location.image);

            if (location.place_id !== 'UNKNOWN') {
                addressTemplate = addressTemplate.replace('GOOGLE_PLACE_ID', location.place_id)
                .replace('GOOGLE_OPEN_NOW', location.place_open_now)
                .replace(/GOOGLE_PRICE_LEVEL/g, location.place_price_level)
                .replace('GOOGLE_RATING_ROUNDED', location.place_rating_rounded)
                .replace(/GOOGLE_RATING/g, location.place_rating)
                .replace('GOOGLE_PHOTO_ICON', location.place_photo_icon)
                .replace('GOOGLE_PHOTO_LARGE', location.place_photo_large)
                .replace('GOOGLE_OPENS_AT', location.place_opens_at)
                .replace('GOOGLE_PLACE_NAME', location.place_name)
                .replace('GOOGLE_REVIEWS_COUNT', PLACES_SERVICE.getReviewsFormatted(location))
                .replace('GOOGLE_WEBSITE', location.place_website)
                .replace('GOOGLE_WEBSITE_NAME', location.place_website_name)
                .replace(/GOOGLE_PHONE/g, location.place_phone)
                .replace('GOOGLE_OPENING_TIME1', location.place_opening_time1)
                .replace('GOOGLE_OPENING_TIME2', location.place_opening_time2)
                .replace('GOOGLE_OPENING_TIME3', location.place_opening_time3)
                .replace('GOOGLE_OPENING_TIME4', location.place_opening_time4)
                .replace('GOOGLE_OPENING_TIME5', location.place_opening_time5)
                .replace('GOOGLE_OPENING_TIME6', location.place_opening_time6)
                .replace('GOOGLE_OPENING_TIME7', location.place_opening_time7);

                if (location.place_opening_time1 === undefined || location.place_opening_time1 === '') {
                    ADDRESS_SERVICE.removalableIds.push('#slOpeningTimes-'+location.id);
                }

                if (location.place_phone === undefined || location.place_phone === '') {
                    ADDRESS_SERVICE.removalableIds.push('#slTelephone-'+location.id);
                }

                if (location.place_website === undefined || location.place_website === '') {
                    ADDRESS_SERVICE.removalableIds.push('#slWebsite-'+location.id);
                }

                if (location.place_opens_at === undefined || location.place_opens_at === '') {
                    ADDRESS_SERVICE.removalableIds.push('#slOpensAt-'+location.id);
                }
            }

        } catch (err) {
            console.log('error:'+err);
        }

        return addressTemplate;
    },
    clearAddresses : function() {
        console.log('clearAddresses()');
        $('#slBarContainer').html('');
        $('#slStoreContainer').html('');
    },
    findAndShowAddressDetails : function(id) {
        var addressItem = $('#slAddressItem-'+id);
        ADDRESS_SERVICE.showAddressDetails(addressItem);
    },
    showAddressDetails : function(addressItem) {

        console.log('showAddressDetails()');

        if (addressItem.hasClass('active')) {
            return;
        }

        $('.slAddressItem').each(function(){
            $(this).removeClass('active');
        });
        addressItem.addClass('active');

        COMMON_SERVICE.containerChange('map');
        COMMON_SERVICE.scrollToTop();
        MAPS_SERVICE.animateMarkerAndShowInfoWindow(addressItem);
        COMMON_SERVICE.selectOpeningTime(addressItem);

        $('#slContainer').addClass('slDetailedAddressItem');
    }
};
var SEARCH_SERVICE = {

    searchByAddress : function() {
        console.log('searchByAddress()');
        COMMON_SERVICE.scrollToTop();
        var address = $('#slSearchText').val();
        if (address !== undefined) {
            $('.slTabLink').removeAttr('disabled');

            var geocoder = GEOLOCATION_SERVICE.geocoder;

            var searchDatalayer = ANALYTICS_SERVICE.searchDatalayer;
            searchDatalayer.search_type = ANALYTICS_SERVICE.searchDatalayerType.MANUAL;

            geocoder.geocode( { 'address': address} , function (results, status) {
                GEOLOCATION_SERVICE.processGeocodeResult(results, status, searchDatalayer)
            });
        }
    },
    searchByGeocode : function(location) {

        COMMON_SERVICE.scrollToTop();

        var searchDatalayer = ANALYTICS_SERVICE.searchDatalayer;
        searchDatalayer.search_type = ANALYTICS_SERVICE.searchDatalayerType.GOE_CODE;

        var geocoder = GEOLOCATION_SERVICE.geocoder;

        geocoder.geocode({'location': location}, function(results, status) {
            GEOLOCATION_SERVICE.processGeocodeResult(results, status, searchDatalayer);
        });
    },
    searchByMapCentre : function() {

        var map = MAPS_SERVICE.map;
        var c = map.getCenter();

        var userLocation = {
            lat: c.lat(),
            lng: c.lng()
        };

        SEARCH_SERVICE.searchByGeocode(userLocation);
    },
    processNewSearch : function(searchResult) {

        console.log('processNewSearch() [bars='+searchResult.bars.length+', stores='+searchResult.stores.length+']');

        MAPS_SERVICE.clearMapMarkers();
        ADDRESS_SERVICE.clearAddresses();
        FILTER_SERVICE.resetFilters();
        NAVIGATION_SERVICE.enableTabs();
        PLACES_SERVICE.delayInterval = 0;

        if (RESULTS_SERVICE.hasResults(searchResult)) {
            NAVIGATION_SERVICE.activateTab(searchResult);
            ADDRESS_SERVICE.amalgamateAndProcessAddresses(searchResult);
            COMMON_SERVICE.containerChange('map');
        } else {
            var msg = MESSAGES_SERVICE.getMessages().info.no_stores;
            COMMON_SERVICE.updateCount(undefined);
            MAPS_SERVICE.resetMapCentre();
            MESSAGES_SERVICE.setInfoWindowMsg(msg);
            COMMON_SERVICE.containerChange('info');
            MESSAGES_SERVICE.hideSearchInProgress();
            FILTER_SERVICE.disableFilter();
        }
    },
    processSearch : function(searchResult) {

        console.log('processSearch [bars='+searchResult.bars.length+', stores='+searchResult.stores.length+']');

        MAPS_SERVICE.clearMapMarkers();
        ADDRESS_SERVICE.clearAddresses();
        LOADING_SERVICE.loadMoreBtnVisibilityCheck();
        COMMON_SERVICE.updateCount(searchResult);

        if (RESULTS_SERVICE.hasResults(searchResult)) {
            ADDRESS_SERVICE.processAddresses(searchResult);
            MAPS_SERVICE.addMarkers(searchResult);
            MAPS_SERVICE.centreMap(searchResult);
        } else {
            console.log('INFO: SL-SEARCH-eb01bc: Processed search with empty data.');
        }
    },
    processEmptyResults : function(msg) {
        COMMON_SERVICE.updateCount(undefined);
        MAPS_SERVICE.resetMapCentre();
        MESSAGES_SERVICE.setInfoWindowMsg(msg);
        COMMON_SERVICE.containerChange('info');
        MAPS_SERVICE.clearMapMarkers();
        FILTER_SERVICE.disableFilter();
        NAVIGATION_SERVICE.disableTabs(['slTabStores', 'slTabBars']);
        RESULTS_SERVICE.clearResults();
    }
};
var RESULTS_SERVICE = {
    storedResults : {"stores": [], "bars" : []},
    loadedResults : {"stores": [], "bars" : []},
    filteredResults : {"stores": [], "bars" : []},
    prunedSearchResults : function(searchResult) {

        console.log('prunedSearchResults');
        var loadedResults = RESULTS_SERVICE.getLoadedResults();

        var count = 0;
        $.each(searchResult.bars, function (index, location) {

            loadedResults.bars[count] = location;
            count++;
            if (count >= LOADING_SERVICE.loadLimit) {
                return false;
            }
        });

        count = 0;
        $.each(searchResult.stores, function (index, location) {

            loadedResults.stores[count] = location;
            count++;
            if (count >= LOADING_SERVICE.loadLimit) {
                return false;
            }
        });

        return loadedResults;
    },
    saveStoredResults : function(searchResult) {
        RESULTS_SERVICE.storedResults = searchResult;
    },
    getStoredResults : function() {
        return RESULTS_SERVICE.storedResults;
    },
    saveLoadedResults : function(searchResult) {
        RESULTS_SERVICE.loadedResults = searchResult;
    },
    getLoadedResults : function() {
        return RESULTS_SERVICE.loadedResults;
    },
    saveFilteredResults : function (searchResult) {
        RESULTS_SERVICE.filteredResults = searchResult;
    },
    getFilteredResults : function() {
        return RESULTS_SERVICE.filteredResults;
    },
    hasResults : function (searchResult) {
        return (searchResult !== undefined &&
            (searchResult.bars !== undefined && searchResult.stores !== undefined) &&
            (searchResult.bars.length > 0 || searchResult.stores.length > 0));
    },
    clearResults : function() {
        console.log('clearResults');
        RESULTS_SERVICE.saveStoredResults({"stores": [], "bars" : []});
        RESULTS_SERVICE.saveLoadedResults({"stores": [], "bars" : []});
        RESULTS_SERVICE.saveFilteredResults({"stores": [], "bars" : []});
    }
};
var FILTER_SERVICE = {

    disableFilter : function() {
        $('#slFilterContainer').addClass('sl-filter--disabled');
    },
    enableFilter : function() {
        $('#slFilterContainer').removeClass('sl-filter--disabled');
    },
    resetFilters : function() {
        $('.slFilterOption').removeClass('active');
        PRODUCT_FILTER_SERVICE.resetProductFilter();
    },
    isAnyFilterActive : function() {

        var filterActive = false;
        $('.slFilterOption').each(function(){
            if ($(this).hasClass('active')) {
                filterActive = true;
                return false;
            }
        });

        console.log('isAnyFilterActive():'+filterActive);
        return filterActive;
    },
    getActiveFilter : function() {

        var filterItem = undefined;
        $('.slFilterOption').each(function(){
            if ($(this).hasClass('active')) {
                filterItem = $(this);
            }
        });

        return filterItem;
    },
    filterLocations : function(filterItem, filterType) {

        console.log('filterLocations():'+ filterType);

        if (filterType === 'PRICE' || filterType === 'RATING') {
            filterItem.toggleClass('sortLowToHigh');
        }

        var loadedResults = RESULTS_SERVICE.getLoadedResults();
        var filteredResults;
        if (filterType === 'RESET') {
            filteredResults = loadedResults;
        } else {
            filteredResults = FILTER_SERVICE.getFilteredLocations(loadedResults, filterType, filterItem);
        }

        console.log('locationsFiltered: [bars='+filteredResults.bars.length + ' ,stores='+ filteredResults.stores.length+']');

        RESULTS_SERVICE.saveFilteredResults(filteredResults);

        return filteredResults;
    },
    filterSearchedLocations : function(searchResults) {

        console.log('filterSearchedLocations()');

        var filterItem = FILTER_SERVICE.getActiveFilter();
        var filterType = filterItem.attr('data-filter');
        var direction = filterItem.attr('data-direction');

        if (filterType === undefined || filterType === 'RESET') {
            return;
        }

        return FILTER_SERVICE.getFilteredLocations(searchResults, filterType, filterItem, direction);
    },
    getFilteredLocations : function(loadedResults, filterType, filterItem, direction) {

        if (direction === undefined) {
            direction = FILTER_SERVICE.getFilterDirection(filterItem);
        }

        switch (filterType) {
            case "OPEN":
                return FILTER_SERVICE.filterByOpen(loadedResults);
            case "PRICE":
                return  FILTER_SERVICE.filterByPrice(loadedResults, direction);
            case "RATING":
                return  FILTER_SERVICE.filterByRating(loadedResults, direction);
            case "PRODUCT":
                return RESULTS_SERVICE.getFilteredResults();
            default:
                return loadedResults;
        }
    },
    filterByOpen : function(locations) {
        console.log('filterByOpen()');

        var tempBars = [];
        var tempStores = [];

        var count = 0;
        $.each(locations.bars, function (index, location) {
            if (location.place_open_now === 'OPEN') {
                tempBars[count++] = location;
            }
        });

        count = 0;
        $.each(locations.stores, function (index, location) {
            if (location.place_open_now === 'OPEN') {
                tempStores[count++] = location;
            }
        });

        var temp = {};
        temp.bars = tempBars;
        temp.stores = tempStores;

        return temp;
    },
    filterByPrice : function(storedResults, direction) {
        console.log('filterByPrice()');

        var temp = {};
        temp.bars = FILTER_SERVICE.filterSorting(storedResults.bars, 'PRICE', direction);
        temp.stores = FILTER_SERVICE.filterSorting(storedResults.stores, 'PRICE', direction);

        return temp;
    },
    filterByRating : function(locations, direction) {

        console.log('filterByRating()');

        var temp = {};
        temp.bars = FILTER_SERVICE.filterSorting(locations.bars, 'RATING', direction);
        temp.stores = FILTER_SERVICE.filterSorting(locations.stores, 'RATING', direction);

        return temp;
    },
    filterSorting : function(locations, sortKey, direction) {

        var val = -1;
        if (direction === 'up') {
            val = 10;
        }

        return locations.sort(function (a, b) {

            var a1;
            var b1;

            switch (sortKey) {
                case "PRICE":
                    a1 = (a.place_price_level === undefined || a.place_price_level === '') ? val : a.place_price_level;
                    b1 = (b.place_price_level === undefined || b.place_price_level === '') ? val : b.place_price_level;
                    break;
                case "RATING":
                    a1 = (a.place_rating === undefined || a.place_rating === '') ? val : a.place_rating;
                    b1 = (b.place_rating === undefined || b.place_rating === '') ? val : b.place_rating;
            }

            if (a1 === b1) {
                return 0
            }

            if (direction === 'up') {
                return (a1 > b1) ? 1 : -1;
            }

            return (a1 < b1) ? 1 : -1;
        });
    },
    getFilterDirection : function(filterItem) {

        var direction;

        if (filterItem.attr('data-direction') === '' || filterItem.attr('data-direction') === 'up') {
            direction = 'down';
        } else {
            direction = 'up'
        }

        filterItem.attr('data-direction', direction);
        return direction;
    }
};
var PRODUCT_FILTER_SERVICE = {

    init: function(productsJSON) {

        console.log('product filter init()');

        var filterItems = '';
        var products = productsJSON.products;
        var defaultImage = BRAND_SERVICE.getBrandConfig().product_default_image;

        $.each(products, function (index, product) {

            var id = product.id;
            var packaging = (product.packaging !== undefined) ? product.packaging : '';
            var name = (packaging !== '') ? product.name +', ' +packaging :  product.name;
            var image = (product.image !== undefined) ? product.image : defaultImage;

            var item = HTML_TEMPLATES.product_filter_item;
            item = item.replace(/PLACEHOLDER_IMAGE/g, image);
            item = item.replace(/PLACEHOLDER_NAME/g, name);
            item = item.replace(/PLACEHOLDER_ID/g, id);

            filterItems = filterItems+item.trim();
        });

        $('#slProductFilter')[0].innerHTML = filterItems;
        $('#slProductFilterCount').text(products.length+' '+MESSAGES_SERVICE.getMessages().product_filter.products);
    },
    activateProductFilter : function(productFilter, active) {
        console.log('activateProductFilter()');

        if (!active) {
            PRODUCT_FILTER_SERVICE.resetProductFilter();
            productFilter.addClass('active');
        } else {

            if (NAVIGATION_SERVICE.isBarTabActive() ) {

                if ($.isEmptyObject(RESULTS_SERVICE.getFilteredResults().bars[0])) {
                    PRODUCT_FILTER_SERVICE.applyBtnDisable(true);
                    PRODUCT_FILTER_SERVICE.setProductFilterMessage(MESSAGES_SERVICE.getMessages().product_filter.empty_results);
                } else {
                    PRODUCT_FILTER_SERVICE.applyBtnDisable(false);
                    PRODUCT_FILTER_SERVICE.setProductFilterMessage('');
                }

            } else if (NAVIGATION_SERVICE.isStoreTabActive()) {

                if ($.isEmptyObject(RESULTS_SERVICE.getFilteredResults().stores[0])) {
                    PRODUCT_FILTER_SERVICE.applyBtnDisable(true);
                    PRODUCT_FILTER_SERVICE.setProductFilterMessage(MESSAGES_SERVICE.getMessages().product_filter.empty_results);
                } else {
                    PRODUCT_FILTER_SERVICE.applyBtnDisable(false);
                    PRODUCT_FILTER_SERVICE.setProductFilterMessage('');
                }
            }
        }

        COMMON_SERVICE.containerChange('product-filter');
    },
    populateProductFilterResults : function() {

        console.log('populateProductFilterResults()');

        var totalCount = $('.slProductCheckbox').length;
        var activeCount = $('.slProductCheckbox.active').length;

        var searchResults = RESULTS_SERVICE.getLoadedResults();
        var filteredResults  = {"stores": [], "bars" : []};

        if (totalCount === activeCount) {
            filteredResults = searchResults;
        } else if (activeCount === 0) {

        } else {
            var productIds = PRODUCT_FILTER_SERVICE.getSelectedProductIds();
            filteredResults.bars = PRODUCT_FILTER_SERVICE.getMatchingAddresses(searchResults.bars, productIds);
            filteredResults.stores = PRODUCT_FILTER_SERVICE.getMatchingAddresses(searchResults.stores, productIds);
        }

        RESULTS_SERVICE.saveFilteredResults(filteredResults);

        SEARCH_SERVICE.processSearch(filteredResults);

        if (activeCount !== 0) {

            if (NAVIGATION_SERVICE.isBarTabActive() && filteredResults.bars.length === 0) {
                PRODUCT_FILTER_SERVICE.emptyResultsActions();
            } else if (NAVIGATION_SERVICE.isStoreTabActive() && filteredResults.stores.length === 0) {
                PRODUCT_FILTER_SERVICE.emptyResultsActions();
            }
        }

    },
    getSelectedProductIds : function() {

        var productIds = [];

        $.each($('.slProductCheckbox.active'), function() {
            productIds.push(parseInt($(this).data('id')));
        });

        return productIds;
    },
    getMatchingAddresses : function (addresses, productIds) {

        var filteredAddresses = [];

        for (var i=0; i < addresses.length; i++) {

            var address = addresses[i];

            var matching = productIds.filter(
                function(e) {
                    return this.indexOf(e) >= 0;
                },
                address.products
            ).length;

            if (matching > 0) {
                filteredAddresses.push(address);
            }
        }

        return filteredAddresses;
    },
    productsDisabled : function() {
        PRODUCT_FILTER_SERVICE.applyBtnDisable(true);
        NAVIGATION_SERVICE.disableTabs(['slTabStores', 'slTabBars']);
        $('.slProductCheckbox').removeClass('active');
        var msg = MESSAGES_SERVICE.getMessages().product_filter.select_product;
        PRODUCT_FILTER_SERVICE.setProductFilterMessage(msg);
        MAPS_SERVICE.clearMapMarkers();
    },
    productsEnabled : function() {
        PRODUCT_FILTER_SERVICE.applyBtnDisable(false);
        NAVIGATION_SERVICE.enableTabs();
        PRODUCT_FILTER_SERVICE.setProductFilterMessage('');
    },
    setProductFilterMessage : function(msg) {
        $('#slProductFilterMessage').html(msg);
    },
    resetProductFilter : function() {
        console.log('resetProductFilter()');
        PRODUCT_FILTER_SERVICE.setProductFilterMessage('');
        $('#slProductFilterToggleAll').addClass('active');
        $('.slProductCheckbox').addClass('active');
        PRODUCT_FILTER_SERVICE.applyBtnDisable(false);

    },
    applyBtnDisable : function(val) {
        $('#slProductFilterApply').attr('disabled', val);
    },
    emptyResultsActions : function() {
        var msg = MESSAGES_SERVICE.getMessages().product_filter.empty_results;
        PRODUCT_FILTER_SERVICE.setProductFilterMessage(msg);
        PRODUCT_FILTER_SERVICE.applyBtnDisable(true);
    }
};
var DIRECTION_SERVICE = {

    openExternalMap : function (addressId) {

        var address = COMMON_SERVICE.getLocationById(addressId);
        if (address === undefined) {
            console.log('WARN: SL-ADDRESS-aa4419a: Failed to perform location search:'+url);
            return;
        }

        var daddr = address.latitude+","+address.longitude;

        var saddr = "";
        var location = GEOLOCATION_SERVICE.userLocation;
        if (location.lat !== undefined && location.lng !== undefined) {
            saddr = location.lat+","+location.lng;
        }

        // iOS
        if ((navigator.platform.indexOf("iPhone") !== -1) ||
            (navigator.platform.indexOf("iPad") !== -1) ||
            (navigator.platform.indexOf("iPod") !== -1)) {
            window.open("maps://maps.google.com/maps?saddr="+saddr+"&daddr="+daddr);
        } else { /* Google */
            window.open("https://maps.google.com/maps?saddr="+saddr+"&daddr="+daddr);
        }

    }
};
var EXPERIENCE_SERVICE = {

    map : undefined,
    mapInfoWindow : undefined,
    init : function() {

        console.log('experience init()');

        var experiences = BRAND_SERVICE.getBrandConfig().experiences;
        if ($.isEmptyObject(experiences)) {
            EXPERIENCE_SERVICE.disabledExperienceTab();
            return;
        }

        EXPERIENCE_SERVICE.enableExperienceKeys(experiences);
    },
    disabledExperienceTab : function() {
        $('#slNavLinks').addClass('sl-nav--no-experiences');
    },
    enableExperienceKeys : function (experiences) {

        $.each(experiences, function(key, exp) {

            if (exp.type === 'EVENT') {
                $('#slExperiencesEvent').addClass('enabled');
            } else if (exp.type === 'TOUR') {
                $('#slExperiencesTour').addClass('enabled');
            }
        });
    },
    initMap : function() {

        if (EXPERIENCE_SERVICE.map === undefined) {

            console.log('initMap(): Experience');

            var mapDiv = document.getElementById('sl-experiences-map');

            // Map options
            var options = {
                zoom: EXPERIENCE_SERVICE.getZoomLevel(),
                center: EXPERIENCE_SERVICE.getCentre(),
                gestureHandling : 'greedy',
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                styles : BRAND_SERVICE.getMapStyle()
            };

            // New map
            var map = new google.maps.Map(mapDiv, options);
            EXPERIENCE_SERVICE.map = map;
            EXPERIENCE_SERVICE.createExperiencesMarkers(map);
        }
    },
    getZoomLevel : function() {

        if (COMMON_SERVICE.isMobile()) {
            return 1;
        } else {
            return 2;
        }

    },
    getCentre : function () {

        var experiences = BRAND_SERVICE.getBrandConfig().experiences;
        if ($.isEmptyObject(experiences)) {
            return new google.maps.LatLng(0, 0);
        }

        var lat = 0;
        var lng = 0;

        if (COMMON_SERVICE.isMobile()) {
            $.each(experiences, function(index, exp) {

                if(exp.type === 'TOUR') {
                    lat = exp.latitude;
                    lng = exp.longitude;
                    return false;
                } else {
                    lat = exp.latitude;
                    lng = exp.longitude;
                }
            });
        }

        return new google.maps.LatLng(lat, lng);
    },
    createExperiencesMarkers :function(map) {

        var redIcon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
        var blueIcon = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';

        var experiences = BRAND_SERVICE.getBrandConfig().experiences;

        $.each(experiences, function(index) {

            var experience = experiences[index];
            var iconUrl = experience.type === 'EVENT' ? blueIcon : redIcon;

            var marker = new google.maps.Marker({
                position: {lat:experience.latitude, lng: experience.longitude},
                map: map,
                title : experience.name,
                icon: {
                    url: iconUrl
                }
            });

            EXPERIENCE_SERVICE.createInfoWindow(map, marker, experience);
        });
    },
    createInfoWindow : function (map, marker, experience) {

        var event = (COMMON_SERVICE.isMobile()) ? 'click' : 'mouseover';

        var infoWindow = new google.maps.InfoWindow({
            content: EXPERIENCE_SERVICE.getExperienceContent(experience)
        });

        google.maps.event.addListener(marker, event, function() {

            if (EXPERIENCE_SERVICE.mapInfoWindow !== undefined) {
                EXPERIENCE_SERVICE.mapInfoWindow.close();
            }

            EXPERIENCE_SERVICE.mapInfoWindow = infoWindow;
            EXPERIENCE_SERVICE.mapInfoWindow.open(map, marker);
        });
    },
    getExperienceContent : function (experience) {

        var contentString = (experience.type === 'TOUR') ? HTML_TEMPLATES.tour_experience_details : HTML_TEMPLATES.event_experience_details;
        contentString = contentString.replace(/PLACEHOLDER_IMAGE/g, experience.image)
        .replace(/PLACEHOLDER_NAME/g, experience.name)
        .replace('PLACEHOLDER_DESC', experience.description)
        .replace('PLACEHOLDER_OPENING_TIMES', experience.opening_times)
        .replace('PLACEHOLDER_WEBSITE', experience.website)
        .replace('PLACEHOLDER_BOOK', MESSAGES_SERVICE.getMessages().experiences.book);

        return contentString;
    }
};
var GEOLOCATION_SERVICE = {

    geocoder : undefined,
    userLocation : {},
    init : function() {
        console.log('geo init()');
        GEOLOCATION_SERVICE.geocoder = new google.maps.Geocoder();

        setTimeout(function () {
            GEOLOCATION_SERVICE.geocodeUserLocation();
        }, 2000);
    },
    geocodeUserLocation : function() {

        var map = MAPS_SERVICE.map;

        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map.setCenter(userLocation);
                map.setZoom(12);

                GEOLOCATION_SERVICE.userLocation = userLocation;
                SEARCH_SERVICE.searchByGeocode(userLocation);
            }, function() {
                console.log('INFO: SL-GEOLOCATION-9e42d93: User rejected location request or Geolocation service failed.');
            });
        } else {
            console.log('INFO: SL-GEOLOCATION-c60b105: Browser does not support geolocation.');
        }
    },
    processGeocodeResult : function(results, status, searchDatalayer) {

        var location = undefined;

        if (status === 'OK' && results.length > 0) {

            var address = GEOLOCATION_SERVICE.extractAddressData(results[0]);

            ANALYTICS_SERVICE.populateSearchDatalayerByAddress(searchDatalayer, address);

            if (!GEOLOCATION_SERVICE.isValidCountry(address.country)) {
                COMMON_SERVICE.processInvalidCountry();
                searchDatalayer.search_status = ANALYTICS_SERVICE.searchDatalayerStatus.INVALID_COUNTRY;
                ANALYTICS_SERVICE.pushSearchEvent(searchDatalayer);
            } else if (!GEOLOCATION_SERVICE.isPermittedState(address.state)) {
                COMMON_SERVICE.processRestrictedState();
                searchDatalayer.search_status = ANALYTICS_SERVICE.searchDatalayerStatus.RESTRICTED_STATE;
                ANALYTICS_SERVICE.pushSearchEvent(searchDatalayer);
            } else {
                location = results[0].geometry.location;
                var addressLocation = {
                    lat: location.lat(),
                    lng: location.lng()
                };

                AJAX_SERVICE.searchLocationAjax(addressLocation, searchDatalayer);
            }

        } else {
            console.log('WARN: SL-GEOLOCATION-2444f96: Geolocation failed for address search with status:'+status);
            COMMON_SERVICE.showNoStoreView();
            searchDatalayer.search_status = ANALYTICS_SERVICE.searchDatalayerStatus.GEOCODE_FAIL;
            ANALYTICS_SERVICE.pushSearchEvent(searchDatalayer);
        }

    },
    extractAddressData : function(data) {

        var address = {
            city: '',
            state : '',
            zip : '',
            country : ''
        };

        try {

            var addressComponents = data.address_components;
            for (var i=0; i < addressComponents.length; i++) {

                if (addressComponents[i].types[0] === 'postal_code') {
                    address.zip = addressComponents[i].short_name;
                } else if (addressComponents[i].types[0] === 'locality' || addressComponents[i].types[1] === 'locality') {
                    address.city = addressComponents[i].short_name;
                } else if (addressComponents[i].types[0] === 'neighborhood' || addressComponents[i].types[1] === 'neighborhood') {
                    address.city = addressComponents[i].short_name;
                } else  if (addressComponents[i].types[0] === 'administrative_area_level_1' || addressComponents[i].types[1] === 'administrative_area_level_1') {
                    address.state  = addressComponents[i].short_name;
                } else if (addressComponents[i].types[0] === 'country' || addressComponents[i].types[1] === 'country') {
                    address.country  = addressComponents[i].short_name;
                }

            }
        } catch (e) {
            console.log('INFO: SL-GEOLOCATION-01d9ee8: Geolocation unable extract address data due to:'+e);
        }

        return address;
    },
    isValidCountry : function(countryCode) {
        console.log('INFO: SL-GEOLOCATION-c690617: Geolocation detected country code:['+countryCode+']');
        return countryCode === BRAND_SERVICE.getBrandConfig().country;
    },
    isPermittedState : function(stateCode) {

        console.log('INFO: SL-GEOLOCATION-5ae1cf2: Geolocation detected state:['+stateCode+']');

        if (stateCode === undefined || stateCode === '') {
            return false;
        }

        var config = BRAND_SERVICE.getBrandConfig();
        if (config.restrictions !== undefined &&
            config.restrictions.permitted_states !== undefined) {

            var permittedStates = config.restrictions.permitted_states;
            for (var i = 0; i < permittedStates.length; i++) {
                if (permittedStates[i] === stateCode) {
                    return true;
                }
            }

            return false;
        }

        return true;
    }
};
var MAPS_SERVICE = {

    map : undefined,
    mapBarMarkers : [],
    mapStoreMarkers : [],
    mapInfoWindow : undefined,
    init: function () {

        console.log('map init()');

        var mapDiv = document.getElementById('sl-map');

        var brandConfig = BRAND_SERVICE.getBrandConfig();
        var zoom = brandConfig.map.zoom;
        var lat = brandConfig.map.lat;
        var lng = brandConfig.map.lng;

        // Map options
        var options = {
            zoom: zoom,
            center:{lat:lat, lng:lng},
            gestureHandling: 'greedy',
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles : BRAND_SERVICE.getMapStyle()
        };

        // New map
        var map = new google.maps.Map(mapDiv, options);
        MAPS_SERVICE.map = map;

        var initialised = false;
        var addEvent = true;
        map.addListener('bounds_changed', function() {

            if (initialised && addEvent) {
                map.controls[google.maps.ControlPosition.TOP_CENTER].push(MAPS_SERVICE.createMapSearchControl());
                addEvent = false;
            }
            initialised = true;
        });
    },
    createMapSearchControl : function() {

        var searchControlDiv = $(HTML_TEMPLATES.search_div)[0];

        google.maps.event.addDomListener(searchControlDiv, 'click', function() {
            SEARCH_SERVICE.searchByMapCentre();
        });

        return searchControlDiv;
    },
    centreMap : function(searchResult) {

        console.log('centreMap()');

        var centreLocation = undefined;

        var lat1, lng1, lat2, lng2, length;

        if (NAVIGATION_SERVICE.isBarTabActive() && searchResult.bars.length > 0) {

            lat1 = searchResult.bars[0].latitude;
            lng1 = searchResult.bars[0].longitude;

            length = (searchResult.bars.length - 1);
            lat2 = searchResult.bars[length].latitude;
            lng2 = searchResult.bars[length].longitude;

            centreLocation = {
                lat: lat1,
                lng: lng1
            };
        } else if (NAVIGATION_SERVICE.isStoreTabActive() && searchResult.stores.length > 0) {

            lat1 = searchResult.stores[0].latitude;
            lng1 = searchResult.stores[0].longitude;

            length = (searchResult.stores.length - 1);
            lat2 = searchResult.stores[length].latitude;
            lng2 = searchResult.stores[length].longitude;

            centreLocation = {
                lat: lat1,
                lng: lng1
            };
        }

        if (centreLocation !== undefined) {
            var map = MAPS_SERVICE.map;
            map.setCenter(centreLocation);
            map.setZoom(COMMON_SERVICE.calculateZoomLevel(lat1, lng1, lat2, lng2));
        }

    },
    resetMapCentre : function() {
        console.log('resetMapCentre()');
        var brandConfig = BRAND_SERVICE.getBrandConfig();
        var lat = brandConfig.map.lat;
        var lng = brandConfig.map.lng;
        var zoom = brandConfig.map.zoom;

        var location = {
            lat: lat,
            lng: lng
        };

        var map = MAPS_SERVICE.map;
        map.setCenter(location);
        map.setZoom(zoom);
    },
    addMarkers : function(locationsResult) {

        if (NAVIGATION_SERVICE.isBarTabActive()) {
            console.log('addMarkers > bars('+locationsResult.bars.length+')');
            MAPS_SERVICE.mapBarMarkers = [];
            MAPS_SERVICE.addMapMarkers(locationsResult.bars, MAPS_SERVICE.mapBarMarkers);
        } else if (NAVIGATION_SERVICE.isStoreTabActive()) {
            console.log('addMarkers > stores('+locationsResult.stores.length+')');
            MAPS_SERVICE.mapStoreMarkers = [];
            MAPS_SERVICE.addMapMarkers(locationsResult.stores, MAPS_SERVICE.mapStoreMarkers);
        }

    },
    addMapMarkers : function(locations, markersArray) {

        var map = MAPS_SERVICE.map;

        if (locations !== undefined && locations.length > 0 && map !== undefined) {

            for(var i = 0;i < locations.length; i++){
                var marker = this.addMapMarker(map, locations[i]);
                markersArray.push(marker);
            }
        }
    },
    addMapMarker : function (map, location) {

        var defaultIcon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
        var iconUrl = BRAND_SERVICE.getBrandConfig().map.iconUrl !== undefined ? BRAND_SERVICE.getBrandConfig().map.iconUrl : defaultIcon;

        var marker =  new google.maps.Marker({
            position: {lat:location.latitude, lng: location.longitude},
            map: map,
            title : location.name,
            icon: {
                url: iconUrl
            }
        });

        if (COMMON_SERVICE.isMobile()) {

            google.maps.event.addListener(marker, 'click', function() {
                ADDRESS_SERVICE.findAndShowAddressDetails(location.id);
            });

        } else {

            google.maps.event.addListener(marker, 'click', function() {

                if (MAPS_SERVICE.mapInfoWindow !== undefined) {
                    MAPS_SERVICE.mapInfoWindow.close();
                }

                MAPS_SERVICE.mapInfoWindow = ADDRESS_SERVICE.findAndShowAddressDetails(location.id);
            });

            google.maps.event.addListener(marker, 'mouseover', function() {

                if (MAPS_SERVICE.mapInfoWindow !== undefined) {
                    MAPS_SERVICE.mapInfoWindow.close();
                }

                MAPS_SERVICE.mapInfoWindow = MAPS_SERVICE.createInfoWindow(location);
                MAPS_SERVICE.mapInfoWindow.open(map, marker);
            });
        }

        return marker;
    },
    createInfoWindow : function(location) {

        var contentString;
        if (location.place_id === 'UNKNOWN') {
            contentString = HTML_TEMPLATES.store_info_window;
            contentString = contentString.replace(/PLACEHOLDER_NAME/g, location.name)
            .replace('PLACEHOLDER_ICON', location.icon);
        } else {
            contentString = HTML_TEMPLATES.store_info_window_google;
            contentString = contentString.replace(/PLACEHOLDER_NAME/g, location.name)
            .replace('GOOGLE_PHOTO_ICON', location.place_photo_icon)
            .replace('GOOGLE_RATING_ROUNDED', location.place_rating_rounded)
            .replace('GOOGLE_RATING', location.place_rating)
            .replace('GOOGLE_REVIEWS_COUNT', location.place_reviews_count +' reviews')
            .replace('GOOGLE_PRICE_LEVEL', location.place_price_level);
        }

        return new google.maps.InfoWindow({
            content: contentString
        });

    },
    clearMapMarkers : function() {

        console.log('clearMapMarkers()');

        for (var i = 0; i < MAPS_SERVICE.mapBarMarkers.length; i++) {
            MAPS_SERVICE.mapBarMarkers[i].setMap(null);
        }
        MAPS_SERVICE.mapBarMarkers = [];

        for (var j = 0; j < MAPS_SERVICE.mapStoreMarkers.length; j++) {
            MAPS_SERVICE.mapStoreMarkers[j].setMap(null);
        }
        MAPS_SERVICE.mapStoreMarkers = [];
    },
    animateMarkerAndShowInfoWindow : function (addressItem) {

        var count = addressItem.attr('data-count');
        var type = addressItem.attr('data-type');
        var lat = addressItem.attr('data-lat');
        var lng = addressItem.attr('data-lng');

        console.log('animateMarkerAndShowInfoWindow() :'+type+'>'+count);

        var markers = undefined;
        if ('stores' === type) {
            markers = MAPS_SERVICE.mapStoreMarkers;
        } else if ('bars' === type) {
            markers = MAPS_SERVICE.mapBarMarkers;
        }

        for (var i=0; i < markers.length; i++) {
            markers[i].setAnimation(null);
        }

        var location = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };

        var map = MAPS_SERVICE.map;
        map.setCenter(location);

        var marker = markers[count];
        marker.setAnimation(google.maps.Animation.BOUNCE);
        google.maps.event.trigger(marker, 'click');

        setTimeout(function () {
            marker.setAnimation(null);
        }, 1000);
    }
};
var MESSAGES_SERVICE = {

    messages : undefined,
    init : function () {
        console.log('messages init');
        var json = $('#slMessagesJson').text();
        MESSAGES_SERVICE.messages = JSON.parse(json);
    },
    showSetUpError : function() {
        var html = 'Store locator unavailable.';
        document.getElementById('sl-store-locator').innerHTML = '<h1>'+html+'</h1>';
    },
    setInfoWindowMsg : function(msg) {
        document.getElementById('slInfoMessageContainer').innerHTML = msg;
    },
    showTemplateLoadError : function() {
        var msg = "<div>Store Locator unavailable</div>";
        if (MESSAGES_SERVICE.getMessages() !== undefined) {
            msg = MESSAGES_SERVICE.getMessages().error.template_load;
        }
        document.getElementById('sl-store-locator').innerHTML = msg;
    },
    showSearchInProgress : function() {
        $('#slSearchInProgress').addClass('sl-show');
    },
    hideSearchInProgress : function() {
        $('#slSearchInProgress').removeClass('sl-show');
    },
    getMessages : function() {
        return MESSAGES_SERVICE.messages;
    }
};
var NAVIGATION_SERVICE = {

    isBarTabActive : function() {
        return $('#slTabBars').hasClass('active');
    },
    isStoreTabActive : function() {
        return $('#slTabStores').hasClass('active');
    },
    isExperienceActive : function() {
        return $('#slTabExperience').hasClass('active');
    },
    disableTabs : function(tabs) {

        if (tabs === undefined) {
            $('.slTabLink').attr('disabled', 'disabled');
        } else {
            $.each(tabs, function(index, tab){
                $('#'+tab).attr('disabled', 'disabled');
            });
        }
    },
    enableTabs : function(tabs) {

        var tabLinks = $('.slTabLink');
        if (tabs === undefined) {
            tabLinks.removeAttr("disabled");
        }

    },
    activateTab : function(searchResult) {

        console.log('activateTab()');

        var barDiv = document.getElementById('slBarContainer');
        var storeDiv = document.getElementById('slStoreContainer');

        var effectiveTab = NAVIGATION_SERVICE.getEffectiveTab(searchResult);

        if (effectiveTab === 'BARS') {
            storeDiv.style.display = 'none';
            barDiv.style.display = 'block';
            $('#slTabBars').addClass('active');
            $('#slTabStores').removeClass('active');
        } else if (effectiveTab === 'STORES') {
            storeDiv.style.display = 'block';
            barDiv.style.display = 'none';
            $('#slTabBars').removeClass('active');
            $('#slTabStores').addClass('active');
        }
    },
    getEffectiveTab : function(resutls) {

        console.log('getEffectiveTab()');

        var barsCount = resutls.bars.length;
        var storeCount = resutls.stores.length;

        if (NAVIGATION_SERVICE.isBarTabActive() && barsCount !== 0) {
            return 'BARS';
        } else if (NAVIGATION_SERVICE.isStoreTabActive() && storeCount !== 0) {
            return 'STORES';
        } else if (barsCount !== 0) {
            return 'BARS';
        } else if (storeCount !== 0){
            return 'STORES'
        }

        return 'BARS';
    }
};
// Service that deal with getting data from Google's places API
var PLACES_SERVICE = {

    delayInterval : 0,
    googlePlacesService : undefined,
    init :function() {
        console.log('places init()');
        PLACES_SERVICE.googlePlacesService = new google.maps.places.PlacesService(MAPS_SERVICE.map);
    },
    amalgamateWithGoogleData : function(searchResults, activeLocations) {

        console.log('amalgamateWithGoogleData() [bars='+searchResults.bars.length+', stores='+searchResults.stores.length+']');

        var count = 0;
        var locationSize = activeLocations.length;
        $.each(activeLocations, function (index, location) {

            if (location.place_id === '') {

                PLACES_SERVICE.promisePlaceData(location)
                .then(function (placeData) {
                    PLACES_SERVICE.amalgamateGooglePlacesData(location, placeData);
                    return PLACES_SERVICE.promisePlaceDetails(location);
                })
                .then (function (placeDetailsData){
                    console.log("INFO: SL-DETAILS-PROMISE-1eaf4e: RESOLVED["+location.id+"]");
                    PLACES_SERVICE.amalgamateGooglePlacesDetailsData(location, placeDetailsData);
                })
                .then(function () {
                    count++;
                    if (count === locationSize) {
                        PLACES_SERVICE.amalgamationCompleted(searchResults);
                    }
                })
                .catch(function () {
                    count++;
                    console.log("WARN: SL-PLACE-PROMISE-5ad660: REJECTED ["+location.id+"]");
                    PLACES_SERVICE.amalgamateFailed(location);
                });
                /* [IM 19-03-07] - Not supported by IE/Edge
                .finally(function () {
                    count++;
                    if (count === locationSize) {
                        PLACES_SERVICE.amalgamationCompleted(searchResults);
                    }
                });
                */

            } else {
                count++;
                if (count === locationSize) {
                    PLACES_SERVICE.amalgamationCompleted(searchResults);
                }
            }
        });

        PLACES_SERVICE.delayInterval = 500;
    },
    amalgamationCompleted : function(searchResults) {

        console.log('amalgamationCompleted()');

        var filteredResults = searchResults;
        if (FILTER_SERVICE.isAnyFilterActive()) {
            filteredResults =  FILTER_SERVICE.filterSearchedLocations(searchResults);
            console.log('Filtered locations: [bars='+filteredResults.bars.length + ' ,stores='+ filteredResults.stores.length+']');
        }

        SEARCH_SERVICE.processSearch(filteredResults);

        MESSAGES_SERVICE.hideSearchInProgress();
        FILTER_SERVICE.enableFilter();
    },
    amalgamateFailed : function(location) {
        console.log('amalgamateFailed()');
        location.place_id = 'UNKNOWN';
        location.place_price_level = '';
        location.place_rating = '';
        location.place_open_now = '';
        location.icon = BRAND_SERVICE.getBrandStockImage('ICON');
        location.image = BRAND_SERVICE.getBrandStockImage('LARGE');
    },
    promisePlaceData : function(location) {

        var queryStr = location.name +' '+ location.address.line1 +' '+ location.address.city +' '+ location.address.zipcode;
        var request = {
            query: queryStr,
            fields: ['place_id', 'name', 'rating', 'photos', 'opening_hours', 'price_level', 'user_ratings_total'],
            locationBias : {lat: location.latitude, lng: location.longitude}
        };

        return new Promise(function(resolve, reject) {

            PLACES_SERVICE.googlePlacesService.findPlaceFromQuery(request, function (results, status) {

                    if (status === google.maps.places.PlacesServiceStatus.OK && results.length >= 1 ) {
                        resolve(results[0]);
                    } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                        console.log("WARN: SL-PLACE-PROMISE-0e7724: OVER-QUERY-LIMIT ["+location.id+"]");
                        reject();
                    } else {
                        console.log('WARN: SL-PLACES_SERVICE-204a53: API find place from query request failed:'+status);
                        reject();
                    }
                }
            );
        });
    },
    promisePlaceDetails : function(location) {

        var request = {
            placeId: location.place_id,
            fields : ['website', 'formatted_phone_number', 'opening_hours.periods', 'reviews']
        };

        return new Promise(function(resolve, reject) {

            PLACES_SERVICE.googlePlacesService.getDetails(request, function (place, status) {

                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(place);
                } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                    console.log("WARN: SL-PLACE-PROMISE-d99a3a: OVER-QUERY-LIMIT ["+location.id+"]");
                    reject();
                } else {
                    console.log('WARN: SL-PLACES_SERVICE-457a1e: API Place Details request failed:'+status);
                    reject();
                }
            });
        });
    },
    amalgamateGooglePlacesData : function(location, place) {

        try {
            location.place_id = place.place_id !== undefined ? place.place_id : '';
            location.place_name = place.name !== undefined ? place.name : '';
            location.place_rating = place.rating !== undefined ? place.rating : '';
            location.place_rating_rounded = PLACES_SERVICE.getRatingRounded(place);
            location.place_reviews_count = PLACES_SERVICE.getReviewsCount(place);
            location.place_icon = place.icon !== undefined ? place.icon : '';
            location.place_price_level = place.price_level !== undefined ? place.price_level : '';
            location.place_open_now = PLACES_SERVICE.getOpenNow(place);
            location.place_photo_icon = PLACES_SERVICE.getPhotoIcon(place);
            location.place_photo_large = PLACES_SERVICE.getPhotoLarge(place);

        } catch (err) {
            console.log('WARN SL-PLACES-DETAILS:e3c73a Failed to amalgamate Google place data:'+err.message);
        }
    },
    amalgamateGooglePlacesDetailsData : function(location, placeDetails) {

        console.log('amalgamateGooglePlacesDetailsData()');

        try {

            var openingTimes = PLACES_SERVICE.getOpeningTimes(placeDetails);
            var website = placeDetails.website !== undefined ? placeDetails.website : '';
            var phone = placeDetails.formatted_phone_number !== undefined ? placeDetails.formatted_phone_number : '';
            location.place_website = website;
            location.place_website_name = PLACES_SERVICE.getWebSiteName(website);
            location.place_phone = phone;
            location.place_opens_at = PLACES_SERVICE.getOpensAt(placeDetails);
            location.place_opening_time1 = openingTimes[0];
            location.place_opening_time2 = openingTimes[1];
            location.place_opening_time3 = openingTimes[2];
            location.place_opening_time4 = openingTimes[3];
            location.place_opening_time5 = openingTimes[4];
            location.place_opening_time6 = openingTimes[5];
            location.place_opening_time7 = openingTimes[6];

        } catch (err) {
            console.log('WARN SL-PLACES-DETAILS:7710e48 Failed to amalgamate Google place details data:'+err.message);
        }
    },
    getOpenNow : function(place) {

        if (place.opening_hours === undefined ||
            place.opening_hours.open_now === undefined) {
            return '';
        }

        return place.opening_hours.open_now ? MESSAGES_SERVICE.getMessages().google.store_open : MESSAGES_SERVICE.getMessages().google.store_close;
    },
    isOpen24h : function(placeDetails) {

        return (placeDetails.opening_hours !== undefined &&
            placeDetails.opening_hours.periods !== undefined &&
            placeDetails.opening_hours.periods[0].open !== undefined &&
            placeDetails.opening_hours.periods[0].open.time !== undefined &&
            placeDetails.opening_hours.periods[0].open.time === '0000' &&
            placeDetails.opening_hours.periods[0].close === undefined);
    },
    getOpeningTimes : function(placeDetails) {

        var openingTimes = ['', '', '', '', '', '', ''];

        if (placeDetails.opening_hours === undefined) {
            return openingTimes;
        }

        var weekdays = placeDetails.opening_hours.weekday_text;
        if (weekdays === undefined) {
            return openingTimes;
        }

        return weekdays;
    },
    getOpensAt : function(placeDetails) {

        // TODO [IM 19-01-29] - Get message translations for 'Closed' & 'Opens at'
        try {

            if (PLACES_SERVICE.isOpen24h(placeDetails)) {
                return 'Open 24 hours';
            }

            if (placeDetails.opening_hours === undefined ||
                placeDetails.opening_hours.open_now === undefined) {
                return '';
            }

            var dayNum = new Date().getDay();
            var openNow = placeDetails.opening_hours.open_now;

            if (openNow) {

                if (placeDetails.opening_hours.periods === undefined ||
                    placeDetails.opening_hours.periods[dayNum] === undefined ||
                    placeDetails.opening_hours.periods[dayNum].close === undefined ||
                    placeDetails.opening_hours.periods[dayNum].close.time === undefined) {
                    return 'Open';
                }

                var closeTime = placeDetails.opening_hours.periods[dayNum].close.time;
                return 'Open until: '+  closeTime.slice(0, 2) + ":" + closeTime.slice(2);
            } else {

                if (placeDetails.opening_hours.periods === undefined ||
                    placeDetails.opening_hours.periods[dayNum] === undefined ||
                    placeDetails.opening_hours.periods[dayNum].open === undefined ||
                    placeDetails.opening_hours.periods[dayNum].open.time === undefined) {
                    return 'Closed';
                }

                var time = placeDetails.opening_hours.periods[dayNum].open.time;
                return 'Opens at:' +  time.slice(0, 2) + ":" + time.slice(2);
            }
        } catch (err) {
            console.log('WARN SL-PLACES-DETAILS:23ff3b Failed to get Google place opening hours:'+err.message);
            return '';
        }
    },
    getReviewsCount : function(place) {
        if (place.user_ratings_total === undefined) {
            return '';
        }

        return place.user_ratings_total;
    },
    getReviewsFormatted : function(location) {

        if (location.place_id !== '' && location.place_id !== 'UNKNOWN') {
            // TODO [IM 19-01-25] - Format reviews count, in case it's not formatted
            return '('+location.place_reviews_count+')';
        } else {
            return '';
        }
    },
    getPhotoIcon : function (place) {

        if (place.photos === undefined || !place.photos.length > 0) {
            return BRAND_SERVICE.getBrandStockImage('ICON');
        }

        return place.photos[0].getUrl({'maxWidth': 100, 'maxHeight': 100});
    },
    getPhotoLarge : function(place) {

        if (place.photos === undefined || !place.photos.length > 0) {
            return BRAND_SERVICE.getBrandStockImage('LARGE');
        }

        return place.photos[0].getUrl({'maxWidth': 350, 'maxHeight': 100});
    },
    getRatingRounded : function(place) {

        if (place.rating === undefined) {
            return '0';
        }

        var rating = place.rating;
        var dec = (rating % 1).toFixed(1);
        if (dec === 0.0 || dec === 0.1 || dec === 0.2) {
            return Math.floor(rating);
        } else if (dec === 0.8 || dec === 0.9) {
            return Math.ceil(rating);
        } else {
            return Math.floor(rating) + '_5';
        }
    },
    getWebSiteName : function(website) {

        if (website === undefined || website === '') {
            return '';
        }

        try {

            website = website.replace('http://', '').replace('https://', '').replace('www.', '').replace(/\/$/, '');

            if (website.length > 30) {
                return website.substr(0, 25) + '...';
            } else {
                return website;
            }

        } catch (e) {
            console.log('WARN: SL-PLACE-WEBSITE-f3d20b: Failed to get website name for:'+website);
        }

        return 'website';
    }
};
var COMMON_SERVICE = {

    getLocationById : function (locationId) {

        locationId = parseInt(locationId);
        var foundLocation = undefined;

        var stores = RESULTS_SERVICE.getLoadedResults().stores;
        var bars = RESULTS_SERVICE.getLoadedResults().bars;
        var locations = stores.concat(bars);
        $.each(locations, function(index, location){

            if (location.id === locationId) {
                foundLocation = location;
                return false;
            }
        });

        return foundLocation;
    },
    showNoStoreView : function() {
        MESSAGES_SERVICE.setInfoWindowMsg(MESSAGES_SERVICE.getMessages().info.no_stores);
        COMMON_SERVICE.containerChange('info');
    },
    updateCount : function (searchResult) {

        var stores = 0;
        var bars = 0;

        if (searchResult !== undefined && searchResult.stores !== undefined && searchResult.bars !== undefined) {
            stores = searchResult.stores.length;
            bars = searchResult.bars.length;
        }

        $('#storesCount').html(' ('+stores+')');
        $('#barsCount').html(' ('+bars+')');
    },
    processRestrictedState : function() {
        console.log('processRestrictedState()');
        var msg = MESSAGES_SERVICE.getMessages().info.restricted_state;
        SEARCH_SERVICE.processEmptyResults(msg);
    },
    processInvalidCountry : function() {
        var msg = MESSAGES_SERVICE.getMessages().info.invalid_country;
        SEARCH_SERVICE.processEmptyResults(msg);
    },
    containerChange : function(type) {
        console.log('containerChange:'+type);
        var container = 'sl-container--'+type;
        $('#slContainer').removeClass().addClass('sl-container '+container);
    },
    calculateDistance : function(lat1, lng1, lat2, lng2) {

        var deg2rad = Math.PI / 180;
        var radius = 6371; // Radius of the earth in km
        var dLat = (lat2 - lat1) * deg2rad;
        var dLon = (lng2 - lng1) * deg2rad;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * deg2rad) * Math.cos(lat2 * deg2rad) * Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return radius * c;
    },
    scrollToTop : function() {
        $('html, body').animate({
            scrollTop: $("#slContainer").offset().top
        });
    },
    formatPhone : function(phone) {

        try {
            if(/^\d{10}$/.test(phone)) {
                phone = ''+ phone;
                return '+1 ('+phone.substring(0,3)+') '+phone.substring(3,6)+'-'+phone.substring(6,10);
            } else {
                console.log('WARN: SL-PHONE-5717a8e: Failed to format phone number regex mismatch.');
                return phone;
            }
        } catch (err) {
            console.log('WARN: SL-PHONE-17a8e78: Failed to format phone number due to:'+err);
            return phone;
        }
    },
    calculateZoomLevel : function(lat1, lng1, lat2, lng2) {

        var distance = COMMON_SERVICE.calculateDistance(lat1, lng1, lat2, lng2);

        var zoom;
        if (distance >= 0 && distance <= 4) {
            zoom = 14;
        } else if (distance >= 4 && distance <= 10) {
            zoom = 13;
        } else if (distance >= 10 && distance <= 15) {
            zoom = 12;
        } else if (distance >= 15 && distance <= 20) {
            zoom = 10;
        } else if (distance >= 20 && distance <= 30) {
            zoom = 9;
        } else {
            zoom = 8;
        }

        if (COMMON_SERVICE.isMobile()) {
            zoom = zoom - 1;
        }

        console.log('calculateZoomLevel() distance:'+distance + ' zoom:'+zoom);

        return zoom;
    },
    selectOpeningTime : function(addressItem) {

        var dayNum = new Date().getDay();
        addressItem.find('.slOpeningTime').each(function(index) {
            if (index+1 === dayNum) {
                $(this).addClass('sl-opening-time--today');
                return false;
            }
        });

    },
    isMobile : function () {
        var position = $('.sl-nav').css('position');
        return position === 'absolute';
        // return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    },
    getProductIds : function(locations) {

        var commonProducts = new Set();

        if (!$.isEmptyObject(locations)) {
            $.each(locations, function(index, location) {
                $.each(location.products, function(index, id) {
                    commonProducts.add(id);
                });
            });
        }

        return commonProducts;
    }
};
var HTML_TEMPLATES = {

    main_template: '@@MAIN_TEMPLATE',

    address_item_google : '<li id="slAddressItem-PLACEHOLDER_ID" class="sl-list-item slAddressItem" ' +
    'data-id="PLACEHOLDER_ID" ' +
    'data-place-id="GOOGLE_PLACE_ID" ' +
    'data-open-now="GOOGLE_OPEN_NOW" ' +
    'data-price-level="GOOGLE_PRICE_LEVEL" ' +
    'data-rating="GOOGLE_RATING" ' +
    'data-count="PLACEHOLDER_COUNTER" ' +
    'data-type="PLACEHOLDER_TYPE" ' +
    'data-lat="PLACEHOLDER_LAT" ' +
    'data-lng="PLACEHOLDER_LNG">' +
    '<div class="sl-list-main">' +
    '<div class="sl-list-image" style="background-image: url(GOOGLE_PHOTO_LARGE);">' +
    '<button id="slAddressDetailsBack" data-id="PLACEHOLDER_ID" class="sl-list-back-to-results">' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.9"><style type="text/css">.st0{filter:url(#Adobe_OpacityMaskFilter)}.st1{fill:#FFF}.st2{mask:url(#icon_gg-sl-productclosex-b);fill:#FFF}</style><defs><filter filterUnits="userSpaceOnUse" width="19.9" height="19.9"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter></defs><mask maskUnits="userSpaceOnUse" width="19.9" height="19.9"><g class="st0"><polygon class="st1" points="0 0 19.9 0 19.9 19.9 0 19.9 "/></g></mask><path class="st2" d="M14.7 14L14 14.7l-4.1-4.1 -4.1 4.1L5.1 14l4.1-4.1L5.1 5.9l0.7-0.7 4.1 4.1L14 5.1l0.7 0.7 -4.1 4.1L14.7 14zM9.9 0C4.5 0 0 4.5 0 9.9c0 5.5 4.5 9.9 9.9 9.9 5.5 0 9.9-4.5 9.9-9.9C19.9 4.5 15.4 0 9.9 0L9.9 0z"/></svg>' +
    '</button>' +
    '</div>' +
    '<div class="sl-list-highlight">' +
    '<h3 class="sl-list-header">PLACEHOLDER_NAME</h3>' +
    '<div class="sl-list-content">' +
    '<div id="slAddressList-PLACEHOLDER_ID" class="sl-list-address">' +
    '<div class="sl-list-rating">GOOGLE_RATING</div>' +
    '<div class="sl-list-rating-stars sl-list-rating-stars--GOOGLE_RATING_ROUNDED"></div>' +
    '<div class="sl-list-reviews-count"><span class="sl-list-reviews-count-dd">GOOGLE_REVIEWS_COUNT</span> <span class="sl-list-reviews-count-dt">reviews</span></div>' +
    '<div class="sl-list-price-level sl-list-price-level--GOOGLE_PRICE_LEVEL"><span>GOOGLE_PRICE_LEVEL</span></div>' +
    '<div class="sl-list-address">' +
    '<span class="sl-list-address-line1">PLACEHOLDER_LINE1</span>' +
    '<span class="sl-list-address-city">PLACEHOLDER_CITY</span>' +
    '<span class="sl-list-address-zipcode">PLACEHOLDER_ZIPCODE</span>' +
    '</div>' +
    '<div id="slOpensAt-PLACEHOLDER_ID">GOOGLE_OPENS_AT</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div id="slAddressDetails-PLACEHOLDER_ID" class="sl-list-secondary-content">' +
    '<div class="sl-list-secondary-content-element sl-list-direction-link-container">' +
    '<i class="fa fa-map-marker" aria-hidden="true"></i>' +
    '<button class="slDirectionLink sl-direction-link" data-id="PLACEHOLDER_ID">Directions</button>' +
    '</div>' +
    '<div id="slWebsite-PLACEHOLDER_ID" class="sl-list-secondary-content-element sl-list-url">' +
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 17 17" xml:space="preserve"><style type="text/css">.webst0{fill:none;stroke:#16297C;}.webst1{fill:#16297C;}</style><g transform="translate(.5 .5)"><path class="webst0" d="M8,16c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S12.4,16,8,16"/><path class="webst1" d="M11.2,12c-0.5,0.9-1.2,1.8-2,2.5c1.3-0.2,2.5-0.9,3.4-1.8C12.1,12.4,11.7,12.1,11.2,12 M8.3,14.2c0.9-0.7,1.6-1.5,2.2-2.5c-0.7-0.2-1.4-0.3-2.2-0.3V14.2z M14.6,8.4h-2.4c0,1-0.3,2-0.7,2.9c0.5,0.2,1.1,0.5,1.6,0.9C13.9,11.1,14.5,9.8,14.6,8.4 M13.1,3.9c-0.5,0.4-1.1,0.7-1.6,0.9c0.4,0.9,0.6,1.8,0.7,2.8h2.4C14.5,6.2,14,4.9,13.1,3.9 M8.3,1.9v2.9c0.7,0,1.4-0.1,2.1-0.3C9.9,3.5,9.2,2.6,8.3,1.9 M8.3,7.6h3.1c-0.1-0.9-0.3-1.7-0.6-2.5C10,5.3,9.2,5.5,8.3,5.5V7.6z M12.6,3.3c-0.9-0.9-2.1-1.6-3.5-1.8c0.9,0.8,1.5,1.6,2.1,2.6C11.7,3.9,12.2,3.6,12.6,3.3 M8.3,10.6c0.9,0,1.7,0.2,2.5,0.4c0.4-0.8,0.6-1.7,0.6-2.6H8.3V10.6z M7.5,8.4h-3c0,0.9,0.3,1.8,0.6,2.7c0.8-0.3,1.6-0.4,2.4-0.5V8.4z M4.8,12c-0.5,0.2-0.9,0.4-1.3,0.7c0.9,0.9,2,1.5,3.3,1.7C5.9,13.7,5.3,12.9,4.8,12 M5.5,4.4c0.7,0.2,1.4,0.3,2,0.4V1.9C6.7,2.7,6,3.5,5.5,4.4 M1.5,7.6h2.3c0.1-1,0.3-1.9,0.7-2.8C3.9,4.6,3.3,4.3,2.8,4C2,5,1.5,6.2,1.5,7.6 M2.9,12.1c0.5-0.3,1-0.6,1.5-0.8C4,10.4,3.8,9.4,3.7,8.4H1.5C1.5,9.8,2.1,11.1,2.9,12.1 M7.5,14.1v-2.7c-0.7,0-1.4,0.2-2.1,0.4C6,12.6,6.7,13.4,7.5,14.1 M6.8,1.5C5.5,1.8,4.3,2.4,3.3,3.4c0.5,0.3,0.9,0.5,1.4,0.7C5.3,3.2,6,2.3,6.8,1.5 M7.5,5.5c-0.8,0-1.6-0.2-2.4-0.4C4.8,5.9,4.6,6.7,4.5,7.6h3V5.5z"/></g></svg>' +
    '<a href="GOOGLE_WEBSITE" target="_blank">GOOGLE_WEBSITE_NAME</a>' +
    '</div>'+
    '<div id="slTelephone-PLACEHOLDER_ID" class="slTelephone sl-list-secondary-content-element sl-list-phone" data-id="PLACEHOLDER_ID">' +
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 15.1 15.1" xml:space="preserve"><style type="text/css">.telst0{filter:url(#Adobe_OpacityMaskFilter);}.telst1{fill:#FFFFFF;}.telst2{mask:url(#icon_gg-sl-phone-b);}.telst3{filter:url(#Adobe_OpacityMaskFilter_1_);}.telst4{mask:url(#icon_gg-sl-phone-d);fill:#2A3377;}.telst5{filter:url(#Adobe_OpacityMaskFilter_2_);}.telst6{mask:url(#icon_gg-sl-phone-f);fill:#2A3377;}.telst7{fill:#2A3377;}</style><g transform="translate(.5 -2.228)"><defs><filter id="Adobe_OpacityMaskFilter" filterUnits="userSpaceOnUse" x="-0.5" y="2.2" width="15.1" height="15.1"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter></defs><mask maskUnits="userSpaceOnUse" x="-0.5" y="2.2" width="15.1" height="15.1" id="icon_gg-sl-phone-b"><g class="telst0"><polygon id="icon_gg-sl-phone-a" class="telst1" points="-0.5,0.4 15,0.4 15,17.4 -0.5,17.4 "/></g></mask><g class="telst2"><g transform="translate(0 2)"><g transform="translate(0 1.313)"><defs><filter id="Adobe_OpacityMaskFilter_1_" filterUnits="userSpaceOnUse" x="-0.5" y="0.1" width="13.9" height="13.9"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter></defs><mask maskUnits="userSpaceOnUse" x="-0.5" y="0.1" width="13.9" height="13.9" id="icon_gg-sl-phone-d"><g class="telst3"><polygon id="icon_gg-sl-phone-c" class="telst1" points="-0.5,0.1 13.4,0.1 13.4,14 -0.5,14 "/></g></mask><path class="telst4" d="M13.3,10.4c-0.2-0.7-0.6-1.3-1.1-1.8c-0.5-0.5-1.1-0.9-1.8-1.1l-0.3-0.1L8.3,9.1C7.5,8.6,6.8,8,6.1,7.3C5.5,6.7,4.9,6,4.4,5.3l1.8-1.8L6.1,3.1C5.9,2.5,5.5,1.9,5.1,1.4c-0.7-0.7-1.4-1-1.9-1.2L2.9,0.1l-3.4,3.3l0.1,0.3c0.8,2.3,2.1,4.4,3.8,6.1c1.8,1.8,4,3.2,6.4,4l0.3,0.1l3.3-3.3L13.3,10.4z"/></g><g transform="translate(7.273 .586)"><defs><filter id="Adobe_OpacityMaskFilter_2_" filterUnits="userSpaceOnUse" x="-0.3" y="-0.4" width="7.6" height="7.6"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter></defs><mask maskUnits="userSpaceOnUse" x="-0.3" y="-0.4" width="7.6" height="7.6" id="icon_gg-sl-phone-f"><g class="telst5"><polygon id="icon_gg-sl-phone-e" class="telst1" points="-0.3,-0.4 7.4,-0.4 7.4,7.3 -0.3,7.3 "/></g></mask><path class="telst6" d="M7.3,7.3L6.3,7.2c0-0.5,0.1-2.9-1.8-4.7C2.6,0.6,0.3,0.7-0.2,0.7l-0.1-1.1c0.8-0.1,3.4-0.1,5.5,2C7.5,3.9,7.4,6.7,7.3,7.3"/></g><path class="telst7" d="M12.4,7.7l-1.1-0.1c0-0.3,0.1-1.8-1.1-3C9,3.5,7.5,3.6,7.2,3.6L7.1,2.5c0.5,0,2.3,0,3.8,1.4C12.4,5.4,12.4,7.2,12.4,7.7"/></g></g></g></svg>' +
    '<a href="tel:GOOGLE_PHONE">GOOGLE_PHONE</a>' +
    '</div>'+
    '<div id="slOpeningTimes-PLACEHOLDER_ID" class="sl-list-secondary-content-element sl-opening-times-container">'+
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 15.8 15.8" xml:space="preserve"><style type="text/css">.clst0{fill:none;stroke:#16297C;stroke-width:0.842;}</style><g transform="translate(.5 .5)"><path class="clst0" d="M14.9,7.4c0,4.1-3.4,7.5-7.5,7.5s-7.5-3.3-7.5-7.5c0-4.1,3.3-7.5,7.5-7.5S14.9,3.3,14.9,7.4z"/><polyline class="clst0" points="6.7,3.9 6.7,7.6 10.2,11.1 "/></g></svg>' +
    '<ul id="openingTimes-PLACEHOLDER_ID" class="sl-opening-times-list">' +
    '<li class="slOpeningTime sl-opening-time">GOOGLE_OPENING_TIME1</li>'+
    '<li class="slOpeningTime sl-opening-time">GOOGLE_OPENING_TIME2</li>'+
    '<li class="slOpeningTime sl-opening-time">GOOGLE_OPENING_TIME3</li>'+
    '<li class="slOpeningTime sl-opening-time">GOOGLE_OPENING_TIME4</li>'+
    '<li class="slOpeningTime sl-opening-time">GOOGLE_OPENING_TIME5</li>'+
    '<li class="slOpeningTime sl-opening-time">GOOGLE_OPENING_TIME6</li>'+
    '<li class="slOpeningTime sl-opening-time">GOOGLE_OPENING_TIME7</li>'+
    '</ul>' +
    '<button id="openingTimesControl" data-id="PLACEHOLDER_ID" class="sl-opening-times-trigger expanded"><i class="fa fa-chevron-down" aria-hidden="true"></i></button>'+
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="sl-list-thumbnail" style="background-image: url(GOOGLE_PHOTO_ICON)"></div>' +
    '</li>',

    address_item : '<li id="slAddressItem-PLACEHOLDER_ID" class="sl-list-item slAddressItem" ' +
    'data-id="PLACEHOLDER_ID" ' +
    'data-count="PLACEHOLDER_COUNTER" ' +
    'data-type="PLACEHOLDER_TYPE" ' +
    'data-lat="PLACEHOLDER_LAT" ' +
    'data-lng="PLACEHOLDER_LNG">' +
    '<div class="sl-list-main">' +
    '<div class="sl-list-image" style="background-image: url(PLACEHOLDER_PHOTO_LARGE);">' +
    '<button id="slAddressDetailsBack" data-id="PLACEHOLDER_ID" class="sl-list-back-to-results">' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19.9 19.9"><style type="text/css">.st0{filter:url(#Adobe_OpacityMaskFilter)}.st1{fill:#FFF}.st2{mask:url(#icon_gg-sl-productclosex-b);fill:#FFF}</style><defs><filter filterUnits="userSpaceOnUse" width="19.9" height="19.9"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter></defs><mask maskUnits="userSpaceOnUse" width="19.9" height="19.9"><g class="st0"><polygon class="st1" points="0 0 19.9 0 19.9 19.9 0 19.9 "/></g></mask><path class="st2" d="M14.7 14L14 14.7l-4.1-4.1 -4.1 4.1L5.1 14l4.1-4.1L5.1 5.9l0.7-0.7 4.1 4.1L14 5.1l0.7 0.7 -4.1 4.1L14.7 14zM9.9 0C4.5 0 0 4.5 0 9.9c0 5.5 4.5 9.9 9.9 9.9 5.5 0 9.9-4.5 9.9-9.9C19.9 4.5 15.4 0 9.9 0L9.9 0z"/></svg>' +
    '</button>' +
    '</div>' +
    '<div class="sl-list-highlight">' +
    '<h3 class="sl-list-header">PLACEHOLDER_NAME</h3>' +
    '<div class="sl-list-content">' +
    '<div id="slAddressList-PLACEHOLDER_ID" class="sl-list-address">' +
    '<div class="sl-list-address">' +
    '<span class="sl-list-address-line1">PLACEHOLDER_LINE1</span>' +
    '<span class="sl-list-address-city">PLACEHOLDER_CITY</span>' +
    '<span class="sl-list-address-zipcode">PLACEHOLDER_ZIPCODE</span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div id="slAddressDetails-PLACEHOLDER_ID" class="sl-list-secondary-content">' +
    '<div class="sl-list-secondary-content-element sl-list-direction-link-container">' +
    '<i class="fa fa-map-marker" aria-hidden="true"></i>' +
    '<button class="slDirectionLink sl-direction-link" data-id="PLACEHOLDER_ID">Directions</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="sl-list-thumbnail" style="background-image: url(PLACEHOLDER_ICON)"></div>' +
    '</li>',

    store_info_window_google :
    '<div class="sl-info-window">' +
    '<div class="sl-info-window-image-container">' +
    '<img src="GOOGLE_PHOTO_ICON" alt="PLACEHOLDER_NAME"/>' +
    '</div>' +
    '<div class="sl-info-window-text-container">' +
    '<div class="sl-product-preview-header">' +
    'PLACEHOLDER_NAME' +
    '</div>' +
    '<div class="sl-product-preview-data">'+
    '<div class="sl-product-preview-rating sl-product-preview-rating--GOOGLE_RATING_ROUNDED">GOOGLE_RATING</div>' +
    '<div class="sl-product-preview-review">GOOGLE_REVIEWS_COUNT</div>' +
    '<div class="sl-product-preview-price sl-product-preview-price--GOOGLE_PRICE_LEVEL"><span>GOOGLE_PRICE_LEVEL</span></div>'+
    '</div>'+
    '</div>'+
    '</div>',

    store_info_window :
    '<div class="sl-info-window">'+
    '<div class="sl-info-window-image-container">' +
    '<img src="PLACEHOLDER_ICON" alt="PLACEHOLDER_NAME"/>' +
    '</div>' +
    '<div class="sl-info-window-text-container">' +
    '<div class="sl-product-preview-header">PLACEHOLDER_NAME</div>' +
    '</div>'+
    '</div>',

    product_filter_item :
    '<li class="sl-product-filter-item slProductItem" data-id="PLACEHOLDER_ID">' +
    '<div class="sl-product-filter-image-container"><img src="PLACEHOLDER_IMAGE" alt="PLACEHOLDER_NAME"/></div>'+
    '<button type="button" class="sl-product-filter-button slProductCheckbox active" data-id="PLACEHOLDER_ID"><span class="sl-product-filter-text">PLACEHOLDER_NAME</span></button>' +
    '</li>',

    tour_experience_details :
    '<div class="sl-experience sl-experience--tour">' +
    '<div class="sl-experience__image-container">' +
    '<img class="sl-experience__image" src="PLACEHOLDER_IMAGE" alt="PLACEHOLDER_NAME"/>' +
    '</div>' +
    '<div class="sl-experience__content">' +
    '<div class="sl-experience__name">PLACEHOLDER_NAME</div>' +
    '<div class="sl-experience__desc">PLACEHOLDER_DESC</div>'+
    '<div class="sl-experience__extra">' +
    '<div class="sl-experience__opening">PLACEHOLDER_OPENING_TIMES</div>'+
    '<div class="sl-experience__book">' +
    '<a class="sl-button--experiences" href="PLACEHOLDER_WEBSITE" target="_blank">PLACEHOLDER_BOOK</a>' +
    '</div>'+
    '</div>' +
    '</div>' +
    '</div>',

    event_experience_details :
    '<div class="sl-experience sl-experience--event">' +
    '<div class="sl-experience__image-container">' +
    '<img class="sl-experience__image" src="PLACEHOLDER_IMAGE" alt="PLACEHOLDER_NAME"/>' +
    '</div>' +
    '<div class="sl-experience__content">' +
    '<div class="sl-experience__name">PLACEHOLDER_NAME</div>' +
    '<div class="sl-experience__desc">PLACEHOLDER_DESC</div>'+
    '</div>' +
    '</div>',

    search_div :
    '<div class="button-search-this-area">' +
    '<div>' +
    '<div><i class="fa fa-search" aria-hidden="true"></i> Search this area</div>' +
    '</div>' +
    '</div>'

};
var ANALYTICS_SERVICE = {

    searchDatalayer : {
        search_type : '',
        search_status : '',
        zip : '',
        city : '',
        state: '',
        country : ''
    },
    placeDatalayer : {
        place_id : '',
        place_type : ''
    },
    searchDatalayerType : {
        MANUAL : 'manual',
        GOE_CODE : 'geolocation'
    },
    searchDatalayerStatus : {
        OK : 'ok',
        GEOCODE_FAIL : 'not available',
        NO_RESULTS : 'no results',
        INVALID_COUNTRY : 'invalid country',
        RESTRICTED_STATE : 'restricted state'
    },
    placeDatalayerType : {
        STORE : 'store',
        BAR : 'bar'
    },
    placeDatalayerDefaultPlaceId : 'not available',
    populateSearchDatalayerByAddress : function(searchDatalayer, address) {
        searchDatalayer.zip = address.zip;
        searchDatalayer.city = address.city;
        searchDatalayer.state = address.state;
        searchDatalayer.country = address.country;
    },
    pushSearchEvent : function(searchDatalayer) {

        console.log('pushSearchEvent()');

        console.log('===================================');
        console.log('search type:'+searchDatalayer.search_type);
        console.log('search state:'+searchDatalayer.search_status);
        console.log('city:'+searchDatalayer.city);
        console.log('state:'+searchDatalayer.state);
        console.log('country:'+searchDatalayer.country);
        console.log('zip:'+searchDatalayer.zip);
        console.log('===================================');

        try {
            dataLayer.push({
                event: 'product locator:search',
                search : searchDatalayer
            });
        } catch (e) {
            console.log('WARN: SL-ANALYTICS_SERVICE-8b2c99: Failed to push locator search to GTM due to:'+e);
        }
    },
    getSearchEventStatus : function(storedResults) {
        var status;

        if (RESULTS_SERVICE.hasResults(storedResults)) {
            status = ANALYTICS_SERVICE.searchDatalayerStatus.OK;
        } else {
            status = ANALYTICS_SERVICE.searchDatalayerStatus.NO_RESULTS;
        }

        return status;
    },
    createPlaceDataLayer : function(placeId) {

        var type = '';
        if (NAVIGATION_SERVICE.isBarTabActive()) {
            type = ANALYTICS_SERVICE.placeDatalayerType.BAR;
        } else if (NAVIGATION_SERVICE.isStoreTabActive()) {
            type = ANALYTICS_SERVICE.placeDatalayerType.STORE;
        }

        var placeDataLayer = ANALYTICS_SERVICE.placeDatalayer;
        placeDataLayer.place_id = placeId;
        placeDataLayer.place_type = type;

        return placeDataLayer;
    },
    pushDirectionClickEvent : function(placeDatalayer) {

        console.log('pushDirectionClickEvent() [placeId='+placeDatalayer.place_id+', type='+placeDatalayer.place_type+']');

        try {
            dataLayer.push({
                event: 'product locator:getdirection',
                result : placeDatalayer
            });
        } catch (e) {
            console.log('WARN: SL-ANALYTICS_SERVICE-b450c1: Failed to push locator direction to GTM due to:'+e);
        }
    },
    pushTelephoneClickEvent : function (placeDatalayer) {

        console.log('pushTelephoneClickEvent() [placeId='+placeDatalayer.place_id+', type='+placeDatalayer.place_type+']');

        try {
            dataLayer.push({
                event: 'product locator:call',
                result : placeDatalayer
            });
        } catch (e) {
            console.log('WARN: SL-ANALYTICS_SERVICE-da438ed2: Failed to push locator telephone to GTM due to:'+e);
        }
    }

};