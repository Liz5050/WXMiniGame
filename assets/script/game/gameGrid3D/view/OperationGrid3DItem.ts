import { EventTouch, Node, NodeEventType, Prefab, Sprite, instantiate, math } from "cc";
import Mgr from "../../../manager/Mgr";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { CacheManager } from "../../../manager/CacheManager";
import { dispatchMsg } from "../../../utils/MessageCenter";
import { GEvent } from "../../../enum/GEvent";
import { GameGrid3DRoundType } from "../../../cache/GameGrid3DCache";

export class OperationGrid3DItem {
    private _touchMask: Node;
    private _preview: Node;
    private _previewPos: math.Vec3;
    private _previewX: number;
    private _previewY: number;
    private _canMove: boolean;
    private _gridIndex: number;
    private _resType: number = -1;
    private _randomGrid: Node;
    private _lastRandomGrid: Node;
    private _gridList: Node[];
    private _btnGrid: Node;
    private _node: Node;
    private _prefabUrl: string;

    public constructor(node: Node) {
        this._node = node;
        this.initUI();
    }

    private initUI(): void {
        this._preview = this._node.getChildByName("preview");
        this._previewPos = this._preview.getPosition(this._previewPos);
        this._previewX = this._previewPos.x;
        this._previewY = this._previewPos.y;

        this._btnGrid = this._node.getChildByName("btnGrid");
        this._btnGrid.on(Node.EventType.TOUCH_CANCEL, () => this.touchEnd());
        this._btnGrid.on(NodeEventType.TOUCH_END, () => this.touchEnd());
        this._btnGrid.on(NodeEventType.TOUCH_START, (event: EventTouch) => {
            const touchPos = event.getLocation();
            this.touchStart(touchPos.x, touchPos.y);
        });
        this._btnGrid.on(NodeEventType.TOUCH_MOVE, (event: EventTouch) => {
            const pos = event.getLocation();
            this.touchMove(pos.x, pos.y);
        });

        this._touchMask = this._node.getChildByName("touchMask");
        this._touchMask.active = false;
    }

    private touchStart(startX: number, startY: number): void {
        if (this._resType === -1) return;
        if (CacheManager.gameGrid3D.roundType !== GameGrid3DRoundType.Ready) return;
        if (this._canMove) return;
        this._canMove = true;
        dispatchMsg(GEvent.OnGameGrid3DTouchStart, { resType: this._resType, startX, startY });
        Mgr.soundMgr.play("mobile_phone_O", false);
    }

    private touchMove(touchX: number, touchY: number): void {
        if (this._resType === -1 || !this._canMove) return;
        if (CacheManager.gameGrid3D.roundType === GameGrid3DRoundType.Ready) {
            dispatchMsg(GEvent.OnGameGrid3DGridItemTouchMove, { touchX, touchY });
        } else {
            this._canMove = false;
            dispatchMsg(GEvent.OnGameGrid3DGridMoveCancel);
        }
    }

    private touchEnd(): void {
        if (this._resType === -1 || !this._canMove) return;
        this._canMove = false;
        if (CacheManager.gameGrid3D.roundType === GameGrid3DRoundType.Ready) {
            dispatchMsg(GEvent.OnGameGrid3DSceneGridDrop, this._gridIndex);
        }
    }

    public ShowRight(): void {
        this._touchMask.active = true;
        this._preview.active = false;
        Mgr.soundMgr.play("create_enemy", false);
    }

    public ShowError(): void {
        Mgr.soundMgr.play("mobile_phone_O", false);
    }

    public set gridIndex(index: number) {
        this._gridIndex = index;
    }

    public updatePreviewGrid(gridInfo = null): void {
        if (gridInfo && !gridInfo.enable) {
            this._touchMask.active = true;
            this._preview.active = true;
            if (this._gridList) {
                for (let i = 0; i < this._gridList.length; i++) {
                    this._gridList[i].active = false;
                }
            }
            return;
        }

        this._preview.active = true;
        this._touchMask.active = false;
        this._preview.setPosition(this._previewX, this._previewY);
        this._preview.setScale(1, 1);
        let url: string;
        if (gridInfo) {
            url = gridInfo.url;
        } else {
            const resType = CacheManager.gameGrid3D.getRandomType();
            url = "PreviewGrid" + resType;
            this._resType = resType;
        }
        this._prefabUrl = url;
        Mgr.loader.LoadUIPrefab(UIModuleEnum.gameGrid, url, (prefab: Prefab) => {
            this.updateView(prefab, gridInfo);
        });
    }

    private updateView(prefab: Prefab, gridInfo = null): void {
        if (!prefab) {
            console.log("找不到资源");
            return;
        }

        if (this._lastRandomGrid) {
            this._lastRandomGrid.destroy();
            this._lastRandomGrid = null;
        }
        if (this._randomGrid) {
            this._lastRandomGrid = this._randomGrid;
            this._randomGrid.active = false;
        }

        const node = instantiate(prefab);
        this._preview.addChild(node);
        this._randomGrid = node;

        const num = node.children.length;
        this._gridList = [];
        for (let i = 1; i <= num; i++) {
            const grid = node.getChildByName("grid" + i);
            const sp = grid.getComponent(Sprite);
            Mgr.loader.SetSpriteByAtlas(sp, "common_ui", "red_button09");
            this._gridList.push(grid);
        }
    }
}
