
import Glpk from 'glpk.js';


export default class GlpkBimonoidalLayout {
    constructor(diagram) {
        this.diag = diagram;
        this.edgeDist = 15.0; 
        this.margins = 15.0;
        this.avgEpsilon = 0.1;

    }

    /**
     * Solves the constraints with GLPK to deduce node and path positions.
     */
    compute() {
        let program = this.getWireConstraints();
        let solutions = Glpk.solve(program);
        this.solutions = solutions.result.vars;
    }

    getNodePosition(vertexId, nodeId) {
        return this.solutions[`node${vertexId}_${nodeId}`];
    }

    getPathPosition(edgeId, pathId) {
        return this.solutions[`w${edgeId}_${pathId}`];
    }

    getSheetWidth() {
        return this.solutions['rb'];
    }

    /**
     * Computes a GLPK program for the positions of wires
     * on sheets.
     */
    getWireConstraints() {
       // weighted list of all variables appearing in the program.
       // we minimize their sum as objective.
       let allVars = [
         {name: 'lb', coef: 1.0},
         {name: 'rb', coef: 1.0}
       ];
       // list of all constraints generated by the wires.
       let constraints = [{
           name: 'lb',
           vars: [
              { name: 'lb', coef: 1.0 },
           ],
           bnds: { type: Glpk.GLP_FX, ub: 0.0, lb: 0.0 }
        }];

        // For each sheet
        for(let i = 0; i < this.diag.nbEdges(); i++) {
            let paths = this.diag.getPathsOnEdge(i);
    
            // space out all the wires on this sheet
            for(let j = 0; j < paths.length; j++) {
                allVars.push({
                   name: `w${i}_${j}`,
                   coef: 1.0
                });

                if (j === 0) {
                    constraints.push({
                        name: `wire_r${i}_${j}`,
                        vars: [
                            { name: `w${i}_${j}`, coef: 1.0 }
                        ],
                        bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: this.margins }
                    });
                }

                let rightEdge = 'rb';
                let dist = this.margins;
                if (j < paths.length - 1) {
                    rightEdge = `w${i}_${j+1}`;
                    dist = this.edgeDist;
                }
                constraints.push({
                    name: `wire_${i}_${j}`,
                    vars: [
                        { name: rightEdge, coef: 1.0 },
                        { name: `w${i}_${j}`, coef: -1.0 }
                    ],
                    bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: dist }
                });
            }
        }

        // For each seam
        for(let i = 0; i < this.diag.nbVertices(); i++) {
            // For each node on that seam
            for(let j = 0; j < this.diag.nbNodesOnVertex(i); j++) {
                let varName = `node${i}_${j}`;
                
                // Vertex is centered around the mean of its inputs
                let inputVars = [{name: varName, coef: -1.0}];
                let incomingPaths = this.diag.getIncomingPaths(i, j);
                for(let k = 0; k < incomingPaths.length; k++) {
                    inputVars.push({
                        name: `w${incomingPaths[k][0]}_${incomingPaths[k][1]}`,
                        coef: 1.0 / incomingPaths.length
                    });
                }
                if (incomingPaths.length > 0) {
                    constraints.push({
                        name: varName + '_inputs',
                        vars: inputVars,
                        bnds: { type: Glpk.GLP_DB, ub: this.avgEpsilon, lb: -this.avgEpsilon },
                    });
                }

                // Vertex is centered around the mean of its outputs
                let outputVars = [{name: varName, coef: -1.0}];
                let outgoingPaths = this.diag.getOutgoingPaths(i, j);
                for(let k = 0; k < outgoingPaths.length; k++) {
                    outputVars.push({
                        name: `w${outgoingPaths[k][0]}_${outgoingPaths[k][1]}`,
                        coef: 1.0 / outgoingPaths.length
                    });
                }
                if (outgoingPaths.length > 0) {
                    constraints.push({
                        name: varName + '_outputs',
                        vars: outputVars,
                        bnds: { type: Glpk.GLP_DB, ub: this.avgEpsilon, lb: -this.avgEpsilon }
                    });
                }
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
}
