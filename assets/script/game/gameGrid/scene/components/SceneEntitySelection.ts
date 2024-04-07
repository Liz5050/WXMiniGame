import { Component, EventTouch, Node, PhysicsSystem, Quat, Root, Tween, Vec2, Vec3, _decorator, easing, geometry, tween } from "cc";
import { RoundRect } from "../../../../common/components/RoundRect";
import { Root3D } from "../../../../Root3D";
import { CacheManager } from "../../../../manager/CacheManager";
import { EventManager } from "../../../../manager/EventManager";
import { EventEnum } from "../../../../enum/EventEnum";
import { GameGridMapItem } from "../entity/GameGridMapItem";
import { BaseEntity } from "../entity/BaseEntity";
import { EntityType } from "../../vo/EntityVo";
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
    private _curSelect:BaseEntity;
    protected onLoad(): void {
        this._playerSelect = new CursorPlayer(this.node.getChildByName("RectPlayer"));
        this._enemySelect = new CursorEnemy(this.node.getChildByName("RectEnemy"));
        this._touchTarget = Root3D.instance.canvas;
        if(this._touchTarget){
            this._listenTouch(true);
        }
        else{
            this._listenTouch(false);
        }
        EventManager.addListener(EventEnum.OnGameGridRoundUpdate,this.onRoundUpdate,this);
    }

    private onRoundUpdate(){
        if(!CacheManager.gameGrid.isBattle()) {
            this._playerSelect.hide();
            this._enemySelect.hide();
            if(this._curSelect){
                this._curSelect.setSelected(false);
                this._curSelect = null;
            }
        }
    }

    private _listenTouch(isOn: boolean) {
        const target = this._touchTarget;
        const fn = isOn ? target.on : target.off;
        fn.call(target, Node.EventType.TOUCH_START, this._onTS, this);
        fn.call(target, Node.EventType.TOUCH_END, this._onTE, this);
        fn.call(target, Node.EventType.TOUCH_CANCEL, this._onTE, this);
        fn.call(target, Node.EventType.TOUCH_MOVE, this._onTM, this);
    }

    private _onTS(e: EventTouch) { this._onTouch('ts', e); }
    private _onTE(e: EventTouch) { this._onTouch('te', e); }
    private _onTM(e: EventTouch) { this._onTouch('tm', e); }

    private _onTouch(type: string, e: EventTouch) {
        if(!CacheManager.gameGrid.isBattle()) {
            return;
        }
        if(this._curSelect){
            this._curSelect.setSelected(false);
        }
        const rsl = this._e2hit(e);
        if (!rsl) {
            this._playerSelect.hide();
            this._enemySelect.hide();
            this._curSelect = null;
            return;
        }

        switch (type) {
            case 'ts': break;
            case 'tm': break;
            case 'te':
                const root = rsl.collider.node.parent;
                let entity = root.getComponent(BaseEntity);
                if(entity && entity.isEnemy()){
                    this._enemySelect.showWith(root);
                }
                else{
                    let mapItem = root.getComponent(GameGridMapItem);
                    let pos = mapItem.isEmpty ? new Vec3(0,-1,0) : Vec3.ZERO;
                    this._playerSelect.showWith(root,pos);
                }
                entity.setSelected(true);
                this._curSelect = entity;
                break;
        }
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

    private _ppt1: Partial<RoundRect> = { anchor: 0 };
    private _ppt2: Partial<RoundRect> = { anchor: 1 };
    private _tw: Tween<RoundRect>;


    public showWith(root: Node) {
        this.node.active = true;
        this.node.parent = root;
        this.node.position = Vec3.ZERO;

        this.rect.lineWidth = this.lineWidth * 4;
        this.rect.showLine = false;
        tween(this.rect)
            .to(this.dur, { lineWidth: this.lineWidth }, { easing: easing.backOut })
            .start();

        this.rect.anchor = 1;
        this._tw?.stop();
        this._tw = tween(this.rect)
            .to(this.dur, this._ppt1, { easing: easing.sineInOut })
            .to(this.dur, this._ppt2, { easing: easing.sineInOut })
            .union()
            .repeatForever()
            .start();
    }
    public hide() {
        this.node.active = false;
        this._tw?.stop();
        this._tw = null;
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

    private _tw: Tween<Node>;

    public showWith(root: Node,pos?:Vec3) {
        this.node.active = true;
        this.node.parent = root;
        if(!pos) pos = Vec3.ZERO;
        this.node.position = pos;
        this.node.scale = Vec3.ONE;

        this.rect.lineWidth = this.lineWidth * 4;
        tween(this.rect)
            .to(this.dur, { lineWidth: this.lineWidth }, { easing: easing.backOut })
            .start();
        
        this._tw?.stop();
        this._tw = tween(this.node)
            .repeatForever(
                tween(this.node).to(0.6, {scale:new Vec3(1.1,1,1.1)}).to(0.6, {scale:Vec3.ONE})
            ).start();
    }
    public hide() {
        this.node.active = false;
        this._tw?.stop();
        this._tw = null;
    }
}