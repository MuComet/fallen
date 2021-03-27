class FinalMinigameController extends EngineInstance { // NOT A MINIGAMECONTROLLER!
    onEngineCreate() {
        FinalMinigameController.instance = this;
        this.phase = -1;
        this.survivalTime = 0;
        this.minigameTimer = new MinigameTimer(60*60);
        this.minigameTimer.alpha = 0;
        this.zoneLocation = 0;

        this.totalWidth = $engine.getWindowSizeX()+64;

        this.cameraLeft = -32;
        this.cameraRight = $engine.getWindowSizeX()+32;

        this.sharedGlowFilter = new PIXI.filters.GlowFilter();

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

        this.background = $engine.createRenderable(this,new PIXI.extras.TilingSprite($engine.getTexture("wall_tile"),$engine.getWindowSizeX()+128,$engine.getWindowSizeY()+128));
        this.background.x=-64;
        this.background.y=-64;
        this.background.tilePosition.x=64;
        this.background.tilePosition.y=64;
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

        var cX = this.baseCameraX+$engine.getWindowSizeX()/2;
        var cY = this.baseCameraY+$engine.getWindowSizeX()/2;

        var offX = this.player.x - cX;
        var offY = this.player.y - cY;

        var camera = $engine.getCamera();
        camera.setLocation(this.baseCameraX,this.baseCameraY);

        camera.translate(offX/8,offY/8);

        if(this.cameraShakeTimer>0) {
            var rx = EngineUtils.randomRange(-this.cameraShakeTimer/2,this.cameraShakeTimer/2);
            var ry = EngineUtils.randomRange(-this.cameraShakeTimer/2,this.cameraShakeTimer/2);
            camera.translate(rx,ry)
            this.cameraShakeTimer--;
        }

        // don't use engine background to allow for advanced effects...
        this.background.x = this.baseCameraX-64;
        this.background.y = this.baseCameraY-64;
        this.background.tilePosition.x = -this.baseCameraX
        this.background.tilePosition.y = -this.baseCameraY
    }

    phaseZero() {
        if(this.sharedPhaseTimer < 120) {

        }

        if(this.sharedPhaseTimer%450===0) {
            new FinalMinigameTarget(EngineUtils.random($engine.getWindowSizeX()),$engine.getCamera().getY()-64)
        }

        if(this.sharedPhaseTimer%300===0) {
            this.attackLine();
        }
        /*
        if(this.sharedPhaseTimer%600===0) {
            if(this.sharedPhaseTimer%1200===0) {
                this.attackHemi(0,this.getCameraTop(),-Math.PI/8,Math.PI/4,10,4,MoveLinearBouncingBullet)
                this.delayedAction(30,function() {
                    this.attackHemi($engine.getWindowSizeX(),this.getCameraTop(),Math.PI+Math.PI/8,Math.PI/4,10,4,MoveLinearBouncingBullet)
                });
            } else {
                this.delayedAction(30,function() {
                    this.attackHemi(0,this.getCameraTop(),-Math.PI/8,Math.PI/4,10,4,MoveLinearBouncingBullet)
                });
                this.attackHemi($engine.getWindowSizeX(),this.getCameraTop(),Math.PI+Math.PI/8,Math.PI/4,10,4,MoveLinearBouncingBullet)
                
            }
        }*/

        
        if(this.sharedPhaseTimer%1300===0) {
            
        }


        if(this.sharedPhaseTimer%1200===0) {
            this.attackLineHorizontal(1);
            this.delayedAction(180,this.attackLineHorizontal,0)
        }

        if(this.sharedPhaseTimer>1200)
            this.attackConstrainWalls();
        
        if(this.sharedPhaseTimer%750===0) {
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

    sequenceAttackWipe() {
        var fac = Math.PI/8;
        this.attackWipe(this.totalWidth/2,this.getCameraTop(),Math.PI+fac,Math.PI*2-fac,1,30,6);
        this.delayedAction(5,this.attackWipe,this.totalWidth/2,this.getCameraTop(),Math.PI+fac,Math.PI*2-fac,1,30,6)
        this.delayedAction(10,this.attackWipe,this.totalWidth/2,this.getCameraTop(),Math.PI+fac,Math.PI*2-fac,1,30,6)
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

    sequenceAttackDamageZones(size, damageZoneDelay, repeatDelay, times=1, phase = 0) {
        // delayed action recursion
        if(phase<times)
            this.delayedAction(repeatDelay,this.sequenceAttackDamageZones,size,damageZoneDelay,repeatDelay,times,phase+1);
        new DelayedDamageZone(this.player.x,this.player.y,size,damageZoneDelay);
    }

    attackConstrainWalls() {
        if(this.sharedPhaseTimer%32===0) {
            var right = this.totalWidth;
            for(var i =0;i<4;i++) {
                new MoveLinearBullet((i+1)*48-64,this.getCameraTop()-32,Math.PI/2*3,2);
                new MoveLinearBullet(right-(i+1)*48,this.getCameraTop()-32,Math.PI/2*3,2);
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

    attackLine() {
        var num = 16;
        var dx = (this.totalWidth-64)/num;
        for(var i =0;i<=num+1;i++) {
            new MoveLinearBullet(dx*i+this.cameraLeft/2,this.getCameraTop()-32,Math.PI/2*3,2)
        }
    }

    attackTunnel() {
        var off = this.getCameraTop();
        var path = 15;
        var nextLocation = 15;
        var width = 20;

        var dx = (this.totalWidth-64)/(width-1)
        var pathWidth = 4;
        var dy = -100;

        for(var i =0;i<40;i++) {
            while(path===nextLocation) {
                nextLocation= EngineUtils.irandomRange(pathWidth,width-pathWidth);
            }
            var diff = nextLocation-path;
            var signDiff = Math.sign(diff);

            path+=signDiff;
            for(var xx = 0;xx<width;xx++) {
                if(Math.abs(xx-path)<pathWidth)
                    continue;
                new MoveLinearBullet(dx+xx*dx,-64+off+i*dy,Math.PI*3/2,2);
            }
        }
    }

    /**
     * @param {Number} direction 1 for right, 0 for left
     */
    attackLineHorizontal(direction) {
        var num = 24;
        var dy = ($engine.getWindowSizeY()*2)/num;
        var yy = this.getCameraTop()-$engine.getWindowSizeY();
        var dir = direction ? 0 : Math.PI;
        var offset = direction ? -32 : this.totalWidth+32;
        for(var i =0;i<=num+1;i++) {
            new MoveLinearBullet(offset,yy+dy*i,dir,2)
        }
    }

    getCameraTop() {
        return $engine.getCamera().getY();
    }

    spawnZones() {

    }

    shake(frames=18) {
        if(this.cameraShakeTimer < 0)
            this.cameraShakeTimer=0;
        this.cameraShakeTimer+=frames;
        if(this.cameraShakeTimer>60) {
            this.cameraShakeTimer=60;
        }
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

        this.dashTimer = 0;
        this.dashTime = 6;
        this.dashResetTimer = 0;
        this.dashResetTime = 30;
        this.dashDirection = 0;
        this.dashFactor = 1.5;
        this.dashSpeedX=0;
        this.dashSpeedY=0;

        this.animationWalk = $engine.getAnimation("eson_walk");
        this.animationStand = [$engine.getTexture("eson_walk_0")];
        this.setSprite(new PIXI.extras.AnimatedSprite(this.animationWalk))
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-64,-256,64,-128)));
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

        if(IN.mouseCheck(0)) {
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
        }
    }

    isDashing() {
        return this.dashTimer>=0;
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
        var oy = controller.baseCameraY;
        var scrollFactor = 32;
        var playerHeight = this.sprite.height;
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
        if(this.y > $engine.getWindowSizeY()+oy+playerHeight) {
            this.dy = 0;
            this.hurt(1,60, true);
            this.x = $engine.getWindowSizeX()/2;
            this.y = $engine.getWindowSizeY()*3/4;
            this.y+=oy;
        }
    }

    hurt(dmg,iFrames = 60, force = false) {
        if(!this.canBeHurt() && !force)
            return;
        this.iFrames = iFrames
        this.health-=dmg;
        this.timeSinceLastDamange=0;
        this.checkDeath();
        FinalMinigameController.getInstance().shake();
    }

    canBeHurt() {
        return this.iFrames<=0
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
        this.setSprite(new PIXI.Sprite($engine.getTexture("final_minigame_weapon")))
        this.xScale=0.5;
        this.yScale=0.5;

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
        this.aimY = this.x;

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
    }

    fireAnimation() {

        if(this.fireAnimationTimer>60)
            return;

        
        // brick effect
        this.shotGraphics1.clear();
        var fac = EngineUtils.interpolate(this.fireAnimationTimer/30,1,0,EngineUtils.INTERPOLATE_OUT_QUAD);
        var invFac = 1-fac;
        var spread = 64 * invFac
        this.shotGraphics1.beginFill(0xffffff,fac/3);
        this.shotGraphics1.drawRect(0,-spread/2 ,1024,spread)
        this.shotGraphics1.drawRect(0,-spread/4 ,1024,spread/2)
        this.shotGraphics1.endFill();

        // dots
        var scaleFac = EngineUtils.interpolate(this.fireAnimationTimer/30,0,100,EngineUtils.INTERPOLATE_OUT_QUAD);
        var alphaFac = EngineUtils.interpolate(this.fireAnimationTimer/30,1,0,EngineUtils.INTERPOLATE_IN);
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
        this.shotRope.scale.y = EngineUtils.interpolate(this.fireAnimationTimer/30,1,0,EngineUtils.INTERPOLATE_IN)

        // main
        if(++this.fireAnimationTimer>30) {
            var fac = EngineUtils.interpolate((this.fireAnimationTimer-30)/30,1,0,EngineUtils.INTERPOLATE_OUT)
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
        this.shotAnimationContainer.x = this.x;
        this.shotAnimationContainer.y = this.y;
        this.shotAnimationContainer.rotation = this.angle;
        this.shotAnimationContainer.alpha = 1;
        this.shotAnimationContainer.scale.y = 1;
        FinalMinigameController.getInstance().shake(8);
        this.fireAttack();
    }

    fireAttack() {
        var start = new EngineLightweightPoint(this.x,this.y);
        var end = this.getAimLine();
        var instances = IM.instanceCollisionLineList(start.x,start.y,end.x,end.y,FinalMinigameTarget)

        for(const inst of instances) {
            if(inst.isAlive) {
                $engine.pauseGameSpecial(this);
                this.hasPause = true;
                this.pauseTimer = this.pauseTime;
                this.cameraX = $engine.getCamera().getX();
                this.cameraY = $engine.getCamera().getY();
                inst.onHit();
            }
        }
    }
}

class FinalMinigameTarget extends EngineInstance {
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

    onHit() {
       this.isAlive=false;
       this.getSprite().filters = [FinalMinigameController.getInstance().sharedGlowFilter]
    }
}

class FinalMinigameBullet extends EngineInstance { // superclass of anything that can hit you

    onCreate(damage=1, canBeKilled=false) {
        this.damage = damage;
        this.canBeKilled = canBeKilled;
    }
}

class MoveLinearBullet extends FinalMinigameBullet {

    onCreate(x,y,direction, speed, sprite = "final_minigame_bullet") {
        this.x = x;
        this.y = y;
        this.direction=direction;
        this.speed=speed;

        this.randomEnabled=true;

        this.setSprite(new PIXI.Sprite($engine.getTexture(sprite)));

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-12,-12,12,12)))

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

        var inst = IM.instancePlace(this,this.x,this.y,FinalMingiamePlayer);
        if(inst && inst.canBeHurt()) {
            inst.hurt(1);
            this.destroy();
        }

        if(!this.inBounds())
            this.destroy();
    }

    inBounds() { // does not work for bullets that go above the screen...
        var off = $engine.getCamera().getY();
        return this.targetX > -128 && this.targetX < $engine.getWindowSizeX()+128 && this.targetY < $engine.getWindowSizeY()+128+off;
    }
}

class MoveLinearBouncingBullet extends MoveLinearBullet {
    step() {
        super.step();
        if(this.targetX < 0 || this.targetX > $engine.getWindowSizeX())
            this.dx=-this.dx;
    }
}

class HomingBullet extends FinalMinigameBullet {
    onCreate(x,y,speed, maxAngleChange = 0.025) {
        this.x = x;
        this.y = y;
        this.speed = speed;

        this.maxAngleChange = maxAngleChange;

        this.lifetime = 600;

        this.setSprite(new PIXI.Sprite($engine.getTexture("final_minigame_bullet")));

        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-12,-12,12,12)))
        this.target = IM.find(FinalMingiamePlayer);
    }

    step() {
        var angleDiff = V2D.angleDiff(this.angle,V2D.calcDir(this.target.x-this.x,this.target.y-this.y));
        var dz = EngineUtils.clamp(angleDiff,-this.maxAngleChange,this.maxAngleChange);
        this.angle+=dz;

        var dx = V2D.lengthDirX(this.angle,this.speed);
        var dy = -V2D.lengthDirY(this.angle,this.speed);

        this.x+=dx;
        this.y+=dy;

        var inst = IM.instancePlace(this,this.x,this.y,FinalMingiamePlayer);
        if(inst && inst.canBeHurt()) {
            inst.hurt(1);
            this.destroy();
        }

        if(--this.lifetime<0) {
            this.destroy();
        }
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
        this.target = IM.find(FinalMingiamePlayer)
        this.depth = 1;
    }

    step() {
        if(--this.delay===0) {
            FinalMinigameController.getInstance().shake(this.size/8);
            var dist = V2D.calcMag(this.x-this.target.x,this.y-this.target.y);
            if(dist < this.size)
                this.target.hurt(1);
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
        }
    }

    draw(gui,camera) {
        this.graphics.clear();
        if(this.delay>0) {
            this.graphics.lineStyle(2,0xff0000);
            var alpha = EngineUtils.interpolate(this.delay/this.startDelay,1,0,EngineUtils.INTERPOLATE_IN);
            this.graphics.alpha = alpha;
            var fac = EngineUtils.interpolate(this.delay/this.startDelay,1,5,EngineUtils.INTERPOLATE_IN);
            this.graphics.drawCircle(this.x,this.y,fac*this.size)
            
            if(this.delay<12) {
                var fac2 = EngineUtils.interpolate(this.delay/12,0.25,0,EngineUtils.INTERPOLATE_OUT);
                this.graphics.beginFill(0xff0000,fac2);
                this.graphics.drawCircle(this.x,this.y,fac*this.size)
                this.graphics.endFill();
            }

        } else {
            var alpha = EngineUtils.interpolate(-(this.delay)/20,1,0,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            var fac = EngineUtils.interpolate(-this.delay/20,1,1.25,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.graphics.lineStyle(2,0xff0000);
            this.graphics.drawCircle(this.x,this.y,fac*this.size)
            this.graphics.alpha = alpha;
            this.graphics.beginFill(0xff0000);
            this.graphics.drawCircle(this.x,this.y,fac*this.size)
            this.graphics.endFill();
        }
    }
}