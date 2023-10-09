import { _decorator, Animation, Button, Component, instantiate, Label, math, Node, Prefab, resources, Toggle, UITransform} from 'cc';
import { GameShulteBeginView } from './GameShulteBeginView';
import Mgr from '../../../manager/Mgr';
import { ShulteGridItem } from './ShulteGridItem';
import { GameType } from '../../../enum/GameType';
import WXSDK from '../../../SDK/WXSDK';
const { ccclass, property } = _decorator;

@ccclass('GameShulteStartView')
export class GameShulteStartView extends Component {
    
    private static ITEM_POOL:Node[] = [];
    private _beginNode:Node;
    private _gameStartNode:Node;
    private _gameContainer:Node;
    private _gameContainerSize:math.Size;
    private _itemNodes:Node[] = [];

    private _beginView:GameShulteBeginView;
    // private _ap:AudioPlayer;
    private _resultNode:Node;
    private _txtTime:Label;
    private _txtResultTime:Label;
    private _errorAnim:Animation;
    private _rightAnim:Animation;
    private _toggle:Toggle;
    
    private _indexList:number[] = [];
    private _curType:number;
    private _num:number;
    private _time:number = 0;
    private _deltaTime:number = 0;
    private _isOver:boolean = true;
    private _curClickIdx:number = 0;
    public start(){
        this._beginView = this.getComponent(GameShulteBeginView);
        
        this._beginNode = this.node.getChildByName("begin");
        this._gameStartNode = this.node.getChildByName("gameStart");
        this._gameContainer = this._gameStartNode.getChildByPath("group/gridGroup");
        this._gameContainerSize = this._gameContainer.getComponent(UITransform).contentSize;
        // this._ap = Main.FindChild(this.Node,"Sound",AudioPlayer);
        this._resultNode = this._gameStartNode.getChildByName("result");
        this._txtTime = this._gameStartNode.getChildByName("txtTime").getComponent(Label);
        this._txtResultTime = this._resultNode.getChildByName("txtResultTime").getComponent(Label);

        this._errorAnim = this._gameStartNode.getChildByName("error").getComponent(Animation);
        this._rightAnim = this._gameStartNode.getChildByName("right").getComponent(Animation);
        this._toggle = this._beginNode.getChildByName("Toggle").getComponent(Toggle);

        let self = this;
        let btnExit:Node = this._gameStartNode.getChildByName("btnBack");
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
    public update(dt:number) {
        if (this._isOver) return;
        this._deltaTime += dt;//Time.deltaTime;
        if (this._deltaTime >= 0.1){
            this._time += this._deltaTime;
            let showTime = Math.floor(this._time * 1000) / 1000;
            this._txtTime.string = showTime + "S";
            this._deltaTime = 0;
        }
    }

    private playAgain(){
        this._resultNode.active = false;
        this._isOver = false;
        this.updatePosition();
    }

    private gameExit(){
        this._curClickIdx = 0;
        this._isOver = true;
        this._indexList = [];
        this.clearItemGrid();
        this._txtTime.string = "";
        this._deltaTime = 0;
        this._time = 0;
        this._resultNode.active = false;
        this._gameStartNode.active = false;
        this._beginNode.active = true;
        this._beginView.gameExit();
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
        WXSDK.postMessage({type:"UploadScore",KVData:KVData});
        WXSDK.UploadUserGameData({game_type:GameType.Shulte,score:time,record_time:recordTime});
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
            if(this._toggle.isChecked){
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
            let prefabAsset:Prefab = resources.get("prefab/ShulteGridItem");
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

    public startGame(type:number){
        this._curType = type;
        this._num = type * type;

        let url:string = 'prefab/ShulteGridItem';
        if(resources.get(url)){
            this.updateGrid();
        }else{
            let self = this;
            resources.load(url,function(){
                self.updateGrid();
            });
        }
    }
}


