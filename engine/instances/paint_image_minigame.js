class PaintImageController extends MinigameController { // this minigame literally just exists to flex PIXI

    onEngineCreate() {
        super.onEngineCreate();
        this.startTimer(10*60);

        new ParallaxingBackground();

        this.imageBack = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("fence_base")))
        this.image = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("fence_base")))
        this.image.tint = 0xff2423

        this.renderTexture = $engine.createManagedRenderable(this, PIXI.RenderTexture.create($engine.getWindowSizeX(),$engine.getWindowSizeY()));
        this.renderTextureSprite = $engine.createRenderable(this, new PIXI.Sprite(this.renderTexture))

        this.image.mask = this.renderTextureSprite;

        this.brush = $engine.createManagedRenderable(this,new PIXI.Sprite($engine.getTexture("paint_base")))
        this.lmx = IN.getMouseX();
        this.lmy = IN.getMouseY();
        this.mx = IN.getMouseX();
        this.my = IN.getMouseY();
        this.lastMousePositionArray = [];
        this.averageFactor=8;

        this.brushUsage=0;
        this.maxBrushUsage = 420;
        this.brushUsageFadeStart = this.maxBrushUsage-80;

        this.setPreventEndOnTimerExpire(true);
        this.pixelsResult = undefined;
        this.addOnGameEndCallback(this,function(self) {
            self.pixelsResult = self.getPixelArray();
            var col = 0xff2423;
            var count = 0;
            var now = window.performance.now();
            var r = col>>16;
            var g = col>>8 & 0b11111111;
            var b = col & 0b11111111;
            for(var xx = 0;xx<816;xx++)
                for(var yy=0;yy<624;yy++) {
                    if(self.pixelWithinTolerance(xx,yy,r,g,b,12))
                        count++;
                }
            console.log(count,window.performance.now()-now);
        })
    }

    onCreate() {
        super.onCreate();
        this.onEngineCreate();
    }


    step() {
        super.step();
        this.lmx = this.mx;
        this.lmy = this.my;
        this.mx = IN.getMouseX();
        this.my = IN.getMouseY();
        if(!(this.lmx===this.mx && this.lmy===this.my)) {
            this.lastMousePositionArray.push(new EngineLightweightPoint(this.lmx,this.lmy));
            if(this.lastMousePositionArray.length > this.averageFactor)
                this.lastMousePositionArray.shift();
            var lastPos = this.averagePoints(this.lastMousePositionArray)

            var dir = V2D.calcDir(this.mx-lastPos.x,this.my-lastPos.y);
            this.brush.rotation = dir+Math.PI/2;
            this.brush.x = this.mx;
            this.brush.y = this.my;
        }
        if(IN.mouseCheck(0) && lastPos)
            this.renderMask(new EngineLightweightPoint(this.mx,this.my),lastPos);
        if(this.my>$engine.getWindowSizeY())
            this.brushUsage=0;
    }

    getPixelArray() {
        return $engine.getRenderer().plugins.extract.pixels(this.image);
    }

    // returns the pixel as RGB
    getPixelAt(x,y) {
        var idx = (x + y*816)*4;
        var ret = (this.pixelsResult[idx++] << 16) | (this.pixelsResult[idx++] << 8) | (this.pixelsResult[idx++])
        return ret;
    }

    // returns the pixel as RGB
    pixelWithinTolerance(x,y,r,g,b,tolerance) {
        var idx = (x + y*816)*4;
        var r2 = r-this.pixelsResult[idx++];
        var g2 = g-this.pixelsResult[idx++];
        var b2 = b-this.pixelsResult[idx++];
        return Math.abs(r2) <= tolerance && Math.abs(g2) <= tolerance && Math.abs(b2) <= tolerance;
    }
 
    renderMask(to, from) {
        var dist = V2D.calcMag(to.x-from.x,to.y-from.y)/6; // jump 6 px at a time
        var dx = (to.x-from.x)/dist 
        var dy = (to.y-from.y)/dist
        for(var i =0;i<dist;i++) {
            this.brush.x = from.x+dx*i;
            this.brush.y = from.y+dy*i;
            this.brush.alpha = EngineUtils.clamp(1/dist-this.getBrushFade(),0,1);
            this.brushUsage++;
            $engine.getRenderer().render(this.brush,this.renderTexture,false,null,false);
        }
    }

    getBrushFade() {
        if(this.brushUsage>this.maxBrushUsage)
            return 1;
        if(this.brushUsage>this.brushUsageFadeStart) {
            var val = EngineUtils.interpolate((this.brushUsage-this.brushUsageFadeStart) / 
                        (this.maxBrushUsage-this.brushUsageFadeStart),0,1,EngineUtils.INTERPOLATE_IN)
            return val
        }
        return 0;
    }

    averagePoints(points) {
        var ax = 0;
        var ay = 0;
        var div = points.length;
        for(const point of points) {
            ax+=point.x;
            ay+=point.y;
        }
        return new EngineLightweightPoint(ax/div,ay/div);
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);
    }

    draw(gui, camera) {
        super.draw(gui,camera);
    }
}