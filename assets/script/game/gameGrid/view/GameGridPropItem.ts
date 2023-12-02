import { Label } from "cc";
import { Node } from "cc";
import { math } from "cc";
import Mgr from "../../../manager/Mgr";
import { NodeEventType } from "cc";
import { EventTouch } from "cc";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { Button } from "cc";
import { CacheManager } from "../../../manager/CacheManager";
import { BannerRewardId } from "../../../SDK/SDK";

export class GameGridPropItem{
    private _node:Node;
    private _imgVideo:Node;
    private _txtNum:Label;
    private _imgProp:Node;
    private _rewardId:BannerRewardId;
    private _canTouchMove:boolean;
    private _leftNum:number;
    public constructor(node:Node){
        this.initUI(node);
    }

    private initUI(node:Node){
        this._node = node;
        this._imgVideo = node.getChildByName("imgVideo");
        this._txtNum = node.getChildByName("txtNum").getComponent(Label);
        this._imgProp = node.getChildByName("imgProp");
    }

    public OnRefreshNumUpdate(){
        let num = CacheManager.gameGrid.getPropNum(this._rewardId);
        this._leftNum = num;
        this._txtNum.string = num.toString();
        if(num > 0){
            this._txtNum.node.active = true;
            this._imgVideo.active = false;
        }else{
            if(CacheManager.gameGrid.hadGetVideoReward(this._rewardId)){
                //该局游戏已经获得过广告奖励了
                this._imgVideo.active = false;
                this._txtNum.node.active = true;
            }
            else {
                this._imgVideo.active = true;
                this._txtNum.node.active = false;
            }
        }
    }

    public setData(rewardId:BannerRewardId){
        this._rewardId = rewardId;
        if(rewardId == BannerRewardId.GameGridBoomNum){
            this.initBoom();
        }
        else if(rewardId == BannerRewardId.GameGridResetNum){
            this._node.on(Button.EventType.CLICK,()=>{
                CacheManager.gameGrid.UseProp(this._rewardId);
            });
        }
    }

    private initBoom(){
        let pos1 = new math.Vec3();
        let pos2 = new math.Vec3();
        let boomX:number = 0;
        let boomY:number = 0;
        let self = this;
        this._node.on(NodeEventType.TOUCH_CANCEL,()=>{
            this.touchEnd();
        });
        
        this._node.on(NodeEventType.TOUCH_END,()=>{
            this.touchEnd();
        });
        this._node.on(NodeEventType.TOUCH_START,function(event:EventTouch){
            if(self._leftNum <= 0){
                CacheManager.gameGrid.UseProp(self._rewardId);
                return;
            }
            let uiPos = event.getUIStartLocation();
            pos2.x = uiPos.x;
            pos2.y = uiPos.y;
            self._node.inverseTransformPoint(pos1,pos2);

            boomX = pos1.x;
            boomY = pos1.y + 200;
            self._canTouchMove = true;
            self._imgProp.setPosition(boomX,boomY);
            Mgr.soundMgr.playBGM("boom_fire_1");
        });
        this._node.on(NodeEventType.TOUCH_MOVE,function(event:EventTouch){
            if(self._canTouchMove){
                let deltaVec = event.getUIDelta();
                boomX += deltaVec.x;
                boomY += deltaVec.y;
                self._imgProp.setPosition(boomX,boomY);
                EventManager.dispatch(EventEnum.OnGameGridTouchMove,self._imgProp.worldPosition);
            }
        });
    }

    private touchEnd(){
        if(this._canTouchMove){
            Mgr.soundMgr.stopBGM();
            this._canTouchMove = false;
            EventManager.dispatch(EventEnum.OnGameGridPropUseCheck,this._rewardId);
            this._imgProp.setPosition(0,0);
        }
    }
}