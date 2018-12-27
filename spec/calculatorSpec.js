describe("A test 'calculator' test suite", function () {

	var calc = new Calculator();

	it(" sums two numbers", function() {
		var actual = calc.sum(3,6);
		var expected = 9;
		expect(actual).toEqual(expected);
	});

    it(" subtracts two numbers", function() {
        var actual = calc.subtract(10,2);
        var expected = 8;
        expect(actual).toEqual(expected);
    });

});

