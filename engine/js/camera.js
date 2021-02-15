class Camera extends PIXI.Container {

    constructor(x,y,w,h,r) { // these are the IN GAME camera variables.
        super();
        this.CANVAS_WIDTH = Graphics.boxWidth;
        this.CANVAS_HEIGHT = Graphics.boxHeight;
        this.setLocation(x,y);
        this.setDimensions(w,h);
        this.setRotation(r);
        this.__cameraGraphics = new PIXI.Graphics(); // shared graphics, always draws on top of everything.
    }

    /**@deprecated */
    getBackground() {
        console.error("Camera.getBackground -> USE THE ENGINE FUNCTION!")
        return $engine.getBackground();
    }
    /**@deprecated */
    setBackground(background) { // expects any PIXI renderable. renders first.
        console.error("Camera.setBackground -> USE THE ENGINE FUNCTION!")
        $engine.getBackground(background)
    }
    
    /**@deprecated */
    setBackgroundColour(col) {
        console.error("Camera.setBackgroundColour -> USE THE ENGINE FUNCTION!")
        $engine.setBackgroundColour(col)
    }

    /**@deprecated */
    getBackgroundColour() {
        console.error("Camera.getBackgroundColour -> USE THE ENGINE FUNCTION!")
        return $engine.getBackgroundColour();
    }

    getCameraGraphics() {
        return this.__cameraGraphics;
    }

    setLocation(x,y) { // x and y are negative so that they represent where the camera would physically be.
        IN.__validMouse = false;
        this.x = -x;
        this.y = -y;
    }

    translate(dx,dy) {
        this.setLocation(this.getX()+dx, this.getY()+dy);
    }

    setX(x) {
        IN.__validMouse = false;
        this.x = -x;
    }

    setY(y) {
        IN.__validMouse = false;
        this.y = -y;
    }

    getX() {
        return -this.x;
    }

    getY() {
        return -this.y;
    }

    setScaleX(sx) {
        IN.__validMouse = false;
        this.scale.x = sx;
    }

    getScaleX() {
        return this.scale.x;
    }

    setScaleY(sy) {
        IN.__validMouse = false;
        this.scale.y = sy;
    }

    getScaleY() {
        return this.scale.y;
    }

    setScale(sx, sy) {
        IN.__validMouse = false;
        this.scale.x = sx;
        this.scale.y = sy;
    }

    setDimensions(w,h) {
        var sx = w/this.CANVAS_WIDTH;
        var sy = h/this.CANVAS_HEIGHT;
        this.setScale(sx,sy);
    }

    setWidth(w) {
        var sx = w/this.CANVAS_WIDTH;
        this.setScaleX(sx)
    }

    setHeight(h) {
        var sy = h/this.CANVAS_HEIGHT;
        this.setScaleY(sy)
    }

    getWidth() {
        return this.getScaleX() * this.CANVAS_WIDTH;
    }

    getHeight() {
        return this.getScaleY() * this.CANVAS_HEIGHT;
    }

    setRotation(rot) {
        IN.__validMouse = false;
        this.rotation = rot;
    }

    getRotation() {
        return this.rotation;
    }

    __match() {
        var len = this.children.length;
        for(var i =0;i<len;i++) {
            var child = this.children[i];
            if(!child.__align)
                continue;
            var parent = child.__parent;
            child.x = parent.x;
            child.y = parent.y;
            child.x+=child.dx;
            child.y+=child.dy;
            child.rotation = parent.angle;
            child.scale.x = parent.xScale;
            child.scale.y = parent.yScale;
            child.alpha = parent.alpha
        }
    }

    __reportMouse() {
        return Graphics._renderer.plugins.interaction.mouse.getLocalPosition(this);
    }


    updateTransform() {
        this.__match();
        super.updateTransform();
    }
}