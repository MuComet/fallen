class DrawableLine extends EngineInstance {
    onEngineCreate() {
        this.drawGraphics = $engine.createRenderable(this,new PIXI.Graphics(),false);
        this.isDrawing = false;
        this.points = [];
        this.lastPoint = undefined;
        this.totalDist = 0;
        this.distanceText = $engine.createRenderable(this,new PIXI.Text('TOTAL DIST: 0', { font: 'bold italic 20px Arvo', fill: '#ffffff', align: 'center', stroke: '#aaaaaa', strokeThickness: 4 }),false);
        this.distanceText.anchor.x=0.5
        this.distanceText.x = $engine.getWindowSizeX()/2;
        this.distanceText.y = 80;
        this.show = true;

        $engine.setOutcomeWriteBackValue(ENGINE_RETURN.LOSS);
        $engine.setCheatWriteBackValue(ENGINE_RETURN.NO_CHEAT);
    }

    onCreate() {
        this.onEngineCreate();
    }

    step() {
        if(this.isDrawing) {
            var point = new Vertex(IN.getMouseX(),IN.getMouseY());
            var dist = V2D.distance(point.x,point.y,this.lastPoint.x,this.lastPoint.y)
            if(dist>2) {// arbitrary to prevent mASSIVE overdraw
                this.points.push(point);
                this.totalDist+=dist;
                this.lastPoint=point;
            }
        }
        this.distanceText.text = 'TOTAL DIST: '+String(this.totalDist);
    }

    display(bool) {
        this.show = bool;
    }

    startDrawing() {
        this.isDrawing=true;
        this.points.push(new Vertex(IN.getMouseX(),IN.getMouseY()))
        this.lastPoint = this.points[0];
    }

    endDrawing() {
        this.isDrawing=false;
    }

    draw(gui,camera) {
        this.drawGraphics.clear();
        if(!this.show) 
            return;
        var graphics = this.drawGraphics;
        graphics.lineStyle(3+Math.abs(Math.sin($engine.getGameTimer()/60)*7),0xffffff).moveTo(this.points[0].x,this.points[0].y);
        for(var i =1;i<this.points.length;i++) {
            graphics.lineTo(this.points[i].x,this.points[i].y)
        }

        graphics.lineStyle(Math.abs(Math.sin($engine.getGameTimer()/60)*2),0xaaaaaa).moveTo(this.points[0].x,this.points[0].y);
        for(var i =1;i<this.points.length;i++) {
            graphics.lineTo(this.points[i].x,this.points[i].y)
        }

        graphics.lineStyle(0,0xffffff)
        graphics.beginFill(0xffffff);
        graphics.drawCircle(this.points[0].x,this.points[0].y,(3+Math.abs(Math.sin($engine.getGameTimer()/60)*7))/2)
        graphics.drawCircle(this.points[this.points.length-1].x,this.points[this.points.length-1].y,(3+Math.abs(Math.sin($engine.getGameTimer()/60)*7))/2)
        graphics.drawCircle(this.points[0].x,this.points[0].y,Math.abs(Math.sin($engine.getGameTimer()/60)))
        graphics.drawCircle(this.points[this.points.length-1].x,this.points[this.points.length-1].y,Math.abs(Math.sin($engine.getGameTimer()/60)))
        graphics.endFill();
    }
}

class DrawController extends EngineInstance { // controls the minigame
    onEngineCreate() {

        this.instructiontext = $engine.createRenderable(this,new PIXI.Text('TIME REMAINING:', { font: 'bold italic 40px Arvo', fill: '#612669', align: 'center', stroke: '#410f49', strokeThickness: 4 }),false);
        this.instructiontext.anchor.x=0.5
        this.instructiontext.x = $engine.getWindowSizeX()/2;
        this.instructiontext.y = $engine.getWindowSizeY()-80;

        this.currentLine = undefined;
        this.drawings = [];
        this.drawingInd = -1;
        this.drawing = false;

        this.gameOverTimer=0;

        this.selectDrawings();
        this.nextDrawing();
        this.waitTimer = 0;

        this.timer = new MinigameTimer(60*25);
        this.timer.addOnTimerStopped(this, function(parent, bool) {
            if(parent.currentLine)
                parent.currentLine.endDrawing();
            while(!parent.done) {
                parent.nextDrawing();
            }
            parent.calcWin();
        })
    }

    calcWin() {
        var ts = 0;
        for(var i = 0;i<3;i++) {
            ts+=this.drawings[i].score;
        }
        ts/=3;
        if(ts>0.75) {
            $engine.setOutcomeWriteBackValue(ENGINE_RETURN.WIN);
        }
    }

    onCreate() {
        this.onEngineCreate();
    }

    selectDrawings() {
        for(var i =0;i<3;i++) {
            var ind = EngineUtils.irandomRange(1,3);
            this.drawings.push(new ShapeToDraw(ind));
        }
    }

    nextDrawing() {
        this.drawingInd++;
        if(this.drawingInd>0) {
            this.drawings[this.drawingInd-1].alpha = 0;
            this.drawings[this.drawingInd-1].calculateScore();
        }
        if(this.drawingInd>=3) {
            this.done = true;
            return;
        }
        this.drawings[this.drawingInd].alpha = 1;
        this.waitTimer = -9999999;
    }

    step() {
        if(IN.keyCheckPressed("KeyR")) {
            RoomManager.changeRooms(RoomManager.currentRoom().name)
        }

        if(!this.timer.stopped()) {
            this.waitTimer++;
            if(this.waitTimer<150) {
                if(this.waitTimer<=60) {
                    this.instructiontext.alpha=1;
                    this.instructiontext.text = "WAIT! " + String(60-this.waitTimer)
                } else {
                    this.instructiontext.text = "GO!!!!"
                    this.instructiontext.alpha = 1-(this.waitTimer-60)/40 + Math.sin(this.waitTimer/2)/2
                }
            } else {
                this.instructiontext.text = "";
            }
            if(IN.mouseCheckPressed(0) && this.waitTimer >=60) {
                this.currentLine = new DrawableLine()
                this.currentLine.startDrawing();
                this.drawings[this.drawingInd].line = this.currentLine;
                this.drawing = true;
            }

            if(IN.mouseCheckReleased(0) && this.drawing) {
                this.currentLine.endDrawing();
                this.currentLine.display(false);
                this.currentLine.distanceText.alpha = 0;
                this.drawing = false;
                this.nextDrawing();
                if(this.done) {
                    this.timer.stopTimer();
                }
                this.waitTimer=0;
            }
        
        } else {
            this.gameOverSummary();
        }
    }

    gameOverSummary() {
        this.gameOverTimer++;
        for(const draw of this.drawings) {
            draw.alpha = 0;
            if(draw.line) {
                draw.line.display(false);
                draw.line.distanceText.alpha = 0;
            }
        }
        var ind = Math.floor(this.gameOverTimer/200)
        if(ind>=3) {
            ind = 2;
            $engine.startFadeOut(30,false)
            SceneManager.pop();
        }
        var draw = this.drawings[ind];
        draw.alpha = 1;
        if(draw.line) {
            draw.line.display(true);
            draw.line.distanceText.alpha = 1;
        }
        this.instructiontext.alpha=1;
        this.instructiontext.text = "Summary: Drawing " + String(ind+1)+" -> Score = " +String(draw.score).substring(0,4);
    }
}

class ShapeToDraw extends EngineInstance {
    onEngineCreate() {
    }

    onCreate(index) {
        this.setSprite(new PIXI.Sprite($engine.getTexture("drawing_minigame_"+String(index))));
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/2;
        this.alpha = 0;
        this.pathData = ShapeToDraw.paths[index-1];
        this.score = 0;
        this.onEngineCreate();
    }

    calculateScore() {
        if(!this.line) {
            return;
        }
        var score = 0;
        for(var i =0;i<this.pathData.path.length-1;i++) {
            var dist = 99999;
            var l3 = new EngineLightweightPoint(this.pathData.path[i].x+this.x,this.pathData.path[i].y+this.y);
            var l4 = new EngineLightweightPoint(this.pathData.path[i+1].x+this.x,this.pathData.path[i+1].y+this.y);
            for(var z =0;z<this.line.points.length-1;z++) {
                dist = Math.min(dist,EngineUtils.distanceBetweenLines(this.line.points[z],this.line.points[z+1],l3,l4));
            }
            if(dist>=4) {
                score+=EngineUtils.clamp(1-(dist-4)/6,0,1) // extra dist / 6, 10px away = no points.
            } else {
                score++;
            }
        }

        score /= this.pathData.path.length;


        var distDiff = this.line.totalDist - this.pathData.dist;
        if(distDiff>25) {
            score = EngineUtils.clamp(score-(distDiff-25)/75,0,1) // can be at most 100 px longer than the src line.
        }

        console.log(score);

        this.score = EngineUtils.clamp(score,0,1);

    }
}
ShapeToDraw.paths = [];

ShapeToDraw.paths.push(
{path:[new Vertex(-88,-117),new Vertex(-73,-118),new Vertex(-57,-118),new Vertex(-39,-120),new Vertex(-28,-121),new Vertex(-6,-122),
    new Vertex(12,-124),new Vertex(32,-125),new Vertex(45,-124),new Vertex(70,-124),new Vertex(84,-123),new Vertex(104,-124),
    new Vertex(125,-124),new Vertex(124,-117),new Vertex(114,-101),new Vertex(100,-86),new Vertex(93,-76),new Vertex(83,-63),
    new Vertex(74,-51),new Vertex(80,-43),new Vertex(87,-32),new Vertex(95,-27),new Vertex(101,-14),new Vertex(109,-5),new Vertex(118,5),
    new Vertex(124,12),new Vertex(130,18),new Vertex(134,28),new Vertex(141,37),new Vertex(147,44),new Vertex(153,53),new Vertex(156,59),
    new Vertex(130,63),new Vertex(115,65),new Vertex(95,64),new Vertex(84,65),new Vertex(69,70),new Vertex(56,71),new Vertex(40,70),new Vertex(30,70),
    new Vertex(19,70),new Vertex(9,73),new Vertex(4,72),new Vertex(2,62),new Vertex(2,50),new Vertex(0,38),new Vertex(-1,29),new Vertex(-2,16),
    new Vertex(-3,8),new Vertex(-9,13),new Vertex(-17,26),new Vertex(-24,36),new Vertex(-35,47),new Vertex(-42,54),new Vertex(-47,63),new Vertex(-53,69),
    new Vertex(-59,74),new Vertex(-61,77),new Vertex(-69,73),new Vertex(-80,68),new Vertex(-86,62),new Vertex(-92,58),new Vertex(-98,52),new Vertex(-106,44),
    new Vertex(-111,38),new Vertex(-120,32),new Vertex(-125,26),new Vertex(-118,23),new Vertex(-109,16),new Vertex(-101,11),new Vertex(-96,7),new Vertex(-88,0),
    new Vertex(-86,-2),new Vertex(-94,-13),new Vertex(-101,-21),new Vertex(-108,-28),new Vertex(-113,-35),new Vertex(-118,-40),new Vertex(-124,-46),new Vertex(-130,-51),
    new Vertex(-135,-58),new Vertex(-138,-65),new Vertex(-139,-70),new Vertex(-130,-82),new Vertex(-120,-91),new Vertex(-110,-102),new Vertex(-104,-105),new Vertex(-93,-114),
    new Vertex(-88,-117)],dist:0},

{path:[new Vertex(16,-152),new Vertex(35,-146),new Vertex(41,-142),new Vertex(56,-134),new Vertex(70,-127),new Vertex(88,-114),new Vertex(100,-101),new Vertex(115,-86),
    new Vertex(124,-69),new Vertex(132,-54),new Vertex(137,-40),new Vertex(140,-20),new Vertex(141,-3),new Vertex(141,11),new Vertex(137,28),new Vertex(130,45),
    new Vertex(124,54),new Vertex(116,65),new Vertex(110,74),new Vertex(102,85),new Vertex(92,90),new Vertex(80,98),new Vertex(68,105),new Vertex(57,109),
    new Vertex(45,112),new Vertex(33,115),new Vertex(24,117),new Vertex(12,119),new Vertex(4,120),new Vertex(-9,121),new Vertex(-25,121),new Vertex(-35,118),
    new Vertex(-46,114),new Vertex(-58,108),new Vertex(-65,102),new Vertex(-81,89),new Vertex(-93,77),new Vertex(-99,67),new Vertex(-107,53),new Vertex(-110,42),
    new Vertex(-114,30),new Vertex(-118,16),new Vertex(-119,6),new Vertex(-122,-6),new Vertex(-123,-18),new Vertex(-120,-39),new Vertex(-118,-61),new Vertex(-113,-81),
    new Vertex(-100,-98),new Vertex(-89,-121),new Vertex(-79,-131),new Vertex(-62,-142),new Vertex(-46,-150),new Vertex(-35,-153),new Vertex(-23,-156),new Vertex(-11,-156),
    new Vertex(5,-156),new Vertex(16,-152)],dist:0},

{path:[new Vertex(-136,158),new Vertex(-136,147),new Vertex(-138,136),new Vertex(-137,118),new Vertex(-138,105),new Vertex(-138,91),new Vertex(-141,77),new Vertex(-140,62),
    new Vertex(-140,45),new Vertex(-141,28),new Vertex(-142,16),new Vertex(-140,1),new Vertex(-141,-16),new Vertex(-142,-38),new Vertex(-143,-57),new Vertex(-143,-71),
    new Vertex(-142,-84),new Vertex(-142,-99),new Vertex(-140,-113),new Vertex(-135,-125),new Vertex(-120,-132),new Vertex(-105,-135),new Vertex(-94,-130),
    new Vertex(-79,-123),new Vertex(-68,-115),new Vertex(-60,-103),new Vertex(-54,-92),new Vertex(-50,-79),new Vertex(-47,-65),new Vertex(-43,-44),
    new Vertex(-47,-21),new Vertex(-55,-2),new Vertex(-69,12),new Vertex(-81,18),new Vertex(-91,22),new Vertex(-105,28),new Vertex(-114,31),new Vertex(-127,32),
    new Vertex(-137,32),new Vertex(-119,53),new Vertex(-104,72),new Vertex(-86,94),new Vertex(-76,106),new Vertex(-69,116),new Vertex(-60,127),new Vertex(-50,140),
    new Vertex(-43,151),new Vertex(-35,160),new Vertex(-35,160)],dist:0}
)

for(const path of ShapeToDraw.paths) {
    var p = path.path;
    var len = p.length;
    var dist = 0;
    for(var i =0;i<len-1;i++) {
        dist+=V2D.distance(p[i].x,p[i].y,p[i+1].x,p[i+1].y);
    }
    path.dist=dist;
}

