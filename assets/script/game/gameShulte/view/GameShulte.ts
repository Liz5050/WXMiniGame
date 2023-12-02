import { EventEnum } from "../../../enum/EventEnum";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { EventManager } from "../../../manager/EventManager";
import { LayerManager } from "../../../manager/LayerManager";
import { BaseUIView } from "../../base/BaseUIView";
import { GameShulteBeginView } from "./GameShulteBeginView";
import { GameShulteStartView } from "./GameShulteStartView";

export class GameShulte extends BaseUIView {
    private _beginView:GameShulteBeginView;
    private _startView:GameShulteStartView;
    private _isStart:boolean = false;
    public constructor(){
        super(UIModuleEnum.gameShulte,"GameShulte");
    }

    protected get parent(){
        return LayerManager.gameLayer;
    }

    protected initUI(){
        this._beginView = new GameShulteBeginView(this.getChildByName("begin"));
        this._beginView.init();
        this._startView = new GameShulteStartView(this.getChildByName("gameStart"));
        this._startView.init();
        this._startView.hide();
    }

    protected initEvent(){
        EventManager.addListener(EventEnum.OnGameShulteStart,this.OnGameStart,this);
        EventManager.addListener(EventEnum.OnGameShulteExit,this.OnGameExit,this);
    }

    public onShowAfter(){
        this._beginView.show();
    }

    private OnGameStart(type:number){
        if(this._isStart) return;
        this._startView.show(type);
        this._beginView.hide();
		this._isStart = true;
    }

    private OnGameExit(){
        this._startView.hide();
        this._beginView.show();
        this._isStart = false;
    }

    public hide(){
        super.hide();
        this._beginView.hide();
        this._startView.hide();
    }
}