
import GlpkBimonoidalLayout from './glpk_3d.js';
import GlpkTwoDimensionalLayout from './glpk_2d.js';
import Glpk from 'glpk.js';
import Bezier from 'bezier-js';
import seen from './seen.js';

/**
 * Renders a sheet diagram to SVG.
 */
export default class SheetLayout {
        constructor(diagram) {
                this.diagram = diagram;
                this.skeletonLayout = new GlpkTwoDimensionalLayout(diagram);
                this.skeletonLayout.compute();
                this.wiresLayout = new GlpkBimonoidalLayout(diagram);
                this.wiresLayout.compute();
                this.discretization = 10;
        }

        // Returns a model for the given edge
        getSheetModel(edgeId) {
                // build path
                let edgeBezier = this.skeletonLayout.edges[edgeId]; 
                let points = SheetLayout._discretizePath(edgeBezier, this.discretization);

                // extrude
                let extruded = seen.Shapes.extrude(points, seen.P(0,0,this.wiresLayout.getSheetWidth()));
                // remove the last quad as our paths are not cyclic
                extruded.surfaces = extruded.surfaces.slice(0, extruded.surfaces.length-3);
                return extruded;
        }

        getModel() {
                let model = seen.Models.default();
                
                for(let i = 0; i < this.diagram.nbEdges(); i++) {
                        model = model.add(this.getSheetModel(i));
                }
                
                model.scale(2);
                return model;
        }

        /**
         * Given a path specified as a list of points and bezier controls,
         * return a discretized
         */
        static _discretizePath(pathCoords, steps) {
                if (pathCoords.length === 0) {
                        return [];
                }
                let lastPoint = pathCoords[0];
                let result = [seen.P(lastPoint.x, lastPoint.y, 0)];
                for(let i = 1; i < pathCoords.length; i++) {
                        let point = pathCoords[i];
                        if (point.cx1 === undefined) {
                                // This is just a regular point, so a straight line since the last point
                                result.push(seen.P(point.x, point.y, 0));
                        } else {
                                // This is a Bezier curve
                                let curve = new Bezier([
                                        lastPoint,
                                        {x:point.cx1, y:point.cy1},
                                        {x:point.cx2, y:point.cy2},
                                        {x:point.x, y:point.y}]);
                                let lut = curve.getLUT(steps+1);
                                for (let j = 1; j < lut.length; j++) {
                                    result.push(seen.P(lut[j].x, lut[j].y, 0)); 
                                }
                        }                        
                        lastPoint = {x:point.x, y:point.y};
                }

                return result;
        }
}
