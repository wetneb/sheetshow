import SheetLayout from './sheet_layout.js';
import SheetDiagram from './sheet_diagram.js';

test('simple diagram', function() {
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
      let layout = new SheetLayout(diag);
      layout.getModel();
});

test('discretizePath', function() {
        expect(SheetLayout._discretizePath([{x:0, y:0},{x:1, y:1}], 10))
                .toEqual([seen.P(0,0,0),seen.P(1,1,0)]);
        expect(SheetLayout._discretizePath([{x:0, y:0},{x:1, y:1, cx1: 1, cy1: 0, cx2: 1, cy2:1}], 10).length)
                .toEqual(11);

        // also works when Z coordinates are supplied:
        expect(SheetLayout._discretizePath([{x:0, y:0},{x:1, y:1}], 10))
                .toEqual([seen.P(0,0,0),seen.P(1,1,0)]);
});

test('bendBezier', function() {
        expect(SheetLayout._bendBezier([{x: 1, y:2},{x: 3, y:4}], 5, 6, 7))
                .toEqual([{x: 1, y: 2, z: 5}, {x: 3, y: 4, z: 5}]);
        
        expect(SheetLayout._bendBezier([{x: 1, y:2},{x: 3, y:4, cx1:8, cx2:8, cy1:9, cy2: 9}], 5, 6, 7))
                .toEqual([{x: 1, y: 2, z: 5}, {x: 3, y: 4, cx1: 8, cx2: 8, cy1: 9, cy2: 9, cz1: 5, cz2: 6, z: 6}]);
});
