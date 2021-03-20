class RockMinigameController extends EngineInstance { // All classes that can be added to the engine MUST extend EngineInstance

    onEngineCreate() { // called when the instance is made from a room.
        /*
        this.depth = 0;
        this.x=0;
        this.y=0;
        this.xScale = 1;
        this.yScale = 1;
        this.alpha = 1;
        this.angle = 0;*/
        new RockDodgingPlayer($engine.getWindowSizeX()/2,$engine.getWindowSizeY());
        this.timer = 0;
        this.delay = 60;
    }

    onCreate() { // called when you construct the instance yourself
        this.onEngineCreate();
    }

    step() {
        this.timer++;
        if(this.timer>this.delay) {
            this.timer=0;
            new FallingRock(EngineUtils.random($engine.getWindowSizeX()),0,8);
            this.delay--;
        }
        //$engine.getCamera().translate(0,1)
        
    }

    preDraw() { // use this if you need to check something right before draw.
        
    }

    draw(gui, camera) {
        // don't touch the instance here.
    }
}

class RockDodgingPlayer extends EngineInstance {

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        this.score = 10;
        this.setSprite(new PIXI.Sprite($engine.getTexture("falling_rock_rocky_1")))
        this.hitbox = new Hitbox(this,new RectangleHitbox(this, -32,-64,32,0));
    }

    step() {
        //IN.debugDisplayKeyPress(true); // makes the engine log every key press
        if(IN.keyCheck("ArrowLeft") && this.x > 5) {
            this.x-=5;
        }

        if(IN.keyCheck("ArrowRight") && this.x < $engine.getWindowSizeX()-5) {
            this.x+=5;
        }
        var lst = IM.instanceCollisionList(this,this.x,this.y,FallingRock);
        for(const rock of lst) { // don't use 'in', use 'of'
            this.score--;
            rock.destroy();
        }
    }

    draw(gui,camera) {
        //EngineDebugUtils.drawHitbox(camera,this)
    }
}

class FallingRock extends EngineInstance {

    onCreate(x,y,speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.setSprite(new PIXI.Sprite($engine.getTexture("falling_rock_1")))
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-32,-32,32,32));
    }

    step() {
        this.y+=this.speed;
        if(this.y>$engine.getWindowSizeY()+100) {
            this.destroy();
        }
    }
}

/*

block instances
    RockMinigameController x y depth rotation xScale yScale
endblock


*/