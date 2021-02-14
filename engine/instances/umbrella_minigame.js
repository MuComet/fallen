class Man extends EngineInstance{
    onEngineCreate() {
        this.score = 1000;
        this.text= $engine.createRenderable(this,new PIXI.Text('COUNT 4EVAR: 0', { font: 'bold italic 60px Arvo', fill: '#3e1707', align: 'center', stroke: '#a4410e', strokeThickness: 7 }),false);
        this.text.anchor.x=0.5
        this.dx=0;
        this.hitbox = new Hitbox(this, new RectangeHitbox(this,-32,-128,32,0))
        this.lmx = 0;
        this.lmy = 0;
        this.setSprite(new PIXI.Sprite($engine.getTexture("man")))
        this.filter = new PIXI.filters.MotionBlurFilter();
        $engine.addFilter(this.filter)
        this.filter2 = new PIXI.filters.AdvancedBloomFilter();
        $engine.addFilter(this.filter2);
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {
        this.text.text=String(this.score);
        /*if(Input.isPressed('right')) {
            if(this.dx < 12)
                this.dx+=0.4;
            if(this.dx<0)
                this.dx+=2;
        }else if(Input.isPressed('left')) {
            if(this.dx > -12)
                this.dx-=0.4;
            if(this.dx>0)
                this.dx-=2;
        } else
            this.dx/=1.2*/

        if(IN.keyCheck('ArrowRight')) {
            //$engine.getCamera().setX($engine.getCamera().getX()+5)
            this.x+=5;
        }else if(IN.keyCheck('ArrowLeft')) {
            this.x-=5
            //$engine.getCamera().setX($engine.getCamera().getX()-5)
        } else if (IN.keyCheck('KeyQ')) {
            $engine.getCamera().setRotation($engine.getCamera().getRotation()+0.05)
        }
        $engine.getCamera().setBackgroundColour((Math.sin($engine.getGlobalTimer()/128)+1)*128);
        
        if(this.x<0) {
            this.x = 0;
            this.dx=0;
        }
        if(this.x>800) {
            this.x=800;
            this.dx=0;
        }
        this.x+=this.dx

        if(IN.keyCheck('Escape')) {
            RoomManager.changeRooms("Umbrella2")
        }
        //$engine.getCamera().translate(0,-IN.getWheel()/2);
        $engine.getCamera().setScaleX($engine.getCamera().getScaleX()-IN.getWheel()/1000);
        
        if(IN.mouseCheck(0)) {
            var dx = IN.getMouseXGUI()-this.lmx;
            var dy = IN.getMouseYGUI()-this.lmy;
            this.filter.velocity = [-dx,-dy]
            $engine.getCamera().translate(-dx,-dy)
        }

        if(IN.keyCheckPressed("ShiftLeft")) {
            $engine.removeFilter(this.filter)
        }
        if(IN.keyCheckPressed("ShiftRight")) {
            $engine.removeFilter(this.filter2)
        }

        this.lmx = IN.getMouseXGUI();
        this.lmy = IN.getMouseYGUI();

        //console.log(IN.getMouseX(),IN.getMouseY(), $engine.getCamera().getX(), $engine.getCamera().getY());
    }

    preDraw() {
        this.text.x = this.x;
        this.text.y = this.y-128;
    }

    draw(gui, camera) {
        //EngineDebugUtils.drawHitbox(graphics,this);
        EngineDebugUtils.drawBoundingBox(camera,this);
    }
}

class Umbrella extends EngineInstance {
    onEngineCreate() {
        this.xScale=3;
        this.yScale=3;
        this.timer = 90;
        this.time = 60;
        this.rx = this.x;
        this.ry = this.y;
        this.sx = this.x;
        this.sy = this.y;
        this.hitbox = new Hitbox(this, new RectangeHitbox(this,-32,-64,32,0))
        this.setSprite(new PIXI.Sprite($engine.getTexture("umbrella")))
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    interp(val,min,max) {
        return (max-min)*(3*val*val-2*val*val*val)+min;
    }

    step() {
        this.angle=Math.PI/4
        if(IN.keyCheck('ArrowUp')) {
            this.xScale+=0.1;
        }
        if(IN.keyCheck('ArrowDown') && this.xScale >0) {
            this.xScale-=0.1;
        }
        for(var i =0;i<20;i++)
            new Raindrop(EngineUtils.randomRange(-100,800),-64);
        this.timer++;
        if(this.timer>this.time*2) {
            this.timer=0;
            this.time-=3;
            this.time = EngineUtils.clamp(this.time,30,100)
            this.rx = EngineUtils.randomRange(50,800);
            this.ry = EngineUtils.randomRange(200+10*(this.time-30),264+10*(this.time-30));
            this.sx = this.x;
            this.sy = this.y;
        }
        if(this.timer<=this.time) {
            this.x = this.interp(this.timer/this.time,this.sx,this.rx)
            this.y = this.interp(this.timer/this.time,this.sy,this.ry)
        }
    }

    draw(gui, camera) {
        EngineDebugUtils.drawHitbox(camera,this);
        EngineDebugUtils.drawBoundingBox(camera,this);
    }
}

class Raindrop extends EngineInstance {

    onEngineCreate() {
        this.dx = EngineUtils.randomRange(-1,2);
        this.dy = EngineUtils.randomRange(-2,2);
        this.hitbox = new Hitbox(this, new RectangeHitbox(this,0,-1,16,1))
        this.setSprite(new PIXI.Sprite($engine.getTexture("raindrop")))
    }

    onCreate(x,y) {
        this.x=x;
        this.y=y;
        this.onEngineCreate();
    }

    step() {
        this.angle = V2D.calcDir(this.dx,this.dy)
        var dist = V2D.calcMag(this.dx,this.dy);
        this.xScale = EngineUtils.clamp(dist/6,0,3)
        this.dy+=0.1;
        this.x+=this.dx;
        this.y+=this.dy;
        if(this.y>=800 || this.x<0 || this.x > 816 || IM.instanceCollision(this,this.x,this.y,Umbrella)) {
            this.destroy();
        }
        if(IM.instanceCollision(this,this.x,this.y,Man)) {
            IM.find(Man,0).score--;
            this.destroy();
            $engine.startFadeOut(60,false)
            SceneManager.goto(Scene_Title)
        }

    }

    draw(gui,camera) {
        //EngineDebugUtils.drawHitbox(camera,this);
        //EngineDebugUtils.drawBoundingBox(camera,this);
    }
}