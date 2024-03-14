import { Button, Label, Node, Prefab, game, instantiate } from "cc";
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

export class GameGrid3DView extends BaseUIView{
    private _btns:OperationGridItem[];

    private _txtScore:Label;

    private _gameGridMap:Node;
    private _mapView:GameGridMapView;

    private _rightCount:number = 0;
    private _score:number = 0;
    private _removeCount:number = 0;//连消计数
    private _playTime:number = 0;
    private _gameTime:number = 0;
    public constructor(){
        super(UIModuleEnum.gameGrid3D,"GameGrid3DView");
    }

    protected get parent(){
        return LayerManager.gameLayer;
    }

    protected initUI(): void {
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

        let prefab = Mgr.loader.getBundleRes("scene","GameGrid3D/GameGridMap") as Prefab;
        if(prefab) {
            this._gameGridMap = instantiate(prefab);
            Layer3DManager.gameLayer.addChild(this._gameGridMap);
            this._mapView = this._gameGridMap.getComponent(GameGridMapView);
        }
        this.addEvent();
    }

    private addEvent(){
        EventManager.addListener(EventEnum.OnGameSceneGridCreate,this.onCreateGrid,this);
        EventManager.addListener(EventEnum.OnGameSceneGridDrop,this.onGridDrop,this);
    }

    public onShowAfter(param?: any): void {
        Mgr.loader.LoadBundleRes("scene","GameGrid3D/RedGrid",(prefab)=>{
            console.log("依赖资源加载完成，开始游戏");
            this.OnGameStart();
        });
    }

    private onCreateGrid(resType:number,startX:number,startY:number){
        this._mapView.createPreviewGrid(resType,startX,startY);
    }

    private onGridDrop(index:number){
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
            Mgr.soundMgr.play("crrect_answer3");//存在可消除的行or列
            // this.showScoreAddEffect(score);
        }
        else {
            this._removeCount = 0;
        }
    }

    public OnGameStart(){
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

    public hide(){
        Mgr.soundMgr.stopBGM();    
        // EventManager.removeListener(EventEnum.OnBannerAdComplete,this.OnBannerAdComplete,this);
        
        super.hide();
        EventManager.dispatch(EventEnum.OnGameExit,GameType.Grid3D);
    }
}