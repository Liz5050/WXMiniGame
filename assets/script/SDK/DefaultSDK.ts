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

    public cloudGET(url:string,reqData?:Array<any>,callBack?:Function){
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

    public postMessage(obj: object){
    }
}