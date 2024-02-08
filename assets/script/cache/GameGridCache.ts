import { BannerRewardId, SDK } from "../SDK/SDK";
import { AlertType, AlertView } from "../common/alert/AlertView";
import { CloudApi } from "../enum/CloudDefine";
import { EventEnum } from "../enum/EventEnum";
import { GameType } from "../enum/GameType";
import { CacheManager } from "../manager/CacheManager";
import { EventManager } from "../manager/EventManager";

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
export class GameGridCache {
    private _rankDataListDict:{[typeKey:string]:GameGridRankData[]} = {};
    private _rankDataDict:{[openid:string]:GameGridRankData} = {};
    private _myRankData:{[openid:string]:GameGridRankData} = {};

    private _curSkinCfg:any;
    private _saveData:any;
    public clickHide:boolean = true;//点击选中后是否消失
    private _hadGetVideoReward:{[rewardId:number]:boolean};//是否获取过广告奖励（每局游戏仅可获得1次广告奖励）
    private _propNum:{[rewardId:number]:number};
    public constructor(){

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
                SDK.showToast("道具数量不足!");
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
            SDK.showToast("保存成功");
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
}