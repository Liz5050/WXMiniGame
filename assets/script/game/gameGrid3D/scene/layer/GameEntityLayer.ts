import { GEvent } from "db://assets/script/enum/GEvent";
import { msg } from "db://assets/script/utils/MessageCenter";
import { GameFactory } from "../../GameFactory";
import { BaseEntity } from "../entity/BaseEntity";
import { EntityType } from "../utils/EntityUtil";
import BaseLayer from "./BaseLayer";
import { HeroEntity } from "../entity/HeroEntity";
import { Vec2 } from "cc";
import Simulator from "db://assets/script/RVO/Simulator";
import EnemyEntity from "../entity/EnemyEntity";
import EntityVo from "../vo/EntityVo";

export default class GameEntityLayer extends BaseLayer {
    private _entityMap: { [entityId: string]: BaseEntity } = {};

    private _enemys:{[id:string]:EnemyEntity} = {};
    private _heros:{[id:string]:HeroEntity} = {};

    protected onInit(): void {
        Simulator.Instance.setTimeStep(0.25);
        Simulator.Instance.setAgentDefaults(20, 200, 10, 5, 10, 0.1, new Vec2(0, 0));

        // add in awake
        Simulator.Instance.processObstacles();
    }

    // protected update(dt: number): void {
    //     Simulator.Instance.doStep();
    // }

    @msg(GEvent.OnGameGrid3DEntityInit)
    private onEntityInit(list: EntityVo[]): void {
        if (!list) return;
        for (let i = 0; i < list.length; i++) {
            this.createEntity(list[i]);
        }
    }

    @msg(GEvent.OnGameGrid3DEntityDelete)
    private onEntityDelete(entityId: string): void {
        const entity = this._entityMap[entityId];
        if (!entity) return;
        entity.resetEntity();
        delete this._entityMap[entityId];
        delete this._enemys[entityId];
        delete this._heros[entityId];
    }

    private createEntity(vo: EntityVo): void {
        if (!vo || vo.type === EntityType.Grid) return;
        let entity = this._entityMap[vo.entityId];
        if (!entity) {
            entity = GameFactory.getEntity(vo.type);
            entity.setParent(this._rootNode);
            this._entityMap[vo.entityId] = entity;

            if(vo.type == EntityType.Enemy) {
                this._enemys[vo.entityId] = entity as EnemyEntity;
            }
            else if(vo.type == EntityType.Hero) {
                this._heros[vo.entityId] = entity as HeroEntity;
            }
        }
        entity.init(vo);
    }

    protected onDestroy(): void {
        for (const entityId in this._entityMap) {
            this._entityMap[entityId].resetEntity();
        }
        this._entityMap = {};
        this._enemys = {};
        this._heros = {};
    }
}
