import { sys } from "cc";
import WXSDK from "./WXSDK";
import { EventManager } from "../manager/EventManager";
import { EventEnum } from "../enum/EventEnum";
import { CloudApi } from "../enum/CloudDefine";
import TTSDK from "./TTSDK";
import { CacheManager } from "../manager/CacheManager";

export enum BannerRewardId{
    GameGridResetNum = 1,
    GameGridSkin = 2,
    GameGridBoomNum = 3,
}

export class SDK {
    private static _openid:string;
    private static _platOpenid:string;//带平台标识的openid
    private static _curSDK:WXSDK | TTSDK;
    private static _CanShowBanner:boolean = true;
    public static Init(){
        console.log("SDK Init platform：" + sys.platform);
        if(sys.platform == sys.Platform.WECHAT_GAME || sys.platform == sys.Platform.WECHAT_MINI_PROGRAM) {
            //微信平台
            SDK._curSDK = new WXSDK();
        }
        else if(sys.platform == sys.Platform.BYTEDANCE_MINI_GAME){
            //字节跳动(抖音)
            SDK._curSDK = new TTSDK();
        }
        if(SDK._curSDK){
            SDK._curSDK.init();
        }
        SDK.login();
    }

    //是否登录了，只要能获取到openid就算登录
    public static isLogin():boolean{
        if(SDK._openid && SDK._openid != undefined && SDK._openid != ""){
            return true;
        }
        return false;
    }

    public static login(){
        if(!SDK.isMobile()){
            return;
        }
        SDK._curSDK.login();
    }

    //带平台标识的openid
    public static get platOpenid():string{
        return SDK._platOpenid;
    } 

    public static get openid():string{
        return SDK._openid;
    }

    public static set openid(id:string){
        SDK._openid = id;
        SDK._platOpenid = sys.platform + "_" + id;
        CacheManager.player.sendGetPlayerInfo();
    }

    public static isMobile():boolean{
        if(sys.platform == sys.Platform.EDITOR_PAGE) return false;
        return true;//sys.isMobile;
    }

    //主动分享
    public static Share(){
        if(!SDK.isLogin()){
            return;
        }
        SDK._curSDK.share();
    }

    //HTTP POST请求
    public static CloudPOST(url:string,reqData?:any,callBack?:Function){
        if(!SDK.isMobile()){
            return;
        }
        SDK._curSDK.cloudPOST(url,reqData,callBack);
    }
    //HTTP GET请求
    public static CloudGET(url:string,reqData?:Array<any>,callBack?:Function){
        if(!SDK.isMobile()){
            return;
        }
        SDK._curSDK.cloudGET(url,reqData,callBack);
    }

    public static showToast(showTips = "",duration = 2000,icon:string = "none"){
        if(!SDK.isLogin()){
            console.log(showTips);
            return;
        }
        SDK._curSDK.showToast(showTips,duration,icon);
    }

    //显示激励广告
    public static ShowRewardBanner(rewardId:BannerRewardId,data?:any){
        if(!SDK.isMobile()){
            return;
        }
        SDK._curSDK.showRewardBanner(rewardId,data);
    }

    public static set CanShowBanner(val:boolean){
        SDK._CanShowBanner = val;
        if(val){
            SDK.showToast("谢谢支持~");
        }
        else {
        }
    }
    public static get CanShowBanner(){
        return SDK._CanShowBanner;
    }

    //显示banner广告
    public static ShowBannerAd(){
        if(!SDK.isMobile()){
            return;
        }
        SDK._curSDK.showBannerAd();
    }

    public static HideBannerAd(){
        SDK._curSDK.hideBannerAd();
    }

    //显示排行榜(开放数据域)
    public static showRank(rankKey:string){
        SDK.postMessage({type:"ShowRank",width:1080,height:1800,x:540,y:1080,rankKey:rankKey});
    }

    public static postMessage(obj: object){
        if(!SDK.isMobile()){
            return;
        }
        SDK._curSDK.postMessage(obj);
    }
}