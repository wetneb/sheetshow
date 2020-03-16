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
});
