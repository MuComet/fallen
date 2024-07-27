class EndingController extends EngineInstance {
    onEngineCreate() {

        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/2;

        this.currentType = EndingController.ENDING_TYPE;
        this.currentLevel = $engine.getDifficultyCorrected() + 1; // write back this value.

        if(this.currentLevel === 0) // easy mode
            this.currentLevel ++;

        $engine.gainEnding(this.currentType,this.currentLevel);

        

        this.endingValues = [];
        this.endingValues.push($engine.getEnding(ENGINE_ENDINGS.BEST));
        this.endingValues.push($engine.getEnding(ENGINE_ENDINGS.GOOD));
        this.endingValues.push($engine.getEnding(ENGINE_ENDINGS.BAD));
        this.endingValues.push($engine.getEnding(ENGINE_ENDINGS.EVIL));

        this.oldValue = 0;
        this.newValue = this.currentLevel;

        if(this.currentType === ENGINE_ENDINGS.BEST) {
            this.oldValue = this.endingValues[0];
            $engine.activateAchievement("BEST_ENDING", function() { console.log("Success!")}, function(err) { console.log(err) })
            this.endingIndex = 0;
        } else if(this.currentType === ENGINE_ENDINGS.GOOD) {
            this.oldValue = this.endingValues[1];
            $engine.activateAchievement("GOOD_ENDING", function() { console.log("Success!")}, function(err) { console.log(err) })
            this.endingIndex = 1;
        } else if(this.currentType === ENGINE_ENDINGS.BAD) {
            this.oldValue = this.endingValues[2];
            $engine.activateAchievement("BAD_ENDING", function() { console.log("Success!")}, function(err) { console.log(err) })
            this.endingIndex = 2;
        } else if(this.currentType === ENGINE_ENDINGS.EVIL) {
            this.oldValue = this.endingValues[3];
            $engine.activateAchievement("EVIL_ENDING", function() { console.log("Success!")}, function(err) { console.log(err) })
            this.endingIndex = 3;
        }

        this.endingSprite = undefined;
        this.endingTextSprite = undefined;

        this.setupSprites();

        $engine.startFadeIn();

        this.timer = 0;

        this.blurFilter = new PIXI.filters.BlurFilter();
        this.blurFilter.blur = 9.666666;
        if(this.oldValue<this.currentLevel)
            this.endingSprite.filters = [this.blurFilter];
        this.endingSprite.alpha = 0;

    }

    setupSprites() {
        this.backSprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("ending_background")),true)
        this.endingSprites = [];
        var completed = 0;
        var completedHard = 0;
        for(var i=0;i<4;i++) {
            var sprite = $engine.createRenderable(this, new PIXI.Sprite(PIXI.Texture.EMPTY),false);
            sprite.y = $engine.getWindowSizeY()/2-128;
            sprite.x = $engine.getWindowSizeX()/2 + (i-1.5) * 128
            this.endingSprites.push(sprite);

            if(this.endingValues[i]===0) {
                sprite.addChild($engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("ending_badges_0"))))
            }
            if(this.endingValues[i] > 0) { // normal badge
                sprite.addChild($engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("ending_badges_"+String(i+1)))));
                completed++;
            }
            if(this.endingValues[i] > 1) { // hard mode bade
                sprite.addChild($engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("end_hard_badge"))));
                completedHard++;
            }

            if(this.endingIndex === i) {
                this.endingSprite = sprite;
            }

            if(completed >= 4){
                $engine.activateAchievement("ALL_ENDING", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            if(completedHard >= 4){
                $engine.activateAchievement("HARD_ENDING", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
        }

        this.endingTextSprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("ending_names_"+String(this.endingIndex))))
        this.endingTextSprite.x = $engine.getWindowSizeX()/2
    }

    step() {

        if((this.timer>210 || (this.oldValue>=this.currentLevel && this.timer > 120)) && IN.anyStandardInputPressed() && ! $engine.isBusy()) {
            $engine.startFadeOut();
            if(this.endingIndex !== 2) {
                $engine.setRoom("CreditsRoom")
            } else {
                $engine.setRoom("MenuIntro")
            }

            if($engine.isDifficulty(ENGINE_DIFFICULTY.HARD)) { // one
                $engine.deleteSave();
            }
        }

        if(this.oldValue<this.currentLevel) {
            if(this.timer>120) {
                var blurFac = EngineUtils.interpolate((this.timer-120)/60,9.66666,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
                this.blurFilter.blur = blurFac;
    
                var alphaFac = EngineUtils.interpolate((this.timer-120)/30,0,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
                this.endingSprite.alpha = alphaFac;
                var scaleFac = EngineUtils.interpolate((this.timer-120)/60,2,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
                this.endingSprite.scale.set(scaleFac)
                var rotationFac = EngineUtils.interpolate((this.timer-120)/60,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
                this.endingSprite.rotation = rotationFac;
            }
        } else {
            this.endingSprite.alpha = 1;
            this.endingSprite.scale.set(1);
            this.endingSprite.rotation = 0;
        }
        
        

        var textFac = EngineUtils.interpolate((this.timer-60)/60,$engine.getWindowSizeY(),$engine.getWindowSizeY()/2,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this.endingTextSprite.y = textFac;

        this.timer++;
    }

    static loadEndingBest() {
        EndingController.ENDING_TYPE = ENGINE_ENDINGS.BEST;
        $engine.setRoom("AddEndingRoom")
    }

    static loadEndingGood() {
        EndingController.ENDING_TYPE = ENGINE_ENDINGS.GOOD;
        $engine.setRoom("AddEndingRoom")
    }

    static loadEndingBad() {
        EndingController.ENDING_TYPE = ENGINE_ENDINGS.BAD;
        $engine.setRoom("AddEndingRoom")
    }

    static loadEndingEvil() {
        EndingController.ENDING_TYPE = ENGINE_ENDINGS.EVIL;
        $engine.setRoom("AddEndingRoom")
    }
}
EndingController.ENDING_TYPE = undefined