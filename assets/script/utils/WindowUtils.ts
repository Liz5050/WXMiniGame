export class WindowUtils {

    private static navigator:any;
    public static shake(time:number){
        let navigator = WindowUtils.navigator;
        if(!navigator){
            navigator = window["navigator"];
            navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
            WindowUtils.navigator = navigator;
        }
        if(navigator && navigator.vibrate) {
            console.log("支持设备震动！");
            navigator.vibrate(time);
        }
        else{
            wx.vibrateShort({type:"light"});
        }
    }
}