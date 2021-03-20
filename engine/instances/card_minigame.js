class CardMinigameController extends MinigameController {
    
    onEngineCreate() { 
        super.onEngineCreate();
        this.maxScore = 3;
        this.score = 0;
        this.roundscore = 0;
        this.cheatflip = 0;

        
        new ParallaxingBackground("background_sheet_2");

        this.timer = 0;
        this.attempts = 6;
        //this.rounds = 3;
        this.waiting = false;
        this.waitTimer = 0;
        
        this.startTimer(30*60);
        this.getTimer().pauseTimer();

        var text = new PIXI.Text("Memorize the card positions matching the goal card located\n at the bottom. Select as many of those cards as you can.\nThere are 6 correct cards each round.\n\n30 seconds to get 5/6 correct cards for 3 rounds in a row!\n\nPress ENTER to cheat",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.controlsUseKeyBoard(false);

        this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;
        this.updateProgressText();
        this.newRound();
    }
    
    newRound(){
        this.cheatflip = 0;
        this.timer = 0;
        var card_texture = ["card_faces_1", "card_faces_2", "card_faces_3", "card_faces_1", "card_faces_2", "card_faces_3","card_faces_1", "card_faces_2", "card_faces_3","card_faces_1", "card_faces_2", "card_faces_3","card_faces_1", "card_faces_2", "card_faces_3","card_faces_1", "card_faces_2", "card_faces_3"];
        this.goal_index = card_texture[EngineUtils.irandom(2)];      
        this.goal_card = new PIXI.Sprite($engine.getTexture(this.goal_index));    // change sprite instead??? marcus cares???????????????????????????

        this.goal_card.x = $engine.getWindowSizeX()/2;
        this.goal_card.y = $engine.getWindowSizeY()/2 + 150;
        $engine.createManagedRenderable(this, this.goal_card);
        EngineUtils.shuffleArray(card_texture);
        for(var i = 0; i < card_texture.length; i++){
            var index = card_texture[i];
            if(i < 9){
                new CardBoard(70+85*i, $engine.getWindowSizeY()/2 -115, index);
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

    getRandom(arr, n) {
        var result = new Array(n),
            len = arr.length,
            taken = new Array(len);
        while (n--){
            var x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }

    step() {
        super.step();
        if(this.minigameOver()){
            return;
        }

        if(this.hasCheated() && this.timer >= 140 && this.cheatflip == 0) {
            var allcards = [];
            IM.with(CardBoard, function(card){
                allcards.push(card);
            });

            var flipcards = this.getRandom(allcards, 6);

            for(var k = 0; k < 6; k++){
                var card = flipcards[k];
                card.delayedAction(card.x/50+card.y/100, function(card){ 
                    card.delayedAction(card.flipTime/2, function(card) {   
                             
                        card.routine(card.cardFlip);
                        card.flipTimer=card.flipTime;
                        card.flipMode=1; 
                    
                    }); 
                });
            }
            this.cheatflip = 1;
        }


        if(this.timer===70) {
            IM.with(CardBoard, function(card){
                card.delayedAction(EngineUtils.irandom(10), function(card) {
                    card.routine(card.cardFlip);
                    card.flipMode = 0;
                    card.flipTimer = card.flipTime;
                });
            });
        }

        if(this.timer == 80){
            this.getTimer().unpauseTimer();
        }

        this.timer++;
        //this.cardFlip();
        //if(this.rounds >= 1 && this.waitTimer > 10 && IN.anyButtonPressed()){
        if(this.waitTimer===40) {
            this.showPressAnyKey();
        }
        if(this.waitTimer > 40 && IN.anyButtonPressed()){
            IM.destroy(CardBoard);

            //this.getTimer().unpauseTimer();
            //this.getTimer().restartTimer(7*60)
            this.hidePressAnyKey();
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
            //this.rounds--;
            this.attempts = 6;
            IM.with(CardBoard, function(card){
                if(!card.clicked){
                    card.enabled = false;
                    return;
                }
                card.delayedAction(card.x/50+card.y/100, function(card) {
                    card.delayedAction(card.flipTime/2, function(card) {
                        if(card.group == CardMinigameController.getInstance().goal_index){
                            card.getSprite().tint = (0x11fa4f);  // correct choice 0xaaaa43
                            CardMinigameController.getInstance().roundscore++;
                        }else{
                            card.getSprite().tint = (0xab1101);  //WRONG  0xab1101
                        }
                    });
                    card.routine(card.cardFlip)
                    card.flipTimer=card.flipTime;
                    card.flipMode=1;
                });
                //card.getSprite().texture = $engine.getTexture(card.group);
            });
            if(CardMinigameController.getInstance().roundscore >= 5){
                CardMinigameController.getInstance().score++;
            }else{
                CardMinigameController.getInstance().score = 0;
            }
            CardMinigameController.getInstance().roundscore = 0;   
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
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-35,-55,35,55));
        this.clicked = false;
        this.totalclicks = 0;
        this.flipTimer = -1;
        this.flipTime = 20;
        this.flipMode = 0;
        this.enabled = true;
    }

    cardFlip(){   
        if(this.flipTimer>=0) {
            var value = Math.abs((this.flipTimer-(this.flipTime/2))/(this.flipTime/2));
            if(this.flipTimer <= this.flipTime/2) {
                var fac = EngineUtils.interpolate(value, 0, 1, EngineUtils.INTERPOLATE_OUT_BACK)
                this.xScale = fac;
                this.yScale = 0.75 + fac/4;
                if(this.flipMode===0)
                    this.getSprite().texture = $engine.getTexture("card_faces_0");
                else {
                    this.getSprite().texture = $engine.getTexture(this.group);
                }
            }
            if(this.flipTimer===Math.floor(this.flipTime/2))
                $engine.audioPlaySound("card_flip")
        } else {
            return true;
        }
        this.flipTimer--;
    }
    
    step() {
        if(!this.enabled)
            return;
        //this.cardFlip();
        if(CardMinigameController.getInstance().timer > 80){
            CardMinigameController.getInstance().updateProgressText();
            if(IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){
                //this.getSprite().tint = (0xaaafff);
                if(this.clicked == false){
                    this.getSprite().tint = (0xffffff);
                }
            }

            if(!this.clicked && IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){  
                $engine.audioPlaySound("card_flip");
                //$engine.audioPlaySound("card_flip_all");
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
