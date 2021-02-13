class EngineUtils {

    constructor() {
        throw "Cannot instantiate static class.";
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

    static roundMultiple(input, multiple) {
        return Math.round(input/multiple)*multiple;
    }

    static clamp(input, minVal,maxVal) {
        return Math.max(Math.min(input,maxVal),minVal);
    }

    static randomRange(low, high) {
        return Math.random()*(high-low)+low;
    }

    static irandomRange(low, high) {
        return Math.round(this.randomRange(low,high));
    }

    static random(high) {
        return Math.random()*high;
    }

    static irandom(high) {
        return Math.round(Math.random()*high);
    }

    static collisionLinePoint(v1,v2,v3,v4) { // point in which they collide
        var d= (v2.x-v1.x) * (v4.y-v3.y) - (v2.y-v1.y) * (v4.x-v3.x);
		var n1=(v1.y-v3.y) * (v4.x-v3.x) - (v1.x-v3.x) * (v4.y-v3.y);
		var n2=(v1.y-v3.y) * (v2.x-v1.x) - (v1.x-v3.x) * (v2.y-v1.y);
		
		if(d===0 && n1===0 && n2===0)
			return v1;
		var r = n1/d;
		var s=n2/d;
		if((r>=0 && r<=1) &&(s>=0 && s<=1))
			return new EnginePoint(v1.x+(v2.x-v1.x)*r,v3.y+(v4.y-v3.y)*s);
		return null;
    }

    static collisionLine(v1,v2,v3,v4) {
        return EngineUtils.collisionLinePoint(v1,v2,v3,v4)!==null;
    }

    static nearestPositionOnLine(point, l1, l2)
	{
		var length = V2D.distanceSq(l1.x,l1.y,l2.x,l2.y);
		if(length==0)
			return l1; //if the line is 0 length
		
		var t=EngineUtils.clamp(((point.x-l1.x)*(l2.x-l1.x)+((point.y-l1.y)*(l2.y-l1.y)))/length,0, 1);
		return new Vertex(l1.x+t*(l2.x-l1.x), l1.y+t*(l2.y-l1.y));
    }

    static distanceBetweenLines(l1,l2,l3,l4) {
        return Math.sqrt(Math.min(EngineUtils.distanceToLineSq(l1,l3,l4),EngineUtils.distanceToLineSq(l2,l3,l4)));
    }
    
    static distanceToLineSq(point,l1,l2) {
        var p = EngineUtils.nearestPositionOnLine(point, l1,l2);
        return V2D.distanceSq(point.x,point.y,p.x,p.y);
    }

    static interpolate(from, to, factor, interpType) {
        // TODO copy from gamemaker
    }
}

class EngineDebugUtils {

    static drawHitbox(graphics, inst) {
        inst.hitbox.__requireValidPolygon();
        var poly = inst.hitbox.getPolygonHitbox()
        var len = poly.__getNumPoints();
        var p2 = new PIXI.Polygon();
        for(var i =0;i<len;i++) {
            var v = poly.__getAbsolutePoint(i)
            p2.points.push(new PIXI.Point(v.x,v.y));
        }
        graphics.beginFill(0xe74c3c);
        graphics.drawPolygon(p2)
        graphics.endFill();
    }

    static drawBoundingBox(graphics, inst) {
        var bb = inst.hitbox.getBoundingBox();
        graphics.lineStyle(1,0xe74c3c).moveTo(bb.x1+inst.x,bb.y1+inst.y).lineTo(bb.x2+inst.x,bb.y1+inst.y).lineTo(bb.x2+inst.x,bb.y2+inst.y).lineTo(bb.x1+inst.x,bb.y2+inst.y).lineTo(bb.x1+inst.x,bb.y1+inst.y);
    }
}