export const enum EntityType {
    /** 地图格子槽位数据（固定不动） */
    Grid = "GridEntity",
    /** 战斗格子槽位数据（可移动） */
    BattleGrid = "BattleGridEntity",
    /** 敌人 */
    Enemy = "EnemyEntity",
    /** 英雄 */
    Hero = "HeroEntity",
    /** 中心据点 */
    King = "KingEntity",
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
        if (!type1 || !type2) return false;
        return EntityUtil.isEnemy(type1) !== EntityUtil.isEnemy(type2);
    }
}
