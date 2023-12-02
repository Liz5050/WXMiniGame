import { _decorator, Button, instantiate, Label, math, Node, Prefab, resources, Toggle, UITransform } from 'cc';
import { EventManager } from '../../../manager/EventManager';
import { EventEnum } from '../../../enum/EventEnum';
import { GameDefine, GameType } from '../../../enum/GameType';
import { ShulteGridItem } from './ShulteGridItem';
import Mgr from '../../../manager/Mgr';
import { BaseUISubView } from '../../base/BaseUISubView';
import { CacheManager } from '../../../manager/CacheManager';
import { SDK } from '../../../SDK/SDK';

export class GameShulteBeginView extends BaseUISubView {
	private static ITEM_POOL:Array<Node> = new Array();
    private _itemContainer:Node;

    private _curTypeIdx:number = -1;
    private _num:number;
    private _btns:BtnType[] = [];
    private _items:Node[] = [];
    private _typeList:number[];
    private _toggleBannerAd:Toggle;

    protected initUI() {
        this._typeList = GameDefine.ShulteSubTypes;
		let self = this;
        this._toggleBannerAd = this.getChildByName("ToggleBannerAd").getComponent(Toggle);
        this._toggleBannerAd.isChecked = true;
        this._toggleBannerAd.node.on(Toggle.EventType.TOGGLE,function(){
            let isShow = self._toggleBannerAd.isChecked;
            SDK.CanShowBanner = isShow;
        });

		let toggle = this.getChildByName("Toggle").getComponent(Toggle);
		toggle.node.on(Toggle.EventType.TOGGLE,()=>{
			CacheManager.gameGrid.clickHide = toggle.isChecked;
		})
      
		this._itemContainer = this.getChildByPath("group/gridGroup");
		for (let i = 0; i < this._typeList.length; i++) {
			let type = this._typeList[i];
			let btn:BtnType = new BtnType();
			let btnNode:Node = this.getChildByPath("ToggleGroup/btn" + (i+1));
			btn.init(btnNode,type,i);
			btnNode.on(Button.EventType.CLICK,function(){
				self.setIndex(i);
			});
			this._btns.push(btn);
		}
      
      	let btnStart:Node = this.getChildByPath("group/btnStart");
	  	btnStart.on(Button.EventType.CLICK,function(){
            EventManager.dispatch(EventEnum.OnGameShulteStart,self._typeList[self._curTypeIdx]);
		});

		let btnExit:Node = this.getChildByName("btnExit");
		btnExit.on(Button.EventType.CLICK,function(){
            //退出前回到初始化状态
			self.setIndex(0);
			EventManager.dispatch(EventEnum.OnGameExit,GameType.Shulte);
		});
	}

	public onShowAfter(): void {
		this.setIndex(0);
	}

	private setIndex(index:number){
		if(this._curTypeIdx == index) return;
		if(this._curTypeIdx >= 0){
			this.clearShowGrid();
			this._btns[this._curTypeIdx].setSelected(false);
		}
		this._curTypeIdx = index;
		this._btns[index].setSelected(true);
		let curType:number = this._typeList[index];
		this._num = curType * curType;

		this.updateShowGrid();
	}

	private updateShowGrid(){
		let curType = this._typeList[this._curTypeIdx];
		let width = this._itemContainer.getComponent(UITransform).contentSize.width;
		// let offset = this._systemInfo.screenWidth / 1080;
		let curSize = Math.floor(width / curType);// * offset;
		
		for (let i = 0; i < this._num; i++) {
			if(!this.canShowGrid(i)) continue;
			let itemNode:Node = this.getShowItemGrid();
			let transform = itemNode.getComponent(UITransform);
			transform.width = curSize;
			transform.height = curSize;
			this._itemContainer.addChild(itemNode);
			itemNode.active = true;
			//手动设置位置，中间需要空出一个方格，不能用自动排序
			let col = i % curType;
			let row = Math.floor(i / curType);
			let x = col * curSize;
			let y = row * - curSize;
			itemNode.setPosition(x,y);

			itemNode.getComponent(ShulteGridItem).setIndex(i);
			this._items.push(itemNode);
		}
	}

	private getShowItemGrid():Node{
		let node:Node = GameShulteBeginView.ITEM_POOL.pop();
		if(!node){
			let prefabAsset:Prefab = Mgr.loader.getBundleRes("ui","gameShulte/ShulteGridItemShow") as Prefab;
			if(prefabAsset){
				node = instantiate(prefabAsset);
			}
			else{
				console.log("找不到资源");
			}
		}
		return node;
	}

	private clearShowGrid(){
		for (let i = 0; i < this._items.length; i++) {
			let item = this._items[i];
			item.active = false;
			GameShulteBeginView.ITEM_POOL.push(item);
		}
		this._items = [];
	}

	private canShowGrid(index:number) {
		let curType:number = this._typeList[this._curTypeIdx];
		if (curType == 3)
		{
			return index != 4;
		}
		if (curType == 4)
		{
			return index != 5 && index != 6 && index != 9 && index != 10;
		}
		if (curType == 5)
		{
			return (index < 6 || index > 8) && (index < 11 || index > 13) && (index < 16 || index > 18);
		}
		if (curType == 6)
		{
			return index != 14 && index != 15 && index != 20 && index != 21;
		}
		if (curType == 7)
		{
			return (index < 16 || index > 18) && (index < 23 || index > 25) && (index < 30 || index > 32);
		}
		return (index < 18 || index > 21) && (index < 26 || index > 29) && (index < 34 || index > 37) && (index < 42 || index > 45);
	}
}

class BtnType {
	private _isSelected:boolean;
	private _index:number;
	private _type:number;
	private _itemNode:Node;
	private _normalNode:Node;
	private _selectedNode:Node;
	private _txtType:Label;
	private _txtColor:math.Color = new math.Color();

	public consturctor(){
	}

	public init(node:Node,type:number,index:number){
		this._itemNode = node;
		this._type = type;
		this._index = index;
		this.initUI();
	}

	private initUI(){
		this._normalNode = this._itemNode.getChildByName("normal");
		this._selectedNode = this._itemNode.getChildByName("selected");
		this._txtType = this._itemNode.getChildByName("txtType").getComponent(Label);
		this._txtType.string = this._type + "X" + this._type;
	}

	public setSelected(isSelected:boolean){
		if (this._isSelected == isSelected){
			return;
		}
		if(isSelected){
			this._txtColor.set(255,255,255);
		}
		else {
			this._txtColor.set(0,0,0);
		}
		this._txtType.color = this._txtColor;
		this._normalNode.active = !isSelected;
		this._selectedNode.active = isSelected;
		this._isSelected = isSelected;
	}
}