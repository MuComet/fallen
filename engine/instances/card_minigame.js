class CardMinigameController extends MinigameController {
    
    onEngineCreate() { 
        super.onEngineCreate();
        this.maxScore = 13;
        this.score = 0;
        
        new ParallaxingBackground();



        this.timer = 0;
        this.attempts = 6;
        this.rounds = 3;
        this.waiting = false;
        this.waitTimer = 0;
        
        this.startTimer(7*60);
        this.getTimer().pauseTimer();

        var text = new PIXI.Text("Memorize the card positions of the goal\ncard located at the bottom\n Select as many cards matching\nthe goal card as you can\n3 rounds to select 13!\n\npress enter to cheat",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.controllsUseKeyBoard(false);

        this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;
        this.updateProgressText();
        this.newRound();

    }
    
    newRound(){
        this.timer = 0;
        var card_texture = ["dust_particles_0", "dust_particles_1", "dust_particles_2", "dust_particles_0", "dust_particles_1", "dust_particles_2","dust_particles_0", "dust_particles_1", "dust_particles_2","dust_particles_0", "dust_particles_1", "dust_particles_2","dust_particles_0", "dust_particles_1", "dust_particles_2","dust_particles_0", "dust_particles_1", "dust_particles_2"];
        this.goal_index = card_texture[EngineUtils.irandom(2)];      
        this.goal_card = new PIXI.Sprite($engine.getTexture(this.goal_index));    // change sprite instead??? marcus cares???????????????????????????

        this.goal_card.x = $engine.getWindowSizeX()/2;
        this.goal_card.y = $engine.getWindowSizeY()/2 + 150;
        $engine.createManagedRenderable(this, this.goal_card);
        EngineUtils.shuffleArray(card_texture);
        for(var i = 0; i < card_texture.length; i++){
            var index = card_texture[i];
            if(i < 9){
                new CardBoard(70+85*i, $engine.getWindowSizeY()/2 -75, index);
            }else{
                new CardBoard(70+85*(i-9), $engine.getWindowSizeY()/2, index);
            }
        }    
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);    // use timer later for total card picking time (7 sec?)
    }

    updateProgressText() {
        this.progressText.text = "Progress: "+String(this.score+" / "+String(this.maxScore));
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
        this.timer++;
        if(this.timer == 80){
            IM.with(CardBoard, function(instance){
                instance.getSprite().texture = $engine.getTexture("yugioh");    
            })
            this.getTimer().unpauseTimer();
        }
        if(this.rounds >= 1 && this.waitTimer > 10 && IN.anyButtonPressed()){
            IM.destroy(CardBoard);

            //this.getTimer().unpauseTimer();
            this.getTimer().restartTimer(7*60)
            this.newRound();
            this.waiting = false;
            this.waitTimer = 0;  
        }

        if(this.waiting){
            this.waitTimer++;
        }
        if(this.score >= this.maxScore){
            this.endMinigame(true);
        }
        if(this.rounds == 0 && this.score < this.maxScore){
            this.endMinigame(false);
        }     
    }
    

    draw(gui, camera) {
        super.draw(gui, camera);
        $engine.requestRenderOnCamera(this.goal_card)
        $engine.requestRenderOnGUI(this.progressText);
    }


    notifyCardClick() {
        this.attempts--;
        if(this.attempts == 0){
            this.getTimer().pauseTimer();
            this.waiting = true;
            this.rounds--;
            this.attempts = 6;
            IM.with(CardBoard, function(card){
                if(!card.clicked){
                    return;
                }
                if(card.group == CardMinigameController.getInstance().goal_index){
                    card.getSprite().tint = (0x11fa4f);  // correct choice 0xaaaa43
                    CardMinigameController.getInstance().score++;
                }else{
                    card.getSprite().tint = (0xab1101);  //WRONG  0xab1101
                }
                card.getSprite().texture = $engine.getTexture(card.group);
            })    
        }
    }
}



class CardBoard extends EngineInstance {

    onCreate(x,y,index) {
        this.x = x;
        this.y = y;
        this.group = index;
        this.score = 0;
        this.setSprite(new PIXI.Sprite($engine.getTexture(index)));
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-35,-35,35,35));
        this.clicked = false;
        this.totalclicks = 0;
    }
    
    step() {
        if(CardMinigameController.getInstance().timer > 80){
            CardMinigameController.getInstance().updateProgressText();
            if(IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){
                //this.getSprite().tint = (0xaaafff);
                if(this.clicked == false){
                    this.getSprite().tint = (0xffffff);
                }
            }

            if(!this.clicked && IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){  
                $engine.audioPlaySound("audio/se/Miss.ogg")
                this.clicked = true;
                this.getSprite().tint = (0xaaafff);
                CardMinigameController.getInstance().notifyCardClick(this);
            }
        }
    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(camera, this);
    }
}
