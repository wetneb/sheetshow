
import { prettyPrintJSON }  from './util.js' ;


test('pretty prints JSON', function() {
	let source = { a: { b: [true, false], c: 1 }, d: "test" };
	let pretty = prettyPrintJSON(source);
	let parsed = JSON.parse(pretty);
	
	expect(parsed).toEqual(source);
});

test('collapses lists of integers', function() {
	let source = { a: [[1,2,3,4],[5,6]] };
	let pretty = prettyPrintJSON(source);

	expect(pretty).toEqual('{\n    "a": [\n        [ 1, 2, 3, 4 ],\n        [ 5, 6 ]\n    ]\n}');
});
