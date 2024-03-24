import { Component, Node, ProgressBar, Vec3, _decorator, instantiate } from "cc";
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
    private _uiPos:Vec3;
    protected onLoad(): void {
        this._uiPos = new Vec3();
        this._HUD = this.node.getChildByName("HUD");
        Mgr.loader.LoadUIPrefab(UIModuleEnum.gameGrid3D,"EntityHUDView",(prefab)=>{
            this._uiNode = instantiate(prefab);
            this._uiNode.active = false;
            Root3D.mainCamera.convertToUINode(this._HUD.worldPosition,LayerManager.HUDLayer,this._uiPos);
            this._uiNode.setPosition(this._uiPos);
            LayerManager.HUDLayer.addChild(this._uiNode);
            this._hpBar = this._uiNode.getChildByName("hpBar").getComponent(ProgressBar);
            this.updateHp();
        });
    }

    protected update(dt: number): void {
        if(this._uiNode){
            Root3D.mainCamera.convertToUINode(this._HUD.worldPosition,LayerManager.HUDLayer,this._uiPos);
            this._uiNode.setPosition(this._uiPos);
        }
    }

    public setData(vo:EntityVo){
        this._vo = vo;
        this.updateHp();
    }

    public updateHp(){
        if(!this._vo || !this._uiNode) return;
        if(this._vo.hp > 0){
            this._uiNode.active = true;
            let ratio = Math.min(this._vo.hp / this._vo.maxHp,1);
            this._hpBar.progress = ratio;
        }
        else{
            this._uiNode.active = false;
        }
    }

    protected onDestroy(): void {
        if(this._uiNode){
            this._uiNode.removeFromParent()
            this._uiNode.destroy();
            this._uiNode = null;
        }
    }
}