describe("A test 'calculator' test suite", function () {

	var calc = new Calculator();

	it(" sum(): Adds two numbers", function() {
		var actual = calc.sum(3,6);
		var expected = 9;
		expect(actual).toEqual(expected);
	});

    it(" subtract(): subtracts two numbers", function() {
        var actual = calc.subtract(10,2);
        var expected = 8;
        expect(actual).toEqual(expected);
    });

});

