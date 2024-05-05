import { Component, Prefab, Vec2, _decorator, instantiate, isValid } from "cc";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { EntityVo } from "./vo/EntityVo";
import { GameGridEnemy } from "./entity/GameGridEnemy";
import Simulator from "../../../RVO/Simulator";
import {EntityPool} from "./entity/EntityPool";
import { EntityType } from "./utils/EntityUtil";

const {ccclass,property} = _decorator;

@ccclass
export class GameGridEnemyContainer extends Component{
    @property(Prefab) tempEnemy:Prefab = null;
    private _enemys:{[id:number]:GameGridEnemy} = {};
    protected onLoad(): void {
        EventManager.addListener(EventEnum.OnEntityInit,this.onEntityInit,this);
        Simulator.Instance.setTimeStep(0.25);
        Simulator.Instance.setAgentDefaults(20, 200, 10, 5, 10, 0.1, new Vec2(0, 0));

        // add in awake
        Simulator.Instance.processObstacles();
    }

    protected update(dt: number): void {
        Simulator.Instance.doStep();
    }

    private onEntityInit(list:EntityVo[]){
        for(let i = 0; i < list.length; i++){
            this.onCreateEnemy(list[i]);
        }
    }

    private onCreateEnemy(vo:EntityVo){ 
        if(vo.type != EntityType.Enemy) return;
        let enemy = this._enemys[vo.entityId];
        if(!enemy){
            let node = EntityPool.getEntity(vo.type,this.tempEnemy);
            node.name = `Enemy_${vo.entityId}`;
            this.node.addChild(node);
            enemy = node.getComponent(GameGridEnemy);
            this._enemys[vo.entityId] = enemy;
        }
        enemy.setData(vo);
    }

    public hide(){
        for(let id in this._enemys){
            this._enemys[id].resetEntity();
        }
        this._enemys = {};
        // this.node.removeFromParent();
    }
}