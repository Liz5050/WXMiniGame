import { EventManager } from "../manager/EventManager";
import { EventEnum } from "../enum/EventEnum";
import { CacheManager } from "../manager/CacheManager";
import { BannerRewardId, SDK } from "./SDK";
import { CloudApi } from "../enum/CloudDefine";

//开发者工具版本号1.06.2307260stable

export default class WXSDK {
    private RewardedVideoAd;//激励广告
    private BannerVideoState:boolean = false;//激励广告组件是否显示中
    private BannerRewardData:any = {};
    private BannerVideoAd;//banner广告
    private SystemInfo:any = {};

    public constructor(){
    }

    public init(){
        this.cloudInit();
        this.showShareMenu();
    }

    private cloudInit(){
        wx.cloud.init({
            env:"cloud1-0gg6h5ch5e3c80fc"
        });
    }

    public login(){
        this.cloudGET(CloudApi.wx_openid,null,function(openid){
            SDK.openid = openid;
        });
        this.initAppShowOrHideEvent();
        try {
            const res = wx.getSystemInfoSync();
            let str = ""
            for(let key in res){
                str += key + ":" + res[key] + "\n";
                this.SystemInfo[key] = res[key];
            }
        } catch (e) {
            console.error(e);
        }
        let self = this;
        wx.getSetting({
            success (res){
                if (res.authSetting['scope.userInfo']) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                    wx.getUserInfo({
                        success: function(res) {
                            console.log("已授权用户信息",res)
                            CacheManager.player.userInfo = res.userInfo;
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
                            self.showToast("登录成功");
                            CacheManager.player.userInfo = res.userInfo;
						  	button.destroy();
					  	}
					  	else{
							self.showToast("取消登录");
					  	}
                  })
                }
            }
        })
    }

    public share(){
        wx.shareAppMessage({title: '赚积分，领皮肤'});
    }

    public postMessage(obj: object){
        wx.postMessage(obj);
    }
    
    public showToast(showTips = "",duration = 2000,icon:string = "none"){
        wx.showToast({
            title: showTips,
            icon: icon,
            duration: duration
        });
    }

    //注册前后台事件
    private initAppShowOrHideEvent(){
        wx.onHide(function(){
            // console.log("进入后台");
        });
        wx.onShow(()=>{
            // console.log("回到前台");
            if(CacheManager.shop.showRewardTips){
                CacheManager.shop.showRewardTips = false;
                this.showToast("分享成功，积分+100",3000);
            }
        });
    }

    //显示分享按钮
    private showShareMenu(){
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline'],
        })

        wx.onShareAppMessage(function () {
            // 用户点击了“转发”按钮
            return {
                title: '舒尔特方格挑战'
            }
        })
    }

    private videoAdInit(){
        if(!this.RewardedVideoAd){
            this.RewardedVideoAd = wx.createRewardedVideoAd({
                // adUnitId: 'adunit-920d6a49941c8cb3'//6-15秒
                adUnitId: 'adunit-c838f7d60ef39635'//6-30秒
            })
            let videoAd = this.RewardedVideoAd;
            videoAd.onLoad(() => {
                console.log('激励视频 广告加载成功');
                if(this.BannerVideoState){
                    this.BannerVideoState = false;//重播一次
                    this.showRewardBanner(this.BannerRewardData.rewardId,this.BannerRewardData.data);
                }
            })
            videoAd.onError(err => {
                console.log("onError",err);
            })
    
            videoAd.onClose(res => {
                // 用户点击了【关闭广告】按钮
                // 小于 2.1.0 的基础库版本，res 是一个 undefined
                this.BannerVideoState = false;
                if (res && res.isEnded || res === undefined) {
                  // 正常播放结束，可以下发游戏奖励
                  CacheManager.gameGrid.AddPropNum(this.BannerRewardData.rewardId);
                  EventManager.dispatch(EventEnum.OnBannerAdComplete,this.BannerRewardData.rewardId,this.BannerRewardData.data);
                }
                else {
                    // 播放中途退出，不下发游戏奖励
                    console.log("中途退出，无法获得道具奖励");
                }
            })
        }
    }

    public showRewardBanner(rewardId:BannerRewardId,data?:any){
        if(this.BannerVideoState){
            return;
        }
        this.BannerRewardData.rewardId = rewardId;
        this.BannerRewardData.data = data;
        this.BannerVideoState = true;

        let videoAd = this.RewardedVideoAd;
        if(!videoAd){
            this.videoAdInit();
            return;
        }
        videoAd.show().catch(() => {
            // 失败重试
            videoAd.load().then(() => videoAd.show()).catch(err => {
                console.log('激励视频 广告显示失败');
                this.BannerVideoState = false;
                this.showToast("暂无广告");
            })
        })
    }

    public showBannerAd(){
        if(!SDK.CanShowBanner){
            return;
        }
        
        if(!this.BannerVideoAd){
            let version = this.SystemInfo.SDKVersion;
            if(version){
                let arr = version.split(".")
                let list = [1000,100,10];
                let versionNum = 0;
                for(let i = 0; i < arr.length; i++){
                    versionNum += Number(arr[i]) * list[i];
                }
                if(versionNum < 2040){
                    console.error("SDKVersion 不能低于2.0.4",versionNum);
                    return;
                }
            }
            let width = Math.max(this.SystemInfo.screenWidth - 50,300);
            let left = (this.SystemInfo.screenWidth - width) / 2;
            let bannerAd = wx.createBannerAd({
                adUnitId: 'adunit-a49e81e575b7ba93',
                style: {
                    top:this.SystemInfo.screenHeight - 125,
                    left:left,
                    width: width,
                    height: 100,
                    adIntervals:31,
                }
            });
            this.BannerVideoAd = bannerAd;
            bannerAd.onError(err => {
                console.log("banner 广告加载失败" + err);
                this.BannerVideoAd = null;
            })
        }
        if(this.BannerVideoAd){
            this.BannerVideoAd.show();
        }
    }

    public hideBannerAd(){
        if(this.BannerVideoAd){
            this.BannerVideoAd.hide();
        }
    }

    public cloudPOST(url:string,reqData?:any,callBack?:Function){
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

    public cloudGET(url:string,reqData?:Array<any>,callBack?:Function){
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
}