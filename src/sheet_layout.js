
import GlpkBimonoidalLayout from './glpk_3d.js';
import GlpkTwoDimensionalLayout from './glpk_2d.js';
import Glpk from 'glpk.js';
import Bezier from 'bezier-js';
import DecoratedSurfacePainter from './decorated_surface_painter.js';
import FlatTextPainter from './flat_text_painter.js';
import seen from 'seen';

/**
 * Renders a sheet diagram to SVG.
 */
export default class SheetLayout {
        constructor(diagram, options) {
                this.diagram = diagram;
                this.options = Object.assign(
                        {
                            sliceHeight: 40,
                            sheetDistance: 29,
                            wireSpacing: 15,
                            wireMargin: 15,
                            sheetOpacity: 50,
                            sheetColor: '1122aa',
                            sheetSpecular: 5,
                            wireColor: '000000',
                            wireThickness: 1,
                            nodeSize: 3
                        },
                        options === undefined ? {} : options);
                this.skeletonLayout = new GlpkTwoDimensionalLayout(diagram);
                this.skeletonLayout.edgeDist = this.options.sheetDistance;
                this.skeletonLayout.sliceHeight = this.options.sliceHeight;
                this.skeletonLayout.compute();
                this.wiresLayout = new GlpkBimonoidalLayout(diagram);
                this.wiresLayout.edgeDist = this.options.wireSpacing;
                this.wiresLayout.margins = this.options.wireMargin;
                this.wiresLayout.compute();
                this.discretization = 20;

                this.decoratedSurfacePainter = new DecoratedSurfacePainter();
                this.flatTextPainter = new FlatTextPainter();
                
                let sheetColor = seen.Colors.hex(this.options.sheetColor);
                sheetColor.a = this.options.sheetOpacity * 2.55 ;
                this.sheetMaterial = new seen.Material(sheetColor);
                this.sheetMaterial.specularExponent = this.options.sheetSpecular;
                this.sheetBoundaryMaterial = new seen.Material(seen.Colors.hex(this.options.wireColor));
                this.sheetMaterial.shader = seen.Shaders.Flat;
                this.pathMaterial = new seen.Material(seen.Colors.hex(this.options.wireColor));
                this.pathMaterial.shader = seen.Shaders.Flat;
                this.pathStrokeWidth = this.options.wireThickness;

                this.nodeLabelYDist = 8;
                this.pathLabelYDist = 5;
                this.nodeLabelZDist = -7;
        }

        // Returns a model for the given edge
        getSheetModel(edgeId) {
                let model = seen.Models.default();

                // build base path, one side of the sheet (at z = 0)
                let edgeBezier = this.skeletonLayout.edges[edgeId]; 
                let points = SheetLayout._discretizePath(edgeBezier, this.discretization);
                let extrudeDirection = seen.P(0,0,this.wiresLayout.getSheetWidth());

                // build lines on the surface
                let paths = this.diagram.getPathsOnEdge(edgeId);
                let lines = [];
                for(let i = 0; i < paths.length; i++) {
                        let pathPosition = this.wiresLayout.getPathPosition(edgeId, i);
                        let startingVertex = this.diagram.startingVertex(edgeId);
                        let endingVertex = this.diagram.endingVertex(edgeId);
                        let startPos = pathPosition;
                        if (startingVertex !== -1) {
                                startPos = this.wiresLayout.getNodePosition(startingVertex, paths[i][0]);
                        }
                        let endPos = pathPosition;
                        if (endingVertex !== -1) {
                                endPos = this.wiresLayout.getNodePosition(endingVertex, paths[i][1]);
                        }
                        let bentBezier = SheetLayout._bendBezier(edgeBezier, startPos, pathPosition, endPos);
                        let curve = SheetLayout._discretizePath(bentBezier, this.discretization);
                        lines.push(curve);
                }

                // add models for each section of the base path
                for(let i = 0; i < points.length -1; i++) {
                        let fullPoints = [
                                points[i],
                                points[i+1],
                                points[i+1].copy().translate(0, 0, extrudeDirection.z),
                                points[i].copy().translate(0, 0, extrudeDirection.z)
                        ];
                        let lineIndices = [];
                        for (let j = 0; j < lines.length; j++) {
                                let line = lines[j];
                                fullPoints.push(line[i]);
                                fullPoints.push(line[i+1]);
                                lineIndices.push({
                                        indices: [fullPoints.length-2, fullPoints.length],
                                        stroke: this.pathMaterial.color,
                                        strokeWidth: this.pathStrokeWidth
                                });
                        }
                        let surface = new seen.Surface(fullPoints, this.decoratedSurfacePainter);
                        surface.surfaceIndices = [0,4];
                        surface.lines = lineIndices;
                        surface.cullBackfaces = false;
                        surface.fill(this.sheetMaterial);
                        // surface.stroke(this.sheetMaterial);
                        model.add(new seen.Shape('sheet', [surface]));
                }


                // build outer path
                /*
                let translatedPoints = points.map(p => p.copy().translate(0, 0, -extrudeDirection.z));
                let topEdge = [points[0], translatedPoints[0]];
                let botEdge = [points[points.length-1], translatedPoints[points.length-1]];
                let wireSurfaces = [points, translatedPoints, topEdge, botEdge].map(l => this._makeWireSurface(l));
                extruded.surfaces = wireSurfaces; // .concat(extruded.surfaces);
                */

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
                                if (nodeMetadata !== undefined && nodeMetadata.swap === undefined) {
                                       let sphere = seen.Shapes.sphere(1);
                                       let vertex2d = this.skeletonLayout.vertices[i];
                                       sphere.scale(this.options.nodeSize)
                                        .translate(vertex2d.x, vertex2d.y, this.wiresLayout.getNodePosition(i, j));
                                       sphere.fill(this.pathMaterial);
                                       model = model.add(sphere); 

                                       if (nodeMetadata.label !== undefined) {
                                                let labelPosition = this._labelPosition(i, j);
                                                model = model.add(this._createTextNode(nodeMetadata.label,
                                                        labelPosition.x, labelPosition.y, labelPosition.z));
                                       }
                                }
                        }
                }
        
                // add labels on domains 
                for(let i = 0; i < this.diagram.edgesAtLevel(0).length; i++) {

                        let edgeBezier = this.skeletonLayout.edges[i]; 
                        let basePoint = SheetLayout._discretizePath(edgeBezier, this.discretization)[0];
                        for(let j = 0; j < this.diagram.getPathsOnEdge(i).length; j++) {
                                let label = this.diagram.getDomainLabel(i, j);
                                let pathPosition = this.wiresLayout.getPathPosition(i, j);
                                if (label !== undefined) {
                                        model = model.add(this._createTextNode(label, basePoint.x, basePoint.y - this.pathLabelYDist, pathPosition));
                                }
                        }
                }

                // add labels on codomains 
                let codomainSheets = this.diagram.edgesAtLevel(this.diagram.nbVertices());
                for(let i = 0; i < codomainSheets.length; i++) {

                        let k = codomainSheets[i];
                        let edgeBezier = this.skeletonLayout.edges[k]; 
                        let discretization = SheetLayout._discretizePath(edgeBezier, this.discretization);
                        let basePoint = discretization[discretization.length-1];
                        for(let j = 0; j < this.diagram.getPathsOnEdge(k).length; j++) {
                                let label = this.diagram.getCodomainLabel(i, j);
                                let pathPosition = this.wiresLayout.getPathPosition(k, j);
                                if (label !== undefined) {
                                        model = model.add(this._createTextNode(label, basePoint.x, basePoint.y + this.pathLabelYDist, pathPosition));
                                }
                        }
                }
 
                
                model.translate(-this.skeletonLayout.width/2, -this.skeletonLayout.height/2,-this.wiresLayout.getSheetWidth()/2)
                        .scale(2);
                return model;
        }

        _labelPosition(i, j) {
                let vertex2d = this.skeletonLayout.vertices[i];
                let vertex = this.diagram.getVertex(i);
                let zPos = this.wiresLayout.getNodePosition(i, j);
                let yOffset = vertex.outputs % 2 == 0 ? this.nodeLabelYDist : -this.nodeLabelYDist;
                let zOffset = 0;
                if (vertex.outputs % 2 == 1 && vertex.inputs % 2 == 1) {
                        yOffset = 0;
                        zOffset = this.nodeLabelZDist;
                }
                return {
                        x: vertex2d.x,
                        y: vertex2d.y + yOffset,
                        z: zPos + zOffset
                };
        }

        _createTextNode(textContent, x, y, z) {
                let text = seen.Shapes.text(textContent,
                    {font : '10px Roboto', cullBackfaces : false, anchor : 'middle'})
                .translate(x, y, z)
                .fill('#000000');
                text.surfaces[0].painter = this.flatTextPainter;
                return text;
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
