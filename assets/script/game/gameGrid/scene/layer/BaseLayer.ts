import { Node } from "cc";

export default class BaseLayer extends Node{
    private _isShow:boolean = false;
    public constructor() {
        super();
        this.init();
    }

    private init(){
        this.onInit();
    }

    public show(){
        if(this._isShow) return;
        this._isShow = true;
        this.onShow();
    }

    public hide(){
        if(!this._isShow) return;
        this._isShow = false;
        this.onHide();
    }

    protected onInit(){}
    protected onShow(){}
    protected onHide(){}
    protected onDestroy(){}

    destroy():boolean {
        this.onDestroy();
        return super.destroy();
    }
}