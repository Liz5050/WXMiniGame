import { GameGridCache } from "../../../cache/GameGridCache";
import MathUtils from "../../../utils/MathUtils";
import { EntityType, EntityVo } from "./EntityVo";

export class EnemyVo extends EntityVo{
    public constructor(){
        super();
        this._type = EntityType.Enemy;
        this._id = GameGridCache.EntityIds[this._type];
    }

    protected init(): void {
        this._attackDistance = 1;
        this._stiffnessTime = 500;
        this._atkAfterTime = 266;
        this._atkPreTime = 400;
        this._attackCD = 1000;
        this._atkTime = 133;
        this._pos.x = MathUtils.getRandom(0, 9);
        this._pos.z = MathUtils.getRandom(0, 5);
        this._speed = MathUtils.getRandom(1,3) / 10;
        let maxHp = MathUtils.getRandomInt(500,1000);
        this._hp = maxHp;
        this._maxHp = maxHp;
        this._attack = MathUtils.getRandomInt(20,100);
    }
    protected playAttack(): void {
        this.attackBattleVo();
    }

    protected playIdle(): void {
        if (this.battleVo && this.battleVo.isDead()) {
            this.battleVo = null;
            this._attack = MathUtils.getRandomInt(20, 100);
        }
    }

    private attackBattleVo() {
        if (!this.battleVo) return;
        this.battleVo.hp -= this._attack;
    }
}