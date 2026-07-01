import { EntityType } from "../utils/EntityUtil";
import BattleEntityVo from "./BattleEntityVo";

export default class KingVo extends BattleEntityVo {
    /** 防御值，降低受到的直接伤害 */
    public defense: number = 5;
    /** 初始技能：0=自动炮击，1=范围脉冲，2=守卫召唤 */
    public initSkillType: number = 0;

    public constructor() {
        super();
        this.type = EntityType.King;
        this.name = "核心据点";
        this.occupyCol = 2;
        this.occupyRow = 2;
        const maxHp = 500;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.attack = 10;
        this.attackCD = 2000;
        this.attackDistance = 5;
        this.speed = 0;
    }

    public getShowName(): string {
        return this.name;
    }

    public get modelUrl(): string {
        return "gameGrid3D/King";
    }
}
