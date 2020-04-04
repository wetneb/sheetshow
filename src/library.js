
import SheetDiagram from './sheet_diagram.js' ;

/**
 * Stores a collection of diagrams indexed by name
 */
export default class DiagramLibrary {

        constructor() {
		this.lst = [];
        }

        // returns the number of diagrams stored in the library
        size() {
		return this.lst.length;
        }

        // returns the list of names of diagrams in the library
        names() {
		return this.lst.map(d => d.name);
        }
        
        // retrieve a diagram by name, or undefined if no such name exists
        getDiagram(name) {
		let record = this._findRecord(name);
		return record === undefined ? undefined : record.diagram;
        }

        // add a new diagram by name
        addDiagram(name, diagram) {
		let record = this._findRecord(name);
		if (record === undefined) {
			this.lst.push({name,diagram});
		} else {
			record.diagram = diagram;
		}
        }

        // removes a diagram
        remove(name) {
		for(let i = 0; i != this.lst.length; i++) {
			if (this.lst[i].name === name) {
				this.lst.splice(i, 1);
				break;
			}
		}
        }

        // exports the whole library as a JSON file
        exportToJSON() {
                return {diagrams: this.lst.map(r => ({name:r.name, diagram: r.diagram.serialize()}))};
        }

        // imports a library from a JSON representation
        importFromJSON(json) {
		this.lst = json.diagrams.map(r => ({name:r.name, diagram: SheetDiagram.deserialize(r.diagram)}));
        }

	_findRecord(name) {
		for(let i = 0; i != this.lst.length; i++) {
			if (this.lst[i].name === name) {
				return this.lst[i];
			}
		}
		return undefined;
	}
}

