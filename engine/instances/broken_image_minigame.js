class BrokenImageController extends MinigameController {

    onEngineCreate() {
        super.onEngineCreate();
        this.startTimer(40*60);

        new ParallaxingBackground();

        this.image = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("gui_cheat_graphic")))
        this.image.x = $engine.getWindowSizeX()/2;
        this.image.y = $engine.getWindowSizeY()/2;

        this.xMax = this.image.width;
        this.yMax = this.image.height;

        this.pattern = [];

        this.generatePattern();
    }

    generatePattern() {
        var pattern = [];
        var points = 4;
        for (var i =0;i<=points;i++)
            pattern.push([]);
        var xmf = this.xMax/points;
        var ymf = this.yMax/points;
        for(var xx =0;xx<=points;xx++) {
            for(var yy=0;yy<=points;yy++) {
                if(xx!==0 &&yy!==0 && xx!==points && yy!==points)
                    pattern[xx].push(new EngineLightweightPoint(xmf*xx+EngineUtils.random(xmf)-xmf/1.25,ymf*yy+EngineUtils.random(ymf)-ymf/1.25));
                else
                    pattern[xx].push(new EngineLightweightPoint(xmf*xx,ymf*yy));
            }
        }
        var np = pattern.length;
        var xOff = this.image.x-this.image.width*this.image.anchor.x;
        var yOff = this.image.y-this.image.height*this.image.anchor.y;
        var polygons = [];
        for(var xx =0;xx<points;xx++) {
            for(var yy=0;yy<points;yy++) {
                var poly = [];
                poly.push(pattern[xx][yy].x+xOff,pattern[xx][yy].y+yOff);
                poly.push(pattern[xx+1][yy].x+xOff,pattern[xx+1][yy].y+yOff);
                poly.push(pattern[xx+1][yy+1].x+xOff,pattern[xx+1][yy+1].y+yOff);
                poly.push(pattern[xx][yy+1].x+xOff,pattern[xx][yy+1].y+yOff);
                polygons.push(new PIXI.Polygon(poly))
            }
        }
    }

    onCreate() {
        super.onCreate();
        this.onEngineCreate();
    }


    step() {
        super.step();
    }

    notifyFramesSkipped(frames) {
        // do nothing, it's survival.
    }

    draw(gui, camera) {
        super.draw(gui,camera);
        var xOff = this.image.x-this.image.width*this.image.anchor.x;
        var yOff = this.image.y-this.image.height*this.image.anchor.y;
        camera.lineStyle(2,0x00ff00)
        camera.beginFill(0xffffff);
        for(const poly of this.polygons) {
            camera.drawPolygon(poly)
        }
        camera.lineStyle(0,0xffffff)
        
        for(const point of this.pattern) {
            camera.drawCircle(point.x+xOff,point.y+yOff,2)
        }
        camera.endFill();
    }
}

class PictureComponent extends EngineInstance {

    onEngineCreate() {

    }

    onCreate() {

    }

}