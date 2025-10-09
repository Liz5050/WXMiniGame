import { CreateGridData } from "../GameGridConst";

export const GameGridEvent = <const> {
    OnGameSceneGridCreate:"OnGameSceneGridCreate",
    OnEntityDelete:"OnEntityDelete",
    OnGridItemTouchMove:"OnGridItemTouchMove",
}

export type GameGridEventData = UnionRecords<
    [
        Record<typeof GameGridEvent.OnGameSceneGridCreate,CreateGridData>,
        Record<typeof GameGridEvent.OnEntityDelete,string>,
        Record<typeof GameGridEvent.OnGridItemTouchMove,{touchX:number,touchY:number}>,
    ]
>;