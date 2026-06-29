import { EntityState } from "../utils/EntityUtil";
import type EntityVo from "../vo/EntityVo";
import type { StateMachine } from "./StateMachine";

/**
 * 基础数据状态类
 * 所有具体状态类的父类
 */
export abstract class BaseDataState {
    protected _stateMachine: StateMachine;
    protected _vo: EntityVo; // 实体数据对象
    protected _enterTime: number = 0; // 进入状态的时间
    protected _elapsedTime: number = 0; // 在当前状态停留的时间
    private _state: EntityState;
    constructor(state: EntityState) {
        this._state = state;
    }
    
    public get state(): EntityState {
        return this._state;
    }

    public get entityVo(): EntityVo {
        return this._vo;
    }
 
    public setStateMachine(stateMachine: StateMachine): void {
        this._stateMachine = stateMachine;
        this._vo = stateMachine.entityVo;
    }

    public enter(): void {
        this._enterTime = Date.now();
        this._elapsedTime = 0;
        this.onEnter();
    }

    public exit(){
        this.onExit();
    }
    
    protected onEnter(): void {}
    protected onExit(): void {}
    
    /**
     * 更新状态时调用
     */
    public onUpdate(dt: number): void {
        this._elapsedTime = Date.now() - this._enterTime;
        this.updateState(dt);
    }
    
    
    
    
    /**
     * 具体状态更新逻辑，由子类实现
     */
    protected abstract updateState(dt: number): void;
    
    /**
     * 获取在当前状态停留的时间（毫秒）
     */
    protected getElapsedTimeMs(): number {
        return this._elapsedTime;
    }
    
    /**
     * 获取在当前状态停留的时间（秒）
     */
    protected getElapsedTimeSec(): number {
        return this._elapsedTime / 1000;
    }
    
    /**
     * 检查是否达到指定时间（毫秒）
     */
    protected hasReachedTime(ms: number): boolean {
        return this._elapsedTime >= ms;
    }
    
    /**
     * 重置状态计时
     */
    protected resetTimer(): void {
        this._enterTime = Date.now();
        this._elapsedTime = 0;
    }
}
