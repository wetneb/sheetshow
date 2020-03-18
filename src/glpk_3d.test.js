
import SheetDiagram from './sheet_diagram.js' ;
import GlpkBimonoidalLayout from './glpk_3d.js' ;
import Glpk from 'glpk.js' ;

test('simple diagram', function() {
      let slices = [{
                offset:1,
                inputs:1,
                outputs:2,
                nodes: [
                   {
                      offset: 0,
                      inputs: [1],
                      outputs: [1,1]
                   }
                ]
              },
              {
                 offset:2,
                 inputs:2,
                 outputs:2,
                 nodes: [
                   {
                      offset: 0,
                      inputs: [2, 2],
                      outputs: [1, 1]
                   }
                ]
              }];
      let diag = new SheetDiagram([ 1, 2, 2], slices);

      let margin = 15.0;
      let edgeDist = 15.0;
      let avgEpsilon = 0.1;
      
      let layout = new GlpkBimonoidalLayout(diag);
      let constraints = layout.getWireConstraints(false);
      expect(constraints).toEqual({
        name: 'LP',
        objective: {
           direction: Glpk.GLP_MIN,
           name: 'obj',
           vars: expect.arrayContaining(
                ['lb', 'rb', 'w0_0', 'w1_0', 'w1_1', 'w2_0', 'w2_1', 'w3_0', 'w3_1', 'w4_0', 'w4_1', 'w5_0', 'w6_0']
                .map(s => {return {name: s, coef: 1.0}}))
        },
        subjectTo: expect.arrayContaining([
           {
                name: 'lb',
                vars: [{name: 'lb', coef: 1.0}],
                bnds: { type: Glpk.GLP_FX, ub: 0.0, lb: 0.0 }
           },
           {
                name: 'wire_r0_0',
                vars: [{ name: 'w0_0', coef: 1.0 }],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           },
           {
                name: 'wire_0_0',
                vars: [{name: 'rb', coef: 1.0},{name: 'w0_0', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           }, 
           {
                name: 'wire_r1_0',
                vars: [{ name: 'w1_0', coef: 1.0 }],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           },
           {
                name: 'wire_1_0',
                vars: [{name: 'w1_1', coef: 1.0},{name: 'w1_0', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: edgeDist }
           }, 
           {
                name: 'wire_1_1',
                vars: [{name: 'rb', coef: 1.0},{name: 'w1_1', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           }, 
           {
                name: 'wire_r2_0',
                vars: [{ name: 'w2_0', coef: 1.0 }],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           },
           {
                name: 'wire_2_0',
                vars: [{name: 'w2_1', coef: 1.0},{name: 'w2_0', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: edgeDist }
           }, 
           {
                name: 'wire_2_1',
                vars: [{name: 'rb', coef: 1.0},{name: 'w2_1', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           }, 
           {
                name: 'wire_r3_0',
                vars: [{ name: 'w3_0', coef: 1.0 }],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           },
           {
                name: 'wire_3_0',
                vars: [{name: 'w3_1', coef: 1.0},{name: 'w3_0', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: edgeDist }
           }, 
           {
                name: 'wire_3_1',
                vars: [{name: 'rb', coef: 1.0},{name: 'w3_1', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           }, 
           {
                name: 'wire_r4_0',
                vars: [{ name: 'w4_0', coef: 1.0 }],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           },
           {
                name: 'wire_4_0',
                vars: [{name: 'w4_1', coef: 1.0},{name: 'w4_0', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: edgeDist }
           }, 
           {
                name: 'wire_4_1',
                vars: [{name: 'rb', coef: 1.0},{name: 'w4_1', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           }, 
           {
                name: 'wire_r5_0',
                vars: [{ name: 'w5_0', coef: 1.0 }],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           },
           {
                name: 'wire_5_0',
                vars: [{name: 'rb', coef: 1.0},{name: 'w5_0', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           },
           {
                name: 'wire_r6_0',
                vars: [{ name: 'w6_0', coef: 1.0 }],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           },
           {
                name: 'wire_6_0',
                vars: [{name: 'rb', coef: 1.0},{name: 'w6_0', coef: -1.0}],
                bnds: { type: Glpk.GLP_LO, ub: 0.0, lb: margin }
           }, 
           {
                name: 'node0_0_inputs',
                vars: [{name: 'node0_0', coef: -1.0},{name: 'w1_0', coef: 1.0}],
                bnds: { type: Glpk.GLP_DB, ub: avgEpsilon, lb: -avgEpsilon }
           },
           {
                name: 'node0_0_outputs',
                vars: [{name: 'node0_0', coef: -1.0},{name: 'w3_0', coef: 0.5},{name: 'w4_0', coef: 0.5}],
                bnds: { type: Glpk.GLP_DB, ub: avgEpsilon, lb: -avgEpsilon }
           },
           {
                name: 'node1_0_inputs',
                vars: [{name: 'node1_0', coef: -1.0},
                       {name: 'w4_0', coef: 0.25},
                       {name: 'w4_1', coef: 0.25},
                       {name: 'w2_0', coef: 0.25},
                       {name: 'w2_1', coef: 0.25}],
                bnds: { type: Glpk.GLP_DB, ub: avgEpsilon, lb: -avgEpsilon }
           },
           {
                name: 'node1_0_outputs',
                vars: [{name: 'node1_0', coef: -1.0},{name: 'w5_0', coef: 0.5},{name: 'w6_0', coef: 0.5}],
                bnds: { type: Glpk.GLP_DB, ub: avgEpsilon, lb: -avgEpsilon }
           },
        ])
      });

      // Check that the program can be solved
      layout.compute();
      expect(layout.getPathPosition(1, 0)).toBeCloseTo(margin, 0);
      expect(layout.getNodePosition(0, 0)).toBeCloseTo(margin, 0);
});

test('fall back to non-strict mode', function() {
       let slices = [{
                offset:0,
                inputs:1,
                outputs:2,
                nodes: [
                   {
                      offset: 0,
                      inputs: [1],
                      outputs: [1,1]
                   }
                ]
              },
              {
                 offset:0,
                 inputs:1,
                 outputs:1,
                 nodes: [
                   {
                      offset: 0,
                      inputs: [1],
                      outputs: [2]
                   }
                ]
              },
              {
                  offset: 0,
                  inputs: 1,
                  outputs: 1,
                  nodes: [
                    {
                        offset: 0,
                        inputs: [1],
                        outputs: [0]
                    }]
              },
              {
                   offset: 0,
                   inputs: 2,
                   outputs: 1,
                   nodes: []
              }
        ];
      let diag = new SheetDiagram([ 1], slices);
      let layout = new GlpkBimonoidalLayout(diag);

      let avgEpsilon = 0.1;

      let constraints = layout.getWireConstraints(true);
      let solutions = Glpk.solve(constraints);
      // program cannot be solved
      expect(solutions.result.status).toEqual(1);
      constraints = layout.getWireConstraints(false);
      solutions = Glpk.solve(constraints);
      expect(solutions.result.status).toEqual(5);
});
