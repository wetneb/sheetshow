
let serializeSlice = function(slice) {
   let result = [slice.offset, slice.inputs, slice.outputs];
   if (slice.label !== undefined && slice.label !== null) {
        result.push(slice.label);
   }
   return result;
}

export default class PlanarDiagram {
    constructor(nbInputs, slices) {
        this.nbInputs = nbInputs;
        this.slices = slices;
        this.domainLabels = new Map();
        this.codomainLabels = new Map();
 
        this.edgeEnds = [];
        let currentEdges = [];
        for(let i = 0; i < nbInputs; i++) {
            currentEdges.push(i);
            this.edgeEnds.push([-1]);
        }
        this.wiresAtLevel = [currentEdges];
        let nextEdgeIdx = nbInputs;
        for(let i = 0; i < slices.length; i++) {
            let slice = slices[i];
        
            let newCurrentEdges = [];
            // Extend wires before offset
            for(let j = 0; j < slice.offset; j++) {
               newCurrentEdges.push(currentEdges[j]);
            }

            // Finish wires connected to vertex
            for(let j = 0; j < slice.inputs; j++) {
               let edgeIdx = currentEdges[slice.offset + j];
               this.edgeEnds[edgeIdx].push(i);
            }

            // Add wires starting from vertex
            for(let j = 0; j < slice.outputs; j++) {
               let edgeIdx = nextEdgeIdx;
               newCurrentEdges.push(edgeIdx);
               this.edgeEnds.push([ i ]);
               nextEdgeIdx++;
            }

            // Add remaining wires
            for(let j = slice.offset + slice.inputs; j < currentEdges.length; j++) {
                newCurrentEdges.push(currentEdges[j]);
            }
                
            currentEdges = newCurrentEdges;
            this.wiresAtLevel.push(currentEdges);
        }
        for(let i = 0; i < currentEdges.length; i++) {
            this.edgeEnds[currentEdges[i]].push( slices.length );
        }
    }

    static deserialize(jsonObj) {
       let d = new PlanarDiagram(jsonObj.inputs,
                jsonObj.slices.map(
                        triple => ({
                'offset': triple[0],
                'inputs': triple[1],
                'outputs': triple[2],
                'label': triple.length > 3 ? triple[3] : null})));
       if (jsonObj.domain !== undefined) {
          d.domainLabels = PlanarDiagram.deserializeLabels(jsonObj.domain);
       }
       if (jsonObj.codomain !== undefined) {
          d.codomainLabels = PlanarDiagram.deserializeLabels(jsonObj.codomain);
       }
       return d;
    }

    static deserializeLabels(jsonObj) {
       let labels = new Map();
       for(var key in jsonObj) {
         if(jsonObj.hasOwnProperty(key)) {
           labels.set(Number(key), jsonObj[key]);
         } 
       }
       return labels;
    }
   
    serialize() {
        let baseObj = {
           inputs: this.nbInputs,
           slices: this.slices.map(serializeSlice),
        };
        if(this.domainLabels.size > 0) {
           baseObj.domain = {};
           this.domainLabels.forEach((val,key) => baseObj.domain[key] = val);
        }
        if(this.codomainLabels.size > 0) {
           baseObj.codomain = {};
           this.codomainLabels.forEach((val,key) => baseObj.codomain[key] = val);
        }
        return baseObj;
    }

    // the number of wires at a given height
    nbWires(height) {
        return this.wiresAtLevel[height].length;
    }

    // the number of vertices
    nbVertices() {
        return this.slices.length;
    }

    // the number of edges
    nbEdges() {
        return this.edgeEnds.length;
    }

    // Ids of the edges crossing a given level
    edgesAtLevel(height) {
       return this.wiresAtLevel[height];
    }

    // the starting vertex of an edge, or -1 if domain
    startingVertex(edgeIdx) {
        return this.edgeEnds[edgeIdx][0];
    }

    // the ending vertex of an edge, or nbVertices() if codomain
    endingVertex(edgeIdx) {
        return this.edgeEnds[edgeIdx][1];
    }

    // the vertex (offset, inputs, outputs) at the given height
    getVertex(idx) {
        return this.slices[idx];
    }
}
