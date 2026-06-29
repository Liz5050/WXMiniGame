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

const _v2 = new Vec2();
const _ray = new geometry.Ray();
@ccclass
export class SceneEntitySelection extends Component {
    // @property(Node) rectPlayer:RoundRect = null;
    // @property(Node) rectEnemy:RoundRect = null;
    
    private _touchTarget: Node = null;
    private _playerSelect: ICursor;
    private _enemySelect: ICursor;
    private _curSelect:{[type:string]:EntityVo} = {};
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
        this.setSelected(binder.entity,true);
    }

    private setSelected(entity:BaseEntity,isSelected:boolean){
        if(!entity) return;
        const vo = entity.vo;
        if(!vo) return;
        if(vo.isSelected == isSelected) return;

        let entityNode = entity.node;
        let curVo = this._curSelect[this.getSelectType(vo.type)];
        if(curVo) curVo.update({isSelected:false});
        
        if(!isSelected) {
            entity.isEnemy() ? this._enemySelect.hide() : this._playerSelect.hide();
            return;
        }
        if(entity.isEnemy()){
            this._enemySelect.showWith(entityNode);
        }
        else{
            let pos = new Vec3(0,-1,0);
            if(entity.type == EntityType.Grid) {
                const isEmpty = (vo as GridEntityVo).isEmpty;
                if(!isEmpty) pos = Vec3.ZERO;
            }
            this._playerSelect.showWith(entityNode,pos);
        }
        vo.update({isSelected:true});
        this._curSelect[this.getSelectType(vo.type)] = vo;
    }

    private getSelectType(type:EntityType){
        if(EntityUtil.isGrid(type)){
            return 999
        }
        return type;
    }

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
        for(let type in this._curSelect){
            this._curSelect[type].update({isSelected:false});
        }
        this._curSelect = {};
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
interface ICursor { showWith(root: Node,pos?:Vec3); hide(); }
class CursorPlayer implements ICursor {
    public readonly node: Node;
    public readonly rect: RoundRect;
    constructor(node:Node) {
        this.node = node;
        this.rect = node.getComponent(RoundRect);
        this.lineWidth = this.rect.lineWidth;
        this.node.active = false;
    }
    public lineWidth: number;
    public dur = 0.5;

    // private _tw: Tween<Node>;

    public showWith(root: Node,pos?:Vec3) {
        this.node.active = true;
        this.node.parent = root;
        if(!pos) pos = Vec3.ZERO;
        this.node.position = pos;
        this.node.scale = Vec3.ONE;

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
        // this._tw?.stop();
        // this._tw = null;
    }
}
