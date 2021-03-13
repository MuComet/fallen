// ==================================================
// CaeX_FootstepTime.js
// ==================================================

/*:
 * @plugindesc v1.0 - Extends YEP_FootstepSounds: minimum time between step sounds.
 * @author Caethyril
 * @help Plugin Commands:
 *    None.
 * 
 * Terms of use:
 *    Free to use and modify.
 * 
 * @param Sound Interval
 * @text Sound Interval
 * @type number
 * @desc Minimum number of frames between successive footstep sounds.
 * @default 0
 *
 * @param Property Name
 * @text Property Name
 * @type text
 * @desc Advanced config. Internal property name for character footstep timer.
 * @default _stepSoundTime
 */

var Imported = Imported || {};
Imported.CaeX_FootstepTime = 1.0;

var CAE = CAE || {};
CAE.X_FootstepTime = CAE.X_FootstepTime || {};

(function(_) {
'use strict';

	const PLUGIN_NAME = 'CaeX_FootstepTime';
	const ERR_PRE     = PLUGIN_NAME + '.js ';
	const ERR_NOREQ   = ERR_PRE + 'must be loaded after YEP_FootstepSounds.\nCheck your load order and try again.';
	const ERR_NOPARAM = ERR_PRE + 'could not find its parameters!.\nCheck you have named the plugin file correctly and try again.';
	const ERR_BADKEY  = ERR_PRE + 'could not use key \'%1\'. Reverting to default: \'%2\'.';

	// Check for requisite plugin and self plugin parameters
	if (!Imported.YEP_FootstepSounds) throw new Error(ERR_NOREQ);
	_.params = PluginManager.parameters(PLUGIN_NAME);
	if (!_.params) throw new Error(ERR_NOPARAM);

	// Confirm property identifier is valid
	_.validateKey = function(key, dFault) {
		if (key) return key;
		console.error(ERR_BADKEY.format(key, dFault));
		return dFault;
	};
	const PROP_TIME = _.validateKey(_.params['Property Name'], '_stepSoundTime');

	// Minimum frame interval between step sounds
	_.time = parseInt(_.params['Sound Interval'], 10) || 0;

	// Timer methods - advance, reset, and expiry check
	_.tick  = function(char) { if (char[PROP_TIME] > 0) char[PROP_TIME]--; };
	_.check = function(char) { return char[PROP_TIME] <= 0; };
	_.reset = function(char) { char[PROP_TIME] = _.time; };

	// Initialise the character's footstep sound timer value
	_.Game_CharacterBase_initialize = Game_CharacterBase.prototype.initialize;
	Game_CharacterBase.prototype.initialize = function() {
		_.Game_CharacterBase_initialize.call(this);
		this[PROP_TIME] = 0;
	};

	// Invoke original method only if the character's footstep sound timer is expired
	_.Game_CharacterBase_playFootstepSound = Game_CharacterBase.prototype.playFootstepSound;
	Game_CharacterBase.prototype.playFootstepSound = function(volume, pitch, pan) {
		if (_.check(this)) {
			_.Game_CharacterBase_playFootstepSound.apply(this, arguments);
			_.reset(this);
		}
	};

	// Tick down the character's footstep sound timer once per frame update
	_.Game_CharacterBase_update = Game_CharacterBase.prototype.update;
	Game_CharacterBase.prototype.update = function() {
		_.tick(this);
		_.Game_CharacterBase_update.call(this);
	};

})(CAE.X_FootstepTime);