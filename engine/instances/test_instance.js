class TestInstance extends EngineInstance {
    onEngineCreate() {
        this.dy = 0;
        this.dx = 0;
        this.grav = 0;
        this.shouldDie = false;
        this.dz = 0.01//EngineUtils.randomRange(-Math.PI/16,Math.PI/16)
        this.setSprite(new PIXI.Sprite($engine.getTexture("default")));
        this.hitbox = new Hitbox(this, new RectangeHitbox(this,-32,-32,32,32))
        this.enableDrawGraphics();
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {

        if(Input.isPressed('escape')) {
            this.dx = EngineUtils.randomRange(-2,2);
            this.dy = EngineUtils.randomRange(-12,0);
            this.shouldDie=true;
        }

        if(IM.instanceCollision(this,this.x,this.y,TestInstance2)) { // touching
            if(this.dy===0) {
                while(IM.instanceCollision(this,this.x,this.y,TestInstance2))
                    this.y-=1;
            }
        }

        while(IM.instanceCollisionLine(0,0,200,200,this)) { // touching
            this.y-=1;
        }

        if(IM.instanceCollision(this,this.x+this.dx,this.y,TestInstance2)) {
            while(!IM.instanceCollision(this,this.x+Math.sign(this.dx),this.y,TestInstance2))
                this.x+=Math.sign(this.dx);
            this.dx = 0;
        }

        if(Input.isPressed('right') && this.dx < 5)
            this.dx+=0.25;
        else if(Input.isPressed('left') && this.dx > -5)
            this.dx-=0.25;
        if(Input.isPressed('up') && this.dy > -5)
            this.dy-=0.25;
        else if(Input.isPressed('down') && this.dy < 5)
            this.dy+=0.25;

        this.angle +=this.dz
        this.dy+=this.grav;
        this.dx/=1.05
        this.dy/=1.05
        if(IM.instanceCollision(this,this.x,this.y+this.dy,TestInstance2)) {
            while(!IM.instanceCollision(this,this.x,this.y+Math.sign(this.dy),TestInstance2))
                this.y+=Math.sign(this.dy);
            this.dy = 0;
            this.dx/=1.1
            if(this.shouldDie) {
                this.destroy();
            }
            //$engine.endGame();
        }
        this.y+=this.dy;
        this.x+=this.dx
        //if(Input.isPressed('down'))
            //this.y+=5;
    }

    draw(graphics) {
        var touching = EngineUtils.collisionLine(new Vertex(0,0),new Vertex(200,200),new Vertex(500,300), new Vertex(this.x,this.y));
        var touching = this.hitbox.containsPoint(200,200)
        graphics.lineStyle(1,0xe74c3c).moveTo(0,0).lineTo(200,200).moveTo(500,300).lineStyle(1,touching ? 0xffffff : 0xe74c3c).lineTo(this.x,this.y)

        graphics.lineStyle(0,0)
        graphics.beginFill(0xffffff);
        graphics.drawRect(IN.getMouseX()-32,IN.getMouseY()-32,64,64)
        graphics.endFill()
    }

    drawExtras(gui,camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}