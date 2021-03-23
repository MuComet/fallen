class WaterMinigameController extends MinigameController {
    onEngineCreate() { 
        super.onEngineCreate();
        this.score = 0;
        this.maxScore = 15;
      

        new ParallaxingBackground("background_garden1");
    
        this.timer = 0;
        this.attempts = 6;
        this.waiting = false;
        this.waitTimer = 0;
        
        this.startTimer(300*60);
        this.getTimer().setSurvivalMode();
        this.x = $engine.getWindowSizeY()/2;
        this.y = $engine.getWindowSizeY()/2 -150;

        var ddr_tiles = [];
        this.ddr_tiles = ddr_tiles;

        this.sprite = new PIXI.Sprite($engine.getTexture("water"));
        $engine.createRenderable(this, this.sprite, true);


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
        super.step();
        if(this.minigameOver()){
            return;
        }
        if(this.timer === 60){
            new ddrTiles(300, 100, 0);
            this.timer = 0;
        }
        this.moveWater();
        this.updateProgressText();
        this.timer++;
    }

    moveWater(){

        if(IN.keyCheckPressed("ArrowRight") && this.x <= 90*2+200){
            this.x += 200;
        }
        else if(IN.keyCheckPressed("ArrowLeft") && this.x > 90*2){
            this.x -= 200;
        }else if(IN.keyCheckPressed("ArrowDown") && this.y < $engine.getWindowSizeY()/2 +150){
            if(this.x === 90*2-100 || this.x === 90*2+100 || this.x === 90*2+300){
                this.x += 90;
            }else{
                this.x -= 90;
            }
            this.y += 150;
        }
        else if(IN.keyCheckPressed("ArrowUp") && this.y > $engine.getWindowSizeY()/2 -150){

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
    onCreate(x,y,index) {
        this.depth = 10;
        this.index = index;
        this.x = x-100;
        this.y = y;
        this.speed = 4;
        this.setSprite(new PIXI.Sprite($engine.getTexture(GardenMinigameController.getInstance().ddr_tiles[EngineUtils.irandomRange(1,3)])));

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
