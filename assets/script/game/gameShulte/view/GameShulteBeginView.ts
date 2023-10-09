import { _decorator, Asset, Button, Component, instantiate, Label, Node, Prefab, resources, UITransform } from 'cc';
import { GameShulteStartView } from './GameShulteStartView';
import { EventManager } from '../../../manager/EventManager';
import { EventEnum } from '../../../enum/EventEnum';
import { GameType } from '../../../enum/GameType';
import { ShulteGridItem } from './ShulteGridItem';
const { ccclass, property } = _decorator;

@ccclass('GameShulteBeginView')
export class GameShulteBeginView extends Component {
	private static ITEM_POOL:Array<Node> = new Array();
    private _itemContainer:Node;

    private _beginNode:Node;
    private _gameStartNode:Node;

    // private _beginAnim:engine.Animator;
    private _gameStart:GameShulteStartView;

    private _curTypeIdx:number = -1;
    private _num:number;
    private _btns:BtnType[] = [];
    private _items:Node[] = [];
    private _typeList:number[] = [3,4,5,6,7,8];

    private _isStart:boolean = false;
    update(deltaTime: number) {
        
    }

    public start() {
		this._gameStart = this.getComponent(GameShulteStartView);

		let self = this;
    //   let muteToggle:engine.UIToggle = GameUI.FindChild(this.entity,"MuteToggle",engine.UIToggle);
    //   let soundNormal:engine.Entity = GameUI.FindChild(muteToggle.entity,"Normal");//this.entity.transform2D.findChildByName("MuteToggle/Normal").entity;
    //   muteToggle.onClick.add(function(comp,event){
    //       soundNormal.active = !muteToggle.isChecked;
    //       Mgr.soundMgr.setMute(muteToggle.isChecked);
    //   });
      

		this._gameStartNode = this.node.getChildByName("gameStart");
		this._gameStartNode.active = false;

		this._beginNode = this.node.getChildByName("begin");
		this._beginNode.active = true;
      
		this._itemContainer = this._beginNode.getChildByPath("group/gridGroup");
		for (let i = 0; i < this._typeList.length; i++) {
			let type = this._typeList[i];
			let btn:BtnType = new BtnType();
			let btnNode:Node = this._beginNode.getChildByPath("ToggleGroup/btn" + (i+1));
			btn.init(btnNode,type,i);
			btnNode.on(Button.EventType.CLICK,function(){
				self.setIndex(i);
			});
			this._btns.push(btn);
		}
      
      	let btnStart:Node = this._beginNode.getChildByPath("group/btnStart");
	  	btnStart.on(Button.EventType.CLICK,function(){
			self.OnStartClick();
		});

		let btnExit:Node = this._beginNode.getChildByName("btnExit");
		btnExit.on(Button.EventType.CLICK,function(){
            //退出前回到初始化状态
			self.setIndex(0);
			self.node.active = false;
			EventManager.dispatch(EventEnum.OnGameExit,GameType.Shulte);
		});
		this.setIndex(0);
  }

  private OnStartClick(){
      if(this._isStart) return;
      this._gameStartNode.active = true;
      this._beginNode.active = false;
      this._gameStart.startGame(this._typeList[this._curTypeIdx]);
      this._isStart = true;
  }

  public gameExit(){
      this._isStart = false;
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

      let url:string = "prefab/ShulteGridItemShow";
      if(resources.get(url)){
          this.updateShowGrid();
      }else{
          let self = this;
          resources.load(url,function(error,asset:Asset){
              // 将 prefab 资源实例化
              console.log("#######加载成功");
              self.updateShowGrid();
          })
      }
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
          let prefabAsset:Prefab = resources.get("prefab/ShulteGridItemShow");
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
      let txtType:Label = this._itemNode.getChildByName("txtType").getComponent(Label);
      txtType.string = this._type + "X" + this._type;
  }

  public setSelected(isSelected:boolean){
      if (this._isSelected == isSelected){
          return;
      }
      this._normalNode.active = !isSelected;
      this._selectedNode.active = isSelected;
      this._isSelected = isSelected;
  }
}


