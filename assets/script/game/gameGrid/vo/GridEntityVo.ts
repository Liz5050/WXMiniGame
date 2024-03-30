import { math } from "cc";
import { GameGridCache } from "../../../cache/GameGridCache";
import MathUtils from "../../../utils/MathUtils";
import { EntityState, EntityType, EntityVo } from "./EntityVo";

export class GridEntityVo extends EntityVo{
    public atkDelay:number = 0;
    public constructor(){
        super();
        this._type = EntityType.Grid;
        this._id = GameGridCache.EntityIds[this._type];
    }

    protected init(): void {
        this._attackDistance = 9999;
        this.atkDelay = this.id * 50;
        this._atkPreTime = 300 + this.atkDelay;
        this._atkTime = 100;
        this._state = EntityState.none;
        this._defaultState = EntityState.none;
        let maxHp = MathUtils.getRandomInt(200,500);
        this._hp = maxHp;
        this._maxHp = maxHp;
        this._attack = 50;
    }

    public updatePos(pos: math.Vec3, worldPosition: math.Vec3): void {
        super.updatePos(pos,worldPosition);
        this.atkDelay = pos.x * 50;
        this._atkPreTime = 300 + this.atkDelay;
    }
}