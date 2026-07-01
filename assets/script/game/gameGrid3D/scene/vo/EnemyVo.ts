import MathUtils from "../../../../utils/MathUtils";
import { EntityType } from "../utils/EntityUtil";
import BattleEntityVo from "./BattleEntityVo";

export default class EnemyVo extends BattleEntityVo{
    public constructor(){
        super();
        this.type = EntityType.Enemy;
        this.name = `小妖怪${this.entityId}`;
        this.attackDistance = 1.5;
        this.stiffnessTime = 0;
        this.dieTime = 500;
        this.atkAfterTime = 266;
        this.atkPreTime = 400;
        this.attackCD = 2500;
        this.atkTime = 133;
        this.pos.x = MathUtils.getRandom(0, 9);
        this.pos.z = -MathUtils.getRandom(5, 15);
        this.speed = MathUtils.getRandom(1,3) / 10;
        if(this.maxHp <= 0) {
            this.maxHp = 15;
        }
        this.hp = this.maxHp;
        this.attack = 2;
    }

    public update(data:Partial<EnemyVo>){
        super.update(data);
    }
   
    public get modelUrl():string{
        return "gameGrid3D/Enemy";
    }

    public get modelBodyUrl():string{
        return "mini-dungeon/character-orc/character-orc";
    }
}
