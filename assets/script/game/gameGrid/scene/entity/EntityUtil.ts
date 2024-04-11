import {EntityType} from "../../vo/EntityVo";

export class EntityUtil{
    public static isBattleEntity(type:EntityType){
        return type == EntityType.Enemy || type == EntityType.GridHero;
    }
}