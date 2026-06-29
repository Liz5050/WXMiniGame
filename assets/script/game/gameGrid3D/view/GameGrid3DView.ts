import { Animation, Button, Label, Node, ProgressBar, game } from "cc";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { LayerManager } from "../../../manager/LayerManager";
import { BaseUIView } from "../../base/BaseUIView"
import { AlertType, AlertView } from "../../../common/alert/AlertView";
import Mgr from "../../../manager/Mgr";
import { GameType } from "../../../enum/GameType";
import { OperationGrid3DItem } from "./OperationGrid3DItem";
import { CacheManager } from "../../../manager/CacheManager";
import { CameraType, Root3D } from "../../../Root3D";
import { GameGrid3DRoundType } from "../../../cache/GameGrid3DCache";
import { dispatchMsg, msg } from "../../../utils/MessageCenter";
import { GEvent } from "../../../enum/GEvent";
import { GameGridMap } from "../scene/GameGridMap";
import { LayerType } from "../scene/layer/LayerType";
import { IGridDropResult } from "../interface/GameInterface";

/**3D方块玩法主界面*/
export default class GameGrid3DView extends BaseUIView{
    private _btns:OperationGrid3DItem[];

    private _txtScore:Label;
    private _txtRound:Label;
    private _txtReadyTime:Label;    
    private _progressReady:ProgressBar;

    private _gameGridMap:Node;
    private _mapView:GameGridMap;
    private _switchAnim:Animation;

    private _rightCount:number = 0;
    private _score:number = 0;
    private _removeCount:number = 0;//连消计数
    private _playTime:number = 0;
    private _gameTime:number = 0;
    private _battleTime:number = 5;

    private _deltaTime:number = 0;
    private _readyTime:number = 3;
    private _curTime:number = 0;
    public constructor(){
        super(UIModuleEnum.gameGrid3D,"GameGrid3DView");
    }

    protected get parent(){
        return LayerManager.gameLayer;
    }

    protected initUI(): void {
        this._switchAnim = this._rootNode.getComponent(Animation);
        let btnExit:Node = this.getChildByName("btnExit");
        btnExit.on(Button.EventType.CLICK,()=>{
            this.hide();
        });

        let btnRestart:Node = this.getChildByName("btnRestart");
        btnRestart.on(Button.EventType.CLICK,function(){
            AlertView.show("是否重新开始游戏？",function(type:AlertType){
                if(type == AlertType.YES){
                }
            },this);
        });

        this._btns = [];
        for(let i = 0; i < 3; i++){
            let idx = i + 1;
            let btn = new OperationGrid3DItem(this.getChildByName("BtnItem" + idx));
            btn.gridIndex = i;
            this._btns.push(btn);;
        }

        this._txtScore = this.getChildByName("txtScore").getComponent(Label);
        this._txtScore.string = "得分：0";
        this._txtRound = this.getChildByName("txtRound").getComponent(Label);
        this._txtRound.string = "回合：1";
        this._progressReady = this.getChildByName("progressReady").getComponent(ProgressBar);
        this._progressReady.progress = 1;
        this._txtReadyTime = this.getChildByPath("progressReady/txtReadyTime").getComponent(Label);
        this._txtReadyTime.string = "";

    }

    protected update(dt: number): void {
        // if(CacheManager.gameGrid3D.isBattle()) {
        //     this._deltaTime += dt;
        //     if(this._deltaTime >= 1){
        //         this._deltaTime = 0;
        //         let num = MathUtils.getRandomInt(5,15);
        //         const list = CacheManager.gameGrid3D.addEntityByNum(EntityType.Enemy,num);    
        //         dispatchMsg(GEvent.OnGameGrid3DEntityInit, list);
        //     }
        // }
        // else{
        //     this._curTime += dt;
        //     if(this._readyTime <= this._curTime){
        //         CacheManager.gameGrid3D.switchRound();
        //         this._curTime = 0;
        //     }
        //     else{
        //         let progress = 1 - this._curTime / this._readyTime;
        //         this._progressReady.progress = progress;
        //         this._deltaTime += dt;
        //         if(this._deltaTime >= 1){
        //             this._deltaTime = 0;
        //             this._txtReadyTime.string = `${Math.floor(this._readyTime - this._curTime)}S`;
        //         }
        //     }
        // }
    }

    public onShowAfter(param?: any): void {
        Mgr.loader.LoadBundleRes("scene","gameGrid3D/GameGridMap",(prefab)=>{
            console.log("依赖资源加载完成，开始游戏");
            this.OnGameStart();
            this.addTimer((dt:number)=>{
                this.update(dt / 1000);
            },1);
        });
    }

    @msg(GEvent.OnGameGridDropResult)
    private onGridDropResult(result:IGridDropResult){
        if(CacheManager.gameGrid3D.roundType != GameGrid3DRoundType.Ready) return;
        const { index, isRight, canRemove, totalNum } = result;
        if(isRight){
            this._btns[index].ShowRight();
            this._rightCount ++;
        }
        else{
            this._btns[index].ShowError();
        }
        if(this._rightCount >= 3){
            this.OnReqNextPreview();
        }

        if(canRemove) {
            //Todo 临时处理，可消除结算数据应由专门的cache负责处理（得分、消除后的效果等数据）
            // 此处UI应该仅接收结算数据后，仅负责处理UI界面的得分显示逻辑
            this.onResultInfoUpdate(totalNum);
            // Mgr.soundMgr.play("damage03");//存在可消除的行or列
            // this.showScoreAddEffect(score);
        }
        else {
            this._removeCount = 0;
        }
    }

    /** 模拟更新得分信息 */
    private onResultInfoUpdate(totalNum:number){
        this._removeCount ++;
        let score:number = 0;
        if(totalNum == 1 || totalNum == 2){
            score = totalNum;
        }
        else if(totalNum == 3){
            score = totalNum + 1;
        }
        else if(totalNum > 3){
            score = totalNum * 2;
        }
        if(this._removeCount > 1){
            //连续消除
            score += this._removeCount * totalNum;
        }
        this._score += score;
        this._txtScore.string = "得分：" + this._score;
    }

    public OnGameStart(){
        if(!this._mapView){
            this._mapView = new GameGridMap();
            // let prefab = Mgr.loader.getBundleRes("scene","gameGrid3D/GameGridMap") as Prefab;
            // if(prefab) {
            //     this._gameGridMap = instantiate(prefab);
            //     this._mapView = this._gameGridMap.getComponent(GameGridMapView);
            // }
        }
        this.OnStart();
    }

    private OnStart(){
        this._gameTime = game.totalTime;
        this._playTime = 0;
        this._score = 0;
        this._txtScore.string = "得分：0";
        // this.OnRefreshNumUpdate();
        // this._btnSave.active = true;
        this.OnReqNextPreview();
    }

    private OnReqNextPreview(){
        this._rightCount = 0;
        for(let i = 0; i < this._btns.length; i++){
            this._btns[i].updatePreviewGrid();
        }
    }

    @msg(GEvent.OnGameGrid3DRoundUpdate)
    private onRoundUpdate(roundType:GameGrid3DRoundType){
        this._deltaTime = 0;
        if(roundType == GameGrid3DRoundType.Ready) {
            this._curTime = 0;
            this._progressReady.progress = 1;
            this._progressReady.node.active = true;
            this._switchAnim.play("EnterReadyAnim");
            Root3D.instance.switchCamera(CameraType.TopView);
            let round = CacheManager.gameGrid3D.round;
            this._txtRound.string = `回合：${round}`;
        }
        else{
            this._progressReady.node.active = false;
            this._switchAnim.play("EnterBattleAnim");
            Root3D.instance.switchCamera(CameraType.BattleView);
        }
    }

    public hide(){
        Mgr.soundMgr.stopBGM();    
        // EventManager.removeListener(EventEnum.OnBannerAdComplete,this.OnBannerAdComplete,this);
        // if(this._gameGridMap){
        //     this._gameGridMap.destroy();
        //     this._gameGridMap = null;

        //     this._mapView = null;
        // }
        CacheManager.gameGrid3D.clearAll();
        this._mapView && this._mapView.onExitGame();
        super.hide();
        dispatchMsg(GEvent.OnGameExit,GameType.Grid3D);
    }
    

    public getLayer(type:LayerType){
        return this._mapView && this._mapView.getLayer(type);
    }
}
