import { Vec3, math } from "cc";
import { BannerRewardId, SDK } from "../SDK/SDK";
import { AlertType, AlertView } from "../common/alert/AlertView";
import { CloudApi } from "../enum/CloudDefine";
import { EventEnum } from "../enum/EventEnum";
import { GameType } from "../enum/GameType";
import { CacheManager } from "../manager/CacheManager";
import { EventManager } from "../manager/EventManager";
import MathUtils from "../utils/MathUtils";
import { EnemyVo } from "../game/gameGrid/scene/vo/EnemyVo";
import { EntityVo } from "../game/gameGrid/scene/vo/EntityVo";
import { GridEntityVo } from "../game/gameGrid/scene/vo/GridEntityVo";
import { Tip } from "../common/tip/Tip";
import { GridHeroVo } from "../game/gameGrid/scene/vo/GridHeroVo";
import { EntityState, EntityType, EntityUtil } from "../game/gameGrid/scene/utils/EntityUtil";

class GameGridRankData {
    public type:number;
    public subtype:number;
    public openid:number;
    public rank:number;
    public name:string;
    public value:number;
    public avatarUrl:string;
    public recordTime:number;
    public get valueStr():string{
        if(this.type == GameType.Shulte){
            return this.value + "秒";
        }
        return this.value + "分";
    }
}

export enum GameGridRoundType{
    Ready = 1 ,
    Battle = 2
}

export class GameGridCache {
    private _rankDataListDict:{[typeKey:string]:GameGridRankData[]} = {};
    private _rankDataDict:{[openid:string]:GameGridRankData} = {};
    private _myRankData:{[openid:string]:GameGridRankData} = {};

    private _curSkinCfg:any;
    private _saveData:any;
    public clickHide:boolean = true;//点击选中后是否消失
    private _hadGetVideoReward:{[rewardId:number]:boolean};//是否获取过广告奖励（每局游戏仅可获得1次广告奖励）
    private _propNum:{[rewardId:number]:number};
    public showClickEffect:boolean = true;//点击特效
    
    private _gridTypeList:{[resId:number]:number[][]} = {
        [1]:[
            [1]
        ],
        [2]:[
            [1,1]
        ],
        [3]:[
            [1,1,1]
        ],
        [4]:[
            [1,1,1,1]
        ],
        [5]:[
            [1,1,1,1,1]
        ],
        [6]:[
            [1,0],
            [1,1]
        ],
        [7]:[
            [1,1],
            [1,1]
        ],
        [8]:[
            [1,0,0],
            [1,0,0],
            [1,1,1]
        ],
        [9]:[
            [1,1,1],
            [1,1,1],
            [1,1,1]
        ],
        [10]:[
            [0,1,0],
            [1,1,1]
        ],
        [11]:[
            [1],
            [1]
        ],
        [12]:[
            [1],
            [1],
            [1]
        ],
        [13]:[
            [1],
            [1],
            [1],
            [1]
        ],
        [14]:[
            [1],
            [1],
            [1],
            [1],
            [1]
        ],
        [15]:[
            [1,0],
            [1,1],
            [1,0],
        ]
    };

    private _maxEnemyNum:number = 60;//最多同时存在数量
    private _enemyCountList:{[round:number]:number} = {};
    private _resTypeList = [1,2,3,6,7,10,11,12];
    
    private _entitys:{[entityId:string]:EntityVo} = {};
    private _entityCount:{[type:number]:number} = {};
    private _roundType:GameGridRoundType;
    private _sceneReady:boolean = false;
    private _round:number = 1;
    private _nextRound:number = 1;//当前回合的怪物全部击杀，才可进入下一回合
    public constructor(){
        this._roundType = GameGridRoundType.Ready;
    }

    //获取游戏道具数量
    public getPropNum(rewardId:BannerRewardId){
        return this._propNum[rewardId];
    }

    //是否已经领取过广告奖励
    public hadGetVideoReward(rewardId:BannerRewardId){
        return this._hadGetVideoReward[rewardId];
    }

    //每次重新开始，初始化游戏数据
    public InitGameData(){
        this._hadGetVideoReward = {};
        this._propNum = {
            [BannerRewardId.GameGridResetNum]:1,
            [BannerRewardId.GameGridBoomNum]:1
        };
        this._round = 1;
        this._nextRound = 1;
        this._roundType = GameGridRoundType.Ready;
        this._enemyCountList[this._round] = 1;
        this._sceneReady = true;
    }

    public AddPropNum(rewardId:BannerRewardId){
        let num = this._propNum[rewardId];
        if(num == undefined){
            return;
        }
        num += 1;
        this._propNum[rewardId] = num;
        this._hadGetVideoReward[rewardId] = true;
    }

    public UseProp(rewardId:BannerRewardId){
        let num = this._propNum[rewardId];
        if(num > 0){
            num --;
            this._propNum[rewardId] = num;
            EventManager.dispatch(EventEnum.OnGameGridPropUseUpdate,rewardId);
            // this.OnReqNextPreview();
            // this._refreshNum -= 1;
            // this.OnRefreshNumUpdate();
        }
        else{
            if(this._hadGetVideoReward[rewardId]){
                Tip.showRollTip("道具数量不足!");
            }
            else {
                SDK.ShowRewardBanner(rewardId);
                // let tips:string = rewardId == BannerRewardId.GameGridResetNum ? "重置道具" : "炸弹道具";
                // AlertView.show("是否观看广告获得1个" + tips,(type:AlertType)=>{
                //     if(type == AlertType.YES){
                //         SDK.ShowRewardBanner(rewardId);
                //     }
                // })
            }
        }
    }

    public GetWorldRankDataList(type:GameType,subtype:number = 0):GameGridRankData[]{
        let typeKey = type + "_" + subtype;
        let list = this._rankDataListDict[typeKey];
        return list;
    }

    public GetMyRankData(type:GameType,subtype:number){
        if(!SDK.openid){
            return null;
        }
        let openidKey = SDK.openid + type + "_" + subtype;
        return this._myRankData[openidKey];
    }

    public UpdateSkin(cfg){
        this._curSkinCfg = cfg;
    }

    public GetCurSkinCfg():any{
        if(!this._curSkinCfg){
            let skinId = 0;
            if(CacheManager.player.playerInfo){
                skinId = CacheManager.player.playerInfo.skin_id;
            }
            else{
                skinId = CacheManager.storage.getNumber("skinUsed");
            }
            if(skinId > 0){
                let cfg = CacheManager.shop.getShopConfigById(skinId);
                if(cfg){
                    return cfg;
                } 
            }
            return;
        }
        return this._curSkinCfg;
    }

    //-----------------后端通信----------------
    //请求所有玩家数据
    public ReqRankDataList(type:number,subtype:number = 0){
        let typeKey = type + "_" + subtype;
        let list:GameGridRankData[] = this._rankDataListDict[typeKey];
        if(!list){
            list = [];
            this._rankDataListDict[typeKey] = list;
            SDK.CloudGET(CloudApi.all_user_game_data,[type,subtype],(res) => {
                console.log("排行榜数据请求成功",res);
                if(!res){
                    return;
                }
                let dataList = res.data;
                for(let i = 0; i < dataList.length; i++){
                    let data = dataList[i];
                    let openidKey = data.openid + type + "_" + subtype;
                    let rankData = this._rankDataDict[openidKey];
                    if(!rankData){
                        rankData = new GameGridRankData();
                        this._rankDataDict[openidKey] = rankData;
                        list.push(rankData);
                    }
                    rankData.type = type;
                    rankData.subtype = subtype;
                    rankData.openid = data.openid;
                    rankData.name = data.nick_name;
                    rankData.avatarUrl = data.avatar_url;
                    rankData.value = data.score;
                    rankData.recordTime = data.record_time;
                    rankData.rank = i + 1;
                    if(data.openid== SDK.openid){
                        this._myRankData[openidKey] = rankData;
                    }
                }
                EventManager.dispatch(EventEnum.OnGameGridRankUpdate,type,subtype);
            });
        }
        else{
            EventManager.dispatch(EventEnum.OnGameGridRankUpdate,type,subtype);
        }
    }

    public sendSaveGame(gameData:any){
        gameData.propNum = this._propNum;
        gameData.hadGetVideoReward = this._hadGetVideoReward;
        let jsonStr = JSON.stringify(gameData);
        SDK.CloudPOST(CloudApi.game_grid_save,{jsonStr:jsonStr},function(data){
            console.log("保存记录更新",data.data);
            Tip.showRollTip("保存成功");
        });
    }

    public getSaveGameData(){
        SDK.CloudGET(CloudApi.game_grid_save,null,(resData)=>{
            let data = resData.data;
            if(resData.code == 0){
                this._saveData = JSON.parse(data);
                this._propNum = this._saveData.propNum;
                this._hadGetVideoReward = this._saveData.hadGetVideoReward;
                console.log("获取进度成功",this._saveData);
            }
            else{
                this._saveData = null;
            }
            EventManager.dispatch(EventEnum.OnGameGridSaveDataUpdate,this._saveData);
        });
    }

    //#region switchRound
    public switchRound(){
        this._sceneReady = false;
        let type = this._roundType;
        if(type == GameGridRoundType.Ready){
            this._roundType = GameGridRoundType.Battle;
        }
        else {
            this._roundType = GameGridRoundType.Ready;
        }
        let round = this._nextRound;
        this.setRound(round);
        EventManager.dispatch(EventEnum.OnGameGridRoundUpdate,this._roundType);
    }

    private setRound(round:number){
        if(this._round == round) return;
        this._round = round;
        this._enemyCountList[this._round] = this._round;
    }

    public get roundType():GameGridRoundType{
        return this._roundType;
    }

    public get round():number {
        return this._round;
    }
    //#endregion

    public set sceneReady(val:boolean){
        this._sceneReady = val;
    }

    public isBattle():boolean{
        return this._roundType == GameGridRoundType.Battle && this._sceneReady;
    }

    public getGridDataList(resType:number){
        let resArr = this._gridTypeList[resType];
        return resArr;
    }

    public getRandomType():number{
        let idx = MathUtils.getRandomInt(0,this._resTypeList.length - 1);
        let resType:number = this._resTypeList[idx];
        return resType;
    }

    //待创建的敌人数量
    public getLeftEnemy():number {
        let num = 0;
        for(let round in this._enemyCountList){
            num += this._enemyCountList[round];
        }
        return num;
    }

    private isPlayer(type:EntityType){
        return type == EntityType.Grid;
    }

    //#region Entity
    public delEntity(entityId:string){
        if(this._entitys[entityId]){
            let vo = this._entitys[entityId];
            delete this._entitys[entityId];
            let count = this._entityCount[vo.type];
            count --;
            this._entityCount[vo.type] = count;
            if(count <= 0 && this.isBattle()){
                if(vo.type == EntityType.Enemy){
                    if(this._nextRound <= this.round){
                        this._nextRound++;
                        CacheManager.gameGrid.switchRound();
                    }
                }
                else if(this.isPlayer(vo.type)){
                    //CacheManager.gameGrid.switchRound();
                }
            }
        }
    }

    public addEntity(type:EntityType,addNum:number = 1):EntityVo[]{
        let count = this._entityCount[type];
        if(!count) {
            count = 0;
        }
        if(type == EntityType.Enemy){
            if(count >= this._maxEnemyNum) return;
            // if(this._enemyCountList[this.round] <= 0) return;
            // this._enemyCountList[this.round] --;
        }
        count += addNum;
        this._entityCount[type] = count;

        let list = [];
        for(let i = 0; i < addNum; i++){
            let vo = GameGridCache.GenEntityVo(type);
            this._entitys[vo.entityId] = vo;
            list.push(vo);
        }
        EventManager.dispatch(EventEnum.OnEntityInit,list);
        return list;
    }
    //#endregion

    public clearAll(){
        this._entitys = {};
        this._entityCount = {};
        GameGridCache.EntityIds = {};
    }

    //#region findTarget
    //找到一个离自己最近的目标
    public findTarget(pos:Vec3,type:EntityType):EntityVo{
        let minDistance = 9999;
        let target:EntityVo;
        for(let entityId in this._entitys){
            let vo = this._entitys[entityId];
            if(vo.type != type && EntityUtil.isGrid(type) != EntityUtil.isGrid(vo.type)) continue;
            if(!vo.isDead() && vo.state != EntityState.none) {
                if(vo.type == EntityType.Enemy && vo.isSelected) return vo;//优先选中敌方
                let dis = math.Vec3.distance(pos,vo.worldPos);
                if(dis < minDistance){
                    minDistance = dis;
                    target = vo;
                }
            }
        }
        return target;
    }
    //#endregion

    //检测某一行是否已有英雄
    public checkGridHeroVoByRow(row:number):EntityVo{
        for(let entityId in this._entitys){
            let vo = this._entitys[entityId];
            if(vo.type != EntityType.GridHero) continue;
            if(vo.pos.z == row) return vo;
        }
        return null;
    }

    //检测某一列是否已有英雄
    public checkGridHeroVoByCol(col:number):EntityVo{
        for(let entityId in this._entitys){
            let vo = this._entitys[entityId];
            if(vo.type != EntityType.GridHero) continue;
            if(vo.pos.x == col) return vo;
        }
        return null;
    }

    //#region static 创建VO
    public static EntityIds:{[type:number]:number} = {};
    public static EntityId:number = 0;
    public static GenEntityVo(type:EntityType){
        let id = GameGridCache.EntityIds[type];
        if(!id) id = 1;
        else id ++;
        GameGridCache.EntityIds[type] = id;
        let vo:EntityVo;
        let data;
        switch(type){
            case EntityType.Grid:
                vo = new GridEntityVo();
                break
            case EntityType.Enemy:
                vo = new EnemyVo();
                let round = CacheManager.gameGrid.round;
                data = {maxHp:5 * round + 10}
                break;
            case EntityType.GridHero:
                vo = new GridHeroVo();
                break;
        }
        vo.initVo(data);
        return vo;
    }
    //#endregion
}