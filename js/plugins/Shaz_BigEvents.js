/*:
 * Big Events by Shaz
 * Ver 1.00 2018.01.13
 * Shaz_BigEvents.js
 *
 *
 * @plugindesc Set an event's collision area to cover more than one tile.
 * @author Shaz
 *
 * @help This plugin allows you to set an event to cover more than one tile
 * for collision purposes.  You can specify the entire event (all pages) to
 * have the large collision area, or just individual pages.
 *
 * USAGE:
 * Place the event in the top left corner of the area to be covered.
 * Enter <bigEvent:wxh> in the event's note box (affects all event pages),
 * or as a comment on the event page (affects just that page), where w is 
 * the number of tiles across and h is the number of tiles down that the
 * event will occupy.
 * A <bigEvent:...> comment on an event page will override a <bigEvent...>
 * tag in the note box.
 *
 * Example:
 * <bigEvent:1x3> in the notebox of an event will expand the collision area
 * of that event to cover the current tile plus two tiles below (total width
 * is 1 and total height is 3).
 * <bigEvent:4x4> in a comment on an event page will expand the collision
 * area to a 4x4 square, just while that page is active.
 *
 * NOTE:
 * This plugin has no plugin commands.
 * This plugin is only to be used for events that will not move.
 *
 */

var Imported = Imported || {};
Imported.Shaz_BigEvents = true;

var Shaz = Shaz || {};
Shaz.BE = Shaz.BE || {};
Shaz.BE.Version = 1.00;

(function() {
	var _Shaz_BE_Game_Event_initMembers = Game_Event.prototype.initMembers;
	Game_Event.prototype.initMembers = function() {
		_Shaz_BE_Game_Event_initMembers.call(this);
		this._xr = null;
		this._yb = null;
	};

	var _Shaz_BG_Game_Event_pos = Game_Event.prototype.pos
	Game_Event.prototype.pos = function(x, y) {
		if (this._xr) {
 			return this._x <= x && this._xr >= x && this._y <= y && this._yb >= y;
 		} else {
 			return _Shaz_BG_Game_Event_pos.call(this, x, y);
 		}
	};

	var _Shaz_BE_Game_Event_clearPageSettings = Game_Event.prototype.clearPageSettings;
	Game_Event.prototype.clearPageSettings = function() {
		_Shaz_BE_Game_Event_clearPageSettings.call(this);
		this._xr = null;
		this._yb = null;
	};

	var _Shaz_BE_Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
	Game_Event.prototype.setupPageSettings = function() {
		_Shaz_BE_Game_Event_setupPageSettings.call(this);
		this._xr = null;
		this._yb = null;
		var param = null;
	    if (this.page() && this.list()) {
	    	this.list().filter(function(cmd) {
	    		if ((cmd.code === 108 || cmd.code === 408) && cmd.parameters[0].match(/<bigEvent:\s*(\d+)x(\d+)>/)) {
	    			param = RegExp.$1 + 'x' + RegExp.$2;
	    			return true;
	    		} else {
	    			return false;
	    		}
	    	});
	    }

	    if (!param && this.event().meta.bigEvent) {
	    	param = this.event().meta.bigEvent;
	    }

	    if (param && param.match(/(\d+)x(\d+)/)) {
	    	this._xr = this._x + parseInt(RegExp.$1) - 1;
	    	this._yb = this._y + parseInt(RegExp.$2) - 1;
	    }
	};

})();