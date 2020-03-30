
import seen from 'seen';

/**
 * A painter for text that remains in front of the camera all the time.
 */
export default class FlatTextPainter {

	/**
         * Paint the surface and then the lines.
         */
        paint(renderModel, context) {
                var ref;
                let style = {
                   fill: renderModel.fill == null ? 'none' : renderModel.fill.hex(),
                   font: renderModel.surface.font,
                   'text-anchor': (ref = renderModel.surface.anchor) != null ? ref : 'middle'
                };
                let b = renderModel.projected.points[0];
                let xform = seen.Affine.solveForAffineTransform([b,{x:b.x+20,y:b.y},{x:b.x,y:b.y-20}]);
                return context.text().fillText(xform, renderModel.surface.text, style);
        }
}
