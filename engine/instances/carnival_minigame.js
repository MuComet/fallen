class CarnivalMinigameController extends MinigameController {
	onEngineCreate() {
		super.onEngineCreate();

		new CarnivalThrower();
		//$engine.setBackgroundColour(12067);
		// $engine.setBackgroundColour(0xa58443);

		this.startTimer(30 * 60);
		this.getTimer().setWarningTime(2 * 60); // last 2 seconds

		// instructions
		var text = new PIXI.Text("Press and hold SPACE to aim your dart!", $engine.getDefaultTextStyle());
		this.setInstructionRenderable(text);
		this.setControls(true, false);
		this.skipPregame();

		this.setCheatTooltip("Magnetic sand!");

		var background = new EmptyInstance($engine.getTexture("carnival_background"));
		background.xScale = 0.12;
		background.yScale = 0.12;
		background.x = $engine.getWindowSizeX() / 2;
		background.y = $engine.getWindowSizeY() / 2;

		var shop = new EmptyInstance($engine.getTexture("carnival_shop"));
		shop.xScale = 0.12;
		shop.yScale = 0.12;
		shop.x = $engine.getWindowSizeX() / 2;
		shop.y = $engine.getWindowSizeY() / 2 + 32;

		this.addOnGameEndCallback(this, function (self) {
			self.setLossReason("You're supposed to drop the block, not watch it.");
		});

		// 0x52c3be blue
		// 0x8f4587 purple
		// 0x0c6e75 dark blue
		// 0xaaac37 greenish
		// 0xc42049 red
		// 0xf57e20 orang

		var colourLookup = [
			{ colour: 0x52c3be, pointValue: 1 },
			{ colour: 0x8f4587, pointValue: 2 },
			{ colour: 0x0c6e75, pointValue: 3 },
			{ colour: 0xaaac37, pointValue: 4 },
			{ colour: 0xc42049, pointValue: 5 },
			{ colour: 0xf57e20, pointValue: 6 },
		];

		var sepX = 56;
		var sepY = 72;
		for (var x = 0; x < 7; x++) {
			for (var y = 0; y < 3; y++) {
				var dx = x - 3;
				var dy = y - 1;
				var manhattan = Math.abs(dx) + Math.abs(dy);
				var idx = colourLookup.length - 1 - manhattan;
				var data = colourLookup[idx];
				new CarnivalBalloon(
					$engine.getWindowSizeX() / 2 + dx * sepX,
					$engine.getWindowSizeY() / 2 + dy * sepY,
					data.colour,
					data.pointValue
				);
			}
		}
	}

	notifyFramesSkipped(frames) {
		this.getTimer().tickDown(frames);
	}

	step() {
		super.step();
	}

	draw(gui, camera) {
		super.draw(gui, camera);
	}

	onDestroy() {
		super.onDestroy();
	}
}

class CarnivalThrower extends EngineInstance {
	onCreate() {
		this.setSprite(new PIXI.Sprite($engine.getTexture("carnival_reticle")));
		this.hitbox = new Hitbox(this, new RectangleHitbox(this, -4, -4, 4, 4));

		this.lastX = 0;
		this.lastY = 0;

		this.dx = 0;
		this.dy = 0;

		this.gravityGoal = 0.75;
		this.gravityCurrent = 0.0;
		this.movementTimer = 0;

		this.lastDir = 0;
		this.fallPlayed = false;
		this.targetXDiff = 0;
		this.maxCorrection = 56;
		this.targetCameraZoom = 1.0;

		this.timer = 0;

		this.speedScale = 1.0;
		this.activatedTimer = 0;
		this.activatedMax = 240;
		this.activated = false;
		this.thrown = false;
		this.thrownTimer = 0;

		this.swingLength = 350;
		this.swingStart = new Vertex($engine.getWindowSizeX() / 2, $engine.getWindowSizeY() / 2);

		this.registerInterpolationVariable("x", "xInterp");
		this.registerInterpolationVariable("y", "yInterp");

		this.swingMove();

		this.blurFilter = new PIXI.filters.BlurFilter(4, 4, 3, 15);
		this.getSprite().filters = [this.blurFilter];
	}

	swingMove() {
		var sin = Math.sin($engine.getGameTimer() / 8);
		var angle = -sin / 1.2;
		this.angle = -angle;
		this.lastX = this.x;
		this.lastY = this.y;

		this.xScale = 0.3;
		this.yScale = 0.3;

		this.timer += this.speedScale;
		this.depth = -1;

		this.x = this.swingStart.x + (Math.sin(this.timer / 8) * $engine.getWindowSizeX()) / 2;
		this.y = this.swingStart.y + (Math.cos(this.timer / 32) * $engine.getWindowSizeY()) / 3;
	}

	angleFromMove() {
		this.angle = V2D.calcDir(Math.abs(this.dx), this.dy);
	}

	step() {
		if (this.y > $engine.getWindowSizeY() * 2 + 100) {
			this.destroy();
		}

		if (this.y > $engine.getCamera().getY() + $engine.getWindowSizeY() && !this.fallPlayed) {
			$engine.audioPlaySound("sky_fall"); // hehe
			this.fallPlayed = true;
		}

		this.swingMove();

		if (this.thrown) {
			this.thrownTimer++;
			this.alpha = 1 - this.thrownTimer / 24;
		}

		if (this.activated) {
			this.blurFilter.blur = EngineUtils.interpolate(this.activatedTimer / 60, 4, 0.0001, EngineUtils.INTERPOLATE_OUT);

			this.activatedTimer++;

			this.angle *= EngineUtils.interpolate(
				(this.activatedTimer * 1.08) / this.activatedMax,
				0.6,
				0,
				EngineUtils.INTERPOLATE_IN
			);
			var fac = EngineUtils.interpolate(
				this.activatedTimer / this.activatedMax,
				0,
				8,
				EngineUtils.INTERPOLATE_IN_EXPONENTIAL
			);
			this.x += EngineUtils.randomRange(-fac, fac);
			this.y += EngineUtils.randomRange(-fac, fac);

			var scaleFac = EngineUtils.interpolate(
				this.activatedTimer / this.activatedMax,
				0.3,
				0.15,
				EngineUtils.INTERPOLATE_OUT_EXPONENTIAL
			);
			this.xScale = scaleFac;
			this.yScale = scaleFac;

			this.speedScale = EngineUtils.interpolate(
				this.activatedTimer / this.activatedMax,
				0.8,
				0.2,
				EngineUtils.INTERPOLATE_OUT
			);

			if (this.thrown) {
				return;
			}

			this.targetCameraZoom =
				this.activatedTimer < 60
					? EngineUtils.interpolate(this.activatedTimer / 60, 1, 1.1, EngineUtils.INTERPOLATE_OUT_EXPONENTIAL)
					: EngineUtils.interpolate(
							(this.activatedTimer - 60) / (this.activatedMax - 60),
							1.1,
							1.25,
							EngineUtils.INTERPOLATE_IN
					  );
			var distanceDiffX = $engine.getWindowSizeX() - $engine.getWindowSizeX() / this.targetCameraZoom;
			var distanceDiffY = $engine.getWindowSizeY() - $engine.getWindowSizeY() / this.targetCameraZoom;
			var camera = $engine.getCamera();
			camera.setScale(this.targetCameraZoom, this.targetCameraZoom);
			camera.setLocation(distanceDiffX / 2, distanceDiffY / 2);
		}

		if (IN.keyCheckPressed("Space")) {
			this.activated = true;
		}

		if ((!IN.keyCheck("Space") || this.activatedTimer > this.activatedMax) && this.activated) {
			this.thrown = true;
			var hit = IM.instancePlace(this, this.x, this.y, CarnivalBalloon);
			if (hit) {
				hit.activateDestroy();
				CarnivalMinigameController.getInstance().endMinigame(true);
				$engine.audioPlaySound("wire_connect");
			} else {
				CarnivalMinigameController.getInstance().endMinigame(false);
				CarnivalMinigameController.getInstance().setLossReason("You missed!");
			}
		}
	}
}

class CarnivalBalloon extends EngineInstance {
	onCreate(x, y, color) {
		this.x = x;
		this.y = y;
		this.balloonSprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("carnival_balloon")), true);
		$engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("carnival_balloon_shine")), true);
		if (color) {
			this.balloonSprite.tint = color;
		}
		var randomScale = EngineUtils.randomRange(-0.005, 0.005);
		this.startScale = 0.065;
		this.xScale = this.startScale + randomScale;
		this.yScale = this.startScale + randomScale;
		this.angle = Math.PI + EngineUtils.randomRange(-0.3, 0.3);
		this.randomOffset = EngineUtils.random(8);
		this.setHitbox(new Hitbox(this, new RectangleHitbox(this, -412, -480, 412, 480)));

		this.isDestroying = false;
		this.timer = 0;
	}

	activateDestroy() {
		this.isDestroying = true;
	}

	step() {
		this.angle += Math.sin($engine.getGameTimer() / 16 + this.randomOffset) * 0.001;
		this.x += Math.sin($engine.getGameTimer() / 16 + this.randomOffset) * 0.025;
		if (!this.isDestroying) {
			return;
		}
		this.timer++;
		var newScale = EngineUtils.interpolate(
			this.timer / 32,
			this.startScale,
			0.15,
			EngineUtils.INTERPOLATE_OUT_EXPONENTIAL
		);
		this.xScale = newScale;
		this.yScale = newScale;
		this.y += newScale * 10;
		this.alpha = EngineUtils.interpolate(this.timer / 24, 1, 0, EngineUtils.INTERPOLATE_OUT_EXPONENTIAL);
	}
}
