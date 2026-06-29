import { BaseDataState } from "./BaseDataState";
import { EntityState } from "../utils/EntityUtil";

/**
 * 数据层攻击状态
 */
export class AttackState extends BaseDataState {
    private _attackPreTime: number = 300; // 攻击前摇时间（毫秒）
    private _attackTime: number = 500; // 攻击动作时间（毫秒）
    private _attackPostTime: number = 200; // 攻击后摇时间（毫秒）
    private _attackCD: number = 1000; // 攻击冷却时间（毫秒）
    private _lastAttackTime: number = 0;
    private _currentAttackState: 'pre' | 'attack' | 'post' = 'pre';

    protected onEnter(): void {
        this._currentAttackState = 'pre';
        this._attackPreTime = this._vo.attackPreTime || 300;
        this._attackTime = this._vo.attackTime || 500;
        this._attackPostTime = this._vo.attackPostTime || 200;
        this._attackCD = this._vo.attackCD || 1000;
    }
    
    protected updateState(dt: number): void {
        // 检查是否死亡
        if (this._vo.hp <= 0) {
            this.switchToDieState();
            return;
        }
        
        // 检查目标是否存在
        if (!this._vo.battleVo || this._vo.battleVo.hp <= 0) {
            this.switchToIdleState();
            return;
        }
        
        // 根据当前攻击阶段进行处理
        switch (this._currentAttackState) {
            case 'pre':
                this.handleAttackPre();
                break;
            case 'attack':
                this.handleAttack();
                break;
            case 'post':
                this.handleAttackPost();
                break;
        }
    }
    
    /**
     * 处理攻击前摇阶段
     */
    private handleAttackPre(): void {
        if (this.hasReachedTime(this._attackPreTime)) {
            this._currentAttackState = 'attack';
            this.resetTimer();
            this._vo.setState(EntityState.attack);
        }
    }
    
    /**
     * 处理攻击动作阶段
     */
    private handleAttack(): void {
        // 执行攻击伤害计算
        this.executeAttack();
        
        if (this.hasReachedTime(this._attackTime)) {
            this._currentAttackState = 'post';
            this.resetTimer();
            // this._vo.setState(EntityState.attackPost);
        }
    }
    
    /**
     * 处理攻击后摇阶段
     */
    private handleAttackPost(): void {
        if (this.hasReachedTime(this._attackPostTime)) {
            // 检查是否还在攻击范围内
            if (this.isInAttackRange()) {
                // 检查攻击冷却
                const currentTime = Date.now();
                if (currentTime - this._lastAttackTime >= this._attackCD) {
                    // 再次进入攻击前摇
                    this._currentAttackState = 'pre';
                    this.resetTimer();
                    this._lastAttackTime = currentTime;
                    this._vo.setState(EntityState.attackPre);
                }
            } else {
                // 不在攻击范围内，切换到行走状态
                this.switchToWalkState();
            }
        }
    }
    
    /**
     * 执行攻击伤害计算
     */
    private executeAttack(): void {
        if (!this._vo.battleVo) return;
        
        // 计算伤害（这里是示例，实际伤害计算需要根据游戏逻辑）
        const damage = this.calculateDamage();
        
        // 扣除目标血量
        this._vo.battleVo.hp = Math.max(0, this._vo.battleVo.hp - damage);
        
        // 记录最后攻击时间
        this._lastAttackTime = Date.now();
    }
    
    /**
     * 计算攻击伤害
     */
    private calculateDamage(): number {
        // 获取攻击力
        const attack = this._vo.attack || 10;
        
        // 简单的伤害计算（实际游戏中可能会有暴击、闪避等机制）
        return attack;
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
     * 切换到行走状态
     */
    private switchToWalkState(): void {
        if (this._stateMachine) {
            this._stateMachine.changeStateByType(EntityState.walk);
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
