class CardMinigameController extends EngineInstance { 

    onEngineCreate() { 
        /*
        this.depth = 0;
        this.x=0;
        this.y=0;
        this.xScale = 1;
        this.yScale = 1;
        this.alpha = 1;
        this.angle = 0;*/
        new CardPlayer($engine.getWindowSizeX()/2,$engine.getWindowSizeY());
    }

    onCreate() { // called when you construct the instance yourself
        this.onEngineCreate();
    }

    step() {
           
    }

}

class CardPlayer extends EngineInstance {
    onCreate() {
        
    }

    step() {
           
    }

}