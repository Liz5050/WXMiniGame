import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { BaseController } from "../base/BaseController";
import { GameWorldRankView } from "./view/GameWorldRankView";

export class RankController extends BaseController {

    private _rankView:GameWorldRankView;
    public constructor(){
        super();
    }

    protected init(){
        EventManager.addListener(EventEnum.OnShowWorldRank,this.OnShowWorldRankView,this);
    }

    private OnShowWorldRankView(){
        if(!this._rankView){
            this._rankView = new GameWorldRankView();
        }
        this._rankView.show();
    }
}