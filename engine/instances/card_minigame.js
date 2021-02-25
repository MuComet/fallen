class CardMinigameController extends EngineInstance { 

    onEngineCreate() { 
        $engine.setBackgroundColour(0xa58443);
        new CardPlayer($engine.getWindowSizeX()/2,$engine.getWindowSizeY()/2);
    }

    onCreate() { 
        this.onEngineCreate();
    }

    step() {
           
    }

}

class CardPlayer extends EngineInstance {

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        var card_texture = ["card_1", "card_2"];  // expand to 9 in final, or wtv needed
        var index = card_texture[EngineUtils.irandom(card_texture.length - 1)];
        this.setSprite(new PIXI.Sprite($engine.getTexture(index)));
        this.hitbox = new Hitbox(this,new RectangeHitbox(this,-25,-25,25,25));
    }

    step() {
        if(IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)){
            this.destroy();
        }       
    }

    draw(gui, camera) {
        EngineDebugUtils.drawHitbox(camera, this);
    }
}