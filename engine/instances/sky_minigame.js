var score = 0;    // PLEASE FIX THIS AND EVERYTHING RELATED TO IT
var nextBlock = 0;   // PLEASE FIX THIS AND EVERYTHING RELATED TO IT

class SkyMinigameController extends EngineInstance { // All classes that can be added to the engine MUST extend EngineInstance

    onEngineCreate() { // called when the instance is made from a room.
 
        new SkyBuildPlayer($engine.getWindowSizeX()/2,64,0);
        new FallingTowerPlatform($engine.getWindowSizeX()/2,$engine.getWindowSizeY());
        this.timer = 0;
        $engine.setBackgroundColour(12067);

    }  
    onCreate() { // called when you construct the instance yourself
        this.onEngineCreate();
    }

    step() {

    }
}


class SkyBuildPlayer extends EngineInstance {

    onCreate(x,y,speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.activated = true;
        this.nextnext = IM.find(SkyBuildPlayer, nextBlock);
        this.setSprite(new PIXI.Sprite($engine.getTexture("falling_tower_1")))
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-50,-50,50,50));
    }

    step() {
        this.y+=this.speed;
        
        if(this.y>$engine.getWindowSizeY()+100) {
            this.destroy();
        }
        IN.debugDisplayKeyPress(true); // makes the engine log every key press
        if(IN.keyCheck("ArrowLeft") && this.x > 5  && this.activated == true) {
            this.x-=5;
        }

        if(IN.keyCheck("ArrowRight") && this.x < $engine.getWindowSizeX()-5 && this.activated == true) {
            this.x+=5;
        }

        if(IN.keyCheck("Space") && this.activated == true) {
            this.speed+=5;
        }

        if(score >= 1 && this.activated){
            var towers = IM.instanceCollisionList(this,this.x,this.y,this.nextnext);
            for(const tower of towers) { // don't use 'in', use 'of'
                if(tower.activated == false){
                    score+= 1;
                    this.speed = 0;
                    this.activated = false;
                    nextBlock +=1;
                    new SkyBuildPlayer($engine.getWindowSizeX()/2,64,0);
                }
            }
        }
    }
}



class FallingTowerPlatform extends SkyBuildPlayer {

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        
        this.setSprite(new PIXI.Sprite($engine.getTexture("sky_platform")));
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-150,-25,150,25));
    }

    step() {
        if(score < 1){
            var towers = IM.instanceCollisionList(this,this.x,this.y,SkyBuildPlayer);
            for(const tower of towers) { // don't use 'in', use 'of'
                if(tower.activated == true){
                    score+= 1;
                    tower.speed = 0;
                    tower.activated = false;
                new SkyBuildPlayer($engine.getWindowSizeX()/2,64,0);
                }
            }
        }
  
    }
}