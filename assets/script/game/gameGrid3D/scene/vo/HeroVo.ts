import { math } from "cc";
import { EntityState, EntityType } from "../utils/EntityUtil";
import { CacheManager } from "../../../../manager/CacheManager";
import BattleEntityVo from "./BattleEntityVo";

export default class HeroVo extends BattleEntityVo{
    public atkDelay:number = 0;
    private _atkSpeed:number = 2;
    public constructor(){
        super();
        this.type = EntityType.Hero;
        this.name = `Lv.${this.level}`;
        this.attackCD = 1000 / this._atkSpeed;
        this.attackDistance = 9999;
        this.atkDelay = 0;
        this.atkPreTime = 300 + this.atkDelay;
        this.atkTime = 100 / this._atkSpeed;
        let maxHp = 100;//MathUtils.getRandomInt(200,500);
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.attack = 5;
        this.skills = [2];
        let select = CacheManager.gameGrid3D.getSelectedEntity(EntityType.Grid);
        if(select) {
            this.pos.x = select.pos.x;
            this.pos.z = select.pos.z;
        }
    }
    
    public getShowName():string{
        return `Lv.${this.level}`;
    }

    public get modelUrl():string{
        return "mini-dungeon/character-human/character-human";
    }
}
