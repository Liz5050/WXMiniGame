import { Component, Prefab, Vec2, _decorator, instantiate, isValid } from "cc";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { EntityType, EntityVo } from "../vo/EntityVo";
import { GameGridEnemy } from "./entity/GameGridEnemy";
import Simulator from "../../../RVO/Simulator";
import {EntityPool} from "./entity/EntityPool";

const {ccclass,property} = _decorator;

@ccclass
export class GameGridEnemyContainer extends Component{
    @property(Prefab) tempEnemy:Prefab = null;
    private _enemys:{[id:number]:GameGridEnemy} = {};
    protected onLoad(): void {
        EventManager.addListener(EventEnum.OnEntityInit,this.onCreateEntity,this);
        Simulator.Instance.setTimeStep(0.25);
        Simulator.Instance.setAgentDefaults(6, 4, 5, 5, 0.5, 0.05, new Vec2(0, 0));

        // add in awake
        Simulator.Instance.processObstacles();
    }

    protected update(dt: number): void {
        Simulator.Instance.doStep();
    }

    private onCreateEntity(vo:EntityVo){
        if(vo.type != EntityType.Enemy) return;
        let enemy = this._enemys[vo.entityId];
        if(!enemy){
            let node = EntityPool.getEntity(vo.type,this.tempEnemy);
            node.name = vo.entityId;
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