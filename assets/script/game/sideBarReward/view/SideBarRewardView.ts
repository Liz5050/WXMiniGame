import { Button, Label, Node, Sprite } from "cc";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { BaseUIView } from "../../base/BaseUIView";
import { SDK } from "../../../SDK/SDK";
import { CacheManager } from "../../../manager/CacheManager";
import Mgr from "../../../manager/Mgr";

export class SideBarRewardView extends BaseUIView {
    private _imgStep1:Sprite;
    private _imgStep2:Sprite;
    private _btnGo:Node;
    private _txtBtn:Label;
    public constructor(){
        super(UIModuleEnum.sideBarReward,"SideBarRewardView");
    }
    
    protected initUI(): void {
        this.addCloseHandler("maskBg");
        this._btnGo = this.getChildByName("btnGo");
        this._txtBtn = this._btnGo.getChildByName("Label").getComponent(Label);
        this._btnGo.on(Button.EventType.CLICK,()=>{
            let canGet = CacheManager.player.sideRewardCanGet();
            if(canGet){
                CacheManager.player.getSideReward();
            }
            else{
                SDK.curSdk.navigateToScene();
            }
            this.hide();
        });
        this._imgStep1 = this.getChildByName("imgStep1").getComponent(Sprite);
        this._imgStep2 = this.getChildByName("imgStep2").getComponent(Sprite);
        Mgr.loader.SetSpriteFrame(this._imgStep1,"https://7072-prod-2gue9n1kd74122cb-1313661302.tcb.qcloud.la/bytedance/publish/resources/sideBar/1.png");
        Mgr.loader.SetSpriteFrame(this._imgStep2,"https://7072-prod-2gue9n1kd74122cb-1313661302.tcb.qcloud.la/bytedance/publish/resources/sideBar/2.png");
    }

    public onShowAfter(param?: any): void {
        let canGet = CacheManager.player.sideRewardCanGet();
        if(canGet){
            this._txtBtn.string = "领取奖励";
        }
        else{
            this._txtBtn.string = "前往侧边栏";
        }
    }
}