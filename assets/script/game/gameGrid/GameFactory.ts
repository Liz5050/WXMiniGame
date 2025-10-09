import {BaseEntity} from "./scene/entity/BaseEntity";
import { EntityType } from "./scene/utils/EntityUtil";
import EnemyEntity from "./scene/entity/EnemyEntity";
import { HeroEntity } from "./scene/entity/HeroEntity";
import { PlayerKing } from "./scene/entity/PlayerKing";
import GridEntity from "./scene/entity/GridEntity";

export class GameFactory {
    private static EntityPool:{[type:string]:BaseEntity[]} = {};
    public static getEntity(type:EntityType){
        let poolList = GameFactory.EntityPool[type];
        if(!poolList){
            poolList = [];
            GameFactory.EntityPool[type] = poolList;
        }
        let entity = poolList.pop();
        if(entity) return entity;
        switch(type){
            case EntityType.Grid:
                entity = new GridEntity();
                break;
            case EntityType.Enemy:
                entity = new EnemyEntity();
                break;
            case EntityType.Hero:
                entity = new HeroEntity();
                break;
            case EntityType.PlayerKing:
                entity = new PlayerKing();
                break;
            default:
                console.warn("未处理的类型",type);
                break;
        }
        return entity;
    }   

    public static recycleEntity(entity:BaseEntity){
        const type = entity.type;
        entity.removeFromParent();
        entity.active = false;
        entity.setPosition(0,0,0);
        let poolList = GameFactory.EntityPool[type];
        if(!poolList){
            poolList = [];
            GameFactory.EntityPool[type] = poolList;
        }
        poolList.push(entity);
    }
}