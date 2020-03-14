
export default class SimpleTwoDimensionalLayout {
   constructor(nbInputs, slices) {
      this.slices = slices;
      this.edgeDist = 40.0;
      this.sliceHeight = 40.0;

      // Compute number of wires at each level
      this.wiresAtLevel = [nbInputs];
      this.maxWiresAtLevel = nbInputs;
      for(let i = 0; i < slices.length; i++) {
        let slice = slices[i];
        this.wiresAtLevel.push(this.wiresAtLevel[this.wiresAtLevel.length - 1] + slice.outputs - slice.inputs);
        this.maxWiresAtLevel = Math.max(this.maxWiresAtLevel, this.wiresAtLevel[this.wiresAtLevel.length - 1]);
      }

      let xCenter = ((this.maxWiresAtLevel - 1)*this.edgeDist)/2.;

      // Compute the edge paths
      this.edges = [];
      this.vertices = [];
      var currentEdges = [];
      // Init the current edges
      for(let i = 0; i < this.wiresAtLevel[0]; i++) {
        currentEdges.push(i);
        let x = xCenter + (i - 0.5*(this.wiresAtLevel[0]-1))*this.edgeDist;
        this.edges.push([{'x': x, 'y': 0}]);
      }
      for(let i = 0; i < slices.length; i++) {
        let slice = slices[i];
        let nbWires = this.wiresAtLevel[i];
        let nbWiresNext = this.wiresAtLevel[i+1];
        
        let newCurrentEdges = [];
        // Extend wires before offset
        for(let j = 0; j < slice.offset; j++) {
           let x = xCenter + (j - 0.5*(nbWiresNext-1))*this.edgeDist;
           let edge = this.edges[currentEdges[j]];
           edge.push({'x': x, 'y': (i+1)*this.sliceHeight});
           newCurrentEdges.push(currentEdges[j]);
        }

        // Finish wires connected to vertex
        var vertex = {
           'x': xCenter + (2*slice.offset + slice.inputs - nbWires)*0.5*this.edgeDist,
           'y': (i+0.5)*this.sliceHeight
        }
        this.vertices.push(vertex);
        for(let j = 0; j < slice.inputs; j++) {
           let edge = this.edges[currentEdges[slice.offset + j]];
           edge.push(vertex);
        }

        // Add wires starting from vertex
        for(let j = 0; j < slice.outputs; j++) {
           let edgeIdx = this.edges.length;
           newCurrentEdges.push(edgeIdx);
           let nextX = xCenter + (slice.offset + j - 0.5*(nbWiresNext - 1))*this.edgeDist;
           this.edges.push([vertex, {'x': nextX, 'y': (i+1)*this.sliceHeight}]); 
        }

        // Add remaining wires
        for(let j = slice.offset + slice.inputs; j < nbWires; j++) {
           let edge = this.edges[currentEdges[j]];
           edge.push({'x': xCenter + (j - slice.inputs + slice.outputs - 0.5*(nbWiresNext-1))*this.edgeDist, 'y': (i+1)*this.sliceHeight});
           newCurrentEdges.push(currentEdges[j]);
        }

        currentEdges = newCurrentEdges;
      }
   }
}


