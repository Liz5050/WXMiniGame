import { BaseDataState } from "./BaseDataState";
import { EntityState } from "../utils/EntityUtil";
import { CacheManager } from "../../../../manager/CacheManager";

/**
 * 数据层空闲状态
 */
export class IdleState extends BaseDataState {
    private _searchInterval: number = 1000; // 寻敌间隔（毫秒）
    private _lastSearchTime: number = 0;
    
    protected onEnter(): void {
        this._lastSearchTime = 0;
        // 设置实体状态
        this._vo.update({state:EntityState.idle});
    }
    
    protected updateState(dt: number): void {
        // 检查是否死亡
        if (this._vo.hp <= 0) {
            this.switchToDieState();
            return;
        }
        
        // 按间隔时间搜索目标
        if (this.getElapsedTimeMs() - this._lastSearchTime >= this._searchInterval) {
            this._lastSearchTime = this.getElapsedTimeMs();
            this.searchTarget();
        }
    }
    
    /**
     * 搜索目标
     */
    private searchTarget(): void {
        // // 获取搜索类型（需要根据实体类型确定）
        // const searchTypes = this.getSearchTypes();
        
        // // 查找目标
        // const battleVo = CacheManager.gameGrid.findTargetByList(this._vo.worldPos, searchTypes);
        
        // // 找到目标后切换状态
        // if (battleVo) {
        //     this._vo.battleVo = battleVo;
        //     this.switchToWalkState();
        // }
    }
    
    /**
     * 获取搜索目标类型
     */
    private getSearchTypes(): number[] {
        // 这里需要根据实体类型确定搜索目标类型
        // 例如：格子搜索敌人，敌人搜索格子和英雄
        // 具体类型值需要根据项目实际情况设置
        return [];
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
     * 切换到死亡状态
     */
    private switchToDieState(): void {
        if (this._stateMachine) {
            this._stateMachine.changeStateByType(EntityState.die);
        }
    }
}