
import DiagramLibrary from './library.js' ;
import SheetDiagram from './sheet_diagram.js' ;

let diag = new SheetDiagram([1, 2], [{swap: 0}]);

test('saves and retrieves diagrams', function() {
        let lib = new DiagramLibrary();

        expect(lib.size()).toEqual(0);
        expect(lib.getDiagram('myDiagram')).toEqual(undefined);
        expect(lib.names()).toEqual([]);
       
        lib.addDiagram('myDiagram', diag);

        expect(lib.size()).toEqual(1);
        expect(lib.names()).toEqual(['myDiagram']);
        expect(lib.getDiagram('myDiagram').nbVertices()).toEqual(1);

        lib.remove('myDiagram');

        expect(lib.size()).toEqual(0);
});

test('imports and exports in JSON', function() {
        let json = {
                diagrams: [
                        { name: "myDiagram",
                          diagram: diag.serialize()
                        }
                ]
        };

        let lib = new DiagramLibrary();
        lib.importFromJSON(json);

        expect(lib.size()).toEqual(1);
        expect(lib.getDiagram('myDiagram').nbVertices()).toEqual(1);
        expect(lib.exportToJSON()).toEqual(json);
});
