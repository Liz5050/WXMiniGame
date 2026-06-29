import { BoxCollider, Color, geometry, instantiate, Node, PhysicsSystem, Prefab, Vec3 } from "cc";
import { GameGrid3DRoundType } from "db://assets/script/cache/GameGrid3DCache";
import { CacheManager } from "db://assets/script/manager/CacheManager";
import { SDK } from "db://assets/script/SDK/SDK";
import { GEvent } from "db://assets/script/enum/GEvent";
import { dispatchMsg, msg } from "db://assets/script/utils/MessageCenter";
import { Root3D } from "db://assets/script/Root3D";
import { GameFactory } from "../../GameFactory";
import { GameGridMapItem } from "../entity/GameGridMapItem";
import { EntityType } from "../utils/EntityUtil";
import { GridEntityVo } from "../vo/GridEntityVo";
import BaseLayer from "./BaseLayer";
import GameGrid3DConst, { CreateGrid3DData } from "../../GameGrid3DConst";
import { IGridDropResult } from "../../interface/GameInterface";
import Mgr from "db://assets/script/manager/Mgr";
import NodeUtils from "../utils/NodeUtils";

export default class GameMapGridLayer extends BaseLayer {
    private static readonly GridPool: Node[] = [];

    private _ray: geometry.Ray;
    private _groupPos: Vec3;
    private _endCheckLocalPos: Vec3 = new Vec3();
    private _mapGridBg:Node;
    private _tempGroup: Node;
    private _posTrigger: BoxCollider;
    private _gridEntitys: { [key: string]: GameGridMapItem } = {};
    private _gridVoList: GridEntityVo[] = [];
    private _lastPreviewPos: { [index: number]: { x: number, z: number } } = {};
    private _tempPrefab: Prefab;
    protected onInit(): void {
        this._ray = new geometry.Ray();
        this._groupPos = new Vec3();
        this._mapGridBg = this._rootNode.getChildByName("mapGrid");
        this._tempGroup = this._rootNode.getChildByName("tempGroup");
        if (!this._tempGroup.parent) {
            this._rootNode.addChild(this._tempGroup);
        }

        const triggerNode = this._rootNode.getChildByName("posTrigger");
        this._posTrigger = triggerNode && triggerNode.getComponent(BoxCollider);
        this.initMapGrid();
    }

    private static getGridKey(row: number, col: number): string {
        return `${row}_${col}`;
    }

    private getGridEntity(row: number, col: number): GameGridMapItem | undefined {
        const key = GameMapGridLayer.getGridKey(row, col);
        return this._gridEntitys[key];
    }

    private initMapGrid(): void {
        this._gridEntitys = {};
        this._gridVoList = CacheManager.gameGrid3D.mapGridList;
        for (let i = 0; i < this._gridVoList.length; i++) {
            const gridVo = this._gridVoList[i];
            const col = gridVo.pos.x;
            const row = gridVo.pos.z;
            const key = GameMapGridLayer.getGridKey(row, col);
            const mapGrid = GameFactory.getEntity(EntityType.Grid) as GameGridMapItem;
            mapGrid.setParent(this._rootNode);
            mapGrid.init(gridVo);
            this._gridEntitys[key] = mapGrid;
        }
    }

    @msg(GEvent.OnGameGrid3DTouchStart)
    private onTouchStart(data:CreateGrid3DData): void {
        const { resType, startX, startY } = data;
        const dataList = GameGrid3DConst.getGridDataList(resType);
        if (!dataList) return;

        this.updateTempGroupByScreenPoint(startX, startY, 1);

        if (!this._tempPrefab) {
            Mgr.loader.LoadBundleRes("scene", "gameGrid3D/RedGrid", (prefab: Prefab) => {
                this._tempPrefab = prefab;
                this.createTempGrid(dataList);
            });
        }
        else {
            this.createTempGrid(dataList);
        }
    }

    private createTempGrid(dataList: number[][]): void {
        const rowNum = dataList.length;
        for (let row = 0; row < rowNum; row++) {
            const rowList = dataList[row];
            const colNum = rowList.length;
            const startLocalX = -(colNum - 1) / 2;
            const startLocalZ = -(rowNum - 1) / 2;
            for (let col = 0; col < colNum; col++) {
                if (rowList[col] !== 1) continue;
                const gridNode = this.getPreviewGridNode();
                gridNode.setPosition(col + startLocalX, 0, row + startLocalZ);
            }
        }
    }

    @msg(GEvent.OnGameGrid3DGridItemTouchMove)
    private onGridMove(data: { touchX: number, touchY: number }): void {
        if (CacheManager.gameGrid3D.roundType !== GameGrid3DRoundType.Ready) return;
        const { touchX, touchY } = data;
        if (this.updateTempGroupByScreenPoint(touchX, touchY, 2)) {
            this.onTouchMoveCheck();
        }
    }

    @msg(GEvent.OnGameGrid3DGridMoveCancel)
    private onGridMoveCancel(): void {
        this.clearTemp();
    }

    @msg(GEvent.OnGameGrid3DSceneGridDrop)
    private onGridDrop(index:number) {
        const result = this.onTouchEndCheck();
        result.index = index;
        this.clearTemp();
        dispatchMsg(GEvent.OnGameGridDropResult, result);
    }

    private updateTempGroupByScreenPoint(screenX: number, screenY: number, zOffset?: number): boolean {
        if (!this._posTrigger) return false;
        const camera = Root3D.mainCamera;
        camera.screenPointToRay(screenX, screenY, this._ray);
        if (!PhysicsSystem.instance.raycast(this._ray)) return false;

        const raycastResults = PhysicsSystem.instance.raycastResults;
        if (!raycastResults) return false;
        for (let i = 0; i < raycastResults.length; i++) {
            const item = raycastResults[i];
            if (item.collider !== this._posTrigger) continue;
            this._rootNode.inverseTransformPoint(this._groupPos, item.hitPoint);
            if(!!zOffset)this._groupPos.z -= zOffset;
            this._groupPos.y = 0;
            this._tempGroup.position = this._groupPos;
            return true;
        }
        return false;
    }

    private getPreviewGridNode(): Node {
        let gridNode = GameMapGridLayer.GridPool.pop();
        if (!gridNode) {
            gridNode = instantiate(this._tempPrefab);
        }
        this._tempGroup.addChild(gridNode);
        gridNode.active = true;
        return gridNode;
    }

    private clearTemp(): void {
        const tempNodeList = this._tempGroup.children;
        for (let i = tempNodeList.length - 1; i >= 0; i--) {
            const node = tempNodeList[i];
            node.removeFromParent();
            GameMapGridLayer.GridPool.push(node);
        }
        this.clearPreview();
    }

    private clearPreview(): void {
        for (const index in this._lastPreviewPos) {
            const pos = this._lastPreviewPos[index];
            const vo = CacheManager.gameGrid3D.getGridVoByPos(pos.x, pos.z);
            vo && vo.update({isPreview:false});
        }
        this._lastPreviewPos = {};
    }

    private onTouchEndCheck(): IGridDropResult {
        const tempNodeList = this._tempGroup.children;
        const num = tempNodeList.length;
        let emptyNum = 0;
        const gridVoList: GridEntityVo[] = [];
        for (let i = 0; i < num; i++) {
            const grid = tempNodeList[i];
            this._rootNode.inverseTransformPoint(this._endCheckLocalPos, grid.worldPosition);
            if (this._endCheckLocalPos.x >= -0.5 && this._endCheckLocalPos.x <= 9.5 && this._endCheckLocalPos.z >= -0.5 && this._endCheckLocalPos.z <= 9.5) {
                const centerX = Math.round(this._endCheckLocalPos.x);
                const centerZ = Math.round(this._endCheckLocalPos.z);
                const vo = CacheManager.gameGrid3D.getGridVoByPos(centerX, centerZ);
                if (vo && vo.isEmpty) {
                    emptyNum++;
                    gridVoList.push(vo);
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }

        const checkListX: number[] = [];
        const checkListY: number[] = [];
        const isRight = emptyNum === num && num > 0;
        if (isRight) {
            for (let i = 0; i < gridVoList.length; i++) {
                const vo = gridVoList[i];
                const col = vo.pos.x;
                const row = vo.pos.z;
                if (checkListX.indexOf(col) === -1) checkListX.push(col);
                if (checkListY.indexOf(row) === -1) checkListY.push(row);
                vo.update({ isEmpty: false });
            }
        }

        const canRemoveX: { [col: number]: boolean } = {};
        for (let i = checkListX.length - 1; i >= 0; i--) {
            const col = checkListX[i];
            canRemoveX[col] = true;
            for (let row = 0; row < 10; row++) {
                const vo = CacheManager.gameGrid3D.getGridVoByPos(col, row);
                if (!vo || vo.isEmpty) {
                    canRemoveX[col] = false;
                    break;
                }
            }
        }

        const canRemoveY: { [row: number]: boolean } = {};
        for (let i = checkListY.length - 1; i >= 0; i--) {
            const row = checkListY[i];
            canRemoveY[row] = true;
            for (let col = 0; col < 10; col++) {
                const vo = CacheManager.gameGrid3D.getGridVoByPos(col, row);
                if (!vo || vo.isEmpty) {
                    canRemoveY[row] = false;
                    break;
                }
            }
        }

        let canRemove = false;
        const removedCols: number[] = [];
        const removedRows: number[] = [];
        for (let i = 0; i < checkListX.length; i++) {
            const col = checkListX[i];
            if (!canRemoveX[col]) continue;
            removedCols.push(col);
            for (let row = 0; row < 10; row++) {
                const vo = CacheManager.gameGrid3D.getGridVoByPos(col, row);
                if (vo) {
                    vo.update({ isEmpty: true });
                    canRemove = true;
                }
            }
        }
        for (let i = 0; i < checkListY.length; i++) {
            const row = checkListY[i];
            if (!canRemoveY[row]) continue;
            removedRows.push(row);
            for (let col = 0; col < 10; col++) {
                const vo = CacheManager.gameGrid3D.getGridVoByPos(col, row);
                if (vo) {
                    vo.update({ isEmpty: true });
                    canRemove = true;
                }
            }
        }

        if (canRemove) {
            CacheManager.gameGrid3D.addTileProgressByLines(removedCols, removedRows);
        }

        return { isRight, canRemove, totalNum: removedCols.length + removedRows.length };
    }

    /** 触摸移动检查,实时更新对/错格子预览状态 */
    private onTouchMoveCheck(): void {
        const tempNodeList = this._tempGroup.children;
        let isShake = false;
        for (let i = 0; i < tempNodeList.length; i++) {
            const grid = tempNodeList[i];
            this._rootNode.inverseTransformPoint(this._endCheckLocalPos, grid.worldPosition);
            // if (this._endCheckLocalPos.x < -0.5 || this._endCheckLocalPos.x > 9.5 || this._endCheckLocalPos.z < -0.5 || this._endCheckLocalPos.z > 9.5) continue;

            const centerX = Math.round(this._endCheckLocalPos.x);
            const centerZ = Math.round(this._endCheckLocalPos.z);
            let lastPos = this._lastPreviewPos[i];
            if (!lastPos) {
                lastPos = { x: centerX, z: centerZ };
                this._lastPreviewPos[i] = lastPos;
            }
            if (lastPos.x !== centerX || lastPos.z !== centerZ) {
                const lastVo = CacheManager.gameGrid3D.getGridVoByPos(lastPos.x, lastPos.z);
                lastVo && lastVo.update({isPreview:false});
                if (!isShake) {
                    isShake = true;
                    SDK.vibrateShort();
                }
            }
            lastPos.x = centerX;
            lastPos.z = centerZ;
            const vo = CacheManager.gameGrid3D.getGridVoByPos(centerX, centerZ);
            let isRight = false;
            if(vo) {
                vo.update({isPreview:true});
                isRight = vo.isEmpty;
            }
            if(isRight) {
                //绿色正确
                grid.active = false;
                // NodeUtils.set3DNodeColor(grid, new Color(61, 192, 61, 128));
            }
            else {
                //红色错误
                grid.active = true;
                NodeUtils.set3DNodeColor(grid, new Color(192, 61, 61, 128));
            }
        }
    }

    protected onDestroy(): void {
        for (const item of Object.values(this._gridEntitys)) {
            item.resetEntity();
        }
        this.clearTemp();
    }
}
