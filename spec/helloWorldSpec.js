describe("A 'Hello World' test suite ", function () {

	var calc = new Calculator();
	var sl = STORE_LOCATOR;

	it(" tests basic hello world", function() {
		var expected = 'hello world';
		var actual = 'hello world';
		expect(actual).toEqual(expected);
	});

	it("tests the method call" , function() {
		var expected = 'Hello World';
		var actual = calc.hello();
		expect(actual).toEqual(expected);
	});

    it("tests the environment " , function() {
        var expected = 'http://127.0.0.1:8080';
        var actual = sl.getHost('DEV');
        expect(actual).toEqual(expected);
    });

});


