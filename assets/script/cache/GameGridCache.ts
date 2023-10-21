import WXSDK from "../SDK/WXSDK";
import { EventEnum } from "../enum/EventEnum";
import { GameType } from "../enum/GameType";
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
    public ReqRankDataList(type:number,subtype:number = 0){
        let typeKey = type + "_" + subtype;
        let list:GameGridRankData[] = this._rankDataListDict[typeKey];
        if(!list){
            list = [];
            this._rankDataListDict[typeKey] = list;
            WXSDK.GetAllUserGameData(type,subtype,(res) => {
                console.log("排行榜数据请求成功",res);
                if(!res){
                    return;
                }
                let dataList = res.data;
                // if(type == GameType.Shulte){
                //     //时间排序，从小到大
                //     dataList.sort(function(data1:any,data2:any){
                //         return data1.score - data2.score;
                //     });
                // }
                // else{
                //     //积分排序，从大到小
                //     dataList.sort(function(data1:any,data2:any){
                //         return data2.score - data1.score;
                //     });
                // }
    
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
                    if(data.openid==WXSDK.openid){
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

    public GetWorldRankDataList(type:GameType,subtype:number = 0):GameGridRankData[]{
        let typeKey = type + "_" + subtype;
        let list = this._rankDataListDict[typeKey];
        return list;
    }

    public GetMyRankData(type:GameType,subtype:number){
        if(!WXSDK.openid){
            return null;
        }
        let openidKey = WXSDK.openid + type + "_" + subtype;
        return this._myRankData[openidKey];
    }
}