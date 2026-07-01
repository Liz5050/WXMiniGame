import { Label, Node, ProgressBar, Vec3, instantiate } from "cc";
import Mgr from "../../../../manager/Mgr";
import { UIModuleEnum } from "../../../../enum/UIDefine";
import { LayerManager } from "../../../../manager/LayerManager";
import { Root3D } from "../../../../Root3D";
import { EntityComponent } from "./EntityComponent";
import BattleEntityVo from "../vo/BattleEntityVo";

export class HUDComponent extends EntityComponent{
    private _uiNode:Node;
    private _hpBar:ProgressBar;
    private _txtHp:Label;
    private _txtName:Label;
    private _uiPos:Vec3;

    protected onInit(): void {
        this._uiPos = new Vec3();
    }
    
    protected updateVo(): void {
        if(this._uiNode){
            LayerManager.HUDLayer.addChild(this._uiNode);
            return;
        }
        //todo EntityHUDView 加载路径错误
        Mgr.loader.LoadUIPrefab(UIModuleEnum.gameGrid3D,"EntityHUDView",(prefab)=>{
            if(!this._vo) return;
            this._uiNode = instantiate(prefab);
            this._uiNode.active = false;
            LayerManager.HUDLayer.addChild(this._uiNode);
            this.initUI();
        });
    }

    private initUI(){
        this._hpBar = this._uiNode.getChildByName("hpBar").getComponent(ProgressBar);
        this._txtHp = this._hpBar.node.getChildByName("txtHp").getComponent(Label);
        this._txtName = this._uiNode.getChildByName("txtName").getComponent(Label);
        this.updateLevel();
    }
    protected onUpdate(dt: number): void {
        this.updatePos();
    }

    private updatePos(){
        if(this._uiNode && this._uiNode.active && this._vo){
            Root3D.mainCamera.convertToUINode(this._vo.worldPos,LayerManager.HUDLayer,this._uiPos);
            this._uiNode.setPosition(this._uiPos);
        }
    }

    private updateLevel(){
        if(!this._txtName || !this._vo) return;
        this._txtName.string = this._vo.getShowName();
        this.updateHp();
    }

    private updateHp(){
        if(!this._vo || !this._uiNode) return;
        const vo = this._vo as BattleEntityVo;
        console.log("更新血量："+vo.hp)
        if(vo.hp > 0){
            this.updatePos();
            this._uiNode.active = true;
            let ratio = Math.min(vo.hp / vo.maxHp,1);
            this._hpBar.progress = ratio;
            this._txtHp.string = `${vo.hp}/${vo.maxHp}`;
        }
        else{
            this._uiNode.active = false;
        }
    }

    protected onStop(): void {
        super.onStop();
        this._uiNode = null;
        this._hpBar = null;
        this._txtHp = null;
        this._txtName = null;
    }
}
