import { Button, Label, Node, Sprite, _decorator } from "cc";
import { BaseCCView } from "../../base/BaseCCView";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";

const {ccclass,property} = _decorator;

@ccclass
export class GameBuildHeroItem extends BaseCCView{
    @property(Sprite) imgHero:Sprite = null;
    @property(Label) txtName:Label = null;
    @property(Node) selected:Node = null;
    @property(Node) btnSure:Node = null;
    @property(Node) btnCancel:Node = null;

    private _isSelected:boolean = false;
    private _data:any;
    private _index:number;
    protected initUI(): void {
        this.selected.active = false;
        this.btnSure.on(Button.EventType.CLICK,()=>{
            EventManager.dispatch(EventEnum.OnGameBuildItemSure,this._data.index)
        });

        this.btnCancel.on(Button.EventType.CLICK,()=>{
            EventManager.dispatch(EventEnum.OnGameBuildItemCancel,this._data.index)
        });
    }

    public setData(data: any,index:number): void {
        this._data = data;
        this._index = index;
        this.txtName.string = data.name;
    }

    public setSelected(val:boolean){
        if(this._isSelected === val) return;
        this._isSelected = val;
        this.selected.active = val;
    }
    
    public dispose(): void {
        this._isSelected = false;
        this.selected.active = false;
        super.dispose();
    }
}