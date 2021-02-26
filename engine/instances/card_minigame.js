class CardMinigameController extends MinigameController { 

    onEngineCreate() { 
        super.onEngineCreate();
        $engine.setBackgroundColour(0xa58443);

        var card_texture = ["card_1", "card_2", "card_3","card_1", "card_2", "card_3","card_1", "card_2", "card_3"];  // expand to 9 in final, or wtv needed
        EngineUtils.shuffleArray(card_texture);
        for(var i = 0; i < card_texture.length; i++){
            var index = card_texture[i];
            new CardBoard(50+85*i, $engine.getWindowSizeY()/2, index);
        }

        this.timer = 0;
        this.attempts = 3;
        this.goal_index = card_texture[EngineUtils.irandom(2)];      
        this.goal_card = new PIXI.Sprite($engine.getTexture(this.goal_index));

        this.goal_card.x = $engine.getWindowSizeX()/2;
        this.goal_card.y = $engine.getWindowSizeY()/2 + 100;
        $engine.createManagedRenderable(this, this.goal_card); 
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
        $engine.requestRenderOnGUI(this.goal_card)
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
            if(IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){
                CardMinigameController.getInstance().attempts--;
                    this.clicked = true;
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
