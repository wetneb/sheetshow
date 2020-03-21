import SheetDiagram from './sheet_diagram.js';
import SheetLayout from './sheet_layout.js';
import { Base64 } from 'js-base64';
import seen from './seen.js';

/** SVG export **/

var updateSVGLinkTimeout = null;

function updateSVGLink() {
        let svgText = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'+document.getElementById('seen-canvas').outerHTML;
        document.getElementById('svg-export').setAttribute('href', 'data:image/svg+xml;charset=utf-16;base64,'+Base64.encode(svgText));
}

function scheduleSVGLinkUpdate() {
        if (updateSVGLinkTimeout !== null) {
                clearTimeout(updateSVGLinkTimeout);
                updateSVGLinkTimeout = 0;
        }
        updateSVGLinkTimeout = setTimeout(updateSVGLink, 500);
}

/** Rendering of JSON changes **/

function onJSONChange(evt) {
        let errorP = document.getElementById('parsing-error');
        let jsonTextarea = document.getElementById('json-textarea');
        let json = jsonTextarea.value;
        try {
                let parsed = JSON.parse(json);
                let diag = SheetDiagram.deserialize(parsed);
                updateTextarea(diag);
                renderDiagram(diag);
                errorP.innerHTML = '';
        } catch(e) {
                errorP.innerHTML = e.message;
        }
}

function updateTextarea(diagram) {
        let text = JSON.stringify(diagram.serialize(), null, 4);
        let replacer = function(match, d1, d2) {
            return ''+d1+' '+d2
        };
        let prettyPrint = function(json) {
            let currentStr = json.replace(/(\[|\d,)\n *(\d)/, replacer).replace(/(\d)\n *(\])/, replacer);
            if (currentStr !== json) {
                return prettyPrint(currentStr);
            } else {
                return currentStr;
            }
        }
        document.getElementById('json-textarea').value = prettyPrint(text);
}


var modelGroup = null;
var seenContext = null;

function renderDiagram(diag) {
        let layout = new SheetLayout(diag);
        let model = layout.getModel(); 
        modelGroup.children = [model];
        modelGroup.dirty = true;
        seenContext.render();
        scheduleSVGLinkUpdate();
}

/** Wiring things up **/

export function setUp(initialDiagram) {

        let diag = SheetDiagram.deserialize(initialDiagram);
        updateTextarea(diag);

        let viewport = seen.Viewports.center(400, 400);
        let scene = new seen.Scene({model: seen.Models.default(), viewport: viewport});
        modelGroup = scene.model.append().scale(1);
        seenContext = seen.Context('seen-canvas', scene);
        let dragger = new seen.Drag(document.getElementById('seen-canvas'), {inertia : false})
        dragger.on('drag.rotate', function(e) {
            let xform = seen.Quaternion.xyToTransform(e.offsetRelative[0], e.offsetRelative[1]);
            modelGroup.transform(xform);
            seenContext.render();
            scheduleSVGLinkUpdate();
        }
        );

        renderDiagram(diag);

        let jsonTextarea = document.getElementById('json-textarea');
        jsonTextarea.onchange = onJSONChange;
        let exportSVGButton = document.getElementById('svg-export');
        // exportSVGButton.onclick = exportSVG;
}


/*
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
*/

