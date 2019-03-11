describe("A test 'STORE LOCATOR' test suite", function () {

    beforeAll(function() {

        var id = 'sl-store-locator';
        var css = undefined;

        var dataAttributes = {};
        dataAttributes.env = 'QA';
        dataAttributes.brand = 'greygooseUS';
        dataAttributes.build= 'static';

        var div = UIComponents.createDiv(id, css, dataAttributes);

        var body = document.getElementsByTagName('body')[0];
        body.appendChild(div);
    });

    beforeEach(function() {
        jasmine.Ajax.install();
    });

    /*
    afterEach(function() {
        jasmine.Ajax.uninstall();
    });
    */

    // 1. Basic Function
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

    // 2. DOM Dependent Function
    it("checkConfig(): check store locator DOM config", function() {
        var actual = STORE_LOCATOR.checkConfig();
        var expected = true;
        expect(actual).toEqual(expected);
    });

    // 3. Ajax Function

    // 4. Promises

});

var UIComponents = {

    createDiv : function (id, cssClasses, dataAttributes) {
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

