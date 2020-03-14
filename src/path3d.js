

export default class Path3d {
    constructor(projection) {
        this.projection = projection;
        this.instructions = [];
    }
    
    toString() {
        return this.instructions.join(' ');
    }

    pushPoint(point) {
        let projected = this.projection.transform(point);
        this.instructions.push(projected.x);
        this.instructions.push(projected.y);
    }

    command(letter) {
        this.instructions.push(letter);
    }

    M(x, y, z) {
        this.command('M');
        this.pushPoint({x,y,z});
        return this;
    }

    L(x, y, z) {
        this.command('L');
        this.pushPoint({x,y,z});
        return this;
    }

    C(cx1, cy1, cz1, cx2, cy2, cz2, x, y, z) {
        this.command('C');
        this.pushPoint({x:cx1,y:cy1,z:cz1});
        this.pushPoint({x:cx2,y:cy2,z:cz2});
        this.pushPoint({x,y,z});
        return this;
    }
}
