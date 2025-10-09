import { game } from "cc";
import { EntityState } from "../utils/EntityUtil";
import { DataStateFactory } from "./DataStateFactory";
import { BaseDataState } from "./BaseDataState";
import EntityVo from "../vo/EntityVo";

/**
 * 数据状态机基类
 * 负责管理状态切换和定时更新
 */
export class StateMachine {
    private _currentState: BaseDataState;
    private _vo: EntityVo; // 实体数据对象
    private _lastUpdateTime: number = 0;
    private _updateInterval: number = 0.1; // 默认更新频率 100ms
    private _isRunning: boolean = false;
    private _stateFactory: DataStateFactory;
    
    constructor(vo: EntityVo) {
        this._vo = vo;
        this._stateFactory = DataStateFactory.getInstance();
    }
    
    /**
     * 启动状态机
     * @param state 初始状态类型
     */
    public start(state: EntityState = EntityState.idle): void {
        if (this._isRunning) return;
        this._isRunning = true;
        this._lastUpdateTime = game.totalTime;
        
        // 设置初始状态
        if (!this._currentState) {
            const initialState = this._stateFactory.createState(state);
            if (initialState) {
                this.changeState(initialState);
            }
        }
        
        // 注册游戏循环更新
        // game.on(game.EVENT_GAME_UPDATE, this.onUpdate, this);
    }
    
    /**
     * 停止状态机
     */
    public stop(): void {
        if (!this._isRunning) return;
        this._isRunning = false;
        // 取消注册游戏循环更新
        // game.off(game.EVENT_GAME_UPDATE, this.onUpdate, this);
    }
    
    /**
     * 切换状态
     */
    public changeState(newState: BaseDataState): void {
        
    }
    
    /**
     * 通过状态类型切换状态
     * @param state 状态类型
     */
    public changeStateByType(state: EntityState): boolean {
        // 检查是否已存在相同状态
        if (this._currentState && this._currentState.state === state) {
            return false;
        }
        const newState = this._stateFactory.createState(state);
        if (newState) {
            // 设置新状态并进入
            if (this._currentState) {
                this._currentState.exit();
            }
            this._currentState = newState;
            this._currentState.setStateMachine(this);
            this._currentState.enter();
            return true;
        }
        return false;
    }
    
    /**
     * 更新方法，由游戏循环调用
     */
    private onUpdate(dt: number): void {
        // 按固定频率更新
        const currentTime = game.totalTime;
        if (currentTime - this._lastUpdateTime >= this._updateInterval * 1000) {
            this._lastUpdateTime = currentTime;
            this._currentState?.onUpdate(dt);
        }
    }
    
    /**
     * 获取当前状态
     */
    public getCurrentState(): BaseDataState {
        return this._currentState;
    }
    
    /**
     * 获取实体数据
     */
    public get entityVo(): EntityVo {
        return this._vo;
    }
    
    /**
     * 设置更新频率
     */
    public setUpdateInterval(interval: number): void {
        this._updateInterval = interval;
    }
    
    /**
     * 清理状态机
     */
    public destroy(): void {
        this.stop();
        this._currentState = null;
        this._vo = null;
    }
}