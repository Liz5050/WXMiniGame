import { _decorator, Animation, Button, Component, EventTouch, instantiate, Label, math, Node, NodeEventType, Prefab, resources, sys} from 'cc';
import { EventManager } from '../../../manager/EventManager';
import { EventEnum } from '../../../enum/EventEnum';
import TweenManager from '../../../common/TweenManager';
import Mgr from '../../../manager/Mgr';
import { GameType } from '../../../enum/GameType';
import WXSDK from '../../../SDK/WXSDK';
const { ccclass, property } = _decorator;

@ccclass('GameGridStartView')
export class GameGridStartView extends Component {
    private _btns:BtnPreviewGrid[];

    private _txtScore:Label;
    private _btnSave:Node;
    private _txtRefreshNum:Label;
    private _imgVideo:Node;
    private _btnRefresh:Node;
    private _refreshAnim:Animation;

    private _mapItemList:MapGridItem[][];
    private _mapContainer:Node;
    private _effectContainer:Node;
    private _rightCount:number = 0;
    private _score:number = 0;
    private _removeCount:number = 0;//连消计数
    private _playTime:number = 0;
    
    private _userdata:any;
    private _scoreAddItemList:Node[] = [];
    private ScoreItemPool:Node[] = [];
    private _refreshNum = 1;//刷新次数
    private _hadGetVideoReward:boolean = false;//是否获取过广告奖励（每局游戏仅可获得1次广告奖励）
    public update(dt) {
        this._playTime += dt;
    }
    public start(): void {
        this._mapContainer = this.node.getChildByPath("gridMap/items");
        this._effectContainer = this.node.getChildByPath("gridMap/effect");

        this._btns = [];
        for(let i = 0; i < 3; i++){
            let idx = i + 1;
            let btn = new BtnPreviewGrid(this.node.getChildByName("BtnPreviewGrid" + idx));
            btn.gridIndex = i;
            this._btns.push(btn);;
        }

        this._txtScore = this.node.getChildByName("txtScore").getComponent(Label);
        this._txtScore.string = "得分：0";

        let self = this
        let btnExit:Node = this.node.getChildByName("btnExit");
        btnExit.on(Button.EventType.CLICK,function(){
            self.hide();
        });

        let btnRestart:Node = this.node.getChildByName("btnRestart");
        btnRestart.on(Button.EventType.CLICK,function(){
            self.OnGameRestart();
            // self._btnSave.active = true;
        });

        this._btnSave = this.node.getChildByName("btnSave");
        this._btnSave.active = false;
        this._btnSave.on(Button.EventType.CLICK,function(){
            self._btnSave.active = false;
            self.saveCurData();//保存当前游戏进度
        });

        this._refreshAnim = this.node.getChildByName("refreshAnim").getComponent(Animation)
        this._btnRefresh = this.node.getChildByName("btnRefresh");
        this._txtRefreshNum = this._btnRefresh.getChildByName("txtRefreshNum").getComponent(Label);
        this._imgVideo = this._btnRefresh.getChildByName("img_video");
        this._btnRefresh.on(Button.EventType.CLICK,function(){
            self.OnUseRefresh();
        });

        this.initMapGrid();
        EventManager.addListener(EventEnum.OnGameGridTouchEnd,this.OnTouchEndCheck,this);
        EventManager.addListener(EventEnum.OnBannerAdComplete,this.OnBannerAdComplete,this);
    }

    public onDisable(): void {
        Mgr.soundMgr.stopBGM();    
    }

    private initMapGrid(){
        this._mapItemList = [];
        for(let row = 0; row < 10; row++){
            for(let col = 0; col < 10; col++){
                if(!this._mapItemList[row]){
                    this._mapItemList[row] = [];
                }
                let item:MapGridItem = new MapGridItem();
                this._mapItemList[row][col] = item;
                item.init(col,row,this._mapContainer);
            }
        }
        this.OnGameStart();
    }

    private OnBannerAdComplete(){
        this._hadGetVideoReward = true;
        this._refreshNum += 1;
        this._refreshAnim.node.active = true;
        this._refreshAnim.play();
        this.OnRefreshNumUpdate();
    }

    private OnRefreshNumUpdate(){
        this._txtRefreshNum.string = this._refreshNum.toString();
        if(this._refreshNum > 0){
            this._txtRefreshNum.node.active = true;
            this._imgVideo.active = false;
        }else{
            if(this._hadGetVideoReward){
                //该局游戏已经获得过广告奖励了
                this._imgVideo.active = false;
                this._txtRefreshNum.node.active = true;
            }
            else {
                this._imgVideo.active = true;
                this._txtRefreshNum.node.active = false;
            }
        }
    }

    private OnUseRefresh(){
        if(this._refreshNum > 0){
            this.OnReqNextPreview();
            this._refreshNum -= 1;
            this.OnRefreshNumUpdate();
        }
        else{
            if(this._hadGetVideoReward){
                WXSDK.showToast("刷新次数不足!");
            }
            else {
                WXSDK.ShowRewardBanner();
            }
        }
    }

    private OnReqNextPreview(){
        this._rightCount = 0;
        for(let i = 0; i < this._btns.length; i++){
            this._btns[i].updatePreviewGrid();
        }
    }

    private _endCheckLocalPos:math.Vec3;
    private OnTouchEndCheck(index:number,gridList:Node[]){
        if(!this._endCheckLocalPos){
            this._endCheckLocalPos = new math.Vec3();
        }
        let num = gridList.length;
        let emptyNum = 0;
        let itemArr:MapGridItem[] = [];
        for(let i = 0; i < num; i ++) {
            let grid:Node = gridList[i];//GameUI.FindChild(randomGrid,"grid" + i);
            this._mapContainer.inverseTransformPoint(this._endCheckLocalPos,grid.worldPosition);
            // console.log("坐标转换" + i + "----x：" + localPos.x + "----y：" + localPos.y)
            if(this._endCheckLocalPos.x >= -500 && this._endCheckLocalPos.x <= 500 && this._endCheckLocalPos.y >= -500 && this._endCheckLocalPos.y <= 500){
                //在范围内，进一步检测对应网格是否是空位
                let idx:number[] = this.ConvertXYToIndex(this._endCheckLocalPos.x,this._endCheckLocalPos.y);
                // console.log("坐标转换行列值" + i + "----col：" + idx[0] + "----row：" + idx[1]);
                let item:MapGridItem = this._mapItemList[idx[1]][idx[0]];
                if(item.isEmpty){
                    emptyNum ++;
                    itemArr.push(item);
                }else{
                    //存在非空网格
                    break;
                }
            }
            else{
                //不在网格地图范围内
                break;
            }
        }

        let checkListX:number[] = [];
        let checkListY:number[] = [];
        if(emptyNum == num){
            for(let i = 0; i < itemArr.length; i ++){
                itemArr[i].setEmpty(false);
                let col:number = itemArr[i].col;
                let row:number = itemArr[i].row;
                if(checkListX.indexOf(col) == -1){
                    checkListX.push(col);
                }
                if(checkListY.indexOf(row) == -1){
                    checkListY.push(row);
                }
            }
            this._rightCount ++;
            this._btns[index].ShowRight(itemArr);
        }
        else{
            this._btns[index].ShowError();
        }
        if(this._rightCount >= 3){
            this.OnReqNextPreview();
        }

        for(let i:number = checkListX.length - 1; i >= 0; i--){
            let col:number = checkListX[i];
            for(let row:number = 0; row < 10; row++){
                if(this._mapItemList[row][col].isEmpty){
                    checkListX.splice(i,1);
                    break; 
                }
            }
        }
        for(let i:number = checkListY.length - 1; i >= 0 ; i--){
            let row:number = checkListY[i];
            for(let col:number = 0; col < 10; col++){
                if(this._mapItemList[row][col].isEmpty){
                    checkListY.splice(i,1);
                    break; 
                }
            }
        }
        let canRemove:boolean = false;
        let lenX:number = checkListX.length;
        let lenY:number = checkListY.length;
        for(let i:number = 0; i < lenX; i++){
            let col:number = checkListX[i];
            for(let row:number = 0; row < 10; row++){
                this._mapItemList[row][col].setEmpty(true,true,1);//1、纵向消除
                canRemove = true
            }
        }
        for(let i:number = 0; i < lenY ; i++){
            let row:number = checkListY[i];
            for(let col:number = 0; col < 10; col++){
                this._mapItemList[row][col].setEmpty(true,true,2);//2、横向消除
                canRemove = true
            }
        }
        if(canRemove) {
            this._removeCount ++;
            let totalNum = lenX + lenY;
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
            this.showScoreAddEffect(score);
        }
        else {
            this._removeCount = 0;
        }
    }

    private showScoreAddEffect(addScore:number){
        let self = this;
        let scoreItem = this.ScoreItemPool.pop();
        if(!scoreItem){
            let url:string = "prefab/ScoreAddItem";
            let itemPrefab:Prefab = resources.get(url); 
            if(itemPrefab){
                scoreItem = instantiate(itemPrefab);
            }else{
                console.log("scoreitem has been loading");
                return;
            }
        }
        this._scoreAddItemList.push(scoreItem);
        this._effectContainer.addChild(scoreItem);
        let txtScore = scoreItem.getChildByName("txtScoreAdd").getComponent(Label);
        txtScore.string = "+" + addScore;
        scoreItem.active = true;
        scoreItem.setScale(0.1,0.1);
        scoreItem.setPosition(this._endCheckLocalPos.x,this._endCheckLocalPos.y);
        TweenManager.addTween(scoreItem).to({scaleX:3,scaleY:3},100).to({scaleX:1,scaleY:1},100).wait(400).to({scaleX:0.1,scaleY:0.1},100).call(function(){
            scoreItem.active = false;
            let idx = self._scoreAddItemList.indexOf(scoreItem);
            self._scoreAddItemList.splice(idx,1);
            self.ScoreItemPool.push(scoreItem);
        });
    }

    //局部坐标转换为网格索引
    private ConvertXYToIndex(posX:number,posY:number):number[]{
        let col = Math.round((posX + 450) / 100);
        let row = Math.round(Math.abs(posY - 450) / 100);
        return [col,row];
    }

    //开始游戏
    public OnGameStart(){
        // this._btnSave.active = false;
        this.OnStart();
        // if(WXSDK.isMobile()) {
        //     WXSDK.DB.collection('gamegrid_userdata').doc("game_cur_data").get({
        //         success: function(res) {
        //             console.log("get success",res);
        //             if(res.data.is_valid){
        //                 self._userdata = res.data;
        //                 self.OnResume(res.data);
        //             }
        //             else{
        //                 self.OnStart();
        //             }
        //         },
        //         fail: function(res){
        //             console.log("get fail",res);
        //             self.OnStart();
        //         }
        //     });
        // }
        // else {
        //     this.OnStart();
        // }
    }

    private OnStart(){
        this._playTime = 0;
        this._score = 0;
        this._txtScore.string = "得分：0";
        this._refreshNum = 1;
        this._hadGetVideoReward = false;
        this.OnRefreshNumUpdate();
        // this._btnSave.active = true;
        this.OnReqNextPreview();
    }

    private OnResume(data){
        this._score = data.score;
        this._txtScore.string = "得分：" + this._score;
        for(let i:number = 0; i < this._mapItemList.length; i++){
            for(let k:number = 0; k < this._mapItemList[i].length; k++){
                this._mapItemList[i][k].setEmpty(data.game_data[i][k]);
            }
        }
        this._rightCount = 0;
        if(data.gridInfos){
            for(let i = 0; i < this._btns.length; i++){
                this._btns[i].updatePreviewGrid(data.gridInfos[i]);
                if(!data.gridInfos[i].enable){
                    this._rightCount++;
                }
            }
        }
        else {
            this.OnReqNextPreview();
        }
    }

    //重新开始游戏
    private OnGameRestart(){
        if(this._score > 0){
            this.uploadScore();//上传成绩
        }
        this.exitClear(true);
        this.OnStart();
    }

    private exitClear(playTween:boolean = false){
        if(this._userdata){
            WXSDK.DB.collection('gamegrid_userdata').doc("game_cur_data").set({
                data:{is_valid:false},
                success: function(res) {
                    console.log("doc set success",res,res.data);
                },
                fail: console.error
            });
            this._userdata = null;
        }

        this._rightCount = 0;
        this._txtScore.string = "得分：0";
        this._score = 0;
        for(let i:number = 0; i < this._mapItemList.length; i++){
            for(let k:number = 0; k < this._mapItemList[i].length; k++){
                this._mapItemList[i][k].setEmpty(true,playTween);
            }
        }

        for(let i:number = 0; i < this._scoreAddItemList.length; i++){
            let item = this._scoreAddItemList[i];
            TweenManager.removeTweens(item);
            item.active = false;
            this.ScoreItemPool.push(item);
        }
        this._scoreAddItemList = [];
        this._playTime = 0;
    }

    private saveCurData(){
        let score = this._score;
        let mapItemData = [];
        for(let row = 0; row < 10; row++){
            for(let col = 0; col < 10; col++){
                if(!mapItemData[row]){
                    mapItemData[row] = [];
                }
                mapItemData[row][col] = this._mapItemList[row][col].isEmpty;
            }
        }
        let gridInfoList = [];
        for(let i = 0; i < this._btns.length; i++){
            let info = this._btns[i].getCurGridInfo();
            gridInfoList.push(info);
        }
        
        let time = String(+ new Date() / 1000);
        let gameData = {
            time:time,
            score:score,
            game_data:mapItemData,
            gridInfos:gridInfoList,
            is_valid:true,
        }
        WXSDK.DB.collection('gamegrid_userdata').doc("game_cur_data").set({
            data:gameData,
            success: function(res) {
                console.log("doc set success",res,res.data);
                WXSDK.showToast("保存成功");
            },
            fail: function(res){
                console.log("doc set fail",res,res.data);
                WXSDK.showToast("保存失败");
            }
        });
    }
    
    private uploadScore(){
        let time = String(+ new Date() / 1000)
        let score = this._score;
        let value = {
            "wxgame": {
                "score": score,
                "update_time": time
            },
            "unitStr":"分",
            "order":2
        }
        let KVData = { key: "rank_" + GameType.Grid, value: value };
        let timeFormat = Math.floor(this._playTime * 1000) / 1000;
        WXSDK.postMessage({type:"UploadScore",KVData:KVData});
        WXSDK.UploadUserGameData({game_type:GameType.Grid,score:score,record_time:time,add_play_time:timeFormat});
    }

    private hide(){
        this.uploadScore();//上传成绩
        this.exitClear();
        this.node.active = false;
        EventManager.dispatch(EventEnum.OnGameExit,GameType.Grid);
    }
}

export class MapGridItem {
    private _col:number;
    private _row:number;
    private _posX:number;
    private _posY:number;
    private _itemEntity:Node;
    private _container:Node;
    private _posArr:number[];

    private _isEmpty:boolean = true;
    private _playTween:boolean;
    public consturctor(){

    }

    public init(col:number,row:number,container:Node){
        this._col = col;
        this._row = row;
        this._posX = -450 + col * 100;
        this._posY = 450 - row * 100;
        this._posArr = [this._posX,this._posY];
        this._container = container;
    }

    private initUI(){
        let url:string = "prefab/GameGridMapItem";
        let prefabAsset:Prefab = resources.get(url);
        if(prefabAsset){
            this._itemEntity = instantiate(prefabAsset);
            this._container.addChild(this._itemEntity);
            this._itemEntity.setPosition(this._posX,this._posY);
        }
    }

    public get isEmpty():boolean{
        return this._isEmpty;
    }

    public setEmpty(bool:boolean,playTween:boolean = false,col_row:number = -1){
        this._isEmpty = bool;
        if(!bool){
            if(this._itemEntity){
                this.clearTween();
                this._itemEntity.active = true;
            }
            else{
                this.initUI();
            }
        }
        else{
            if(this._itemEntity){
                if(playTween){
                    if(!this._playTween){
                        this._playTween = true;
                        let index:number = 0;
                        if(col_row > 0){
                            index = col_row == 1 ? this._row : this._col;
                        }
                        TweenManager.addTween(this._itemEntity).wait(50 * index).to({scaleX:2,scaleY:2},50).to({scaleX:0,scaleY:0},100);
                    }
                }
                else{
                    this.clearTween();
                    this._itemEntity.active = false;
                }
            }
        }
    }

    private clearTween(){
        if(this._playTween){
            TweenManager.removeTweens(this._itemEntity);
            this._itemEntity.setScale(1,1);
            this._playTween = false;
        }
    }

    public get position():number[] {
        return this._posArr;
    }

    public get col():number{
        return this._col;
    }

    public get row():number{
        return this._row;
    }

    public getItemWorldPos():math.Vec3{
        if(!this._itemEntity){
            return null;
        }
        
        return this._itemEntity.getWorldPosition();
    }
}

class BtnPreviewGrid {
    private _touchMask:Node;
    private _preview:Node;
    private _previewPos:math.Vec3;
    private _previewScale:math.Vec3;
    private _previewX:number;//初始X位置
    private _previewY:number;//初始Y位置
    private _moveStartX:number;
    private _moveStartY:number;
    private _canMove:boolean;
    private _gridIndex:number;

    private _randomGrid:Node;
    private _lastRandomGrid:Node;
    private _gridList:Node[];
    private _btnGrid:Node;
    private _node:Node;
    private _prefabUrl:string;
    public constructor(node:Node) {
        this._node = node;
        this.initUI();        
    }

    private initUI(){
        this._preview = this._node.getChildByName("preview");
        this._previewPos = this._preview.getPosition();
        this._previewScale = this._preview.getScale();
        this._previewX = this._previewPos.x;
        this._previewY = this._previewPos.y;
        

        this._btnGrid = this._node.getChildByName("btnGrid")
        this._btnGrid.on(Node.EventType.TOUCH_CANCEL,function(){
            self.touchEnd();
        });
        
        this._btnGrid.on(NodeEventType.TOUCH_END,function(){
            self.touchEnd();
        });
        let self = this;
        let pos1 = new math.Vec3();
        let pos2 = new math.Vec3();
        this._btnGrid.on(NodeEventType.TOUCH_START,function(event:EventTouch){
            let uiPos = event.getUIStartLocation();
            pos2.x = uiPos.x;
            pos2.y = uiPos.y;
            self._node.inverseTransformPoint(pos1,pos2);
            self.touchStart(pos1.x,pos1.y);
        });

        this._btnGrid.on(NodeEventType.TOUCH_MOVE,function(event:EventTouch){
            let pos = event.getUIDelta();
            self.touchMove(pos.x,pos.y);
        });
        
        this._touchMask = this._node.getChildByName("touchMask");
        this._touchMask.active = false;
    }

    private touchStart(startX:number,startY:number){
        if(this._canMove) return;
        this._moveStartX = startX;
        this._moveStartY = startY + 250;
        // this._offsetX = startX;
        // this._offsetY = startY;
        let self = this;
        self._canMove = true;
        TweenManager.removeTweens(this._preview);
        TweenManager.addTween(this._preview).to({scaleX:2, scaleY:2,x:this._moveStartX,y:this._moveStartY},100);
        Mgr.soundMgr.play("crrect_answer1",false);
    }

    private touchMove(deltaX:number,deltaY:number){
        if(this._canMove){
            // let offsetX = moveX - this._offsetX;
            // let offsetY = moveY - this._offsetY;
            let posX = this._moveStartX + deltaX;
            let posY = this._moveStartY + deltaY;
            this._moveStartX = posX;
            this._moveStartY = posY;
            this._preview.setPosition(posX,posY);
        }
    }

    private touchEnd(){
        if(this._canMove){
            this._canMove = false;
            EventManager.dispatch(EventEnum.OnGameGridTouchEnd,this._gridIndex,this._gridList);
        }
    }

    public ShowRight(itemList:MapGridItem[]){
        this._touchMask.active = true;
        Mgr.soundMgr.play("crrect_answer2",false);
        let self = this;
        for(let i = 0; i < itemList.length; i++){
            let item:MapGridItem = itemList[i];
            let localPos:math.Vec3 = new math.Vec3();
            this._randomGrid.inverseTransformPoint(localPos,item.getItemWorldPos());

            let grid:Node = this._gridList[i];
            TweenManager.addTween(grid).to({x:localPos.x,y:localPos.y},100).call(function(){
                grid.active = false;
            });
        }
    }

    public ShowError(){
        // Mgr.soundMgr.play("error999");
        Mgr.soundMgr.play("mobile_phone_O",false);
        TweenManager.removeTweens(this._preview);
        TweenManager.addTween(this._preview).to({x:this._previewX, y:this._previewY,scaleX:1,scaleY:1},100);
    }

    public set gridIndex(index:number) {
        this._gridIndex = index;
    }

    public get gridIndex():number {
        return this._gridIndex;
    }

    public getCurGridInfo(){
        let scale = this._randomGrid.getScale();
        let angle = this._randomGrid.angle;
        return {
            enable:!this._touchMask.active,
            url:this._prefabUrl,
            scaleX:scale.x,
            scaleY:scale.y,
            angle:angle,
        };
    }

    public updatePreviewGrid(gridInfo = null){
        if(gridInfo && !gridInfo.enable){
            this._touchMask.active = true;
            if(this._gridList){
                for(let i = 0; i < this._gridList.length; i++){
                    this._gridList[i].active = false;
                }
            }
            return;
        }

        this._touchMask.active = false;
        this._preview.setPosition(this._previewX,this._previewY);
        this._preview.setScale(1,1);
        let url:string
        if(gridInfo){
            url = gridInfo.url;
        }
        else {
            let gridIdx:number = 1 + Math.round(Math.random() * 9);
            url = "prefab/PreviewGrid" + gridIdx;
        }
        this._prefabUrl = url;
        if(resources.get(url)){
            this.updatePreview(url,gridInfo);
        }else{
            let self = this;
            resources.load(url,function(){
                self.updatePreview(url,gridInfo);
            });
        }
    }

    private updatePreview(url:string,gridInfo = null) {
        let prefabAsset:Prefab = resources.get(url);
        let node:Node;
        if(prefabAsset){
            if(this._lastRandomGrid){
                this._lastRandomGrid.destroy();
                this._lastRandomGrid = null;
            }
            if(this._randomGrid){
                //保存上一个格子对象，用于完成3个的缓动效果
                this._lastRandomGrid = this._randomGrid;
                this._randomGrid.active = false;//隐藏上一个，否则会影响下一个格子的布局位置
            }
            node = instantiate(prefabAsset);
            this._preview.addChild(node);
            this._randomGrid = node;
            let num = node.children.length;
            this._gridList = [];
            for(let i = 1; i <= num; i++){
                let grid:Node = node.getChildByName("grid" + i);
                this._gridList.push(grid);
            }
            if(gridInfo){
                node.angle = gridInfo.angle;
                node.setScale(gridInfo.scaleX,gridInfo.scaleY);
            }
            else {
                if(Math.random() > 0.5){
                    node.angle = 90;// * Math.PI / 180;
                }
                let scaleX = Math.random() > 0.5 ? -1 : 1;
                let scaleY = Math.random() > 0.5 ? -1 : 1;
                node.setScale(scaleX,scaleY);
            }
        }
        else{
            console.log("找不到资源");
        }
    }
}
