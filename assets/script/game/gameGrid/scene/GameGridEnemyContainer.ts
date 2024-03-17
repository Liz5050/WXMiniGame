import { Component, Prefab, _decorator, instantiate } from "cc";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { EntityType, EntityVo } from "../vo/EntityVo";
import { GameGridEnemy } from "./entity/GameGridEnemy";

const {ccclass,property} = _decorator;

@ccclass
export class GameGridEnemyContainer extends Component{
    @property(Prefab) tempEnemy:Prefab = null;
    private _enemys:{[id:number]:GameGridEnemy} = {};
    protected onLoad(): void {
        EventManager.addListener(EventEnum.OnEntityInit,this.onCreateEntity,this);
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
}