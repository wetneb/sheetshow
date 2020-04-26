
import Glpk from 'glpk.js';

/**
 * A layout for planar diagrams computed by
 * solving a system of linear constraints with GLPK.
 */
export default class GlpkTwoDimensionalLayout {
   constructor(diagram) {
      this.diag = diagram;
      this.edgeDist = 29.0;
      this.sliceHeight = 40.0;
      this.avgEpsilon = 0.1;
      this.margins = 25.0;
      this.minHeight = 0.0;
      this.vertexControlDist = 0.75;
      this.edgeControlDist = 0.75;

      this.edges = [];
      this.vertices = [];
      this.edgeLength = Array(this.diag.nbEdges()).fill(0.0);
      this.edgePos = [];
   }

   compute() {
     let program = this.getConstraints('');

     let solutions = Glpk.solve(program);

     this.computeLayout('', solutions);
   }   

   /**
    * Computes a GLPK program for the diagram
    * with a custom prefix in front of all variables
    * and constraints (so that it can be merged with
    * other programs).
    */
   getConstraints(prefix) {
      // the 'lb' variable is set to 0 from the start
      // it is useful to be able to refer to it in other
      // constraints.
      let allVars = [{name: prefix+'lb', coef:1.0}, {name:prefix+'rb', coef:1.0}];
      let constraints = [{
        name: prefix+'lb',
        vars: [
          { name: prefix+'lb', coef: 1.0 },
        ],
        bnds: { type: Glpk.GLP_FX, ub: 0.0, lb: 0.0 }
      }];    
      

      // Init the current edges
      for(let i = 0; i < this.diag.nbEdgesAtLevel(0); i++) {
        if (i === 0) {
            constraints.push({
                name: prefix+'edge_r'+i,
                vars: [
                    { name: prefix+'e'+i, coef: 1.0 },
                ],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: this.margins }
            });
        }

        let rightEdge = prefix+'rb';
        if (i < this.diag.nbInputs - 1) {
            rightEdge = prefix+'e'+(i+1);
        }
        constraints.push({
            name: prefix+'edge'+i,
            vars: [
                { name: rightEdge, coef: 1.0 },
                { name: prefix+'e'+i, coef: -1.0 },
            ],
            bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: i < this.diag.nbInputs - 1 ? this.edgeDist : this.margins }
        });
        allVars.push({name: prefix+'e'+i, coef: 1.0});
      }
      
      // Add constraints for other edges
      for(let i = 0; i < this.diag.nbVertices(); i++) {
        let slice = this.diag.getVertex(i);
        let currentEdges = this.diag.edgesAtLevel(i);
        let newCurrentEdges = this.diag.edgesAtLevel(i+1);

        allVars.push({name: prefix+'v'+i, coef:1.0});

        if (slice.inputs > 0) {
            // The vertex should be at the average of the input wires
            let variables = [{name:prefix+'v'+i, coef:-1.0}];
            for(let j = 0; j < slice.inputs; j++) {
               variables.push({
                  name: prefix+'e'+currentEdges[slice.offset+j],
                  coef: 1.0/slice.inputs,
               });
            }
            constraints.push({
                name: prefix+'inputs'+i,
                vars: variables,
                bnds: { type: Glpk.GLP_DB, ub: this.avgEpsilon, lb: -this.avgEpsilon },
            });
        } else {
            // The vertex should be between its neighbouring edges, if any
            let leftEdge = prefix+'lb';
            let rightEdge = prefix+'rb';
            if (slice.offset > 0) {
                leftEdge = prefix+'e'+currentEdges[slice.offset - 1]
            }
            if (slice.offset + slice.inputs < currentEdges.length) {
                rightEdge = prefix+'e'+currentEdges[slice.offset+slice.inputs];
            }
            constraints.push({
                name: prefix+'left'+i,
                vars: [
                    { name: prefix+'v'+i, coef: 1.0 },
                    { name: leftEdge, coef: -1.0 },
                ],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: leftEdge === prefix+'lb' ? this.margins : this.edgeDist }
            });

            constraints.push({
                name: prefix+'right'+i,
                vars: [
                    { name: rightEdge, coef: 1.0 },
                    { name: prefix+'v'+i, coef: -1.0 },
                ],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: rightEdge === prefix+'rb' ? this.margins : this.edgeDist }
            });
        }

        if (slice.outputs > 0) {
            // The vertex should be at the average of the input wires
            let variables = [{name:prefix+'v'+i, coef:-1.0}];
            for(let j = 0; j < slice.outputs; j++) {
               variables.push({
                  name: prefix+'e'+newCurrentEdges[slice.offset+j],
                  coef: 1.0/slice.outputs,
               });
               // The edge should be after the preceding edge
               var previousEdge = prefix+'lb';
               if(j + slice.offset > 0) {
                  previousEdge = prefix+'e'+newCurrentEdges[j + slice.offset -1];
               }
               constraints.push({
                 name: prefix+'edge'+newCurrentEdges[slice.offset + j],
                  vars: [
                  { name: previousEdge, coef: -1.0 },
                  { name: prefix+'e'+newCurrentEdges[slice.offset + j], coef: 1.0 },
                 ],
                 bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: previousEdge === prefix+'lb' ? this.margins : this.edgeDist },
               });
               allVars.push({name: prefix+'e'+newCurrentEdges[slice.offset + j], coef: 1.0});
            }
            constraints.push({
                name: prefix+'outputs'+i,
                vars: variables,
                bnds: { type: Glpk.GLP_DB, ub: this.avgEpsilon, lb: -this.avgEpsilon },
            });

            // Add constraint for the last new edge
            let nextEdge = prefix+'rb';
            if (slice.offset + slice.inputs < currentEdges.length) {
                nextEdge = prefix+'e'+currentEdges[slice.offset + slice.inputs];
            }
            constraints.push({
                name: prefix+'edge_l'+newCurrentEdges[slice.offset + slice.outputs - 1],
                vars: [
                { name: prefix+'e'+newCurrentEdges[slice.offset + slice.outputs - 1], coef: -1.0 },
                { name: nextEdge, coef: 1.0 },
                ],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: nextEdge === prefix+'rb' ? this.margins : this.edgeDist },
            });
        }
      }

      let program = {
        name: 'LP',
        objective: {
           direction: Glpk.GLP_MIN,
           name: 'obj',
           vars: allVars
        },
        subjectTo: constraints
      };
      return program;
   }

   setEdgeLength(i, l) {
       this.edgeLength[i] = l;
   }
 
   computeVerticalPositions() {
        let vertexHeight = new Map();
        let voidHeight = [];
        for(let i = 0; i < this.diag.nbInputs+1; i++) {
                voidHeight.push(-this.sliceHeight);
        }
        vertexHeight.set(-1,-this.sliceHeight);
        for(let i = 0; i < this.diag.nbVertices(); i++) {
                let slice = this.diag.slices[i];
                let edgesAtLevel = this.diag.wiresAtLevel[i];
                let height = 0;
                let nextVoidHeight = [];
                for(let j = 0; j < slice.offset+1; j++) {
                        nextVoidHeight.push(voidHeight[j]);
                }
                for(let j = 0; j < slice.outputs-1; j++) {
                        nextVoidHeight.push(0);
                }
                for(let j = slice.offset+slice.outputs; j < voidHeight.length + (slice.outputs-slice.inputs); j++) {
                        if (j != slice.offset+slice.outputs || slice.outputs > 0) {
                                nextVoidHeight.push(voidHeight[j + (slice.inputs - slice.outputs)]);
                        }
                }

                // Compute maximum height of all incoming edges
                for(let j = slice.offset; j < slice.offset+slice.inputs; j++) {
                        let edgeId = edgesAtLevel[j];
                        let startingVertex = this.diag.startingVertex(edgeId);
                        let startingHeight = vertexHeight.has(startingVertex) ? vertexHeight.get(startingVertex) : 0.0;
                        let length = this.edgeLength[i];
                        if (length === undefined) {
                                length = 0;
                        }
                        height = Math.max(height, startingHeight + this.sliceHeight + length);
                }
                
                // Compute maximum height of all blank space between edges
                for(let j = slice.offset; j < slice.offset+slice.inputs-1; j++) {
                        let vHeight = voidHeight[j+1];
                        height = Math.max(height, vHeight + this.sliceHeight);
                }
                if (slice.inputs === 0) {
                        let vHeight = voidHeight[slice.offset];
                        height = Math.max(height, vHeight + this.sliceHeight);
                }
                
                // Set vertex height
                vertexHeight.set(i, height);

                // Set void height
                for(let j = slice.offset + 1; j < slice.offset + slice.outputs; j++) {
                        nextVoidHeight[j] = height;
                }
                if (slice.outputs === 0) {
                        nextVoidHeight[slice.offset] = height;
                }

                // If the slice has "shoulders" (more inputs than outputs)
                // then we should also push the surrounding void up to avoid collision
                // of slices with no inputs
                if (slice.outputs > 0 && slice.outputs < slice.inputs) {
                        nextVoidHeight[slice.offset] = height;
                        nextVoidHeight[slice.offset+slice.outputs] = height;
                }
                voidHeight = nextVoidHeight;
        }
        
        // Compute height of diagram
        let lastEdges = this.diag.wiresAtLevel[this.diag.nbVertices()];
        let diagHeight = 0;
        for(let i = 0; i < lastEdges.length; i++) {
                let startingVertex = this.diag.startingVertex(lastEdges[i]);
                diagHeight = Math.max(diagHeight, vertexHeight.has(startingVertex) ? vertexHeight.get(startingVertex) : 0.0);
        }
        for(let i = 0; i < voidHeight.length; i++) {
                diagHeight = Math.max(diagHeight, voidHeight[i]);
        }
        vertexHeight.set(this.diag.nbVertices(), diagHeight + this.sliceHeight);
        this.vertexHeight = vertexHeight;
   }

   computeLayout(prefix, solutions) {
      this.computeVerticalPositions();

      // Derive edge paths and vertex positions
      let horizontalPos = solutions.result.vars;
      for(let i = 0; i < this.diag.nbVertices(); i++) {
          this.vertices.push({'x': horizontalPos[prefix+'v'+i], 'y': this.vertexHeight.get(i)+0.5*this.sliceHeight});
      }

      // Boundaries
      this.width = horizontalPos[prefix+'rb'];
      this.height = Math.max(this.minHeight, this.vertexHeight.get(this.diag.nbVertices()));

      for(let i = 0; i < this.diag.nbEdges(); i++) {
          let start = this.diag.startingVertex(i);
          let end = this.diag.endingVertex(i);
          let x = horizontalPos[prefix+'e'+i];
          this.edgePos[i] = x;
          let edge = [];
          if (start === -1) {
              edge.push({x: x, y:0});
          } else {
              let vertX = horizontalPos[prefix+'v'+start];
              edge.push({x: vertX, y: this.vertexHeight.get(start)+0.5*this.sliceHeight});
              edge.push({
                x: x,
                y: this.vertexHeight.get(start)+this.sliceHeight,
                cx1: x,
                cy1: this.vertexHeight.get(start)+this.vertexControlDist*this.sliceHeight,
                cx2: x,
                cy2: this.vertexHeight.get(start)+this.edgeControlDist*this.sliceHeight});
          }
          if (end === this.diag.nbVertices()) {
              edge.push({x: x, y: this.height});
          } else {
              edge.push({x: x, y: this.vertexHeight.get(end)});
              edge.push({
                x: horizontalPos[prefix+'v'+end],
                y: this.vertexHeight.get(end)+0.5*this.sliceHeight,
                cx1: x,
                cy1: this.vertexHeight.get(end)+(1.0-this.edgeControlDist)*this.sliceHeight,
                cx2: x,
                cy2: this.vertexHeight.get(end)+(1.0-this.vertexControlDist)*this.sliceHeight,
              });
          }
          this.edges.push(edge);
      }
   }

}

