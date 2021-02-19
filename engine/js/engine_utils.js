/**
 * Various utility methods.
 */
class EngineUtils {

    constructor() {
        throw new Error("Cannot instantiate static class.");
    }
    // Code created by Dave Burton, https://stackoverflow.com/users/562862/dave-burton
    // Source: https://stackoverflow.com/a/41133213
    /**@deprecated */
    static readLocalFile(filePath) { // VERY SLOW! every single file you load with this costs a constant overhead of 70-80ms waiting for response.
        var result = null;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", filePath, false);
        xmlhttp.send();
        if (xmlhttp.status==200) {
            result = xmlhttp.responseText;
        } else {
            console.error("Unable to load file "+filepath+". Did you forget to include the file?")
        }
        xmlhttp.onerror = function(e) {
            console.error("Unable to load file "+filepath+". Did you forget to include the file?")
        }
        return result;
    }

    static readLocalFileAsync(filePath,callback) {
        fetch(new Request(filePath)).then((resp)=> {
            resp.text().then((text) => {
                callback(text);
            }, () => { // on error
                console.error("Unable to load file "+filepath+". Did you forget to include the file?")
            }) 
        });
    }

    static attachScript(src,callback) {
        var body = document.body || document.getElementsByTagName('body')[0];
        var imp = document.createElement('script')
        imp.onload = function() {
            callback();
        }
        imp.type = "text/javascript";
        imp.src = src;
        imp.async=false;
        imp.defer=false
        body.appendChild(imp,body.lastChild);
    }

    static strToArrNewline(str) {
        return str.split(/\r?\n/).filter( e => e.trim().length > 0);  // uses regex and ignores empty lines
    }
    // Code created by iqmaker, https://stackoverflow.com/users/1266538/iqmaker
    // Source: https://stackoverflow.com/a/39627573
    static strToArrWhitespace(str) {
        return str.split(/(\s+)/).filter( e => e.trim().length > 0)
    }

    /**
     * Utility to round a number to an arbitrary multiple
     * @param {Number} input The input number
     * @param {Number} multiple The multiple to round to
     * @returns {Number} rounded value
     */
    static roundMultiple(input, multiple) {
        return Math.round(input/multiple)*multiple;
    }

    /**
     * Utility to ensure a number stays between a max and min value. If the input is undefined the output is also undefined.
     * @param {Number} input The input value
     * @param {Number} minVal The lowest allowed value
     * @param {Number} maxVal The highest allowed value
     * @returns {Number} the clamped value
     */
    static clamp(input, minVal,maxVal) {
        return Math.max(Math.min(input,maxVal),minVal);
    }

    /**
     * Generates a random number between low and high
     * @param {Number} low The lowest allowed number, inclusive
     * @param {Number} high The highest allowed number, exclusive
     * @returns {Number} the random number
     */
    static randomRange(low, high) {
        return Math.random()*(high-low)+low;
    }

    /**
     * Generates a random integer between low and high inclusive.
     * @param {Number} low The lowest allowed number, inclusive
     * @param {Number} high The highest allowed number, inclusive
     * @returns {Number} the random number
     */
    static irandomRange(low, high) {
        return Math.round(this.randomRange(low,high));
    }

    /**
     * Generates a random number between 0 and high
     * @param {Number} high The highest allowed number, exclusive
     * @returns {Number} the random number
     */
    static random(high) {
        return Math.random()*high;
    }

    /**
     * Generates a random integer between 0 and high
     * @param {Number} high The highest allowed number, inclusive
     * @returns {Number} the random number
     */
    static irandom(high) {
        return Math.round(Math.random()*high);
    }
 
    /**
     * Calculates the intersection between two lines.
     * @param {EnginePoint} v1 The first vertex of the first line
     * @param {EnginePoint} v2 The second vertex of the first line
     * @param {EnginePoint} v3 The first vertex of the second line
     * @param {EnginePoint} v4 The second vertex of the second line
     * @returns {EnginePoint} The point in which they collide, or undefined if they don't
     */
    static linesCollisionPoint(v1,v2,v3,v4) { // point in which they collide
        var d= (v2.x-v1.x) * (v4.y-v3.y) - (v2.y-v1.y) * (v4.x-v3.x);
		var n1=(v1.y-v3.y) * (v4.x-v3.x) - (v1.x-v3.x) * (v4.y-v3.y);
		var n2=(v1.y-v3.y) * (v2.x-v1.x) - (v1.x-v3.x) * (v2.y-v1.y);
		
		if(d===0 && n1===0 && n2===0)
			return v1;
		var r = n1/d;
		var s=n2/d;
		if((r>=0 && r<=1) &&(s>=0 && s<=1))
			return new EnginePoint(v1.x+(v2.x-v1.x)*r,v3.y+(v4.y-v3.y)*s);
		return undefined;
    }

    /**
     * Calculates if two lines intersect
     * @param {EnginePoint} v1 The first vertex of the first line
     * @param {EnginePoint} v2 The second vertex of the first line
     * @param {EnginePoint} v3 The first vertex of the second line
     * @param {EnginePoint} v4 The second vertex of the second line
     * @returns {Boolean} Whether or not the two lines collide
     */
    static linesCollide(v1,v2,v3,v4) {
        return EngineUtils.linesCollisionPoint(v1,v2,v3,v4)!==undefined;
    }

    /**
     * Returns the non null nearest position on a line to point.
     * @param {EnginePoint} point The point to check
     * @param {EnginePoint} l1 The first vertex of the line
     * @param {EnginePoint} l2 The second vertex of the line
     */
    static nearestPositionOnLine(point, l1, l2)
	{
		var length = V2D.distanceSq(l1.x,l1.y,l2.x,l2.y);
		if(length==0)
			return l1; //if the line is 0 length
		
		var t=EngineUtils.clamp(((point.x-l1.x)*(l2.x-l1.x)+((point.y-l1.y)*(l2.y-l1.y)))/length,0, 1);
		return new Vertex(l1.x+t*(l2.x-l1.x), l1.y+t*(l2.y-l1.y));
    }

    /**
     * Calculates the distance between two line segments
     * @param {EnginePoint} l1 The first vertex of the first line
     * @param {EnginePoint} l2 The second vertex of the first line
     * @param {EnginePoint} l3 The first vertex of the second line
     * @param {EnginePoint} l4 The second vertex of the second line
     * @returns {Number} The distance between two lines
     */
    static distanceBetweenLines(l1,l2,l3,l4) {
        if(EngineUtils.linesCollide(l1,l2,l3,l4))
            return 0;
        return Math.sqrt(Math.min(EngineUtils.distanceToLineSq(l1,l3,l4),EngineUtils.distanceToLineSq(l2,l3,l4)));
    }
    
    /**
     * Finds the distance from a specified point to the line
     * @param {EnginePoint} point The point to check
     * @param {EnginePoint} l1 The first vertex of the line
     * @param {EnginePoint} l2 The second vertex of the line
     * @returns {Number} The squared distance from the point to the line
     */
    static distanceToLineSq(point,l1,l2) {
        var p = EngineUtils.nearestPositionOnLine(point, l1,l2);
        return V2D.distanceSq(point.x,point.y,p.x,p.y);
    }

    /**
     * Interpolates between min and max given a certain interpolation fuction and an input value.
     * example usage: interpolate(0.5,0,100,EngineUtils.INTERPOLATE_LINEAR) -> returns 50
     * interpolate(0.25, 0, 500, EngineUtils.INTERPOLATE_SMOOTH) -> returns 78.125
     * interpolate(0, 0, 500, EngineUtils.INTERPOLATE_SMOOTH) -> returns 0
     * @param {Number} val A normalized value represeting the value position along the interpolation curve to sample.
     * @param {Number} min The begin value to interpolate to
     * @param {Number} max The end value to interpolate to
     * @param {Number} interpType an EngineUtils.INTERPOLATE
     */
    static interpolate(val, min, max, interpType) {
        var diff = max-min;
        if(val > 1)
            val = 1;
        else if(val <= 0)
            val = 0.00000001; // prevent divide by zero
        switch(interpType) {
            case(EngineUtils.INTERPOLATE_LINEAR):
                return diff*val + min;
            case(EngineUtils.INTERPOLATE_IN):
                return diff*val*val*val + min;
            case(EngineUtils.INTERPOLATE_OUT):
                var t = val-1;
                return diff*(t*t*t+1) + min
            case(EngineUtils.INTERPOLATE_SMOOTH):
                return diff*(3*val*val-2*val*val*val)+min
            case(EngineUtils.INTERPOLATE_IN_QUAD):
                return diff*val*val + min;
            case(EngineUtils.INTERPOLATE_OUT_QUAD):
                return diff*(val*(2-val)) + min
            case(EngineUtils.INTERPOLATE_SMOOTH_QUAD):
                return diff*(val < 0.5 ? 2*val*val : -1+(4-2*val))+min
            // functions written by Chriustian Figueroa
            // source: https://gist.github.com/gre/1650294#gistcomment-1892122
            case(EngineUtils.INTERPOLATE_IN_ELASTIC):
                return diff*((.04 - .04 / val) * Math.sin(25 * val) + 1)+min
            case(EngineUtils.INTERPOLATE_OUT_ELASTIC):
                if(val===1)
                    val = 0.99999999;
                return diff*(.04 * val / (--val) * Math.sin(25 * val))+min
            case(EngineUtils.INTERPOLATE_SMOOTH_ELASTIC):
                if(val===0.5) // prevent divide by zero
                    val = 0.50000001;
                return  diff*((val -= .5) < 0 ?     (.02 + .01 / val) * Math.sin(50 * val) 
                                                :   (.02 - .01 / val) * Math.sin(50 * val) + 1) + min
        }
    }
}

EngineUtils.INTERPOLATE_LINEAR = 0;
EngineUtils.INTERPOLATE_IN=1;
EngineUtils.INTERPOLATE_OUT=2;
EngineUtils.INTERPOLATE_SMOOTH=3;
EngineUtils.INTERPOLATE_IN_ELASTIC=4;
EngineUtils.INTERPOLATE_OUT_ELASTIC=5;
EngineUtils.INTERPOLATE_SMOOTH_ELASTIC=6;
EngineUtils.INTERPOLATE_IN_QUAD=7;
EngineUtils.INTERPOLATE_OUT_QUAD=8;
EngineUtils.INTERPOLATE_SMOOTH_QUAD=9;

class EngineDebugUtils {

    /**
     * Draws the hitbox of the specified EngineInstance
     * @param {PIXI.graphics} graphics The grapics instance to use
     * @param {EngineInstance} inst The engine instance to draw the hitbox of
     */
    static drawHitbox(graphics, inst) {
        var poly = inst.hitbox.getPolygonHitbox()
        var len = poly.__getNumPoints();
        var p2 = new PIXI.Polygon();
        var v;
        for(var i =0;i<len;i++) {
            v = poly.__getAbsolutePoint(i)
            p2.points.push(new PIXI.Point(v.x,v.y));
        }
        v = poly.__getAbsolutePoint(0)
        p2.points.push(new PIXI.Point(v.x,v.y));
        graphics.lineStyle(2,0xe74c3c);
        graphics.beginFill(0xe74c3c,0.5);
        graphics.drawPolygon(p2)
        graphics.endFill();
    }

    /**
     * Draws the bounding box of the specified EngineInstance
     * @param {PIXI.graphics} graphics The grapics instance to use
     * @param {EngineInstance} inst The engine instance to draw the bounding box of
     */
    static drawBoundingBox(graphics, inst) {
        var bb = inst.hitbox.getBoundingBox();
        graphics.lineStyle(1,0xe74c3c).moveTo(bb.x1,bb.y1).lineTo(bb.x2,bb.y1).lineTo(bb.x2,bb.y2).lineTo(bb.x1,bb.y2).lineTo(bb.x1,bb.y1);
    }
}