

import PlanarDiagram from './planar_diagram.js' ;

export default class SheetDiagram extends PlanarDiagram {

   constructor(inputSheets, slices) {
        super(inputSheets.length, slices);
        this.inputSheets = inputSheets;
        this.pathToNode = [];

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
                       this.pathToNode[currentEdges[slice.offset + m]][inputSheetCursors[m]].push(nextNodeId);
                       inputSheetCursors[m]++;
                   }
                   for(let m = 0; m < slice.outputs; m++) {
                       this.pathToNode[outputEdgeIds[m]].push([nextNodeId]);
                   }
                   nextNodeId++;
                }

                // Bind inputs paths to the current real node
                for(let m = 0; m < slice.inputs; m++) {
                   for(let k = 0; k < node.inputs[m]; k++) {
                      this.pathToNode[currentEdges[slice.offset + m]][inputSheetCursors[m]].push(nextNodeId);
                      inputSheetCursors[m]++;
                   }
                }

                // Bind output paths to the current real node
                for(let m = 0; m < slice.outputs; m++) {
                   for(let k = 0; k < node.outputs[m]; k++) {
                      this.pathToNode[outputEdgeIds[m]].push([nextNodeId]);
                   }
                }

                nextNodeId++;
             }

             // Add remaining fake whiskering nodes
             let nbWhiskeringNodes = -1;
             for(let m = 0; m < slice.inputs; m++) {
                let paths = this.pathToNode[currentEdges[slice.offset + m]];
                // TODO check that this assignment is the same for all sheets
                nbWhiskeringNodes = paths.length - inputSheetCursors[m];
                for(let k = inputSheetCursors[m]; k < paths.length; k++) {
                    paths[k].push(nextNodeId + k - inputSheetCursors[m]);
                }
             }
             for(let m = 0; m < slice.outputs; m++) {
                let paths = this.pathToNode[outputEdgeIds[m]];
                for(let k = 0; k < nbWhiskeringNodes; k++) {
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
}
