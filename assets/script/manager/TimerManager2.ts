/*
 * @Descripttion: 全局倒计时管理器
 * @version:
 * @Author: Ang
 * @Date: 2022-03-04 12:05:57
 * @LastEditors: laizhengping laizhengping@shiyue.com
 * @LastEditTime: 2023-08-14 09:31:38
 */

import {Component, director, Director, sys, _decorator} from "cc";


interface TaskData {
    taskId: number;
    loopTimes: number;
    delayInSeconds: number;
    method: Function;
    args: any;
    exeTime: number;
}

interface ScheduleTaskData {
    taskId: number; // 任务id
    times: number; // 循环次数
    method: Function; // 执行函数
    args: any; // 执行函数的参数
}

const { ccclass, property } = _decorator;

@ccclass
export class TimerManager2 extends Component {
    public static instance: TimerManager2;

    // 服务器时间
    private _curTime: number = 0;
    // 更新时间
    private _updateTime: number = 0;
    // 键值索引
    private _keyIndex: number = 0;
    // 倒计时字典
    private _handlerDir: Object = {};
    // 倒计时KEY列表
    private _handlerList: Array<any> = new Array();
    // 清除计数器列表
    private _clearHandlerList: Array<any> = new Array();
    // 凌晨刷新时间节点
    private _daily_refresh_time: number = 8;
    /**
     * init
     */
    protected onLoad(): void {
        TimerManager2.instance = this;
        this._curTime = Math.floor(new Date().getTime() / 1000);

        director.on(Director.EVENT_AFTER_DRAW, this.updateScheduleFrameTask, this);
    }

    protected update(dt: number): void {
        this._updateTime += dt;
        if (this._updateTime >= 1) {
            this._updateTime = 0;
        }
        this._curTime += dt;
        var timerHandler: any;
        for (let i = 0; i < this._handlerList.length; i++) {
            var key: any = this._handlerList[i];
            var timerHandler = this._handlerDir[key];
            if (timerHandler != null) {
                if (this._curTime >= timerHandler["exeTime"]) {
                    var method: any = timerHandler["method"];
                    var args: any = timerHandler["args"];

                    if (timerHandler["isLoop"]) {
                        timerHandler["exeTime"] = timerHandler["delay"] * 0.001 + this._curTime;
                    } else {
                        this.clearTimer(key);
                    }
                    method(...args);
                }
            }
        }

        for (let i = 0; i < this._clearHandlerList.length; i++) {
            var index: number = this._handlerList.indexOf(this._clearHandlerList[i]);
            if (index > -1) {
                this._handlerList.splice(index, 1);
            }
            this._handlerDir[this._clearHandlerList[i]] = null;
            delete this._handlerDir[this._clearHandlerList[i]];
        }
        this._clearHandlerList.length = 0;

        // 更新任务队列
        this.updateTask(dt);
    }

    public clearTimer(key: any): void {
        if (key != null && this._handlerDir[key] != null) {
            // this._handlerDir[key] = null;
            this._clearHandlerList.push(key);
        }
    }

    private addTimerHandler(isLoop: boolean, delay: number, method: any, cover: boolean, ...args): number {
        var key: number;
        if (cover) {
            // -- 先删除相同函数的计时
            this.remove(method);
        }

        this._keyIndex += 1;
        key = this._keyIndex;

        // // -- 如果执行时间小于1，直接执行
        // if(delay < 1)
        // {
        //     method(args);
        //     return -1;
        // }
        var handler: Object = {};
        handler["isLoop"] = isLoop;
        handler["delay"] = delay;
        handler["method"] = method;
        handler["args"] = args;
        handler["exeTime"] = delay * 0.001 + this._curTime;

        this._handlerDir[key] = handler;
        this._handlerList.push(key);
        return key;
    }

    // 设置服务器时间
    public setCurTime(value: number): void {
        //LogUtil.log("当前时间：",this._curTime.toString(),value);
        this._curTime = value;
        this._serverTime = value;
    }

    public getCurTime(): number {
        return this._curTime;
    }

    // 按照添加返回来移除
    public removeByKey(key: any): void {
        let handler = this._handlerDir[key];
        if (handler == null) return;
        this._handlerDir[key] = null;
        delete this._handlerDir[key];

        var index: number = this._handlerList.indexOf(key);
        if (index > -1) {
            this._handlerList.splice(index, 1);
        }
    }

    /**
     * 移除计时器
     * @param method 回调方法
     * @param cover 是否覆盖
     */
    public remove(method: any, cover: boolean = false) {
        let len = this._handlerList.length;
        let key = -1;
        for (let i = 0; i < len; i++) {
            let handler = this._handlerDir[this._handlerList[i]];
            if (handler == null) {
                continue;
            }
            if (handler["method"] == method) {
                // if (handler["method"]["TargetFunction"] == method["TargetFunction"]) {
                key = this._handlerList[i];
                break;
            }
        }
        if (key != -1) {
            var index: number = this._handlerList.indexOf(key);
            if (index > -1) {
                this._handlerList.splice(index, 1);
            }
            this._handlerDir[key] = null;
            delete this._handlerDir[key];
        }
    }

    //     --- /**定时执行一次
    // --- * @param delayTimeInMS  延迟时间(单位毫秒)
    // --- * @param method 结束时的回调方法
    // --- * @param args   回调参数
    // --- * @param cover  是否覆盖(true:同方法多次计时，后者覆盖前者。false:同方法多次计时，不相互覆盖)
    // --- * @return  cover=true时返回回调函数本身，cover=false时，返回唯一ID，均用来作为clearTimer的参数*/
    public doOnce(delayTimeInMS: number, method: any, cover: boolean = false, ...args): number {
        return this.addTimerHandler(false, delayTimeInMS, method, cover, ...args);
    }

    //     --- /**定时执行一次
    // --- * @param delayTimeInMS  延迟时间(单位毫秒)
    // --- * @param method 结束时的回调方法
    // --- * @param args   回调参数
    // --- * @param cover  是否覆盖(true:同方法多次计时，后者覆盖前者。false:同方法多次计时，不相互覆盖)
    // --- * @return  cover=true时返回回调函数本身，cover=false时，返回唯一ID，均用来作为clearTimer的参数*/
    public doLoop(delayTimeInMS: number, method: any, cover: boolean, ...args): number {
        return this.addTimerHandler(true, delayTimeInMS, method, cover, ...args);
    }

    //#region 计时器实现

    // 当前服务器时间
    private _serverTime: number = sys.now();
    // 任务id
    private _taskId: number = 1;
    // 当前任务列表
    private _taskList: Array<TaskData> = [];

    /** 获取当前服务器时间 */
    public get serverTime(): number {
        return this._serverTime;
    }

    /**
     * 更新任务计时器
     * @param dt
     */
    private updateTask(dt: number) {
        // 更新服务器时间
        this._serverTime += dt;

        // 待移除的任务
        const toRemoveTask = [];

        for (let i = 0; i < this._taskList.length; i++) {
            this._taskList[i].exeTime -= dt;
            if (this._taskList[i].exeTime <= 0) {
                let { taskId, loopTimes, method, delayInSeconds, args } = this._taskList[i];

                // 负数为无限循环
                if (loopTimes > 0) {
                    this._taskList[i].loopTimes--;
                    if (this._taskList[i].loopTimes <= 0) {
                        toRemoveTask.push(taskId);
                    } else {
                        this._taskList[i].exeTime = delayInSeconds;
                    }
                } else {
                    this._taskList[i].exeTime = delayInSeconds;
                }

                // 执行定时回调
                method(...args);
            }
        }

        // 移除执行完成的任务
        while (toRemoveTask.length) this.removeTask(toRemoveTask.pop());
    }

    /**
     * 添加计时任务
     * @param loopTimes         循环次数
     * @param delayInSeconds
     * @param method
     * @param args
     */
    public addTimerTask(loopTimes: number, delayInSeconds: number, method: Function, ...args): number {
        const taskId = this._taskId;
        this._taskList.push({ taskId, loopTimes, delayInSeconds, method, args, exeTime: delayInSeconds });
        this._taskId++;
        return taskId;
    }

    /**
     * 执行一次性定时任务
     * @param delayInSeconds    延时几秒执行
     * @param method            执行函数
     * @param args              透传参数
     * @returns taskId          任务ID
     */
    public addOnceTask(delayInSeconds: number, method: Function, ...args): number {
        return this.addTimerTask(1, delayInSeconds, method, ...args);
    }

    /**
     * 执行循环定时任务
     * @param delayInSeconds 几秒一次
     * @param method         执行函数
     * @param args           透传参数
     * @returns taskId       任务ID
     */
    public addLoopTask(delayInSeconds: number, method: Function, ...args): number {
        return this.addTimerTask(-1, delayInSeconds, method, ...args);
    }

    /**
     * 移除任务
     * @param taskId    要移除的任务ID
     */
    public removeTask(taskId: number) {
        const taskIndex = this._taskList.findIndex((taskData) => taskData.taskId == taskId);
        if (taskIndex !== -1) {
            this._taskList.splice(taskIndex, 1);
        }
    }

    //#endregion

    //#region 逐帧执行逻辑，会根据当前帧耗时决定当前帧是否执行

    private _scheduleTaskId: number = 1;
    private _scheduleTaskList: Array<ScheduleTaskData> = [];

    /**
     * 添加任务到逐帧队列中
     * 逐帧队列中的任务会根据当前帧耗时来决定是否执行，并且每一帧最多只执行一个逐帧任务，多次执行的任务将在每次执行后被移至队尾。
     * @param callback  任务函数
     * @param times     执行次数，0表示一直循环
     * @param args      任务函数传参
     * @returns
     */
    public scheduleFrameTask(callback: Function, times: number = 0, ...args): number {
        // if (sys.platform === sys.WECHAT_GAME && sys.os === sys.OS_WINDOWS) {
        //     // pc上性能足够，不逐帧处理
        //     const taskTimes = times || 1;
        //     for (let i = 0; i < taskTimes; i++) {
        //         callback(...args);
        //     }
        //     return null;
        // } else {
        //     const taskId = this._scheduleTaskId;
        //     this._scheduleTaskList.push({ taskId, method: callback, times, args });
        //     this._scheduleTaskId++;
        //     return taskId;
        // }
        const taskId = this._scheduleTaskId;
        this._scheduleTaskList.push({ taskId, method: callback, times, args });
        this._scheduleTaskId++;
        return taskId;
    }

    /**
     * 移除逐帧任务
     * @param taskId
     */
    public unscheduleFrameTask(taskId: number) {
        const taskIndex = this._scheduleTaskList.findIndex((taskData) => taskData.taskId === taskId);
        taskIndex !== -1 && this._scheduleTaskList.splice(taskIndex, 1);
    }

    /**
     * 逐帧执行回调
     * @param dt
     * @returns
     */
    private updateScheduleFrameTask(dt: number) {
        if (!this._scheduleTaskList || !this._scheduleTaskList.length) return;

        // 单帧时间超出了，下帧再算
        // const frameTimeElapsed = (performance.now() - director._lastUpdate) / 1000;
        // if (frameTimeElapsed > 1 / game.getFrameRate()) return;

        // 一帧只执行一个回调，其他依次在后续帧执行
        const taskData = this._scheduleTaskList.shift();
        if (taskData.times > 0) {
            taskData.times--;
            if (taskData.times > 0) this._scheduleTaskList.push(taskData);
        } else {
            this._scheduleTaskList.push(taskData);
        }
        taskData.method(...taskData.args);
    }

    // 时间是否在更新的五点之后（当前时间在[0-8]点内，需要用前一天的8点判断）
    public afterUpdateTime5AM(get_time) {
        let time = this.getCurTime();
        let time_b = this.getDayAnyHourTime(time, this._daily_refresh_time);
        get_time = get_time || time;

        if (time_b.time > time * 1000) {//当前时间在8点更新前，需要判断前一天的8点
            time_b.time = time_b.time - 86400000;
        }
        return get_time * 1000 >= time_b.time
    }

    // 获取时间戳的任意点的时间点
    // 默认： cur_time 当前时间， hour： 0点
    public getDayAnyHourTime(cur_time, hour) {
        cur_time = cur_time || this.getCurTime();
        let data_time = new Date(cur_time * 1000); //服务器发过来的时间以秒为单位
        let year = data_time.getFullYear();
        let month = data_time.getMonth() + 1;
        let day = data_time.getDate();
        let str = `${year}-${month}-${day} ${hour}:${0}:${0}`;
        let time = new Date(str).getTime() || 0;

        return { time: time, data_time: data_time }
    }
    //#endregion
}
