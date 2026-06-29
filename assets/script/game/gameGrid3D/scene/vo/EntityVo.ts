import { Vec3 } from "cc";
import { BaseEntity } from "../entity/BaseEntity";
import { EntityState, EntityType } from "../utils/EntityUtil";
import BaseVo from "../../../base/BaseVo";
import { dispatchMsg } from "db://assets/script/utils/MessageCenter";
import { GEvent } from "db://assets/script/enum/GEvent";
import { IEntityVo } from "../../interface/GameInterface";

interface EntityVo extends TypeAlias<IEntityVo> {}
class EntityVo extends BaseVo {
    private _entity: BaseEntity;
    // private _stateMachine: StateMachine;

    public id: number = 0;
    public type: EntityType = null;
    public name: string = "";
    public level: number = 1;
    public pos: Vec3 = new Vec3();
    public worldPos: Vec3 = new Vec3();
    public forward: Vec3 = new Vec3(0, 0, 1);
    private _state: EntityState = EntityState.idle;
    public isSelected: boolean = false;
    protected onInit() {
        // if (!this._stateMachine) {
        //     this._stateMachine = new StateMachine(this);
        //     this._stateMachine.start(this._state);
        // }
    }

    public update(data:Partial<EntityVo>){
        super.update(data);
    }

    public setEntity(entity: BaseEntity) {
        this._entity = entity;
    }

    public get entity():BaseEntity{
        return this._entity;
    }

    // public setState(state: EntityState): boolean {
    //     if (this._state === state) return false;
    //     this._state = state;
    //     this.dispatchPropertyEvent("state");
    //     this._stateMachine && this._stateMachine.changeStateByType(state);
    //     return true;
    // }

    public getShowName(): string {
        return this.name || this.entityId;
    }

    public get modelUrl(): string {
        return "";
    }

    public clear(){
        dispatchMsg(GEvent.OnGameGrid3DEntityDelete,this.entityId);
    }

    public get entityId():string {
        return this.type + "_" + this.id;
    }

    public isDead(): boolean {
        return false;
    }
}
export default EntityVo;
