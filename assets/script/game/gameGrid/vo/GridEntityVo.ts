import { EntityVo } from "./EntityVo";

export class GridEntityVo extends EntityVo{
    public constructor(){
        super();
    }

    protected playDie(): void {
        if (!this.battleVo) return;
        this.battleVo.hp -= this._attack;
    }
}