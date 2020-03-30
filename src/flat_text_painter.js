
import seen from 'seen';

/**
 * A painter for text that remains in front of the camera all the time.
 */
export default class FlatTextPainter {
        
        constructor() {
                this.baselineOffset = 4;
        }

	/**
         * Paint the surface and then the lines.
         */
        paint(renderModel, context) {
                var ref, ref2;
                let style = {
                   fill: renderModel.fill == null ? 'none' : renderModel.fill.hex(),
                   font: renderModel.surface.font,
                   'text-anchor': (ref = renderModel.surface.anchor) != null ? ref : 'middle',
                };
                let b = renderModel.projected.points[0];
                let c = {x:b.x, y:b.y + this.baselineOffset};
                let xform = seen.Affine.solveForAffineTransform([c,{x:c.x+20,y:c.y},{x:c.x,y:c.y-20}]);
                return context.text().fillText(xform, renderModel.surface.text, style);
        }
}
