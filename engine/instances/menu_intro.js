class MenuIntroController extends EngineInstance {
    onEngineCreate() {
        this.setSprite(new PIXI.Sprite($engine.getTexture("ooi")))
    }

    step() {
        $engine.startFadeOut(60,false)
        SceneManager.goto(Scene_Title)
    }
}