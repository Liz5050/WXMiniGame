import { GameGridCache } from "../../../cache/GameGridCache";
import MathUtils from "../../../utils/MathUtils";
import { EntityState, EntityType, EntityVo } from "./EntityVo";

export class GridEntityVo extends EntityVo{
    public constructor(){
        super();
        this._type = EntityType.Grid;
        this._id = GameGridCache.EntityIds[this._type];
    }

    protected init(): void {
        this._attackDistance = 9999;
        this._atkPreTime = 300;
        this._atkTime = 100;
        this._state = EntityState.none;
        this._defaultState = EntityState.none;
        let maxHp = MathUtils.getRandomInt(200,500);
        this._hp = maxHp;
        this._maxHp = maxHp;
        this._attack = 100;
    }

    protected playNone(): void {
        if (this.battleVo && this.battleVo.isDead()) {
            this.battleVo = null;
        }
    }

    protected playHurt(): void {
        if(this._entity)this._entity.hurt();
    }

    protected playAttack(): void {
        if (!this.battleVo) return;
        this.battleVo.hp -= this._attack;
    }
}