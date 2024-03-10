import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { BaseController } from "../base/BaseController";
import { SideBarRewardView } from "./view/SideBarRewardView";

export class SideBarRewardController extends BaseController {
    private _sideBarView:SideBarRewardView;
    public constructor(){
        super();
    }

    protected init(){
        EventManager.addListener(EventEnum.OnShowSideBarView,this.onShowSideBarView,this);
    }

    private onShowSideBarView(){
        if(!this._sideBarView){
            this._sideBarView = new SideBarRewardView();
        }
        this._sideBarView.show();
    }
}