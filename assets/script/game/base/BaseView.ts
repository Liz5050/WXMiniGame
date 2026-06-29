import { game, view } from 'cc';
import { _decorator, Node } from 'cc';
import { addObserver } from '../../utils/MessageCenter';
export class BaseView extends Object {
    protected _rootNode:Node;
    protected _isInit:boolean = false;
    protected _timer:any[] = [];
    public constructor(){
        super();
    }   

    public initView(viewNode:Node):void{
        this._rootNode = viewNode;
        this.init();
    }

    public init(){
        this.initUI();
        this.initEvent();
        addObserver(this);
        this._isInit = true;
    }

    protected initUI(){
    }

    protected initEvent(){
    }

    protected removeEvent(){
    }

    protected getChildByName(name:string){
        return this._rootNode.getChildByName(name);
    }

    protected getChildByPath(path:string){
        return this._rootNode.getChildByPath(path);
    }

    protected addTimer(callBack:Function,cdtime:number){
        if(this._timer.length > 3){
            return;
        }
        let time:number = game.totalTime;
        let interval = setInterval(()=>{
            let now = game.totalTime; 
            let dt = now - time;
            time = now;
            callBack(dt);
        },cdtime);
        this._timer.push(interval);
    }

    public show(param:any = null){
    }

    protected onShow(param:any = null){
    }

    public hide(){
    }

    protected clearTimer(){
        if(this._timer && this._timer.length > 0){
            for(let f of this._timer){
                clearInterval(f);
            }
            this._timer.length = 0;
        }
    }

    protected onHide(){
        this.clearTimer();
    }
}


