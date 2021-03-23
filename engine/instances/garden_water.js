class WaterMinigameController extends MinigameController {
    onEngineCreate() { 
        super.onEngineCreate();
        this.score = 12;
        this.maxScore = 12;
        this.penalty = 0;

        new ParallaxingBackground("background_garden1");
    
        this.timer = 0;
        this.attempts = 6;
        this.waiting = false;
        this.waitTimer = 0;
        
        this.startTimer(30*60);
        this.getTimer().setSurvivalMode();
        this.x = 149;
        this.y = $engine.getWindowSizeY() -180;

        var ddr_tiles = ["arrow_down", "arrow_left", "arrow_up", "arrow_right"];
        this.ddr_tiles = ddr_tiles;

        this.sprite0 = new PIXI.Sprite($engine.getTexture("arrow_down"));
        $engine.createRenderable(this, this.sprite0, true);
        this.sprite1 = new PIXI.Sprite($engine.getTexture("arrow_left"));
        $engine.createRenderable(this, this.sprite1, true);
        this.sprite1.dx = 120;


        this.sprite2 = new PIXI.Sprite($engine.getTexture("arrow_up"));
        $engine.createRenderable(this, this.sprite2, true);
        this.sprite2.dx = 240;
        this.sprite3 = new PIXI.Sprite($engine.getTexture("arrow_right"));
        $engine.createRenderable(this, this.sprite3, true);
        this.sprite3.dx = 360;

        var plant_array = [];
        this.plant_array = plant_array;

        var plant_sprites = ["plant_0", "plant_1", "plant_2", "plant_3"];
        this.plant_sprites = plant_sprites;

        for(var i = 0; i < 12; i++) {
            if(i < 3){
                plant_array[i] = new WaterPlant(90*2+200*i, $engine.getWindowSizeY()/2 -110, i);        
            }if(i >= 3 && i < 6){
                plant_array[i] = new WaterPlant(90*2+200*(i-3), $engine.getWindowSizeY()/2+25, i);        
            }if(i >= 6 && i < 9){
                plant_array[i] = new WaterPlant(90*3+200*(i-6), $engine.getWindowSizeY()/2 +90, i);
            }if(i >= 9 && i < 12){
                plant_array[i] = new WaterPlant(90*3+200*(i-9), $engine.getWindowSizeY()/2 -70, i);
            }
        }

        this.addOnCheatCallback(this, function(selector){

        });


        //this.hitbox = new Hitbox(this,new RectangleHitbox(this,-25,-37,25,37));

        var text = new PIXI.Text("NOT DONE INSTRUCTIONS!\nBasically\n WATER\n\n\nPress ENTER to cheat",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.setControls(true,false);

        this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;


        this.updateProgressText();
    }
    

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);  
    }

    onCreate() { 
        super.onCreate();
        this.onEngineCreate();
    }

    step() {
        this.timer++;
        super.step();
        if(this.minigameOver()){
            return;
        }
        if(this.timer === 30){
            new ddrTiles(149, 100, 0);
            this.timer = 0;
        }

        if(this.score <= 0){
            this.getTimer().pauseTimer();
            this.endMinigame(false);
        }
        this.tileHit();

        if(this.penalty > 0){
            this.penalty--;
        }

        this.updateProgressText();

    }

    tileHit() {
        var current_tile = IM.find(ddrTiles, 0);
        if(current_tile === undefined || this.penalty != 0){
            return;
        }


        if($engine.getWindowSizeY() -220 <= current_tile.y && current_tile.y <= $engine.getWindowSizeY()){

            if(IN.keyCheckPressed("ArrowRight") && current_tile.arrow === 3){
                current_tile.getSprite().tint = (0xaaafff);
                current_tile.destroy();    
            }
            if(IN.keyCheckPressed("ArrowLeft") && current_tile.arrow === 1){
                current_tile.getSprite().tint = (0xaaafff);
                current_tile.destroy();
            }
            if(IN.keyCheckPressed("ArrowDown") && current_tile.arrow === 0){
                current_tile.getSprite().tint = (0xaaafff);
                current_tile.destroy();
            }
            if(IN.keyCheckPressed("ArrowUp") && current_tile.arrow === 2){
                current_tile.getSprite().tint = (0xaaafff);
                current_tile.destroy();
            }
        }
        if((IN.keyCheckPressed("ArrowRight") && current_tile.arrow != 3) || (IN.keyCheckPressed("ArrowLeft") && current_tile.arrow != 1)
        || (IN.keyCheckPressed("ArrowDown") && current_tile.arrow != 0) || (IN.keyCheckPressed("ArrowUp") && current_tile.arrow != 2)){
            this.penalty = 40;
            current_tile.getSprite().tint = (0xab1101);
        }  
    }



    updateProgressText() {
        this.progressText.text = "Progress:  Plants Alive  "+String(this.score+" / "+String(this.maxScore));
    }
  

    draw(gui, camera) {
        super.draw(gui, camera);     
        //EngineDebugUtils.drawHitbox(camera,this);
        $engine.requestRenderOnCameraGUI(this.progressText);
    }

}


class ddrTiles extends EngineInstance {
    onCreate(x,y) {
        this.depth = -10;
        this.arrow = EngineUtils.irandomRange(0,3);
        this.x = x + this.arrow*120;
        this.y = y;
        this.speed = 6;
        this.setSprite(new PIXI.Sprite($engine.getTexture(WaterMinigameController.getInstance().ddr_tiles[this.arrow])));
        this.clicked = false;
    }

    step(){
        this.y += this.speed;
        if(this.y - 24 >= $engine.getWindowSizeY() - 140){
            WaterMinigameController.getInstance().score--;
            //var plant = IM.randomInstance(WaterPlant);
            var index = EngineUtils.irandomRange(0, WaterMinigameController.getInstance().plant_array.length-1);
            var plant = WaterMinigameController.getInstance().plant_array[index];
            console.log(plant);
            plant.getSprite().texture = $engine.getTexture("plant_0");
            WaterMinigameController.getInstance().plant_array.splice(index, 1);

            this.destroy();
        }
    }
}

class WaterPlant extends EngineInstance {
    onCreate(x,y,index) {
        this.x = x;
        this.y = y;
        this.index = index;
        this.score = 1;
        this.setSprite(new PIXI.Sprite($engine.getTexture(WaterMinigameController.getInstance().plant_sprites[EngineUtils.irandomRange(1,3)])));
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-25,-37,25,37));
        this.clicked = false;
    }
}

class WaterRaindrop extends EngineInstance {

    onEngineCreate() {
        this.dx = EngineUtils.randomRange(0.2,0.8);
        this.maxDy = EngineUtils.randomRange(20,24)
        this.dy = this.maxDy;
        this.grav = 0.25;
        this.angle = V2D.calcDir(this.dx,this.dy)
        var dist = V2D.calcMag(this.dx,this.dy);
        this.xScale = EngineUtils.clamp(dist/6,0,2)
        this.hitbox = new Hitbox(this, new RectangleHitbox(this,0,-1,16,1))
        this.setSprite(new PIXI.Sprite($engine.getTexture("raindrop")))
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {
        this.x+=this.dx;
        this.y+=this.dy;
        if(this.dy < this.maxDy)
            this.dy+=this.grav;
        this.angle = V2D.calcDir(this.dx,this.dy)
        var dist = V2D.calcMag(this.dx,this.dy);
        this.xScale = EngineUtils.clamp(dist/12,0.25,2)
        if(this.y>=$engine.getWindowSizeY() || this.x<-128 || this.x > 944) {
            this.destroy();
        }
        var inst = IM.instancePlace(this,this.x,this.y,Umbrella)
        if(inst) {
            var spd = V2D.calcMag(this.dx,this.dy);
            var angle = V2D.calcDir(this.x-inst.x,inst.y-this.y);
            spd/=8
            var diff = this.x-inst.x;
            var dxAdd = inst.dx
            if(Math.sign(diff) !== Math.sign(inst.dx) || Math.abs(diff)<60)
                dxAdd=0;
            if(inst.dx === 0) {
                dxAdd = EngineUtils.clamp(diff/32,-2.5,2.5)
            }
            if(spd<0.5)
                spd=0;
            this.dx = V2D.lengthDirX(angle,spd) +dxAdd;
            this.dy = V2D.lengthDirY(angle,spd);
        }
        if(IM.instanceCollision(this,this.x,this.y,Test)) {
            this.destroy();
        }
        //if(IM.instanceCollision(this,this.x,this.y,UmbrellaPlayer)) {
            //UmbrellaMinigameController.getInstance().decrementScore();
            //IM.find(UmbrellaPlayer,0).hasBeenHurt = true;
            //this.destroy();
        //}

    }

    draw(gui,camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}
