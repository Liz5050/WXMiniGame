import { GameLoadingView } from "../common/loading/GameLoadingView";
import { EventEnum } from "../enum/EventEnum";
import { CacheManager } from "../manager/CacheManager";
import { EventManager } from "../manager/EventManager";
import DefaultSDK from "./DefaultSDK";
import { BannerRewardId, SDK } from "./SDK";

//字节跳动
export default class TTSDK extends DefaultSDK {

    private _scendId: string = "";
    private _sideBarEnabled: boolean = false;//宿主程序是否支持侧边栏
    private RewardedVideoAd;//激励广告
    private BannerVideoState: boolean = false;//激励广告组件是否显示中
    private BannerRewardData: any = {};
    private BannerVideoAd;//banner广告
    private SystemInfo: any = {};

    public constructor() {
        super();
    }

    public init() {
        tt.onShow((res) => {
            this._scendId = res.scene;
            console.log("启动参数：", res.query);
            console.log("来源信息：", res.refererInfo);
            console.log("场景值：", res.scene);
            console.log("启动场景字段：", res.launch_from, ", ", res.location);
        });

        tt.checkScene({
            scene: "sidebar",
            success: (res) => {
                //成功回调逻辑
                if (res.isExist) {
                    this._sideBarEnabled = res.isExist;
                }
                console.log("check scene success: ", res.isExist);
            },
            fail: (res) => {
                console.log("check scene fail:" + res.errNo, res.errMsg);

            }
        });
    }

    public login() {
        try {
            const res = tt.getSystemInfoSync();
            let str = ""
            for (let key in res) {
                str += key + ":" + res[key] + "\n";
                this.SystemInfo[key] = res[key];
            }
            console.log(this.SystemInfo);
        } catch (e) {
            console.error(e);
        }
    }

    public navigateToScene() {
        tt.navigateToScene({
            scene: "sidebar",
            success: (res) => {
                // 跳转成功回调逻辑
                CacheManager.storage.setBoolean("SideBarReward",true);
                console.log("navigate to scene success");
            },
            fail: (res) => {
                // 跳转失败回调逻辑
                console.log("navigate to scene fail: ", res);
            }
        });
    }

    public share() {
    }

    public showToast(showTips = "", duration = 2000, icon: string = "none") {
        tt.showToast({
            title: showTips,
            icon: icon,
            duration: duration
        });
    }

    public showRewardBanner(rewardId: BannerRewardId, data?: any) {
        if (this.BannerVideoState) {
            return;
        }
        this.BannerRewardData.rewardId = rewardId;
        this.BannerRewardData.data = data;
        this.BannerVideoState = true;
        GameLoadingView.showLoading();
        let videoAd = this.RewardedVideoAd;
        if (!videoAd) {
            this.videoAdInit();
            return;
        }
        videoAd.show().then(() => {
            GameLoadingView.hideLoading();
        });
    }

    private videoAdInit() {
        if (!this.RewardedVideoAd) {
            this.RewardedVideoAd = tt.createRewardedVideoAd({
                adUnitId: '19h07bhh0ee6bercrp',
                multiton: false,
                success(res) {
                    console.log("videoSuccess", res)
                    // GameLoadingView.hideLoading();
                    // if(this.BannerVideoState){
                    //     this.BannerVideoState = false;//重播一次
                    //     this.showRewardBanner(this.BannerRewardData.rewardId,this.BannerRewardData.data);
                    // }
                },
                fail(res) {
                    console.log("videoFail", res);
                    // GameLoadingView.hideLoading();
                }
            });

            let videoAd = this.RewardedVideoAd;
            videoAd.onClose((res) => {
                this.BannerVideoState = false;
                if (res && (res.isEnded || res.count >= 1)) {
                    // 正常播放结束，可以下发游戏奖励
                    CacheManager.gameGrid.AddPropNum(this.BannerRewardData.rewardId);
                    EventManager.dispatch(EventEnum.OnBannerAdComplete, this.BannerRewardData.rewardId, this.BannerRewardData.data);
                }
                else {
                    // 播放中途退出，不下发游戏奖励
                    console.log("中途退出，无法获得道具奖励");
                }
            });

            videoAd.offClose((res) => {
                console.log("videoAd.offClose", res);
                // GameLoadingView.hideLoading();
            });
            videoAd.show().then(() => {
                console.log("video show");
                GameLoadingView.hideLoading();
            });
        }
    }

    public showBannerAd() {
        if (!SDK.CanShowBanner) {
            return;
        }
        if (this.BannerVideoAd) {
            this.BannerVideoAd.destroy();
            this.BannerVideoAd = null;
        }
        // let version = this.SystemInfo.SDKVersion;
        // if(version){
        //     let arr = version.split(".")
        //     let list = [1000,100,10];
        //     let versionNum = 0;
        //     for(let i = 0; i < arr.length; i++){
        //         versionNum += Number(arr[i]) * list[i];
        //     }
        //     if(versionNum < 2040){
        //         console.error("SDKVersion 不能低于2.0.4",versionNum);
        //         return;
        //     }
        // }
        let width = Math.max(this.SystemInfo.screenWidth - 50, 300);
        let left = (this.SystemInfo.screenWidth - width) / 2;
        let bannerAd = tt.createBannerAd({
            adUnitId: '8gdmmsn4ii13k31ro2',
            style: {
                top: this.SystemInfo.screenHeight - 125,
                left: left,
                width: width,
                height: 100,
            },
            adIntervals: 30
        });
        this.BannerVideoAd = bannerAd;
        bannerAd.onError(err => {
            console.log("banner 广告加载失败" + err);
            this.BannerVideoAd = null;
        });
        this.BannerVideoAd.show();
    }

    public hideBannerAd() {
        if (this.BannerVideoAd) {
            this.BannerVideoAd.destroy();
            this.BannerVideoAd = null;
        }
    }

    public canShowSideBarReward(): boolean {
        return this._sideBarEnabled && this._scendId == "021036";
    }

    public cloudPOST(url: string, reqData?: any, callBack?: Function) {
        // wx.cloud.callContainer({
        //     config: {
        //       "env": "prod-2gue9n1kd74122cb"
        //     },
        //     path: url,
        //     header: {
        //       "X-WX-SERVICE": "express-589u"
        //     },
        //     data:reqData,
        //     method: "POST",
        //     timeout:15000,
        //     complete:function(res){
        //         console.log("POST callContainer url:" + url,res);
        //         if(callBack){
        //             callBack(res.data);
        //         }
        //     }
        // })
    }

    public cloudGET(url: string, reqData?: Array<any>, callBack?: Function) {
        // let reqUrl = url;
        // if(reqData && reqData.length > 0){
        //     for(let i = 0; i < reqData.length; i++){
        //         reqUrl += "/" + reqData[i];
        //     }
        // }
        // wx.cloud.callContainer({
        //     config: {
        //       "env": "prod-2gue9n1kd74122cb"
        //     },
        //     path: reqUrl,
        //     header: {
        //       "X-WX-SERVICE": "express-589u"
        //     },
        //     method: "GET",
        //     timeout:15000,
        //     complete:function(res){
        //         console.log("GET callContainer url:" + reqUrl,res);
        //         if(callBack){
        //             callBack(res.data);
        //         }
        //     }
        // })
    }

    public postMessage(obj: object) {

    }
}