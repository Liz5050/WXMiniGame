import {BaseEntity} from "./scene/entity/BaseEntity";
import { EntityType } from "./scene/utils/EntityUtil";
import { HeroEntity } from "./scene/entity/HeroEntity";
import KingEntity from "./scene/entity/KingEntity";
import { GameGridMapItem } from "./scene/entity/GameGridMapItem";
import EnemyEntity from "./scene/entity/EnemyEntity";

export class GameFactory {
    private static EntityPool:{[type:string]:BaseEntity[]} = {};
    public static getEntity(type:EntityType){
        let poolList = GameFactory.EntityPool[type];
        if(!poolList){
            poolList = [];
            GameFactory.EntityPool[type] = poolList;
        }
        let entity = poolList.pop();
        if(entity) {
            entity.active = true;
            return entity;
        }
        switch(type){
            case EntityType.Grid:
                entity = new GameGridMapItem();
                break;
            case EntityType.Enemy:
                entity = new EnemyEntity();
                break;
            case EntityType.Hero:
                entity = new HeroEntity();
                break;
            case EntityType.King:
                entity = new KingEntity();
                break;
            default:
                console.warn("未处理的类型",type);
                break;
        }
        return entity;
    }   

    public static recycleEntity(entity:BaseEntity){
        const type = entity.type;
        entity.active = false;
        let poolList = GameFactory.EntityPool[type];
        if(!poolList){
            poolList = [];
            GameFactory.EntityPool[type] = poolList;
        }
        poolList.push(entity);
    }
}
