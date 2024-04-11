import { math } from "cc";
import { GameGridCache } from "../../../cache/GameGridCache";
import { EntityState, EntityType, EntityVo } from "./EntityVo";

export class GridHeroVo extends EntityVo{
    public atkDelay:number = 0;
    public constructor(){
        super();
        this._type = EntityType.GridHero;
        this._id = GameGridCache.EntityIds[this._type];
        this._name = `Lv.${this.level}`;
    }

    protected init(): void {
        this._state = EntityState.none;
        this._attackCD = 1000;
        this._attackDistance = 100;
        this.atkDelay = this.id * 50;
        this._atkPreTime = 300 + this.atkDelay;
        this._atkTime = 100;
        let maxHp = 500;//MathUtils.getRandomInt(200,500);
        this._hp = maxHp;
        this._maxHp = maxHp;
        this._attack = 10;
        this._skills = [2];
    }

    public updatePos(pos: math.Vec3, worldPosition: math.Vec3): void {
        super.updatePos(pos,worldPosition);
        this.atkDelay = pos.x * 50;
        this._atkPreTime = 300 + this.atkDelay;
    }

    public getShowName():string{
        return `Lv.${this.level}`;
    }
}