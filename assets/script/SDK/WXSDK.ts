import { sys } from "cc";
import { GameType } from "../enum/GameType";
import { EventManager } from "../manager/EventManager";
import { EventEnum } from "../enum/EventEnum";

export default class WXSDK {
    public static CloudId:string = "cloud1-0gg6h5ch5e3c80fc";
    public static ShareTicket:string = "";
    private static _UserInfo:any;
    private static DBInstance;
    public static get DB(){
        if(!WXSDK.DBInstance){
            WXSDK.DBInstance = wx.cloud.database();
        }
        return WXSDK.DBInstance;
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
                console.log("share success:",res)
                // WXSDK.ShareTicket = res;
            },
            complete:function(res){
                console.log("share complete:",res)
            }
        })
    }

    public static CloudInit(){
        if(!sys.isMobile){
            return;
        }
        wx.cloud.init({
            env:"cloud1-0gg6h5ch5e3c80fc"
        });
    }

    public static UploadUserGameData(data){
        if(!sys.isMobile){
            return;
        }
		WXSDK.WXCloudPost(data);
    }

    public static WXCloudPost(gameData){
		if(!WXSDK.UserInfo || !gameData || gameData.score <= 0){
			return;
		}
		let userInfo = WXSDK.UserInfo; 
		// if(!userInfo){
		// 	userInfo = {nickName:"未授权",avatarUrl:"",is_auth:0};
		// }
        wx.cloud.callContainer({
            config: {
              "env": "prod-2gue9n1kd74122cb"
            },
            path: "/api/user_game_data",
            header: {
              "X-WX-SERVICE": "express-589u"
            },
            data:{
                game_data:gameData,
                user_info:userInfo
            },
            method: "POST",
            timeout:15000,
            complete:function(res){
                console.log("POST callContainer user_game_data",res);
            }
        })
    }

    public static WXCloudGet(game_type:GameType){
        wx.cloud.callContainer({
            config: {
              "env": "prod-2gue9n1kd74122cb"
            },
            path: "/api/user_game_data",
            header: {
              "X-WX-SERVICE": "express-589u"
            },
            data:{
                game_type:game_type
            },
            method: "GET",
            timeout:15000,
            complete:function(res){
                console.log("GET callContainer user_game_data",res);
            }
        })
    }

    public static PlatformCheck(){
        return sys.isMobile;
    }
}