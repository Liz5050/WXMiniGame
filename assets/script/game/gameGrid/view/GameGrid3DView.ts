import { Animation, Button, Label, Node, Prefab, ProgressBar, game, instantiate } from "cc";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { LayerManager } from "../../../manager/LayerManager";
import { BaseUIView } from "../../base/BaseUIView"
import { AlertType, AlertView } from "../../../common/alert/AlertView";
import Mgr from "../../../manager/Mgr";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { GameType } from "../../../enum/GameType";
import { OperationGridItem } from "./OperationGridItem";
import { SDK } from "../../../SDK/SDK";
import { CacheManager } from "../../../manager/CacheManager";
import { Layer3DManager } from "../../../manager/Layer3DManager";
import { GameGridMapView } from "./GameGridMapView";
import { CameraType, Root3D } from "../../../Root3D";
import { GameGridRoundType } from "../../../cache/GameGridCache";
import MathUtils from "../../../utils/MathUtils";
import { EntityType } from "../scene/utils/EntityUtil";
import { addObserver, msg, removeObserver } from "../../../utils/MessageCenter";
import { CreateGridData } from "../GameGridConst";
import { GEvent } from "../../../enum/GEvent";

export class GameGrid3DView extends BaseUIView{
    private _btns:OperationGridItem[];

    private _txtScore:Label;
    private _txtRound:Label;
    private _txtReadyTime:Label;    
    private _progressReady:ProgressBar;

    private _gameGridMap:Node;
    private _mapView:GameGridMapView;
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
        addObserver(this);
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
            let btn = new OperationGridItem(this.getChildByName("BtnItem" + idx));
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

        this.addEvent();
    }

    private addEvent(){
        EventManager.addListener(EventEnum.OnGameSceneGridDrop,this.onGridDrop,this);
        EventManager.addListener(EventEnum.OnGameGridRoundUpdate,this.onRoundUpdate,this);
    }

    protected update(dt: number): void {
        if(CacheManager.gameGrid.isBattle()) {
            this._deltaTime += dt;
            if(this._deltaTime >= 1){
                this._deltaTime = 0;
                let num = MathUtils.getRandomInt(5,15);
                CacheManager.gameGrid.addEntity(EntityType.Enemy,num);    
            }
        }
        else{
            this._curTime += dt;
            if(this._readyTime <= this._curTime){
                CacheManager.gameGrid.switchRound();
                this._curTime = 0;
            }
            else{
                let progress = 1 - this._curTime / this._readyTime;
                this._progressReady.progress = progress;
                this._deltaTime += dt;
                if(this._deltaTime >= 1){
                    this._deltaTime = 0;
                    this._txtReadyTime.string = `${Math.floor(this._readyTime - this._curTime)}S`;
                }
            }
        }
    }

    public onShowAfter(param?: any): void {
        Mgr.loader.LoadBundleRes("scene","GameGrid3D/RedGrid",(prefab)=>{
            console.log("依赖资源加载完成，开始游戏");
            this.OnGameStart();
            this.addTimer((dt:number)=>{
                this.update(dt / 1000);
            },1);
        });
    }

    @msg(GEvent.OnGameSceneGridCreate)
    private onCreateGrid(data:CreateGridData){
        const {resType,startX,startY} = data;
        this._mapView.createPreviewGrid(resType,startX,startY);
    }

    private onGridDrop(index:number){
        if(CacheManager.gameGrid.roundType != GameGridRoundType.Ready) return;
        let result = this._mapView.onGridDrop();
        if(result.isRight){
            this._btns[index].ShowRight();
            this._rightCount ++;
        }
        else{
            this._btns[index].ShowError();
        }
        if(this._rightCount >= 3){
            this.OnReqNextPreview();
            // CacheManager.gameGrid.switchRound();
        }

        if(result.canRemove) {
            this._removeCount ++;
            let totalNum = result.totalNum;
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
            // Mgr.soundMgr.play("damage03");//存在可消除的行or列
            // this.showScoreAddEffect(score);
        }
        else {
            this._removeCount = 0;
        }
    }

    public OnGameStart(){
        if(!this._mapView){
            this._mapView = new GameGridMapView();
            // let prefab = Mgr.loader.getBundleRes("scene","GameGrid3D/GameGridMap") as Prefab;
            // if(prefab) {
            //     this._gameGridMap = instantiate(prefab);
            //     this._mapView = this._gameGridMap.getComponent(GameGridMapView);
            // }
        }
        Mgr.soundMgr.playBGM("bgm1");
        this._mapView.show();
        this.OnStart();
    }

    private OnStart(){
        this._gameTime = game.totalTime;
        this._playTime = 0;
        this._score = 0;
        this._txtScore.string = "得分：0";
        CacheManager.gameGrid.InitGameData();
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

    private onRoundUpdate(roundType:GameGridRoundType){
        this._deltaTime = 0;
        if(roundType == GameGridRoundType.Ready) {
            this._curTime = 0;
            this._progressReady.progress = 1;
            this._progressReady.node.active = true;
            this._switchAnim.play("EnterReadyAnim");
            Root3D.instance.switchCamera(CameraType.TopView);
            let round = CacheManager.gameGrid.round;
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
        removeObserver(this);
        CacheManager.gameGrid.clearAll();
        if(this._mapView){
            this._mapView.hide();
        }
        super.hide();
        EventManager.dispatch(EventEnum.OnGameExit,GameType.Grid3D);
    }
}