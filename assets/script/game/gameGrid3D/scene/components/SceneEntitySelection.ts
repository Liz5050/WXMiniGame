import { Component, EventTouch, Node, PhysicsSystem, Vec2, Vec3, _decorator, geometry } from "cc";
import { RoundRect } from "../../../../common/components/RoundRect";
import { Root3D } from "../../../../Root3D";
import { CacheManager } from "../../../../manager/CacheManager";
import { GameGridMapItem } from "../entity/GameGridMapItem";
import { BaseEntity } from "../entity/BaseEntity";
import { EntityType, EntityUtil } from "../utils/EntityUtil";
import { addObserver, msg, removeObserver } from "../../../../utils/MessageCenter";
import { GEvent } from "../../../../enum/GEvent";
import { EntityNodeBinder } from "./EntityNodeBinder";
import EntityVo from "../vo/EntityVo";
import { GridEntityVo } from "../vo/GridEntityVo";
const { ccclass, property } = _decorator;

/** 选中单位类型（敌我双方仅可选中一个） */
export enum SelectType {
    /** 玩家单位 */
    Player = "player",
    /** 敌人单位 */
    Enemy = "enemy",
}
const _v2 = new Vec2();
const _ray = new geometry.Ray();
@ccclass
export class SceneEntitySelection extends Component {
    // @property(Node) rectPlayer:RoundRect = null;
    // @property(Node) rectEnemy:RoundRect = null;
    
    private _touchTarget: Node = null;
    private _playerSelect: ICursor;
    private _enemySelect: ICursor;
    // private _curSelect:{[type:string]:EntityVo} = {};
    private _curSelectVo:EntityVo = null;
    protected onLoad(): void {
        addObserver(this);
        this._playerSelect = new CursorPlayer(this.node.getChildByName("RectPlayer"));
        this._enemySelect = new CursorEnemy(this.node.getChildByName("RectEnemy"));
        this._touchTarget = Root3D.instance.canvas;
        if(this._touchTarget){
            this._listenTouch(true);
        }
        else{
            this._listenTouch(false);
        }
    }

    @msg(GEvent.OnGameGrid3DRoundUpdate)
    private onRoundUpdate(){
        if(!CacheManager.gameGrid3D.isBattle()) {
            this._playerSelect.hide();
            this._enemySelect.hide();
            this.clearSelect();
        }
    }

    @msg(GEvent.OnGameGrid3DSetSelectEntity)
    private onSetSelectedEntity(data:{entity:BaseEntity,isSelected:boolean}){
        this.setSelected(data.entity,data.isSelected);
    }

    private _listenTouch(isOn: boolean) {
        const target = this._touchTarget;
        const fn = isOn ? target.on : target.off;
        fn.call(target, Node.EventType.TOUCH_END, this.onTouchHandler, this);
        fn.call(target, Node.EventType.TOUCH_CANCEL, this.onTouchHandler, this);
    }
    
    private onTouchHandler(e: EventTouch) {
        if(!CacheManager.gameGrid3D.isBattle()) {
            return;
        }
        const rsl = this._e2hit(e);
        if (!rsl) {
            this._playerSelect.hide();
            this._enemySelect.hide();
            this.clearSelect();
            return;
        }

        const root = rsl.collider.node.parent;
        const binder:EntityNodeBinder = root.getComponent(EntityNodeBinder);
        if(!binder) return;
        const entity = this.resolveSelectEntity(binder.entity);
        this.setSelected(entity, true);
    }

    /** 点击占格范围内任意格子时，解析到实际占格实体 */
    private resolveSelectEntity(entity: BaseEntity): BaseEntity {
        if (!entity || !entity.vo) return entity;
        const vo = entity.vo;
        if (!EntityUtil.isGrid(vo.type)) return entity;
        const ownerVo = CacheManager.gameGrid3D.findEntityByOccupyGrid(vo.pos.x, vo.pos.z);
        if (ownerVo && ownerVo.entity) return ownerVo.entity;
        return entity;
    }

    private setSelected(entity:BaseEntity,isSelected:boolean){
        if(!entity) return;
        const vo = entity.vo;
        if(!vo || vo.isSelected == isSelected) return;
        const entityNode = entity.node;
        if(!entityNode) return;

        // const selectType = this.getSelectType(vo.type);
        let curVo = this._curSelectVo;
        if(curVo) {
            curVo.update({isSelected:false});
            EntityUtil.isEnemy(curVo.type) ? this._enemySelect.hide() : this._playerSelect.hide();
        }
        
        if(!isSelected) {
            this._curSelectVo = null;
            return;
        }
        const isEnemy = entity.isEnemy();
        if(isEnemy){
            this._enemySelect.showWith(entityNode);
        }
        else{
            let pos = new Vec3(0,-1,0);
            if(entity.type == EntityType.Grid) {
                const isEmpty = (vo as GridEntityVo).isEmpty;
                //非空格子地砖会凸起0.1米，所以选中也需要向上偏移0.9米
                if(!isEmpty) pos.y = -0.9;
            }
            const size = vo.occupyCol > 1 || vo.occupyRow > 1
                ? { col: vo.occupyCol, row: vo.occupyRow }
                : null;
            this._playerSelect.showWith(entityNode, pos, size);
        }
        vo.update({isSelected:true});
        this._curSelectVo = vo;
    }

    // private getSelectType(type:EntityType){
    //     if(EntityUtil.isEnemy(type)){
    //         return SelectType.Enemy;
    //     }
    //     return SelectType.Player;
    // }

    private _e2hit(e: EventTouch) {
        const v2 = e.getLocation(_v2);
        const ray = Root3D.mainCamera.screenPointToRay(v2.x, v2.y, _ray);
        let result;
        if (PhysicsSystem.instance.raycast(ray,undefined,undefined,true)) {
            const raycastResults = PhysicsSystem.instance.raycastResults;
            if(!raycastResults) return;
            let minDis = 99999999;
            for (let i = 0; i < raycastResults.length; i++) {
                const item = raycastResults[i];
                if(item.collider.node.name == "posTrigger") continue;
                if(minDis > item.distance){
                    result = item;
                    minDis = item.distance;
                }
            }
        }
        return result;
    }
    
    private clearSelect(){
        if(this._curSelectVo) this._curSelectVo.update({isSelected:false});
        this._curSelectVo = null;
    }

    protected onDestroy(): void {
        if (this._touchTarget) {
            this._listenTouch(false);
        }
        removeObserver(this);
    }
}

class CursorEnemy implements ICursor {
    public readonly node: Node;
    public readonly rect: RoundRect
    constructor(node:Node) {
        this.node = node;
        this.rect = node.getComponent(RoundRect);
        this.lineWidth = this.rect.lineWidth;
        this.node.active = false;
    }
    public lineWidth: number;
    public dur = 0.5;

    // private _ppt1: Partial<RoundRect> = { anchor: 0 };
    // private _ppt2: Partial<RoundRect> = { anchor: 1 };
    // private _tw: Tween<RoundRect>;


    public showWith(root: Node) {
        this.node.active = true;
        this.node.parent = root;
        this.node.position = Vec3.ZERO;

        this.rect.showLine = false;
        // this.rect.lineWidth = this.lineWidth * 4;
        // tween(this.rect)
        //     .to(this.dur, { lineWidth: this.lineWidth }, { easing: easing.backOut })
        //     .start();

        this.rect.anchor = 1;
        // this._tw?.stop();
        // this._tw = tween(this.rect)
        //     .to(this.dur, this._ppt1, { easing: easing.sineInOut })
        //     .to(this.dur, this._ppt2, { easing: easing.sineInOut })
        //     .union()
        //     .repeatForever()
        //     .start();
    }
    public hide() {
        this.node.active = false;
        // this._tw?.stop();
        // this._tw = null;
    }
}
interface ICursor { showWith(root: Node, pos?: Vec3, size?: { col: number, row: number }); hide(); }
class CursorPlayer implements ICursor {
    public readonly node: Node;
    public readonly rect: RoundRect;
    private _defaultWidth: number;
    private _defaultHeight: number;
    constructor(node:Node) {
        this.node = node;
        this.rect = node.getComponent(RoundRect);
        this.lineWidth = this.rect.lineWidth;
        this._defaultWidth = this.rect.width;
        this._defaultHeight = this.rect.height;
        this.node.active = false;
    }
    public lineWidth: number;
    public dur = 0.5;

    // private _tw: Tween<Node>;

    public showWith(root: Node, pos?: Vec3, size?: { col: number, row: number }) {
        this.node.active = true;
        this.node.parent = root;
        if(!pos) pos = Vec3.ZERO;
        this.node.position = pos;
        this.node.scale = Vec3.ONE;
        if (size) {
            this.rect.width = size.col;
            this.rect.height = size.row;
        } else {
            this.rect.width = this._defaultWidth;
            this.rect.height = this._defaultHeight;
        }

        // this.rect.lineWidth = this.lineWidth * 4;
        // tween(this.rect)
        //     .to(this.dur, { lineWidth: this.lineWidth }, { easing: easing.backOut })
        //     .start();
        
        // this._tw?.stop();
        // this._tw = tween(this.node)
        //     .repeatForever(
        //         tween(this.node).to(0.6, {scale:new Vec3(1.1,1,1.1)}).to(0.6, {scale:Vec3.ONE})
        //     ).start();
    }
    public hide() {
        this.node.active = false;
        this.rect.width = this._defaultWidth;
        this.rect.height = this._defaultHeight;
        // this._tw?.stop();
        // this._tw = null;
    }
}
