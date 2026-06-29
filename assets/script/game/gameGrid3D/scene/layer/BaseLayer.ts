import { Node } from "cc";
import { addObserver, removeObserver } from "db://assets/script/utils/MessageCenter";

export default class BaseLayer{
    private _isShow:boolean = false;
    protected _rootNode:Node;
    public constructor() {
    }

    public init(root:Node){
        this._rootNode = root;
        addObserver(this);
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

    public destroy() {
        this.onDestroy();
        removeObserver(this);
    }
}