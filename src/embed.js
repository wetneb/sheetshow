import SheetDiagram from './sheet_diagram.js';
import SheetLayout from './sheet_layout.js';
import { Base64 } from 'js-base64';
import seen from 'seen';
import yaml from 'js-yaml';

let theme = {
        sheetColor:"2233aa",
        sheetOpacity:40,
        sheetSpecular:5,
        wireColor:"000000",
        wireThickness:1,
        nodeSize:2,
        sliceHeight:31,
        sheetDistance:29,
        wireSpacing:20,
        wireMargin:15
};

var defaultTransform = new seen.Matrix([0.840116964296004,-0.008402378812549188,0.5423401942806322,0,-0.013753536720410912,0.9992285210387111,0.03678590722640127,0,0.5422308793583629,0.038363560484912226,-0.8393532693074919,0,0,0,0,1]);

window.onload = function() {
        // Render all diagrams
        let diagrams = document.querySelectorAll("script[type='text/sheetshow']");
        for (var i = 0; i != diagrams.length; i++) {
                let domElement = diagrams[i];
                
                // attempt to parse the script
                try {
			let parsed = yaml.safeLoad(domElement.innerText);
			let diagram = SheetDiagram.deserialize(parsed);

                        let width = 400;
                        let height = 400;
                        if (domElement.attributes["data-width"] !== undefined) {
                                width = parseInt(domElement.attributes["data-width"].value);
                        }
                        if (domElement.attributes["data-height"] !== undefined) {
                                height = parseInt(domElement.attributes["data-height"].value);
                        }


                        // create a SVG area for the diagram
                        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        svg.setAttribute('width', width);
                        svg.setAttribute('height', height);
                        domElement.parentNode.insertBefore(svg, domElement.nextSibling);

                        // render the diagram
                        let viewport = seen.Viewports.center(width, height);
                        let scene = new seen.Scene({model: seen.Models.default(), viewport: viewport, fractionalPoints: true});
                        let modelGroup = scene.model.append();
                        modelGroup.transform(defaultTransform);
                        let seenContext = seen.Context(svg, scene);
                        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                        let dragger = new seen.Drag(svg, {inertia : false})
                        dragger.on('drag.rotate', function(e) {
                            let xform = seen.Quaternion.xyToTransform(e.offsetRelative[0], e.offsetRelative[1]);
                            modelGroup.transform(xform);
                            seenContext.render();
                        }
                        );

                        let layout = new SheetLayout(diagram, theme);
                        let model = layout.getModel(); 
                        modelGroup.children = [model];
                        modelGroup.dirty = true;
                        seenContext.render();
		} catch(e) {
                        let error = 'SheetShow error: '+e.message;
                        let span = document.createElement('span');
                        span.setAttribute('style', 'color: red');
                        span.textContent = error; 
                        domElement.parentNode.insertBefore(span, domElement.nextSibling);
		}
        }
};



