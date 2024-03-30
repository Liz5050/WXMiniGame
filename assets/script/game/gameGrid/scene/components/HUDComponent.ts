import { Component, Label, Node, ProgressBar, Vec3, _decorator, instantiate } from "cc";
import { EntityVo } from "../../vo/EntityVo";
import Mgr from "../../../../manager/Mgr";
import { UIModuleEnum } from "../../../../enum/UIDefine";
import { LayerManager } from "../../../../manager/LayerManager";
import { Root3D } from "../../../../Root3D";
const { ccclass, property } = _decorator;

@ccclass
export class HUDComponent extends Component{
    private _vo:EntityVo
    private _HUD:Node;
    private _uiNode:Node;
    private _hpBar:ProgressBar;
    private _txtHp:Label;
    private _txtName:Label;
    private _uiPos:Vec3;
    private _isInit:boolean = false;
    protected onLoad(): void {
        this._uiPos = new Vec3();
        this._HUD = this.node.getChildByName("HUD");
    }

    private init(){
        Mgr.loader.LoadUIPrefab(UIModuleEnum.gameGrid3D,"EntityHUDView",(prefab)=>{
            if(!this.enabled) return;

            this._uiNode = instantiate(prefab);
            this._uiNode.active = false;
            Root3D.mainCamera.convertToUINode(this._HUD.worldPosition,LayerManager.HUDLayer,this._uiPos);
            this._uiNode.setPosition(this._uiPos);
            LayerManager.HUDLayer.addChild(this._uiNode);
            this.initUI();
            this.updateHp();
            this._isInit = true;
        });
    }

    private initUI(){
        this._hpBar = this._uiNode.getChildByName("hpBar").getComponent(ProgressBar);
        this._txtHp = this._hpBar.node.getChildByName("txtHp").getComponent(Label);
        this._txtName = this._uiNode.getChildByName("txtName").getComponent(Label);
    }

    protected onEnable(): void {
        if(this._isInit){
            LayerManager.HUDLayer.addChild(this._uiNode);
            this.updateHp();
        }
        else{
            this.init();
        }
    }

    protected update(dt: number): void {
        if(this._uiNode && this._uiNode.active){
            this.updatePos();
        }
    }

    private updatePos(){
        Root3D.mainCamera.convertToUINode(this._HUD.worldPosition,LayerManager.HUDLayer,this._uiPos);
        this._uiNode.setPosition(this._uiPos);
    }

    public setData(vo:EntityVo){
        this._vo = vo;
        this.enabled = true;
        if(this._isInit){
            this.updateHp();
            this._txtName.string = `小妖怪${vo.entityId}`;
        }
    }

    public updateHp(){
        if(!this._vo || !this._uiNode) return;
        console.log("更新血量："+this._vo.hp)
        if(this._vo.hp > 0){
            this.updatePos();
            this._uiNode.active = true;
            let ratio = Math.min(this._vo.hp / this._vo.maxHp,1);
            this._hpBar.progress = ratio;
            this._txtHp.string = `${this._vo.hp}/${this._vo.maxHp}`;
        }
        else{
            this._uiNode.active = false;
        }
    }

    protected onDisable(): void {
        if(this._uiNode){
            this._uiNode.setPosition(-2000,0,0);
            this._uiNode.removeFromParent();
            this._vo = null;
        }
    }
}