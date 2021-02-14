class InstanceMover extends EngineInstance {

    onEngineCreate() {
        this.snapMoveFactor = 0.5; // how much to factor in your current speed to the snap distance
        this.snapDistance = 20; // how far to try to snap
        this.maxVelocity = 8;
        this.turnLag = 4; // how long if accel in other dir
        this.turnLagStop=8; // how long if no accel
        this.drag = 0.01;

        // don't touch
        this.vel = [0,0]
        this.turnLagSpeeds = [0,0];
        this.turnLagTimer = [0,0]
        this.turnLagFramesControl = [0,0];
        this.turnLagInterruptable = [false,false];
        this.frictionCoeff = 0.1;
    }

    onCreate() {
        this.onEngineCreate();
    }

    step() {
        this.turnLagTimer[0]--;
        this.turnLagTimer[1]--;
    }
    // returns whether or not this instance collides with another given a location
    collisionCheck(x,y) {
        throw new Error("IMPLEMENT COLLISIONCHECK IN SUBCLASS");
    }

    canControl() {
        throw new Error("IMPLEMENT CANCONTROL IN SUBCLASS");
    }

    move(accelVector, velocity) {
        if(this.canControl()) {
            this.__groundControl(accelVector, velocity);
        } else {
            this.__applyDrag();
        }
        this.__collision();
    }

    __groundControl(accelVector, velocity) {
        for (var i = 0; i < 2; ++i) {
            if(this.turnLagTimer[i] >= 0) {
                var change = this.turnLagSpeeds[i]/this.turnLagFramesControl[i];
                if(this.turnLagTimer[i]!=0)
                    velocity[i] -= change;	
                else {
                    velocity[i]=0;
                    //if(vel[(i+1)%2]==0)
                    //    set_state(Action.STANDING);
                }
            }
        
            if(velocity[i]!=0 && Math.sign(accelVector[i])!=Math.sign(velocity[i])) {
                if(accelVector[i] !==0 && Math.abs(accelVector[i]) > Math.abs(velocity[i])) { // allow the player to break
                    this.turnLagTimer[i] = -1; // out if they would overpower turn lag (for pushing)
                } else if(this.turnLagTimer[i] < 0) {
                    if(accelVector[i]===0) {
                        this.turnLagSpeeds[i] = velocity[i];
                        this.turnLagTimer[i] = this.turnLagStop;
                        this.turnLagFramesControl[i] = this.turnLagStop
                        this.turnLagInterruptable[i] = true;
                    } else {
                        this.turnLagSpeeds[i] = velocity[i];
                        this.turnLagTimer[i] = this.turnLag;
                        this.turnLagFramesControl[i] = this.turnLag
                        this.turnLagInterruptable[i] = false;
                    }
                } else if(this.turnLagTimer[i] > this.turnLag && accelVector[i]!=0){
                    this.turnLagSpeeds[i] = velocity[i];
                    this.turnLagTimer[i] = this.turnLag;
                    this.turnLagFramesControl[i] = this.turnLag
                    this.turnLagInterruptable[i] = false;
                } 
            }
            
            if(Math.sign(accelVector[i])===Math.sign(velocity[i]) && this.turnLagInterruptable[i]) {
                this.turnLagTimer[i] = -1;
            }
            
            if(this.turnLagTimer[i] > 0) {
                accelVector[i]=0;
            }
        }
    
        var maxSpd = this.maxVelocity;
        var dir = V2D.calcDir(velocity[0],velocity[1]);
        var max_coeff = Math.max(Math.abs(Math.cos(dir)),Math.abs(Math.sin(dir)))
        maxSpd*=max_coeff;
    
        for (var i = 0; i < 2; ++i) {
            if(Math.abs(velocity[i]) > maxSpd) {
                accelVector[i] = this.frictionCoeff * (Math.abs(velocity[i]) - maxSpd) * -Math.sign(velocity[i]);
            } else if(Math.sign(accelVector[i])===Math.sign(velocity[i]) && Math.abs(accelVector[i]+velocity[i]) > maxSpd) 
                accelVector[i] = (maxSpd - Math.abs(velocity[i])) * Math.sign(accelVector[i])
        }
    
        velocity[0]+=accelVector[0];
        velocity[1]+=accelVector[1];
    }

    __applyDrag() {
        for(var i =0;i<2;++i) {
            this.vel[i]-=this.vel[i]*this.drag;
            if(Math.abs(this.vel[i])<this.drag)
                this.vel[i]=0;
        }
    }

    __collision() {
        if(Math.abs(this.vel[0])>Math.abs(this.vel[1])) {
            while(this.__collisionCheckX());
            this.x+=this.vel[0];
            
            while(this.__collisionCheckY());
            this.y+=this.vel[1];
        } else {
            while(this.__collisionCheckY());
            this.y+=this.vel[1];
            
            while(this.__collisionCheckX());
            this.x+=this.vel[0];
        }
    }

    __collisionCheckY() {
        var hit = false;
        var t = 0;
        if(this.vel[1]!=0 && this.collisionCheck(this.x,this.y+this.vel[1]) && !this.__snapX()) {
            while(!this.collisionCheck(this.x,this.y+Math.sign(this.vel[1])) && t < Math.abs(this.vel[1])) {
                this.y+=Math.sign(this.vel[1]);
                t++;
            }
            this.vel[1]=0;
            hit = true;
        }
        return hit;
    }

    __snapX() {
        var vel2 = V2D.calcMag(this.vel[0],this.vel[1]);
        var fac = this.snapMoveFactor;
        var lowerBound = Math.min(-this.snapDistance + vel2*fac * Math.sign(this.vel[0]),0);
        var upperBound = Math.max(this.snapDistance + vel2*fac * Math.sign(this.vel[0]),0);
        if(this.vel[0]>0) // cannot snap in a direction you are not moving...
            lowerBound=0;
        if(this.vel[0]<0)
            upperBound=0;
        for(var i = 0;i<upperBound;i++) {
            if(!this.collisionCheck(this.x+i,this.y+this.vel[1])) {
                this.x+=i;
                return true;
            }
        }
        for(var i = 0;i>lowerBound;i--) {
            if(!this.collisionCheck(this.x+i,this.y+this.vel[1])) {
                this.x+=i;
                return true;
            }
        }
        return false;
    }

    __collisionCheckX() {
        var hit = false;
        var t = 0;
        if(this.vel[0]!=0 && this.collisionCheck(this.x+this.vel[0],this.y) && !this.__snapY()) {
            while(!this.collisionCheck(this.x+Math.sign(this.vel[0]),this.y) && t < Math.abs(this.vel[0])) {
                this.x+=Math.sign(this.vel[0]);
                t++;
            }
            this.vel[0]=0;
            hit = true;
        }
        return hit;
    }

    __snapY() {
        var vel2 = V2D.calcMag(this.vel[0],this.vel[1]);
        var fac = this.snapMoveFactor;
        var lowerBound = Math.min(-this.snapDistance + vel2*fac * Math.sign(this.vel[1]),0);
        var upperBound = Math.max(this.snapDistance + vel2*fac * Math.sign(this.vel[1]),0);
        if(this.vel[1]>0) // cannot snap in a direction you are not moving...
            lowerBound=0;
        if(this.vel[1]<0)
            upperBound=0;
        for(var i = 0;i<upperBound;i++) {
            if(!this.collisionCheck(this.x+this.vel[0],this.y+i)) {
                this.y+=i;
                return true;
            }
        }
        for(var i = 0;i>lowerBound;i--) {
            if(!this.collisionCheck(this.x+this.vel[0],this.y+i)) {
                this.y+=i;
                return true;
            }
        }
        return false;
    }
}