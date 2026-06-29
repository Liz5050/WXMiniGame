import { Vec3 } from "cc";
import { CacheManager } from "../../../../manager/CacheManager";
import { GEvent } from "../../../../enum/GEvent";
import { dispatchMsg } from "../../../../utils/MessageCenter";
import { BaseEntity } from "./BaseEntity";
import { ComponentType } from "../components/ComponentType";
import { EntityState, EntityType } from "../utils/EntityUtil";

/** 地图格子槽位实体(不可移动，用于显示和判断是否可以放置) */
export class GameGridMapItem extends BaseEntity {
    private _isEmpty: boolean = true;
    private _isPreview: boolean = false;

    protected onInit(): void {
        this.addCusComponent(ComponentType.GridPreview);
    }

    public get col(): number {
        return this._vo.pos.x;
    }

    public get row(): number {
        return this._vo.pos.z;
    }

    protected onSelectChanged(): void {
        if (this.isSelected) {
            dispatchMsg(GEvent.OpenGameGrid3DBuildView, this);
            if (this._vo && this._vo.type === EntityType.Grid) {
                // this.setEmpty(true, true, true);
            }
        }
        else {
            dispatchMsg(GEvent.CloseGameGrid3DBuildView);
        }
    }

    // public setEmpty(bool: boolean, attack: boolean = false, attackEmpty: boolean = false): void {
    //     if (!this._vo || this._isEmpty === bool) return;
    //     this._isEmpty = bool;
    //     if (!bool) {
    //         this._vo.setState(EntityState.idle);
    //         return;
    //     }

    //     if (attack) {
    //         this.updateAttackTarget();
    //         if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
    //             this._vo.setState(attackEmpty ? EntityState.attackEmpty : EntityState.none);
    //         }
    //         else {
    //             this._vo.setState(EntityState.attackPre);
    //         }
    //     }
    //     else {
    //         this._vo.setState(EntityState.die);
    //     }
    // }

    // public setPreview(isShow: boolean): void {
    //     if (this._isPreview === isShow) return;
    //     this._isPreview = isShow;
    //     this._vo && this._vo.setPreview(isShow, this.isEmpty);
    // }

    public resetEntity(): void {
        // this._isEmpty = true;
        // this._isPreview = false;
        // if (this._vo) {
        //     this._vo.isSelected = false;
        //     this._vo.setPreview(false);
        //     this._vo.offProp(this.onEntityPropUpdate, this);
        //     this._vo.setEntity(null);
        //     this._vo = null;
        // }
        this.stopComponent();
        // 格子常驻棋盘，不回收 Node，只清理逻辑组件。
    }

    // private updateAttackTarget(): void {
    //     if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
    //         const battleVo = CacheManager.gameGrid3D.findTarget(this._vo.worldPos, EntityType.Enemy);
    //         if (battleVo) {
    //             this._vo.battleVo = battleVo;
    //         }
    //     }
    // }
}
