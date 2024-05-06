import { math } from "cc";
import { GameGridCache } from "../../../../cache/GameGridCache";
import { EntityVo } from "./EntityVo";
import { EntityState, EntityType } from "../utils/EntityUtil";
import { CacheManager } from "../../../../manager/CacheManager";

export class GridHeroVo extends EntityVo{
    public atkDelay:number = 0;
    private _atkSpeed:number = 2;
    public constructor(){
        super();
        this._type = EntityType.GridHero;
        this._id = GameGridCache.EntityIds[this._type];
        this._name = `Lv.${this.level}`;
    }

    protected init(): void {
        this._attackCD = 1000 / this._atkSpeed;
        this._attackDistance = 9999;
        this.atkDelay = 0;
        this._atkPreTime = 300 + this.atkDelay;
        this._atkTime = 100 / this._atkSpeed;
        let maxHp = 100;//MathUtils.getRandomInt(200,500);
        this._hp = maxHp;
        this._maxHp = maxHp;
        this._attack = 5;
        this._skills = [2];
        let select = CacheManager.gameGrid.getSelectedEntity(EntityType.Grid);
        if(select) {
            this.pos.x = select.pos.x;
            this.pos.z = select.pos.z;
        }
    }

    public updatePos(pos: math.Vec3, worldPosition: math.Vec3): void {
        super.updatePos(pos,worldPosition);
        this.atkDelay = 0;
        this._atkPreTime = 300 + this.atkDelay;
        this._atkPreTime /= this._atkSpeed;
    }

    public getShowName():string{
        return `Lv.${this.level}`;
    }

    public get modelUrl():string{
        return "mini-dungeon/character-human/character-human";
    }
}