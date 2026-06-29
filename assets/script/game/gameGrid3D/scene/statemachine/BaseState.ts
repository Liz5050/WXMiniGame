import { BaseEntity } from "../entity/BaseEntity";

// 状态基类
export abstract class BaseState {
    protected _entity: BaseEntity;
    constructor(entity: BaseEntity) {
        this._entity = entity;
    }

    public enter(): void {
        this.onEnter();
    }

    public update(dt: number): void {
        this.onUpdate(dt);
    }

    public exit(): void {
        this.onExit();
    }
    
    protected abstract onEnter(): void;
    protected abstract onUpdate(dt: number): void;
    protected abstract onExit(): void;
}