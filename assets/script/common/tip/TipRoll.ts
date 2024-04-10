import { Prefab, UIOpacity, game, instantiate, screen, tween } from "cc";
import { UIModuleEnum } from "../../enum/UIDefine";
import { TipRollItem } from "./TipRollItem";
import Mgr from "../../manager/Mgr";
import { LayerManager } from "../../manager/LayerManager";

/**
 * 滚动Tip
 */
export class TipRoll {
	/**
	 * 单次移动y轴矩离 
	 */
	public static FLY_HEIGHT: number = 100;
	/**
	 * 消息显示项高度  
	 */
	public static ITEM_HEIGHT: number = 70;
	/**
	 * 最大显示条数
	 */
	public static MAX_SHOW_ITEM_COUNT:number = 1;
	public static FLYING_ITEM_LIST: TipRollItem[] = [];
    public static ITEM_POOL:TipRollItem[] = [];
    private static ItemPrefab:Prefab;
	public constructor() {
	}

	public static getItem():TipRollItem {
        let item = TipRoll.ITEM_POOL.pop();
        if(!item) {
            let node = instantiate(TipRoll.ItemPrefab);
            item = node.getComponent(TipRollItem);
        }
        LayerManager.tipsLayer.addChild(item.node);
		return item;
	}

	public show(message:string):void {
		if (message == "" || message == null) {
			return;
		}
        if(!TipRoll.ItemPrefab){
            Mgr.loader.LoadUIPrefab(UIModuleEnum.common,"TipRollItem",(prefab:Prefab)=>{
                TipRoll.ItemPrefab = prefab;
                let item:TipRollItem = TipRoll.getItem();
                if(item) {
                    item.setText(message);
                    this.flyMsgItem(item);
                }
            });
        }
        else{
            let item:TipRollItem = TipRoll.getItem();
            if(item) {
                item.setText(message);
                this.flyMsgItem(item);
            }
        }
	}

	private flyMsgItem(item: TipRollItem) {
		item.showTween();

		for (let i:number = TipRoll.FLYING_ITEM_LIST.length - 1; i >= 0; i--) {
			let lastItem = TipRoll.FLYING_ITEM_LIST[i];
			lastItem.stopTween();
			let endPosY = lastItem.firstFlyPosY + i * TipRoll.ITEM_HEIGHT;
			if (endPosY > lastItem.lastFlyPosY) {
                //移出溢出项
                TipRoll.FLYING_ITEM_LIST.splice(TipRoll.FLYING_ITEM_LIST.indexOf(lastItem), 1);
                lastItem.hideTween();
				continue;
			}
            lastItem.flyTween(endPosY);
		}
	}
}