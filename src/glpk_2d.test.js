import GlpkTwoDimensionalLayout from './glpk_2d.js' ;
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

test('simple vertical positions', function() {
        let precision = 10;
        let diag = new PlanarDiagram(4, [{offset: 0, inputs: 2, outputs: 2},
                                         {offset: 2, inputs: 2, outputs: 2}]);
        let layout = new GlpkTwoDimensionalLayout(diag);

        layout.computeVerticalPositions();
        
        expect(layout.vertexHeight.get(-1)).toBeCloseTo(-40, precision);
        expect(layout.vertexHeight.get(0)).toBeCloseTo(0, precision);
        expect(layout.vertexHeight.get(1)).toBeCloseTo(0, precision);
        expect(layout.vertexHeight.get(2)).toBeCloseTo(40, precision);
});

test('vertical position for nested cups', function() {
        let precision = 10;
        let diag = new PlanarDiagram(0, [{offset: 0, inputs: 0, outputs: 2},
                                         {offset: 1, inputs: 0, outputs: 2}]);
        let layout = new GlpkTwoDimensionalLayout(diag);

        layout.computeVerticalPositions();
        
        expect(layout.vertexHeight.get(-1)).toBeCloseTo(-40, precision);
        expect(layout.vertexHeight.get(0)).toBeCloseTo(0, precision);
        expect(layout.vertexHeight.get(1)).toBeCloseTo(40, precision);
        expect(layout.vertexHeight.get(2)).toBeCloseTo(80, precision);
});

test('vertical position for scalar and cup', function() {
        let precision = 10;
        let diag = new PlanarDiagram(2, [{offset: 1, inputs: 0, outputs: 0},
                                         {offset: 0, inputs: 2, outputs: 0}]);
        let layout = new GlpkTwoDimensionalLayout(diag);

        layout.computeVerticalPositions();
        
        expect(layout.vertexHeight.get(-1)).toBeCloseTo(-40, precision);
        expect(layout.vertexHeight.get(0)).toBeCloseTo(0, precision);
        expect(layout.vertexHeight.get(1)).toBeCloseTo(40, precision);
        expect(layout.vertexHeight.get(2)).toBeCloseTo(80, precision);
});

test('two scalars', function() {
        let precision = 10;
        let diag = new PlanarDiagram(0, [{offset: 0, inputs: 0, outputs: 0},
                                         {offset: 0, inputs: 0, outputs: 0}]);
        let layout = new GlpkTwoDimensionalLayout(diag);

        layout.computeVerticalPositions();

        expect(layout.vertexHeight.get(-1)).toBeCloseTo(-40, precision);
        expect(layout.vertexHeight.get(0)).toBeCloseTo(0, precision);
        expect(layout.vertexHeight.get(1)).toBeCloseTo(40, precision);
        expect(layout.vertexHeight.get(2)).toBeCloseTo(80, precision);
});

test('node shoulders push void up', function() {
        let precision = 10;
        let diag = new PlanarDiagram(3, [{offset: 0, inputs: 3, outputs: 1},
                                         {offset: 0, inputs: 0, outputs: 1}]);
        let layout = new GlpkTwoDimensionalLayout(diag);

        layout.computeVerticalPositions();

        expect(layout.vertexHeight.get(-1)).toBeCloseTo(-40, precision);
        expect(layout.vertexHeight.get(0)).toBeCloseTo(0, precision);
        expect(layout.vertexHeight.get(1)).toBeCloseTo(40, precision);
        expect(layout.vertexHeight.get(2)).toBeCloseTo(80, precision);
});
