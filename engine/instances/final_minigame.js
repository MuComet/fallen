class FinalMinigameController extends EngineInstance { // NOT A MINIGAMECONTROLLER!
    onEngineCreate() {
        FinalMinigameController.instance = this;
        this.phase = -1;
        this.survivalTime = 0;
        this.minigameTimer = new MinigameTimer(60*60);
        this.minigameTimer.alpha = 0;
        this.zoneLocation = 0;

        this.minigameTimer.pauseTimer();

        this.cameraScrollSpeedX = 0;
        this.cameraScrollSpeedY = -1;

        this.sharedTimer = 0;
        this.sharedPhaseTimer = 0;

        this.player = new FinalMingiamePlayer();

        this.nextPhase();

        this.baseCameraX = 0;
        this.baseCameraY = 0;

        this.cameraShakeTimer = 0;

        $engine.startFadeIn();

        this.background = $engine.createRenderable(this,new PIXI.extras.TilingSprite($engine.getTexture("wall_tile"),$engine.getWindowSizeX(),$engine.getWindowSizeY()));
        this.background.anchor.x = 0;

        this.depth = 999999; // always at the back
    }

    step() {
        switch(this.phase) {
            case(0):
                this.phaseZero(); // introduction
            break;
            case(1):
                this.phaseOne(); // easy dodging
            break;
            case(2):
                this.phaseTwo();
            break;
            case(3):
                this.phaseThree();
            break;
        }
        this.handleCamera();
        this.sharedTimer++;
        this.sharedPhaseTimer++;
    }

    onSwitchPhase(newPhase) {
        this.sharedPhaseTimer=0;
        switch(newPhase) {
            case(0):
                
            break;
            case(1):
                
            break;
            case(2):
                
            break;
            case(3):
                
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
        $engine.getCamera().setLocation(this.baseCameraX,this.baseCameraY);
        // don't use engine background to allow for advanced effects...
        this.background.x = this.baseCameraX;
        this.background.y = this.baseCameraY;
        this.background.tilePosition.x = -this.baseCameraX
        this.background.tilePosition.y = -this.baseCameraY
    }

    phaseZero() {
        if(this.sharedPhaseTimer < 120) {

        }
        
    }

    shakeCamera(time) {

    }

    spawnZones() {

    }

    static getInstance() {
        return FinalMinigameController.instance
    }
}
FinalMinigameController.instance = undefined;

class FinalMingiamePlayer extends EngineInstance {
    onCreate() {
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/2;

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

        this.animationWalk = $engine.getAnimation("eson_walk");
        this.animationStand = [$engine.getTexture("eson_walk_0")];
        this.setSprite($engine.createRenderable(this,new PIXI.extras.AnimatedSprite(this.animationWalk)))
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-64,-364,64,-128)));
        this.sprite = this.getSprite(); // alias
        this.sprite.animationSpeed = 0.1;

        this.defaultXScale = 0.25;
        this.defaultYScale = 0.25;

        this.xScale = 0.25;
        this.yScale = 0.25;

        this.startBoost = 4.5;

        this.turnTime = 4;

        this.currentFlip = 1;

        this.iFrames = 0;

        this.timeSinceLastDamange = 99999;
        this.damageTintTime = 20;

        this.invincibilityFilter = new PIXI.filters.OutlineFilter();
        this.invincibilityFilter.thickness  = 0;
        this.invincibilityFilter.color = 0xffffff;
        this.sprite.filters = [this.invincibilityFilter];
    }

    step() {
        this.timeSinceLogic();
        this.move();
        this.animationLogic();
        this.weaponLogic();
        this.spriteEffectLogic();
        this.timerLogic();
    }

    timerLogic() {
        this.iFrames--;
        this.timeSinceLastDamange++;
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

        if(this.timeSinceLastDamange<=this.damageTintTime) {
            var fac = EngineUtils.interpolate(this.timeSinceLastDamange/this.damageTintTime,0,1,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
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
        var yy = this.y-128;

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
        if(this.lastInputx===0 && this.lastInputy===0) {
            this.setAnimation(this.animationStand)
            return;
        } else {
            this.setAnimation(this.animationWalk)
        }
        if(this.lastInputx!==0) {
            this.xScale = this.lastInputx * this.defaultXScale;
            this.currentFlip=this.lastInputx;
        }
        this.sprite.update(1);
    }

    move() {
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

        this.constrainSpeed();
        this.acceleration(dx,dy);

        this.x += this.dx;
        this.y += this.dy;

        this.constrainLocation();
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
            spd = this.maxVelocity;
            var angle = this.calcAngle();
            this.dx = Math.cos(angle) * spd;
            this.dy = Math.sin(angle) * spd;
        }
    }

    constrainLocation() {
        var controller = FinalMinigameController.getInstance();
        var ox = controller.baseCameraX;
        var oy = controller.baseCameraY;
        var playerHeight = this.sprite.height;
        if(this.x < ox && this.dx<0) {
            this.x = ox;
            this.dx = 0;
        }
        if(this.x >$engine.getWindowSizeX() +ox && this.dx>0) {
            this.x = $engine.getWindowSizeX()+ox;
            this.dx = 0;
        }
        if(this.y < oy && this.dy<0) {
            this.y = oy;
            this.dy = 0;
        }
        if(this.y > $engine.getWindowSizeY()+oy+playerHeight) {
            this.dy = 0;
            this.hurt(1,60, true);
            this.x = $engine.getWindowSizeX()/2;
            this.y = $engine.getWindowSizeY()*3/4;
            this.y+=oy;
        }
    }

    hurt(dmg,iFrames = 60, force = false) {
        if(this.iFrames>0 && !force)
            return;
        this.iFrames = iFrames
        this.health-=dmg;
        this.timeSinceLastDamange=0;
        this.checkDeath();
        // apply filters or something...
    }

    checkDeath() {
        if(this.health<0) {
            console.error("darn you died.")
        }
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
        if(intendedDx===0) { // no hold.
            this.dx -= signDxPlayer * this.stoppingFactor; // standard slowdown
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
            this.dy -= signDyPlayer * this.stoppingFactor; // standard slowdown
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

    setAnimation(anim) {
        if(this.sprite.textures === anim)
            return;
        this.sprite.textures = anim;
        this.sprite._currentTime = 0;
    }

}

class FinalMinigameWeapon extends EngineInstance {
    onCreate() {
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/2;
        this.setSprite($engine.createRenderable(this,new PIXI.Sprite($engine.getTexture("final_minigame_weapon"))))
        this.xScale=0.5;
        this.yScale=0.5;

        this.fireDelay = 30;
        this.fireTimer = 0;

        this.targetX = this.x;
        this.targetY = this.y;

        this.aimX = this.x;
        this.aimY = this.x;
    }

    step() {
        this.fireTimer--;

        
        this.angle = V2D.calcDir(this.aimX-this.x,this.aimY-this.y);
        var dx = this.targetX-this.x;
        var dy = this.targetY-this.y;
        this.x+=dx/12;
        this.y+=dy/12;
    }

    setTargetLocation(x,y) {
        this.targetX = x;
        this.targetY = y;
    }

    setAimLocaton(x,y) {
        this.aimX = x;
        this.aimY = y;
    }

    canFire() {

    }

    fire() {
        this.fireTimer=this.fireDelay;
    }
}

class FinalMinigameBullet extends EngineInstance { // superclass of anything that can hit you

    onCreate(damage=1, canBeKilled=false) {
        this.damage = damage;
        this.canBeKilled = canBeKilled;
    }
}

class MoveLinearBullet extends FinalMinigameBullet {

    onCreate(x,y,direction,speed, sprite = "linear_bullet") {
        this.x = x;
        this.y = y;
        this.direction=direction;
        this.speed=speed;

        this.dx = Math.cos(direction)*speed;
        this.dy = Math.sin(direction)*speed;

        this.targetX = this.x;
        this.targetY = this.y;

        this.randOffsetX = EngineUtils.random(240);
        this.randFactorX = EngineUtils.randomRange(1,8);
        this.randPeriodX = EngineUtils.randomRange(60,240)

        this.randOffsetY = EngineUtils.random(240);
        this.randFactorY = EngineUtils.randomRange(1,8);
        this.randPeriodY = EngineUtils.randomRange(60,240)
    }

    step() {
        this.targetX += this.dx;
        this.targetY += this.dy;

        this.x = this.targetX + Math.cos(this.randOffsetX+$engine.getGameTimer()/this.randPeriodX)*this.randFactorX
        this.y = this.targetY + Math.cos(this.randOffsetY+$engine.getGameTimer()/this.randPeriodY)*this.randFactorY

        if(!this.inBounds())
            this.destroy();
    }

    inBounds() {
        return this.targetX< -128 || this.targetY < -128 || this.targetX > $engine.getWindowSizeX()+128 || this.targetY > $engine.getWindowSizeY()+128;
    }

}