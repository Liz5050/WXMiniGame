import { SDK } from "../SDK/SDK";
import { AlertView } from "../common/alert/AlertView";
import { CloudApi } from "../enum/CloudDefine";
import { EventEnum } from "../enum/EventEnum";
import { GameType } from "../enum/GameType";
import { EventManager } from "../manager/EventManager";

export class PlayerCache {
    public playerInfo:any;//游戏内玩家数据
    private _userInfo:any;//玩家账号数据
    public constructor(){
    }

    public get userInfo(){
        return this._userInfo;
    }

    public set userInfo(info){
        this._userInfo = info;
        EventManager.dispatch(EventEnum.OnUserInfoUpdate);
    }

    public getMoney():number{
        if(!this.playerInfo){
            return 0;
        }
        return this.playerInfo.score;
    }

    public checkMoneyEnough(needMoney:number){
        let money = 0;
        if(this.playerInfo){
            money = this.playerInfo.score;
        }
        return money >= needMoney;
    }

    //仅在服务器返回成功后，客户端自己更新积分
    public addScoreMoney(score:number){
        if(!this.playerInfo){
            return;
        }
        let myScore = this.getMoney();
        myScore += score;
        this.playerInfo.score = myScore;
        EventManager.dispatch(EventEnum.OnPlayerMoneyUpdate);
    }

    //-----------------后端HTTP通信----------------
    //请求玩家游戏内基础数据
    public sendGetPlayerInfo(){
        if(!this.playerInfo){
            SDK.CloudGET(CloudApi.user_data,null,(data) => {
                let info = data.data;
                if(!this.playerInfo){
                    this.playerInfo = {
                        openid:"",
                        nick_name:"",
                        avatar_url:"",
                        score:0,
                        skin_id:0,
                        skin_list:{}
                    };
                }
                if(data.code == 0){
                    this.playerInfo.openid = info.openid;
                    this.playerInfo.nick_name = info.nick_name;
                    this.playerInfo.avatar_url = info.avatar_url;
                    this.playerInfo.score = info.score;
                    this.playerInfo.skin_id = info.skin_id;
                    if(info.skin_list){
                        let list = info.skin_list.split(",");
                        for(let i = 0; i < list.length; i ++){
                            let skinId = Number(list[i]);
                            this.playerInfo.skin_list[skinId] = skinId;
                        }
                    }
                }
                EventManager.dispatch(EventEnum.OnPlayerInfoUpdate);
            });
        }
    }

    //上传自己的游戏数据
    public uploadUserGameData(data){
        if(!SDK.isLogin() || !data || data.score <= 0){
			return;
		}
        let userInfo = this.userInfo; 
        let postData = {
            game_data:data,
            user_info:userInfo
        }
		SDK.CloudPOST(CloudApi.user_game_data,postData,(resData)=>{
            //上传成功
            if(resData.code == 0){
                if(data.game_type == GameType.Grid){
                    this.addScoreMoney(data.score);
                }
            }
            else {
                AlertView.show("系统检测到数据异常，如有疑问请联系我们VX:lizhi5050")
            }
        });
    }

    public sendAddScore(score:number){
        SDK.CloudPOST(CloudApi.add_score_coin,{score:score},(data) => {
            this.playerInfo.score = data.data.score;
            EventManager.dispatch(EventEnum.OnPlayerMoneyUpdate);
        });
    }
}