import { BaseDataState } from "./BaseDataState";
import { EntityState } from "../utils/EntityUtil";

/**
 * 数据层行走状态
 */
export class WalkState extends BaseDataState {
    private _moveSpeed: number = 1; // 移动速度
    private _arriveDistance: number = 5; // 到达目标的判定距离
    private _stopDuration: number = 2000; // 停止移动的最大持续时间（毫秒）
    private _lastMoveTime: number = 0;
    
    protected onEnter(): void {
        this._lastMoveTime = this.getElapsedTimeMs();
        this._moveSpeed = this._vo.moveSpeed || 1;
        // 设置实体状态
        this._vo.update({state:EntityState.walk});
    }
    
    protected updateState(dt: number): void {
        // 检查是否死亡
        if (this._vo.hp <= 0) {
            this.switchToDieState();
            return;
        }
        
        // 检查是否有目标
        if (!this._vo.battleVo || this._vo.battleVo.hp <= 0) {
            this.switchToIdleState();
            return;
        }
        
        // 检查是否到达攻击范围
        if (this.isInAttackRange()) {
            this.switchToAttackState();
            return;
        }
        
        // 更新移动
        this.updateMovement(dt);
        
        // 检查是否长时间无法移动
        if (this.getElapsedTimeMs() - this._lastMoveTime > this._stopDuration) {
            this.switchToIdleState();
        }
    }
    
    /**
     * 更新移动
     */
    private updateMovement(dt: number): void {
        if (!this._vo.battleVo) return;
        
        // 计算目标位置
        const targetPos = this._vo.battleVo.worldPos;
        const currentPos = this._vo.worldPos;
        
        // 计算方向向量
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离大于到达判定距离，则移动
        if (distance > this._arriveDistance) {
            // 归一化方向向量
            const nx = dx / distance;
            const ny = dy / distance;
            
            // 更新位置
            const moveDistance = this._moveSpeed * dt / 1000;
            this._vo.worldPos.x += nx * moveDistance;
            this._vo.worldPos.y += ny * moveDistance;
            
            // 更新移动时间
            this._lastMoveTime = this.getElapsedTimeMs();
        }
    }
    
    /**
     * 检查是否在攻击范围内
     */
    private isInAttackRange(): boolean {
        if (!this._vo.battleVo) return false;
        
        const targetPos = this._vo.battleVo.worldPos;
        const currentPos = this._vo.worldPos;
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 获取攻击距离
        const attackDistance = this._vo.attackDistance || 10;
        
        return distance <= attackDistance;
    }
    
    /**
     * 切换到攻击状态
     */
    private switchToAttackState(): void {
        if (this._stateMachine) {
            this._stateMachine.changeStateByType(EntityState.attackPre);
        }
    }
    
    /**
     * 切换到空闲状态
     */
    private switchToIdleState(): void {
        if (this._stateMachine) {
            this._stateMachine.changeStateByType(EntityState.idle);
        }
    }
    
    /**
     * 切换到死亡状态
     */
    private switchToDieState(): void {
        if (this._stateMachine) {
            this._stateMachine.changeStateByType(EntityState.die);
        }
    }
}