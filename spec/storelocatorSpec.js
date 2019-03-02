describe("A test 'STORE LOCATOR' test suite", function () {

	var sl = STORE_LOCATOR;

    beforeAll(function() {

        var id = 'sl-store-locator';
        var css = undefined;

        var dataAttributes = {};
        dataAttributes.env = 'QA';
        dataAttributes.brand = 'greygooseUS';
        dataAttributes.build= 'static';

        var div = UIComponents.div(id, css, dataAttributes);

        var body = document.getElementsByTagName('body')[0];
        body.appendChild(div);
    });

    it("checkConfig(): check store locator DOM config", function() {
        var actual = sl.checkConfig();
        var expected = true;
        expect(actual).toEqual(expected);
    });

	it("AJAX_SERVICE.getHost(): get production host", function() {
		var actual = sl.AJAX_SERVICE.getHost('QA');
		var expected = 'https://storelocatorbackend-dev.spika.com';
		expect(actual).toEqual(expected);
	});

});

// https://christosmonogios.com/2016/09/08/How-To-Test-The-HTML-Elements-And-Their-DOM-Properties-When-Using-The-Jasmine-Framework/
var UIComponents = (function() {

    // DIV ELEMENT
    function div(id, cssClasses, dataAttributes) {
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
    }

    // INPUT ELEMENT
    function input(name, isAutoFocused) {
        var element = document.createElement("input");
        element.name = name;
        element.autofocus = isAutoFocused;
        return element;
    }

})();
