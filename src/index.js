import SheetDiagram from './sheet_diagram.js';
import SheetLayout from './sheet_layout.js';
import DiagramLibrary from './library.js';
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

var currentDiagram = null;
var library = new DiagramLibrary();

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
        currentDiagram = diag;
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

        updateTextarea(diag);

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

        let jsonTextarea = document.getElementById('json-textarea');
        jsonTextarea.onchange = onJSONChange;
        let shareURLButton = document.getElementById('share-url');
        shareURLButton.onclick = showShareURL;
        document.getElementById('save-diagram').onclick = function() {
                let name = document.getElementById('diag-name-input').value;
                if (name.length > 0) {
                        library.addDiagram(name, currentDiagram);
                        updateLibrary();
                }
        };

        // restore library from local storage
        let restored = window.localStorage.getItem('diagram-library');
        if (restored !== null) {
                library.importFromJSON(JSON.parse(restored));
                updateLibrary();
        }
}


/** Share URL button **/

function showShareURL(e) {
        let diagramJSON = Base64.encode(JSON.stringify(currentDiagram.serialize()));
        window.location.hash = '#'+diagramJSON;
        e.preventDefault();
}

/** Diagram library **/

function updateLibrary() {
        let libElement = document.getElementById('saved-diagrams');
        libElement.textContent = '';
        library.names().forEach(n => renderDiagButton(n, libElement));
        window.localStorage.setItem('diagram-library', JSON.stringify(library.exportToJSON()));
}

function renderDiagButton(name, libElement) {
        let elem = document.createElement('a');
        elem.classList.add('list-group-item');
        elem.appendChild(document.createTextNode(name));
        let button = document.createElement('button');
        button.classList.add('btn');
        button.classList.add('btn-default');
        button.classList.add('btn-xs');
        button.style = 'float: right';
        let trash = document.createElement('span');
        trash.classList.add('glyphicon');
        trash.classList.add('glyphicon-trash');
        button.appendChild(trash);
        elem.appendChild(button);
        trash.onclick = function(e) { deleteDiag(name); e.preventDefault(); };
        elem.onclick = function(e) { loadDiagramFromLibrary(name); };
        libElement.appendChild(elem);
}

function deleteDiag(name) {
        library.remove(name);
        updateLibrary();
}

function loadDiagramFromLibrary(name) {
        let diag = library.getDiagram(name);
        updateTextarea(diag);
        renderDiagram(diag);
        document.getElementById('diag-name-input').value = name;
}
