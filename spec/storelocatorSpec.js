describe("A test 'STORE LOCATOR' test suite", function () {

	var sl = STORE_LOCATOR;

    beforeAll(function() {
    	alert('boom');
    	/*
        var body = document.getElementsByTagName("body")[0];
        var div = UIFramework.div("div1", "redBg");
        body.appendChild(div);
        div.appendChild(UiFramework.input("input1", false));
        div.appendChild(UiFramework.input("search", true));
        div.appendChild(UiFramework.input("input3", false));
        */
    });

	it("AJAX_SERVICE.getHost(): get production host", function() {
		var actual = sl.AJAX_SERVICE.getHost('PROD');
		var expected = 'https://sl.bacardi.com';
		expect(actual).toEqual(expected);
	});




    var dummyElement = document.createElement('div');
});

// https://christosmonogios.com/2016/09/08/How-To-Test-The-HTML-Elements-And-Their-DOM-Properties-When-Using-The-Jasmine-Framework/
var UIComponents = (function() {

    function input(name, isAutoFocused) {
        var element = document.createElement("input");
        element.name = name;
        element.autofocus = isAutoFocused;
        return element;
    }

    function div(id, cssClass) {
        var element = document.createElement("div");
        element.id = id;
        element.classList.add(cssClass);
        return element;
    }

    return {
        input: input,
        div: div
    }
})();
