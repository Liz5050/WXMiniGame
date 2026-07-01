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
    public visible: boolean = true;
    /** 占格列数（X 轴方向格子数） */
    public occupyCol: number = 1;
    /** 占格行数（Z 轴方向格子数） */
    public occupyRow: number = 1;
    protected onInit() {
        this.worldPos.set(this.pos);
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

    public get state(): EntityState {
        return this._state;
    }

    public setState(state: EntityState): boolean {
        if (this._state === state) return false;
        const previousState = this._state;
        this._state = state;
        this.dispatchPropertyEvent("state", previousState);
        return true;
    }

    public updatePos(pos: Vec3): void {
        this.pos.set(pos);
        this.worldPos.set(pos);
        this.dispatchPropertyEvent("pos");
    }

    public updateForward(forward: Vec3): void {
        this.forward.set(forward);
        this.dispatchPropertyEvent("forward");
    }

    public getShowName(): string {
        return this.name || this.entityId;
    }

    public get modelUrl(): string {
        return "";
    }

    public get modelBodyUrl(): string {
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

    /** 占格区域起始列（含） */
    public getOccupyMinCol(): number {
        return Math.floor(this.pos.x - (this.occupyCol - 1) / 2);
    }

    /** 占格区域起始行（含） */
    public getOccupyMinRow(): number {
        return Math.floor(this.pos.z - (this.occupyRow - 1) / 2);
    }

    /** 判断格子坐标是否落在该实体占格范围内 */
    public containsGrid(col: number, row: number): boolean {
        const minCol = this.getOccupyMinCol();
        const minRow = this.getOccupyMinRow();
        return col >= minCol && col < minCol + this.occupyCol
            && row >= minRow && row < minRow + this.occupyRow;
    }
}
export default EntityVo;
