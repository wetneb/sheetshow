import SheetDiagram from './sheet_diagram.js';
import SheetLayout from './sheet_layout.js';
import DiagramLibrary from './library.js';
import { Base64 } from 'js-base64';
import seen from 'seen';
import Vue from 'vue';
import { prettyPrintJSON } from './util.js';

// global state
var currentDiagram = null;
var library = new DiagramLibrary();

/** Diagram library **/

let vueLibrary = new Vue({
	el: '#app',
	data: {
		jsonText: '',
		currentDiagram: null,
		currentName: '',
		library
	},
	methods: {
		deleteDiag: function(e, name) {
			this.library.remove(name);
		},
		saveDiag: function(e) {
			if (this.currentName.length > 0) {
				this.library.addDiagram(this.currentName, this.currentDiagram);
			}
		},
		loadDiag: function(e, name) {
			this.currentDiagram = this.library.getDiagram(name);
			this.jsonText = prettyPrintJSON(this.currentDiagram.serialize()); 
			this.currentName = name;
		}
	},
	computed: {
		parsedDiagram: function() {
			try {
				let parsed = JSON.parse(this.jsonText);
				return {diagram: SheetDiagram.deserialize(parsed)};
			} catch(e) {
				return {error: e.message};
			}

		}
	},
	watch: {
		library: { deep: true, handler() {
			window.localStorage.setItem('diagram-library', JSON.stringify(this.library.exportToJSON()));
		}},
		jsonText: function() {
			let diag = this.parsedDiagram;
			if (diag.diagram !== undefined) {
				renderDiagram(diag.diagram);
				this.currentDiagram = diag.diagram;
			}
		}
	}
});

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

/** Diagram rendering **/

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
        // check if we have a diagram in the hash, in which case it replaces the inital one
        if (window.location.hash != null && window.location.hash.length > 0) {
            try {
                let jsonString = Base64.decode(window.location.hash);
                diag = SheetDiagram.deserialize(JSON.parse(jsonString));
            } catch(e) {
                ;
            }
        }

	vueLibrary.jsonText = prettyPrintJSON(diag.serialize());

        let viewport = seen.Viewports.center(400, 400);
        let scene = new seen.Scene({model: seen.Models.default(), viewport: viewport, fractionalPoints: true});
        modelGroup = scene.model.append().scale(1);
        seenContext = seen.Context('seen-canvas', scene);
        let canvasElem = document.getElementById('seen-canvas');
        canvasElem.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        let dragger = new seen.Drag(canvasElem, {inertia : false})
        dragger.on('drag.rotate', function(e) {
            let xform = seen.Quaternion.xyToTransform(e.offsetRelative[0], e.offsetRelative[1]);
            modelGroup.transform(xform);
            seenContext.render();
            scheduleSVGLinkUpdate();
        }
        );

        renderDiagram(diag);

        let shareURLButton = document.getElementById('share-url');
        shareURLButton.onclick = showShareURL;

        // restore library from local storage
        let restored = window.localStorage.getItem('diagram-library');
        if (restored !== null) {
                library.importFromJSON(JSON.parse(restored));
        }
}


/** Share URL button **/

function showShareURL(e) {
        let diagramJSON = Base64.encode(JSON.stringify(vueLibrary.currentDiagram.serialize()));
        window.location.hash = '#'+diagramJSON;
        e.preventDefault();
}


