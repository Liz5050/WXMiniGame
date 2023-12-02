import { Label } from "cc";
import { UIModuleEnum } from "../../enum/UIDefine";
import { BaseUIView } from "../../game/base/BaseUIView";
import { Node } from "cc";
import { Button } from "cc";
import { EventTouch } from "cc";

export class AlertView extends BaseUIView {
	private static _instance:AlertView;
	private _txtAlert:Label;
	private _btns:Node[];
	private _txtBtns:Label[];
	private _alertStr:string;
	private _callBack:Function;
	private _callBackObj:any;
	private _btnLabels:string[];
	private _btnTypes:AlertType[];
	
	public constructor(){
		super(UIModuleEnum.common,"AlertView");
	}

	public static get instance():AlertView {
		return this._instance;
	}

	private setData(alertStr:string,callBack:Function = null,callBackObj:any = null,
					btnLabels:string[] = null,btnTypes:AlertType[] = null):void{
		this._alertStr = alertStr;
		this._callBack = callBack;
		this._callBackObj = callBackObj;
		this._btnLabels = btnLabels;
		this._btnTypes = btnTypes;
	}

	public initUI():void{
		this._btns = [];
		this._txtBtns = [];
		this._txtAlert = this.getChildByName("txtAlert").getComponent(Label);
		let btnsNode = this.getChildByName("btns");
		for(let i:number = 1; i <= 2; i++) {
			let btn:Node = btnsNode.getChildByName("btn_" + i);
			btn.on(Button.EventType.CLICK,this.onBtnClickHandler,this);
			btn.active = false;
			this._btns.push(btn);
			this._txtBtns.push(btn.getChildByName("Label").getComponent(Label));
		}
	}

	public onShowAfter():void{
		this._txtAlert.string = this._alertStr;
		if(this._btnTypes == null || this._btnTypes.length <= 1)
		{
			this._btns[1].active = true;
			this._btns[0].active = false;
		}
		else{
			for(let i:number = 0; i < this._btnTypes.length; i++){
				this._btns[i].active = true;
				this._txtBtns[i].string = this._btnLabels[i];
			}
		}
	}

	private onBtnClickHandler(evt:EventTouch):void{
		this.hide();
		let _index:number = this._btns.indexOf(evt.target);
		if(this._btnLabels && this._btnLabels.length > 0){
			if(this._callBack != null) {
				let call:Function = this._callBack;
				this._callBack = null;
				call.call(this._callBackObj,this._btnTypes[_index]);
			}
		}
	}

	public hide():void{
		super.hide();
	}

	/**
	 * @param alertStr 提示内容
	 * @param callBack 回调函数
	 * @param callBackObj 回调作用域
	 * @param btnTypes 按钮对应索引
	 * @param btnLabels 按钮文本
	 */
	public static show(alertStr:string,callBack:Function = null,callBackObj:any = null,
		btnTypes:AlertType[] = [AlertType.NO,AlertType.YES],btnLabels:string[] = ["取消","确定"]):AlertView{
		if(AlertView._instance == null){
			AlertView._instance = new AlertView();
		}
		AlertView._instance.setData(alertStr,callBack,callBackObj,btnLabels,btnTypes);
		AlertView._instance.show();
		return AlertView._instance;
	}
}

export enum AlertType
{
	/**确定 */
	YES = 1,
	/**取消 */
	NO = 2,
	TEST = 3,
}