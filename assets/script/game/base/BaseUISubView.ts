import { Node } from "cc";
import { BaseView } from "./BaseView";

export class BaseUISubView extends BaseView {
    protected _isInit:boolean;
    protected _isShow:boolean;
    public constructor(node:Node){
        super();
        this._rootNode = node;
    }

    public init(){
        this.initUI();
        this.initEvent();
        this._isInit = true;
    }

    protected initUI(){
    }

    protected initEvent(){
    }

    protected removeEvent(){
    }

    public set active(bool:boolean){
        if(bool == this._isShow){
            return;
        }
        if(bool){
            this.show();
        }
        else{
            this.hide();
        }
        this._isShow = bool;
    }

    public show(param:any = null){
        if(!this._isShow){
            this._rootNode.active = true;
            this._isShow = true;
        }
        this.onShow(param);
    }

    protected onShow(param){
        super.onShow(param);
        this._isShow = true;
        this.onShowAfter(param);
    }
    
    public onShowAfter(param){

    }

    public hide(){
        if(!this._isShow){
            return;
        }
        this._rootNode.active = false;
        this.onHide();
    }

    protected onHide(){
        this._isShow = false;
        super.onHide();
    }
}