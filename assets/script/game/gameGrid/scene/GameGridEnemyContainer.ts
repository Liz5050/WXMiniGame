import { Component, Prefab, Vec2, _decorator, instantiate, isValid } from "cc";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { EntityVo } from "./vo/EntityVo";
import { GameGridEnemy } from "./entity/GameGridEnemy";
import Simulator from "../../../RVO/Simulator";
import {EntityPool} from "../GameFactory";
import { EntityType } from "./utils/EntityUtil";
import { GridHero } from "./entity/HeroEntity";
import Mgr from "../../../manager/Mgr";

const {ccclass,property} = _decorator;

@ccclass
export class GameGridEnemyContainer extends Component{
    @property(Prefab) tempEnemy:Prefab = null;
    private _enemys:{[id:number]:GameGridEnemy} = {};
    private _heros:{[id:number]:GridHero} = {};
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
            this.onCreateEntity(list[i]);
        }
    }

    private onCreateEntity(vo:EntityVo){ 
        if(vo.type == EntityType.Enemy) {
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
        else if(vo.type == EntityType.GridHero){
            Mgr.loader.LoadBundleRes("scene","GameGrid3D/GridHero",(prefab)=>{
                let hero = this._heros[vo.entityId];
                if(!hero){
                    let node = EntityPool.getEntity(vo.type,prefab);
                    node.name = `Hero_${vo.entityId}`;
                    this.node.addChild(node);
                    hero = node.getComponent(GridHero);
                    this._heros[vo.entityId] = hero;
                }
                hero.setData(vo);
            });
        }
    }

    public hide(){
        for(let id in this._enemys){
            this._enemys[id].resetEntity();
        }
        this._enemys = {};

        for(let id in this._heros){
            this._heros[id].resetEntity();
        }
        this._heros = {};
        // this.node.removeFromParent();
    }
}