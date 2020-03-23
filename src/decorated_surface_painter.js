
/**
 * A painter for a surface with lines drawn on it.
 * The lines should be pre-clipped to the surface.
 */
export default class DecoratedSurfacePainter {
	/**
         * From the list of projected points, select those at the given indices and
         * return them as a new array.
	 */
        selectPoints(points, indices) {
            return points.slice(indices[0], indices[1]);
        }

	/**
         * Paint the surface and then the lines.
         */
        paint(renderModel, context) {
	    // Paint the surface
	    let surfacePoints = this.selectPoints(renderModel.projected.points, renderModel.surface.surfaceIndices);

	    let painter = context.path().path(surfacePoints);
	    if (renderModel.fill != null) {
		let fill = renderModel.fill;
		painter.fill({
		    fill: fill == null ? 'none' : fill.hex(),
		    'fill-opacity': (fill != null ? fill.a : void 0) == null ? 1.0 : fill.a / 255.0
		});
	    }
            if (renderModel.stroke != null) {
		let strokeWidth = renderModel.surface['stroke-width'];
		painter.draw({
		    fill: 'none',
		    stroke: renderModel.stroke.hex(),
		    'stroke-width': strokeWidth != null ? strokeWidth : 1
		});
            }

            // Paint the lines on the surface
            let lines = renderModel.surface.lines;
	    for(let i = 0; i < lines.length; i++) {
		let line = lines[i];
		let linePoints = this.selectPoints(renderModel.projected.points, line.indices);
		let linePainter = context.path().path(linePoints);
		if (line.stroke != null) {
		   painter.draw({
			fill: 'none',
			stroke: line.stroke.hex(),
			'stroke-width': line.strokeWidth != null ? line.strokeWidth : 1
		   });
		}
	    }	
        }
}
