import PlanarDiagram from './planar_diagram.js' ;

test('empty diagram', function() {
     let diag = new PlanarDiagram(0, []);
     expect(diag.nbVertices()).toEqual(0);
     expect(diag.nbEdges()).toEqual(0);
     expect(diag.nbEdgesAtLevel(0)).toEqual(0);
     expect(diag.serialize()).toEqual({inputs:0, slices:[]});
});

test('diagram with labels', function() {
     let diag = new PlanarDiagram(2, [{offset:0, inputs:2, outputs:2}]);
     diag.domainLabels.set(0, "A");
     diag.codomainLabels.set(1, "C");
     expect(diag.serialize()).toEqual({inputs:2, slices:[[0,2,2]], domain:{"0":"A"}, codomain:{"1":"C"}});
});

test('getVertex()', function() {
      let diag = new PlanarDiagram(3, [{offset:1, inputs:1, outputs:2},
                                       {offset:2, inputs:2, outputs:2}]);
      expect(diag.getVertex(0)).toEqual({offset:1, inputs:1, outputs:2});
      expect(diag.getVertex(1)).toEqual({offset:2, inputs:2, outputs:2});
});


test('nbEdges() and nbVertices()', function() {
      let diag = new PlanarDiagram(3, [{offset:1, inputs:1, outputs:2},
                                       {offset:2, inputs:2, outputs:2}]);
      expect(diag.nbEdges()).toEqual(7);
      expect(diag.nbVertices()).toEqual(2);
});


test('nbEdgesAtLevel()', function() {
      let diag = new PlanarDiagram(3, [{offset:1, inputs:1, outputs:2},
                                       {offset:2, inputs:2, outputs:2}]);
      expect(diag.nbEdgesAtLevel(0)).toEqual(3);
      expect(diag.nbEdgesAtLevel(1)).toEqual(4);
      expect(diag.nbEdgesAtLevel(2)).toEqual(4);
});

test('edgesAtLevel()', function() {
      let diag = new PlanarDiagram(3, [{offset:1, inputs:1, outputs:2},
                                       {offset:2, inputs:2, outputs:2}]);
      expect(diag.edgesAtLevel(0)).toEqual([0, 1, 2]);
      expect(diag.edgesAtLevel(1)).toEqual([0, 3, 4, 2]);
      expect(diag.edgesAtLevel(2)).toEqual([0, 3, 5, 6]);
});

test('startingVertex() and endingVertex()', function() {
      let diag = new PlanarDiagram(3, [{offset:1, inputs:1, outputs:2},
                                       {offset:2, inputs:2, outputs:2}]);
      expect(diag.startingVertex(0)).toEqual(-1);
      expect(diag.startingVertex(1)).toEqual(-1);
      expect(diag.startingVertex(2)).toEqual(-1);
      expect(diag.startingVertex(3)).toEqual(0);
      expect(diag.startingVertex(4)).toEqual(0);
      expect(diag.startingVertex(5)).toEqual(1);
      expect(diag.startingVertex(6)).toEqual(1);
      expect(diag.endingVertex(0)).toEqual(2);
      expect(diag.endingVertex(1)).toEqual(0);
      expect(diag.endingVertex(2)).toEqual(1);
      expect(diag.endingVertex(3)).toEqual(2);
      expect(diag.endingVertex(4)).toEqual(1);
      expect(diag.endingVertex(5)).toEqual(2);
      expect(diag.endingVertex(6)).toEqual(2);
});

test('swaps', function() {
      let diag = new PlanarDiagram(3, [{swap: 1},{swap: 0},{swap: 1}]);

      expect(diag.nbEdgesAtLevel(0)).toEqual(3);
      expect(diag.nbEdgesAtLevel(1)).toEqual(3);
      expect(diag.nbEdgesAtLevel(2)).toEqual(3);
      expect(diag.nbVertices()).toEqual(3);
      expect(diag.isSwap(0)).toEqual(true);
      expect(diag.startingVertex(0)).toEqual(-1);
      expect(diag.startingVertex(1)).toEqual(-1);
      expect(diag.startingVertex(2)).toEqual(-1);
      expect(diag.startingVertex(3)).toEqual(0);
      expect(diag.startingVertex(4)).toEqual(0);
      expect(diag.startingVertex(5)).toEqual(1);
      expect(diag.startingVertex(6)).toEqual(1);
      expect(diag.startingVertex(7)).toEqual(2);
      expect(diag.startingVertex(8)).toEqual(2);
      expect(diag.endingVertex(0)).toEqual(1);
      expect(diag.endingVertex(1)).toEqual(0);
      expect(diag.endingVertex(2)).toEqual(0);
      expect(diag.endingVertex(3)).toEqual(1);
      expect(diag.endingVertex(4)).toEqual(2);
      expect(diag.endingVertex(5)).toEqual(3);
      expect(diag.endingVertex(6)).toEqual(2);
      expect(diag.endingVertex(7)).toEqual(3);
      expect(diag.endingVertex(8)).toEqual(3);

     expect(diag.isSwapVertex(0)).toEqual(true);
     expect(diag.isSwapVertex(1)).toEqual(true);
     expect(diag.isSwapVertex(2)).toEqual(true);
});
