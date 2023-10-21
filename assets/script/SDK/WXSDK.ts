import { Game, sys } from "cc";
import { GameType } from "../enum/GameType";
import { EventManager } from "../manager/EventManager";
import { EventEnum } from "../enum/EventEnum";
import { CloudApi } from "../enum/CloudDefine";

//开发者工具版本号1.06.2307260stable
export default class WXSDK {
    public static CloudId:string = "cloud1-0gg6h5ch5e3c80fc";
    public static ShareTicket:string = "";
    private static _UserInfo:any;
    private static _openid:string;
    private static DBInstance;
    private static RewardedVideoAd;
    private static BannerVideoState:boolean = false;//广告组件是否显示中
    private static _CanShowBanner:boolean = true;
    public static set CanShowBanner(val:boolean){
        WXSDK._CanShowBanner = val;
        if(val){
            WXSDK.showToast("谢谢支持~");
        }
        else {
        }
    }
    public static get CanShowBanner(){
        return WXSDK._CanShowBanner;
    }

    private static BannerVideoAd;
    public static get DB(){
        if(!WXSDK.DBInstance){
            WXSDK.DBInstance = wx.cloud.database();
        }
        return WXSDK.DBInstance;
    }

    public static Init(){
        WXSDK.CloudInit();
    }

    public static CloudInit(){
        if(!sys.isMobile){
            return;
        }
        wx.cloud.init({
            env:"cloud1-0gg6h5ch5e3c80fc"
        });
    }

    public static get openid():string{
        return WXSDK._openid;
    }

	public static get UserInfo(){
		return WXSDK._UserInfo;
	}

	public static set UserInfo(info){
		WXSDK._UserInfo = info;
		EventManager.dispatch(EventEnum.OnUserInfoUpdate);
	}

    public static login(){
        if(!sys.isMobile){
            return;
        }
        WXSDK.WXCloudGET(CloudApi.wx_openid,null,function(openid){
            WXSDK._openid = openid;
        });
        wx.getSetting({
            success (res){
                if (res.authSetting['scope.userInfo']) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                    wx.getUserInfo({
                        success: function(res) {
                            console.log("已授权用户信息",res)
                            WXSDK.UserInfo = res.userInfo;
                        }
                    })
                }
                else{
                  // 否则，先通过 wx.createUserInfoButton 接口发起授权
                  let button = wx.createUserInfoButton({
						type: 'text',
						text: '登录',
						style: {
							left: 25,
							top: 25,
							width: 50,
							height: 50,
							lineHeight: 50,
							backgroundColor: '#ffffff',
							color: '#000000',
							textAlign: 'center',
							fontSize: 18,
							borderRadius: 4
						}
                  })
                  button.onTap((res) => {
                      // 用户同意授权后回调，通过回调可获取用户头像昵称信息
                      	console.log("已主动授权用户信息",res)
					  	if(res.userInfo){
						  	WXSDK.showToast("登录成功");
						  	WXSDK.UserInfo = res.userInfo;
						  	button.destroy();
					  	}
					  	else{
							WXSDK.showToast("取消登录");
					  	}
                  })
                }
            }
        })
    }
    
    public static showRank(rankKey:string){
        WXSDK.postMessage({type:"ShowRank",width:1080,height:1800,x:540,y:1080,rankKey:rankKey});
    }

    public static postMessage(obj: object){
        if(!sys.isMobile){
            return;
        }
        wx.postMessage(obj);
    }
    
    public static setUserCloudStorage(obj: object){
        if(!sys.isMobile){
            return;
        }
        wx.setUserCloudStorage(obj)
    }

    public static showToast(showTips = "",duration = 2000,icon:string = "none"){
        if(!sys.isMobile){
            console.log(showTips);
            return;
        }
        wx.showToast({
            title: showTips,
            icon: icon,
            duration: duration
        });
    }

    public static showShareMenu(){
        if(!sys.isMobile){
            return;
        }
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline'],
            success:function(res){
                console.log("show share success:",res)
                // WXSDK.ShareTicket = res;
            },
            complete:function(res){
                console.log("show share complete:",res)
            }
        })

        wx.onShareAppMessage(function () {
            // 用户点击了“转发”按钮
            return {
                title: '舒尔特方格挑战'
            }
        })
    }

    //上传自己的游戏数据
    public static UploadUserGameData(data){
        if(!WXSDK.UserInfo || !data || data.score <= 0){
			return;
		}
        let userInfo = WXSDK.UserInfo; 
        let postData = {
            game_data:data,
            user_info:userInfo
        }
		WXSDK.WXCloudPOST(CloudApi.user_game_data,postData);
    }

    public static WXCloudPOST(url:string,reqData?:any,callBack?:Function){
        if(!sys.isMobile){
            return;
        }
        wx.cloud.callContainer({
            config: {
              "env": "prod-2gue9n1kd74122cb"
            },
            path: url,
            header: {
              "X-WX-SERVICE": "express-589u"
            },
            data:reqData,
            method: "POST",
            timeout:15000,
            complete:function(res){
                console.log("POST callContainer url:" + url,res);
                if(callBack){
                    callBack(res.data);
                }
            }
        })
    }

    //自己的数据
    public static GetUserGameData(gametype:GameType,callBack?:Function){
        WXSDK.WXCloudGET(CloudApi.user_game_data,[gametype],callBack);
    }

    //所有玩家数据
    public static GetAllUserGameData(gametype:GameType,subtype:number = 0,callBack?:Function){
        WXSDK.WXCloudGET(CloudApi.all_user_game_data,[gametype,subtype],callBack);
    }

    public static WXCloudGET(url:string,reqData?:Array<any>,callBack?:Function){
        if(!sys.isMobile){
            return;
        }
        let reqUrl = url;
        if(reqData && reqData.length > 0){
            for(let i = 0; i < reqData.length; i++){
                reqUrl += "/" + reqData[i];
            }
        }
        wx.cloud.callContainer({
            config: {
              "env": "prod-2gue9n1kd74122cb"
            },
            path: reqUrl,
            header: {
              "X-WX-SERVICE": "express-589u"
            },
            method: "GET",
            timeout:15000,
            complete:function(res){
                console.log("GET callContainer url:" + reqUrl,res);
                if(callBack){
                    callBack(res.data);
                }
            }
        })
    }

    public static isMobile():boolean{
        return sys.isMobile;
    }

    public static VideoAdInit(){
        if(!WXSDK.isMobile()){
            return;
        }
        if(!WXSDK.RewardedVideoAd){
            WXSDK.RewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: 'adunit-920d6a49941c8cb3'
            })
            let videoAd = WXSDK.RewardedVideoAd;
            videoAd.onLoad(() => {
                console.log('激励视频 广告加载成功');
            })
            videoAd.onError(err => {
                console.log("onError",err);
            })
    
            videoAd.onClose(res => {
                // 用户点击了【关闭广告】按钮
                // 小于 2.1.0 的基础库版本，res 是一个 undefined
                WXSDK.BannerVideoState = false;
                if (res && res.isEnded || res === undefined) {
                  // 正常播放结束，可以下发游戏奖励
                  EventManager.dispatch(EventEnum.OnBannerAdComplete);
                }
                else {
                    // 播放中途退出，不下发游戏奖励
                    console.log("中途退出，无法获得道具奖励");
                }
            })
        }
    }

    public static ShowRewardBanner(){
        if(!WXSDK.isMobile()){
            return;
        }
        if(WXSDK.BannerVideoState){
            return;
        }
        let videoAd = WXSDK.RewardedVideoAd;
        WXSDK.BannerVideoState = true;
        videoAd.show().catch(() => {
            // 失败重试
            videoAd.load().then(() => videoAd.show()).catch(err => {
                console.log('激励视频 广告显示失败');
                WXSDK.BannerVideoState = false;
                WXSDK.showToast("暂无广告");
            })
        })
    }

    public static ShowBannerAd(){
        if(!WXSDK.CanShowBanner){
            return;
        }
        if(!WXSDK.BannerVideoAd){
            let bannerAd = wx.createBannerAd({
                adUnitId: 'adunit-a49e81e575b7ba93',
                style: {
                    top:625,
                    left:55,
                    width: 300,
                    adIntervals:30,
                }
            });
            WXSDK.BannerVideoAd = bannerAd;
            bannerAd.onError(err => {
                console.log("banner 广告加载失败" + err);
                WXSDK.BannerVideoAd = null;
            })
        }
        if(WXSDK.BannerVideoAd){
            WXSDK.BannerVideoAd.show();
        }
    }

    public static HideBannerAd(){
        if(WXSDK.BannerVideoAd){
            WXSDK.BannerVideoAd.hide();
        }
    }
}