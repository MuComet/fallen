class SiblingStoryController extends EngineInstance {
    onEngineCreate() {
        var arr = [];
        arr.push("")
        arr.push("__voice[voice_normal]__portrait[eson_profiles_1]__speed[3]\"Sara\".__wait[30]__speed[0]__noShift[1]__portrait[eson_profiles_0] Aww,__wait[9] what a beautiful name.")
        arr.push("__noShift[0]__portrait[eson_profiles_1]Hmm,__wait[12] it looks like there's something written on the back__speed[4]...__speed[0]__wait[30]__speed[1]\n\"Property of the Back Alley Gang\"?!\n__noShift[1]__portrait[eson_profiles_6]__wait[60]__break[]__speed[0]__portrait[eson_profiles_10]__wait[30] Welp,__wait[24] it looks like it's my property now!")
        arr.push("__portrait[<none>]__voice[]__noShift[0]__italic[1]__wait[30]+ 10 gold!")
        this.textBox = new TextBox(arr);
        $engine.activateAchievement("HIDDEN_TREASURE", function() { console.log("Success!")}, function(err) { console.log(err) })
        this.textBox.setWaiting(true)
        this.setSprite(new PIXI.Sprite($engine.getTexture("sibling")));
        this.x = $engine.getWindowSizeX()/2;
        this.y = 0;

        this.targetY = $engine.getWindowSizeY()/2-64;

        this.blurFilterStrength = 9.6666;
        this.blurFilter = new PIXI.filters.BlurFilter(8,4,3,15);

        this.getSprite().filters = [this.blurFilter]

        this.timer = 0;
        this.moveTime = 60;

        this.ending = false;
        this.endingTimer = 0;
    }

    step() {
        if(this.timer<=this.moveTime) {
            var fac1 = EngineUtils.interpolate(this.timer/this.moveTime,0,1,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.blurFilter.blur = this.blurFilterStrength * (1-fac1);
            this.y = $engine.getWindowSizeY() + 512 * (1-fac1) - $engine.getWindowSizeY()/2 * fac1;
            this.angle = 0.85 * (1-fac1)
        } else {
            var fac2 =EngineUtils.interpolate((this.timer-this.moveTime)/this.moveTime,$engine.getWindowSizeY()/2,this.targetY,EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
            this.y = fac2;

            if(!this.ending && (IN.keyCheckPressed("RPGok") || IN.mouseCheckPressed(0) || IN.keyCheck("RPGcontrol"))) {
                this.textBox.advance();
                if(!this.textBox.hasMoreText()) {
                    this.ending = true;
                    $gameParty.gainGold(10);
                }
            }
        }

        if(this.ending) {
            var fac1 = ++this.endingTimer/48
            var fac2 = EngineUtils.interpolate(fac1,this.targetY,$engine.getWindowSizeY() + 256,EngineUtils.INTERPOLATE_IN_BACK);
            var fac3 = EngineUtils.interpolate(fac1,0,1,EngineUtils.INTERPOLATE_IN_EXPONENTIAL);
            this.angle = -0.85 * fac3
            this.y = fac2;

            if(this.endingTimer===48) {
                $engine.endGame();
            }
        }

        if(this.timer===this.moveTime) {
            this.blurFilter.enabled=false;
            this.textBox.setWaiting(false);
            this.textBox.advance();
        }
        this.timer++;
    }

}