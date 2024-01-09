import { Game, Node } from "cc";
import { UIModuleEnum } from "../../enum/UIDefine";
import { BaseUIView } from "../../game/base/BaseUIView";
import { LayerManager } from "../../manager/LayerManager";
import TweenManager from "../TweenManager";

export class GameLoadingView extends BaseUIView {
    private static _instance:GameLoadingView;
    private _imgLoadingNode:Node;
    private _loadingTw:any;
    public constructor(){
        super(UIModuleEnum.common,"GameLoadingView");
    }

    protected get parent(){
        return LayerManager.topLayer;
    }

    protected initUI(): void {
        this._imgLoadingNode = this.getChildByName("imgLoading");
    }

    public onShowAfter(param?: any): void {
        if(!this._loadingTw){
            this._loadingTw = TweenManager.addTween(this._imgLoadingNode,{loop:true});
            this._loadingTw.to({rotationZ:-359},1000);
        }
    }

    public hide():void{
		super.hide();
        if(this._loadingTw){
            TweenManager.removeTweens(this._imgLoadingNode);
            this._loadingTw = null;
        }
	}

    public static showLoading(){
        if(GameLoadingView._instance == null){
            GameLoadingView._instance = new GameLoadingView();
        }
        GameLoadingView._instance.show();
    }

    public static hideLoading(){
        if(GameLoadingView._instance){
            GameLoadingView._instance.hide();
        }
    }
}