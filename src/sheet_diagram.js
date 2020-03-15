

import PlanarDiagram from './planar_diagram.js' ;

/**
 * A sheet diagram for a morphism in a bimonoidal category.
 * It inherits from PlanarDiagram in the sense that it can be
 * seen as a monoidal string diagram for the additive structure.
 */
export default class SheetDiagram extends PlanarDiagram {

   /**
    * Constructs a sheet diagram by proving:
    * - a specification of input sheets, as a list of integers,
    *   each integer representing the number of wires on the n-th
    *   input sheet
    * - a list of slices, each specifying how many input sheets and
    *   output sheets it is connected to, with an offset, and a list
    *   of nodes on the seam with their similar specification.
    */
   constructor(inputSheets, slices) {
        super(inputSheets.length, slices);
        this.inputSheets = inputSheets;
        this.pathToNode = [];
        // map from [vertex id, node it] to the list of [edge id, path id] linked to it from above
        this.incomingPaths = new Map();
        // map from [vertex id, node it] to the list of [edge id, path id] linked to it from below
        this.outgoingPaths = new Map();

        let nextEdgeId = 0;
        let currentEdges = [];
        let nextNodeId = 0;
        for(let i = 0; i < inputSheets.length; i++) {
           let pathsOnCurrentSheet = [];
           for(let j = 0; j < inputSheets[i]; j++) {
               pathsOnCurrentSheet.push([j]);
           }
           this.pathToNode.push(pathsOnCurrentSheet);
           currentEdges.push(i);
           nextEdgeId++;
        }

        for(let i = 0; i < slices.length; i++) {
             let slice = slices[i];
             if (slice.nodes === undefined) {
                slice.nodes = [];
             }
             
             let newCurrentEdges = [];
             // Extend sheets before offset
             for(let j = 0; j < slice.offset; j++) {
                newCurrentEdges.push(currentEdges[j]);
             }

             // Prepare edge ids for output sheets
             let outputEdgeIds = [];
             for(let j = 0; j < slice.outputs; j++) {
                outputEdgeIds.push(nextEdgeId);
                this.pathToNode.push([]);
                nextEdgeId++;
             }
             
             // Browse the list of nodes on this seam
             let inputSheetCursors = [];
             let outputSheetCursors = [];
             for(let j = 0; j < slice.inputs; j++) {
                inputSheetCursors.push(0);
             }
             for(let j = 0; j < slice.outputs; j++) {
                outputSheetCursors.push(0);
             }

             let nextNodeId = 0;
             for(let j = 0; j < slice.nodes.length; j++) {
                let node = slice.nodes[j];

                // Add fake whiskering nodes
                for(let k = 0; k < node.offset; k++) {
                   for(let m = 0; m < slice.inputs; m++) {
                       let paths = this.pathToNode[currentEdges[slice.offset + m]];
                       if (inputSheetCursors[m] >= paths.length) {
                           throw new Error(`Not enough wires on input sheet ${m} at slice ${i}`);
                       }
                       paths[inputSheetCursors[m]].push(nextNodeId);
                       this._addIncomingPath(i, nextNodeId, currentEdges[slice.offset + m], inputSheetCursors[m]);
                       inputSheetCursors[m]++;
                   }
                   for(let m = 0; m < slice.outputs; m++) {
                       this._addOutgoingPath(i, nextNodeId, outputEdgeIds[m], this.pathToNode[outputEdgeIds[m]].length);
                       this.pathToNode[outputEdgeIds[m]].push([nextNodeId]);
                   }
                   nextNodeId++;
                }

                // Bind inputs paths to the current real node
                for(let m = 0; m < slice.inputs; m++) {
                   for(let k = 0; k < node.inputs[m]; k++) {
                      let paths = this.pathToNode[currentEdges[slice.offset + m]];
                      if (inputSheetCursors[m] >= paths.length) {
                          throw new Error(`Not enough wires on input sheet ${m} at slice ${i}`);
                      }
                      paths[inputSheetCursors[m]].push(nextNodeId);
                      this._addIncomingPath(i, nextNodeId, currentEdges[slice.offset + m], inputSheetCursors[m]);
                      inputSheetCursors[m]++;
                   }
                }

                // Bind output paths to the current real node
                for(let m = 0; m < slice.outputs; m++) {
                   for(let k = 0; k < node.outputs[m]; k++) {
                      this._addOutgoingPath(i, nextNodeId, outputEdgeIds[m], this.pathToNode[outputEdgeIds[m]].length);
                      this.pathToNode[outputEdgeIds[m]].push([nextNodeId]);
                   }
                }

                nextNodeId++;
             }

             // Add remaining fake whiskering nodes
             let nbWhiskeringNodes = -1;
             for(let m = 0; m < slice.inputs; m++) {
                let paths = this.pathToNode[currentEdges[slice.offset + m]];
                if (m > 0 && nbWhiskeringNodes !== paths.length - inputSheetCursors[m]) {
                   throw new Error(`Joining up sheets with inconsistent numbers of wires on them, at slice ${i}`);
                }
                nbWhiskeringNodes = paths.length - inputSheetCursors[m];
                for(let k = inputSheetCursors[m]; k < paths.length; k++) {
                    let nodeId = nextNodeId + k - inputSheetCursors[m];
                    paths[k].push(nodeId);
                    this._addIncomingPath(i, nodeId, currentEdges[slice.offset + m], k);
                }
             }
             for(let m = 0; m < slice.outputs; m++) {
                let paths = this.pathToNode[outputEdgeIds[m]];
                for(let k = 0; k < nbWhiskeringNodes; k++) {
                   this._addOutgoingPath(i, nextNodeId + k, outputEdgeIds[m], paths.length);
                   paths.push([nextNodeId + k]);
                }
             }

             for(let j = 0; j < slice.outputs; j++) {
                newCurrentEdges.push(outputEdgeIds[j]);
             }
             
             for(let j = slice.offset + slice.inputs; j < currentEdges.length; j++) {
                newCurrentEdges.push(currentEdges[j]);
             }
             currentEdges = newCurrentEdges;
        }
        
        // Close off the remaining sheets, linked to the output boundary
        for(let i = 0; i < currentEdges.length; i++) {
            let paths = this.pathToNode[currentEdges[i]];
            for(let j = 0; j < paths.length; j++) {
                paths[j].push(j);
            }
        }
   }

   getPathsOnEdge(i) {
       return this.pathToNode[i];
   } 

   serialize() {
       return {
          inputs: this.inputSheets,
          slices: this.slices
        };
   }


   getIncomingPaths(vertexId, nodeId) {
        let current = this.incomingPaths.get(`${vertexId}_${nodeId}`);
        return current === undefined ? [] : current;
   }

   getOutgoingPaths(vertexId, nodeId) {
        let current = this.outgoingPaths.get(`${vertexId}_${nodeId}`);
        return current === undefined ? [] : current;
   }

   _addIncomingPath(vertexId, nodeId, edgeId, pathId) {
        let current = this.incomingPaths.get(`${vertexId}_${nodeId}`);
        if (current === undefined) {
            current = [[edgeId,pathId]];
        } else {
            current.push([edgeId, pathId]);
        }
        this.incomingPaths.set(`${vertexId}_${nodeId}`, current);
   }

   _addOutgoingPath(vertexId, nodeId, edgeId, pathId) {
        let current = this.outgoingPaths.get(`${vertexId}_${nodeId}`);
        if (current === undefined) {
            current = [[edgeId,pathId]];
        } else {
            current.push([edgeId, pathId]);
        }
        this.outgoingPaths.set(`${vertexId}_${nodeId}`, current);
   }
}
