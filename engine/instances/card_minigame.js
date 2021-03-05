class CardMinigameController extends MinigameController { 

    onEngineCreate() { 
        super.onEngineCreate();
        $engine.setBackgroundColour(0xa58443);

        var card_texture = ["card_1", "card_2", "card_3", "card_1", "card_2", "card_3","card_1", "card_2", "card_3", "card_1", "card_2", "card_3", "card_1", "card_2", "card_3", "card_1", "card_2", "card_3"];  // expand to 9 in final, or wtv needed
        EngineUtils.shuffleArray(card_texture);
        for(var i = 0; i < card_texture.length; i++){
            var index = card_texture[i];
            if(i < 9){
                new CardBoard(70+85*i, $engine.getWindowSizeY()/2 -75, index);
            }else{
                new CardBoard(70+85*(i-9), $engine.getWindowSizeY()/2, index);
            }
        }

        this.timer = 0;
        this.attempts = 6;
        this.goal_index = card_texture[EngineUtils.irandom(2)];      
        this.goal_card = new PIXI.Sprite($engine.getTexture(this.goal_index));

        this.goal_card.x = $engine.getWindowSizeX()/2;
        this.goal_card.y = $engine.getWindowSizeY()/2 + 100;
        $engine.createManagedRenderable(this, this.goal_card);

        //this.startTimer(5*60);
        var text = new PIXI.Text("Select all cards matching\nthe bottom goal card!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text)





    }                                 

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames)
    }

    onCreate() { 
        super.onCreate();
        this.onEngineCreate();
    }


    step() {
        super.step();
        this.timer++;
        if(this.timer == 80){
            IM.with(CardBoard, function(instance){
                instance.getSprite().texture = $engine.getTexture("yugioh");    
            })
        }
           
    }
    
    draw(gui, camera) {
        super.draw(gui, camera);
        $engine.requestRenderOnCamera(this.goal_card)
    }

}



class CardBoard extends EngineInstance {

    onCreate(x,y,index) {

        this.x = x;
        this.y = y;
        this.group = index;
        this.setSprite(new PIXI.Sprite($engine.getTexture(index)));
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-25,-25,25,25));
        this.clicked = false;
        this.totalclicks = 0;
    }

    step() {
        if(CardMinigameController.getInstance().timer > 80){
            if(IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){
                this.getSprite().tint = (0xaaaa43);
                if(this.clicked == false){
                    this.getSprite().tint = (0xffffff);
                }
            }

            if(IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){
                CardMinigameController.getInstance().attempts--;
                $engine.audioPlaySound("audio/se/Miss.ogg")
                this.clicked = true;
                this.getSprite().tint = (0xaaaa43);
            }
            if(CardMinigameController.getInstance().attempts == 0 && this.clicked){
                if(this.group == CardMinigameController.getInstance().goal_index){
                    this.getSprite().tint = (0x11fa4f);  // correct choice 0xaaaa43
                }else{
                    this.getSprite().tint = (0xab1101);  //WRONG  0xab1101
                }
                this.getSprite().texture = $engine.getTexture(this.group);
            }
        }

    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(camera, this);
    }
}
