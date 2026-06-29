import { EntityState, EntityType } from "../scene/utils/EntityUtil";

export interface IEntityVo {
    id:number;
    type:EntityType;
    speed:number;
    state: EntityState;
}

/** 地图格子拖拽落下结果 */
export interface IGridDropResult {
    /** 格子索引 */
    index?: number;
    /** 是否正确放置 */
    isRight: boolean;
    /** 是否可以消除 */
    canRemove: boolean;
    /** 消除数量 */
    totalNum: number;
}