class GameOverController extends EngineInstance {
    onEngineCreate() {
        this.sprite1 = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("game_over_0")));
        this.sprite2 = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("game_over_1")));
        this.sprite2.alpha = 0;
        this.sprite1.x = $engine.getWindowSizeX()/2;
        this.sprite1.y = $engine.getWindowSizeY()/2;
        this.sprite2.x = $engine.getWindowSizeX()/2;
        this.sprite2.y = $engine.getWindowSizeY()/2;
        this.blurFilter = new PIXI.filters.BlurFilter();
        this.blurFilter.blur = 0;
        this.sprite1.filters = [this.blurFilter]
        this.timer = 0;
        this.fadeStarted=false;
        this.transitionTime = 300;
        $engine.startFadeIn(300);
        $engine.setBackgroundColour(0)
        $engine.audioPlaySound("game_over");
        this.delayedAction(33*60,function(){
            if(this.fadeStarted) return;
            var sound = $engine.audioPlaySound("minigame_ambience",1,true,EngineUtils.random(111),111)
            $engine.audioSetLoopPoints(sound,0,111)
            $engine.audioFadeInSound(sound,500);
        });
    }

    step() {
        var fac = EngineUtils.interpolate(++this.timer/this.transitionTime,1.125,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this.sprite1.scale.x=fac;
        this.sprite1.scale.y=fac;

        var fac2 = EngineUtils.interpolate((this.timer-(this.transitionTime-45))/90,0,1,EngineUtils.INTERPOLATE_SMOOTH);
        this.sprite2.alpha=fac2;

        var fac3 = EngineUtils.interpolate((this.timer-240)/500,0,5,EngineUtils.INTERPOLATE_OUT);
        this.blurFilter.blur = fac3;

        if(this.timer > 300 && IN.anyStandardInputPressed() && !this.fadeStarted) {
            $engine.startFadeOut(120);
            $engine.setRoom("MenuIntro")
            this.fadeStarted = true;
            $engine.audioFadeAll(120);
        }
    }
}