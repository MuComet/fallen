class WallBuilderController extends MinigameController {

    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.WALL)
        super.onEngineCreate();
        this.possibleLetters = [];
        for(var i = 0;i<26;i++)
            this.possibleLetters.push("Key"+String.fromCharCode(i+65));
        this.lastLetter = "";
        this.delayToNext = 999;
        this.maxDelayToNext = 40; // if you mess up
        this.currentKey = "";

        this.progress = 0;
        this.width = 10;
        this.height = 6;

        this.total = this.width*this.height;
 
        this.imgWidth = 64;
        this.imgHeight = 32;
        var bg = new ParallaxingBackground("background_sheet_2"); // make the background
        bg.setParallaxFactors(1,1);
        $engine.unpauseGameSpecial
        var text = new PIXI.Text("Press the letter KEYS displayed on the wood tile.\n Repair the wall by laying down bricks with correct keys.\n Be quick and accurate, wrong keys will create a delay.\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle())
        this.setInstructionRenderable(text);
        this.setControls(true,false);
        this.skipPregame();
        this.setCheatTooltip("Two helping hands!");
        this.setLossReason("Maybe you should reconsider your career in brick laying.") // only one way to lose

        this.graphicsLocationX = $engine.getWindowSizeX()/2;
        this.graphicsLocationY = 128;
        this.graphicsOffsetX = 0;
        this.graphicsOffsetY = 0;
        this.graphicsTint=0xffffff;



        this.backdropImage = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("letter_backdrop")));
        this.backdropImage.x = this.graphicsLocationX;
        this.backdropImage.y = this.graphicsLocationY;


        var style = $engine.getDefaultTextStyle();
        style.fontSize = 40;
        this.letterText = $engine.createRenderable(this,new PIXI.Text("",style));
        this.letterText.anchor.set(0.5,0.5);
        this.letterText.x = this.graphicsLocationX;
        this.letterText.y = this.graphicsLocationY;

        this.buildtohere = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("build_to_here")));
        this.buildtohere.x = $engine.getWindowSizeX()/2;
        this.buildtohere.y = $engine.getWindowSizeY()-300;



        this.flipTimer = 0;
        this.flipTime = 20;
        
        this.errorTimer = 30;
        this.errorTime = 30;

        this.cameraMove = 0;

        this.rotateFactor = 0;

        this.depth = 1; // render behind bricks.
        
        this.gritRopes = [];

        this.lastBrickX = 0;
        this.lastBrickY = 0;

        this.next();
        this.updateText();

        this.endWaitTimer = 0;
        this.waiting = false;

        var time = $engine.hasItem(ENGINE_ITEMS.BRICK_LAYER) ? 35 * 60 : 30 * 60;

        this.startTimer(time)
    }

    landed(dy) {
        this.cameraMove+=dy/16;
        this.rotateFactor+=dy/768;
    }

    createRope() {
        $engine.audioPlaySound("wall_layer")
        var tex = $engine.getTexture("wall_building_grit")
        tex.baseTexture.wrapMode = PIXI.WRAP_MODES.MIRRORED_REPEAT;

        var numPoints = 75;

        var xLeft = -(this.width/2)*this.imgWidth;
        var xRight = -xLeft;
        xLeft+=$engine.getWindowSizeX()/2;
        xRight+=$engine.getWindowSizeX()/2
        var diff = (xRight-xLeft) / (numPoints-1);
        var points = [];
        var loc = xLeft;
        for(var i =0;i<numPoints;i++) {
            var point = new PIXI.Point(loc,-32)
            point.fallingDy = 0;
            points.push(point);
            loc+=diff;
        }
        var rope = $engine.createRenderable(this,new PIXI.mesh.Rope(tex,points));
        rope.doneFalling = false;
        rope.targetY = this.lastBrickY-this.imgHeight;
        rope.framesSinceCreation = 0;
        // by defaut, it will stretch our texture.
        rope.texture.frame.width = xRight-xLeft;
        rope.texture._updateUvs()
        return rope;
    }

    onCreate() {
        super.onCreate();
        this.onEngineCreate();
    }

    next() {
        do {
            this.currentKey = EngineUtils.randomFromArray(this.possibleLetters);
        } while(this.currentKey===this.lastLetter)
        //this.letterText.scale.x = 2;
        //this.letterText.scale.y = 2;
        this.lastLetter=this.currentKey;
    }

    updateText() {
        this.letterText.text = this.currentKey.substring(3);
        this.letterText.visible=true;
    }

    spawnFadingLetter(valid) {
        var text = new TextEffect(this.graphicsLocationX,this.graphicsLocationY,this.letterText.text,$engine.getDefaultTextStyle());
        /*if(valid) {
            text.setExpandMode();
        } else {
            text.setDecayMode();
        }*/
        text.setDecayMode();

    }

    keyCorrect() {
        this.spawnFadingLetter(true);
        var times = 2;
        if(this.hasCheated()) {
            times = 4;
        }
        for(var i =0;i<times;i++) {
            this.spawnBrick(true);
            this.progress++;
            this.flipTimer=this.flipTime;
            this.next();
            this.letterText.visible = false;
            if(this.progress===this.total) {
                if(!this.hasCheated() && this.getTimer().getTimeRemaining() >= 600){
                    greenworks.activateAchievement("WALL_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
                }
                this.getTimer().stopTimer();
                return;
            }
            if(this.progress % this.width===0) {
                this.gritRopes.push(this.createRope());
            }
        }
    }

    keyIncorrect() {
        this.spawnFadingLetter(true);
        
        var times = 2;
        if(this.hasCheated()) {
            times = 4;
        }
        for(var i =0;i<times;i++) {
            this.spawnBrick(false);
            this.progress++;
        }
        for(var i =0;i<times;i++) {
            this.progress--;
        }
        //this.spawnFadingLetter(false);
        this.delayToNext=0;
        this.errorTimer=0;
        this.flipTimer=this.errorTime;
        this.next();
        this.letterText.visible = false;
    }

    spawnBrick(valid) {
        var xp = (this.progress%this.width)-((this.width-1)/2);
        var yp = Math.floor(this.progress/this.width);
        var locX = $engine.getWindowSizeX()/2 + xp * this.imgWidth;
        var locY = $engine.getWindowSizeY()-64 - yp * (this.imgHeight+4);
        this.lastBrickX = locX;
        this.lastBrickY = locY;
        new Brick(locX,locY,valid);
    }

    updateGritRopes() {
        for(var i =0;i<this.gritRopes.length;i++) {
            var rope = this.gritRopes[i];
            if(rope.doneFalling)
                continue;
            var points = rope.points;
            var count = 0;
            rope.framesSinceCreation++;
            for(var k =0;k<points.length && k < rope.framesSinceCreation;k++) {
                var point = points[k];
                point.y = point.y + point.fallingDy;
                point.fallingDy+=0.25;
                if(point.y > rope.targetY) {
                    point.y = rope.targetY;
                    count++;
                }
            }
            if(count===points.length) {
                rope.doneFalling=true;
            }
        }
    }

    step() {
        super.step();

        this.updateGritRopes();

        $engine.getCamera().translate(0,this.cameraMove);
        if($engine.getCamera().getY()<=0) {
            this.cameraMove=0;
            $engine.getCamera().setY(0);
        } else {
            this.cameraMove-=0.75;
        }

        this.rotateFactor-=0.025;
        if(this.rotateFactor<0) {
            this.rotateFactor=0;
        }

        $engine.getCamera().setRotation(EngineUtils.randomRange(-this.rotateFactor,this.rotateFactor));

        if(this.getTimer().isTimerDone())
            return;
        this.delayToNext++;

        if(this.delayToNext>=this.maxDelayToNext && this.delayToNext <= this.maxDelayToNext + 6) {
            this.graphicsTint=0x00ff00;
        } else {
            this.graphicsTint=0xffffff;
        }

        if(this.errorTimer<=this.errorTime) {
            var fac = EngineUtils.interpolate(this.errorTimer/this.errorTime,1,0,EngineUtils.INTERPOLATE_OUT);
            this.graphicsOffsetX = EngineUtils.randomRange(-fac,fac)*this.errorTime/2
            this.graphicsOffsetY = EngineUtils.randomRange(-fac,fac)*this.errorTime/2
            var invFac = 1-fac;
            this.graphicsTint = (0xff<<16) | (Math.floor(0xff*invFac) << 8) | (Math.floor(0xff * invFac));
        }
        this.errorTimer++;

        if(this.flipTimer>=0) {
            var value = Math.abs((this.flipTimer-(this.flipTime/2))/(this.flipTime/2));
            if(this.flipTimer <= this.flipTime/2) {
                this.updateText();
            }
            var fac = EngineUtils.interpolate(value, 0, 1, EngineUtils.INTERPOLATE_OUT_BACK)
            this.letterText.scale.x = fac;
            this.letterText.scale.y = 0.75 + fac/4;
            this.backdropImage.scale.x = fac;
            this.backdropImage.scale.y = 0.75 + fac/4;
        }
        this.flipTimer--;

        var key = IN.getLastKey();
        if(this.delayToNext>this.maxDelayToNext && IN.anyKeyPressed() && key.charCodeAt(3)>=65 && key.charCodeAt(3)<=90) { // only count valid inputs.
            if(this.currentKey===key) {
                this.keyCorrect();
            } else {
                this.keyIncorrect();
            }
        }
    }

    draw(gui, camera) {
        super.draw(gui,camera);
        this.backdropImage.x = this.graphicsLocationX + this.graphicsOffsetX
        this.backdropImage.y = this.graphicsLocationY + this.graphicsOffsetY
        this.backdropImage.tint = this.graphicsTint
        this.letterText.x = this.graphicsLocationX + this.graphicsOffsetX
        this.letterText.y = this.graphicsLocationY + this.graphicsOffsetY
        this.letterText.tint = this.graphicsTint
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);
    }
}

class Brick extends EngineInstance {
    onCreate(targetX,targetY, correct) {
        this.x = targetX;
        this.y = -64;
        this.dy = 3;
        this.dx = 0;
        this.dr = 0;
        this.grav = 0.3333;
        this.startAngle = EngineUtils.randomRange(-1.51,1.51);
        this.targetY = targetY
        this.fallTime = 0;
        this.correct = correct
        this.phase = 0; // 0 = falling, 1 = dactivated, 2 = bOrked
        this.setSprite(new PIXI.Sprite($engine.getTexture("brick_sheet_"+ String(EngineUtils.irandomRange(0, 3)))));

        this.landedOnce = false;

        this.lifeTimer = 0;
        this.life = EngineUtils.irandomRange(30,60);

        this.timeSinceCreation = 0;
        this.lightTimer = 64;
    }

    step() {
        this.timeSinceCreation++;
        if(this.phase!==1) {
            this.dy+=this.grav;
            this.y+=this.dy;
            this.x+=this.dx
            this.angle+=this.dr;
        }

        if(this.phase===0) {
            this.angle = EngineUtils.interpolate(this.y/this.targetY,1,0,EngineUtils.INTERPOLATE_OUT_BACK) * this.startAngle
        }
        
        if (this.phase === 2) {
            var fac = this.lifeTimer/this.life;
            this.alpha = EngineUtils.interpolate(fac, 1, 0, EngineUtils.INTERPOLATE_IN_QUAD)
            if(this.lifeTimer>=this.life)
                this.destroy()
            this.lifeTimer++;
        }

        if(this.y >= this.targetY && this.phase===0) {
            this.y = this.targetY;
            WallBuilderController.getInstance().landed(this.dy);
            if(!this.correct) {
                this.phase=2;
                this.dy = EngineUtils.randomRange(-4,-6);
                this.dx = EngineUtils.randomRange(-3,3);
                this.dr = EngineUtils.randomRange(0.05,0.05)
                this.depth = -1;
                if(!this.landedOnce)
                    $engine.audioPlaySound("wall_miss")
            } else {
                if(this.dy < 2)
                    this.phase = 1;
                
                this.dy = -this.dy*0.3333;
                if(!this.landedOnce) {
                    var snd = $engine.audioPlaySound("wall_hit");
                    snd.speed = EngineUtils.randomRange(0.75,1.5);
                }
            }
            this.landedOnce=true;
        }
    }

    draw(gui,camera) {
        if(this.timeSinceCreation>this.lightTimer)
            return;
        var fac = EngineUtils.interpolate(this.timeSinceCreation/this.lightTimer,1,0,EngineUtils.INTERPOLATE_OUT_QUAD);
        var invFac = 1-fac;
        var spread = 128 * invFac
        camera.beginFill(0xfdff6e,fac/3);
        camera.drawRect(this.x-this.getSprite().width/2 - spread/2 ,0,this.getSprite().width + spread,1920)
        camera.drawRect(this.x-this.getSprite().width/4 - spread/4 ,0,this.getSprite().width/2 + spread/2,1920)
        camera.endFill();
    }
}

class TextEffect extends EngineInstance {
    onCreate(x,y,text,style) {
        style.fontSize = style.fontSize*2;
        this.setSprite(new PIXI.Text(text,style));
        this.getSprite().anchor.set(0.5,0.5);
        this.x = x;
        this.y = y;
        this.mode = 0;
        this.lifeTimer = 0;
        this.life = EngineUtils.irandomRange(30,60);
        this.grav = 0.25;
        this.dr = 0;
        this.dx = 0;
        this.dy = 0;
    }

    setDecayMode() {
        this.mode = 1;
        this.dy = EngineUtils.randomRange(-4,-6);
        this.dx = EngineUtils.randomRange(-3,3);
        this.dr = EngineUtils.randomRange(0.05,0.05)
        this.depth = -1;
    }

    setExpandMode() {
        this.mode = 2;
        this.dy = EngineUtils.randomRange(-4,-6);
        this.dx = EngineUtils.randomRange(-3,3);
        this.dr = EngineUtils.randomRange(0.05,0.05)
        this.life=30;
        this.depth = -1;
    }

    step() {
        if(this.mode === 0)
            return;

        var fac =  EngineUtils.interpolate(this.lifeTimer/this.life, 1, 0, EngineUtils.INTERPOLATE_IN_QUAD)
        this.alpha = fac;
        if(this.mode===1) {
            this.dy+=this.grav;
            this.y+=this.dy;
            this.x+=this.dx
            this.angle+=this.dr;
        } else {
            var t = EngineUtils.interpolate(this.lifeTimer/this.life, 0, 1, EngineUtils.INTERPOLATE_OUT_QUAD)
            var fac2 = t*5+1;
            this.alpha /= 3;
            this.xScale = fac2;
            this.yScale = fac2;
        }

        if(this.lifeTimer>=this.life)
            this.destroy()
        this.lifeTimer++;
    }
}