class TestInstance2 extends EngineInstance {
	onEngineCreate() {
		this.setSprite(new PIXI.Sprite($engine.getTexture("man")))
		this.velX = 0;
		this.accel = 1;
		this.setHitbox(new Hitbox(this, new RectangleHitbox(this,-25,-25,25,25)));
		this.grabbed = false;
}

onCreate() {
		this.onEngineCreate();
// do stuff
	
}

step() {

	if(IN.keyCheck("KeyA"))
		this.velX-=this.accel;
		if(IN.keyCheck("KeyD"))
		this.velX+=this.accel;
	this.x+=this.velX;
	if(this.x<0 || this.x > $engine.getWindowSizeX())
		this.velX = 0; 
	this.x = EngineUtils.clamp(this.x,0,$engine.getWindowSizeX())

	if(!this.grabbed && IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(),IN.getMouseY(),this)) {
		this.grabbed = true;
}

if(IN.mouseCheckReleased(0) && this.grabbed)
	this.grabbed = false;

if(this.grabbed) {
		this.x = IN.getMouseX();
this.y = IN.getMouseY();
}
}

draw(gui,camera) {
	EngineDebugUtils.drawHitbox(camera, this)
}
}