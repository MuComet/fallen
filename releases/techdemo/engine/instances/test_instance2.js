class TestInstance2 extends EngineInstance {
    onEngineCreate() {
        this.depth = 1
        $engine.createRenderable(this,new PIXI.Sprite($engine.getTexture("default")))
        this.hitbox = new Hitbox(this, new RectangeHitbox(this,-32,-32,32,32))
        this.xScale=5;
        this.yScale=5;
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {
        this.angle+=0.01
        /*
        if(Input.isPressed('left')) {
            this.xScale = 1;
        }
        if(Input.isPressed('right')) {
            this.xScale=20;
        }*/
    }

    draw(gui,camera) {
        EngineDebugUtils.drawHitbox(camera,this);
        EngineDebugUtils.drawBoundingBox(camera,this);
    }
}
