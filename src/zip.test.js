import array_zip from './zip.js' ;

test('array_zip', function() {
     let a = [1, 2, 3, 4];
     let b = ['a', 'b', 'c', 'd'];
     expect(array_zip(a, b)).toEqual([[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']]);
});
