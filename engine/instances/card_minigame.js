class CardMinigameController extends MinigameController { 

    onEngineCreate() { 
        super.onEngineCreate();
        $engine.setBackgroundColour(0xa58443);

        var card_texture = ["card_1", "card_2", "card_3"];  // expand to 9 in final, or wtv needed
        
        for(var i = 0; i < card_texture.length*3; i++){
            var index = card_texture[EngineUtils.irandom(card_texture.length - 1)];
            new CardBoard(50+100*i,$engine.getWindowSizeY()/2, index, i);
        }

        this.timer = 0;
        this.attempts = 3;
        this.goal_index = card_texture[EngineUtils.irandom(card_texture.length - 1)];      
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
        if(this.timer == 120){
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

    onCreate(x,y,index, order) {
        this.order = order;
        this.x = x;
        this.y = y;
        this.group = index;
        this.setSprite(new PIXI.Sprite($engine.getTexture(index)));
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-25,-25,25,25));
        this.clicked = false;
        this.totalclicks = 0;
    }

    step() {
        if(IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){
            CardMinigameController.getInstance().attempts--;
            if(this.group == CardMinigameController.getInstance().goal_index){
                this.clicked = true;
                //this.getSprite().tint = (0xaaaa43); 
            }
        }
        if(CardMinigameController.getInstance().attempts == 0 && this.clicked){
            this.getSprite().tint = (0xaaaa43);
            this.getSprite().texture = $engine.getTexture(this.group); 
        }

    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(camera, this);
    }
}
