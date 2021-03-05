class IntroMinigameController extends MinigameController {
    onEngineCreate() {
        super.onEngineCreate();

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

        var textures = $engine.getTexturesFromSpritesheet("tutorial_sheet",0,$engine.getSpriteSheetLength("tutorial_sheet"));
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

        this.zoneSprite = $engine.createRenderable(this, new PIXI.extras.TilingSprite($engine.getTexture("zone_restart"),175,50))
        this.zoneSprite.x = 120;

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

        this.hitTimer = 0;
        this.hitTime = 50;

        this.resetTime = 32;
        this.resetTimer = -this.resetTime;

        this.disableCheating();
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
            if(this.mouseInResetBounds()) {
                this.points=[];
                this.valid=true;
            }
        } else {
            this.samplingMouse = true;
            this.trailColour= 0;
        }

        if(!this.valid && this.resetTimer<0) {
            this.resetTimer++;
        } else if(this.valid){
            this.resetTimer++;
        }
    }

    handleMouse() {
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.mouseX = IN.getMouseXGUI();
        this.mouseY = IN.getMouseYGUI();

        var v1 = new EngineLightweightPoint(this.lastMouseX,this.lastMouseY);
        var v2 = new EngineLightweightPoint(this.mouseX,this.mouseY);
        if(this.valid && (this.hitbox1.checkLineCollision(v1,v2) || this.hitbox2.checkLineCollision(v1,v2))) {
            this.valid = false;
            this.lastKnownLocation = new EngineLightweightPoint(this.lastMouseX,this.lastMouseY)
            this.hitTimer = this.hitTime;
            this.resetTimer = -this.resetTime;
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

        var fac = EngineUtils.interpolate(Math.abs(this.resetTimer/this.resetTime),1,0,EngineUtils.INTERPOLATE_SMOOTH);
        this.zoneSprite.alpha = fac;
        this.zoneSprite.tilePosition.x+=0.1;
        this.zoneSprite.tilePosition.y+=0.1;
        var zone = this.zoneSprite;
        var thickness = 3 + Math.abs(Math.sin($engine.getGameTimer()/32))*5
        camera.lineStyle(thickness,0xff1222,fac);
        camera.moveTo(zone.x-zone.width/2,zone.y)
                .lineTo(zone.x+zone.width/2,zone.y)
                .lineTo(zone.x+zone.width/2,zone.y+zone.height)
                .lineTo(zone.x-zone.width/2,zone.y+zone.height)
                .lineTo(zone.x-zone.width/2,zone.y)
    }

    mouseInResetBounds() {
        var mx = IN.getMouseXGUI();
        var my = IN.getMouseYGUI();
        var zone = this.zoneSprite;
        return mx > zone.x-zone.width/2 && mx < zone.x + zone.width/2 && my > zone.y && my < zone.y+zone.height;
    }

    parallax() {
        var diffX = (IN.getMouseXGUI()-this.x)/32;
        var diffY = (IN.getMouseYGUI()-this.y)/32;
        this.sprites[2].x = $engine.getWindowSizeX()/2-diffX
        this.sprites[2].y = $engine.getWindowSizeY()/2-diffY
        this.sprites[0].x = $engine.getWindowSizeX()/2+diffX/8
        this.sprites[0].y = $engine.getWindowSizeY()/2+diffY/8
    }

    draw(gui, camera) {
        super.draw()
        this.renderTrail();
        this.renderHit(camera);
        this.renderRestartZone(camera);
    }
}