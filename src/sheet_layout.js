
import GlpkBimonoidalLayout from './glpk_3d.js';
import Glpk from 'glpk.js';
import seen from './seen.js';

/**
 * Renders a sheet diagram to SVG.
 */
export default class SheetLayout {
        constructor(diagram) {
                this.diagram = diagram;
                this.layout = new GlpkBimonoidalLayout(diagram);
        }

        getModel() {
                let model = seen.Models.default();
                
                // add sample shape for debug
                let shape = seen.Shapes.tetrahedron();
                model = model.add(shape);
                model.scale(10);
                return model;

                let viewport = seen.Viewports.center(400, 400);
                let scene = new seen.Scene({model:model, viewport:viewport});
                
                return scene;
        }
}
