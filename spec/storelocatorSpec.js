describe("A test 'STORE LOCATOR' test suite", function () {

	var sl = STORE_LOCATOR;

	it(" getHost(): get production host", function() {
		var actual = sl.getHost('PROD');
		var expected = 'https://sl.bacardi.com';
		expect(actual).toEqual(expected);
	});

});

