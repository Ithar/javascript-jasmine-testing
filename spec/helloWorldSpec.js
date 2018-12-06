describe("A 'Hello World' test suite ", function () {

	it(" tests basic hello world", function() {
		var expected = 'hello world';
		var actual = 'hello world';
		expect(actual).toEqual(expected);
	});

	it("tests the method call" , function() {
		var expected = 'Hello World';
		var actual = hello();
		expect(actual).toEqual(expected);
	});

});


