class DrawController extends MinigameController { // controls the minigame
    onEngineCreate() {
        // drawing minigame has 2 versions. the external data "version" will tell us which one we're doing.
        this.alternate = RoomManager.currentRoom().getExtern("version")[0]==="1";
        if(!this.alternate) {
            $engine.unlockMinigame(ENGINE_MINIGAMES.DRAW_1)
        } else {
            $engine.unlockMinigame(ENGINE_MINIGAMES.DRAW_2)
        }
            
        super.onEngineCreate();
        this.instructiontext = $engine.createRenderable(this,new PIXI.Text("WAIT! " + String(60), $engine.getDefaultSubTextStyle()),false);
        this.instructiontext.anchor.x=0.5
        this.instructiontext.x = $engine.getWindowSizeX()/2;
        this.instructiontext.y = $engine.getWindowSizeY()-80;

        
        if(!this.alternate){
            new ParallaxingBackground("background_wall_1");
        }else{
            new ParallaxingBackground("background_ground_1");
            this.setSprite(new PIXI.Sprite($engine.getTexture("background_drawing_paper")));
            this.depth = 100;
        }


        this.buffer = new BufferedMouseInput(0,30);

        this.currentLine = undefined;
        this.drawings = [];
        this.drawingInd = 0;
        this.drawing = false;

        this.totalScore=0;

        var text = new PIXI.Text("Click the mouse to start drawing, and make sure \n to HOLD, don't let go until you are done. \n Trace the entire outline of the shape.\n\n Make no extra lines in the process.\nThere are 3 drawings to trace in 20 sec.\n\nPress ENTER to cheat!",$engine.getDefaultTextStyle());
        this.setInstructionRenderable(text);
        this.setControls(false,true);
        this.setCheatTooltip("Snap time!");
        this.skipPregame();

        this.gameOverTimer=0;

        this.selectDrawings();
        
        this.drawingInd=-1;
        this.addOnGameStartCallback(this, function(self) {
            self.nextDrawing(); // for SE
            this.waitTimer = 0;
        })
        this.waitTimer = 0;

        this.startTimer(60*20) // Yevhen Note: changed the time down to 20* seconds zoom zoom zoom

        this.setPreventEndOnTimerExpire(true); // take direct control using below function

        this.getTimer().addOnTimerStopped(this, function(self) {
            self.finishMinigame();
        })

        $engine.setCeilTimescale(true)
    }

    finishMinigame() {
        if(this.currentLine && this.getTimer().isTimerDone()) { // interrupted a drawing, calc score
            this.currentLine.endDrawing();
            this.drawings[this.drawingInd].calculateScore();
        }
        var won = this.calcWin()>0.75;
        if(!won) {
            this.setLossReason("Try following the lines next time.")
        }
        if(!this.alternate && !this.hasCheated() && this.calcWin()>=0.9){
            $engine.activateAchievement("DRAW_1_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
        }
        if(this.alternate && !this.hasCheated() && this.getTimer().getTimeRemaining() >= 360){
            $engine.activateAchievement("DRAW_2_MINIGAME", function() { console.log("Success!")}, function(err) { console.log(err) })
        }
        this.endMinigame(won);
        if(!this.alternate)
            $engine.getSaveData().drawingMinigameResult = won;
    }

    calcWin() {
        for(var i = 0;i<3;i++) {
            if(this.hasCheated())
                this.totalScore+=this.drawings[i].baseScore;
            else
                this.totalScore+=this.drawings[i].score;
        }
        this.totalScore/=3;
        return this.totalScore;
    }

    onCreate() {
        this.onEngineCreate();
    }

    selectDrawings() {
        if(!this.alternate) {
            $engine.getSaveData().drawingMinigameLines = {};
            $engine.getSaveData().drawingMinigameLines.data=[];
        }
        var add = this.alternate ? 6 : 0
        for(var i =0;i<3;i++) {
            var ind = EngineUtils.irandom(1)+add+i*2;
            this.drawings.push(new ShapeToDraw(ind));
        }
    }

    nextDrawing() {
        this.drawingInd++;
        if(this.drawingInd>0) {
            this.drawings[this.drawingInd-1].hideDrawing();
            this.drawings[this.drawingInd-1].calculateScore();
        }
        if(this.drawingInd>=3) {
            this.done = true;
            return;
        }
        $engine.audioPlaySound("draw_start")
        $engine.audioPlaySound("draw_shake",1,true)
        this.drawings[this.drawingInd].showDrawing();
    }

    step() {
        super.step();
        if(this.minigameOver())
            return;

        this.waitTimer++;
        if(this.waitTimer<150) {
            if(this.waitTimer<=60) {
                this.instructiontext.alpha=1;
                this.instructiontext.text = "WAIT! " + String(60-this.waitTimer)
            } else {
                this.instructiontext.text = "GO!!!!"
                this.instructiontext.alpha = 1-(this.waitTimer-60)/40 + Math.sin(this.waitTimer/2)/2
                $engine.audioStopSound("draw_shake");
            }
        } else {
            this.instructiontext.text = "";
        }

        // start drawing
        if(this.waitTimer >=60 && !this.drawing && this.buffer.consumeImmedaitely() && IN.mouseInBounds()) {
            this.currentLine = new DrawableLine()
            this.currentLine.drawing = this.drawings[this.drawingInd];
            this.drawings[this.drawingInd].line = this.currentLine;
            this.drawing = true;
            this.currentLine.startDrawing();
        }

        // end drawiing
        if(IN.mouseCheckReleased(0) && this.drawing) {
            this.currentLine.endDrawing();
            this.currentLine.display(false);
            this.drawing = false;
            this.nextDrawing();
            if(this.done) {
                this.finishMinigame();
            }
            this.waitTimer=0;
        }
    }

    onMinigameComplete(frames) {
        for(const draw of this.drawings) {
            draw.alpha = 0;
            if(draw.line) {
                draw.line.display(false);
            }
        }
        var ind = Math.floor(frames/120)
        if(ind>=3) {
            ind = 2;
            this.advanceGameOver();
        }
        var draw = this.drawings[ind];
        draw.alpha = 1;
        if(draw.line) {
            draw.line.display(true);
            //draw.line.distanceText.alpha = 1;
        }
        this.instructiontext.alpha=1;
        if(this.hasCheated()) {
            this.instructiontext.text = "Summary: Drawing " + String(ind+1)+" -> Score = " +String(draw.baseScore).substring(0,4);
        } else {
            this.instructiontext.text = "Summary: Drawing " + String(ind+1)+" -> Score = " +String(draw.score).substring(0,4) + "\n("+
                                String(draw.baseScore).substring(0,4)+" accuracy - "+String(draw.basePenalty).substring(0,4) +" extra distance "+")";
        }
    }

    notifyFramesSkipped(frames) {
        this.getTimer().tickDown(frames);
    }

    draw(gui, camera) {
        super.draw(gui, camera);
        $engine.requestRenderOnCamera(this.instructiontext);
    }

}

class DrawableLine extends EngineInstance {
    onEngineCreate() {
        this.drawGraphics = $engine.createRenderable(this,new PIXI.Graphics(),false);
        this.isDrawing = false;
        this.points = [];
        this.lastPoint = undefined;
        this.totalDist = 0;
        this.score=0;
        this.show = true;
    }

    onCreate() {
        this.onEngineCreate();
    }

    step() {
        if(this.isDrawing) {
            var point = new EngineLightweightPoint(IN.getMouseX(),IN.getMouseY());
            if(DrawController.getInstance().hasCheated()) {
                point = this.nearestPositionOnDrawing(point)
            }
            var dist = V2D.distance(point.x,point.y,this.lastPoint.x,this.lastPoint.y)
            if(dist>3.5) {// arbitrary to prevent mASSIVE overdraw
                this.points.push(point);
                this.totalDist+=dist;
                this.lastPoint=point;
            }
        }
    }

    nearestPositionOnDrawing(point) {
        var nDist = 9999999;
        var t = -1;
        var p1 = point;
        for(var i =0;i<this.drawing.pathData.path.length-1;i++) {
            var l1 = new EngineLightweightPoint(this.drawing.pathData.path[i].x+this.drawing.x,this.drawing.pathData.path[i].y+this.drawing.y);
            var l2 = new EngineLightweightPoint(this.drawing.pathData.path[i+1].x+this.drawing.x,this.drawing.pathData.path[i+1].y+this.drawing.y);
            var nearest = EngineUtils.nearestPositionOnLine(point,l1,l2)
            t = V2D.distanceSq(point.x,point.y,nearest.x,nearest.y)
            if(t<nDist) {
                nDist=t;
                p1 = nearest;
            }
        }
        return p1;
    }

    display(bool) {
        this.show = bool;
    }

    startDrawing() {
        this.isDrawing=true;
        var point = new EngineLightweightPoint(IN.getMouseX(),IN.getMouseY());
        if(DrawController.getInstance().hasCheated()) {
            point = this.nearestPositionOnDrawing(point)
        }
        this.points.push(point);
        this.lastPoint = this.points[0];
        $engine.audioPlaySound("draw_spray",1,true)
    }

    endDrawing() {
        this.isDrawing=false;
        $engine.audioStopSound("draw_spray")
    }

    draw(gui,camera) {
        this.drawGraphics.clear();
        if(!this.show) 
            return;
        var graphics = this.drawGraphics;

        var alternate = DrawController.getInstance().alternate;
        var colourOuter = alternate ? 0xff1212 : 0xdfdfdf
        var colourInner = alternate ? 0xcf0909 : 0xbfbfbf

        if(!$engine.isLow()) {
            graphics.moveTo(this.points[0].x,this.points[0].y);
            graphics.lineStyle(12,colourOuter)
            for(var i =1;i<this.points.length-1;i++) {
                var xc = (this.points[i].x + this.points[i + 1].x) / 2;
                var yc = (this.points[i].y + this.points[i + 1].y) / 2;
                graphics.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
            }
            graphics.lineTo(this.points[this.points.length-1].x,this.points[this.points.length-1].y)

            graphics.moveTo(this.points[0].x,this.points[0].y);
            graphics.lineStyle(4,colourInner)
            for(var i =1;i<this.points.length-1;i++) {
                var xc = (this.points[i].x + this.points[i + 1].x) / 2;
                var yc = (this.points[i].y + this.points[i + 1].y) / 2;
                graphics.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
            }
            graphics.lineTo(this.points[this.points.length-1].x,this.points[this.points.length-1].y)
        } else {
            graphics.lineStyle(5,0xffffff).moveTo(this.points[0].x,this.points[0].y);
            for(var i =1;i<this.points.length;i++) {
                graphics.lineTo(this.points[i].x, this.points[i].y, xc, yc);
            }
        }

        graphics.lineStyle(0,colourOuter)
        graphics.beginFill(colourOuter);
        graphics.drawCircle(this.points[0].x,this.points[0].y,5)
        graphics.drawCircle(this.points[this.points.length-1].x,this.points[this.points.length-1].y,5)
        graphics.endFill();
    }
}

class ShapeToDraw extends EngineInstance {
    onEngineCreate() {
    }

    onCreate(index) {
        this.setSprite(new PIXI.Sprite($engine.getTexture("drawing_objects_"+String(index))));
        this.x = $engine.getWindowSizeX()/2;
        this.y = $engine.getWindowSizeY()/2;
        this.alpha = 0;
        this.pathData = ShapeToDraw.paths[index];

        if(!DrawController.getInstance().alternate){
            this.saveDataArrayIndex = $engine.getSaveData().drawingMinigameLines.data.length;
            $engine.getSaveData().drawingMinigameLines.data.push({
                index:index,
                line:[],
                distance:-1
            });
        }
        
        this.basePenalty=0;
        this.baseScore=0;
        this.score = 0;
        this.graphicsMask = $engine.createRenderable(this, new PIXI.Graphics(),true);
        var pz = this.pathData.path[0];
        this.graphicsMask.moveTo(pz.x,pz.y);
        this.onEngineCreate();
        this.setupTimer = 0;
        this.lastIdx = 0;
        this.inTime = 60;
        this.showing = false;
    }

    showDrawing() {
        this.alpha = 1;
        this.showing = true;
        this.getSprite().mask = this.graphicsMask;
    }

    hideDrawing() {
        this.alpha = 0;
        this.showing = false;
        this.getSprite().mask = undefined;
        this.graphicsMask.visible = false;
    }

    step() {
        
        if(this.setupTimer === this.inTime) {
            this.getSprite().mask = undefined;
            this.graphicsMask.visible = false;
        }
        if(this.setupTimer>=this.inTime || !this.showing){
            return;
        }
        var newLoc = EngineUtils.interpolate(++this.setupTimer/this.inTime,0,this.pathData.path.length,EngineUtils.INTERPOLATE_SMOOTH_QUAD);
        var newLocFloor = Math.floor(newLoc)

        this.graphicsMask.beginFill(0xffffff);
        for(var i = this.lastIdx;i<newLocFloor;i++) {
            var loc = this.pathData.path[i];
            this.graphicsMask.drawCircle(loc.x,loc.y,10)
        }

        if(newLocFloor<this.pathData.path.length-1) { //only if we're not on the last one
            var fac = newLoc%1;
            var loc1 = this.pathData.path[newLocFloor];
            var loc2 = this.pathData.path[newLocFloor+1];
            var ix = EngineUtils.interpolate(fac,loc1.x,loc2.x,EngineUtils.INTERPOLATE_LINEAR)
            var iy = EngineUtils.interpolate(fac,loc1.y,loc2.y,EngineUtils.INTERPOLATE_LINEAR)
            this.graphicsMask.drawCircle(ix,iy,10)
        }
        
        this.lastIdx=newLocFloor;
    }

    calculateScore() {
        this.score = 0;
        this.basePenalty = 0;
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
                score+=EngineUtils.clamp(1-(dist-4)/8,0,1) // extra dist / 8, 10px away = no points.
            } else {
                score++;
            }
        }

        score /= (this.pathData.path.length-1);

        this.baseScore = score;


        var distDiff = this.line.totalDist - this.pathData.dist;
        var maxExtra = 25;
        var extraDiv = 75;
        this.basePenalty = 0;
        if(distDiff>maxExtra) {
            var penalty = EngineUtils.clamp((distDiff-maxExtra)/extraDiv,0,1);
            penalty = EngineUtils.clamp(penalty,0,score); // don't take away more than we have.
            this.basePenalty = penalty;
            score = EngineUtils.clamp(score-penalty,0,1)
        }
        this.score = EngineUtils.clamp(score,0,1);

        if(!DrawController.getInstance().alternate){
            if(this.line) {
                $engine.getSaveData().drawingMinigameLines.data[this.saveDataArrayIndex].line = this.line.points;
                $engine.getSaveData().drawingMinigameLines.data[this.saveDataArrayIndex].distance = this.line.totalDist;
            }/* else {
                $engine.getSaveData().drawingMinigameLines.data[this.saveDataArrayIndex].line = this.pathData.path;
                $engine.getSaveData().drawingMinigameLines.data[this.saveDataArrayIndex].distance = this.pathData.dist;
            }*/
        }
    }
}
ShapeToDraw.paths = [];

// it hurts.
ShapeToDraw.paths.push(

    {path: [new Vertex(-127,41),new Vertex(-118,27),new Vertex(-110,13),new Vertex(-102,0),new Vertex(-93,-13),new Vertex(-85,-27),new Vertex(-77,-40),
    new Vertex(-68,-54),new Vertex(-60,-68),new Vertex(-52,-81),new Vertex(-43,-95),new Vertex(-35,-109),new Vertex(-27,-122),new Vertex(-18,-136),
    new Vertex(-10,-150),new Vertex(-2,-136),new Vertex(5,-122),new Vertex(14,-109),new Vertex(22,-95),new Vertex(30,-81),new Vertex(38,-68),
    new Vertex(47,-54),new Vertex(55,-40),new Vertex(63,-26),new Vertex(71,-13),new Vertex(80,0),new Vertex(88,14),new Vertex(96,27),
    new Vertex(104,41),new Vertex(111,52),new Vertex(95,52),new Vertex(79,52),new Vertex(63,52),new Vertex(47,52),new Vertex(31,52),
    new Vertex(15,52),new Vertex(0,52),new Vertex(-16,52),new Vertex(-32,52),new Vertex(-48,53),new Vertex(-64,53),new Vertex(-80,53),
    new Vertex(-96,53),new Vertex(-111,53)], dist:0},

    {path: [new Vertex(-47,126),new Vertex(-39,111),new Vertex(-30,98),new Vertex(-21,85),new Vertex(-12,72),new Vertex(-3,58),new Vertex(6,46),
    new Vertex(15,33),new Vertex(25,20),new Vertex(34,7),new Vertex(43,-5),new Vertex(52,-18),new Vertex(59,-33),new Vertex(56,-38),
    new Vertex(44,-40),new Vertex(28,-38),new Vertex(12,-37),new Vertex(-3,-35),new Vertex(-19,-34),new Vertex(-35,-33),new Vertex(-51,-32),
    new Vertex(-67,-32),new Vertex(-83,-32),new Vertex(-95,-32),new Vertex(-98,-35),new Vertex(-96,-42),new Vertex(-87,-54),new Vertex(-77,-67),
    new Vertex(-67,-80),new Vertex(-57,-92),new Vertex(-48,-105),new Vertex(-38,-118),new Vertex(-28,-131),new Vertex(-19,-144),new Vertex(-10,-157),
    new Vertex(-1,-170),new Vertex(7,-183)], dist:0},
    
    {path: [new Vertex(-46,103),new Vertex(-58,92),new Vertex(-70,82),new Vertex(-82,71),new Vertex(-93,60),new Vertex(-105,49),new Vertex(-116,38),
    new Vertex(-126,25),new Vertex(-136,13),new Vertex(-146,0),new Vertex(-153,-13),new Vertex(-159,-28),new Vertex(-164,-44),new Vertex(-165,-59),
    new Vertex(-165,-75),new Vertex(-164,-91),new Vertex(-159,-107),new Vertex(-153,-122),new Vertex(-145,-135),new Vertex(-132,-145),new Vertex(-118,-153),
    new Vertex(-103,-157),new Vertex(-87,-156),new Vertex(-72,-149),new Vertex(-60,-139),new Vertex(-50,-127),new Vertex(-42,-113),new Vertex(-35,-98),
    new Vertex(-30,-90),new Vertex(-26,-88),new Vertex(-23,-88),new Vertex(-20,-90),new Vertex(-13,-104),new Vertex(-7,-119),new Vertex(2,-132),
    new Vertex(12,-144),new Vertex(26,-153),new Vertex(41,-157),new Vertex(57,-155),new Vertex(72,-150),new Vertex(85,-140),new Vertex(96,-129),
    new Vertex(104,-115),new Vertex(109,-100),new Vertex(111,-84),new Vertex(112,-68),new Vertex(112,-52),new Vertex(110,-36),new Vertex(106,-21),
    new Vertex(99,-6),new Vertex(90,6),new Vertex(81,19),new Vertex(71,31),new Vertex(60,43),new Vertex(48,54),new Vertex(37,65),new Vertex(25,76),
    new Vertex(12,86),new Vertex(0,96),new Vertex(-11,103)], dist:0},
    
    {path: [new Vertex(-87,-22),new Vertex(-86,-37),new Vertex(-83,-53),new Vertex(-77,-68),new Vertex(-69,-82),new Vertex(-60,-95),new Vertex(-55,-98),
    new Vertex(-52,-99),new Vertex(-48,-84),new Vertex(-45,-68),new Vertex(-38,-54),new Vertex(-32,-46),new Vertex(-29,-44),new Vertex(-25,-60),
    new Vertex(-22,-76),new Vertex(-20,-92),new Vertex(-19,-107),new Vertex(-18,-123),new Vertex(-19,-139),new Vertex(-20,-155),new Vertex(-22,-171),
    new Vertex(-23,-177),new Vertex(-21,-180),new Vertex(-11,-168),new Vertex(-2,-155),new Vertex(5,-141),new Vertex(13,-127),new Vertex(19,-112),
    new Vertex(24,-97),new Vertex(29,-82),new Vertex(33,-66),new Vertex(36,-52),new Vertex(37,-43),new Vertex(44,-58),new Vertex(51,-72),
    new Vertex(59,-86),new Vertex(68,-99),new Vertex(78,-111),new Vertex(91,-121),new Vertex(95,-122),new Vertex(95,-119),new Vertex(90,-103),
    new Vertex(87,-88),new Vertex(85,-72),new Vertex(85,-56),new Vertex(85,-40),new Vertex(87,-24),new Vertex(87,-8),new Vertex(87,7),new Vertex(84,23),
    new Vertex(78,37),new Vertex(67,50),new Vertex(55,60),new Vertex(41,68),new Vertex(26,74),new Vertex(11,76),new Vertex(-4,76),new Vertex(-20,73),
    new Vertex(-36,69),new Vertex(-50,61),new Vertex(-61,50),new Vertex(-70,37),new Vertex(-75,22),new Vertex(-78,9)], dist:0},
    
    {path: [new Vertex(61,65),new Vertex(53,50),new Vertex(46,36),new Vertex(39,22),new Vertex(32,7),new Vertex(26,-6),new Vertex(19,-21),new Vertex(12,-36),
    new Vertex(6,-50),new Vertex(0,-65),new Vertex(-6,-79),new Vertex(-13,-94),new Vertex(-19,-109),new Vertex(-26,-123),new Vertex(-33,-138),new Vertex(-35,-142),
    new Vertex(-41,-127),new Vertex(-46,-112),new Vertex(-51,-97),new Vertex(-56,-82),new Vertex(-62,-67),new Vertex(-67,-52),new Vertex(-73,-37),
    new Vertex(-78,-22),new Vertex(-84,-7),new Vertex(-91,7),new Vertex(-97,22),new Vertex(-103,36),new Vertex(-110,51),new Vertex(-112,56),
    new Vertex(-98,47),new Vertex(-85,38),new Vertex(-72,29),new Vertex(-59,20),new Vertex(-46,11),new Vertex(-32,2),new Vertex(-19,-6),new Vertex(-5,-14),
    new Vertex(7,-23),new Vertex(21,-31),new Vertex(34,-40),new Vertex(47,-50),new Vertex(60,-59),new Vertex(73,-68),new Vertex(75,-74),new Vertex(71,-77),
    new Vertex(55,-78),new Vertex(39,-79),new Vertex(23,-79),new Vertex(7,-79),new Vertex(-8,-78),new Vertex(-24,-78),new Vertex(-40,-77),new Vertex(-56,-76),
    new Vertex(-72,-75),new Vertex(-88,-74),new Vertex(-104,-74),new Vertex(-120,-74),new Vertex(-130,-73),new Vertex(-120,-61),new Vertex(-110,-49),
    new Vertex(-98,-38),new Vertex(-86,-27),new Vertex(-74,-17),new Vertex(-62,-6),new Vertex(-49,3),new Vertex(-37,12),new Vertex(-24,22),new Vertex(-11,32),
    new Vertex(0,42),new Vertex(13,51),new Vertex(26,61),new Vertex(37,71)], dist:0},
    
    {path: [new Vertex(-15,-39),new Vertex(-4,-36),new Vertex(3,-38),new Vertex(15,-49),new Vertex(21,-64),new Vertex(19,-79),new Vertex(7,-90),new Vertex(-8,-95),
    new Vertex(-24,-94),new Vertex(-39,-89),new Vertex(-52,-80),new Vertex(-64,-70),new Vertex(-74,-57),new Vertex(-80,-42),new Vertex(-83,-26),
    new Vertex(-81,-10),new Vertex(-74,3),new Vertex(-65,16),new Vertex(-52,26),new Vertex(-38,34),new Vertex(-22,37),new Vertex(-7,39),
    new Vertex(8,37),new Vertex(24,33),new Vertex(38,26),new Vertex(52,18),new Vertex(65,9),new Vertex(75,-2),new Vertex(84,-16),new Vertex(91,-30),
    new Vertex(95,-46),new Vertex(98,-61),new Vertex(99,-77),new Vertex(95,-93),new Vertex(89,-108),new Vertex(80,-121),new Vertex(70,-133),
    new Vertex(57,-143),new Vertex(43,-151),new Vertex(29,-158),new Vertex(13,-162),new Vertex(-2,-164),new Vertex(-17,-166),new Vertex(-33,-165),
    new Vertex(-49,-162),new Vertex(-64,-157),new Vertex(-79,-151),new Vertex(-93,-143),new Vertex(-106,-133),new Vertex(-117,-122),new Vertex(-128,-110),
    new Vertex(-138,-97),new Vertex(-146,-84),new Vertex(-152,-69),new Vertex(-156,-53),new Vertex(-159,-38),new Vertex(-160,-22),new Vertex(-159,-6),
    new Vertex(-157,9),new Vertex(-153,25),new Vertex(-147,39),new Vertex(-140,54),new Vertex(-130,66),new Vertex(-119,78),new Vertex(-108,90),
    new Vertex(-94,98),new Vertex(-80,104),new Vertex(-65,110),new Vertex(-49,115),new Vertex(-34,117),new Vertex(-18,120),new Vertex(-2,121),new Vertex(13,121),
    new Vertex(29,120),new Vertex(45,117),new Vertex(60,113),new Vertex(76,109),new Vertex(89,104)], dist:0},
    
    {path: [new Vertex(103,-130),new Vertex(87,-130),new Vertex(71,-130),new Vertex(55,-130),new Vertex(39,-130),new Vertex(23,-130),new Vertex(7,-130),new Vertex(-8,-130),
    new Vertex(-24,-130),new Vertex(-40,-130),new Vertex(-56,-130),new Vertex(-72,-130),new Vertex(-88,-130),new Vertex(-104,-130),new Vertex(-120,-129),
    new Vertex(-128,-129),new Vertex(-117,-118),new Vertex(-105,-107),new Vertex(-94,-96),new Vertex(-83,-84),new Vertex(-71,-73),new Vertex(-60,-62),
    new Vertex(-49,-50),new Vertex(-37,-39),new Vertex(-26,-28),new Vertex(-18,-20),new Vertex(-29,-9),new Vertex(-41,2),new Vertex(-52,13),new Vertex(-63,24),
    new Vertex(-75,36),new Vertex(-86,47),new Vertex(-97,58),new Vertex(-109,70),new Vertex(-120,81),new Vertex(-127,89),new Vertex(-111,89),new Vertex(-95,89),
    new Vertex(-79,89),new Vertex(-63,89),new Vertex(-47,89),new Vertex(-31,89),new Vertex(-15,89),new Vertex(0,89),new Vertex(16,89),new Vertex(32,89),
    new Vertex(48,89),new Vertex(64,89),new Vertex(80,89),new Vertex(96,89),new Vertex(104,90)], dist:0},
    
    {path: [new Vertex(-184,17),new Vertex(-177,31),new Vertex(-170,45),new Vertex(-163,60),new Vertex(-156,74),new Vertex(-150,89),new Vertex(-147,94),new Vertex(-144,81),
    new Vertex(-141,65),new Vertex(-138,49),new Vertex(-136,34),new Vertex(-133,18),new Vertex(-130,2),new Vertex(-127,-13),new Vertex(-124,-28),new Vertex(-121,-44),
    new Vertex(-118,-60),new Vertex(-115,-75),new Vertex(-112,-91),new Vertex(-109,-107),new Vertex(-107,-111),new Vertex(-91,-111),new Vertex(-75,-111),
    new Vertex(-59,-111),new Vertex(-43,-111),new Vertex(-27,-111),new Vertex(-11,-111),new Vertex(4,-111),new Vertex(20,-111),new Vertex(36,-111),new Vertex(52,-111),
    new Vertex(68,-111),new Vertex(84,-111),new Vertex(100,-111),new Vertex(116,-111),new Vertex(132,-111),new Vertex(148,-111),new Vertex(153,-112)], dist:0},
    
    {path: [new Vertex(-38,-10),new Vertex(-49,1),new Vertex(-61,11),new Vertex(-74,21),new Vertex(-88,28),new Vertex(-103,34),new Vertex(-119,37),new Vertex(-135,38),
    new Vertex(-151,38),new Vertex(-166,35),new Vertex(-181,30),new Vertex(-195,21),new Vertex(-206,10),new Vertex(-215,-2),new Vertex(-220,-17),
    new Vertex(-222,-33),new Vertex(-218,-49),new Vertex(-211,-63),new Vertex(-200,-75),new Vertex(-187,-85),new Vertex(-172,-91),new Vertex(-157,-93),
    new Vertex(-141,-93),new Vertex(-125,-91),new Vertex(-109,-87),new Vertex(-94,-81),new Vertex(-80,-74),new Vertex(-67,-65),new Vertex(-54,-55),
    new Vertex(-42,-45),new Vertex(-30,-34),new Vertex(-19,-23),new Vertex(-7,-12),new Vertex(5,-3),new Vertex(18,6),new Vertex(32,14),new Vertex(46,21),
    new Vertex(61,27),new Vertex(76,32),new Vertex(91,36),new Vertex(107,37),new Vertex(123,37),new Vertex(139,32),new Vertex(153,24),new Vertex(165,14),
    new Vertex(173,0),new Vertex(178,-14),new Vertex(180,-30),new Vertex(178,-46),new Vertex(173,-61),new Vertex(164,-74),new Vertex(152,-85),new Vertex(139,-94),
    new Vertex(124,-99),new Vertex(108,-101),new Vertex(92,-100),new Vertex(76,-97),new Vertex(61,-91),new Vertex(47,-85),new Vertex(33,-76),new Vertex(20,-67),
    new Vertex(9,-56),new Vertex(-1,-44),new Vertex(-9,-33)], dist:0},
    
    {path: [new Vertex(-108,133),new Vertex(-103,132),new Vertex(-92,140),new Vertex(-87,141),new Vertex(-80,136),new Vertex(-77,120),new Vertex(-77,104),new Vertex(-77,88),
    new Vertex(-77,72),new Vertex(-77,56),new Vertex(-76,40),new Vertex(-76,24),new Vertex(-75,8),new Vertex(-75,-7),new Vertex(-74,-23),new Vertex(-73,-39),
    new Vertex(-72,-55),new Vertex(-72,-71),new Vertex(-71,-87),new Vertex(-69,-103),new Vertex(-66,-119),new Vertex(-62,-134),new Vertex(-56,-149),new Vertex(-48,-163),
    new Vertex(-37,-174),new Vertex(-23,-182),new Vertex(-7,-186),new Vertex(8,-186),new Vertex(23,-181),new Vertex(36,-172),new Vertex(48,-161),new Vertex(56,-147),
    new Vertex(59,-131),new Vertex(58,-115),new Vertex(53,-100),new Vertex(44,-87),new Vertex(32,-76),new Vertex(19,-67),new Vertex(5,-60),new Vertex(-8,-52),
    new Vertex(-20,-49),new Vertex(-28,-48),new Vertex(-16,-47),new Vertex(0,-47),new Vertex(15,-46),new Vertex(31,-42),new Vertex(45,-35),new Vertex(58,-26),
    new Vertex(69,-15),new Vertex(76,0),new Vertex(80,14),new Vertex(80,30),new Vertex(77,46),new Vertex(68,59),new Vertex(57,71),new Vertex(43,79),
    new Vertex(28,85),new Vertex(12,87),new Vertex(-3,87),new Vertex(-19,85),new Vertex(-33,78),new Vertex(-41,72)], dist:0},
    
    {path: [new Vertex(49,20),new Vertex(52,30),new Vertex(49,46),new Vertex(43,61),new Vertex(33,74),new Vertex(22,85),new Vertex(10,95),new Vertex(-3,103),
    new Vertex(-19,108),new Vertex(-35,109),new Vertex(-51,108),new Vertex(-66,104),new Vertex(-80,95),new Vertex(-91,84),new Vertex(-101,71),
    new Vertex(-106,56),new Vertex(-106,40),new Vertex(-102,24),new Vertex(-94,10),new Vertex(-84,-1),new Vertex(-72,-12),new Vertex(-59,-21),
    new Vertex(-46,-30),new Vertex(-33,-39),new Vertex(-20,-49),new Vertex(-11,-62),new Vertex(-4,-76),new Vertex(-2,-92),new Vertex(-5,-108),
    new Vertex(-12,-122),new Vertex(-23,-134),new Vertex(-36,-144),new Vertex(-52,-147),new Vertex(-64,-146),new Vertex(-75,-136),new Vertex(-80,-123),
    new Vertex(-79,-107),new Vertex(-75,-92),new Vertex(-69,-77),new Vertex(-62,-63),new Vertex(-55,-48),new Vertex(-47,-34),new Vertex(-39,-20),
    new Vertex(-31,-7),new Vertex(-22,6),new Vertex(-14,19),new Vertex(-5,33),new Vertex(3,46),new Vertex(12,59),new Vertex(21,72),new Vertex(30,85),
    new Vertex(40,98),new Vertex(50,110),new Vertex(61,122),new Vertex(68,128)], dist:0},
    
    {path: [new Vertex(-56,144),new Vertex(-49,158),new Vertex(-39,168),new Vertex(-32,170),new Vertex(-22,168),new Vertex(-11,157),new Vertex(-5,142),
    new Vertex(-2,126),new Vertex(0,110),new Vertex(0,94),new Vertex(0,78),new Vertex(-2,63),new Vertex(-3,47),new Vertex(-5,31),new Vertex(-7,15),
    new Vertex(-9,0),new Vertex(-11,-16),new Vertex(-14,-32),new Vertex(-17,-47),new Vertex(-20,-63),new Vertex(-23,-79),new Vertex(-27,-94),
    new Vertex(-31,-110),new Vertex(-34,-125),new Vertex(-38,-141),new Vertex(-42,-157),new Vertex(-43,-167),new Vertex(-41,-174),new Vertex(-36,-180),
    new Vertex(-30,-183),new Vertex(-21,-183),new Vertex(-13,-179),new Vertex(-1,-169),new Vertex(6,-155),new Vertex(10,-140),new Vertex(10,-124),
    new Vertex(7,-108),new Vertex(0,-94),new Vertex(-10,-82),new Vertex(-21,-71),new Vertex(-34,-61),new Vertex(-46,-51),new Vertex(-58,-39),
    new Vertex(-68,-27),new Vertex(-78,-15),new Vertex(-85,0),new Vertex(-90,14),new Vertex(-94,29),new Vertex(-95,45),new Vertex(-93,61),
    new Vertex(-87,76),new Vertex(-78,89),new Vertex(-65,98),new Vertex(-50,104),new Vertex(-34,108),new Vertex(-18,108),new Vertex(-2,105),new Vertex(12,101),
    new Vertex(26,93),new Vertex(37,81),new Vertex(47,69),new Vertex(53,54),new Vertex(54,38),new Vertex(50,23),new Vertex(42,9),new Vertex(29,0),
    new Vertex(14,-6),new Vertex(-1,-6),new Vertex(-16,-2),new Vertex(-30,5),new Vertex(-42,16),new Vertex(-44,24),new Vertex(-45,30),new Vertex(-43,36),
    new Vertex(-41,39),new Vertex(-32,43)], dist:0}
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

