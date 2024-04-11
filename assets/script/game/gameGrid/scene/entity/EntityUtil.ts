import {EntityType} from "../../vo/EntityVo";

export class EntityUtil{
    public static isBattleEntity(type:EntityType){
        return type == EntityType.Enemy || type == EntityType.GridHero;
    }

    public static isGrid(type:EntityType){
        return type == EntityType.Grid || type == EntityType.GridHero;
    }
}