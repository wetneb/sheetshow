

export default class Projection {
    constructor(skewAngle) {
      this.skew = skewAngle;
      this.coef = Math.tan(skewAngle*Math.PI/180);
    }

    transform(coords) {
        let {x,y,z} = coords;
        return {'x': x + z, 'y': 0.2*x + y + this.coef*z}
    }
}
