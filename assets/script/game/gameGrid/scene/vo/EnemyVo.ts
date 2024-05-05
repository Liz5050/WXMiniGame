import { GameGridCache } from "../../../../cache/GameGridCache";
import MathUtils from "../../../../utils/MathUtils";
import { EntityType } from "../utils/EntityUtil";
import { EntityVo } from "./EntityVo";

export class EnemyVo extends EntityVo{
    public constructor(){
        super();
        this._type = EntityType.Enemy;
        this._id = GameGridCache.EntityIds[this._type];
        this._name = `小妖怪${this.entityId}`;
    }

    protected init(): void {
        this._attackDistance = 1.5;
        this._stiffnessTime = 0;
        this._dieTime = 500;
        this._atkAfterTime = 266;
        this._atkPreTime = 400;
        this._attackCD = 2500;
        this._atkTime = 133;
        this._pos.x = MathUtils.getRandom(0, 9);
        this._pos.z = -MathUtils.getRandom(5, 15);
        this._speed = MathUtils.getRandom(1,3) / 10;
        if(this._maxHp <= 0) {
            this._maxHp = 15;
        }
        this._hp = this._maxHp;
        this._attack = 2;
    }
}