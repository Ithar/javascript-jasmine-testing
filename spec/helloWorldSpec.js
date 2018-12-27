describe("A test 'Hello World' test suite:", function () {

    var text = 'hello world';

	it(" test basic 'hello world'", function() {
		var actual = text;
		var expected = 'hello world';
		expect(actual).toEqual(expected);
	});

});

