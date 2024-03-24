import { Component, Prefab, Vec2, _decorator, instantiate, isValid } from "cc";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { EntityType, EntityVo } from "../vo/EntityVo";
import { GameGridEnemy } from "./entity/GameGridEnemy";
import Simulator from "../../../RVO/Simulator";

const {ccclass,property} = _decorator;

@ccclass
export class GameGridEnemyContainer extends Component{
    @property(Prefab) tempEnemy:Prefab = null;
    private _enemys:{[id:number]:GameGridEnemy} = {};
    protected onLoad(): void {
        EventManager.addListener(EventEnum.OnEntityInit,this.onCreateEntity,this);
        Simulator.Instance.setTimeStep(0.25);
        Simulator.Instance.setAgentDefaults(5, 3, 5, 5, 0.5, 0.02, new Vec2(0, 0));

        // add in awake
        Simulator.Instance.processObstacles();
    }

    protected update(dt: number): void {
        Simulator.Instance.doStep();
    }

    private onCreateEntity(vo:EntityVo){
        if(vo.type != EntityType.Enemy) return;
        let enemy = this._enemys[vo.id];
        if(!enemy){
            let node = instantiate(this.tempEnemy);
            this.node.addChild(node);
            enemy = node.getComponent(GameGridEnemy);
            this._enemys[vo.id] = enemy;
        }
        enemy.setData(vo);
    }

    protected onDestroy(): void {
        this._enemys = {};
        EventManager.removeListener(EventEnum.OnEntityInit,this.onCreateEntity,this);
    }
}