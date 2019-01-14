var STORE_LOCATOR = {
    VERSION: 'v0.1.5',
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
        "STG" : "https://stage-sl.bacardi.com",
        "PROD" : "https://sl.bacardi.com"
    },
    init : function() {

        if (this.checkConfig()) {
            this.AJAX_SERVICE.setBrandConfigAjax();
        } else {
            this.MESSAGES_SERVICE.showSetUpError();
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
        this.MAPS_SERVICE.init();
        this.GEOLOCATION_SERVICE.init();
        this.MESSAGES_SERVICE.init();
        this.AJAX_SERVICE.getProductsAjax();
        this.MESSAGES_SERVICE.setInfoWindowMsg(sl.MESSAGES_SERVICE.getMessages().info.find_stores);
    },
    addEventListeners : function () {

        console.log('addEventListeners');

        var barDiv = document.getElementById('slBarContainer');
        var storeDiv = document.getElementById('slStoreContainer');

        var navLinks = $('.slNavLink'); // Bars/Stores
        var subNavLinks = $('.slSubNavLink'); // Map/List/Filter/Back
        var backLink = $('#slFilterBack');

        var showAll = $('#slFilterToggleAll');

        // Search Form
        var searchForm = document.getElementById('slSearchForm');
        if(searchForm.addEventListener) {
            searchForm.addEventListener("submit", this.SEARCH_SERVICE.searchByAddress, false);  // Modern browsers
        } else if(searchForm.attachEvent) {
            searchForm.attachEvent('onsubmit', this.SEARCH_SERVICE.searchByAddress);            // Old IE
        }

        // Tabs - Bars/Stores
        navLinks.click(function() {

            var clickedId = $(this).attr('id');
            console.log('Tab click:'+clickedId);
            if ('navLinkBars' === clickedId && !$(this).hasClass('active')) {
                barDiv.style.display = 'block';
                storeDiv.style.display = 'none';
            } else if ('navLinkStores' === clickedId && !$(this).hasClass('active')) {
                storeDiv.style.display = 'block';
                barDiv.style.display = 'none';
            } else {
                console.log('INFO: SL-TAB-48be170: Tab already active:'+clickedId);
                return;
            }

            navLinks.removeClass('active');
            $(this).addClass('active');

            sl.FILTER_SERVICE.populateFilteredResults();
        });

        // Sub nav - Map/List/Filter/Back
        subNavLinks.on('click', function () {

            if (sl.SEARCH_SERVICE.getSearchResults() === undefined) {
                sl.COMMON_SERVICE.showNoStoreView();
                return;
            }

            var whichSection = $(this).data('href');
            if (whichSection !== undefined) {
                $('#slContainer').removeClass().addClass('sl-container ' + whichSection);
            }
        });

        // Filter - Toggle all
        showAll.on('click', function() {

            var showAllBtn = $(this);

            var isActive = showAllBtn.hasClass('active');

            if (isActive) {
                showAllBtn.removeClass('active');
                $('#slContainer').addClass('sl-container--filter-disabled');
            } else {
                showAllBtn.addClass('active');
                $('#slContainer').removeClass('sl-container--filter-disabled');
            }

            isActive = showAllBtn.hasClass('active');

            if (isActive) {
                navLinks.removeAttr("disabled");
                subNavLinks.removeAttr("disabled");
                $('.slFilterItem').addClass('active');
                sl.MESSAGES_SERVICE.clearFilterMessage();
            } else {
                navLinks.attr("disabled", "disabled");
                subNavLinks.attr("disabled", "disabled");
                $('.slFilterItem').removeClass('active');
                sl.MESSAGES_SERVICE.showFilterNoProduct();
            }

            sl.FILTER_SERVICE.populateFilteredResults();
        });

        // Filter - Item Row
        $(document).on('click', '.slFilterItem', function() {

            var filterBtn = $(this);

            if(filterBtn.hasClass('active')) {
                filterBtn.removeClass('active');
            } else {
                filterBtn.addClass('active');
            }

            var totalCount = $('.slFilterItem').length;
            var activeCount = $('.slFilterItem.active').length;

            if (totalCount === activeCount) {
                showAll.addClass('active');
            } else {
                showAll.removeClass('active');
            }

            if (activeCount === 0) {
                $('#slContainer').addClass('sl-container--filter-disabled');
                navLinks.attr("disabled", "disabled");
                subNavLinks.attr("disabled", "disabled");
                sl.MESSAGES_SERVICE.showFilterNoProduct();
            } else {
                $('#slContainer').removeClass('sl-container--filter-disabled');
                navLinks.removeAttr("disabled");
                subNavLinks.removeAttr("disabled");
                sl.MESSAGES_SERVICE.clearFilterMessage();
            }

            sl.FILTER_SERVICE.populateFilteredResults();
        });

        // Filter Back
        backLink.on('click', function () {
            console.log('filter back button');
            $('#slContainer').removeClass().addClass('sl-container sl-container--map');
            if (sl.COMMON_SERVICE.isBarTabActive()) {
                barDiv.style.display = 'block';
            } else if (sl.COMMON_SERVICE.isStoreTabActive()) {
                storeDiv.style.display = 'block';
            }
        });

        // Geolocation
        $('#slUserLocationBtn').on('click', function() {
            sl.GEOLOCATION_SERVICE.geocodeUserLocation();
        });

        // Direction
        $(document).on('click', '.sl-direction-link', function() {
            sl.DIRECTION_SERVICE.openExternalMap($(this).data('id'));
        });

        // Address Item
        $(document).on('click', '.slAddressItem', function() {
            var count = $(this).attr('data-count');
            var type = $(this).attr('data-type');
            var lat = $(this).attr('data-lat');
            var lng = $(this).attr('data-lng');
            sl.COMMON_SERVICE.containerChange('map');
            sl.COMMON_SERVICE.scrollToTop();
            sl.MAPS_SERVICE.animateMarkerAndShowInfoWindow(type, count, lat, lng);
        });

        $('.sl-map-expand-button').on('click', function() {
            $('#slContainer').toggleClass('expandMap');
        });
    },
    AJAX_SERVICE :  {

        setBrandConfigAjax : function() {

            var endpoint = sl.AJAX_SERVICE.getEndpoint();
            var brandName = sl.BRAND_SERVICE.getBrandName();
            var url = endpoint+'/brand/'+brandName;
            console.log('Ajax: '+url);

            $.getJSON(url)
            .done(function(data) {
                console.log('setBrandConfigAjax() success');
                sl.BRAND_SERVICE.saveBrandConfig(data);
                sl.AJAX_SERVICE.loadTemplate();
            })
            .fail(function() {
                console.log('ERROR: SL-BRAND-CONFIG-aba0605: Failed to get brand config at:'+url);
                sl.MESSAGES_SERVICE.showSetUpError();
            });
        },
        loadTemplate : function() {

            var buildType = sl.config.build;

            if (buildType === 'embedded') {
                sl.AJAX_SERVICE.loadTemplateEmbedded();
            } else if(buildType === 'dynamic') {
                sl.AJAX_SERVICE.loadTemplateDynamic();
            } else if (buildType === 'static') {
                sl.AJAX_SERVICE.loadTemplateStatic();
            }
        },
        loadTemplateEmbedded : function() {
            console.log('loadTemplateEmbedded()');
            document.getElementById('sl-store-locator').innerHTML = sl.HTML_TEMPLATES.main_template;
            sl.boot();
        },
        loadTemplateDynamic : function() {

            var url = sl.AJAX_SERVICE.getTemplateURL();
            console.log('Ajax: '+url);

            $.get(url)
            .done(function(html) {
                console.log('loadTemplateDynamic()');
                document.getElementById('sl-store-locator').innerHTML = html;
                sl.boot();
            })
            .fail(function() {
                console.log('ERROR: SL-TEMPLATE-c17051e: Failed to load template at:'+url);
                sl.MESSAGES_SERVICE.showTemplateLoadError();
            });
        },
        loadTemplateStatic : function() {
            console.log('loadTemplateStatic()');
            sl.boot();
        },
        getProductsAjax: function() {

            var endpoint = sl.AJAX_SERVICE.getEndpoint();
            var brandId = sl.BRAND_SERVICE.getBrandId();
            var url = endpoint+'/brand/'+brandId+'/products/';
            console.log('Ajax: '+url);

            $.getJSON(url)
            .done(function(data) {
                console.log('getProductsAjax() success');
                sl.FILTER_SERVICE.init(data);
            })
            .fail(function() {
                console.log('ERROR: SL-PRODUCT-bc7b5e1: Failed to get products via url:'+url);
            });
        },
        searchLocationAjax : function(location) {

            if (location !== undefined) {

                var endpoint = sl.AJAX_SERVICE.getEndpoint();
                var brandId = sl.BRAND_SERVICE.getBrandId();
                var lat = location.lat;
                var lng = location.lng;
                var url = endpoint+'/search/location/?brandId='+brandId+'&lat='+lat+'&lng='+lng;
                sl.MESSAGES_SERVICE.showSearchInProgress();
                console.log('Ajax: '+url);

                $.getJSON(url)
                .done(function(data) {
                    console.log('searchLocationAjax() success');
                    sl.MESSAGES_SERVICE.hideSearchInProgress();
                    sl.SEARCH_SERVICE.processSearch(data);
                    sl.SEARCH_SERVICE.storeSearch(data);
                })
                .fail(function() {
                    console.log('ERROR: SL-SEARCH-LOCATION-4ca01f3: Failed to perform location search:'+url);
                    sl.MESSAGES_SERVICE.hideSearchInProgress();
                    sl.COMMON_SERVICE.showNoStoreView();
                });
            }
        },
        getTemplateURL : function() {

            if (sl.config.env === 'DEV' || sl.config.env === 'UI') {
                return 'http://localhost:3000/templates/'+sl.config.brand+'.html';
            }

            return sl.BRAND_SERVICE.getBrandConfig().template;
        },
        getEndpoint : function () {

            var host = sl.AJAX_SERVICE.getHost(sl.config.env);
            var api = sl.api.endpoint;
            var version = sl.api.version;

            return host+version+api;
        },
        getHost : function(env) {

            switch(env) {
                case "DEV":
                    return sl.host.DEV;
                case "UI":
                    return sl.host.UI;
                case "QA":
                    return sl.host.QA;
                case "STG":
                    return sl.host.STG;
                default:
                    return sl.host.PROD;
            }
        }
    },
    BRAND_SERVICE : {
        brandConfigJSON : undefined,
        getBrandConfig : function() {
            return sl.BRAND_SERVICE.brandConfigJSON;
        },
        saveBrandConfig : function(configJson) {
            sl.BRAND_SERVICE.brandConfigJSON = configJson
        },
        getBrandId : function () {
            return sl.BRAND_SERVICE.getBrandConfig().id;
        },
        getBrandName : function () {
            return sl.config.brand;
        }
    },
    FILTER_SERVICE : {

        init: function(productsJSON) {

            console.log('filter init()');

            var filterItems = '';
            var products = productsJSON.products;

            $.each(products, function (index) {

                var id = products[index].id;
                var name = products[index].name;

                var item = sl.HTML_TEMPLATES.filter_item;
                item = item.replace('PLACEHOLDER_NAME', name);
                item = item.replace('PLACEHOLDER_ID', id);

                filterItems = filterItems+item.trim();
            });

            $('#slFilter')[0].innerHTML = filterItems;
            $('#slFilterCount').text(products.length+' '+sl.MESSAGES_SERVICE.getMessages().filter.products);
        },
        populateFilteredResults : function() {

            console.log('populateFilteredResults()');

            var totalCount = $('.slFilterItem').length;
            var activeCount = $('.slFilterItem.active').length;

            var searchResults = sl.SEARCH_SERVICE.getSearchResults();
            var filteredResults  = {"stores": [], "bars" : []};

            if (totalCount === activeCount) {
                filteredResults = searchResults;
            } else if (activeCount === 0) {
                filteredResults.bars = [];
                filteredResults.stores = [];
            } else {
                var productIds = sl.FILTER_SERVICE.getSelectedProductIds();
                filteredResults.bars = sl.FILTER_SERVICE.getMatchingAddresses(searchResults.bars, productIds);
                filteredResults.stores = sl.FILTER_SERVICE.getMatchingAddresses(searchResults.stores, productIds);
            }

            sl.SEARCH_SERVICE.processSearch(filteredResults, true);
        },
        getSelectedProductIds : function() {

            var productIds = [];

            $.each($('.slFilterItem.active'), function() {
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
        resetFilter : function() {
            console.log('resetFilter()');
            sl.MESSAGES_SERVICE.clearFilterMessage();
            $('#slFilterToggleAll').addClass('active');
            $('.slFilterItem').addClass('active');
        }
    },
    SEARCH_SERVICE : {
        searchResultJSON : undefined,
        searchByAddress : function(e) {
            console.log('searchByAddress()');
            e.preventDefault();
            sl.COMMON_SERVICE.scrollToTop();
            var address = $('#slSearchText').val();
            if (address !== undefined) {
                $('.slNavLink').removeAttr('disabled');
                $('.slSubNavLink').removeAttr('disabled');

                var geocoder = sl.GEOLOCATION_SERVICE.geocoder;

                geocoder.geocode( { 'address': address} , function (results, status) {
                    sl.GEOLOCATION_SERVICE.processGeocodeResult(results, status)
                });
            }
        },
        searchByGeocode : function(location) {

            sl.COMMON_SERVICE.scrollToTop();

            var geocoder = sl.GEOLOCATION_SERVICE.geocoder;

            geocoder.geocode({'location': location}, function(results, status) {
                sl.GEOLOCATION_SERVICE.processGeocodeResult(results, status);
            });
        },
        processSearch : function(searchResultJSON, isFilterSearch, msg) {

            sl.MAPS_SERVICE.clearMapMarkers();
            sl.ADDRESS_SERVICE.clearAddresses();

            if (!isFilterSearch) {
                sl.FILTER_SERVICE.resetFilter();
            }

            if (sl.SEARCH_SERVICE.hasResults(searchResultJSON)) {

                console.log('processSearch bar('+searchResultJSON.bars.length+') stores('+searchResultJSON.stores.length+')');

                sl.COMMON_SERVICE.activateTab(searchResultJSON);
                sl.MAPS_SERVICE.addMarkers(searchResultJSON);
                sl.ADDRESS_SERVICE.populateAddresses(searchResultJSON);
                sl.COMMON_SERVICE.updateCount(searchResultJSON);
                sl.MAPS_SERVICE.centreMap(searchResultJSON);

                if (!$('#slContainer').hasClass('sl-container--filter')) {
                    sl.COMMON_SERVICE.containerChange('map');
                }

            } else {
                console.log('processSearch() no result: '+isFilterSearch);

                sl.COMMON_SERVICE.updateCount(undefined);

                if (!isFilterSearch) {
                    sl.MAPS_SERVICE.resetMapCentre();

                    if (msg === undefined) {
                        msg = sl.MESSAGES_SERVICE.getMessages().info.no_stores;
                    }
                    sl.MESSAGES_SERVICE.setInfoWindowMsg(msg);

                    sl.COMMON_SERVICE.containerChange('info');
                }
            }
        },
        storeSearch : function(searchResultJSON) {
            sl.SEARCH_SERVICE.searchResultJSON = searchResultJSON;
        },
        hasResults : function (searchResultJSON) {
            return (searchResultJSON !== undefined &&
                (searchResultJSON.stores !== undefined && searchResultJSON.bars !== undefined) &&
                (searchResultJSON.stores.length > 0 || searchResultJSON.bars > 0));
        },
        getSearchResults : function() {

            if (sl.SEARCH_SERVICE.searchResultJSON !== undefined) {
                return sl.SEARCH_SERVICE.searchResultJSON;
            }

            return undefined;
        }
    },
    MAPS_SERVICE: {

        map : undefined,
        mapBarMarkers : [],
        mapStoreMarkers : [],
        mapInfoWindow : undefined,

        init: function () {

            console.log('map init');

            var mapDiv = document.getElementById('sl-map');

            var brandConfig = sl.BRAND_SERVICE.getBrandConfig();
            var zoom = brandConfig.map.zoom;
            var lat = brandConfig.map.lat;
            var lng = brandConfig.map.lng;

            // Map options
            var options = {
                zoom: zoom,
                center:{lat:lat, lng:lng},
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false
            };

            // New map
            sl.MAPS_SERVICE.map = new google.maps.Map(mapDiv, options);
        },
        centreMap : function(searchResultJSON) {

            var centreLocation = undefined;
            var userLocation = sl.GEOLOCATION_SERVICE.userLocation;
            if (sl.COMMON_SERVICE.isBarTabActive()) {
                centreLocation = {
                    lat: searchResultJSON.bars[0].latitude,
                    lng: searchResultJSON.bars[0].longitude
                };
            } else if (sl.COMMON_SERVICE.isStoreTabActive()) {
                centreLocation = {
                    lat: searchResultJSON.stores[0].latitude,
                    lng: searchResultJSON.stores[0].longitude
                };
            }

            if (userLocation === undefined) {
                userLocation = centreLocation;
            }

            var zoom = sl.COMMON_SERVICE.calculateZoomLevel(userLocation.lat, userLocation.lng, centreLocation.lat, centreLocation.lng);

            var map = sl.MAPS_SERVICE.map;
            map.setCenter(centreLocation);
            map.setZoom(zoom);
        },
        resetMapCentre : function() {
            console.log('resetMapCentre()');
            var brandConfig = sl.BRAND_SERVICE.getBrandConfig();
            var lat = brandConfig.map.lat;
            var lng = brandConfig.map.lng;
            var zoom = brandConfig.map.zoom;

            var location = {
                lat: lat,
                lng: lng
            };

            var map = sl.MAPS_SERVICE.map;
            map.setCenter(location);
            map.setZoom(zoom);
        },
        addMarkers : function(searchResultJSON) {

            if (sl.COMMON_SERVICE.isBarTabActive()) {
                console.log('addMarkers > bars('+searchResultJSON.bars.length+')');
                sl.MAPS_SERVICE.mapBarMarkers = [];
                sl.MAPS_SERVICE.addMapMarkers(searchResultJSON.bars, sl.MAPS_SERVICE.mapBarMarkers);
            } else if (sl.COMMON_SERVICE.isStoreTabActive()) {
                console.log('addMarkers > stores('+searchResultJSON.stores.length+')');
                sl.MAPS_SERVICE.mapStoreMarkers = [];
                sl.MAPS_SERVICE.addMapMarkers(searchResultJSON.stores, sl.MAPS_SERVICE.mapStoreMarkers);
            }

        },
        addMapMarkers : function(locations, markersArray) {

            var map = sl.MAPS_SERVICE.map;

            if (locations !== undefined && locations.length > 0 && map !== undefined) {

                for(var i = 0;i < locations.length; i++){
                    var marker = this.addMapMarker(map, locations[i]);
                    markersArray.push(marker);
                }
            }
        },
        addMapMarker : function (map, location) {

            var iconUrl = sl.BRAND_SERVICE.getBrandConfig().map.iconUrl !== undefined ? sl.BRAND_SERVICE.getBrandConfig().map.iconUrl : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';

            var marker =  new google.maps.Marker({
                position: {lat:location.latitude, lng: location.longitude},
                map: map,
                title : location.name,
                icon: {
                    url: iconUrl
                }
            });

            google.maps.event.addListener(marker, 'click', function() {

                if (sl.MAPS_SERVICE.mapInfoWindow !== undefined) {
                    sl.MAPS_SERVICE.mapInfoWindow.close();
                }

                sl.MAPS_SERVICE.mapInfoWindow = sl.MAPS_SERVICE.createInfoWindow(location);
                sl.MAPS_SERVICE.mapInfoWindow.open(map, marker);
            });

            return marker;
        },
        createInfoWindow : function(location) {

            var contentString = "<div class='sl-info-window'>" +
                "<span>"+location.name+"</span><br/>" +
                "<span>"+location.address.line1+"</span><br/>" +
                "<span>"+location.address.city+"</span><br/>" +
                "<span>"+location.address.zipcode+"</span><br/>" +
                "<span><a href='#' class='sl-direction-link' data-id='"+location.id+"'>Directions</a></span>" +
                "</div>";

            return new google.maps.InfoWindow({
                content: contentString
            });

        },
        clearMapMarkers : function() {

            console.log('clearMapMarkers()');

            for (var i = 0; i < sl.MAPS_SERVICE.mapBarMarkers.length; i++) {
                sl.MAPS_SERVICE.mapBarMarkers[i].setMap(null);
            }
            sl.MAPS_SERVICE.mapBarMarkers = [];

            for (var j = 0; j < sl.MAPS_SERVICE.mapStoreMarkers.length; j++) {
                sl.MAPS_SERVICE.mapStoreMarkers[j].setMap(null);
            }
            sl.MAPS_SERVICE.mapStoreMarkers = [];
        },
        animateMarkerAndShowInfoWindow : function (type, count, lat, lng) {

            console.log('animateMarkerAndShowInfoWindow:'+type+'>'+count);

            var markers = undefined;
            if ('stores' === type) {
                markers = sl.MAPS_SERVICE.mapStoreMarkers;
            } else if ('bars' === type) {
                markers = sl.MAPS_SERVICE.mapBarMarkers;
            }

            for (var i=0; i < markers.length; i++) {
                markers[i].setAnimation(null);
            }

            var location = {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            };

            var map = sl.MAPS_SERVICE.map;
            map.setCenter(location);

            var marker = markers[count];
            marker.setAnimation(google.maps.Animation.BOUNCE);
            google.maps.event.trigger(marker, 'click');

            setTimeout(function () {
                marker.setAnimation(null);
            }, 1000);
        }

    },
    GEOLOCATION_SERVICE : {

        geocoder : undefined,
        userLocation : {},
        init : function() {
            console.log('geo init');
            sl.GEOLOCATION_SERVICE.geocoder = new google.maps.Geocoder();

            setTimeout(function () {
                sl.GEOLOCATION_SERVICE.geocodeUserLocation();
            }, 2000);
        },
        geocodeUserLocation : function() {

            var map = sl.MAPS_SERVICE.map;

            // Try HTML5 geolocation.
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    if (sl.config.env === 'DEV' || sl.config.env === 'UI') {
                        console.log('INFO: SL-GEOLOCATION-937bd65: Altering lat/lng for testing environment original:[lat='+userLocation.lat+', lng'+userLocation.lng+']');
                        userLocation = {
                            lat: 28.404010,
                            lng: -81.576900
                        };
                    }

                    map.setCenter(userLocation);
                    map.setZoom(12);

                    sl.GEOLOCATION_SERVICE.userLocation = userLocation;
                    sl.SEARCH_SERVICE.searchByGeocode(userLocation);
                }, function() {
                    console.log('INFO: SL-GEOLOCATION-9e42d93: User rejected location request or Geolocation service failed.');
                });
            } else {
                console.log('INFO: SL-GEOLOCATION-c60b105: Browser does not support geolocation.');
            }
        },
        processGeocodeResult : function(results, status) {
            var location = undefined;

            if (status === 'OK' && results.length > 0) {

                if (!sl.GEOLOCATION_SERVICE.isValidCountry(results)) {
                    sl.COMMON_SERVICE.processInvalidCountry();
                } else if (!sl.GEOLOCATION_SERVICE.isPermittedState(results)) {
                    sl.COMMON_SERVICE.processRestrictedState();
                } else {
                    location = results[0].geometry.location;
                    var addressLocation = {
                        lat: location.lat(),
                        lng: location.lng()
                    };

                    sl.GEOLOCATION_SERVICE.userLocation = addressLocation;
                    sl.AJAX_SERVICE.searchLocationAjax(addressLocation);
                }

            } else {
                console.log('WARN: SL-GEOLOCATION-2444f96: Geolocation failed for address search with status:'+status);
                sl.COMMON_SERVICE.showNoStoreView();
            }
        },
        getStateCode : function(data) {

            try {

                var addressComponents = data.address_components;
                for (var i=0; i<addressComponents.length; i++) {
                    if (addressComponents[i].types[0] === 'administrative_area_level_1' || addressComponents[i].types[1] === 'administrative_area_level_1') {
                        return addressComponents[i].short_name;
                    }
                }

            } catch (err) {
                console.log('WARN: SL-GEOLOCATION-563fe2e: Geolocation unable to get state code for address.');
            }

            return '';
        },
        getCountryCode : function(data) {
            try {

                var addressComponents = data.address_components;
                for (var i=0; i<addressComponents.length; i++) {
                    if (addressComponents[i].types[0] === 'country' || addressComponents[i].types[1] === 'country') {
                        return addressComponents[i].short_name;
                    }
                }

            } catch (err) {
                console.log('WARN: SL-GEOLOCATION-58f986: Geolocation unable to get country for address.');
            }

            return '';
        },
        isValidCountry : function(results) {
            var countryCode = sl.GEOLOCATION_SERVICE.getCountryCode(results[0]);

            console.log('INFO: SL-GEOLOCATION-c690617: Geolocation detected country code:['+countryCode+']');

            return countryCode === sl.BRAND_SERVICE.getBrandConfig().country;
        },
        isPermittedState : function(results) {

            var stateCode = sl.GEOLOCATION_SERVICE.getStateCode(results[0]);

            console.log('INFO: SL-GEOLOCATION-5ae1cf2: Geolocation detected state:['+stateCode+']');

            if (stateCode === undefined || stateCode === '') {
                return false;
            }

            var config = sl.BRAND_SERVICE.getBrandConfig();
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
    },
    DIRECTION_SERVICE : {

        openExternalMap : function (addressId) {

            var address = sl.COMMON_SERVICE.getAddressById(addressId);
            if (address === undefined) {
                console.log('WARN: SL-ADDRESS-aa4419a: Failed to perform location search:'+url);
                return;
            }

            var daddr = address.latitude+","+address.longitude;

            var saddr = "";
            var location = sl.GEOLOCATION_SERVICE.userLocation;
            if (location !== undefined) {
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
    },
    MESSAGES_SERVICE : {

        messages : undefined,
        init : function () {
            console.log('messages init');
            var json = $('#slMessagesJson').text();
            sl.MESSAGES_SERVICE.messages = JSON.parse(json);
        },
        showSetUpError : function() {
            var html = 'Store locator unavailable.';
            document.getElementById('sl-store-locator').innerHTML = '<h1>'+html+'</h1>';
        },
        setInfoWindowMsg : function(msg) {
            document.getElementById('slInfoMessageContainer').innerHTML = msg;
        },
        showFilterNoProduct : function() {
            document.getElementById('slFilterMessage').innerHTML = sl.MESSAGES_SERVICE.getMessages().filter.select_product;
        },
        showTemplateLoadError : function() {
            var msg = "<div>Store Locator unavailable</div>";
            if (sl.MESSAGES_SERVICE.getMessages() !== undefined) {
                msg = sl.MESSAGES_SERVICE.getMessages().error.template_load;
            }
            document.getElementById('sl-store-locator').innerHTML = msg;
        },
        showSearchInProgress : function() {
            $('#slSearchInProgress').addClass('show');
        },
        hideSearchInProgress : function() {
            $('#slSearchInProgress').removeClass('show');
        },
        clearFilterMessage : function() {
            document.getElementById('slFilterMessage').innerHTML = '';
        },
        getMessages : function() {
            return sl.MESSAGES_SERVICE.messages;
        }
    },
    ADDRESS_SERVICE : {

        populateAddresses : function (searchResultsJSON) {

            var containerDiv = undefined;
            var locations = undefined;
            var type;
            if (sl.COMMON_SERVICE.isBarTabActive()) {
                console.log('populateAddresses() > bar('+searchResultsJSON.bars.length+')');
                containerDiv = $('#slBarContainer');
                locations = searchResultsJSON.bars;
                type = 'bars';
            } else if(sl.COMMON_SERVICE.isStoreTabActive()) {
                console.log('populateAddresses() > stores('+searchResultsJSON.stores.length+')');
                containerDiv = $('#slStoreContainer');
                locations = searchResultsJSON.stores;
                type = 'stores';
            }

            var htmlTemplate = sl.HTML_TEMPLATES.address_item;

            var addressFragments = '';
            $.each(locations, function (index) {

                var location =  locations[index];

                var item = htmlTemplate;
                item = item.replace('PLACEHOLDER_ID', location.id)
                .replace('PLACEHOLDER_LAT', location.latitude)
                .replace('PLACEHOLDER_LNG', location.longitude)
                .replace('PLACEHOLDER_NAME', location.name)
                .replace('PLACEHOLDER_LINE1', location.address.line1)
                .replace('PLACEHOLDER_CITY', location.address.city)
                .replace('PLACEHOLDER_ZIPCODE', location.address.zipcode)
                .replace('PLACEHOLDER_TYPE', type)
                .replace('PLACEHOLDER_COUNTER', index)
                .replace('PLACEHOLDER_PHONE', sl.COMMON_SERVICE.formatPhone(location.address.phone));

                addressFragments = addressFragments+item.trim();
            });

            containerDiv[0].innerHTML = addressFragments;
        },
        clearAddresses : function() {
            console.log('clearAddresses()');
            $('#slBarContainer').html('');
            $('#slStoreContainer').html('');
        }
    },
    COMMON_SERVICE : {

        isBarTabActive : function() {
            return $('#navLinkBars').hasClass('active');
        },
        isStoreTabActive : function() {
            return $('#navLinkStores').hasClass('active');
        },
        getAddressById : function (addressId) {

            var stores = sl.SEARCH_SERVICE.getSearchResults().stores;
            var bars = sl.SEARCH_SERVICE.getSearchResults().bars;

            var addresses = stores.concat(bars);
            var foundAddress = undefined;
            $.each(addresses, function(index, address){
                if (address.id === addressId) {
                    foundAddress = address;
                    return false;
                }
            });

            return foundAddress;
        },
        showNoStoreView : function() {
            sl.MESSAGES_SERVICE.setInfoWindowMsg(sl.MESSAGES_SERVICE.getMessages().info.no_stores);
            sl.COMMON_SERVICE.containerChange('info');
        },
        updateCount : function (searchResultJSON) {

            var stores = 0;
            var bars = 0;

            if (searchResultJSON !== undefined && searchResultJSON.stores !== undefined && searchResultJSON.bars !== undefined) {
                stores = searchResultJSON.stores.length;
                bars = searchResultJSON.bars.length;
            }

            $('#storesCount').html(' ('+stores+')');
            $('#barsCount').html(' ('+bars+')');
        },
        processRestrictedState : function() {
            console.log('processRestrictedState()');
            sl.SEARCH_SERVICE.processSearch(undefined, false, sl.MESSAGES_SERVICE.getMessages().info.restricted_state);
        },
        processInvalidCountry : function() {
            sl.SEARCH_SERVICE.processSearch(undefined, false, sl.MESSAGES_SERVICE.getMessages().info.invalid_country);
        },
        containerChange : function(type) {
            console.log('containerChange:'+type);
            var container = 'sl-container--'+type;
            $('#slContainer').removeClass().addClass('sl-container '+container);
        },
        activateTab : function(searchResultJSON) {

            var barsCount = searchResultJSON.bars.length;
            var storeCount = searchResultJSON.stores.length;

            var barDiv = document.getElementById('slBarContainer');
            var storeDiv = document.getElementById('slStoreContainer');

            if (sl.COMMON_SERVICE.isBarTabActive() && barsCount !== 0) {
                storeDiv.style.display = 'none';
                barDiv.style.display = 'block';
                $('#navLinkBars').addClass('active');
                $('#navLinkStores').removeClass('active');
            } else if (sl.COMMON_SERVICE.isStoreTabActive() && storeCount !== 0) {
                storeDiv.style.display = 'block';
                barDiv.style.display = 'none';
                $('#navLinkBars').removeClass('active');
                $('#navLinkStores').addClass('active');
            } else if (barsCount !== 0) {
                storeDiv.style.display = 'none';
                barDiv.style.display = 'block';
                $('#navLinkBars').addClass('active');
                $('#navLinkStores').removeClass('active');
            } else if (storeCount !== 0){
                storeDiv.style.display = 'block';
                barDiv.style.display = 'none';
                $('#navLinkBars').removeClass('active');
                $('#navLinkStores').addClass('active');
            }

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
            var distance = sl.COMMON_SERVICE.calculateDistance(lat1, lng1, lat2, lng2);

            var zoom = 13;
            if (distance < 1 ) {
                zoom = 15;
            } else if (distance >= 5 && distance <= 30) {
                zoom = 11;
            } else if (distance >= 31) {
                zoom = 9;
            }

            var width = $(window).width();
            if (width < 400) {
                zoom = zoom - 2;
            }

            console.log('distance:'+distance + ' width:'+width+ ' zoom:'+zoom);

            return zoom;
        }
    },
    HTML_TEMPLATES : {

        main_template: '@@MAIN_TEMPLATE',
        filter_item : ' <li class="sl-filter-item">' +
        '<button type="button" class="sl-filter-button slFilterItem active" data-id="PLACEHOLDER_ID">PLACEHOLDER_NAME</button>' +
        '</li>',

        address_item : '<li class="sl-list-item slAddressItem" data-count="PLACEHOLDER_COUNTER" data-type="PLACEHOLDER_TYPE" data-lat="PLACEHOLDER_LAT" data-lng="PLACEHOLDER_LNG">' +
        '<h3 class="sl-list-header">PLACEHOLDER_NAME</h3>' +
        '<div class="sl-list-content">' +
        '<div class="sl-list-address">' +
        '<span>PLACEHOLDER_LINE1</span><br>' +
        '<span>PLACEHOLDER_CITY PLACEHOLDER_ZIPCODE</span><br/>' +
        '<span>PLACEHOLDER_PHONE</span>' +
        '</div>' +
        '<button class="sl-direction-link" data-id="PLACEHOLDER_ID">Directions</button>' +
        '</div>' +
        '</li>'
    }
};
var sl = STORE_LOCATOR;