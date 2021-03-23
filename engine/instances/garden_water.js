class WaterMinigameController extends MinigameController {
    onEngineCreate() { 
        super.onEngineCreate();
        this.score = 12;
        this.maxScore = 12;
      

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
        if(this.timer === 20){
            new ddrTiles(149, 100, 0);

            //new ddrTiles(149, 100, 0);


            this.timer = 0;
        }
        if(this.score <= 0){
            this.getTimer().pauseTimer();
            this.endMinigame(false);
        }

        this.tileHit();
        this.updateProgressText();

    }

    tileHit() {
        var current_tile = IM.find(ddrTiles, 0);
        if(current_tile === undefined){
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
    }



    updateProgressText() {
        this.progressText.text = "Progress:  Tiles Missed  "+String(this.score+" / "+String(this.maxScore));
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
        this.setSprite(new PIXI.Sprite($engine.getTexture(GardenMinigameController.getInstance().ddr_tiles[this.arrow])));

        //this.hitbox = new Hitbox(this,new RectangleHitbox(this,-24,-24,24,24));
        this.clicked = false;
    }

    step(){
        this.y += this.speed;
        if(this.y - 24 >= $engine.getWindowSizeY() - 100){
            WaterMinigameController.getInstance().score--;
            this.destroy();
        }
    }
}
