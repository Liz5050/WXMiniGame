import { Button, Node, ScrollView, Vec3, instantiate } from "cc";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { BaseUIView } from "../../base/BaseUIView";
import { GameBuildHeroItem } from "./GameBuildHeroItem";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { CacheManager } from "../../../manager/CacheManager";
import { EntityType } from "../scene/utils/EntityUtil";
import { MapGridItem } from "./GameGridStartView";

export class GameBuildHeroView extends BaseUIView{

    private _scroll:ScrollView;
    private _content:Node;

    private _itemList:GameBuildHeroItem[];
    private _curIndex:number = -1;
    private _selectedGrid:MapGridItem;
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

    protected initEvent(): void {
        EventManager.addListener(EventEnum.OnGameBuildItemCancel,this.onItemCancel,this);
        EventManager.addListener(EventEnum.OnGameBuildItemSure,this.onBuildHeroItem,this);
    }

    public onShowAfter(param?: any): void {
        this._selectedGrid = param;
    }

    private onBuildHeroItem(){
        let vo = CacheManager.gameGrid.addEntity(EntityType.GridHero,1,{pos:new Vec3(this._selectedGrid.col,0,this._selectedGrid.row)})[0];
    }

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
        super.hide(isDestroy);
    }
}