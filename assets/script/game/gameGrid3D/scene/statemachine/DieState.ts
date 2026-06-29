import { BaseDataState } from "./BaseDataState";
import { EntityState } from "../utils/EntityUtil";

/**
 * 数据层死亡状态
 */
export class DieState extends BaseDataState {
    private _dieDuration: number = 1500; // 死亡动画持续时间（毫秒）
    private _removeDelay: number = 500; // 死亡后移除实体的延迟时间（毫秒）
    private _isDieComplete: boolean = false;
    
    protected onEnter(): void {
        this._isDieComplete = false;
        this._dieDuration = this._vo.dieDuration || 1500;
        this._removeDelay = this._vo.removeDelay || 500;
        // 设置血量为0
        this._vo.hp = 0;
        
        // 播放死亡音效（如果需要）
        this.playDieSound();
    }
    
    protected updateState(dt: number): void {
        // 检查死亡动画是否完成
        if (!this._isDieComplete && this.hasReachedTime(this._dieDuration)) {
            this._isDieComplete = true;
            this.onDieComplete();
        }
        
        // 检查是否需要移除实体
        if (this._isDieComplete && this.hasReachedTime(this._dieDuration + this._removeDelay)) {
            this.removeEntity();
        }
    }
    
    /**
     * 死亡动画完成时调用
     */
    private onDieComplete(): void {
        // 可以在这里执行一些死亡完成后的逻辑
        // 比如掉落物品、显示死亡特效等
    }
    
    /**
     * 播放死亡音效
     */
    private playDieSound(): void {
        // 这里应该播放死亡音效
        // 具体实现需要根据项目的音频系统来完成
    }
    
    /**
     * 移除实体
     */
    private removeEntity(): void {
        // 这里应该移除实体
        // 具体实现需要根据项目的实体管理系统来完成
        console.log('移除实体:', this._vo.id);
    }
}
