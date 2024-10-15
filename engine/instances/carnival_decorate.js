class CarnivalDecorateController extends EngineInstance {
	onEngineCreate() {
		var background = new EmptyInstance($engine.getTexture("carnival_background"));
		background.xScale = 0.12;
		background.yScale = 0.12;
		background.x = $engine.getWindowSizeX() / 2;
		background.y = $engine.getWindowSizeY() / 2;
		var blurFilterMain = new PIXI.filters.BlurFilter(4, 4, 3, 15);
		background.getSprite().filters = [blurFilterMain];
		this.depth = -1;

		$engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("lunchbox_assets_1")), true);

		this.mask = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("lunchbox_assets_0")), true);
		new Sticker(this.mask, "sticker_donut", () => {
			new Sticker(this.mask, "sticker_rocket", () => {
				new Sticker(this.mask, "sticker_dragon");
			});
		});
	}
}

class Sticker extends EngineInstance {
	onCreate(mask, texname, onPlaced) {
		var followSprite1 = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture(texname)));
		followSprite1.mask = mask;
		followSprite1.scale.x = 0.05;
		followSprite1.scale.y = 0.05;

		var followSprite2 = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture(texname)));
		followSprite2.scale.x = 0.05;
		followSprite2.scale.y = 0.05;
		followSprite2.alpha = 0.2;

		this.followSprites = [followSprite1, followSprite2];

		this.depth = -2;
		this.currentStep = 0;
		this.savedPoint = null;
		this.onPlaced = onPlaced;
		this.isFirstFrame = true;
	}

	step() {
		if (IN.mouseCheckPressed(0) && !this.isFirstFrame) {
			this.currentStep++;
			this.savedPoint = new EngineLightweightPoint(IN.getMouseX(), IN.getMouseY());
			if (this.currentStep === 2) {
				this.followSprites[1].alpha = 0.0;
				if (this.onPlaced) {
					this.onPlaced();
				}
			}
		}
		this.isFirstFrame = false;
		if (this.currentStep === 0) {
			for (const spr of this.followSprites) {
				spr.x = IN.getMouseX();
				spr.y = IN.getMouseY();
			}
		}
		if (this.currentStep === 1) {
			var ang = V2D.calcDir(IN.getMouseX() - this.savedPoint.x, IN.getMouseY() - 5 - this.savedPoint.y) + Math.PI / 2;
			for (const spr of this.followSprites) {
				spr.rotation = ang;
			}
		}
	}
}
