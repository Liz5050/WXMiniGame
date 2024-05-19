/**
 * 字符串操作工具类
 */
export class StringUtils {

    /**
     * 去掉前后空格
     * @param str
     * @returns {string}
     */
    public static trimSpace(str:string):string {
        if(str == null){
            return "";
        }
        return str.replace(/^\s*(.*?)[\s\n]*$/g, '$1');
    }

    /**
     * 获取字符串长度，中文为2，中文也改为1啦~
     * @param str
     */
    public static getStringLength(str:string):number {
        if(str == null){
            return 0;
        }
        var strArr = str.split("");
        var length = 0;
        for (var i = 0; i < strArr.length; i++) {
            var s = strArr[i];
            if (StringUtils.isChinese(s)) {
                // length += 2;
                length += 1; //中文也改为1
            } else {
                length += 1;
            }
        }
        return length;
    }

    /**
     * 判断一个字符串是否包含中文
     * @param str
     * @returns {boolean}
     */
    public static isChinese(str:string):boolean {
        var reg = /^.*[\u4E00-\u9FA5]+.*$/;
        return reg.test(str);
    }

    public static isChineseAll(str : string) : boolean {
        var reg =   /^[\u4e00-\u9fa5]+$/;
        return reg.test(str);
    }

    /**
     * 替换字符串中所有{0}{1}...
     * @param {string} str
     * @param rest
     * @returns {string}
     */
    public static substitude(str:string, ... rest):string
    {
        if (str == null) return '';

        var len:number = rest.length;
        var args:Array<any>;
        if (len == 1 && rest[0] instanceof Array)
        {
            args = rest[0] as Array<any>;
            len = args.length;
        }
        else
        {
            args = rest;
        }

        for (var i:number = 0; i < len; i++)
        {
            str = str.replace(new RegExp("\\{"+i+"\\}", "g"), args[i]);
        }

        return str;
    }
    /**解析聊天字符串 */
    public static anlysisMsg(strSrc: string,reg:RegExp,resetReg:boolean=true): string[] {
		var resultArr: string[] = [];
		//var reg:RegExp = StringUtils.FIND_FACE_REG;
		var curStr:string = strSrc;
        reg.lastIndex = 0;
		var inf:RegExpExecArray = reg.exec(curStr);
		var isHas:boolean = inf!=null; //是否含有正则匹配的字符串
		var curIdx:number = 0;
		while(inf){			
			var s:string = curStr.slice(curIdx,inf.index);
			if(s){
				resultArr.push(s); //把正则匹配的字符串前面的字符串添加进数组
			}
			resultArr.push(inf[0]); //把正则匹配的字符串添加进数组
			curIdx = inf.index + inf[0].length;
			reg.lastIndex = curIdx;
			inf = reg.exec(curStr);
			if(!inf){
				s = curStr.slice(curIdx,curStr.length);
				s?resultArr.push(s):null; 
			}
		}
		if(!isHas){
			resultArr.push(curStr);
		}
        reg.lastIndex = 0; //复位正则的查找位置
		return resultArr;
	}
    
    /**长度为0的串 */
    public static isEmptyStr(str:string):boolean{
        str = str.trim();//去掉两端
        return str.length == 0;
    }

    /**
     * 把字符串转换成OBJ
     * @param str    要转换的串
     * @param props    结果OBJ的属性列表 逗号隔开
     * @param splitStr 参数 str 拆分符号
     * @param autoNum  纯数字字符串 是否转换成数字
     */
    public static strToObj(str:string,props:string="",splitStr:string="|",autoNum:boolean=true):any{
        var proArr:string[] = props.split(",");
        var srcArr:string[] = str.split(splitStr);
        var ret:any = {};
        var key:string;
        for(var i:number = 0;i<srcArr.length;i++){
            key = i<proArr.length?proArr[i]:"";
            !key?key="key_"+i:null;
            if(autoNum){
                var n:number = Number(srcArr[i]);
                ret[key] = isNaN(n)?srcArr[i]:n;
            }else{
                ret[key] = srcArr[i];
            }           
        
        }
        return ret;
    }

    /**
     * 100以内，阿拉伯数字转换为中文数字。超过100，中文要加“百”再处理
     * 0表示十
     * a: 1~10=>1~0
     * b: 11~19=>01~09
     * c: 20~...=>20,201
     */
    public static arabicNumToChineseNum(arabicNum:number):string{
        let ChineseNum:string = "0";
        arabicNum = Math.round(arabicNum);
        if (arabicNum == 10) {
            ChineseNum = "0";
        } else if (arabicNum > 10 && arabicNum < 20) {
            ChineseNum = "0" + arabicNum % 10;
        } else if (arabicNum > 20 && arabicNum%10 != 0) {
            ChineseNum = Math.round(arabicNum/10) + "0" + arabicNum%10;
        } else { //默认
            ChineseNum = arabicNum.toString();
        }
        return ChineseNum;
    }
}