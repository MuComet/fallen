class FinalMinigameController extends EngineInstance { // NOT A MINIGAMECONTROLLER!
    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.FINALE)
        FinalMinigameController.instance = this;
        this.phase = -1;
        this.survivalTime = 0;
        this.zoneLocation = 0;

        this.totalWidth = $engine.getWindowSizeX()+64;

        this.cameraLeft = -32;
        this.cameraRight = $engine.getWindowSizeX()+32;

        this.sharedGlowFilter = new PIXI.filters.GlowFilter();

        this.sharedHealthGlowFilter = new PIXI.filters.GlowFilter();
        this.sharedHealthGlowFilter.color = 0xff3340;
        this.sharedHealthGlowFilter.outerStrength = 0;
        
        this.cameraScrollSpeedX = 0;
        this.cameraScrollSpeedY = -1;

        this.sharedTimer = 0;
        this.sharedPhaseTimer = 0;

        this.timer = new MinigameTimer(60*60)
        this.timer.setTextMode();
        this.timer.pauseTimer()
        this.timer.setSurvivalMode();
        this.timer.setGameCompleteText("")

        this.bulletSoundPlayedTimer = 0;

        this.textBox = new TextBox();
        this.textBox.disableArrow();

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this, 9999999,9999999,9999999,9999999))) // untargetable.

        this.playerHealth = 6;
        this.healthSprites = [];
        for(var i =0;i<this.playerHealth;i++) {
            var spr = $engine.createManagedRenderable(this,new PIXI.Sprite($engine.getTexture("health_point")))
            spr.filters = [this.sharedHealthGlowFilter]
            spr.x = i*32;
            spr.y = 0;
            this.healthSprites.push(spr);
        }
        this.health=this.playerHealth

        this.timer.setY(-32);

        this.player = new FinalMinigamePlayer();

        this.nextPhase();

        this.baseCameraX = 0;
        this.baseCameraY = 0;

        this.cameraShakeTimer = 0;

        this.totalCheats = $gameVariables.value(19);
        this.totalWins = $gameVariables.value(53);
        this.totalPossibleCheats = 10;

        this.hasBeenHurt = false;
        this.isBossActive = false;
        this.bossActiveTimer = 0;

        $engine.startFadeIn();

        this.background = $engine.createRenderable(this,new PIXI.extras.TilingSprite($engine.getTexture("end_scroll"),$engine.getWindowSizeX()+116,$engine.getWindowSizeY()+116*2));
        this.background.x=$engine.getWindowSizeX()/2;
        this.background.y=$engine.getWindowSizeY()+116;
        this.background.tilePosition.x=0;
        this.background.tilePosition.y=0;
        this.background.anchor.x = 0.5;
        this.backgroundTilepositionOffset = 0;

        this.backgroundFinal = $engine.createRenderable(this,new PIXI.Sprite($engine.getTexture("end_arena")));
        this.backgroundFinal.x = $engine.getWindowSizeX()/2;
        this.backgroundFinal.y = 0

        this.backgroundOffset = 0;

        this.cameraSensitivityY=8;
        this.cameraBias = 0;

        this.depth = 999999; // always at the back

        for(var i =0;i<25;i++) {
            new FinalMinigameStar(EngineUtils.irandom($engine.getWindowSizeX()+116)-58,EngineUtils.irandom($engine.getWindowSizeY()+116)-58)
        }


        // NOTE: this is repeated on phase 4 init for testing.
        this.maxHealth = 100 + this.getNumCheats()*10; // 10 extra HP per cheat, max health is 200

        this.currentHealth = this.maxHealth;

        this.healthBar = new ProgressBar(this.maxHealth,ProgressBar.HEALTH)
        this.healthBar.getContainer().y = $engine.getWindowSizeY()-this.healthBar.getHeight()+250
        this.healthBar.setAutoText(false);
        this.healthBar.setValue(0)
        this.healthBar.setFloatingFactor(0.05);
        this.healthBar.setText("")

        this.healthBarTargetY = $engine.getWindowSizeY()-this.healthBar.getHeight()+30

        this.animationIdle = $engine.getAnimation("seye_idle");
        this.animationDirect = $engine.getAnimation("seye_direct_attack");
        this.animationExternal = $engine.getAnimation("seye_external_attack");
        this.animationDie = $engine.getAnimation("seye_die");

        this.xScale = 0.6;
        this.yScale = 0.6;
        this.x=-999;

        this.sourceX = -999;
        this.sourceY = -9999;

        this.bossFinalLocationX = -1; // for die anim.
        this.bossFinalLocationY = -1;

        this.timeSinceLastHit = 0;

        this.genericTimer = 0;
        this.genericTimer2 = 0;

        this.bossTargetX = 0;
        this.bossTargetY = 0;

        this.animation = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.animationIdle,false),true)
        this.animation.animationSpeed=0.1;

        this.documentListener = function(event) { // prevent right clicking
            event.preventDefault();
        }
        document.addEventListener('contextmenu', this.documentListener);
    }

    playBulletSound() {
        if(this.bulletSoundPlayedTimer > 0)
            return;
        $engine.audioPlaySound("final_enemy_fire").speed
        this.bulletSoundPlayedTimer = 3;
    }

    playRandomCharge() {
        $engine.audioPlaySound("final_charge_"+String(EngineUtils.irandom(2) + 1),0.8);
    }

    /**
     * 
     * Plays a sound slowed to take exactly n frames
     * 
     * @param {String} soundName The name of the sound to play
     * @param {Number | -1} frames The amount of frames to stretch the sound for
     */
    playSoundFor(soundName, frames=-1, volume = 0.5) {
        if(frames===-1) {
            $engine.audioPlaySound(soundName,0.5);
            return;
        }
        var snd = $engine.audioPlaySound(soundName,0.5);
        var frameDuration = frames/60;
        var soundDuration = snd._duration;
        var speed = soundDuration/frameDuration;
        snd.speed = speed;
    }

    onEnd(won, final = false) {
        if(won) {
            if(this.health == this.playerHealth){
                $engine.activateAchievement("FINAL_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            if(!final) {
                $engine.setTimescale(0);
                $engine.audioFadeAll();
            }
            $engine.startFadeOut(120);
            this.timer.pauseTimer();
            var cheats = this.getNumCheats();
            if(this.totalWins===16){
                $engine.activateAchievement("WIN_ENDING", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            if(cheats===this.getNumPossibleCheats()){
                $engine.activateAchievement("CHEAT_ENDING", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
            if(cheats===0) {
                $engine.setRoom("BestEndingCutsceneRoom"); // no cheat and win
            } else if (cheats>=8) {
                $engine.setRoom("EvilEndingCutsceneRoom"); // cheat a lot and win
            } else {
                $engine.setRoom("GoodEndingCutsceneRoom"); // cheat some and win
            }
        } else {
            var renderTexture = PIXI.RenderTexture.create($engine.getWindowSizeX()*2,$engine.getWindowSizeY()*2);
            $engine.getRenderer().render($engine,renderTexture,false,null,false); // take a snapshot of the current state.
            FinalMinigameLoss.texture = renderTexture;
            FinalMinigameLoss.offsetX = this.player.x-$engine.getWindowSizeX()/2-$engine.getCamera().getX();
            FinalMinigameLoss.offsetY = this.player.y-this.getCameraTop()-$engine.getWindowSizeY()/2;

            var offsetX = this.player.x - $engine.getCamera().getX();
            var offsetY = this.player.y - $engine.getCamera().getY();
            var skew = this.player.getSprite().skew.x;
            var tex = this.player.getSprite().textures[this.player.getSprite().currentFrame];
            
            var playerData = {
                x:offsetX,
                y:offsetY,
                skew:skew,
                tex:tex,
            }

            FinalMinigameLoss.playerData = playerData;

            $engine.setRoom("FinalMinigameLossRoom");
        }
    }

    step() {
        switch(this.phase) {
            case(0):
                this.phaseZero(); // intro
            break;
            case(1):
                this.phaseOne(); // tutorial
            break;
            case(2):
                this.phaseTwo(); // survial
            break;
            case(3):
                this.phaseThree(); // GOB transition
            break;
            case(4):
                this.phaseFour(); // GOB fight
            break;
            case(5):
                this.phaseFive(); // GOB win
            break;
        }
        this.handleCamera();
        this.handleStars();
        this.handleLife();
        this.handleBoss();
        this.sharedTimer++;
        this.sharedPhaseTimer++;
        this.bulletSoundPlayedTimer--;
    }

    handleBoss() {
        if(this.timeSinceLastHit<12) {
            this.animation.tint = 0xff6060;
        } else { // final_seye_die
            this.animation.tint = 0xffffff;
            this.animation.filters = []
        }
        if(this.timeSinceLastHit===1) {
            this.hasBeenHurt=false;
        }

        if(this.isBossActive) {
            this.bossActiveTimer++;
            var fac = EngineUtils.interpolate(this.bossActiveTimer/60,0,1,EngineUtils.INTERPOLATE_SMOOTH);
            this.x = this.sourceX + Math.sin($engine.getGameTimer()/43) * 14 * fac;
            this.y = this.sourceY + Math.cos($engine.getGameTimer()/37) * 12 * fac;

            if(this.timeSinceLastHit<12) {
                this.x+=EngineUtils.randomRange(-(12-this.timeSinceLastHit),12-this.timeSinceLastHit);
                this.y+=EngineUtils.randomRange(-(12-this.timeSinceLastHit),12-this.timeSinceLastHit);
            }
        }

        // move boss:
        var dx = this.bossTargetX - this.sourceX
        var dy = this.bossTargetY - this.sourceY

        this.sourceX +=dx/32;
        this.sourceY +=dy/32;

        this.timeSinceLastHit++;
        this.animation.update(1);
    }

    handleLife() {
        if(this.player.timeSinceLastDamage<72) {
            var check = this.player.timeSinceLastDamage % 12 < 6;
            this.sharedHealthGlowFilter.outerStrength = check ? 4 : 0;
            this.sharedHealthGlowFilter.innerStrength = check ? 8 : 0;
        } else {
            this.sharedHealthGlowFilter.outerStrength = 0;
            this.sharedHealthGlowFilter.innerStrength = 0;
        }
    }

    handleStars() {
        if(this.sharedTimer%12===0)
            new FinalMinigameStar(EngineUtils.irandom($engine.getWindowSizeX()+116)-58,this.getCameraTop()-128);
    }

    /**
     * Checks if the player has cheated at least this many times
     * 
     * @param {Number} value The minimum number of cheats
     * @returns True if the player cheated at least this many times, false otherwise
     */
    checkCheats(value) {
        return this.totalCheats >= value;
    }

    getNumCheats() {
        return this.totalCheats;
    }

    getNumPossibleCheats() {
        return this.totalPossibleCheats;
    }

    /**
     * Convenience for EngineUtils.clamp()
     * @param {Number} min Minimum
     * @param {Number} max Max
     * @returns The amount of cheats, clamped to within the value
     */
    getNumCheatsClamped(min, max) {
        return EngineUtils.clamp(this.totalCheats,min,max);
    }

    onSwitchPhase(newPhase) {
        this.sharedPhaseTimer=-1;
        switch(newPhase) {
            case(0):
                
            break;
            case(1):
                
            break;
            case(2):
                this.timer.alpha=1;
            break;
            case(3):
                IM.destroy(Shootable)
                IM.destroy(MoveLinearBullet)
                this.cameraScrollSpeedY=0;
                this.player.setCanFire(false);
                this.cancelAllDelayedActions();
                this.x = $engine.getWindowSizeX()/2;
                this.y = this.getCameraTop()-9999;
                this.setHitbox(new Hitbox(this, new RectangleHitbox(this, -150,0,150,400)))
            break;
            case(4):
                this.player.setCanFire(true);
                IM.find(FinalMinigameWeapon).setShouldPauseOnHit(false); // too many enemies, don't pause
                this.maxHealth = 100 + this.getNumCheats()*10; // 10 extra HP per cheat, max health is 200 (this is here for testing, re-evaluates what is above)
                this.currentHealth = this.maxHealth;
                this.healthBar.setMax(this.maxHealth);
            break;
            case(5): // win!
                this.player.setCanFire(false);
                $engine.audioFadeAll(8);
                $engine.audioPlaySound("final_seye_die");
                IM.destroy(MoveLinearBullet);
                IM.destroy(HomingBullet);
                IM.destroy(DelayedDamageZone);
                this.bossFinalLocationX = this.x;
                this.bossFinalLocationY = this.y;
                this.bossTargetX=this.x;
                this.bossTargetY=this.y;
                this.cancelAllDelayedActions();
                EngineUtils.setAnimation(this.animation,this.animationIdle)
            break;
        }
    }

    nextPhase() {
        this.phase++;
        this.onSwitchPhase(this.phase);
    }

    handleCamera() {
        this.baseCameraX+=this.cameraScrollSpeedX;
        this.baseCameraY+=this.cameraScrollSpeedY;

        var cX = this.baseCameraX+$engine.getWindowSizeX()/2;
        var cY = this.baseCameraY+$engine.getWindowSizeX()/2;

        var offX = this.player.x - cX;
        var offY = this.player.y - cY;

        var camera = $engine.getCamera();
        camera.setLocation(this.baseCameraX,this.baseCameraY + this.cameraBias);

        camera.translate(offX/8,offY/this.cameraSensitivityY);

        if(this.cameraShakeTimer>0) {
            var rx = EngineUtils.randomRange(-this.cameraShakeTimer/2,this.cameraShakeTimer/2);
            var ry = EngineUtils.randomRange(-this.cameraShakeTimer/2,this.cameraShakeTimer/2);
            camera.translate(rx,ry)
            this.cameraShakeTimer--;
        }

        // don't use engine background to allow for advanced effects...
        this.background.y = this.baseCameraY + $engine.getWindowSizeY()+116 + this.backgroundOffset;
        this.background.tilePosition.x = -this.baseCameraX
        this.background.tilePosition.y = -this.baseCameraY + this.backgroundTilepositionOffset

        this.backgroundFinal.y = this.baseCameraY + this.backgroundOffset-116;
    }

    phaseZero() { // intro
        var fac = EngineUtils.interpolate(this.sharedPhaseTimer/60,-64,32,EngineUtils.INTERPOLATE_OUT_BACK);
        this.timer.setY(fac);

        var offset = 12;
        for(var i =0;i<this.healthSprites.length;i++) {
            var spr = this.healthSprites[i];
            var fac = EngineUtils.interpolate((this.sharedPhaseTimer-offset*i-30)/60,-64,0,EngineUtils.INTERPOLATE_OUT_BACK);
            spr.y = fac;
        }
        if(this.sharedPhaseTimer>=60) {
            this.timer.alpha = this.sharedPhaseTimer%20 < 10 ? 0.25 : 1;
            if(this.sharedPhaseTimer>150) {
                this.nextPhase();
                this.timer.alpha=1
            }
        }
    }

    tutorialNext() {
        this.sharedPhaseTimer = Math.ceil(this.sharedPhaseTimer/400)*400-1;
    }

    phaseOne() {
        if(this.sharedPhaseTimer===0) {
            new FinalMinigameInstruction("Press direction keys to move!",false, function() {
                return IN.keyCheck("RPGleft") || IN.keyCheck("RPGright") || IN.keyCheck("RPGup") || IN.keyCheck("RPGdown")
            });
        }
        if(this.sharedPhaseTimer===400*1) {
            new FinalMinigameInstruction("Press right click or middle mouse button\nto dodge towards the mouse!",false, function() {
                return IN.mouseCheck(2) || IN.mouseCheck(1);
            });
        }
        if(this.sharedPhaseTimer===400*2) {
            this.attackLine(1)
            var v = new FinalMinigameInstruction("Dodge through bullets!\nDon't let bullets touch your heart!",false, function() {
                return IM.find(FinalMinigamePlayer).y < this.y;
            });
            v.y-=48;
            v.speed = 1;
        }
        if(this.sharedPhaseTimer===400*3) {
            new FinalMinigameInstruction("Hold left click to shoot",false, function() {
                return IN.mouseCheck(0);
            });
        }
        if(this.sharedPhaseTimer===400*4) {
            new FinalMinigameInstruction("Shoot me!",true, function() {
                return this.hasBeenShot
            });
        }
        if(this.sharedPhaseTimer>=400*5) {
            this.timer.alpha = this.sharedPhaseTimer%20 < 10 ? 1 : 0.25;
            if(this.sharedPhaseTimer>400*5+120) {
                this.nextPhase();
                this.timer.unpauseTimer();
                $engine.audioPlaySound("final_music_1")
            }
        }
    }

    phaseTwo() {
        if(this.sharedPhaseTimer===0) {
            this.sequenceAttackHoming(4,60);
        } else if(this.sharedPhaseTimer===120) {
            this.sequenceAttackLines(1);
        } else if(this.sharedPhaseTimer===210 && this.checkCheats(2)) {
            this.sequenceAttackLines(2);
        } else if(this.sharedPhaseTimer===350 && this.checkCheats(3)) {
            this.sequenceAttackLines(3);
        }

        if(this.checkCheats(1) && this.sharedPhaseTimer === 120) {
            this.attackLineHorizontal(true)
            this.attackLineHorizontal(false)
        }

        if(this.checkCheats(9) && this.sharedPhaseTimer==350) {
            this.sequenceSpawnCorners(1,150,8);
        }


        if(this.sharedPhaseTimer>400 && this.sharedPhaseTimer<1000 && this.sharedPhaseTimer%120===0) {
            this.attackLineHorizontal(this.sharedPhaseTimer%240===0)
            if(this.checkCheats((this.sharedPhaseTimer - 400)/120 + 1)) // each line represents one cheat
                this.attackLine();
        }

        if(this.sharedPhaseTimer===1000) {
            this.sequenceAttackHoming(this.getNumCheatsClamped(0,3),45);
        }

        if(this.sharedPhaseTimer>1200 && this.sharedPhaseTimer%180===0 && this.sharedPhaseTimer<2000) {
            if(this.checkCheats(this.sharedPhaseTimer - 1200)/180 + 4) // each line represents one cheat
                this.sequenceAttackLines(this.checkCheats(5) ? 3 : 1); // if you cheated only 4 times, then you get an easy one
        }

        if(this.sharedPhaseTimer===1200) {
            this.sequenceFireAtPlayer();
        }

        if(this.checkCheats(2) && this.sharedPhaseTimer===1400) {
            this.sequenceFireAtPlayer();
        }

        if(this.checkCheats(4) && this.sharedPhaseTimer===1600) {
            this.sequenceFireAtPlayer();
        }

        if((this.checkCheats(6) && this.sharedPhaseTimer===1200) || (this.checkCheats(4) && this.sharedPhaseTimer===1400) || this.sharedPhaseTimer===1600) {
            this.sequenceAttackWipe();
        }

        if(this.checkCheats(7) && this.sharedPhaseTimer===2000) {
            this.sequenceFireAtPlayer();
        }

        if((this.checkCheats(5) && this.sharedPhaseTimer===1800)) {
            this.sequenceAttackWipe();
        }

        if(this.sharedPhaseTimer===2000) {
            this.sequenceSpawnCorners(2,16,16);
        }

        if(this.sharedPhaseTimer===2300) {
            if(this.checkCheats(4))
                this.sequenceAttackHoming(4,60);
            this.sequenceSpawnCorners(2,150,10);
            if(this.checkCheats(5))
                this.sequenceFireAtPlayer();
        }
        if(this.checkCheats(8) && this.sharedPhaseTimer===2315) {
            this.sequenceSpawnCorners(2,150,20);
        }

        if(this.sharedPhaseTimer>2500 && this.sharedPhaseTimer<3000 && this.sharedPhaseTimer%150===0) {
            if(this.checkCheats(1))
                this.attackLineHorizontal(this.sharedPhaseTimer%300===0)
            this.attackLine();
        }

        if(this.checkCheats(10) && this.sharedPhaseTimer==3300) { // die
            this.sequenceSpawnCorners(2,150,8);
        }
        if(this.checkCheats(7) && this.sharedPhaseTimer==3375) { // die
            this.sequenceSpawnCorners(2,150,12);
        }

        if(this.sharedPhaseTimer===3100) {
            this.sequenceAttackHoming(8,60);
            this.sequenceSpawnCorners(2,150,10);
            if(this.checkCheats(1))
                this.sequenceFireAtPlayer();
        }

        if((this.checkCheats(6) && this.sharedPhaseTimer===3115)) {
            this.sequenceSpawnCorners(2,150,20);
        }

        if(!this.checkCheats(6) && (this.checkCheats(3) && this.sharedPhaseTimer === 3200)) { // alt of above.
            this.sequenceSpawnCorners(2,150,20);
        }

        if(this.sharedPhaseTimer===3300) {
            this.sequenceAttackHoming(8,60);
            if(this.checkCheats(9))
                this.sequenceSpawnCorners(2,150,10);
        }

        if(this.checkCheats(5) && this.sharedPhaseTimer===3315) {
            this.sequenceSpawnCorners(2,150,20);
        }

        if(!this.checkCheats(5) && (this.checkCheats(2) && this.sharedPhaseTimer === 3400)) { // alt of above.
            this.sequenceSpawnCorners(2,150,20);
        }

        if(this.sharedPhaseTimer===3600) {
            this.nextPhase();
        }
    }

    phaseThree() { // transition phase
        if(this.sharedPhaseTimer<=60) {
            var fac = EngineUtils.interpolate(this.sharedPhaseTimer/60,1,0,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            this.timer.alpha = fac;
        }
        if(this.sharedPhaseTimer>=60 && this.sharedPhaseTimer <= 300) {
            var targetX = $engine.getWindowSizeX()/2;
            var targetY = this.getCameraTop() + $engine.getWindowSizeY()/2 - this.cameraBias;
            var dx = targetX - this.player.x;
            var dy = targetY - this.player.y;
            this.player.x +=dx/32;
            this.player.y +=dy/32;

            var fac = EngineUtils.interpolate((this.sharedPhaseTimer-60)/240,0,1,EngineUtils.INTERPOLATE_SMOOTH)
            var diff = this.backgroundOffset - fac * ($engine.getWindowSizeY() + 180);
            this.backgroundOffset = fac * ($engine.getWindowSizeY() + 180);
            this.y = this.getCameraTop() - (1-fac) * ($engine.getWindowSizeY() + 180);

            this.cameraSensitivityY = EngineUtils.interpolate((this.sharedPhaseTimer-60)/240,8,1000,EngineUtils.INTERPOLATE_SMOOTH)
            this.cameraBias = EngineUtils.interpolate((this.sharedPhaseTimer-60)/240,0,-300,EngineUtils.INTERPOLATE_SMOOTH)

            IM.with(FinalMinigameStar,function(star) {
                star.y-=diff;
            })

            this.sourceX = $engine.getWindowSizeX()/2;
            this.sourceY = this.y;
            this.bossTargetX = $engine.getWindowSizeX()/2;
            this.bossTargetY = this.y;
        }

        if(this.sharedPhaseTimer===300) {
            this.isBossActive=true;
            var arr = [];
            arr.push("__portrait[gods_profiles_3]__voice[voice_normal]So this is what it comes down to.__wait[30] Me against you.__wait[30] One on one.")
            arr.push("I must say,__wait[12] you really don't have a lot going on in the intelligence department,__wait[12] do you?__wait[30] "
                + "Then again,__wait[30]__noShift[1]__portrait[gods_profiles_1] what is there to expect from a mere 600 year old Angel.__wait[24]__portrait[gods_profiles_3] "
                + "The signs were all there Eson.")
            if(this.getNumCheats()===0) {
                arr.push("Tsk.__wait[12] Tsk.__wait[12] Tsk.__wait[24] You just had to get back into the heavens at any cost.")
            } else {
                arr.push("Tsk.__wait[12] Tsk.__wait[12] Tsk.__wait[24] You just had to get back into the heavens at any cost.__wait[30] "
                + "That bistro was calling your name and you couldn't care less about the souls you were sacrificing__noShift[1]__portrait[gods_profiles_1]"
                + " – even if you didn't know.")
                arr.push("__portrait[gods_profiles_3]Who's really the enemy here Eson?__wait[24] Me__wait[12]__speed[4]__noShift[0] or you?")
            }
            arr.push("__portrait[gods_profiles_1]How does it feel,__wait[12] knowing you'll die at my hands,__wait[12] never experiencing the sweet taste of that __speed[6]\"God tier\"__speed[0] bistro?__wait[60]__noShift[1]__portrait[gods_profiles_3] Anyway,__wait[12] It's about time I showed you what it really means to be a god.")
            arr.push("Good luck,__wait[9] kid.__wait[30]__voice[voice_deep] __speed[5]You'll need it.")
            this.textBox.setTextArray(arr);
            this.player.setCanFire(true);
        }
        if(this.hasBeenHurt) {
            this.player.setCanFire(false);
            this.textBox.setTextArray(["__portrait[gods_profiles_0]__voice[voice_normal]Are you kidding me?!__wait[24]__noShift[1]__portrait[gods_profiles_2] Can you seriously not wait 30 SECONDS for me to talk??__wait[30] Alright,__wait[12] it's on!"])
        }

        if(this.sharedPhaseTimer>=300) {
            var targetX = $engine.getWindowSizeX()/2;
            var targetY = this.getCameraTop() + $engine.getWindowSizeY()/2 - this.cameraBias;
            var dx = targetX - this.player.x;
            var dy = targetY - this.player.y;
            this.player.x +=dx/4;
            this.player.y +=dy/4;
        }

        if(this.sharedPhaseTimer>300 && this.textBox.isReady() && this.textBox.hasMoreText() && ++this.genericTimer>90) {
            this.textBox.advance();
            this.genericTimer = 0;
        }

        if(this.sharedPhaseTimer>300 && !this.textBox.hasMoreText()) {
            this.player.setCanFire(false); // don't let them shoot
            var fac = EngineUtils.interpolate(this.genericTimer/30,this.healthBarTargetY+180,this.healthBarTargetY,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.healthBar.getContainer().y = fac;
            if(this.genericTimer===30) {
                this.healthBar.setFlashing(true);
                this.healthBar.setValue(this.maxHealth);
            }

            if(this.genericTimer>90) {
                this.healthBar.setFlashing(false);
                this.nextPhase();
                var snd = $engine.audioPlaySound("final_music_2",1,true);
                $engine.audioSetLoopPoints(snd,30,94)
            }
            this.genericTimer++;
        }
    }

    // please forgive my spaghetti. *ahem* game jam game jam game jam
    phaseFour() { // boss battle!
        var finalStand = false;
        if($engine.isDifficulty(ENGINE_DIFFICULTY.HARD)) {
            finalStand = (this.currentHealth/this.maxHealth < 0.5); // on hard mode, start hard attacks earlier.
        } else {
            finalStand = (this.currentHealth/this.maxHealth < 0.3333);
        }

        if(this.currentHealth/this.maxHealth < 0.2)
            this.healthBar.setFlashing(true); // ALMOST THERE

        if(this.genericTimer<0) {
            var rand = EngineUtils.random(1);
            var healthFac = (1-this.currentHealth/this.maxHealth) // value between 0 and 1 where 0 means that the boss is full health


            // 75% chance to idle if you didn't cheat.
            rand-= healthFac*0.75; // reduce to 0% chance of idle at 0HP
            rand-= (0.75 * (this.getNumCheats() / this.getNumPossibleCheats())) // always attacking if you cheated max times


            if(rand>0.25 || this.attacked) { // always idle after an attack, but also chance to idle anyway
                EngineUtils.setAnimation(this.animation,this.animationIdle);
                if(finalStand && !$engine.isDifficulty(ENGINE_DIFFICULTY.EASY)) {
                    this.genericTimer = EngineUtils.irandomRange(60,120) // on final stand, attack faster UNLESS easy mode
                } else {
                    this.genericTimer = EngineUtils.irandomRange(120,240)
                }
                
                this.attacked = false;
                return;
            }
            this.attacked = true;

            if(finalStand && $engine.isDifficulty(ENGINE_DIFFICULTY.EASY)) { // unleash the H A R D   A T T A C K S
                rand = EngineUtils.irandom(16);
            } else {
                rand = EngineUtils.irandom(12);
            }
            

            // choose a random main attack
            if(rand===0) { // spinny boi
                EngineUtils.setAnimation(this.animation,this.animationDirect);
                this.sequenceAttackCircleRotate(this.x,this.y + 125)
                this.playSoundFor("final_attack_direct_spin",360,1)
                this.genericTimer = 360
            } else if(rand===1) { // damage zones
                EngineUtils.setAnimation(this.animation,this.animationExternal);
                this.delayedAction(60,this.sequenceAttackDamageZones,75,45,20,10 + this.getNumCheats())
                this.playRandomCharge();
                this.genericTimer = EngineUtils.irandomRange(360,420)
            } else if(rand===2) { // grid
                EngineUtils.setAnimation(this.animation,this.animationExternal);
                this.sequenceAttackGrid(4)
                this.playRandomCharge();
                this.genericTimer = 400
            } else if(rand===3) { // wipe
                EngineUtils.setAnimation(this.animation,this.animationDirect);
                for(var i =1;i<=4;i++) {
                    this.delayedAction(i*90, this.sequenceAttackWipeFull,this.x,125);
                }
                this.playSoundFor("final_attack_direct",90*4)
                this.genericTimer = 90*4
            } else if(rand===4) { // corners
                EngineUtils.setAnimation(this.animation,this.animationExternal);
                this.sequenceAttackCornersOffset(10,3);
                this.playRandomCharge();
                this.genericTimer = EngineUtils.irandomRange(600,720)
            } else if (rand === 5) { // tunnel
                EngineUtils.setAnimation(this.animation,this.animationExternal);
                this.attackTunnel();
                this.playRandomCharge();
                this.genericTimer = EngineUtils.irandomRange(180,240);
            } else if(rand===6) { // spinny bois
                EngineUtils.setAnimation(this.animation,this.animationDirect);
                this.sequenceAttackCircleRotate(this.x,this.y + 90,20,6,24,0.1)
                this.delayedAction(12,this.sequenceAttackCircleRotate,this.x,this.y + 90,20,6,24,-0.1);
                this.playSoundFor("final_attack_direct_spin",20*24,1)
                this.genericTimer = 20*24
            } else if(rand===7) { // fire lines
                EngineUtils.setAnimation(this.animation,this.animationDirect);
                for(var i =0;i<8;i++) {
                    this.delayedAction(i*30,function() {
                        this.attackFireLine(this.x,this.y + 125,V2D.calcDir(this.player.x-this.x, -(this.player.y-(this.y+125))));
                    });
                }
                this.playSoundFor("final_attack_direct",7*30)
                this.genericTimer = 7*30;
            } else if(rand===8) { // star corners
                EngineUtils.setAnimation(this.animation,this.animationExternal);
                this.sequenceAttackCornersStar(2,120,6, 4, 4, Math.PI/8);
                this.playRandomCharge();
                this.genericTimer = 45*4;
            } else if(rand===9) { // star direct
                EngineUtils.setAnimation(this.animation,this.animationDirect);
                this.attackStar(this.x,this.y+125,16,5,6,0);
                this.playSoundFor("final_attack_direct",120)
                this.genericTimer = 120
            } else if(rand === 10 && this.bossTargetX !== $engine.getWindowSizeX()/2-256) { // move boss to left
                EngineUtils.setAnimation(this.animation,this.animationIdle);
                if(this.bossTargetX === $engine.getWindowSizeX()/2-256) { // can't move to same location
                    this.bossTargetX = $engine.getWindowSizeX()/2;
                } else {
                    this.bossTargetX = $engine.getWindowSizeX()/2-256;
                }
                this.genericTimer = 60;
            } else if (rand===11) { // move boss to center
                EngineUtils.setAnimation(this.animation,this.animationIdle);
                if(this.bossTargetX === $engine.getWindowSizeX()/2) { // can't move to same location
                    this.bossTargetX = $engine.getWindowSizeX()/2+256;
                } else {
                    this.bossTargetX = $engine.getWindowSizeX()/2;
                }
                this.genericTimer = 60;
            } else if(rand === 12 && this.bossTargetX !== $engine.getWindowSizeX()/2+256) { // move boss right
                EngineUtils.setAnimation(this.animation,this.animationIdle);
                if(this.bossTargetX === $engine.getWindowSizeX()/2+256) { // can't move to same location
                    this.bossTargetX = $engine.getWindowSizeX()/2;
                } else {
                    this.bossTargetX = $engine.getWindowSizeX()/2+256;
                }
                this.genericTimer = 60;
            } else if (rand===13) { // harder version of grid
                EngineUtils.setAnimation(this.animation,this.animationExternal);
                this.sequenceAttackGrid(5,90)
                this.playRandomCharge();
                this.genericTimer = 520
            } else if(rand===14) { // harder version of fire lines
                EngineUtils.setAnimation(this.animation,this.animationDirect);
                for(var i =0;i<5;i++) {
                    this.delayedAction(i*45,function() {
                        this.attackFireLine(this.x,this.y + 125,V2D.calcDir(this.player.x-this.x, -(this.player.y-(this.y+125))),5,6);
                    });
                    this.delayedAction(i*45-15,function() {
                        this.attackFireLine(this.x,this.y + 125,V2D.calcDir(this.player.x-this.x, -(this.player.y-(this.y+125))) - Math.PI / 4,5,6);
                    });
                    this.delayedAction(i*45+15,function() {
                        this.attackFireLine(this.x,this.y + 125,V2D.calcDir(this.player.x-this.x, -(this.player.y-(this.y+125))) + Math.PI / 4,5,6);
                    });
                }
                this.playSoundFor("final_attack_direct",5*45)
                this.genericTimer = 5*45;
            } else if(rand===15) { // 5 stars across the top of the screen
                EngineUtils.setAnimation(this.animation,this.animationExternal);
                var xStart = $engine.getWindowSizeX()/2-256;
                var diff = 128;
                for(var i =0;i<5;i++) {
                    this.delayedAction(i*40,this.attackStar,xStart+diff*i,this.y,6,6,3);
                }
                this.playRandomCharge();
                this.genericTimer=40*5;

            } else if(rand === 16) { // fast wipe with star as well
                EngineUtils.setAnimation(this.animation,this.animationDirect);
                this.delayedAction(45,function() { // arm for 45 frames
                    for(var i =0;i<4;i++) {
                        this.delayedAction(i*60, this.sequenceAttackWipeFull,this.x,125);
                    }
                    this.attackStar(this.x,this.y+125,8,5,4,0);
                    this.delayedAction(120,this.attackStar,this.x,this.y+125,8,5,4,Math.PI/8) // offset by half the angle of the last
                })
                this.playSoundFor("final_attack_direct",60*4 + 45)
                this.genericTimer = 60*4 + 45
                
            }
        }

        if(this.genericTimer2<0) { // random add attacks, scales with cheats
            var cheatFactor = (this.getNumCheats() / this.getNumPossibleCheats()) // 1 if always cheated, 0 if never

            this.genericTimer2 = EngineUtils.irandomRange(600,720) * (1.5-cheatFactor/2);

            var rand = EngineUtils.irandom(2)
            if(rand===0) { // homing delayed
                this.sequenceAttackHoming(2 + this.getNumCheatsClamped(0,4),60);
            } else if (rand===1) { // damage zone add
                this.sequenceAttackDamageZones(150,100,100,4);
            } else if(rand===2) { // homing all at once
                this.sequenceAttackHoming(1+this.getNumCheatsClamped(0,4),0);
            }
        }
        this.genericTimer--;
        this.genericTimer2--;
    }

    phaseFive() {
        if(this.sharedPhaseTimer<=60) { // fade out all the UI
            var fac = EngineUtils.interpolate(this.sharedPhaseTimer/60,1,0,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            this.healthBar.getContainer().alpha = fac;
            for(var i =0;i<this.healthSprites.length && i<this.health;i++)
                this.healthSprites[i].alpha = fac;
        }
        if(this.sharedPhaseTimer===120) {
            EngineUtils.setAnimation(this.animation,this.animationDie)
        }
        var volume = EngineUtils.interpolate((this.sharedPhaseTimer-120)/240,0.7,0,EngineUtils.INTERPOLATE_IN);
        if(this.sharedPhaseTimer>=120) {
            var targetX = $engine.getWindowSizeX()/2;
            var targetY = this.getCameraTop() + $engine.getWindowSizeY()/2 - this.cameraBias;
            var dx = targetX - this.player.x;
            var dy = targetY - this.player.y;
            this.player.x +=dx/32;
            this.player.y +=dy/32;


            if(this.sharedPhaseTimer%3===0)
                new FinalMinigameCloudParticle(this.x + EngineUtils.irandomRange(-40,40),this.y + 125 + EngineUtils.irandomRange(-125,125));

            if(this.sharedPhaseTimer%20===0) {
                $engine.audioPlaySound("final_zone_attack",volume).speed = EngineUtils.randomRange(0.7,1.3);
            }

            var randFac = EngineUtils.interpolate((this.sharedPhaseTimer-60)/120,0,128,EngineUtils.INTERPOLATE_IN_QUAD);
            var xFac = EngineUtils.randomRange(-randFac,randFac);
            var yFac = EngineUtils.randomRange(-randFac,randFac);
            this.bossTargetX = this.bossFinalLocationX + xFac;
            this.bossTargetY = this.bossFinalLocationY + yFac;
        }

        if(this.sharedPhaseTimer===300) {
            this.onEnd(true,true)
        }
    }

    sequenceFireAtPlayer() {
        var num = 16;
        var dx = (this.totalWidth-64)/(num-1);
        
        for(var i =0;i<num;i++) {
            this.delayedAction(i*20,function(index) {
                var xx = dx*index+this.cameraLeft/2
                var yy = this.getCameraTop()-32;
                var dir = V2D.calcDir(this.player.x-xx,yy-this.player.y);
                new MoveLinearBullet(xx,yy,dir,5)
            },i);
            
        }
    }

    sequenceAttackWipe(offset = 0) {
        var fac = Math.PI/8;
        this.attackWipe($engine.getWindowSizeX()/2,this.getCameraTop() + offset,Math.PI+fac,Math.PI*2-fac,1,30,6);
        this.delayedAction(5,this.attackWipe,$engine.getWindowSizeX()/2,this.getCameraTop() + offset,Math.PI+fac,Math.PI*2-fac,1,30,6)
        this.delayedAction(10,this.attackWipe,$engine.getWindowSizeX()/2,this.getCameraTop() + offset,Math.PI+fac,Math.PI*2-fac,1,30,6)
    }

    sequenceAttackWipeFull(x,offset = 0) { // variant that attack slightly behind for final
        var fac = -Math.PI/16;
        this.attackWipe(x,this.getCameraTop() + offset,Math.PI+fac,Math.PI*2-fac,1,30,6);
        this.delayedAction(5,this.attackWipe,x,this.getCameraTop() + offset,Math.PI+fac,Math.PI*2-fac,1,30,6)
        this.delayedAction(10,this.attackWipe,x,this.getCameraTop() + offset,Math.PI+fac,Math.PI*2-fac,1,30,6)
    }

    sequenceAttackLines(times) {
        this.attackLine();
        for(var i =1;i<times;i++) {
            this.delayedAction(15*i,this.attackLine)
        }

    }

    sequenceAttackGrid(times=8, delay = 120) {
        for(var i =0;i<times;i++) {
            this.delayedAction(delay * i, function() {
                this.attackLineHorizontal(i%2===0)
                this.attackLine();
            })
        }
        
    }

    sequenceAttackCornersOffset(bullets=8, times=1, delayBetween = 60) {
        for(var i =0;i<times;i++) {
            this.delayedAction(200* i, function() {
                this.sequenceSpawnCorners(2,delayBetween,bullets);
                this.delayedAction(15,this.sequenceSpawnCorners,2,delayBetween,bullets*2);
            })
        }
    }

    sequenceAttackCornersStar(times=4,delay=45,dots = 16, maxSpeed=4, waves = 4, offset = 0) {
        var off = -delay/2;
        var left = this.cameraLeft+64
        for(var i =0;i<times;i++) {
            this.delayedAction(delay*i,this.attackStar,left,this.getCameraTop(),dots,maxSpeed,waves,offset*i);
        }

        var right = this.cameraRight-64

        for(var i =0;i<times;i++) {
            this.delayedAction(delay*i+off,this.attackStar,right,this.getCameraTop(),dots,maxSpeed,waves,offset*i);
        }
    }

    sequenceSpawnCorners(times=4,delay=45,dots = 16) {
        var off = -delay/2;
        var left = this.cameraLeft+64
        for(var i =0;i<times;i++) {
            this.delayedAction(delay*i,this.attackCircle,left,this.getCameraTop(),dots,4);
        }

        var right = this.cameraRight-64

        for(var i =0;i<times;i++) {
            this.delayedAction(delay*i+off,this.attackCircle,right,this.getCameraTop(),dots,4);
        }
    }

    sequenceAttackHoming(bullets, wait=20) {
        var dx = this.totalWidth/(bullets-1)
        new HomingBullet(0,this.getCameraTop()-32,2)
        for(var i=1;i<bullets;i++) {
            this.delayedAction(wait*i,function(loc) {
                new HomingBullet(loc,this.getCameraTop()-32,2)
            },dx*i);
        }
    }

    sequenceAttackDamageZones(size, damageZoneDelay, repeatDelay, times=1, phase = 0) {
        // delayed action recursion
        if(phase<times)
            this.delayedAction(repeatDelay,this.sequenceAttackDamageZones,size,damageZoneDelay,repeatDelay,times,phase+1);
        new DelayedDamageZone(this.player.x,this.player.y,size,damageZoneDelay);
    }

    sequenceAttackCircleRotate(x,y, repeat = 30,bullets = 5, delay = 12, angleChange = 0.09, angle = 0) {
        this.attackCircleRotatable(x,y,bullets,3,angle);
        if(repeat<=0)
            return;
        this.delayedAction(delay, function() {
            this.sequenceAttackCircleRotate(x,y,repeat-1,bullets,delay,angleChange,angle+angleChange)
        })
    }

    attackCircleRotatable(x,y,bullets,speed,offset) {
        var diff = Math.PI*2/bullets;
        for(var i =0;i<bullets;i++) {
            var b = new MoveLinearBullet(x,y,diff*i+offset,speed);
            b.disableRandom();
        }
    }

    attackStar(x,y,bullets,maxSpeed, totalWaves, rotationOffset = 0) {
        var diff = Math.PI*2/bullets;
        var diffSpeed = maxSpeed/(totalWaves+1);
        for(var j = 0;j<totalWaves;j++) {
            for(var i =0;i<bullets;i++) {
                var b = new MoveLinearBullet(x,y,diff*i + rotationOffset,maxSpeed - diffSpeed * j);
                b.disableRandom();
            }
        }
        
    }

    attackFireLine(x,y,angle,bullets=8,maxSpeed=4) {
        var diffSpeed = maxSpeed/(bullets+1);
        for(var i =0;i<bullets;i++) {
            var b = new MoveLinearBullet(x,y,angle,maxSpeed - diffSpeed * i);
                b.disableRandom();
        }
    }

    attackConstrainWalls() {
        if(this.sharedPhaseTimer%32===0) {
            var right = this.totalWidth;
            for(var i =0;i<4;i++) {
                new MoveLinearBullet((i+1)*48-64,this.getCameraTop()-32,Math.PI/2*3,2,false);
                new MoveLinearBullet(right-(i+1)*48,this.getCameraTop()-32,Math.PI/2*3,2,false);
            }
        }
    }

    attackCircle(x,y,bullets,speed=2,c = MoveLinearBullet) {
        var diff = Math.PI*2/bullets;
        for(var i =0;i<bullets;i++) {
            var b = new c(x,y,diff*i,speed);
            b.disableRandom();
        }
    }

    attackWipe(x,y,startAngle,endAngle,delay,bullets,speed=1,phase=0) {
        // delayed action recursion
        if(phase<bullets)
            this.delayedAction(delay,this.attackWipe,x,y+this.cameraScrollSpeedY*delay,startAngle,endAngle,delay,bullets,speed,phase+1);
        var diff = (endAngle-startAngle)/(bullets-1);
        var angle = startAngle+diff*phase;
        new MoveLinearBullet(x,y,angle,speed)
    }

    attackHemi(x,y,direction,rad,bullets,speed=2,c = MoveLinearBullet) {
        var startAngle = direction-rad/2;
        var fac = rad/(bullets-1);
        for(var i =0;i<bullets;i++) {
            new c(x,y,startAngle+fac*i,speed);
        }
    }

    attackLine(speed = 2) {
        var num = 16;
        var dx = (this.totalWidth-64)/num;
        for(var i =0;i<=num+1;i++) {
            new MoveLinearBullet(dx*i+this.cameraLeft/2,this.getCameraTop()-32,Math.PI/2*3,speed,false)
        }
    }

    /**
     * @param {Number} direction 1 for aim right, 0 for left
     */
     attackLineHorizontal(direction) {
        var num = 24;
        var dy = ($engine.getWindowSizeY()*2)/num;
        var yy = this.getCameraTop()-$engine.getWindowSizeY();
        var dir = direction ? 0 : Math.PI;
        var offset = direction ? -32 : this.totalWidth+32;
        for(var i =0;i<=num+1;i++) {
            new MoveLinearBullet(offset,yy+dy*i,dir,2,false)
        }
    }

    attackTunnel() {
        var off = this.getCameraTop();
        var path = 15;
        var nextLocation = 15;
        var width = 20;

        var dx = (this.totalWidth)/(width-1)
        var pathWidth = 3;
        var dy = -80;

        for(var i =0;i<15;i++) {
            while(path===nextLocation) {
                nextLocation= EngineUtils.irandomRange(pathWidth,width-pathWidth);
            }
            var diff = nextLocation-path;
            var signDiff = Math.sign(diff);

            path+=signDiff;
            for(var xx = 0;xx<width;xx++) {
                if(Math.abs(xx-path)<pathWidth)
                    continue;
                new MoveLinearBullet(-64 + dx+xx*dx,-64+off+i*dy,Math.PI*3/2,4);
            }
        }
    }

    getCameraTop() {
        return $engine.getCamera().getY();
    }


    takeDamage(dmg) {
        this.health-=dmg;
        this.checkDeath();
        this.shake();
    }

    hitBoss() {
        this.hasBeenHurt = true;
        this.timeSinceLastHit = 0;
        this.currentHealth--;
        this.healthBar.setValue(this.currentHealth);
        this.checkBossDeath(); 
        this.shake(4); // since it happens so much, small shake
        this.animation.filters = [this.sharedGlowFilter]
        $engine.audioPlaySound("final_enemy_hit").speed = EngineUtils.randomRange(0.8,1.2);
    }

    checkBossDeath() {
        if(this.currentHealth<0) { // so long
            this.nextPhase(); // go to phase 5!
        }
    }

    checkDeath() {
        if(!this.isAlive()) {
            this.onEnd(false);
        }
    }

    isAlive() {
        return this.health>0;
    }

    shake(frames=18) {
        if(this.cameraShakeTimer < 0)
            this.cameraShakeTimer=0;
        this.cameraShakeTimer+=frames;
        if(this.cameraShakeTimer>30) {
            this.cameraShakeTimer=30;
        }
    }

    draw(gui,camera) {
        for(var i =0;i<this.healthSprites.length && i<this.health;i++)
            $engine.requestRenderOnCameraGUI(this.healthSprites[i]);
    }

    onDestroy() {
        document.removeEventListener('contextmenu', this.documentListener);
    }

    static getInstance() {
        return FinalMinigameController.instance
    }
}
FinalMinigameController.instance = undefined;
FinalMinigameController.start = function() {
    $engine.setRoom("FinalMinigameRoom");
}

class BulletClearer extends EngineInstance {
    onCreate(x,y,radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.graphics = $engine.createRenderable(this, new PIXI.Graphics());
        this.timer = 0;
        this.lifeTime = 48;
        this.depth = -1;
    }

    step() {
        var fac1 = ++this.timer/this.lifeTime
        var fac2 = EngineUtils.interpolate(fac1,0,this.radius,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        var fac3 = EngineUtils.interpolate(fac1,1,0,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);

        this.graphics.clear();
        this.graphics.lineStyle(fac3*4,0xffffff,fac3)
        this.graphics.drawCircle(this.x,this.y,fac2);

        var xx = this.x;
        var yy = this.y;

        var fac2Sq = fac2*fac2;

        IM.with(MoveLinearBullet,function(bullet) {
            if(V2D.distanceSq(xx,yy,bullet.x,bullet.y)<fac2Sq) {
                bullet.destroy();
            }
        });

        if(this.timer>=this.lifeTime)
            this.destroy();
    }
}

class Shootable extends EngineInstance {
    onCreate() {
        this.isAlive=true;
        this.canTakeDamage=true;
        this.lifeTimer = 0;
        this.lifeTime = 30;
    }

    step() {
        if(!this.isAlive) {
            var fac = EngineUtils.interpolate(++this.lifeTimer/this.lifeTime,1,0,EngineUtils.INTERPOLATE_IN_BACK);
            this.yScale = fac;
            if(this.lifeTimer>=this.lifeTime) {
                this.destroy();
            }

            if(this.lifeTimer > 8)
                this.getSprite().filters = [];
            var fac2 = EngineUtils.interpolate(this.lifeTimer/this.lifeTime,0,24,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            this.x+=EngineUtils.randomRange(-fac2,fac2);
            this.y+=EngineUtils.randomRange(-fac2,fac2);
        }
    }

    onHit() {
        this.isAlive=false;
        this.getSprite().filters = [FinalMinigameController.getInstance().sharedGlowFilter]
        $engine.audioPlaySound("final_enemy_hit");
    }

    canBeHurt() {
        return this.canTakeDamage && this.isAlive;
    }
}

class FinalMinigameInstruction extends Shootable {
    onCreate(text, shootable, func) {
        super.onCreate();
        this.x = $engine.getWindowSizeX()/2;
        this.y = FinalMinigameController.getInstance().getCameraTop();
        this.setSprite(new PIXI.Text(text,$engine.getDefaultTextStyle()))
        var spr = this.getSprite();
        this.depth = -1;
        this.getSprite().anchor.x = 0.5;
        this.getSprite().anchor.y = 1;
        this.canTakeDamage=shootable;
        this.alive = true;
        this.deathTimer = 0;
        this.func = func
        this.speed = 1;
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this, -spr.width/2,-spr.height,spr.width/2,0)))
    }

    step() {
        super.step();
        this.y+=this.speed;
        if(this.alive && (this.y>=FinalMinigameController.getInstance().getCameraTop()+512 || this.func.call(this))) {
            this.alive = false;
            FinalMinigameController.getInstance().tutorialNext();
        }

        if(!this.alive) {
            if(++this.deathTimer>30)
                this.destroy();
            this.alpha = EngineUtils.interpolate(this.deathTimer/30,1,0,EngineUtils.INTERPOLATE_IN);
        }
    }

    onHit() {
        super.onHit();
        FinalMinigameController.getInstance().tutorialNext();
    }
}

class FinalMinigameStar extends EngineInstance {
    onCreate(x,y) {
        this.x = x;
        this.y = y;
        var dist = EngineUtils.irandom(200);
        var fac = 1-dist/200; // larger the closer you are
        this.speed = 1+fac*2;
        this.xScale = fac/3+0.5;
        this.yScale = fac/3+0.5;
        this.depth = 1000;
        this.baseAlpha = EngineUtils.randomRange(0.25,0.5)
        this.alpha = this.baseAlpha;
        this.randOffset = EngineUtils.random(200);
        this.setSprite(new PIXI.Sprite($engine.getTexture("star")));
    }

    step() {
        this.y+=this.speed;
        if(this.y>=FinalMinigameController.getInstance().getCameraTop()+1000)
            this.destroy();
        this.alpha = Math.abs(Math.sin(($engine.getGameTimer()+this.randOffset)/32))*this.baseAlpha
    }
}

class FinalMinigameWarning extends EngineInstance {
    onCreate(x,y, frames, absolute = false) {
        this.x = x;
        this.y = y;
        this.alignToCamera = absolute
        this.originalX = this.x;
        this.originalY = this.y;
        this.depth = -99999999;
        this.lifeTime = frames;
        this.lifeTimer = 0;
        this.fadeTime = 30;
        this.setSprite(new PIXI.Sprite($engine.getTexture("warning_sign")))
    }

    step() {
        if(this.lifeTimer <= this.fadeTime) {
            var alphaFac = EngineUtils.interpolate(this.lifeTimer/this.fadeTime,0,1,EngineUtils.INTERPOLATE_OUT)
            this.alpha = alphaFac;
        }

        if(this.lifeTimer >= this.lifeTime - this.fadeTime) {
            var alphaFac = EngineUtils.interpolate((this.lifeTimer - (this.lifeTime - this.fadeTime))/this.fadeTime,1,0,EngineUtils.INTERPOLATE_IN)
            this.alpha = alphaFac;
        }
        if(this.alignToCamera) {
            this.x = $engine.getCamera().getX()+this.originalX;
            this.y = $engine.getCamera().getY()+this.originalY;
        }
        this.getSprite().tint = this.lifeTimer % 16 < 8 ? 0x555555 : 0xffffff;
        this.lifeTimer++;
    }
}

class FinalMinigamePlayer extends EngineInstance {
    onCreate() {
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/4;

        this.weapon = new FinalMinigameWeapon();

        this.dx = 0;
        this.dy = 0;

        this.friction = 0;

        this.maxVelocity = 9;

        this.stoppingFactor = 0.65;

        this.accel = 0.75;

        this.timeSinceLeft=0;
        this.timeSinceRight=0;
        this.timeSinceUp=0;
        this.timeSinceDown=0;

        this.lastInputx = 0;
        this.lastInputy = 0;

        this.dashTimer = 0;
        this.dashTime = 6;
        this.dashResetTimer = 0;
        this.dashResetTime = 30;
        this.dashDirection = 0;
        this.dashFactor = 3;
        this.dashSpeedX=0;
        this.dashSpeedY=0;
        this.dashTargetX = -1;
        this.dashTargetY = -1;

        this.animationFly = $engine.getAnimation("eson_fly");
        this.animationDodge = $engine.getAnimation("eson_dodge");
        this.setSprite(new PIXI.extras.AnimatedSprite(this.animationFly))
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-10,-10,10,10)));
        this.sprite = this.getSprite(); // alias
        this.sprite.animationSpeed = 0.1;
        this.sprite.anchor.y = 0.5;

        this.hitboxSprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("eson_hitbox")),true);
        this.hitboxSprite.filters = [FinalMinigameController.getInstance().sharedHealthGlowFilter];

        this.defaultXScale = 1;
        this.defaultYScale = 1;

        this.xScale = 1;
        this.yScale = 1;

        this.startBoost = 4.5;

        this.turnTime = 4;

        this.currentFlip = 1;

        this.iFrames = 0;

        this.timeSinceLastDamage = 99999;
        this.damageTintTime = 20;

        this.invincibilityFilter = new PIXI.filters.OutlineFilter();
        this.invincibilityFilter.thickness  = 0;
        this.invincibilityFilter.color = 0xffffff;
        this.sprite.filters = [this.invincibilityFilter];

        this.hasControl = true;
        this.canFire = true;
        this.clampY = true;
    }

    setControlable(bool) {
        this.hasControl=bool;
        if(!bool) {
            this.dashTimer=0;
            this.dx=0;
            this.dy=0;
        }
    }

    setCanFire(bool) {
        this.canFire=bool;
    }

    clampBottom(bool) {
        this.clampY =bool;
    }

    step() {
        this.timeSinceLogic();
        this.move();
        this.animationLogic();
        this.weaponLogic();
        this.spriteEffectLogic();
        this.timerLogic();
        this.depth = 10;
    }

    timerLogic() {
        this.iFrames--;
        this.timeSinceLastDamage++;
    }

    spriteEffectLogic() {
        if(this.iFrames>0) {
            var check = this.iFrames %12 < 6
            var fac = EngineUtils.interpolate(this.iFrames/30,0,1,EngineUtils.INTERPOLATE_OUT);
            this.alpha =  (check ? 0.9 : 1)*(1-fac+9)/10;
            this.invincibilityFilter.thickness = (check ? 2 : 4)*fac;
        } else if (this.iFrames===0){
            this.alpha = 1;
            this.invincibilityFilter.thickness=0;
        }

        if(this.timeSinceLastDamage<=this.damageTintTime) {
            var fac = EngineUtils.interpolate(this.timeSinceLastDamage/this.damageTintTime,0,1,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            var r=0xff, g = 0xff, b = 0xff;
            g = Math.floor(g*fac);
            b = Math.floor(b*fac);
            this.sprite.tint = (r<<16) | (g<<8) | b
        }
    }

    weaponLogic() {
        var mx = IN.getMouseX();
        var my = IN.getMouseY();
        this.weapon.setAimLocaton(mx,my)

        var xx = this.x;
        var yy = this.y;

        var omx = mx-this.x;
        var omy = my-this.y;

        omx = EngineUtils.clamp(omx/8,-32,32);
        omy = EngineUtils.clamp(omy/8,-32,32);


        if(Math.abs(this.dx)>2) {
            xx+=(this.dx+Math.sign(this.dx)*8)*10
        } else {
            xx+=64*this.currentFlip;
        }
        if(Math.abs(this.dy)>1)
            yy+=(this.dy+Math.sign(this.dy)*5)*10
        this.weapon.setTargetLocation(xx+omx,yy+omy);

        if(IN.mouseCheck(0) && this.hasControl && this.canFire) {
            this.weapon.fire();
        }
    }

    timeSinceLogic() {
        this.timeSinceLeft++;
        this.timeSinceRight++;
        this.timeSinceUp++;
        this.timeSinceDown++;
        if(IN.keyCheckPressed("RPGright"))
            this.timeSinceRight=0;
        if(IN.keyCheckPressed("RPGleft"))
            this.timeSinceLeft=0;
        if(IN.keyCheckPressed("RPGup"))
            this.timeSinceUp=0;
        if(IN.keyCheckPressed("RPGdown"))
            this.timeSinceDown=0;
    }

    animationLogic() {
        if(this.isDashing() && this.dx!==0) {
            this.xScale = Math.sign(this.dx) * this.defaultXScale;
        }
        this.sprite.update(1);
        if(this.lastInputx!==0) {
            this.xScale = this.lastInputx * this.defaultXScale;
            this.currentFlip=this.lastInputx;
        }
        this.sprite.skew.x = -this.dx/64
    }

    move() {
        if(!this.hasControl)
            return;
        this.dashLogic();
        var dx = IN.keyCheck("RPGright")-IN.keyCheck("RPGleft");
        var dy = IN.keyCheck("RPGdown")-IN.keyCheck("RPGup");

        this.lastInputx = dx;
        this.lastInputy = dy;

        if(dx!== 0 && dy!==0) {
            dx*=0.7071;
            dy*=0.7071;
        }

        dx*=this.accel;
        dy*=this.accel;
        if(!this.isDashing()) {
            this.constrainSpeed();
            this.acceleration(dx,dy);
        } else {
            this.dx = this.dashSpeedX;
            this.dy = this.dashSpeedY;
        }

        this.x += this.dx;
        this.y += this.dy;

        if(this.isDashing()) {
            if(V2D.calcMag(this.x-this.dashTargetX,this.y-this.dashTargetY)<16)
                this.dashTimer=0;
        }

        if(this.isDashEnd()) {
            this.dx/=4;
            this.dy/=4;
        }

        this.constrainLocation();
    }

    dashLogic() {
        this.dashResetTimer--;
        this.dashTimer--;
        if((IN.mouseCheck(2) || IN.mouseCheck(1)) && this.dashResetTimer<0) { // right click or MMB
            this.dashTimer=this.dashTime;
            this.dashDirection = V2D.calcDir(IN.getMouseX()-this.x,IN.getMouseY()-this.y);
            this.dashSpeedX = V2D.lengthDirX(this.dashDirection,this.maxVelocity*this.dashFactor);
            this.dashSpeedY = -V2D.lengthDirY(this.dashDirection,this.maxVelocity*this.dashFactor);
            this.dashResetTimer=this.dashResetTime;
            this.iFrames = this.dashTime + 10;
            EngineUtils.setAnimation(this.sprite, this.animationDodge)
            this.sprite.animationSpeed = this.animationDodge.length/(this.dashTime + 10);
            $engine.audioPlaySound("final_eson_dash")
            this.dashTargetX = IN.getMouseX();
            this.dashTargetY = IN.getMouseY();
        }
        if(this.dashTimer===-10) {
            EngineUtils.setAnimation(this.sprite, this.animationFly)
            this.sprite.animationSpeed = 0.1;
        }
    }

    isDashing() {
        return this.dashTimer>=0;
    }

    isDashEnd() {
        return this.dashTimer===0;
    }

    calcSpeed() {
        return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    }

    calcAngle() {
        return V2D.calcDir(this.dx, this.dy);
    }

    constrainSpeed() {
        var spd = this.calcSpeed();
        if(spd > this.maxVelocity) {
            var diff = spd - this.maxVelocity;
            if(diff>this.accel*1.5)
                diff/=4;
            spd-=diff;
            var angle = this.calcAngle();
            this.dx = Math.cos(angle) * spd;
            this.dy = Math.sin(angle) * spd;
        }
    }

    constrainLocation() {
        var controller = FinalMinigameController.getInstance();
        var ox = controller.baseCameraX;
        var oy = controller.getCameraTop();
        var scrollFactor = 32;
        if(this.x < ox - scrollFactor && this.dx<0) {
            this.x = ox - scrollFactor;
            this.dx = 0;
        }
        if(this.x >$engine.getWindowSizeX() + ox + scrollFactor && this.dx>0) {
            this.x = $engine.getWindowSizeX()+ox+scrollFactor;
            this.dx = 0;
        }
        if(this.y < oy && this.dy<0) {
            this.y = oy;
            this.dy = 0;
        }
        if(this.y > $engine.getWindowSizeY()+oy) {
            this.dy = 0;
            if(this.clampY) {
                this.y = $engine.getWindowSizeY()+oy;
            } else {
                this.hurt(1,180, true);
                if(controller.isAlive()) {
                    this.resetLocation();
                }
            }
            
        }
    }

    resetLocation() {
        var oy = FinalMinigameController.getInstance().getCameraTop();
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()*3/4;
        this.y+=oy;
    }

    hurt(dmg,iFrames = 120, force = false) {
        if(!this.canBeHurt() && !force)
            return;
        this.iFrames = iFrames
        FinalMinigameController.getInstance().takeDamage(dmg);
        this.timeSinceLastDamage=0;
        new BulletClearer(this.x,this.y,425);
        if(FinalMinigameController.getInstance().isAlive())
            $engine.audioPlaySound("final_eson_hit")
        
    }

    canBeHurt() {
        return this.iFrames<=0
    }

    /**
     * Applies the acceleration
     * @param {Number} intendedDx The intended dx the player wishes to apply
     * @param {Number} intendedDy The intendex dy the player wishes to apply
     */
    acceleration(intendedDx,intendedDy) { // dx and dy are intended directions

        // Every sigle time I make move code I re-write it becuase I don't like how the last one felt.
        // at least they generally always feel better than the last.

        var signDxPlayer = Math.sign(this.dx)
        var signDyPlayer = Math.sign(this.dy)
        var signDxIntended = Math.sign(intendedDx)
        var signDyIntended = Math.sign(intendedDy)
        var timeX = this.getTimeSinceDirection(true,signDxIntended);
        var timeY = this.getTimeSinceDirection(false,signDyIntended);

        var dist = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        var xFactor = Math.abs(this.dx)/dist;
        var yFactor = Math.abs(this.dy)/dist; // how much y accounts for the current movement
        if(intendedDx===0) { // no hold.
            this.dx -= signDxPlayer * this.stoppingFactor * xFactor; // standard slowdown
            if(signDxPlayer!==Math.sign(this.dx)) // completely stopped
                this.dx =0;

        } else if(signDxIntended !== signDxPlayer && signDxPlayer!==0) { // opposite dir.
            if(timeX<this.turnTime) { // fade in effectiveness of move
                intendedDx/=(this.turnTime-timeX)
            }
            this.dx += intendedDx;
            if (timeX===this.turnTime) { // immediately stop after turnTime
                this.dx=0;
            }
        } else { // same sign
            if(this.dx===0)
                intendedDx*=this.startBoost;
            this.dx += intendedDx;
        }
        // duplicate of above, but for y.
        if(intendedDy===0) { // no hold.
            this.dy -= signDyPlayer * this.stoppingFactor * yFactor; // standard slowdown
            if(signDyPlayer!==Math.sign(this.dy)) // completely stopped
                this.dy =0;

        } else if(signDyIntended !== signDyPlayer && signDyPlayer!==0) { // opposite dir.
            if(timeY<this.turnTime) { // fade in effectiveness of move
                intendedDy/=(this.turnTime-timeY)
            }
            this.dy += intendedDy;
            if (timeY===this.turnTime) { // immediately stop after turnTime
                this.dy=0;
            }
        } else { // same sign, just accelerate
            if(this.dy===0)
                intendedDy*=this.startBoost;
            this.dy += intendedDy;
        }
    }

    getTimeSinceDirection(isDx, dir) {
        if(dir===0)
            return 99999;
        if(isDx) {
            if(dir === 1)
                return this.timeSinceRight;
            return this.timeSinceLeft
        } else if(dir === 1) {
            return this.timeSinceDown;
        } else {
            return this.timeSinceUp;
        }
    }

}

class FinalMinigameWeapon extends EngineInstance {
    onCreate() {
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/2;
        this.spriteLoaded = $engine.getTexture("final_minigame_weapon_0");
        this.spriteUnloaded = $engine.getTexture("final_minigame_weapon_1");
        this.setSprite(new PIXI.Sprite(this.spriteLoaded))
        this.xScale=1;
        this.yScale=1;

        this.fireDelay = 30;
        this.fireTimer = 0;

        this.targetX = this.x;
        this.targetY = this.y;

        this.hasPause = true;
        this.pauseTimer=0;
        this.pauseTime = 10;

        this.cameraX=0;
        this.cameraY=0;

        this.aimX = this.x;
        this.aimY = this.y;

        this.shouldPauseOnHit = true;

        this.fireAnimationTimer=999;

        this.shotAnimationContainer = $engine.createRenderable(this,new PIXI.Sprite(PIXI.Texture.empty),false)
        this.shotAnimationContainer.anchor.y = 0.5;
        this.shotGraphics0 = $engine.createManagedRenderable(this, new PIXI.Graphics());
        this.shotGraphics1 = $engine.createManagedRenderable(this, new PIXI.Graphics());
        this.shotGraphics2 = $engine.createManagedRenderable(this, new PIXI.Graphics());
        this.shotRope = this.createShotRope();
        this.shotAnimationContainer.addChild(this.shotGraphics0); // main line
        this.shotAnimationContainer.addChild(this.shotGraphics1); // brick layer effect
        this.shotAnimationContainer.addChild(this.shotGraphics2); // dots
        this.shotAnimationContainer.addChild(this.shotRope); // cool wobbly
        this.shotAnimationContainer.alpha = 0;

        this.setupGraphics();
    }

    setShouldPauseOnHit(bool) {
        this.shouldPauseOnHit = bool;
    }

    createShotRope() {
        var tex = $engine.getTexture("white_line")
        tex.baseTexture.wrapMode = PIXI.WRAP_MODES.MIRRORED_REPEAT;

        var numPoints = 120;

        var points = [];
        var diff = 1024/numPoints;
        for(var i =0;i<numPoints;i++) {
            var point = new PIXI.Point(diff*i,Math.sin(i/4)*24)
            points.push(point);
        }
        var rope = $engine.createManagedRenderable(this,new PIXI.mesh.Rope(tex,points));
        return rope;
    }

    setupGraphics() {
        this.shotGraphics0.lineStyle(4,0xffffff);
        this.shotGraphics0.moveTo(0,0).lineTo(1024,0);

        this.shotGraphicsPoints = [];
        for(var i=0;i<300;i++) {
            var rx = EngineUtils.random(1024);
            var rs = EngineUtils.randomRange(1,3);
            var ry = EngineUtils.randomRange(-4,4);

            // textures are incredibly fast to render compared to circles.
            // performance could be improved further using a particle plane...
            const circle = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("white_circle")));
            circle.scale.set(1/64*rs);
            circle.x = rx;
            this.shotGraphics2.addChild(circle);
            this.shotGraphicsPoints.push( {
                y:ry,
                sprite:circle,
            })
        }
    }

    step() {
        if(this.hasPause) {
            if(--this.pauseTimer<0) {
                this.hasPause=false;
                $engine.unpauseGameSpecial();
            } else {
                $engine.getCamera().setLocation(this.cameraX+EngineUtils.random(-16+this.pauseTimer,16-this.pauseTimer),
                                                this.cameraY+EngineUtils.random(-16+this.pauseTimer,16-this.pauseTimer))
                return;
            }
            
        }
        this.fireTimer--;
        
        this.angle = V2D.calcDir(this.aimX-this.x,this.aimY-this.y);
        var dx = this.targetX-this.x;
        var dy = this.targetY-this.y;
        this.x+=dx/12;
        this.y+=dy/12;

        this.fireAnimation();

        if(this.fireTimer===0) {
            this.getSprite().texture = this.spriteLoaded;
        }
    }

    fireAnimation() {

        if(this.fireAnimationTimer>40)
            return;

        
        // brick effect
        this.shotGraphics1.clear();
        var fac = EngineUtils.interpolate(this.fireAnimationTimer/20,1,0,EngineUtils.INTERPOLATE_OUT_QUAD);
        var invFac = 1-fac;
        var spread = 64 * invFac
        this.shotGraphics1.beginFill(0xffffff,fac/3);
        this.shotGraphics1.drawRect(0,-spread/2 ,1024,spread)
        this.shotGraphics1.drawRect(0,-spread/4 ,1024,spread/2)
        this.shotGraphics1.endFill();

        // dots
        var scaleFac = EngineUtils.interpolate(this.fireAnimationTimer/20,0,100,EngineUtils.INTERPOLATE_OUT_QUAD);
        var alphaFac = EngineUtils.interpolate(this.fireAnimationTimer/20,1,0,EngineUtils.INTERPOLATE_IN);
        this.shotGraphics2.clear();
        this.shotGraphics2.beginFill(0xffffff);
        for(const point of this.shotGraphicsPoints) {
            point.sprite.y = point.y*scaleFac
        }
        this.shotGraphics2.alpha = alphaFac;


        // wobbly rope
        var timerOffset = $engine.getGameTimer()/1.25; // scroll speed
        for(var i =0;i<this.shotRope.points.length;i++) {
            this.shotRope.points[i].y = Math.sin(timerOffset-i/2)*24 * EngineUtils.interpolate(i/120,2,0,EngineUtils.INTERPOLATE_OUT_QUAD)
        }
        this.shotRope.scale.y = EngineUtils.interpolate(this.fireAnimationTimer/20,1,0,EngineUtils.INTERPOLATE_IN)

        // main
        if(++this.fireAnimationTimer>20) {
            var fac = EngineUtils.interpolate((this.fireAnimationTimer-20)/20,1,0,EngineUtils.INTERPOLATE_OUT)
            this.shotAnimationContainer.alpha = fac
            this.shotAnimationContainer.scale.y = fac
        }
    }

    setTargetLocation(x,y) {
        this.targetX = x;
        this.targetY = y;
    }

    setAimLocaton(x,y) {
        this.aimX = x;
        this.aimY = y;
    }

    /**
     * Creates the end point of where the player is aiming, extended to fit the whole room.
     * @returns The end point of the line
     */
    getAimLine() {
        var angle = this.angle;
        var ox = V2D.lengthDirX(angle,2048);
        var oy = -V2D.lengthDirY(angle,2048);
        return new EngineLightweightPoint(this.x+ox,this.y+oy);
    }

    canFire() {
        return this.fireTimer<=0;
    }

    fire() {
        if(!this.canFire())
            return;
        this.fireTimer=this.fireDelay;
        this.fireAnimationTimer = 0;
        this.shotAnimationContainer.x = this.x + Math.cos(this.angle)*16;
        this.shotAnimationContainer.y = this.y + Math.sin(this.angle)*16;
        this.shotAnimationContainer.rotation = this.angle;
        this.shotAnimationContainer.alpha = 1;
        this.shotAnimationContainer.scale.y = 1;
        this.getSprite().texture = this.spriteUnloaded;
        FinalMinigameController.getInstance().shake(8);
        this.fireAttack();
        var snd = $engine.audioPlaySound("final_eson_fire")
        snd.speed = EngineUtils.randomRange(0.75,1.5)
    }

    fireAttack() {
        var start = new EngineLightweightPoint(this.x,this.y);
        var end = this.getAimLine();
        var instances = IM.instanceCollisionLineList(start.x,start.y,end.x,end.y,Shootable)

        for(const inst of instances) {
            if(inst.isAlive && inst.canBeHurt()) {
                if(this.shouldPauseOnHit) {
                    $engine.pauseGameSpecial(this);
                    this.hasPause = true;
                    this.pauseTimer = this.pauseTime;
                    this.cameraX = $engine.getCamera().getX();
                    this.cameraY = $engine.getCamera().getY();
                }
                inst.onHit();
            }
        }

        var hitBoss = IM.instanceCollisionLine(start.x,start.y,end.x,end.y,FinalMinigameController);
        if(hitBoss) {
            FinalMinigameController.getInstance().hitBoss();
        }
    }
}

class FinalMinigameCloudParticle extends EngineInstance {

    onCreate(x,y) {
        this.x = x;
        this.y = y;
        this.dx = EngineUtils.randomRange(-6,6);
        this.dy = EngineUtils.randomRange(-6,6);

        this.drag = 0.95;

        this.dz = EngineUtils.randomRange(-0.04,0.04);

        this.lifeTime = EngineUtils.irandomRange(48,60);
        this.lifeTimer=0;

        this.setSprite(new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("green_cloud")));
        this.xScale = EngineUtils.randomRange(0.7,1);
        this.yScale = EngineUtils.randomRange(0.7,1);

        this.alpha = 0.8;
    }

    step() {

        this.x+=this.dx;
        this.y+=this.dy;
        this.angle +=this.dz;

        this.dx*=this.drag;
        this.dy*=this.drag;
        this.dz*=this.drag;

        var fac = EngineUtils.interpolate(this.lifeTimer/this.lifeTime,0.8,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
        this.alpha = fac;

        if(this.lifeTimer > this.lifeTime) {
            this.destroy();
        }
        this.lifeTimer++;
    }
}

class FinalMinigameTarget extends Shootable {
    onCreate(x,y,speed=2) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.lifeTimer = 0;
        this.lifeTime = 30;
        this.isAlive = true;


        this.targetX = this.x;
        this.targetY = this.y;

        this.setSprite(new PIXI.Sprite($engine.getTexture("final_minigame_target")));

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-32,-32,32,32)))
    }

    step() {
        this.targetY+=this.speed;

        this.y=this.targetY;
        this.x=this.targetX;

        if(this.y>$engine.getCamera().getY()+$engine.getWindowSizeY()+128) {
            this.destroy();
        }

        if(!this.isAlive) {
            var fac = EngineUtils.interpolate(++this.lifeTimer/this.lifeTime,1,0,EngineUtils.INTERPOLATE_IN_BACK);
            this.yScale = fac;
            if(this.lifeTimer>=this.lifeTime) {
                this.destroy();
            }

            if(this.lifeTimer > 8)
                this.getSprite().filters = [];
            var fac2 = EngineUtils.interpolate(this.lifeTimer/this.lifeTime,0,24,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            this.x+=EngineUtils.randomRange(-fac2,fac2);
            this.y+=EngineUtils.randomRange(-fac2,fac2);
        }
    }
}

class MoveLinearBullet extends EngineInstance {

    onCreate(x,y,direction, speed, makeNoise = true, anim = "bullet_animation") {
        this.x = x;
        this.y = y;
        this.direction=direction;
        this.speed=speed;

        this.randomEnabled=true;

        var tex = $engine.getAnimation(anim)
        this.setSprite(new PIXI.extras.AnimatedSprite(tex));
        this.animation = this.getSprite();
        this.animation.animationSpeed = 0.05+EngineUtils.random(0.1);
        this.animation._currentTime = EngineUtils.irandom(tex.length-1)

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-12,-8,12,16)))

        this.dx = Math.cos(direction)*speed;
        this.dy = -Math.sin(direction)*speed;

        this.targetX = this.x;
        this.targetY = this.y;

        this.randOffsetX = EngineUtils.random(240);
        this.randFactorX = EngineUtils.randomRange(1,8);
        this.randPeriodX = EngineUtils.randomRange(8,48)

        this.randOffsetY = EngineUtils.random(240);
        this.randFactorY = EngineUtils.randomRange(1,8);
        this.randPeriodY = EngineUtils.randomRange(8,48)

        if(makeNoise) {
            FinalMinigameController.getInstance().playBulletSound();
        }
    }

    disableRandom() {
        this.randomEnabled = false;
    }

    step() {

        this.targetX += this.dx;
        this.targetY += this.dy;

        if(this.randomEnabled) {
            this.x = this.targetX + Math.cos(this.randOffsetX+$engine.getGameTimer()/this.randPeriodX)*this.randFactorX
            this.y = this.targetY + Math.cos(this.randOffsetY+$engine.getGameTimer()/this.randPeriodY)*this.randFactorY
        } else {
            this.x = this.targetX
            this.y = this.targetY
        }

        var inst = IM.instancePlace(this,this.x,this.y,FinalMinigamePlayer);
        if(inst && inst.canBeHurt()) {
            inst.hurt(1);
            this.destroy();
        }

        if(!this.inBounds())
            this.destroy();
        this.animation.update(1);

        this.depth = -1;
    }

    inBounds() { // does not work for bullets that go above the screen...
        var off = $engine.getCamera().getY();
        return this.targetX > -128 && this.targetX < $engine.getWindowSizeX()+128 && this.targetY < $engine.getWindowSizeY()+128+off;
    }

    onDestroy() {
        if(!this.inBounds())
            return;
        var part = new AnimatedParticle($engine.getAnimation("bullet_disappear"),0.5);
        part.x = this.x;
        part.y = this.y;
        part.depth = this.depth
    }
}

class MoveLinearBouncingBullet extends MoveLinearBullet {
    step() {
        super.step();
        if(this.targetX < 0 || this.targetX > $engine.getWindowSizeX())
            this.dx=-this.dx;
    }
}

class HomingBullet extends Shootable {
    onCreate(x,y,speed, maxAngleChange = 0.025) {
        super.onCreate();
        this.x = x;
        this.y = y;
        this.speed = speed;

        this.maxAngleChange = maxAngleChange;

        this.lifetime = 600;

        var tex = $engine.getAnimation("homing_bullet_animation")
        this.setSprite(new PIXI.extras.AnimatedSprite(tex));
        this.animation = this.getSprite();
        this.animation.animationSpeed = 0.05+EngineUtils.random(0.1);
        this.animation._currentTime = EngineUtils.irandom(tex.length-1)

        this.getSprite().scale.set(2);

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-36,-24,24,24)))
        this.target = IM.find(FinalMinigamePlayer);
        this.angle = V2D.calcDir(this.target.x-this.x,this.target.y-this.y)
    }

    step() {
        super.step();
        var angleDiff = V2D.angleDiff(this.angle,V2D.calcDir(this.target.x-this.x,this.target.y-this.y));
        var dz = EngineUtils.clamp(angleDiff,-this.maxAngleChange,this.maxAngleChange);
        this.angle+=dz;

        var dx = V2D.lengthDirX(this.angle,this.speed);
        var dy = -V2D.lengthDirY(this.angle,this.speed);

        this.x+=dx;
        this.y+=dy;

        if(this.isAlive) {
            var inst = IM.instancePlace(this,this.x,this.y,FinalMinigamePlayer);
            if(inst && inst.canBeHurt()) {
                inst.hurt(1);
                this.destroy();
            }
        }

        if(--this.lifetime<0) {
            this.alpha = 1+(this.lifetime/20);
            if(this.lifetime<-20)
                this.destroy();
        }

        this.animation.update(1);
    }
}

class DelayedDamageZone extends EngineInstance {
    onCreate(x,y,size,delay=60) {
        this.x = x;
        this.y = y;
        this.xStart = x;
        this.yStart = y;
        this.size = size;
        this.delay = delay;
        this.startDelay = delay;
        this.graphics = $engine.createRenderable(this, new PIXI.Graphics());
        this.target = IM.find(FinalMinigamePlayer)
        this.depth = 99999;
        this.setSprite(new PIXI.Sprite($engine.getTexture("damage_zone")))
        var scale = size/125;
        this.xScale=scale;
        this.yScale=scale;
    }

    step() {
        if(--this.delay===0) {
            FinalMinigameController.getInstance().shake(this.size/8);
            var dist = V2D.calcMag(this.x-this.target.x,this.y-this.target.y);
            if(dist < this.size)
                this.target.hurt(1);
            var volume = EngineUtils.clamp(this.size / 100,0,1);
            $engine.audioPlaySound("final_zone_attack",volume)
        }

        if(this.delay<-20) {
            this.destroy();
        }
    }

    preDraw() {
        if(this.delay<30) {
            var fac = EngineUtils.interpolate(this.delay/30,30,0,EngineUtils.INTERPOLATE_OUT);
            this.x = this.xStart + EngineUtils.randomRange(-fac/6,fac/6)
            this.y = this.yStart + EngineUtils.randomRange(-fac/6,fac/6)
            this.angle = EngineUtils.randomRange(-fac/30,fac/30)
        } else {
            this.x = this.xStart + EngineUtils.randomRange(-3,3)
            this.y = this.yStart + EngineUtils.randomRange(-3,3)
            this.angle = EngineUtils.randomRange(-0.05,0.05)
        }
    }

    draw(gui,camera) {
        this.graphics.clear();
        if(this.delay>0) {
            this.graphics.lineStyle(2,0xbed07b);
            var alpha = EngineUtils.interpolate(this.delay/this.startDelay,1,0,EngineUtils.INTERPOLATE_IN);
            this.graphics.alpha = alpha;
            this.alpha = alpha;
            var fac = EngineUtils.interpolate(this.delay/this.startDelay,1,5,EngineUtils.INTERPOLATE_IN);
            this.graphics.drawCircle(this.x,this.y,fac*this.size)
            
            if(this.delay<12) {
                var fac2 = EngineUtils.interpolate(this.delay/12,0.25,0,EngineUtils.INTERPOLATE_OUT);
                this.graphics.beginFill(0xbed07b,fac2);
                this.graphics.drawCircle(this.x,this.y,fac*this.size)
                this.graphics.endFill();
            }

        } else {
            var alpha = EngineUtils.interpolate(-(this.delay)/20,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            var fac = EngineUtils.interpolate(-this.delay/20,1,1.25,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.graphics.lineStyle(2,0xbed07b);
            this.graphics.drawCircle(this.x,this.y,fac*this.size)
            this.graphics.alpha = alpha;
            this.alpha = alpha;
            this.graphics.beginFill(0xbed07b);
            this.graphics.drawCircle(this.x,this.y,fac*this.size)
            this.graphics.endFill();
        }
    }
}