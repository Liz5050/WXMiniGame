import { Component, Label, Node, ProgressBar, Vec3, _decorator, instantiate } from "cc";
import { EntityVo } from "../vo/EntityVo";
import Mgr from "../../../../manager/Mgr";
import { UIModuleEnum } from "../../../../enum/UIDefine";
import { LayerManager } from "../../../../manager/LayerManager";
import { Root3D } from "../../../../Root3D";
import { BaseComponent } from "./BaseComponent";
const { ccclass, property } = _decorator;

@ccclass
export class HUDComponent extends BaseComponent{
    private _HUD:Node;
    private _uiNode:Node;
    private _hpBar:ProgressBar;
    private _txtHp:Label;
    private _txtName:Label;
    private _uiPos:Vec3;
    protected onInit(): void {
        this._uiPos = new Vec3();
        this._HUD = this.node.getChildByName("HUD");

        Mgr.loader.LoadUIPrefab(UIModuleEnum.gameGrid3D,"EntityHUDView",(prefab)=>{
            this._uiNode = instantiate(prefab);
            this._uiNode.active = false;
            Root3D.mainCamera.convertToUINode(this._HUD.worldPosition,LayerManager.HUDLayer,this._uiPos);
            this._uiNode.setPosition(this._uiPos);
            LayerManager.HUDLayer.addChild(this._uiNode);
            this.initUI();
            if(this._vo){
                this.updateHp();
                this.updateLevel();
            }
            this._isInit = true;
        });
    }

    private initUI(){
        this._hpBar = this._uiNode.getChildByName("hpBar").getComponent(ProgressBar);
        this._txtHp = this._hpBar.node.getChildByName("txtHp").getComponent(Label);
        this._txtName = this._uiNode.getChildByName("txtName").getComponent(Label);
    }
    
    protected updateVo(): void {
        if(this._uiNode){
            LayerManager.HUDLayer.addChild(this._uiNode);
            this.updateHp();
            this.updateLevel();
        }
    }

    protected onUpdate(dt: number): void {
        this.updatePos();
    }

    private updatePos(){
        if(this._uiNode && this._uiNode.active){
            Root3D.mainCamera.convertToUINode(this._HUD.worldPosition,LayerManager.HUDLayer,this._uiPos);
            this._uiNode.setPosition(this._uiPos);
        }
    }

    public updateLevel(){
        this._txtName.string = this._vo.getShowName();
        this.updateHp();
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