import { Button, Node, ScrollView, Vec3, instantiate } from "cc";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { BaseUIView } from "../../base/BaseUIView";
import { GameBuildHeroItem } from "./GameBuildHeroItem";
import { CacheManager } from "../../../manager/CacheManager";
import { EntityType } from "../scene/utils/EntityUtil";
import { addObserver, msg, removeObserver } from "../../../utils/MessageCenter";
import { GEvent } from "../../../enum/GEvent";
import { GameGridMapItem } from "../scene/entity/GameGridMapItem";

export class GameBuildHeroView extends BaseUIView{

    private _scroll:ScrollView;
    private _content:Node;

    private _itemList:GameBuildHeroItem[];
    private _curIndex:number = -1;
    private _selectedGrid:GameGridMapItem;
    private _isObserving:boolean = false;
    public constructor(){
        super(UIModuleEnum.gameGrid3D,"GameBuildHeroView");
    }

    protected initUI(): void {
        this._itemList = [];
        this._content = this.getChildByPath("ScrollView/view/content");
        this.getModuleRes("GameBuildHeroItem",(prefab)=>{
            for(let i = 0; i < 5; i++){
                let node = instantiate(prefab);
                this._content.addChild(node);
                node.on(Button.EventType.CLICK,()=>{
                    this.setIndex(i);
                });
                let item = node.getComponent(GameBuildHeroItem);
                this._itemList.push(item);
                item.setData({name:`熊战士${i}`,index:i},i);
            }
        });
    }

    public onShowAfter(param?: any): void {
        this.addGrid3DObserver();
        this._selectedGrid = param;
    }

    @msg(GEvent.OnGameGrid3DBuildItemSure)
    private onBuildHeroItem(){
        CacheManager.gameGrid3D.addEntityByNum(EntityType.Hero,1,{pos:new Vec3(this._selectedGrid.col,0,this._selectedGrid.row)});
    }

    @msg(GEvent.OnGameGrid3DBuildItemCancel)
    private onItemCancel(index:number){
        if(this._curIndex == index) {
            this.clearIndex();
        }
    }

    private setIndex(index:number){
        if(this._curIndex == index) return;
        if(this._curIndex >= 0){
            this._itemList[this._curIndex].setSelected(false);
        }
        this._curIndex = index;
        this._itemList[this._curIndex].setSelected(true);
    }

    private clearIndex(){
        if(this._curIndex >= 0){
            this._itemList[this._curIndex].setSelected(false);
            this._curIndex = -1;
        }
    }

    public hide(isDestroy?: boolean): void {
        this.clearIndex();
        this.removeGrid3DObserver();
        super.hide(isDestroy);
    }

    private addGrid3DObserver(): void {
        if (this._isObserving) return;
        this._isObserving = true;
        addObserver(this);
    }

    private removeGrid3DObserver(): void {
        if (!this._isObserving) return;
        this._isObserving = false;
        removeObserver(this);
    }
}
