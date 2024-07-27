class CardMinigameController extends MinigameController {

    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.CARDS)
        super.onEngineCreate();
        this.maxScore = 3;
        this.score = 0;
        this.roundscore = 0;

        var background = new PIXI.Sprite($engine.getTexture("background_table_cards"));
        $engine.setBackground(background);

        this.attempts = 6;
        this.waiting = false;
        this.waitTimer = 0;
        this.roundspeed = 90;

        this.startTimer(30*60);
        this.getTimer().pauseTimer();

        this.setControls(false,true);
        this.skipPregame();


        var text = new PIXI.Text("Memorize the card positions matching the goal card located\n at the bottom. Select as many of those cards as you can." + 
                "\nThere are 6 correct cards each round.\n\n30 seconds to get 6/6 correct cards for 3 rounds in a row!\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);

        this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;
        this.updateProgressText();


        this.goalCard = new PIXI.Sprite(PIXI.Texture.EMPTY);
        $engine.createManagedRenderable(this, this.goalCard);
        this.startCard = new PIXI.Sprite(PIXI.Texture.EMPTY);
        $engine.createManagedRenderable(this, this.startCard);
        this.goalCard.anchor.set(0.5);
        this.startCard.anchor.set(0.5);

        this.goalCard.x = $engine.getWindowSizeX()/2;
        this.goalCard.y = $engine.getWindowSizeY()+120;

        this.startCard.x = $engine.getWindowSizeX()/2;
        this.startCard.y = $engine.getWindowSizeY()+180;

        this.goalCardTargetX = $engine.getWindowSizeX()/2;
        this.goalCardTargetY = $engine.getWindowSizeY()/2 + 150

        this.cards = [];
        this.cardsRandomOrder = [];
        this.cheatTargetCards = [];

        this.numberCheatCards = 8;
        this.roundStarted = false;

        this.blurFilterMain = new PIXI.filters.BlurFilter(8,4,3,15);
        this.blurFilterMain.blur = 0;
        $engine.getCamera().addFilter(this.blurFilterMain);

        this.newRound();

        this.setCheatTooltip("It was the wind I swear!");
        this.setLossReason("Gambling is bad. You should know better.");

        this.showTime = 120; // how long to show the target card for
        this.showTimer = 0;

        this.cardAnimationTimer = 0;
        this.cardAnimationTime = 180; // 3 seconds for intro

        this.addOnCheatCallback(this,function(self) {
            if(self.roundStarted)
                self.handleMidgameCheat();
        })
    }

    handleMidgameCheat() {
        for(const card of this.cheatTargetCards)
            card.break();

    }

    newRound(){
        var cardIndex = EngineUtils.irandom(2)

        var cardTextureList = ["card_faces_1", "card_faces_2", "card_faces_3", "card_faces_1", "card_faces_2", "card_faces_3","card_faces_1", "card_faces_2", "card_faces_3","card_faces_1", "card_faces_2", "card_faces_3","card_faces_1", "card_faces_2", "card_faces_3","card_faces_1", "card_faces_2", "card_faces_3"];
        this.goalTexture = cardTextureList[cardIndex];
        this.goalCard.texture = $engine.getTexture(this.goalTexture);
        this.startCard.texture = $engine.getTexture("card_faces_big_"+String(cardIndex));

        this.goalCard.x = $engine.getWindowSizeX()/2;
        this.goalCard.y = $engine.getWindowSizeY() + 120;
        EngineUtils.shuffleArray(cardTextureList);

        this.cards = [];
        this.cardsRandomOrder = [];
        this.cheatTargetCards = [];

        for(var i = 0; i < cardTextureList.length; i++){
            var texture = cardTextureList[i];
            if(i < 9){
                this.cards.push(new CardBoard(70+85*i, $engine.getWindowSizeY()/2 -115, texture));
            }else{
                this.cards.push(new CardBoard(70+85*(i-9), $engine.getWindowSizeY()/2, texture));
            }
        }
        for(const card of this.cards) {
            this.cardsRandomOrder.push(card);
        }
        EngineUtils.shuffleArray(this.cardsRandomOrder);


        // target some cheat cards.
        var idx = 0;
        var boozeCardCount = $engine.hasItem(ENGINE_ITEMS.BOOZE) ? 2 : 0; // mini cheat!
        while(this.cheatTargetCards.length<this.numberCheatCards) {
            var card = this.cardsRandomOrder[++idx];
            if(card.cardTexture!==this.goalTexture) {
                this.cheatTargetCards.push(card);
                card.isCheatCard = true;
                if(boozeCardCount-->0) { // goes to 0...
                    card.isBoozeCard = true;
                }
            }
        }


        this.roundscore = 0;

        this.showTimer = 0;
        this.cardAnimationTimer = 0;

        this.roundStarted = false;

        this.blurFilterMain.enabled=true; // enable the card blur filter
    }

    notifyFramesSkipped(frames) {
        if(!this.getTimer().isTimerPaused())
            this.getTimer().tickDown(frames);    // use timer later for total card picking time (7 sec?)
    }

    updateProgressText() {
        this.progressText.text = "Progress: "+String(this.score+" / "+String(this.maxScore));
    }

    animationLogic() {
        if(this.showTimer>this.showTime) {
            this.cardAnimationLogic();
            return;
        }
        if(this.showTimer <= 30) {
            var fac1 = EngineUtils.interpolate(this.showTimer/30,0,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.blurFilterMain.blur = this.blurFilterStrength * fac1;
            this.startCard.y = $engine.getWindowSizeY() + 180 * (1-fac1) - 330 * fac1;
            this.startCard.rotation = 0.85 * (1-fac1)
        }
        if(this.showTimer > this.showTime-30) {
            var time = this.showTimer-(this.showTime-30);
            var fac1 = EngineUtils.interpolate(time/30,1,0,EngineUtils.INTERPOLATE_IN);
            this.blurFilterMain.blur = this.blurFilterStrength * fac1;
            this.startCard.y = $engine.getWindowSizeY() + 180 * (1-fac1) - 330 * fac1;
        }

        this.showTimer++;
    }

    cardAnimationLogic() {
        var delay = 1;
        var initialDelay = 24
        if(this.cardAnimationTimer>=initialDelay && this.cardAnimationTimer < initialDelay + delay * 18) {
            if(this.cardAnimationTimer%delay===0) {
                this.cardsRandomOrder[Math.floor((this.cardAnimationTimer-initialDelay)/delay)].deal();
            }
        }

        if(this.cardAnimationTimer<48) {
            var fac1 = EngineUtils.interpolate((this.cardAnimationTimer-18)/30,$engine.getWindowSizeY()+120,this.goalCardTargetY,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.goalCard.y = fac1
        }

        if(this.cardAnimationTimer===this.cardAnimationTime-100) {
            IM.with(CardBoard,function(card) {
                card.delayedAction(EngineUtils.irandom(card.flipTime/2), function(card) {
                    card.routine(card.cardFlip);
                    card.flipTimer=card.flipTime;
                    card.flipMode=1;
                }, card)
                
            })
        }
        if(this.cardAnimationTimer===this.cardAnimationTime) {
            IM.with(CardBoard,function(card) {
                card.delayedAction(EngineUtils.irandom(card.flipTime/2), function(card) {
                    card.routine(card.cardFlip);
                card.flipTimer=card.flipTime;
                card.flipMode=0;
                card.enabled = true;
                }, card)
                
            })
            this.getTimer().unpauseTimer();
            this.blurFilterMain.enabled=false;
            this.roundStarted = true;
        }
        this.cardAnimationTimer++;
    }

    step() {
        super.step();
        if(this.minigameOver()){
            return;
        }

        this.animationLogic();

        // after round...
        if(this.waitTimer===40) {
            this.showPressAnyKey();
        }
        if(this.waitTimer > 40 && IN.anyButtonPressed()){
            IM.destroy(CardBoard);

            this.hidePressAnyKey();
            this.newRound();
            this.waiting = false;
            this.waitTimer = 0;
        }

        if(this.waiting){
            this.waitTimer++;
        }

        if(this.score >= this.maxScore){
            if(!this.hasCheated() && this.getTimer().getTimeRemaining() >= 1200){
                $engine.activateAchievement("CARD_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            this.endMinigame(true);
        }
    }


    draw(gui, camera) {
        $engine.requestRenderOnCamera(this.goalCard)
        $engine.requestRenderOnGUI(this.startCard)
        $engine.requestRenderOnCamera(this.progressText);
        super.draw(gui, camera);
    }


    notifyCardClick() {
        this.attempts--;
        var inv = 6-this.attempts
        var sound = "card_select_"+String(inv);
        $engine.audioPlaySound(sound);
        if(this.attempts == 0) {
            this.onRoundOver();
        }
    }

    onRoundOver() {
        this.getTimer().pauseTimer();
        this.waiting = true;
        //this.rounds--;
        this.attempts = 6;

        var totalCardsFlipped = 0;
        var targetCardsFlipped = 6;

        IM.with(CardBoard, function(card){
            if(!card.clicked){
                card.enabled = false;
                return;
            }
            card.delayedAction(card.x/50+card.y/100, function(card) {
                card.delayedAction(card.flipTime/2, function(card) {
                    var controller = CardMinigameController.getInstance()

                    totalCardsFlipped++;

                    if(card.cardTexture === controller.goalTexture) {

                        card.getSprite().tint = (0x11fa4f);  // correct choice 0xaaaa43
                        controller.roundscore++;

                    } else {
                        card.getSprite().tint = (0xab1101);  //WRONG  0xab1101
                    }

                    if(totalCardsFlipped===targetCardsFlipped) {
                        controller.notifyAllCardsFlipped();
                    }
                });
                card.routine(card.cardFlip)
                card.flipTimer=card.flipTime;
                card.flipMode=1;
            });
        });
    }

    notifyAllCardsFlipped() {
        if(this.roundscore == 6){
            this.score++;
        } else {
            this.score=0;
        }

        this.updateProgressText();
    }
}



class CardBoard extends EngineInstance {

    onCreate(x,y,texture) {
        this.x = x; // hide the card to start
        this.y = -64;

        this.moveTime = 24;
        this.moveTimer = 0;

        this.originalX = this.x;
        this.originalY = this.y;
        this.originalAngle = this.angle;

        this.targetX = x;
        this.targetY = y;
        this.targetAngle = EngineUtils.randomRange(-0.05,0.05)
        this.cardTexture = texture;
        this.score = 0;
        this.setSprite(new PIXI.Sprite($engine.getTexture("card_faces_0")));
        this.hitbox = new Hitbox(this,new RectangleHitbox(this,-35,-55,35,55));
        this.clicked = false;
        this.totalclicks = 0;
        this.flipTimer = -1;
        this.flipTime = 20;
        this.flipMode = 0;
        this.enabled = false;
        this.isBroken = false;

        this.dy = EngineUtils.randomRange(-8,-4);
        this.dx = EngineUtils.randomRange(-5,5);
        this.dz = EngineUtils.randomRange(-0.1,0.1);
        this.grav = 0.5;
        this.lifeTimer = 0;
        this.lifeTime = EngineUtils.irandomRange(25,45);

        this.isCheatCard = false;
        this.isBoozeCard = false;
    }

    cardFlip(){
        if(this.flipTimer>=0) {
            var value = Math.abs((this.flipTimer-(this.flipTime/2))/(this.flipTime/2));
            if(this.flipTimer <= this.flipTime/2) {
                var fac = EngineUtils.interpolate(value, 0, 1, EngineUtils.INTERPOLATE_OUT_BACK)
                this.xScale = fac;
                this.yScale = 0.75 + fac/4;
                if(this.flipMode===0){
                    this.getSprite().texture = $engine.getTexture("card_faces_0");
                } else {
                    this.getSprite().texture = $engine.getTexture(this.cardTexture);
                }
            }
            if(this.flipTimer===Math.floor(this.flipTime/2)){
                $engine.audioPlaySound("card_flip");
                this.angle = EngineUtils.randomRange(-0.05,0.05);
            }
        } else {
            return true;
        }
        this.flipTimer--;
    }

    deal() {
        this.moving = true;
        var snd = $engine.audioPlaySound("card_flip");
        snd.speed = EngineUtils.randomRange(0.9,1.1);
    }

    break() {
        this.isBroken = true;
        this.enabled = false;
    }

    step() {

        if(this.moving && this.moveTimer<this.moveTime) {
            var fac = EngineUtils.interpolate((++this.moveTimer)/this.moveTime,0,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);

            var dx = this.targetX - this.originalX;
            var dy = this.targetY - this.originalY;
            var dz = this.targetAngle-this.originalAngle;

            this.x = this.originalX + dx*fac;
            this.y = this.originalY + dy*fac;
            this.angle = this.originalAngle + dz*fac;

            if(this.moveTimer===this.moveTime) {
                this.moving = false;
                if((CardMinigameController.getInstance().hasCheated() && this.isCheatCard) || this.isBoozeCard)
                    this.break();
            }
                
        }

        if(!this.moving && this.isBroken) {
            this.lifeTimer++;
            if(this.lifeTime>this.lifeTime)
                this.destroy();
            this.alpha = EngineUtils.interpolate((this.lifeTimer-(this.lifeTime-24))/24,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.x+=this.dx;
            this.y+=this.dy;
            this.angle+=this.dz;
            this.dy += this.grav;
        }

        if(!this.enabled){
            return;
        }

        if(CardMinigameController.getInstance().roundStarted) {
            if(IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){ // change tint when hovered
                //this.getSprite().tint = (0xaaafff);
                if(this.clicked === false) {
                    this.getSprite().tint = (0xffffff);
                }
            }

            if(!this.clicked && IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){
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
