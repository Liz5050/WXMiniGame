import { CreateGrid3DData } from "../GameGrid3DConst";
import { GameGrid3DRoundType } from "../../../cache/GameGrid3DCache";
import { BaseEntity } from "../scene/entity/BaseEntity";
import EntityVo from "../scene/vo/EntityVo";
import { IGridDropResult } from "../interface/GameInterface";

export const GameGrid3DEvent = <const>{
    OnGameGrid3DSceneReady: "OnGameGrid3DSceneReady",
    OnGameGrid3DRoundUpdate: "OnGameGrid3DRoundUpdate",
    OnGameGrid3DEntityInit: "OnGameGrid3DEntityInit",
    OnGameGrid3DEntityDelete: "OnGameGrid3DEntityDelete",
    OnGameGrid3DTouchStart: "OnGameGrid3DTouchStart",
    OnGameGrid3DGridItemTouchMove: "OnGameGrid3DGridItemTouchMove",
    OnGameGrid3DGridMoveCancel: "OnGameGrid3DGridMoveCancel",
    /** 3D 地图格子拖拽落下 */
    OnGameGrid3DSceneGridDrop: "OnGameGrid3DSceneGridDrop",
    /** 3D 地图格子拖拽落下结果 */
    OnGameGridDropResult: "OnGameGridDropResult",
    /** 设置选中实体 */
    OnGameGrid3DSetSelectEntity: "OnGameGrid3DSetSelectEntity",
    /** 打开 3D 建造界面 */
    OpenGameGrid3DBuildView: "OpenGameGrid3DBuildView",
    /** 关闭 3D 建造界面 */
    CloseGameGrid3DBuildView: "CloseGameGrid3DBuildView",
    /** 3D 建造界面取消 */
    OnGameGrid3DBuildItemCancel: "OnGameGrid3DBuildItemCancel",
    /** 3D 建造界面确定 */
    OnGameGrid3DBuildItemSure: "OnGameGrid3DBuildItemSure",
};

export type GameGrid3DEventData = UnionRecords<
    [
        Record<typeof GameGrid3DEvent.OnGameGrid3DSceneReady, void>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DRoundUpdate, GameGrid3DRoundType>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DEntityInit, EntityVo[]>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DEntityDelete, string>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DTouchStart, CreateGrid3DData>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DGridItemTouchMove, { touchX: number; touchY: number }>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DGridMoveCancel, void>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DSceneGridDrop, number>,
        Record<typeof GameGrid3DEvent.OnGameGridDropResult, IGridDropResult>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DSetSelectEntity, { entity: BaseEntity; isSelected: boolean }>,
        Record<typeof GameGrid3DEvent.OpenGameGrid3DBuildView, BaseEntity>,
        Record<typeof GameGrid3DEvent.CloseGameGrid3DBuildView, void>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DBuildItemCancel, number>,
        Record<typeof GameGrid3DEvent.OnGameGrid3DBuildItemSure, number>,
    ]
>;
