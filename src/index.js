import SheetDiagram from './sheet_diagram.js';
import SheetLayout from './sheet_layout.js';
import seen from './seen.js';

function setUp() {
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
        let model = layout.getModel(); 
        let viewport = seen.Viewports.center(400, 400);
        let scene = new seen.Scene({model: seen.Models.default(), viewport: viewport});
        let group = scene.model.append().scale(1);
        group.children = [model];
        let context = seen.Context('seen-canvas', scene);
        let dragger = new seen.Drag(document.getElementById('seen-canvas'), {inertia : true})
        dragger.on('drag.rotate', function(e) {
            let xform = seen.Quaternion.xyToTransform(e.offsetRelative.slice(0, e.offsetRelative.length));
            group.transform(xform);
            context.render();
        }
        );
        context.render();
}

setUp();
