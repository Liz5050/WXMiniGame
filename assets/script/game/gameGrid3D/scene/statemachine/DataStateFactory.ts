import { IdleState } from "./IdleState";
import { WalkState } from "./WalkState";
import { AttackState } from "./AttackState";
import { DieState } from "./DieState";
import { BaseDataState } from "./BaseDataState";
import { EntityState } from "../utils/EntityUtil";

/**
 * 数据状态工厂类
 * 用于创建和管理各种数据状态
 */
export class DataStateFactory {
    private static _instance: DataStateFactory;
    private _stateMap: Map<EntityState, typeof BaseDataState> = new Map();
    
    private constructor() {
        // 注册所有状态类
        this.registerState(EntityState.idle, IdleState);
        this.registerState(EntityState.walk, WalkState);
        this.registerState(EntityState.attackPre, AttackState);
        this.registerState(EntityState.die, DieState);
    }
    
    /**
     * 获取单例实例
     */
    public static getInstance(): DataStateFactory {
        if (!DataStateFactory._instance) {
            DataStateFactory._instance = new DataStateFactory();
        }
        return DataStateFactory._instance;
    }
    
    /**
     * 注册状态类
     */
    private registerState(type: EntityState, stateClass: typeof BaseDataState): void {
        this._stateMap.set(type, stateClass);
    }
    
    /**
     * 创建状态实例
     */
    public createState(state: EntityState): BaseDataState | null {
        const stateClass:any = this._stateMap.get(state);
        if (stateClass) {
            return new stateClass(state);
        }
        console.warn(`未找到状态类型: ${state}`);
        return null;
    }
    
    /**
     * 检查状态类型是否已注册
     */
    public hasState(state: EntityState): boolean {
        return this._stateMap.has(state);
    }
    
    /**
     * 获取所有已注册的状态类型
     */
    public getAllStateTypes(): EntityState[] {
        return Array.from(this._stateMap.keys());
    }
}