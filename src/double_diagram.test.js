import DoubleDiagram from './double_diagram.js' ;
import PlanarDiagram from './planar_diagram.js' ;
import Glpk from 'glpk.js' ;

test('empty double diagram', function() {
      let skeleton = new PlanarDiagram(0, []);
      let sheets = new Map();
      let diagram = new DoubleDiagram(skeleton, sheets);
      
      let program = diagram.buildConstraintSystem();
      Glpk.solve(program).result.vars;
});

test('simple double diagram', function() {
      let skeleton = new PlanarDiagram(1, [{offset:0, inputs:1, outputs:2}]);
      let sheets = new Map();
      sheets.set(0, new PlanarDiagram(1, [{offset:0, inputs:1, outputs:2}]));
      sheets.set(1, new PlanarDiagram(2, []));
      sheets.set(2, new PlanarDiagram(2, [{offset:0, inputs:2, outputs: 1}]));

      let doublediag = new DoubleDiagram(skeleton, sheets);

      let program = doublediag.buildConstraintSystem();
      let solutions = Glpk.solve(program).result.vars;
      expect(solutions.s0_e1).toBeCloseTo(solutions.s1_e0);
      expect(solutions.s0_e1).toBeCloseTo(solutions.s2_e0);
      expect(solutions.s0_e2).toBeCloseTo(solutions.s1_e1);
      expect(solutions.s0_e2).toBeCloseTo(solutions.s2_e1);
});



