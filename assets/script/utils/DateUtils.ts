import { StringUtils } from "./StringUtils";

/**
 * Date工具类
 */
export class DateUtils {
    public static FORMAT_1:string = "{3}天{2}时{1}分{0}秒";
    public static FORMAT_2:string = "{3}天{2}小时{1}分钟{0}秒";
    public static FORMAT_3:string = "{3}天";
    public static FORMAT_4:string = "{2}时{1}分{0}秒";
    public static FORMAT_5:string = "{1}分{0}秒";
    public static FORMAT_6:string = "{1}:{0}";
    /**
	 * 将秒数转化为指定格式的字符串
     * @param isSpecial 是否特殊处理
     * @param noDay     将天数转化为小时数
	 */	
	public static getTimeStrBySeconds(seconds:number, format:string = "{2}:{1}:{0}", isSpecial:boolean = true, noDay:boolean = false):string {
        if(seconds < 0) {
            return "0";
        }
		let day:number = Math.floor(seconds / 3600 / 24);
		let hour:number = noDay ? Math.floor(seconds / 3600) : Math.floor(seconds / 3600) % 24;
		let minute:number = Math.floor(seconds / 60) % 60;
		let second:number = Math.round(seconds % 60);

		// if(!showDay) {
		// 	hour += day * 24;
		// 	day = 0;
		// }
		let hourStr:string = hour > 9 ? String(hour) : "0" + hour;
		let minuteStr:string = minute > 9 ? String(minute) : "0" + minute;
		let secondStr:string = second > 9 ? String(second) : "0" + second;

        if(isSpecial) {
            let index:number = -1;
            if(seconds >= 86400 && format.indexOf("{3}") != -1) {
                //大于一天不显示秒
                index = format.indexOf("{0}");
                if(index != -1) {
                    format = format.substring(0, index);
                }
            }
            else {                               
                if(seconds < 60) {
                    //小于一分钟
                    index = format.indexOf("{0}");
                }else if(seconds < 3600) {
                    //小于一小时
                    index = format.indexOf("{1}");
                }else if(seconds < 86400) {
                    //小于一天
                    index = format.indexOf("{2}");
                    
                }
                if(index != -1) {                    
                    format = format.substring(index);
                }
            }
        }
		return StringUtils.substitude(format,secondStr,minuteStr,hourStr,day);
	}

    //////////////////////////////////日期格式化////////////////////////////////////
    /** yyyy-mm-dd */
    public static FORMAT_DATE:string = "date";
    /** yyyy-mm-dd */
    public static FORMAT_Y_M_D:string = "yyyy-mm-dd";
    /** mm-dd hh:MM */
    public static FORMAT_M_D_HH_MM:string = "mm-dd hh:MM";
    /** yyyy-mm-dd hh:MM:ss */
    public static FORMAT_Y_M_D_HH_MM_SS:string = "yyyy-mm-dd hh:MM:ss";
    /** yyyy-mm-dd hh:MM */
    public static FORMAT_Y_M_D_HH_MM:string = "yyyy-mm-dd hh:MM";
    /** yyyy/mm/dd hh:MM */
    public static FORMAT_Y_M_D_HH_MM_2:string = "yyyy/mm/dd hh:MM";
    /** yyyy/mm/dd\n hh:MM */
    public static FORMAT_Y_M_D_HH_MM_3:string = "yyyy/mm/dd \n hh:MM";
    /** MM:ss */
    public static FORMAT_MM_SS:string = "MM:ss";
    /** hh:MM */
    public static FORMAT_HH_MM:string = "hh:MM";
    /** hh:MM:ss */
    public static FORMAT_HH_MM_SS:string = "hh:MM:ss";
    /** yyyy年mm月dd日 hh:MM:ss */
    public static FORMAT_CN_Y_M_D_HH_MM_SS:string = "yyyy年mm月dd日 hh:MM:ss";
    /** mm月dd日(周X) hh:mm*/
    public static FORMAT_CN_M_D_WEEKX_HH_MM:string = "mm月dd日(周x) hh:MM";
    /** hh时MM分 */
    public static FORMAT_CN_HH_MM:string = "hh时MM分";

    /**
     * 时间戳（秒）转换统一接口，不要另外加太多接口，统一在这个接口加类型
     * @param p_seconds 时间戳 秒
     * @param format 时间格式 定义DateUtil.FORMAT_XXX常量
     * @return
     */
    public static formatDate(p_seconds:number, format:String = "date"):string
    {
        var timeDate:Date = new Date(p_seconds * 1000);
        var month:String = this.timeToLongStr(timeDate.getMonth() + 1);
        var date:String = this.timeToLongStr(timeDate.getDate());
        var hours:String = this.timeToLongStr(timeDate.getHours());
        var minutes:String = this.timeToLongStr(timeDate.getMinutes());
        var seconds:String = this.timeToLongStr(timeDate.getSeconds());
        switch(format)
        {
            case DateUtils.FORMAT_DATE:
                return timeDate.getFullYear() + "年" + month + "月" + date + "日";
            case DateUtils.FORMAT_Y_M_D:
                return timeDate.getFullYear() + "-" + month + "-" + date;
            case DateUtils.FORMAT_M_D_HH_MM:
                return month + "-" + date + " " + hours + ":" + minutes;
            case DateUtils.FORMAT_Y_M_D_HH_MM_SS:
                return timeDate.getFullYear() + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
            case DateUtils.FORMAT_CN_Y_M_D_HH_MM_SS:
                return timeDate.getFullYear() + "年" + month + "月" + date + "日 " + hours + ":" + minutes + ":" + seconds;
            case DateUtils.FORMAT_CN_M_D_WEEKX_HH_MM:
                return month + "月" + date + "日(周" + this.getCNWeekDay(timeDate.getDay()) + ")" + hours + ":" + minutes;
            case DateUtils.FORMAT_Y_M_D_HH_MM:
                return timeDate.getFullYear() + "-" + month + "-" + date + " " + hours + ":" + minutes;
            case DateUtils.FORMAT_Y_M_D_HH_MM_2:
                return timeDate.getFullYear() + "/" + month + "/" + date + " " + hours + ":" + minutes;
            case DateUtils.FORMAT_Y_M_D_HH_MM_3:
                return timeDate.getFullYear() + "/" + month + "/" + date + "\n" + hours + ":" + minutes;
            case DateUtils.FORMAT_MM_SS:
                return minutes + ":" + seconds;
            case DateUtils.FORMAT_HH_MM:
                return hours + ":" + minutes;
            case DateUtils.FORMAT_HH_MM_SS:
                return hours + ":" + minutes + ":" + seconds;
            case DateUtils.FORMAT_CN_HH_MM:
                return hours + "时" + timeDate.getMinutes() + "分";
            default:
                return month + "-" + timeDate.getDay() + " " + hours + ":" + minutes;
        }
    }

    /***
     * 根据时间戳判断是否同一日 (秒数)
     */
    public static isSameDay(secA:number,secB:number):boolean{
        var dA:Date = new Date(secA*1000);
        var dB:Date = new Date(secB*1000);
        return dA.getFullYear()==dB.getFullYear() && dA.getMonth()==dB.getMonth() && dA.getDate()==dB.getDate();
    }

    public static getDay(secs:number): number {
        return Math.floor(secs / 86400);
    }

    //////////////////////////////////时间格式化////////////////////////////////////
    /** d天h小时m分钟s秒 */
    public static FORMAT_SECONDS_1:string = "seconds_1";
    /** h小时m分钟s秒 */
    public static FORMAT_SECONDS_2:string = "seconds_2";
    /** 00:00:00 */
    public static FORMAT_SECONDS_3:string = "seconds_3";
    /** 00:00 */
    public static FORMAT_SECONDS_4:string = "seconds_4";
    /** d天h小时m分钟 */
    public static FORMAT_SECONDS_5:string = "seconds_5";

    public static formatSeconds(seconds:number, format:String = "seconds_1"): string {
        let second: number =  Math.ceil(seconds % 60);
        let minute: number = Math.floor(seconds % 3600 / 60);
        let hour: number = Math.floor(seconds % 86400 / 3600);
        let day: number = Math.floor(seconds / 86400);
        switch (format)
        {
            case DateUtils.FORMAT_SECONDS_1:
                return `${getNumStr(day,"天") + getNumStr(hour,"小时") + getNumStr(minute,"分钟") + getNumStr(second,"秒")}`
            case DateUtils.FORMAT_SECONDS_2:
                hour = Math.floor(seconds / 3600);
                return `${getNumStr(hour,"小时") + getNumStr(minute,"分") + getNumStr(second,"秒")}`;
            case DateUtils.FORMAT_SECONDS_3:
                hour = Math.floor(seconds / 3600);
                return `${this.timeToLongStr(hour)+":" + this.timeToLongStr(minute) +":" + this.timeToLongStr(second)}`;
            case DateUtils.FORMAT_SECONDS_4:
                return `${this.timeToLongStr(minute) +":" + this.timeToLongStr(second)}`;
            case DateUtils.FORMAT_SECONDS_5:
                return `${getNumStr(day,"天") + getNumStr(hour,"小时") + getNumStr(minute,"分钟")}`;
        }
        function getNumStr(num:number, unit:string):string{
            return num>0?num+unit:'';
        }
        return "";
    }

    /**
     * 根据秒数格式化字符串
     * @param second 秒数
     * @param type 1:00:00:00   2:yyyy-mm-dd h:m:s    3:00:00   4:xx天前，xx小时前，xx分钟前 5:d天m分s秒 6: 00:00 7:d天m分
     * @return
     *
     */
    public static getFormatBySecond(second: number, type: number = 1): string {
        var str: string = "";
        switch (type) {
            case 1:
                str = this.getFormatBySecond1(second);
                break;
            case 2:
                str = this.getFormatBySecond2(second);
                break;
            case 3:
                str = this.getFormatBySecond3(second);
                break;
            case 4:
                str = this.getFormatBySecond4(second);
                break;
            case 5:
                str = this.getFormatBySecond5(second);
                break;
            case 6:
                str = this.getFormatBySecond6(second);
                break;
            case 7:
                str = this.getFormatBySecond7(second);
                break;
            case 8:
                str = this.getFormatBySecond8(second);
                break;
            case 9:
                str = this.getFormatBySecond9(second);
                break;
        }
        return str;
    }

    //1: 00:00:00
    private static getFormatBySecond1(t: number = 0): string {
        var hourst: number = Math.floor(t / 3600);
        var hours: string;
        if (hourst == 0) {
            hours = "00";
        } else {
            if (hourst < 10)
                hours = "0" + hourst;
            else
                hours = "" + hourst;
        }
        var minst: number = Math.floor((t - hourst * 3600) / 60);
        var secondt: number = Math.floor((t - hourst * 3600) % 60);
        var mins: string;
        var sens: string;
        if (minst == 0) {
            mins = "00";
        } else if (minst < 10) {
            mins = "0" + minst;
        } else {
            mins = "" + minst;
        }
        if (secondt == 0) {
            sens = "00";
        } else if (secondt < 10) {
            sens = "0" + secondt;
        } else {
            sens = "" + secondt;
        }
        return hours + ":" + mins + ":" + sens;
    }

    //3: 00:00
    private static getFormatBySecond3(t: number = 0): string {
        var hourst: number = Math.floor(t / 3600);
        var minst: number = Math.floor((t - hourst * 3600) / 60);
        var secondt: number = Math.floor((t - hourst * 3600) % 60);
        var mins: string;
        var sens: string;
        if (minst == 0) {
            mins = "00";
        } else if (minst < 10) {
            mins = "0" + minst;
        } else {
            mins = "" + minst;
        }
        if (secondt == 0) {
            sens = "00";
        } else if (secondt < 10) {
            sens = "0" + secondt;
        } else {
            sens = "" + secondt;
        }
        return mins + ":" + sens;
    }

    //2:yyyy-mm-dd h:m:s
    private static getFormatBySecond2(time: number): string {
        var date: Date = new Date(time);
        var year: number = date.getFullYear();
        var month: number = date.getMonth() + 1; 	//返回的月份从0-11；
        var day: number = date.getDate();
        var hours: number = date.getHours();
        var minute: number = date.getMinutes();
        var second: number = date.getSeconds();
        return year + "-" + month + "-" + day + " " + hours + ":" + minute + ":" + second;

    }

    //4:xx天前，xx小时前，xx分钟前
    private static getFormatBySecond4(time: number): string {
        var t = Math.floor(time / 3600);
        if (t > 0) {
            if (t > 24) {
                return Math.floor(t / 24) + "天前";
            }
            else {
                return t + "小时前";
            }
        }
        else {
            return Math.floor(time / 60) + "分钟前";
        }
    }

    private static getFormatBySecond5(time: number): string {
        //每个时间单位所对应的秒数
        var oneDay: number = 3600 * 24;
        var oneHourst: number = 3600;
        var oneMinst: number = 60;

        var days = Math.floor(time / oneDay);
        var hourst: number = Math.floor(time % oneDay / oneHourst)
        var minst: number = Math.floor((time - hourst * oneHourst) / oneMinst)  //Math.floor(time % oneDay % oneHourst / oneMinst);
        var secondt: number = Math.floor((time - hourst * oneHourst) % oneMinst) //time;

        var dayss: string = "";
        var hourss: string = ""
        var minss: string = "";
        var secss: string = ""
        if (time > 0) {
            //天
            if (days == 0) {
                dayss = "";
                //小时
                if (hourst == 0) {
                    hourss = "";
                    //分
                    if (minst == 0) {
                        minss = "";
                        if (secondt == 0) {
                            secss = "";
                        } else if (secondt < 10) {
                            secss = "0" + secondt + "秒";
                        } else {
                            secss = "" + secondt + "秒";
                        }

                        return secss;
                    }
                    else {
                        minss = "" + minst + "分";
                        if (secondt == 0) {
                            secss = "";
                        } else if (secondt < 10) {
                            secss = "0" + secondt + "秒";
                        } else {
                            secss = "" + secondt + "秒";
                        }

                    }

                    return minss + secss;
                }
                else {
                    hourss = hourst + "小时";
                    if (minst == 0) {
                        minss = "";
                        if (secondt == 0) {
                            secss = "";
                        } else if (secondt < 10) {
                            secss = "0" + secondt + "秒";
                        } else {
                            secss = "" + secondt + "秒";
                        }

                        return secss

                    } else if (minst < 10) {
                        minss = "0" + minst + "分";
                    } else {
                        minss = "" + minst + "分";
                    }

                    return hourss + minss;

                }
            }
            else {
                dayss = days + "天";
                if (hourst == 0) {
                    hourss = "";
                } else {
                    if (hourst < 10)
                        hourss = "0" + hourst + "小时";
                    else
                        hourss = "" + hourst + "小时";
                    ;
                }
                return dayss + hourss;
            }
        }
        return "";
    }

    /**
     * 返回 00:00
     */
    private static getFormatBySecond6(time: number = 0): string {
        var ret: string = "";
        var mStr: string = this.timeToLongStr(Math.floor(time / 60));
        var secStr: string = this.timeToLongStr(Math.floor(time % 60));
        ret = mStr + ":" + secStr;
        return ret;
    }

    private static getFormatBySecond7(seconds:number):string
    {
        var mySeconds:number=0;
        var myMinutes:number=0;
        var myHours:number=0;
        var mySec:number=seconds;
        var tempMinute:number=Math.floor(mySec / 60);
        mySeconds=mySec % 60;

        if (tempMinute >= 60)
        {
            myHours=Math.floor(tempMinute / 60);
            myMinutes=tempMinute % 60;
        }
        else
        {
            myMinutes=tempMinute;
        }
        var tempHour:number = myHours;
        var myDays:number = 0;
        if (tempHour >= 24)
        {
            myDays=Math.floor(tempHour / 24);
            myHours=tempHour % 24;
        }
        return (myDays > 0 ? myDays  + '天' : '') + (myHours > 0 ? myHours + '小时' : '') + (myMinutes > 0 ? myMinutes + '分钟' : '');
    }

    private static getFormatBySecond8(seconds:number):string
    {
        let mySeconds:number = 0;
        let myHours:number = 0;
        let mySec:number = seconds;
        let tempMinute:number = Math.floor(mySec / 60);
        mySeconds = mySec % 60;

        if (tempMinute >= 60)
        {
            myHours = Math.floor(tempMinute / 60);
        }
        let tempHour:number = myHours;
        let myDays:number = 0;
        if (tempHour >= 24)
        {
            myDays = Math.floor(tempHour / 24);
            myHours = tempHour % 24;
        }
        return (myDays > 0 ? myDays  + '天' : '') + (myHours > 0 ? myHours + '小时' : '');
    }

    private static getFormatBySecond9(seconds:number):string
    {
        var mySeconds:number=0;
        var myMinutes:number=0;
        var myHours:number=0;
        var mySec:number=seconds;
        var tempMinute:number=Math.floor(mySec / 60);
        mySeconds=mySec % 60;

        if (tempMinute >= 60)
        {
            myHours=Math.floor(tempMinute / 60);
            myMinutes=tempMinute % 60;
        }
        else
        {
            myMinutes=tempMinute;
        }
        var tempHour:number = myHours;
        var myDays:number = 0;
        if (tempHour >= 24)
        {
            myDays=Math.floor(tempHour / 24);
            myHours=tempHour % 24;
        }
        if(myDays > 0){
            myHours += myDays*24;
        }
        return (myHours > 10 ? myHours : '0' + myHours) + '小时' + (myMinutes > 10 ? myMinutes : '0' + myMinutes) + '分' + (mySeconds > 10 ? mySeconds : '0' + mySeconds) + '秒';
    }

    public static timeToLongStr(value: number): string {
        return value >= 10 ? value + '' : "0" + value;
    }

    public static formatSecond(second: number): string {
        let ts: number = second % 60;
        if (ts > 0) {
            second += 60 - ts;
        }
        let minute: number = second % 3600 / 60;
        let hour: number = Math.floor(second % 86400 / 3600);
        let day: number = Math.floor(second / 86400);
        if (day > 0) {
            return `${day}天`;
        } else if (hour > 0) {
            if (minute > 0) {
                return `${hour}小时${minute}分`;
            } else {
                return `${hour}小时`;
            }
        } else {
            return `${minute}分`;
        }
    }

    /**
     * 毫秒格式化 1：hh:mm:ss:ms
     * @param {number} milliSeconds
     * @param {number} formatType
     * @returns {string}
     */
    public static getFormatMilisecs(milliSeconds:number, formatType:number = 1):string {
        if (formatType == 1) {
            let mats:Array<number> = [3600*1000, 60*1000, 1000, 1];
            let ret:string = "";
            for (let i = 0, len = mats.length; i < len; i++) {
                let val:number = 0;
                while (milliSeconds>mats[i])
                {
                    milliSeconds-=mats[i];
                    val++;
                }
                ret += (val>10 ? val : "0" + val) + (i != len - 1? ":" : "");
            }
            return ret;
        }
    }

    /**
     * 获得本周某天0点的时间戳：秒
     * @param {number} curSecs 当前时间：秒
     * @param {number} specifiedDay 指定星期几->星期一：1，星期日：7
     * @returns {number}
     */
    public static getThisWeekOneDay(curSecs:number, specifiedDay:number):number {
        let timeDate:Date = new Date(curSecs * 1000);
        let date:number = timeDate.getDate();
        let day:number = timeDate.getDay();
        // console.log('------'+day);
        day = day == 0 ? 7 : day;
        timeDate.setDate(date + specifiedDay - day);
        timeDate.setHours(24, 0, 0, 0);
        // console.log('======'+timeDate.getTime());
        return timeDate.getTime()/1000;
    }

    public static NumberName: any = {
		"0": "零",
		"1": "一",
		"2": "二",
		"3": "三",
		"4": "四",
		"5": "五",
		"6": "六",
		"7": "七",
		"8": "八",
		"9": "九",
		"10": "十",
		"11": "十一",
		"12": "十二",
		"13": "十三",
		"14": "十四",
		"15": "十五",
		"16": "十六",
		"17": "十七",
		"18": "十八",
		"19": "十九",
		"20": "二十",
		"21": "二十一",
		"22": "二十二",
		"23": "二十三",
		"24": "二十四",
		"25": "二十五",
		"26": "二十六",
		"27": "二十七",
		"28": "二十八",
		"29": "二十九",
		"30": "三十"
	}

    /**
     * 获取星期几
     * @param {number} day
     * @returns {string}
     */
    public static getCNWeekDay(day:number):string {
        return day > 0 ? DateUtils.NumberName[day] : "日";
    }

}