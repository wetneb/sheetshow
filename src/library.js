
import SheetDiagram from './sheet_diagram.js' ;

/**
 * Stores a collection of diagrams indexed by name
 */
export default class DiagramLibrary {

        constructor() {
                this.map = new Map();
        }

        // returns the number of diagrams stored in the library
        size() {
                return this.map.size;
        }

        // returns the list of names of diagrams in the library
        names() {
                return [... this.map.keys()];
        }
        
        // retrieve a diagram by name, or undefined if no such name exists
        getDiagram(name) {
                return this.map.get(name);
        }

        // add a new diagram by name
        addDiagram(name, diagram) {
                this.map.set(name, diagram);
        }

        // removes a diagram
        remove(name) {
                this.map.delete(name);
        }

        // exports the whole library as a JSON file
        exportToJSON() {
                return {
                        diagrams: this.names().map(n => ({ name: n, diagram: this.getDiagram(n).serialize() }))
                };
        }

        // imports a library from a JSON representation
        importFromJSON(json) {
                json.diagrams.forEach(d => this.addDiagram(d.name, SheetDiagram.deserialize(d.diagram)));
        }
}

