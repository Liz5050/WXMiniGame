export enum EntityType {
    Grid = 1,
    Enemy = 2,
    GridHero = 3,
    PlayerKing = 4,
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
        return type == EntityType.Enemy || type == EntityType.GridHero;
    }

    public static isGrid(type:EntityType){
        return type == EntityType.Grid || type == EntityType.GridHero;
    }

    public static isEnemy(type:EntityType){
        return type == EntityType.Enemy;
    }

    public static isHostile(type1:EntityType,type2:EntityType):Boolean{
        return false;
    }
}