import { EntityState } from "./EntityUtil";

export default class EntityStateUtil {
    public static checkState(state: EntityState): boolean {
        if(state == EntityState.die) return false;
        switch (state) {
            case EntityState.idle:
                break;
            case EntityState.walk:
                break;
            case EntityState.attackEmpty:
                break;
            case EntityState.attackPre:
                break;
            case EntityState.attack:
                break;
            case EntityState.attackAfter:
                break;
            case EntityState.stiffness:
                break;
        }
        return true;
    }

    public static isAttacking(state: EntityState): boolean {
        return state == EntityState.attackPre || state == EntityState.attack || state == EntityState.attackAfter || state == EntityState.attackEmpty;
    }
}
