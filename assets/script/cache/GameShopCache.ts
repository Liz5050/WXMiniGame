import { SDK } from "../SDK/SDK";
import { CloudApi } from "../enum/CloudDefine";
import { EventEnum } from "../enum/EventEnum";
import { CacheManager } from "../manager/CacheManager";
import { ConfigManager } from "../manager/ConfigManager";
import { EventManager } from "../manager/EventManager";
import MathUtils from "../utils/MathUtils";

class GameShopConfig {
    public skin_id:number;
    public resName:string;
    public price:number;
    public type:number;
}
export class GameShopCache {

    private _shopCfg:any;
    private _shopCfgArr:any[];
    private _shareReward:boolean = false;//每日分享奖励领取状态
    public showRewardTips:boolean = false;//回到前台时，是否需要展示分享奖励领取成功提示
    private _itemResName:string[] = [
        "bear",//熊
        "buffalo",//水牛
        "chick",//小鸡
        "chicken",//老鸡
        "cow",//奶牛
        "crocodile",//鳄鱼
        "dog",//狗
        "duck",//鸭子
        "elephant",//大象
        "frog",//青蛙
        "giraffe",//长颈鹿
        "goat",//山羊
        "gorilla",//大猩猩
        "hippo",//河马
        "horse",//马
        "monkey",//猴子
        "moose",//麋，驼鹿
        "narwhal",//独角鲸
        "owl",//猫头鹰
        "panda",//熊猫
        "parrot",//鹦鹉
        "penguin",//企鹅
        "pig",//猪
        "rabbit",//兔子
        "rhino",//犀牛
        "sloth",//树懒
        "snake",//蛇
        "walrus",//海象
        "whale",//鲸
        "zebra"];//斑马
    public getShopConfig(){
        if(!this._shopCfg){
            this._shopCfg = {};
            this._shopCfgArr = [];
            let dict = ConfigManager.gridShop.getDict();
            for(let key in dict){
                let cfg = dict[key];
                cfg.resName = this._itemResName[cfg.skin_id-1];
                this._shopCfg[key] = cfg;
                this._shopCfgArr[cfg.skin_id-1] = cfg;
            }
        }
        return this._shopCfgArr;
    }
    
    public getShopConfigById(skin_id:number){
        this.getShopConfig();
        return this._shopCfg[skin_id];
    }

    public isUsed(skin_id:number):boolean{
        let playerInfo = CacheManager.player.playerInfo;
        if(!playerInfo){
            return false;
        }
        return playerInfo.skin_id == skin_id;
    }

    public haveBoughtSkin(skin_id:number):boolean{
        let playerInfo = CacheManager.player.playerInfo;
        if(!playerInfo){
            return false;
        }
        let skinList = playerInfo.skin_list;
        return skinList && skinList[skin_id] && skinList[skin_id] > 0;
    }

    public shareRewardHadGet():boolean{
        return this._shareReward;
    }

    public getRandomRes():string{
        let len = this._itemResName.length;
        let idx = MathUtils.getRandomInt(0,len-1);
        return this._itemResName[idx];
    }

    //-----------------后端通信----------------
    public sendBuy(skinId:number){
        SDK.CloudPOST(CloudApi.buy_skin,{skin_id:skinId},function(data){
            console.log("购买结果更新！！",data.data);
            let resData = data.data;
            let playerInfo = CacheManager.player.playerInfo;
            if(playerInfo){    
                playerInfo.skin_list[resData.skin_id] = resData.skin_id;
                playerInfo.score = resData.score;
            }
            EventManager.dispatch(EventEnum.OnPlayerInfoUpdate);
        });
    }

    public sendUse(skinId:number){
        SDK.CloudPOST(CloudApi.use_grid_skin,{skin_id:skinId},function(data){
            let resData = data.data;
            if(resData.skin_id != undefined){
                if(resData.skin_id > 0){
                    SDK.showToast("使用成功");
                }else{
                    SDK.showToast("已卸下");
                }
                if(CacheManager.player.playerInfo){
                    CacheManager.player.playerInfo.skin_id = resData.skin_id;
                    CacheManager.gameGrid.UpdateSkin(null);
                }
            }
            EventManager.dispatch(EventEnum.OnGridSkinUpdate);
        });
    }

    public checkShare(){
        if(!SDK.isLogin()){
            return;
        }
        SDK.CloudGET(CloudApi.share_score_reward,null,(resData)=>{
            let data = resData.data;
            if(resData.code == 0){
                this._shareReward = data.had_get == 1;
                EventManager.dispatch(EventEnum.OnShareRewardUpdate);
            }
        })
    }

    public sendShare(){
        SDK.Share();
        SDK.CloudPOST(CloudApi.share_score_reward,null,(resData)=>{
            if(resData.code == 0){
                //分享成功，下发分享奖励
                this._shareReward = true;
                this.showRewardTips = true;
                setTimeout(() => {
                    CacheManager.player.addScoreMoney(resData.data.score);
                    EventManager.dispatch(EventEnum.OnShareRewardUpdate);
                }, 1000);
            }
            else {
                //分享失败
                console.log("share error",resData);
            }
        });
    }
}