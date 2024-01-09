import {UITransform, _decorator, error, game, math } from "cc";

/**
 * 对象池管理缓动
 * @author Liz 2019年4月18日21:10:57
 */
class GTween {
	private _target:any;
    private _targetName:string;
    private _targetTransform:UITransform;
    private _targetPos:math.Vec3;
    private _targetScale:math.Vec3;
    private _targetRotation:math.Vec3;
    private _isTargetSelf:boolean;
    private _targetProps:any;

	private _steps:any[];
	private _initialProps:any;
	private _stepProps:any;
	private _isStart:boolean = false;
	private _stepTime:number;
    private _curTime:number = 0;
	private _curStep:any;
	private _lastStep:any;
    private _canUpdate:boolean = false;

	private _loop:boolean = false;
    private _loopCount:number = 0;
    private _loopTotalCount:number = 0;
    private _loopComplete:Function;
	private _stepIdx:number = 0;
	private _onChange:Function;
	private _onChangeObj:any;
    private _tweenId:number = 0;
    public resetTime:number = 0;
	public constructor() {
	}

	public setProps(props:any):void {
		if(!props) return;
        this._loopTotalCount = props.loopTotalCount;
        if(props.loop || (this._loopTotalCount && this._loopTotalCount > 0)){
            this._loop = true;
        }
		this._onChange = props.onChange;
		this._onChangeObj = props.onChangeObj;
        this._loopComplete = props._loopComplete;
	}

	public setTarget(t:any,tweenId:number) {
		this._target = t;
        this._tweenId = tweenId;
		this._initialProps = null;
	}

    public get tweenId():number {
        return this._tweenId;
    }

	public getTarget():any {
		return this._target;
	}

	public to(props:any,duration?:number,ease?: Function):GTween {
		if(!this._target) return;
		if(!props || typeof(props) != "object") return;
		if(!duration || duration < 0) {
			return;
		}
        if(!this._initialProps){
            this._initialProps = {}
            for(let key in props) {
                this._initialProps[key] = this.getTargetAttr(key);
                // this.clearTargetByKey(key);
            }
        }
		this.addStep({
			type:"to",
			props:props,
			duration:duration,
			ease:ease});
		return this;
	}

	public call(callback: Function, thisObj?: any, params?: any[]):GTween {
		this.addStep({
			type : "call",
			callBack : callback,
			thisObj : thisObj,
			params : params});
		return this;
	}

	public wait(time:number):GTween {
		this.addStep({
			type : "wait",
			duration : time});
		return this;
	}

	private addStep(step:any):void {
		if(!this._steps) {
			this._steps = [];
		}
		this._steps.push(step);
		this.beginTween();
	}
	
	private beginTween():void {
		if(this._isStart) return;
		this._isStart = true;
		this.getStep();
	}

	private getStep():void {
		if(!this._isStart) return;
		if(this._loop) {
			if(this._stepIdx >= this._steps.length) {
                this._loopCount ++;
                if(this._loopTotalCount && this._loopTotalCount > 0 && this._loopCount >= this._loopTotalCount){
                    //loopComplete
                    if(this._loopComplete){
                        this._loopComplete.apply(this._curStep.thisObj);
                        // this._loopComplete.call();
                    }
                    this.stopAction();
                    return
                }
				this._stepIdx = 0;
                if(this._initialProps){
                    for(let key in this._initialProps) {
                        this.setTargetAttr(key,this._initialProps[key]);
                        // this._target[key] = this._initialProps[key];
                    }
                }
                //一轮循环结束，属性已经重设到初始值，不用校正
                this._lastStep = null;
			}
			this._curStep = this._steps[this._stepIdx];
			this._stepIdx ++;
		}
		else {
			this._curStep = this._steps.shift();
		}
		//属性校正
		if(this._lastStep && this._lastStep.props) {
			for(let key in this._lastStep.props) {
				// this._target[key] = this._lastStep.props[key];
                this.setTargetAttr(key,this._lastStep.props[key]);
			}
		}
		this._lastStep = this._curStep;
		if(!this._curStep) {
			this.stopAction();
			return;
		}
		if(this._curStep.type == "call") {
			this._curStep.callBack.apply(this._curStep.thisObj,this._curStep.params);
			this.getStep();
			return;
        }
        this._curTime = 0;
		this._stepTime = this._curStep.duration;
		this._stepProps = {};
        this._targetProps = {};
		this._canUpdate = true;
	}

	public runAction(dt:number):void {
        if(!this._canUpdate) return;
        this._curTime += dt * 1000;
        if(this._curTime >= this._stepTime){
            this._canUpdate = false;
            this.getStep();
            return;
        }
        
        if(this._curStep.type == "to") {
            let props:any = this._curStep.props;
            let ratio:number = (this._curStep.duration - (this._stepTime - this._curTime)) / this._curStep.duration;
            ratio = Math.min(ratio,1);
            if(this._curStep.ease) {
                ratio = this._curStep.ease(ratio,0,1,1);
            }
            for(let keyName in props) {
                if(this._stepProps[keyName] == undefined) {
                    this._stepProps[keyName] = this.getTargetAttr(keyName);
                }
                let diff:number = props[keyName] - this._stepProps[keyName];
                let value = this._stepProps[keyName] + (diff * ratio);
                this._targetProps[keyName] = value;
                this.setTargetAttr(keyName,value);
            }
        }
        if(this._onChange && this._onChangeObj) {
            this._onChange.apply(this._onChangeObj,this._targetProps);
        }
	}

    private checkTargetAttr(k:string){
        let errorTips = "";
        let ccIdx:number = this._target.__classname__.indexOf("cc.");
        if (typeof(this._target) == "object" && ccIdx == -1){
            if(this._target[k]){
                this._isTargetSelf = true
            }
            else{
                errorTips = "not found " + k + " in tween target.";
            }
        }else{
            if(this._target == null){
                errorTips = "tween target is null";
            }
            else{
                if(!this._targetTransform){
                    this._targetTransform = this._target.getComponent(UITransform);
                }
                if(!this._targetTransform){
                    errorTips = "not found transform in tween target. ----key：" + k;
                }
            }
        }

        if(errorTips == ""){
            if(k == "x" || k == "y" || k == "z"){
                if(!this._targetPos){
                    this._targetPos = this._target.getPosition(this._targetPos);
                }
            }
            else if(k == "scaleX" || k == "scaleY" || k == "scaleZ"){
                if(!this._targetScale){
                    this._targetScale = this._target.getScale();
                }
            }
            else if(k == "rotationX" || k == "rotationY" || k == "rotationZ"){
                if(!this._targetRotation){
                    this._targetRotation = this._target.getRotation();
                }
            }
            else if(k == "width" || k == "height"){
               
            }
            else if(!this._target[k]){
                errorTips = "not found " + k + " in tween target.";
            }
        }
        if(errorTips != ""){
            let curStepStr:string = this.getStepTestStr(this._curStep);
            let stepStr:string = "";
            if(this._steps){
                for(let i:number = 0; i < this._steps.length; i ++){
                    stepStr = stepStr + "(step" + i + ")" + this.getStepTestStr(this._steps[i]);
                }
            }
            let targetName = this._targetName;
            TweenManager.RemoveTweenById(this._tweenId);
            error(errorTips + "--->>>targetName：" + targetName + "，curStep：" + curStepStr + "，stepList：" + stepStr);
        }
    }

    private getStepTestStr(step:any):string{
        let stepStr:string = "";
        if(step){
            stepStr = step.type
            if(step.props){
                for (let key in step.props) {
                    let v = step.props[key];
                    stepStr = stepStr + "-->" + key + "=" + v + ",";
                }
            }
            if(step.duration){
                stepStr = stepStr + "time：" + step.duration;
            }
        }
        return stepStr;
    }

    private setTargetAttr(k: string,v: any){
        this.checkTargetAttr(k);
        if(this._isTargetSelf){
            this._target[k] = v;
            return;
        }
        if(k == "x" || k == "y" || k == "z"){
            this._targetPos[k] = v;
            this._target.setPosition(this._targetPos);
        }
        else if(k == "scaleX" || k == "scaleY" || k == "scaleZ"){
            this._targetScale[TweenManager.GetTweenAttrName(k)] = v;
            this._target.setScale(this._targetScale);
        }
        else if(k == "rotationX" || k == "rotationY" || k == "rotationZ"){
            this._targetRotation[TweenManager.GetTweenAttrName(k)] = v;
            this._target.setRotationFromEuler(this._targetRotation);
        }
        else if(k == "width" || k == "height"){
            this._targetTransform[k] = v;
        }
        else if(this._target[k]){
            this._target[k] = v;
        }
    }

    private getTargetAttr(k){
        this.checkTargetAttr(k);
        if(this._isTargetSelf){
            return this._target[k];
        }
        if(k == "x" || k == "y" || k == "z"){
            return this._targetPos[k];
        }
        else if(k == "scaleX" || k == "scaleY" || k == "scaleZ"){
            return this._targetScale[TweenManager.GetTweenAttrName(k)];
        }
        else if(k == "rotationX" || k == "rotationY" || k == "rotationZ"){
            return this._targetRotation[TweenManager.GetTweenAttrName(k)];
        }
        else{
            return this._target[k];
        }
    }

	private stopAction():void {
        // if not self.isStart or self.tweenId == 0 then return end
		//     TweenUtil.RemoveTween(self.tweenId)
		if(!this._isStart || this._tweenId == 0) return;
		TweenManager.RemoveTweenById(this._tweenId);
	}

	public reset():void {
		if(!this._isStart) return;
		this._canUpdate = false;
        this._curTime = 0;
		this._stepIdx = 0;
		this._loop = false;
        this._loopTotalCount = -1;
        this._loopCount = 0;
        this._loopComplete = null;
		this._onChangeObj = null;
		this._onChange = null;
        this.clearTarget();
		this._initialProps = {};
		this._steps = null;
		this._curStep = null;
		this._lastStep = null;
		this._isStart = false;
        this._tweenId = 0;
	}

    private clearTarget(){
        this._target = null
	    this._targetPos = null
	    this._targetTransform = null
	    this._targetScale = null
	    this._targetRotation = null
	    this._isTargetSelf = false
	    this._targetName = ""
    }
		
    private clearTargetByKey(k:string){
        if(k == "x" || k == "y" || k == "z"){
            this._targetPos = null;
        }
        else if(k == "scaleX" || k == "scaleY" || k == "scaleZ"){
            this._targetScale = null;
        }
        else if(k == "rotationX" || k == "rotationY" || k == "rotationZ"){
            this._targetRotation = null;
        }
        else if(k == "width" || k == "height"){
            this._targetTransform = null;
        }
    }
}

export default class TweenManager {
    public static TweenPool:GTween[] = [];
    private static getTween():GTween {
        let tw:GTween;
        let time:number = game.totalTime;
        for(let i = 0; i < TweenManager.TweenPool.length; i ++){
            let pool:GTween = TweenManager.TweenPool[i];
            if(time - pool.resetTime > 0.034){
                tw = TweenManager.TweenPool.shift();
                break;
            }
        }
        if(!tw){
            tw = new GTween();
        }
        return tw;
    }

    // public static TweenList:GTween[] = [];
    private static TweenAttrMap:any = {
        scaleX : "x",
        scaleY : "y",
        scaleZ : "z",
        rotationX : "x",
        rotationY : "y",
        rotationZ : "z",
        width : "width",
        height : "height",
    }
    private static TweenId:number = 0;
    private static TweenCount:number = 0;
    private static TweenList = {}
    private static TweenTargets = {}
    public static addTween(target:any,props?:any):GTween {
        if(!target) return;

        let tw:GTween = TweenManager.getTween();
        let tweenId:number = TweenManager.TweenId + 1;
        tw.setTarget(target,tweenId);
        tw.setProps(props);
        TweenManager.TweenId = tweenId;
        TweenManager.TweenList[tweenId] = tw;
        TweenManager.TweenTargets[tweenId] = target;
        TweenManager.TweenCount ++;
        // console.log("当前缓动数量：",TweenManager.TweenList.length,"缓动池数量：",TweenManager.TweenPool.length);
        return tw;
    }

    public static removeTweens(target:any):void {
        if(!target){
            return;
        }
        // if(!target.gtween_count || target.gtween_count == 0) return;
        for(let tweenId in TweenManager.TweenTargets){
            let id:number = Number(tweenId);
            let t = TweenManager.TweenTargets[id];
            if(t == target){
                TweenManager.RemoveTweenById(id);
            }
        }
        // let tws:GTween[] = TweenManager.TweenList;
        // for(let i:number = tws.length - 1; i >= 0; i--) {
        //     if(tws[i].getTarget() == target) {
        //         tws[i].reset();
        //         tws.splice(i,1);
        //     }
        // }
        // target.gtween_count = 0;
    }

    public static RemoveTweenById(tweenId:number){
        if(!tweenId || tweenId == 0){
            return;
        }
        let tw:GTween = TweenManager.TweenList[tweenId];
        if(!tw){
            return;
        }
        tw.reset();
        delete TweenManager.TweenList[tweenId];
        delete TweenManager.TweenTargets[tweenId];
        TweenManager.TweenCount --;
        tw.resetTime = game.totalTime;
        TweenManager.TweenPool.push(tw);
    }

    public static Update(deltaTime){
        if(TweenManager.TweenCount > 0){
            for(let twId in TweenManager.TweenList){
                TweenManager.TweenList[twId].runAction(deltaTime);
            }
        }
    }

    public static GetTweenAttrName(attrName:string){
        return TweenManager.TweenAttrMap[attrName];
    }
}