import { BannerRewardId } from "./SDK";

//字节跳动
export default class DefaultSDK {

    public constructor(){
    }

    public init(){
    }

    public login(){
    }

    public share(){
    }

    public showToast(showTips = "",duration = 2000,icon:string = "none"){
    }

    public showRewardBanner(rewardId:BannerRewardId,data?:any){
    }

    public showBannerAd(){
    }

    public hideBannerAd(){
    }

    public cloudPOST(url:string,reqData?:any,callBack?:Function){
    }

    public cloudGET(url:string,reqData?:Array<any>,callBack?:Function){
    }

    public navigateToScene(){
    }

    public postMessage(obj: object){
    }

    //抖音平台必接侧边栏
    public canShowSideBarReward(){
    }
}