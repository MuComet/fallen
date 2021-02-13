class Camera extends PIXI.Container {

    constructor(x,y,w,h,r) { // these are the IN GAME camera variables.
        super();
        this.CANVAS_WIDTH = Graphics.boxWidth;
        this.CANVAS_HEIGHT = Graphics.boxHeight;
        this.setLocation(x,y);
        this.setDimensions(w,h);
        this.setRotation(r);
        this.__background = new PIXI.Graphics();
        this.setBackgroundColour(0);
        this.__cameraGraphics = new PIXI.Graphics(); // shared graphics, always draws on top of everything.
    }

    getBackground() {
        return this.__background;
    }

    setBackground(background) { // expects any PIXI renderable. renders first.
        this.__background = background;
        if(!(this.__background instanceof PIXI.Graphics)) {
            this.__usingSolidColourBackground = false;
        }

    }

    setBackgroundColour(col) {
        if(!(this.__background instanceof PIXI.Graphics)) {
            console.error("WARN: setBackgroundColour applied to non Graphics background... Set the background to a Graphics first!");
            this.__background = new PIXI.Graphics();
        }
        this.__backgroundColour = col;
        this.__usingSolidColourBackground = true;
    }

    getBackgroundColour() {
        return this.__backgroundColour;
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

    __updateBackground() {
        this.__background.x = -this.x;
        this.__background.y = -this.y;
        this.__background.rotation = -this.rotation;
        if(!this.__usingSolidColourBackground)
            return;
        this.__background.clear();
        this.__background.beginFill(this.__backgroundColour);
        this.__background.drawRect(0,0,this.getWidth()+1,this.getHeight()+1)
        this.__background.endFill()
    }

    __reportMouse() {
        return Graphics._renderer.plugins.interaction.mouse.getLocalPosition(this);
    }


    updateTransform() {
        this.__match();
        this.__updateBackground();
        super.updateTransform();
    }
}