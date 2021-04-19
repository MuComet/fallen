class FinalMinigameLoss extends EngineInstance {
    onEngineCreate() {
        this.texture = FinalMinigameLoss.texture;
        FinalMinigameLoss.texture = undefined;
        $engine.createManagedRenderable(this,this.texture); // delete the texture when we're done.
        this.backSprite = $engine.createRenderable(this, new PIXI.Sprite(this.texture));
        this.timer=0;
        this.offX = FinalMinigameLoss.offsetX;
        this.offY = FinalMinigameLoss.offsetY;
        $engine.audioStopAll();
        for(var i =0;i<5;i++) {
            this.delayedAction(i*12, function(vol) {
                $engine.audioPlaySound("final_eson_hit",vol);
            },(5-i)/5)
        }

        this.playerData = FinalMinigameLoss.playerData;
        
        this.playerSprite = $engine.createRenderable(this, new PIXI.Sprite(this.playerData.tex));
        this.playerSprite.skew.x = this.playerData.skew;
        this.playerSprite.x = this.playerData.x;
        this.playerSprite.y = this.playerData.y;

        this.shakeTime = 50;
    }

    step() {
        if(this.timer < 140) {
            var camera = $engine.getCamera();
            var fac = EngineUtils.interpolate((++this.timer-16)/30,1,0,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            this.backSprite.alpha = fac;
            if(this.timer<this.shakeTime) {
                var cameraFac = this.shakeTime-this.timer;
                var rx = EngineUtils.randomRange(-cameraFac,cameraFac)/3;
                var ry = EngineUtils.randomRange(-cameraFac,cameraFac)/3;
                camera.setLocation(rx,ry)
            } else {
                var fac2 = EngineUtils.interpolate((this.timer-this.shakeTime-12)/60,0,1,EngineUtils.INTERPOLATE_SMOOTH_EXPONENTIAL);
            
                camera.setLocation(this.offX * fac2, this.offY * fac2);
            }
        } else {
            this.playerSprite.alpha = EngineUtils.interpolate((++this.timer-140)/60,1,0,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);

            if(this.timer > 240) {
                if($gameVariables.value(19) === 0) { // total cheats are zero
                    $engine.setRoom("BadEndingCutsceneNoCheatRoom"); // lose :(
                } else {
                    $engine.setRoom("BadEndingCutsceneRoom"); // lose :(
                }
                    
            }

        }
        
    }

}
// written by final minigame when the player dies.
FinalMinigameLoss.playerData = undefined;
FinalMinigameLoss.texture = undefined;