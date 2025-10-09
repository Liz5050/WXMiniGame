export const enum EntityType {
    Grid = "GridEntity",
    Enemy = "EnemyEntity",
    Hero = "HeroEntity",
    PlayerKing = "PlayerKing",
    // Player = "EntityPlayer",
}
export enum EntityState {
    none = 0,
    idle = 1,
    walk,
    attackEmpty,//打空气
    attackPre,//前摇
    attack,//攻击
    attackAfter,//后摇
    stiffness,//硬直
    die,
}

export class EntityUtil{
    public static isBattleEntity(type:EntityType){
        return type == EntityType.Enemy || type == EntityType.Hero;
    }

    public static isGrid(type:EntityType){
        return type == EntityType.Grid || type == EntityType.Hero;
    }

    public static isEnemy(type:EntityType){
        return type == EntityType.Enemy;
    }

    public static isHostile(type1:EntityType,type2:EntityType):Boolean{
        return false;
    }
}