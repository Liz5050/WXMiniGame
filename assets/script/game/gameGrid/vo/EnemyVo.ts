import MathUtils from "../../../utils/MathUtils";
import { EntityVo } from "./EntityVo";

export class EnemyVo extends EntityVo{
    public constructor(){
        super();
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