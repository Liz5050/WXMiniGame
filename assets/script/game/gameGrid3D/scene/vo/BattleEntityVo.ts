import { EntityType } from "../utils/EntityUtil";
import EntityVo from "./EntityVo";

export default class BattleEntityVo extends EntityVo {
    public hp: number = 1;
    public maxHp: number = 1;
    public attack: number = 1;
    public attackDistance: number = 1;
    public stiffnessTime: number = 0;
    public dieTime: number = 500;
    public attackTime: number = 0;
    public attackCD: number = 1000;
    public atkPreTime: number = 0;
    public atkTime: number = 100;
    public atkAfterTime: number = 0;
    public speed: number = 0.1;
    public battleVo: EntityVo = null;
    public skills: number[] = [];
    public constructor(){
        super();
    }

    public isDead(): boolean {
        return this.hp <= 0;
    }

    // public get battleVo(): EntityVo { return this._battleVo; }
    // public set battleVo(vo: EntityVo) {
    //     if (this._battleVo === vo) return;
    //     this._battleVo = vo;
    //     this.dispatchPropertyEvent("battleVo");
    // }
    // public get skills(): number[] { return this._skills; }
}