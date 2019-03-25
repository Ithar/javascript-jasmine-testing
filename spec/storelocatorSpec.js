describe("A test 'STORE LOCATOR' test suite", function () {

    beforeAll(function() {

        var configDiv = UI_COMPONENTS.createConfigDiv();
        var filterDiv =  UI_COMPONENTS.createFilterDiv();
        var filterCounterDiv =  UI_COMPONENTS.createFilterCounterDiv();

        var body = document.getElementsByTagName('body')[0];
        body.appendChild(configDiv);
        body.appendChild(filterDiv);
        body.appendChild(filterCounterDiv);

    });

    beforeEach(function() {
        jasmine.Ajax.install();
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    // 1. Basic Function
    describe('Example 1: Basic Functions test suite:', function(){
        it("COMMON_SERVICE.calculateZoomLevel(): calculate the zoom levels", function() {
            var location1 = {
                lat : 40.581766,
                lng : -73.961525
            };

            var location2 = {
                lat : 40.586217,
                lng : -73.971503
            };

            var actual = COMMON_SERVICE.calculateZoomLevel(location1.lat, location1.lng, location2.lat, location2.lng);
            var expected = 14;
            expect(actual).toEqual(expected);

        });
    });

    // 2. DOM Dependent Function
    describe('Example 2: DOM Dependent Function test suite:', function(){
        it("main.checkConfig(): check store locator DOM config", function() {
            var actual = STORE_LOCATOR.checkConfig();
            var expected = true;
            expect(actual).toEqual(expected);
        });
    });

    // 3. Ajax Function
    describe('Example 3: Ajax Function test suite:', function(){
        it("AJAX_SERVICE.getProductsAjax() check product filter Ajax ", function() {

            spyOn(BRAND_SERVICE, 'getBrandConfig').and.returnValue(MOCKED_DATA.brand());
            spyOn(BRAND_SERVICE, 'getBrandId').and.returnValue(3);
            spyOn(AJAX_SERVICE, 'getEndpoint').and.returnValue('https://bacardi.com/v3/api');
            spyOn(MESSAGES_SERVICE, 'getMessages').and.returnValue(MOCKED_DATA.messages());

            var endpoint = AJAX_SERVICE.getEndpoint();
            var brandId = BRAND_SERVICE.getBrandId();

            var url = endpoint+'/brand/'+brandId+'/products/';
            expect(url).toEqual('https://bacardi.com/v3/api/brand/3/products/');

            spyOn($, 'getJSON').and.callFake(function() {
                var deferred = $.Deferred();
                deferred.resolve(
                    MOCKED_DATA.products()
                );
                return deferred;
            });

            AJAX_SERVICE.getProductsAjax();

            var actual = $('#slProductFilterCount').html();
            var expected = '3 ' + MOCKED_DATA.messages().product_filter.products;
            expect(actual).toEqual(expected);
        });
    });

    // 4. Promises

});

var UI_COMPONENTS = {

    createConfigDiv : function() {

        var id = 'sl-store-locator';
        var css = undefined;

        var dataAttributes = {};
        dataAttributes.env = 'QA';
        dataAttributes.brand = 'greygooseUS';
        dataAttributes.build= 'static';

        return UI_COMPONENTS.factoryDiv(id, css, dataAttributes);
    },
    createFilterDiv : function() {
        var id = 'slProductFilter';
        return UI_COMPONENTS.factoryDiv(id, undefined, undefined);
    },
    createFilterCounterDiv : function() {
        var id = 'slProductFilterCount';
        return UI_COMPONENTS.factoryDiv(id, undefined, undefined);
    },
    factoryDiv : function (id, cssClasses, dataAttributes) {
        var element = document.createElement("div");

        if (id !== undefined) {
            element.id = id;
        }

        if (cssClasses !== undefined) {
            element.classList.add(cssClasses);
        }

        if (dataAttributes !== undefined) {
            for (var key in dataAttributes) {
                element.setAttribute('data-'+key, dataAttributes[key]);
            }
        }

        return element;
    },

    createInput : function (name, isAutoFocused) {
        var element = document.createElement("input");
        element.name = name;
        element.autofocus = isAutoFocused;
        return element;
    }
};
// http://icons.iconarchive.com/icons/icons8/ios7/48/Travel-Water-Bottle-icon.png
var MOCKED_DATA = {
    brand : function() {
        return {"id": 1,"name": "greygooseUS","country": "US","product_default_image": "http://icons.iconarchive.com/icons/icons8/ios7/48/Travel-Water-Bottle-icon.png"};
    },
    products : function() {
        return {"products": [{"id": 84,"name": "GREY GOOSE L ORANGE 750mL","package": "750mL"},{"id": 6,"name": "GREY GOOSE ORIGINAL 50mL","package": "50mL"}, {"id": 54,"name": "GREY GOOSE LE CITRON 1.75L","package": "1.75L"}]};
    },
    messages : function () {
        return {"product_filter": {"products": "producst"}};
    }
};