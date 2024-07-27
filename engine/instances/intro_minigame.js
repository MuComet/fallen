class IntroMinigameController extends MinigameController {
    onEngineCreate() {
        $engine.unlockMinigame(ENGINE_MINIGAMES.TUTORIAL)
        super.onEngineCreate();
        var text = new PIXI.Text("Start at the top of the drain pipe. \n Use the mouse to traverse the drain and TOUCH \n the junk clog to grab it. Make it down and back up \n without hitting the pipe walls.",$engine.getDefaultTextStyle())
        this.setInstructionRenderable(text);

        this.target = new IntroMinigameJunk(740,505);

        this.setControls(false,true);
        this.disablePreGameAmbience();
        this.disableInstructions();

        this.startText = $engine.createManagedRenderable(this, new PIXI.Text("Start here!",$engine.getDefaultSubTextStyle()));
        this.startText.x = 270;
        this.startText.y = 13;

        // we have a hitbox creator tool i'm not crazy.
        this.hitbox1 = new Hitbox(this,new PolygonHitbox(this,new Vertex(0,0),new Vertex(13,0),new Vertex(18,30),new Vertex(41,63),new Vertex(64,83),
        new Vertex(71,92),new Vertex(74,125),new Vertex(80,301),new Vertex(91,318),new Vertex(109,327),new Vertex(138,333),new Vertex(239,332),
        new Vertex(264,329),new Vertex(289,319),new Vertex(302,303),new Vertex(313,270),new Vertex(316,219),new Vertex(321,207),new Vertex(331,201),
        new Vertex(452,196),new Vertex(566,195),new Vertex(605,197),new Vertex(618,204),new Vertex(625,217),new Vertex(627,233),new Vertex(626,247),
        new Vertex(622,257),new Vertex(614,264),new Vertex(594,265),new Vertex(506,268),new Vertex(411,272),new Vertex(386,283),new Vertex(373,302),
        new Vertex(366,325),new Vertex(363,357),new Vertex(364,418),new Vertex(366,476),new Vertex(374,502),new Vertex(388,524),new Vertex(404,538),
        new Vertex(427,546),new Vertex(444,549),new Vertex(572,550),new Vertex(689,546),new Vertex(696,549),new Vertex(713,565),new Vertex(740,573),
        new Vertex(759,570),new Vertex(778,564),new Vertex(795,538),new Vertex(800,536),new Vertex(816,536),new Vertex(816,624),new Vertex(0,624)))

        this.hitbox2 = new Hitbox(this,new PolygonHitbox(this,new Vertex(227,0),new Vertex(221,31),new Vertex(212,50),new Vertex(192,72),
        new Vertex(165,94),new Vertex(160,102),new Vertex(158,199),new Vertex(162,232),new Vertex(168,245),new Vertex(186,250),new Vertex(207,251),
        new Vertex(226,246),new Vertex(235,233),new Vertex(237,224),new Vertex(237,150),new Vertex(243,126),new Vertex(262,108),new Vertex(301,103),
        new Vertex(439,103),new Vertex(562,100),new Vertex(648,103),new Vertex(681,109),new Vertex(701,124),new Vertex(713,149),new Vertex(719,193),
        new Vertex(720,286),new Vertex(709,330),new Vertex(686,348),new Vertex(643,356),new Vertex(553,361),new Vertex(478,364),new Vertex(462,367),
        new Vertex(452,377),new Vertex(448,398),new Vertex(449,449),new Vertex(453,458),new Vertex(462,462),new Vertex(521,463),new Vertex(588,461),
        new Vertex(685,461),new Vertex(697,445),new Vertex(710,431),new Vertex(727,425),new Vertex(753,426),new Vertex(772,435),new Vertex(781,444),
        new Vertex(788,454),new Vertex(799,458),new Vertex(816,458),new Vertex(816,0)));

        var textures = $engine.getTexturesFromSpritesheet("tutorial_sheet",0,$engine.getSpritesheetLength("tutorial_sheet"));
        this.sprites = [];
        for(var i =textures.length-1;i>=0;i--) {
            var spr = $engine.createRenderable(this,new PIXI.Sprite(textures[i]))
            spr.x = $engine.getWindowSizeX()/2;
            spr.y = $engine.getWindowSizeY()/2;
            this.sprites.push(spr)
        }
        this.sprites[2].scale.set(1.1)
        this.sprites[0].scale.set(1.025)
        if(!$engine.isLow()) {
            var filter = new PIXI.filters.BlurFilter();
            filter.blur = 5;
            this.sprites[2].filters = [filter];
        }

        this.arrowGraphic = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("arrow")))

        this.zoneSprite = $engine.createRenderable(this, new PIXI.extras.TilingSprite($engine.getTexture("zone_restart"),175,50))
        this.zoneSprite.x = 120;

        this.tintColour = 0xff1222

        this.trailGraphics = $engine.createRenderable(this,new PIXI.Graphics());
        this.points = [];
        this.maxPoints = 64;

        this.trailColour = 0;
        this.samplingMouse = false;

        this.lastMouseX = IN.getMouseXGUI();
        this.lastMouseY = IN.getMouseYGUI();
        this.mouseX = IN.getMouseXGUI();
        this.mouseY = IN.getMouseYGUI();

        this.valid = false;

        this.hasGoal = false;

        this.hitTimer = 0;
        this.hitTime = 50;

        this.zoneTime = 32;
        this.zoneTimer = -this.zoneTime;

        this.sound1 = $engine.audioPlaySound("drain_stream",0.75,true);
        this.sound2 = $engine.audioPlaySound("drain_drop",0.33,true);

        this.addOnGameEndCallback(this,function(self) {
            $engine.audioFadeSound(self.sound1);
            $engine.audioFadeSound(self.sound2);
        })

        this.disableCheating();
        this.tutorialIndex = 0;

        this.text = new TextBox();
        this.text.disableArrow();
        this.text.setTextArray(["__portrait[innkeeper_profiles_1]Alright Eson,__wait[9] reach your hand down in the drain.",
                            "__portrait[innkeeper_profiles_0]Great,__wait[9] now go grab that junk and bring it back!__wait[24]\nShouldn't take you long at all.__wait[60] "]);
        this.text.setAdvanceCondition(this, this.mouseInZoneBounds);
        this.text.addAdvanceConditionListener(this,function(self) {
            self.nextTutorial();
        })

        this.text.setSampleLocationFunction(this,function() {
            return new EngineLightweightPoint(IN.getMouseXGUI(),IN.getMouseYGUI());
        })

        //$engine.pauseGameSpecial(this.text)

        if(!$engine.isLow()) {
            this.lighting = new LightingLayer();
            this.lighting.setPixelsPerStep(6)
    
            // get the mask as pixels.
            var pixelSprite = new PIXI.Sprite($engine.getTexture("tutorial_sheet_1"));
            pixelSprite.x = $engine.getWindowSizeX()/2;
            pixelSprite.y = $engine.getWindowSizeY()/2;
            this.lighting.renderSprite(pixelSprite);
            this.lighting.updatePixels();
            $engine.freeRenderable(pixelSprite);
            this.lighting.raytraceFrom(IN.getMouseX(), IN.getMouseY())
        }
        
    }

    nextTutorial() {
        this.tutorialIndex++;
        if(this.tutorialIndex===1) {
            this.text.setAdvanceCondition(this, function() {
                return !this.mouseInZoneBounds() && this.text.isReady();
            });
        }
        if(this.tutorialIndex===2)
            this.startMinigame();
    }

    onBeforeMinigame(frames) {
        
    }
    

    notifyFramesSkipped(frames) {
        // do nothing... required implementation
    }

    onCreate() {
        this.onEngineCreate();
    }

    step() {
        super.step();
        this.parallax();
        if(this.minigameOver())
            return;
        this.handleMouse();
        this.handleValid();
        this.hitTimer--;
    }

    pause() {
        super.pause();
        this.parallax();
    }

    handleValid() {
        if(!this.valid) {
            this.samplingMouse = false;
            this.trailColour= 0xff1222;
            if(this.mouseInZoneBounds() && !this.mouseIsInvalid()) {
                this.points=[];
                this.valid=true;
            }
        } else {
            this.samplingMouse = true;
            this.trailColour= 0;
            if(this.mouseInZoneBounds() && this.hasGoal) {
                this.endMinigame(true)
                $engine.activateAchievement("INTRO_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
            }
        }

        if(this.hasGoal) {
            if(this.zoneTimer<0)
                this.zoneTimer++
        } else {
            if(!this.valid && this.zoneTimer<0) {
                this.zoneTimer++;
            } else if(this.valid){
                this.zoneTimer++;
            }
        }
        
    }

    mouseIsInvalid() {
        var v1 = new EngineLightweightPoint(this.lastMouseX,this.lastMouseY);
        var v2 = new EngineLightweightPoint(this.mouseX,this.mouseY);
        return (this.hitbox1.checkLineCollision(v1,v2) || this.hitbox2.checkLineCollision(v1,v2) || !IN.mouseInBounds())
    }

    handleMouse() {
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.mouseX = IN.getMouseXGUI();
        this.mouseY = IN.getMouseYGUI();

        if(this.valid && this.mouseIsInvalid()) {
            this.valid = false;
            this.lastKnownLocation = new EngineLightweightPoint(this.mouseX,this.mouseY)
            this.hitTimer = this.hitTime;
            this.zoneTimer = -this.zoneTime;
            this.tintColour = 0xff1222;
            this.hasGoal = false;
            $engine.audioPlaySound("drain_hit")

            this.target.returnTimer = this.target.returnTime;
            this.target.isFollowingPlayer = false;
            this.target.targetX = this.target.x;
            this.target.targetY = this.target.y;
        }

        if(this.valid && !this.hasGoal && this.target.returnTimer<0 && IM.instanceCollisionPoint(IN.getMouseXGUI(),IN.getMouseYGUI(),this.target)) {
            this.target.isFollowingPlayer = true;
            this.hasGoal = true;
            this.tintColour = 0x12ff22;
            this.zoneTimer = -this.zoneTime;
        }

        if(this.samplingMouse) {
            this.points.unshift(new EngineLightweightPoint(IN.getMouseXGUI(),IN.getMouseYGUI()))
            if(this.points.length > this.maxPoints)
                this.points.pop();
        } else {
            this.points.pop();
        }
    }

    renderTrail() {
        if(this.points.length===0)
            return;
        this.trailGraphics.clear();
        this.trailGraphics.moveTo(this.points[0].x,this.points[0].y)
        var length = this.points.length
        var size = length;
        // code by Homan, https://stackoverflow.com/users/793454/homan
        // source: https://stackoverflow.com/a/7058606
        for(var i =0;i<length;i++) {
            this.trailGraphics.lineStyle((size - i)/16,this.trailColour);
            this.trailGraphics.lineTo(this.points[i].x, this.points[i].y);
        }
        this.trailGraphics.lineStyle(0);
        this.trailGraphics.beginFill(this.trailColour);
        this.trailGraphics.drawCircle(this.points[0].x,this.points[0].y,(size-1)/32)
        for(var i =0;i<length-1;i++) {
            this.trailGraphics.drawCircle(this.points[i].x,this.points[i].y,(size - i)/32)
        }
        this.trailGraphics.endFill()
    }

    renderHit(camera) {
        if(!this.lastKnownLocation || this.hitTimer<-64)
            return;
        var fac = EngineUtils.interpolate(this.hitTimer/this.hitTime,0,1,EngineUtils.INTERPOLATE_IN);
        var alpha = 0;
        if(this.hitTimer > 0)
            alpha = 1-(this.hitTimer/this.hitTime)
        else
            alpha = EngineUtils.clamp(1-((-this.hitTimer-56)/8),0,1)
        camera.lineStyle(1,0xff1222,alpha);
        var rad = 32+fac*1024
        camera.drawCircle(this.lastKnownLocation.x,this.lastKnownLocation.y,rad)
        camera.beginFill(0xff1222,alpha)
        camera.drawCircle(this.lastKnownLocation.x,this.lastKnownLocation.y,16 + Math.abs(Math.sin($engine.getGameTimer()/8))*8)
        camera.endFill();
    }

    renderRestartZone(camera) {

        var colour = 0x12ff22
        var fac = EngineUtils.interpolate(Math.abs(this.zoneTimer/this.zoneTime),1,0,EngineUtils.INTERPOLATE_SMOOTH);
        this.zoneSprite.alpha = fac;
        this.zoneSprite.tilePosition.x+=0.1;
        this.zoneSprite.tilePosition.y+=0.1;
        this.zoneSprite.tint = colour;
        var zone = this.zoneSprite;
        var thickness = 3 + Math.abs(Math.sin($engine.getGameTimer()/32))*5
        camera.lineStyle(thickness,colour,fac);
        camera.moveTo(zone.x-zone.width/2,zone.y)
                .lineTo(zone.x+zone.width/2,zone.y)
                .lineTo(zone.x+zone.width/2,zone.y+zone.height)
                .lineTo(zone.x-zone.width/2,zone.y+zone.height)
                .lineTo(zone.x-zone.width/2,zone.y)

        if(!this.hasGoal) {
            this.startText.text = "Start here!"
        } else {
            this.startText.text = "Bring the junk here!"
        }

        var dir = -Math.PI;
        var fac2 = Math.abs(Math.sin($engine.getGameTimer()/16))/8 + 0.25
        this.arrowGraphic.scale.set(fac2)
        this.arrowGraphic.x = this.zoneSprite.x + 160 + V2D.lengthDirX(dir,8+fac2*30);
        this.arrowGraphic.y = this.zoneSprite.y+this.zoneSprite.height/2 - V2D.lengthDirY(dir,8+fac2*30);
        this.arrowGraphic.rotation = dir;
        this.arrowGraphic.alpha = fac;
        $engine.requestRenderOnCameraGUI(this.arrowGraphic)

        this.startText.alpha = fac;
        this.startText.scale.x = 1+fac2/2;
        $engine.requestRenderOnCameraGUI(this.startText)
    }

    mouseInZoneBounds() {
        var mx = IN.getMouseXGUI();
        var my = IN.getMouseYGUI();
        var zone = this.zoneSprite;
        return mx > zone.x-zone.width/2-4 && mx < zone.x + zone.width/2 + 4 && my > zone.y - 4 && my < zone.y+zone.height + 16;
    }

    parallax() {
        var diffX = (IN.getMouseXGUI()-this.x)/32;
        var diffY = (IN.getMouseYGUI()-this.y)/32;
        this.sprites[2].x = $engine.getWindowSizeX()/2-diffX
        this.sprites[2].y = $engine.getWindowSizeY()/2-diffY
        this.sprites[0].x = $engine.getWindowSizeX()/2+diffX/8
        this.sprites[0].y = $engine.getWindowSizeY()/2+diffY/8
    }

    renderRaytrace() {
        if($engine.isLow())
            return;
        if(!IN.mouseInBounds()) {
            this.lighting.clear();
            return;
        }
        this.lighting.raytraceFrom(IN.getMouseX(), IN.getMouseY())
        
    }

    draw(gui, camera) {
        super.draw()
        this.renderRaytrace();

        if(this.minigameOver()) {
            this.renderRestartZone(camera);
            this.trailGraphics.clear();
            return;            
        }

        this.renderTrail();
        this.renderHit(camera);

        this.renderRestartZone(camera);

    }
}

class IntroMinigameJunk extends EngineInstance {
    onCreate(x,y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;

        this.targetX = this.x;
        this.targetY = this.y;

        this.isFollowingPlayer = false;

        this.returnTimer=0;
        this.returnTime=45;

        this.grabbedTimer = 0;

        this.setSprite(new PIXI.Sprite($engine.getTexture("tutorial_junk")));
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-65,-65,65,65)))
        this.wobble();
    }

    wobble() {
        this.xScale = 0.85+Math.sin($engine.getGameTimer()/13)/12-this.grabbedTimer/180;
        this.yScale = 0.85+Math.sin($engine.getGameTimer()/13+10)/12-this.grabbedTimer/180;
        this.angle = Math.cos($engine.getGameTimer()/16)/24;
    }

    step() {
        this.wobble();
        var controller = IntroMinigameController.getInstance();

        if(controller.minigameOver()) {
            this.y-=5;
            return;
        }

        this.grabbedTimer = EngineUtils.clamp(this.grabbedTimer + (this.isFollowingPlayer ? 1 : -1), 0, 60);

        if(!this.isFollowingPlayer && this.returnTimer<0) {
            this.targetX = this.startX;
            this.targetY = this.startY;
        } else if(this.isFollowingPlayer) {
            this.targetX = IN.getMouseXGUI();
            this.targetY = IN.getMouseYGUI();
        }

        this.returnTimer--;

        var dx = this.targetX - this.x;
        var dy = this.targetY - this.y;
        this.x+=dx/5;
        this.y+=dy/5;
    }
}