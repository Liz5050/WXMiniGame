import { EntityState, EntityType } from "../scene/utils/EntityUtil";

export interface IEntityVo {
    id:number;
    type:EntityType;
    speed:number;
    state: EntityState;
}