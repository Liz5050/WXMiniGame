import { Component, _decorator } from "cc";
import { SystemBase } from "./SystemBase";
import { StateSystem } from "./StateSystem";
import { MovementSystem } from "./MovementSystem";
import { SystemType } from "../utils/SystemUtil";
import { SkillSystem } from "./SkillSystem";
import { BattleSystem } from "./BattleSystem";
import { BuffSystem } from "./BuffSystem";
import { HpSystem } from "./HpSystem";
const {ccclass, property} = _decorator

@ccclass
export class GameWorldSystem extends Component{
    public static instance:GameWorldSystem;

    private _systemIndex:{[sysType:number]:number} = {};
    private _systems:SystemBase[] = [];
    private _isInit:boolean = false;
    protected onLoad(): void {
        GameWorldSystem.instance = this;
    }

    public initSystem(){
        let typeList = [1,2,3,4,5];
        for(let i = 0; i < typeList.length; i ++){
            let type = typeList[i];
            this._systemIndex[type] = i;
            let system = this.createSystem(type);
            this._systems.push(system);
        }
        this._isInit = true;
    }

    protected update(dt: number): void {
        if(!this._isInit) return;
        this.delSystem(dt);
    }

    public delSystem(dt:number){
        for(let i = 0; i < this._systems.length; i++){
            this._systems[i].onUpdate(dt);
        }
    }

    private createSystem(type:number):SystemBase{
        switch(type){
            case SystemType.State:
                return new StateSystem();
            case SystemType.Movement:
                return new MovementSystem();
            case SystemType.Skill:
                return new SkillSystem();
            case SystemType.Battle:
                return new BattleSystem();
            case SystemType.Buff:
                return new BuffSystem();
            case SystemType.Hp:
                return new HpSystem();
            default:
                return null;
        }
    }
}