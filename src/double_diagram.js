import PlanarDiagram from './planar_diagram.js' ;
import GlpkTwoDimensionalLayout from './glpk_layout.js' ;
import Glpk from 'glpk.js' ;


/**
 * A diagram in the monoidal double category
 * of OpenRefine workflows.
 */
export default class DoubleDiagram {
    constructor(skeleton, sheets) {
        this.skeleton = skeleton;
        this.sheets = sheets;
        this.facetIds = new Map();
        this.skeletonSliceHeight = 20.0;
        this.skeletonEdgeDist = 45.0;
        this.sheetSliceHeight = 40.0;

        // map from skeleton vertex ids to lists of pairs,
        // the first component being the edge id and the
        // second being the sheet edge ids crossing this vertex.
        this.edgesToVertex = new Map();
        this.edgesFromVertex = new Map();
        let defaultSheet = sheets.get('default');
        for(let i = 0; i < this.skeleton.nbEdges(); i++) {
            let start = this.skeleton.startingVertex(i);
            let end = this.skeleton.endingVertex(i);
            let sheet = sheets.get(i);
            if (sheet === undefined && defaultSheet !== undefined) {
               sheets.set(i, defaultSheet);
               sheet = defaultSheet;
            }
            if (sheet === undefined) {
               throw new Error("Sheet "+i+" is undefined. It is connected to "+start+" and "+end+".");
            }
            
            if (!this.edgesFromVertex.has(start)) {
                this.edgesFromVertex.set(start, []);
            }
            let otherEdges = this.edgesFromVertex.get(start);
            otherEdges.push([i, sheet.edgesAtLevel(0)]);

            if (!this.edgesToVertex.has(end)) {
                this.edgesToVertex.set(end, []);
            }
            otherEdges = this.edgesToVertex.get(end);
            otherEdges.push([i, sheet.edgesAtLevel(sheet.nbVertices())]);
        }
    }
 
    addFacet(skeletonVertexIdx, offset, label) {
        let map = this.facetIds.get(skeletonVertexIdx);
        if(map === undefined) {
            map = new Map();
            this.facetIds.set(skeletonVertexIdx, map);
        }
        map.set(offset, label);
    }

    getFacet(skeletonVertexIdx, offset) {
        let map = this.facetIds.get(skeletonVertexIdx);
        if (map === undefined) {
            return undefined;
        } else {
           return map.get(offset);
        }
    }

    static deserialize(jsonObj) {
       let skeleton = PlanarDiagram.deserialize(jsonObj.skeleton);
       let sheets = new Map();
       for (let key in jsonObj.sheets) {
          if (!jsonObj.sheets.hasOwnProperty(key)) continue;
          let convertedKey = key === 'default' ? key : Number(key);
          sheets.set(convertedKey, PlanarDiagram.deserialize(jsonObj.sheets[key]));
       }
       let diagram = new DoubleDiagram(skeleton, sheets);
       if (jsonObj.facets !== undefined) {
         for (let key in jsonObj.facets) {
            if (!jsonObj.sheets.hasOwnProperty(key)) continue;
            let map = new Map();
            for(let key2 in jsonObj.facets[key]) {
                if(!jsonObj.facets[key].hasOwnProperty(key2)) continue;
                map.set(Number(key2), jsonObj.facets[key][key2]);
            }
            diagram.facetIds.set(Number(key), map);
         }
       }
       return diagram;
    }

    serialize() {
       let sheets = {};
       this.sheets.forEach((val,key) => sheets[key] = val.serialize());
       let facets = {};
       this.facetIds.forEach((val,key) => {
         let facet = {};
         val.forEach((label,idx) => facet[idx] = label);
         facets[key] = facet;
       });
       return {
          skeleton: this.skeleton.serialize(),
          sheets: sheets,
          facets: facets,
       }
    }

    // Returns the constraint prefix for skeleton edge i
    prefixForSheet(i) {
        return 's'+i+'_';
    }

    // Computes the 3D coordinates of all components involved
    computeLayout() {
       // Compute skeleton layout
       this.skeletonLayout = new GlpkTwoDimensionalLayout(this.skeleton);
       this.skeletonLayout.sliceHeight = this.skeletonSliceHeight;
       this.skeletonLayout.edgeDist = this.skeletonEdgeDist;
       for(let i = 0; i < this.skeleton.nbEdges(); i++) {
          let l = 0;
          if (this.sheets.get(i).nbEdges() > 0) {
             let diag = this.sheets.get(i);
             let sheetLayout = new GlpkTwoDimensionalLayout(diag);
             sheetLayout.sliceHeight = this.sheetSliceHeight;
             sheetLayout.computeVerticalPositions();
             l = sheetLayout.vertexHeight.get(diag.nbVertices());
          }
          this.skeletonLayout.setEdgeLength(i, l);
       }
       let skeletonConstraints = this.skeletonLayout.getConstraints('skeleton_');
       this.skeletonSolutions = Glpk.solve(skeletonConstraints);
       this.skeletonLayout.computeLayout('skeleton_', this.skeletonSolutions);
       this.skelVertexHeight = this.skeletonLayout.vertexHeight;
    }

    sheetHeight(i) {
       return this.skelVertexHeight.get(this.skeleton.endingVertex(i)) - this.skelVertexHeight.get(this.skeleton.startingVertex(i)) - this.skeletonSliceHeight;
    }
    
    // number of sheet edges joining up at a given vertex
    edgesAtVertex(i) {
        if(this.edgesToVertex.has(i)) {
           return this.edgesToVertex.get(i)[0][1].length;
        } else if (this.edgesFromVertex.has(i)) {
           return this.edgesFromVertex.get(i)[0][1].length;
        } else {
           return 0;
        }
    }
        

    // Builds the equation system to determine horizontal positions
    buildConstraintSystem() {
       // list of all substitutions constraints
       var substitutions = [];
       
       // create substitutions for each vertex
       for(let i = 0; i < this.skeleton.nbVertices(); i++) {
          let vertexRbVar = 'v'+i+'_rb';
          if (this.edgesToVertex.has(i)) {
             let edgesTo = this.edgesToVertex.get(i);
             
             // Compute the average of the incoming edges
             let vars = [];
             let previousLength = 0;
             for(let j = 0; j < edgesTo.length; j++) {
                if (j > 0 && edgesTo[j][1].length !== previousLength) {
                   throw new Error("Trying to join up sheets with mismatching boundaries at vertex "+i);
                }
                previousLength = edgesTo[j][1].length;
                for(let k = 0; k < previousLength; k++) {
                   let variable = {name: this.prefixForSheet(edgesTo[j][0])+'e'+edgesTo[j][1][k],
                              coef: 1.0/edgesTo.length};
                   if(j === 0) {
                     vars.push([variable]);
                   } else {
                     vars[k].push(variable);
                   }
                }
                // match right boundary to a common variable
                let rbVar = this.prefixForSheet(edgesTo[j][0])+'rb';
                substitutions.push({
                   name: 'eqn_'+vertexRbVar+'_'+rbVar,
                   vars: [{name:vertexRbVar,coef:1.0},{name:rbVar,coef:-1.0}],
                   bnds: { type: Glpk.GLP_FX, ub: 0.0, lb: 0.0 },
                });
             }
             // Create new variables for each edge
             for(let k = 0; k < vars.length; k++) {
                let name = 'joinv_'+i+'_'+k;
                substitutions.push({
                    name: name,
                    vars: vars[k].concat([{name: name, coef:-1.0}]),
                    bnds: { type: Glpk.GLP_FX, ub: 0.0, lb: 0.0 },
                });
             }
        }
        if (this.edgesFromVertex.has(i)) {
             let edgesFrom = this.edgesFromVertex.get(i);
             // Equate the outgoing edges to the averages
             for(let j = 0; j < edgesFrom.length; j++) {
                let edgeFrom = edgesFrom[j];
                let prefix = this.prefixForSheet(edgeFrom[0]);
                for(let k = 0; k < edgeFrom[1].length; k++) {
                    let edgeName = prefix+'e'+edgeFrom[1][k];
                    substitutions.push({
                      name: ('join_'+edgeName),
                      vars: [{name: 'joinv_'+i+'_'+k, coef:1.0},{name: edgeName, coef:-1.0}],
                      bnds: { type: Glpk.GLP_FX, ub: 0.0, lb: 0.0 },
                   });
                }
                // And the right boundaries
                let ownRb = this.prefixForSheet(edgeFrom[0])+'rb';
                substitutions.push({
                    name: 'eqn_'+vertexRbVar+'_'+ownRb,
                    vars: [{name: ownRb, coef: 1.0},{name: vertexRbVar, coef: -1.0}],
                    bnds: { type: Glpk.GLP_FX, ub: 0.0, lb: 0.0 },
                });
             }
          }
       }
       
       // join up constraint systems for each edge
       let program = {
           name:'LP',
           objective:{vars:[],direction:Glpk.GLP_MIN,name:'obj'},
           subjectTo:[]
       };
       for(let i = 0; i < this.skeleton.nbEdges(); i++) {
          if(this.sheets.has(i)) {
             let layout = new GlpkTwoDimensionalLayout(this.sheets.get(i));
             layout.sliceHeight = this.sheetSliceHeight;
             let constraints = layout.getConstraints(this.prefixForSheet(i));
             program = this.mergeConstraintSystems(program, constraints);
          }
      }
      program.subjectTo = program.subjectTo.concat(substitutions);
      return program;
    }

    /**
     * Merge two constraint systems into one
     */
    mergeConstraintSystems(a, b) {
        // Make the new objective: sum of all variables involved in both
        let allVariables = new Set();
        for(let i = 0; i < a.objective.vars.length; i++) {
           allVariables.add(a.objective.vars[i].name);
        }
        for(let i = 0; i < b.objective.vars.length; i++) {
           allVariables.add(b.objective.vars[i].name);
        }
        let objectiveVars = [];
        for(let variable of allVariables) {
           objectiveVars.push({name:variable, weight:1.0});
        }

        // Join up the constraints
        return {
           name: 'LP',
           objective: {
             direction: Glpk.GLP_MIN,
             name: 'obj',
             vars: objectiveVars
           },
           subjectTo: a.subjectTo.concat(b.subjectTo)
        };
    }

    /**
     * Returns an array of horizontal positions
     * of edges on a given sheet and local height
     */
    edgePositions(solutions, sheetId, height) {
        let variables = solutions.result.vars;
        let edgeIds = this.sheets.get(sheetId).edgesAtLevel(height);
        return edgeIds.map(eid => variables[this.prefixForSheet(sheetId)+'e'+eid]);
    }

    /**
     * Returns an array of horizontal positions
     * of sheet edges crossing a given skeleton vertex.
     */
    vertexPositions(solutions, vertexId) {
        let positions = [];
        for(let i = 0; i < this.edgesAtVertex(vertexId); i++) {
            positions.push(solutions.result.vars['joinv_'+vertexId+'_'+i]);
        }
        return positions;
    }
        
}
