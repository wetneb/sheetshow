
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
                this.discretization = 20;
                
                this.sheetMaterial = new seen.Material(seen.Colors.hsl(0.6, 0.4, 0.4));
                this.sheetMaterial.specularExponent = 5;
                this.sheetBoundaryMaterial = new seen.Material(seen.Colors.black());
                this.sheetMaterial.shader = seen.Shaders.Flat;
                this.pathMaterial = new seen.Material(seen.Colors.hsl(0, 1, 0.5));
                this.pathMaterial.shader = seen.Shaders.Flat;
        }

        // Returns a model for the given edge
        getSheetModel(edgeId) {
                let model = seen.Models.default();

                // build path
                let edgeBezier = this.skeletonLayout.edges[edgeId]; 
                let points = SheetLayout._discretizePath(edgeBezier, this.discretization);
                let extrudeDirection = seen.P(0,0,this.wiresLayout.getSheetWidth());

                // extrude
                let extruded = seen.Shapes.extrude(points, extrudeDirection);
                // remove the last quad as our paths are not cyclic
                extruded.surfaces = extruded.surfaces.slice(0, extruded.surfaces.length-3);
                for(let i = 0; i < extruded.surfaces.length; i++) {
                        let surface = extruded.surfaces[i];
                        surface.cullBackfaces = false;
                        surface.fill(this.sheetMaterial);
                        surface.stroke(this.sheetMaterial);
                }

                // build outer path
                let translatedPoints = points.map(p => p.copy().translate(0, 0, -extrudeDirection.z));
                let topEdge = [points[0], translatedPoints[0]];
                let botEdge = [points[points.length-1], translatedPoints[points.length-1]];
                let wireSurfaces = [points, translatedPoints, topEdge, botEdge].map(l => this._makeWireSurface(l));
                extruded.surfaces = wireSurfaces; // .concat(extruded.surfaces);

                // Add paths on the sheet
                let paths = this.diagram.getPathsOnEdge(edgeId);
                let pathSurfaces = [];
                for(let i = 0; i < paths.length; i++) {
                        let pathPosition = this.wiresLayout.getPathPosition(edgeId, i);
                        let startingVertex = this.diagram.startingVertex(edgeId);
                        let endingVertex = this.diagram.endingVertex(edgeId);
                        let startPos = pathPosition;
                        if (startingVertex !== -1) {
                                startPos = this.wiresLayout.getNodePosition(startingVertex, paths[i][0]);
                        }
                        let endPos = this.wiresLayout.getNodePosition(endingVertex, paths[i][1]);
                        if (endingVertex !== -1) {
                                endPos = this.wiresLayout.getNodePosition(endingVertex, paths[i][1]);
                        }
                        let bentBezier = SheetLayout._bendBezier(edgeBezier, startPos, pathPosition, endPos);
                        let curve = SheetLayout._discretizePath(bentBezier, this.discretization);
                        let surface = this._makeWireSurface(curve)
                        surface.stroke(this.pathMaterial);
                        pathSurfaces.push(surface);
                }
                extruded.surfaces = pathSurfaces.concat(extruded.surfaces);
               
                model.add(extruded);
                return model;
        }

        /**
         * Given the base curve for a sheet, the positions of the vertices a path
         * is connecting to, and the nominal position of the path on the sheet,
         * return a 3D curve drawn on the sheet with the required starting
         * and end positions.
         */
        static _bendBezier(sheetCurve, startingZ, midZ, endZ) {
                let z = [startingZ, midZ, endZ];
                let zCursor = 0;
                let result = [];
                for (let i = 0; i < sheetCurve.length; i++) {
                        let point = sheetCurve[i];
                        let bent = Object.assign({}, point);
                        if (point.cx1 === undefined) {
                                bent.z = z[zCursor];
                                if (i > 0) {
                                        zCursor = 1;
                                }
                        } else {
                                // This one has Bezier controls, so go to next z position
                                let previousZ = z[zCursor];
                                zCursor++;
                                let currentZ = z[zCursor];
                                bent.z = currentZ;
                                bent.cz1 = midZ;
                                bent.cz2 = midZ;
                        }
                        result.push(bent);
                }
                return result;
        }

        _makeWireSurface(path) {
                let surface = new seen.Surface(path);
                surface.fillMaterial = null;
                surface.stroke(this.sheetBoundaryMaterial);
                surface.cullBackfaces = false;
                return surface;
        }

        getModel() {
                let model = seen.Models.default();
                
                // add models for sheets
                for(let i = 0; i < this.diagram.nbEdges(); i++) {
                        model = model.add(this.getSheetModel(i));
                }

                // add nodes
                for(let i = 0; i < this.diagram.nbVertices(); i++) {
                        for(let j = 0; j < this.diagram.nbNodesOnVertex(i); j++) {
                                let nodeMetadata = this.diagram.getNode(i, j);
                                if (nodeMetadata !== undefined) {
                                       let sphere = seen.Shapes.sphere(1);
                                       let vertex2d = this.skeletonLayout.vertices[i];
                                       sphere.scale(3).translate(vertex2d.x, vertex2d.y, this.wiresLayout.getNodePosition(i, j));
                                       sphere.fill(this.pathMaterial);
                                       model = model.add(sphere); 
                                }
                        }
                }
 
                
                model.translate(-this.skeletonLayout.width/2, -this.skeletonLayout.height/2,-this.wiresLayout.getSheetWidth()/2)
                        .scale(2);
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
                let result = [seen.P(lastPoint.x, lastPoint.y, lastPoint.z || 0)];
                for(let i = 1; i < pathCoords.length; i++) {
                        let point = pathCoords[i];
                        if (point.cx1 === undefined) {
                                // This is just a regular point, so a straight line since the last point
                                result.push(seen.P(point.x, point.y, point.z || 0));
                        } else {
                                // This is a Bezier curve
                                let curve = new Bezier([
                                        {x:lastPoint.x, y:lastPoint.y, z:lastPoint.z || 0},
                                        {x:point.cx1, y:point.cy1, z:point.cz1 || 0},
                                        {x:point.cx2, y:point.cy2, z:point.cz2 || 0},
                                        {x:point.x, y:point.y, z:point.z || 0}]);
                                let lut = curve.getLUT(steps+1);
                                for (let j = 1; j < lut.length; j++) {
                                    result.push(seen.P(lut[j].x, lut[j].y, lut[j].z || 0)); 
                                }
                        }                        
                        lastPoint = {x:point.x, y:point.y, z:point.z};
                }

                return result;
        }
}
