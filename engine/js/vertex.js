class EngineLightweightPoint { // f a s t
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}

class Vertex extends PIXI.Point {

    constructor(x,y) {
        super(x,y);
    }

    rotate(theta) {
        var c = Math.cos(theta);
        var s = Math.sin(theta);
        var srcx = this.x;
        this.x = srcx*c-this.y*s;
        this.y = srcx*s+this.y*c;
    }

    scale(sx,sy) {
        this.x*=sx;
        this.y*=sy;
    }

    translate(dx,dy) {
        this.x+=dx;
        this.y+=dy;
    }

    static transform(x,y,rot,sx,sy,dx,dy) {

        y*=sy;
        x*=sx;

        var c = Math.cos(rot);
        var s = Math.sin(rot);
        var srcx = x;
        x = srcx*c-y*s;
        y = srcx*s+y*c;

        y+=dy;
        x+=dx;
        
        return new EngineLightweightPoint(x,y);
    }
}
