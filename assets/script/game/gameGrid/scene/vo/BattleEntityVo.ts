import { Vec3 } from "cc";
import EntityVo from "./EntityVo";

export default class BattleEntityVo extends EntityVo{
    public hp: number = 0;
    public maxHp: number = 0;
    public attack: number = 20;//攻击力
    public pos: Vec3;
    public worldPos: Vec3;
    public attackDistance: number = 1;//攻击距离
    public stiffnessTime: number = 0;//硬直时间
    public dieTime:number = 0;//死亡消亡时间
    public attackTime: number = 0;//攻击的时间，用于计算攻击CD
    public attackCD: number = 1000;//ms攻击CD时间（攻速）
    public atkPreTime: number = 0;//前摇时长 单位ms
    public atkTime: number = 100;//攻击时长 单位ms
    public atkAfterTime: number = 0;//后摇时长 单位ms
}