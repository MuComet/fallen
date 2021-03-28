class MazeMinigameController extends MinigameController {
    onEngineCreate() { 
        super.onEngineCreate();
        this.timer = 0;
        this.score = 0;
        this.sizeX = 70;
        this.sizeY = 70;
        var rows = 26;
        var columns = 26;
        var totalSpaces = rows*columns;
        var totalMazes = 512;

        this.totalWidth = this.sizeX * columns;
        this.totalHeight = this.sizeY * rows;
        this.depthIndex = -1;


        this.setControls(true,false);

        this.lampSprite = $engine.createManagedRenderable(this, new PIXI.extras.AnimatedSprite($engine.getAnimation("crate_mask_animation")));
        this.lampSprite.animationSpeed = 0.1; // 6FPS

        var arr = [];
        this.targetMaze = new Maze(true);
        arr.push(this.targetMaze);
        for(var i =1;i<totalMazes;i++)
            arr.push(new Maze(false));
        for(var i = totalMazes;i<totalSpaces;i++)
            arr.push(undefined);

        EngineUtils.shuffleArray(arr);

        this.glowFilter = new PIXI.filters.GlowFilter();

        // randomly place the Mazes.
        for(var i = 0;i<totalSpaces;i++) {
            if(!arr[i])
                continue;
            var xx = this.sizeX * (i % columns);
            var yy = this.sizeY * Math.floor(i / columns);
            arr[i].x=xx + EngineUtils.irandomRange(-8,8) + (Math.floor(i / columns)%2==0 ? EngineUtils.irandomRange(26,38) : 0);
            arr[i].y=yy + EngineUtils.irandomRange(-8,8);
        }


        var background = new PIXI.Sprite($engine.getTexture("background_table_cards"));
        $engine.setBackground(background);
        this.startTimer(30*60);

        var text = new PIXI.Text("MAZE\n\n You may lose at most 5 plant units \n AND miss spraying at most 10 worms \n\nPress ENTER to cheat!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.setControls(true,false);
        this.skipPregame();

        this.progressText = new PIXI.Text("",$engine.getDefaultSubTextStyle());
        $engine.createManagedRenderable(this,this.progressText);
        this.progressText.anchor.set(0.5,0.5);
        this.progressText.x = $engine.getWindowSizeX()/2;
        this.progressText.y = $engine.getWindowSizeY()-30;


        this.saveX = 0;
        this.saveY = 0;

        this.mx = 0;
        this.my = 0;

        this.maxScroll =10;

        this.lampSprite.x = $engine.getWindowSizeX()/2;
        this.lampSprite.y = $engine.getWindowSizeY()/2;


        this.shakeTimer = 0;
        this.shakeFactor = 8;
        this.updateProgressText();
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);  
    }

    onCreate() { 
        super.onCreate();
        this.onEngineCreate();
    }

    handleMoveScreen() {
        var mxGUI = IN.getMouseXGUI();
        var myGUI = IN.getMouseYGUI();
        var threshold = 64;
        var highX = $engine.getWindowSizeX();
        var highY = $engine.getWindowSizeY();

        var pressingRight = IN.keyCheck("KeyD") || IN.keyCheck("ArrowRight") || mxGUI > highX - threshold
        var pressingLeft = IN.keyCheck("KeyA") || IN.keyCheck("ArrowLeft") || mxGUI < threshold
        var pressingDown = IN.keyCheck("KeyS") || IN.keyCheck("ArrowDown") || myGUI > highY - threshold
        var pressingUp = IN.keyCheck("KeyW") || IN.keyCheck("ArrowUp") || myGUI < threshold

        if(pressingRight) {
            this.mx++;
        }

        if(pressingLeft) {
            this.mx--;
        }

        if(!pressingLeft && !pressingRight) {
            this.mx -= Math.sign(this.mx);
        }
        
        if(pressingDown) {
            this.my++;
        }

        if(pressingUp) {
            this.my--;
        }

        if(!pressingUp && !pressingDown) {
            this.my -= Math.sign(this.my);
        }

        this.mx = EngineUtils.clamp(this.mx, -this.maxScroll, this.maxScroll);
        this.my = EngineUtils.clamp(this.my, -this.maxScroll, this.maxScroll);
        
        var camera = $engine.getCamera();
        var cx = camera.getX()+this.mx;
        var cy = camera.getY()+this.my;

        if(cx > this.totalWidth-highX || cx < 0)
            this.mx=0;
        if(cy > this.totalHeight-highY || cy < 0)
            this.my = 0;

        camera.setLocation(EngineUtils.clamp(cx,0,this.totalWidth-highX), EngineUtils.clamp(cy,0,this.totalHeight-highY))
    }

    step() {

            if(this.minigameOver()){
                return;
            }
    
            this.updateProgressText();
            this.handleShake();
            this.timer++;
        
        super.step();
        this.lampSprite.update(1);
        if(this.minigameOver())
            return;
        this.handleMoveScreen();
        var sx = EngineUtils.clamp(IN.getMouseXGUI(),0,$engine.getWindowSizeX());
        var sy = EngineUtils.clamp(IN.getMouseYGUI(),0,$engine.getWindowSizeY());
        this.lampSprite.x = sx;
        this.lampSprite.y = sy;

        var fac2 = Math.abs(Math.sin($engine.getGlobalTimer()/16));
        this.glowFilter.innerStrength = fac2;
        
        this.destroyTimer++;
        
    }

    draw(gui, camera) {
        super.draw(gui,camera);
        $engine.requestRenderOnCameraGUI(this.lampSprite);
        $engine.requestRenderOnCameraGUI(this.progressText);
    }

    handleShake() {
        var camera = $engine.getCamera();
        var fac = EngineUtils.interpolate(this.shakeTimer/this.shakeFactor,0,1,EngineUtils.INTERPOLATE_OUT_QUAD);
        camera.setRotation(EngineUtils.randomRange(-0.01,0.01)*fac);
        camera.setLocation(EngineUtils.irandomRange(-2,2) * fac, EngineUtils.irandomRange(-2,2) * fac);
        this.shakeTimer--;
    }

    shake(factor = 20) {
        if(this.shakeTimer < 0);
            this.shakeTimer=0;
        this.shakeTimer+=factor;
    }

    updateProgressText() {
        this.progressText.text = "Progress:  Plants Left  "+String(this.score);
    }
 
}


class Maze extends EngineInstance {
    onCreate(mark) {
        this.marked = mark;
        var texture = undefined;
        if(mark) 
            texture = $engine.getRandomTextureFromSpritesheet("crate_marked");
        else
            texture = $engine.getRandomTextureFromSpritesheet("crate_normal");
    
        this.setSprite(new PIXI.Sprite(texture));
        var r = EngineUtils.irandomRange(178,255);
        this.originalTintFactor = r;
        this.getSprite().tint = (r<<16) | (r<<8) | r; // add some variation via a brightness adjustment
        this.setHitbox(new Hitbox(this, new RectangleHitbox(this,0,0,64,64)));
    }
    
    step() {
        
    }
    
    draw(gui, camera) {
    
    }
}