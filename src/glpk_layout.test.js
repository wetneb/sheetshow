import GlpkTwoDimensionalLayout from './glpk_layout.js' ;
import PlanarDiagram from './planar_diagram.js' ;

test('constraints start with the prefix', function() {
      let diag = new PlanarDiagram(3, [{offset:1, inputs:1, outputs:2},
                                       {offset:2, inputs:2, outputs:2}]);
      let layout = new GlpkTwoDimensionalLayout(diag);

      let constraints = layout.getConstraints('some_prefix');
      for(let i = 0; i < constraints.subjectTo.length; i++) {
        let constraint = constraints.subjectTo[i];
        expect(constraint.name).toEqual(expect.stringContaining('some_prefix'));
        for(let j = 0; j < constraint.vars.length; j++) {
           expect(constraint.vars[j].name).toEqual(expect.stringContaining('some_prefix'));
        }
      }
});


