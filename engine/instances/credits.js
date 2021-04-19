
class CreditsController extends EngineInstance { // Thanks for playing!

    onEngineCreate() {
        super.onEngineCreate();        
        $engine.getCamera().setLocation(0, 0);
        //$engine.setBackgroundColour(0xafaa);
        this.startTime = 0;
        this.genericTimer = 0;
        this.setUpCredits();
        var snd = $engine.audioPlaySound("credits",1);
        $engine.audioSetLoopPoints(snd,8,56)
        $engine.startFadeIn();
    }

    makeTextRelative(text,relativeTo, yOffset, size) {
        var myText = $engine.createRenderable(this, new PIXI.Text("",$engine.getDefaultTextStyle()));
        myText.anchor.set(0.5,0.5);
        myText.x = $engine.getWindowSizeX()/2;
        myText.y = relativeTo.y + yOffset;
        myText.text = text;
        myText.style.fontSize = size;
        return myText
    }

    setUpCredits(){
        this.initialText = $engine.createRenderable(this, new PIXI.Text("A game by",$engine.getDefaultTextStyle()));
        this.initialText.style.fontSize = 32;
        this.initialText.x = $engine.getWindowSizeX()/2;
        this.initialText.y = $engine.getWindowSizeX()/3;
        this.initialText.anchor.set(0.5,0.5);
        this.Team = this.makeTextRelative("Main Street Games",this.initialText, 56, 56);

        // TEAM roles and names
        this.nextText = this.makeTextRelative("Producer and Senior Programmer", this.Team, 400, 32);
        this.nextText2 = this.makeTextRelative("Marcus Der",this.nextText,56,48);
        this.nextText3 = this.makeTextRelative("Lead Designer and Sound Design", this.nextText2, 140, 32);
        this.nextText4 = this.makeTextRelative("Jawdat Toume",this.nextText3,56,48);
        this.nextText5 = this.makeTextRelative("Overworld Programmer", this.nextText4, 140, 32);
        this.nextText6 = this.makeTextRelative("Ryan Haskins",this.nextText5,56,48);
        this.nextText7 = this.makeTextRelative("Minigames Programmer", this.nextText6, 140, 32);
        this.nextText8 = this.makeTextRelative("Yevhen Kaznovskyi",this.nextText7,56,48);
        this.nextText9 = this.makeTextRelative("Art and Design", this.nextText8, 140, 32);
        this.nextText10 = this.makeTextRelative("Ronan Sandoval",this.nextText9,56,48);
        this.nextText11 = this.makeTextRelative("Writing and Story", this.nextText10, 140, 32);
        this.nextText12 = this.makeTextRelative("Liisa Otchie",this.nextText11,56,48);
        this.nextText13 = this.makeTextRelative("Executive Producer", this.nextText12, 140, 32);
        this.nextText14 = this.makeTextRelative("Derek Kwan",this.nextText13,56,48);
        //==================================================================================================
        // References 
        this.nextText15 = this.makeTextRelative("Contains References To", this.nextText14, 300, 32);
        this.nextText16 = this.makeTextRelative("Back Alley Games",this.nextText15,56,40);
        this.nextText17 = this.makeTextRelative("Studio Scrum",this.nextText16,56,40);
        //==================================================================================================
        // Sound Credit
        this.nextText18 = this.makeTextRelative("Music and Sound Credit", this.nextText17, 200, 32);
        this.nextText19 = this.makeTextRelative("bigsoundbank.com",this.nextText18,56,40);
        this.nextText20 = this.makeTextRelative("freesound.org",this.nextText19,52,40);
        this.nextText21 = this.makeTextRelative("virtualplaying.com",this.nextText20,48,40);
        //==================================================================================================
        // Plugin Credits
        this.nextText22 = this.makeTextRelative("Plugin Credits", this.nextText21, 200, 32);
        this.nextText23 = this.makeTextRelative("Altimit",this.nextText22,56,40);
        this.nextText24 = this.makeTextRelative("Yanfly",this.nextText23,56,40);
        this.nextText25 = this.makeTextRelative("Quxios",this.nextText24,56,40);
        this.nextText26 = this.makeTextRelative("Biud436", this.nextText25,56,40);
        this.nextText27 = this.makeTextRelative("Galv",this.nextText26,56,40);
        this.nextText28 = this.makeTextRelative("SumRndmDde",this.nextText27,56,40);
        this.nextText29 = this.makeTextRelative("Neon Black",this.nextText28,56,40);
        this.nextText30 = this.makeTextRelative("Shaz (The RPG maker legend)", this.nextText29,56,40);
        this.nextText31 = this.makeTextRelative("Khaz",this.nextText30,56,40);
        this.nextText32 = this.makeTextRelative("Mr.Trivel",this.nextText31,56,40);
        this.nextText33 = this.makeTextRelative("Caethyril",this.nextText32,56,40);
        //==================================================================================================
        // PIXI
        this.nextText34 = this.makeTextRelative("Sound and Filter Tools", this.nextText33, 200, 32);
        this.nextText35 = this.makeTextRelative("PIXIJS",this.nextText34,56,40);
        //==================================================================================================
        // Special THANK
        this.nextText36 = this.makeTextRelative("Special Thanks", this.nextText35, 200, 32);
        this.nextText37 = this.makeTextRelative("CMPUT 250, Winter 2021",this.nextText36,56,40);
        this.nextText38 = this.makeTextRelative("Games Den",this.nextText37,56,40);
        this.nextText39 = this.makeTextRelative("JP High School",this.nextText38,56,40);
        this.nextText40 = this.makeTextRelative("Jawdat Toume for Fruit Game",this.nextText39,56,40);

        this.nextText41 = this.makeTextRelative("Thank YOU for playing Fallen!",this.nextText40,450,40);

        // borgir
        new RotatingSprite(this.nextText2.x + 290,this.nextText2.y,"credits_sheet_2")
        new RotatingSprite(this.nextText2.x - 250,this.nextText2.y-32,"credits_sheet_0")

        new RotatingSprite(this.nextText4.x - 330,this.nextText4.y-45,"credits_sheet_4")
        new RotatingSprite(this.nextText4.x - 240,this.nextText4.y+90,"credits_sheet_3")
        new RotatingSprite(this.nextText4.x + 280,this.nextText4.y+400,"credits_sheet_3")
        new RotatingSprite(this.nextText8.x - 180,this.nextText8.y+135,"credits_sheet_3")

        new RotatingSprite(this.nextText12.x +180,this.nextText12.y-32,"credits_sheet_1")

        new RotatingSprite(this.nextText14.x - 32,this.nextText14.y+145,"credits_sheet_3")

        new RotatingSprite(this.nextText15.x + 195,this.nextText15.y+32,"credits_sheet_0")
        new RotatingSprite(this.nextText15.x - 245,this.nextText15.y+145,"credits_sheet_3")

        new RotatingSprite(this.nextText24.x + 275,this.nextText24.y+32,"credits_sheet_3")
        new RotatingSprite(this.nextText35.x - 275,this.nextText35.y-64,"credits_sheet_3")


    }


    step() {
        super.step();
        this.startTime++;
        var moveFac = 0;
        if(this.startTime > 100){
            moveFac = EngineUtils.interpolate((this.startTime-100)/60,0,1.1,EngineUtils.INTERPOLATE_SMOOTH)
        }

        var diff = this.nextText41.y - $engine.getCamera().getY() - $engine.getWindowSizeY()/2;
        if(diff < 50) {
            moveFac = diff/50;
        }

        $engine.getCamera().translate(0,moveFac);
        if(diff<5) {
            this.genericTimer++;
        }

        if((this.genericTimer===240 || IN.anyStandardInputPressed()) && ! $engine.isBusy()) {
            $engine.fadeOutAll(120);
            $engine.audioFadeAll();
            $engine.setRoom("MenuIntro")
        }

    }
}

class RotatingSprite extends EngineInstance {
    onCreate(x,y, sprite) {
        this.xScale = 0.66666;
        this.yScale = 0.66666;
        this.x = x;
        this.y = y;
        this.changeTimer = EngineUtils.irandom(60);
        this.angle = EngineUtils.randomRange(-0.1,0.1)
        this.setSprite(new PIXI.Sprite($engine.getTexture(sprite)));
    }

    step() {
        if(--this.changeTimer<=0) {
            this.changeTimer=EngineUtils.irandomRange(18,60);
            this.angle = EngineUtils.randomRange(-0.1,0.1)
        }
    }
}