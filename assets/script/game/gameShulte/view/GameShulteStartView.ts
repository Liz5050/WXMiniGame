import { _decorator, Animation, Button, Component, instantiate, Label, math, Node, Prefab, resources, Toggle, UITransform} from 'cc';
import Mgr from '../../../manager/Mgr';
import { ShulteGridItem } from './ShulteGridItem';
import { GameType } from '../../../enum/GameType';
import { BaseUISubView } from '../../base/BaseUISubView';
import { EventManager } from '../../../manager/EventManager';
import { EventEnum } from '../../../enum/EventEnum';
import { CacheManager } from '../../../manager/CacheManager';
import { SDK } from '../../../SDK/SDK';

export class GameShulteStartView extends BaseUISubView {
    
    private static ITEM_POOL:Node[] = [];
    private _gameContainer:Node;
    private _gameContainerSize:math.Size;
    private _itemNodes:Node[] = [];

    // private _ap:AudioPlayer;
    private _resultNode:Node;
    private _txtTime:Label;
    private _txtResultTime:Label;
    private _errorAnim:Animation;
    private _rightAnim:Animation;
    
    private _indexList:number[] = [];
    private _curType:number;
    private _num:number;
    private _time:number = 0;
    private _deltaTime:number = 0;
    private _isOver:boolean = true;
    private _curClickIdx:number = 0;
    private _interval:NodeJS.Timeout;
    protected initUI(){
        this._gameContainer = this.getChildByPath("group/gridGroup");
        this._gameContainerSize = this._gameContainer.getComponent(UITransform).contentSize;
        // this._ap = Main.FindChild(this.Node,"Sound",AudioPlayer);
        this._resultNode = this.getChildByName("result");
        this._txtTime = this.getChildByName("txtTime").getComponent(Label);
        this._txtResultTime = this._resultNode.getChildByName("txtResultTime").getComponent(Label);

        this._errorAnim = this.getChildByName("error").getComponent(Animation);
        this._rightAnim = this.getChildByName("right").getComponent(Animation);

        let self = this;
        let btnExit:Node = this.getChildByName("btnBack");
        btnExit.on(Button.EventType.CLICK,function(){
            //退出游戏
            self.gameExit();            
        });
        let btnAgain:Node = this._resultNode.getChildByName("btnAgain");
        btnAgain.on(Button.EventType.CLICK,function(){
            //再来一次
            self.playAgain();
        });
    }

    public onShowAfter(type:number): void {
        this.addTimer((dt:number)=>{
            if (this._isOver) return;
            this._deltaTime += dt;//Time.deltaTime;
            if(this._deltaTime >= 100){
                this._deltaTime /= 1000;
                this._time += this._deltaTime;
                let showTime = Math.floor(this._time * 1000) / 1000;
                this._txtTime.string = showTime + "S";
                this._deltaTime = 0;
            }
        },1);
        this.startGame(type);
    }
    // public update(dt:number) {
    //     if (this._isOver) return;
    //     this._deltaTime += dt;//Time.deltaTime;
    //     if (this._deltaTime >= 0.1){
    //         this._time += this._deltaTime;
    //         let showTime = Math.floor(this._time * 1000) / 1000;
    //         this._txtTime.string = showTime + "S";
    //         this._deltaTime = 0;
    //     }
    // }

    private playAgain(){
        this._resultNode.active = false;
        this._isOver = false;
        this.updatePosition();
    }

    private gameExit(){
        if(this._interval){
            clearInterval(this._interval);
            this._interval = null;
        }
        this._curClickIdx = 0;
        this._isOver = true;
        this._indexList = [];
        this.clearItemGrid();
        this._txtTime.string = "";
        this._deltaTime = 0;
        this._time = 0;
        this._resultNode.active = false;
        SDK.HideBannerAd();
        EventManager.dispatch(EventEnum.OnGameShulteExit);
    }

    private gameOver(){
        this._curClickIdx = 0;
        this._isOver = true;
        this._resultNode.active = true;
        let timeFormat = Math.floor(this._time * 1000) / 1000;
        this.uploadResult(timeFormat);
        this._txtResultTime.string = "您的成绩是：" + timeFormat + "秒";
        this._txtTime.string = "";
        this._deltaTime = 0;
        this._time = 0;
    }

    private uploadResult(time){
        let recordTime = String(+ new Date() / 1000)
        let value = {
            "wxgame": {
                "score": time,
                "update_time": recordTime
            },
            "unitStr":"秒",
            "order":1
        }
        let KVData = { key: "rank_" + GameType.Shulte, value: value };
        SDK.postMessage({type:"UploadScore",KVData:KVData});
        CacheManager.player.uploadUserGameData({game_type:GameType.Shulte,score:time,sub_type:this._curType,record_time:recordTime,add_play_time:time});
    }

    private _clickRight:boolean;
    private onItemClick(clickIdx:number){
        if(this._isOver){
            return;
        }
        if(this._curClickIdx != clickIdx){
            this._errorAnim.play("ClickError");//Play("ClickError", -1, 0);
            // this._curClickIdx = 0;//点错一次是否重置点击
            let stopLast:boolean = true;
            if(this._clickRight){
                //上次点击如果是正确的，音效不要中断播放
                stopLast = false;
            }
            Mgr.soundMgr.play("error1", stopLast);
            this._clickRight = false;
        }
        else{
            //right
            this._curClickIdx ++;
            if(CacheManager.gameGrid.clickHide){
                //选中后消失
                this._itemNodes[clickIdx].active = false;
            }
            if(this._curClickIdx >= this._num){
                this.gameOver();
                Mgr.soundMgr.play("win");
            }else{
                let stopLast:boolean = true;
                if (!this._clickRight)
                {
                    //上次点击如果是错误的，音效不要中断播放
                    stopLast = false;
                }
                this._rightAnim.play();
                Mgr.soundMgr.play("button1", stopLast);
            }
            this._clickRight = true;
        }
    }

    private updateGrid(){
        this._isOver = false;
        let curType = this._curType;
        // let offset = this._systemInfo.screenWidth / 1080;
        let width = this._gameContainerSize.width;
        let curSize = Math.floor(width / curType);// * offset;
        
        let self = this;
        for (let i = 0; i < this._num; i++) {
            this._indexList.push(i);
            let itemNode:Node = this.getItemGrid();
            itemNode.active = true;
            this._gameContainer.addChild(itemNode);
            let tr = itemNode.getComponent(UITransform);
            tr.width = curSize;
            tr.height = curSize;

            itemNode.getComponent(ShulteGridItem).setIndex(i);
            this._itemNodes.push(itemNode);

            // let btnCom:engine.UIButton = itemNode.getComponent(engine.UIButton);
            itemNode.targetOff(Button.EventType.CLICK);
            itemNode.on(Button.EventType.CLICK,function(){
                self.onItemClick(i);
            });
        }
        this.updatePosition();
    }

    private updatePosition(){
        let curType = this._curType;
        let width = this._gameContainerSize.width;
        let curSize = Math.floor(width / curType);
        let showList:number[] = [];
        for (let i = 0; i < this._num; i++) {
            let itemNode:Node = this._itemNodes[i];
            if(!itemNode.active){
                itemNode.active = true;
            }
            let randomIdx:number = Math.floor(this._indexList.length * Math.random());
            let showIdx:number = this._indexList.splice(randomIdx,1)[0];
            showList.push(showIdx);

            let col = showIdx % curType;
            let row = Math.floor(showIdx / curType);
            let x = col * curSize;
            let y = row * - curSize;
            itemNode.setPosition(x,y);
        }
        this._indexList = showList;
    }

    private getItemGrid():Node{
        let node:Node = GameShulteStartView.ITEM_POOL.pop();
        if(!node){
            let prefabAsset:Prefab = Mgr.loader.getBundleRes("ui","gameShulte/ShulteGridItem") as Prefab;
            if(prefabAsset){
                node = instantiate(prefabAsset);
            }
            else{
                console.log("找不到资源");
            }
        }
        return node;
    }

    private clearItemGrid(){
        for (let i = 0; i < this._itemNodes.length; i++) {
            let Node = this._itemNodes[i];
            Node.active = false;
            GameShulteStartView.ITEM_POOL.push(Node);
        }
        this._itemNodes = [];
    }

    private startGame(type:number){
        SDK.ShowBannerAd();
        this._curType = type;
        this._num = type * type;
        this.updateGrid();
    }
}


