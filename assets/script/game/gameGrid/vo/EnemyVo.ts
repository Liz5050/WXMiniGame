import { GameGridCache } from "../../../cache/GameGridCache";
import MathUtils from "../../../utils/MathUtils";
import { EntityType, EntityVo } from "./EntityVo";

export class EnemyVo extends EntityVo{
    public constructor(){
        super();
        this._type = EntityType.Enemy;
        this._id = GameGridCache.EntityIds[this._type];
        this._name = `小妖怪${this.entityId}`;
    }

    protected init(): void {
        this._attackDistance = 1.5;
        this._stiffnessTime = 500;
        this._dieTime = this._stiffnessTime;
        this._atkAfterTime = 266;
        this._atkPreTime = 400;
        this._attackCD = 1000;
        this._atkTime = 133;
        this._pos.x = MathUtils.getRandom(0, 9);
        this._pos.z = MathUtils.getRandom(0, 5);
        this._speed = MathUtils.getRandom(1,3) / 10;
        if(this._maxHp <= 0) {
            this._maxHp = 10;
        }
        this._hp = this._maxHp;
        this._attack = 20;
    }
}