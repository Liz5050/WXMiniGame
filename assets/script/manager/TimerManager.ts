import { Component, _decorator, director, game, js } from "cc";
import { ObjectPool } from "../utils/ObjectPool";
const {ccclass} = _decorator
/**
 * Timer管理器
 */
@ccclass
export class TimerManager extends Component{
    public static instance:TimerManager;
    private _handlers:Array<TimerHandler>;
    private _delHandlers:Array<TimerHandler>;
    private _currTime:number;
    private _currFrame:number;
    private _count:number;
    private _timeScale:number;
    private _frameRates:Array<number> = [];
    private _frameRate:number;//最近30帧平均帧频
    private _lastDoFrameTime:number=0;

    private timeOut:number = 0;
    /**
     * 构造函数
     */
    public onLoad() {
        TimerManager.instance = this;
        js.setClassName("TimerHandler",TimerHandler);
        this._handlers = new Array<TimerHandler>();
        this._delHandlers = new Array<TimerHandler>();
        this._currTime = game.totalTime;
        this._currFrame = 0;
        this._count = 0;
        this._timeScale = 1;

        director.getScheduler().schedule(this.onEnterFrame, this,0);
        // egret.Ticker.getInstance().register(this.onEnterFrame, this);
        // egret.startTick(this.onEnterFrame, this);
    }

    /**
     * 设置时间参数
     * @param timeScale
     */
    public setTimeScale(timeScale:number):void {
        this._timeScale = timeScale;
    }

    /**
     * 每帧执行函数
     * @param frameTime
     */
    private onEnterFrame():void {
        this._currFrame++;
        this._currTime = game.totalTime;
		// App.DebugUtils.start("TimerManager:"); //定时debug先关闭
        for (var i:number = 0; i < this._count; i++) {
            var handler:TimerHandler = this._handlers[i];
            var t:number = handler.userFrame ? this._currFrame : this._currTime;
            if (t >= handler.exeTime) {
                // let interval:number = t - handler.exeTime;
                // App.DebugUtils.start(handler.method.toString()); //定时debug先关闭
                handler.method.call(handler.methodObj, (this._currTime - handler.dealTime) * this._timeScale);
                // App.DebugUtils.stop(handler.method.toString()); //定时debug先关闭
                handler.dealTime = this._currTime;
                handler.exeTime = t + handler.delay;
                // let exeDelay:number = handler.delay;
                // if(handler.userFrame) {
                //     this.timeOut = 5;
                //     exeDelay = handler.delay * 33;
                // }
                // else {
                //     this.timeOut = 200;
                // }
                // if(interval > exeDelay + this.timeOut) {
                //     console.log("定时器执行间隔超出目标delay，执行间隔：",interval,"目标delay：",handler.delay,"当前执行时间：",this._currTime,"下次执行时间：",handler.exeTime,"当前帧：",this._currFrame);
                // }

                if (!handler.repeat) {
                    handler.repeatCount--;
                    if (handler.repeatCount < 1) {
                        if (handler.complateMethod) {
                            handler.complateMethod.apply(handler.complateMethodObj);
                        }
                        this._delHandlers.push(handler);
                    }
                }
            }
        }
        while (this._delHandlers.length) {
            var handler:TimerHandler = this._delHandlers.pop();
            this.remove(handler.method, handler.methodObj, true);
        }
        this.doFrameRate();
		// App.DebugUtils.stop("TimerManager:"); //定时debug先关闭
    }

    private doFrameRate():void
    {
        let _frameHold:number = this._currTime - this._lastDoFrameTime;
        let _curFrameRate:number = 1000 / _frameHold;
        this._lastDoFrameTime = this._currTime;
        if (this._frameRates.length < 30)
        {
            this._frameRates.push(_curFrameRate);
            return;
        }
        else
        {
            this._frameRates.shift();
            this._frameRates.push(_curFrameRate);
        }
        let _total:number = 0;
        for (let i:number = 0; i < this._frameRates.length; i++)
        {
            _total += this._frameRates[i];
        }
        this._frameRate = _total / this._frameRates.length;
    }

    private create(useFrame:boolean, delay:number, repeatCount:number, method:Function, methodObj:any, complateMethod:Function, complateMethodObj:any):void {
        //参数监测
        if (delay < 0 || repeatCount < 0 || method == null) {
            return;
        }

        //先删除相同函数的计时
        // this.removeDel(method, methodObj);
        this.remove(method, methodObj);

        //创建
        var handler:TimerHandler = ObjectPool.pop("TimerHandler");
        handler.userFrame = useFrame;
        handler.repeat = repeatCount == 0;
        handler.repeatCount = repeatCount;
        handler.delay = delay;
        handler.method = method;
        handler.methodObj = methodObj;
        handler.complateMethod = complateMethod;
        handler.complateMethodObj = complateMethodObj;
        handler.exeTime = delay + (useFrame ? this._currFrame : this._currTime);
        handler.dealTime = this._currTime;
        this._handlers.push(handler);
        this._count++;
    }

    /**
     *
     * 定时执行
     * @param delay 执行间隔:毫秒
     * @param repeatCount 执行次数, 0为无限次
     * @param method 执行函数
     * @param methodObj 执行函数所属对象
     * @param complateMethod 完成执行函数
     * @param complateMethodObj 完成执行函数所属对象
     *
     */
    public doTimer(delay:number, repeatCount:number, method:Function, methodObj:any, complateMethod:Function = null, complateMethodObj:any = null):void {
        this.create(false, delay, repeatCount, method, methodObj, complateMethod, complateMethodObj);
    }

    /**
     * 延迟执行
     */
    public doDelay(delay:number, method:Function, methodObj:any):void{
        this.doTimer(delay, 1, method, methodObj);
    }

    /**
     *
     * 定时执行
     * @param delay 执行间隔:帧频
     * @param repeatCount 执行次数, 0为无限次
     * @param method 执行函数
     * @param methodObj 执行函数所属对象
     * @param complateMethod 完成执行函数
     * @param complateMethodObj 完成执行函数所属对象
     *
     */
    public doFrame(delay:number, repeatCount:number, method:Function, methodObj:any, complateMethod:Function = null, complateMethodObj:any = null):void {
        this.create(true, delay, repeatCount, method, methodObj, complateMethod, complateMethodObj);
    }

    /**
     * 定时器执行数量
     * @return
     *
     */
    public get count():number {
        return this._count;
    }

    /**
     * 清理del数组
     * @param method 要移除的函数
     * @param methodObj 要移除的函数对应的对象
     */
    public removeDel(method:Function, methodObj:any):void {
        for (var i:number = 0; i < this._delHandlers.length; i++) {
            var handler:TimerHandler = this._delHandlers[i];
            if (handler.method == method && handler.methodObj == methodObj) {
                this._delHandlers.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 清理
     * @param method 要移除的函数
     * @param methodObj 要移除的函数对应的对象
     * @param repeatEnd 要判断重复次数为0
     */
    public remove(method:Function, methodObj:any, repeatEnd:boolean = false):void {
        for (var i:number = 0; i < this._count; i++) {
            var handler:TimerHandler = this._handlers[i];
            if (handler.method == method && handler.methodObj == methodObj && (!repeatEnd || handler.repeatCount<1)) {
                this._handlers.splice(i, 1);
                ObjectPool.push(handler);
                this._count--;
                break;
            }
        }
    }

    /**
     * 清理
     * @param methodObj 要移除的函数对应的对象
     */
    public removeAll(methodObj:any):void {
        for (var i:number = 0; i < this._count; i++) {
            var handler:TimerHandler = this._handlers[i];
            if (handler.methodObj == methodObj) {
                this._handlers.splice(i, 1);
                ObjectPool.push(handler);
                this._count--;
                i--;
            }
        }
    }

    /**
     * 检测是否已经存在
     * @param method
     * @param methodObj
     *
     */
    public isExists(method:Function, methodObj:any):boolean {
        for (var i:number = 0; i < this._count; i++) {
            var handler:TimerHandler = this._handlers[i];
            if (handler.method == method && handler.methodObj == methodObj) {
                return true;
            }
        }
        return false;
    }

    public get frameRate():number
    {
        return this._frameRate;
    }

    public get curFrame():number
    {
        return this._currFrame;
    }
}


class TimerHandler {
    /**执行间隔*/
    public delay:number = 0;
    /**是否重复执行*/
    public repeat:boolean;
    /**重复执行次数*/
    public repeatCount:number = 0;
    /**是否用帧率*/
    public userFrame:boolean;
    /**执行时间*/
    public exeTime:number = 0;
    /**处理函数*/
    public method:Function;
    /**处理函数所属对象*/
    public methodObj:any;
    /**完成处理函数*/
    public complateMethod:Function;
    /**完成处理函数所属对象*/
    public complateMethodObj:any;
    /**上次的执行时间*/
    public dealTime:number = 0;

    /**清理*/
    public clear():void {
        this.method = null;
        this.methodObj = null;
        this.complateMethod = null;
        this.complateMethodObj = null;
    }
}