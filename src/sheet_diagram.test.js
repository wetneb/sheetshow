import SheetDiagram from './sheet_diagram.js' ;

test('empty diagram', function() {
     let diag = new SheetDiagram([], []);
     expect(diag.nbVertices()).toEqual(0);
     expect(diag.nbEdges()).toEqual(0);
     expect(diag.nbEdgesAtLevel(0)).toEqual(0);
     expect(diag.serialize()).toEqual({inputs:[], slices:[]});
});

test('getVertex()', function() {
      let slices = [{
                offset:1,
                inputs:1,
                outputs:2,
                nodes: [
                   {
                      offset: 0,
                      inputs: [1],
                      outputs: [1,1]
                   }
                ]
              },
              {
                 offset:2,
                 inputs:2,
                 outputs:2,
                 nodes: [
                   {
                        offset: 0,
                        inputs: [2, 2],
                        outputs: [1, 1]
                   }
                ]
              }];
      let diag = new SheetDiagram([ 1, 2, 2], slices);
      expect(diag.getVertex(0)).toEqual(slices[0]);
      expect(diag.getVertex(1)).toEqual(slices[1]);
      expect(diag.getPathsOnEdge(0)).toEqual([[0,0]]);
      expect(diag.getPathsOnEdge(1)).toEqual([[0,0],[1,1]]);
      expect(diag.getPathsOnEdge(2)).toEqual([[0,0],[1,0]]);
      expect(diag.getPathsOnEdge(3)).toEqual([[0,0],[1,1]]);
      expect(diag.getPathsOnEdge(4)).toEqual([[0,0],[1,0]]);
      expect(diag.getPathsOnEdge(5)).toEqual([[0,0]]);
      expect(diag.getPathsOnEdge(6)).toEqual([[0,0]]);
});



