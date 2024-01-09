import { _decorator, Button, Component, instantiate, Label, Node, Prefab, resources, Sprite } from 'cc';
import Mgr from '../../manager/Mgr';
import { EventManager } from '../../manager/EventManager';
import { EventEnum } from '../../enum/EventEnum';
import { CacheManager } from '../../manager/CacheManager';
import { BannerRewardId,SDK } from '../../SDK/SDK';
const { ccclass, property } = _decorator;

@ccclass('GameShopView')
export class GameShopView extends Component {
    private static ITEM_POOL:GameShopItem[] = [];

    private _showContent:Node;
    private _firstNode:Node;
    private _showItems:GameShopItem[];
    private _txtMoney:Label;
    private _btnShare:Node;
    onLoad() {
        this._showItems = [];
        this._showContent = this.node.getChildByPath("scrollItem/view/content");
        this._firstNode = this._showContent.getChildByName("GameShopItem");
        this._firstNode.active = false;
        let shopList = CacheManager.shop.getShopConfig();
        for(let i = 0; i < shopList.length; i++){
            let item = this.getItem();
            item.setData(shopList[i]);
            this._showItems.push(item);
        }

        this._txtMoney = this.node.getChildByName("txtMoney").getComponent(Label);
        this._btnShare = this.node.getChildByName("btnShare");
        this._btnShare.active = false;
        this._btnShare.on(Button.EventType.CLICK,()=>{
            this._btnShare.active = false;
            CacheManager.shop.sendShare();
        });
    }

    protected onEnable(): void {
        EventManager.addListener(EventEnum.OnBannerAdComplete,this.OnBannerAdComplete,this);
        EventManager.addListener(EventEnum.OnGridSkinUpdate,this.OnGridSkinUpdate,this);
        EventManager.addListener(EventEnum.OnPlayerInfoUpdate,this.OnPlayerInfoUpdate,this);
        EventManager.addListener(EventEnum.OnPlayerMoneyUpdate,this.OnMoneyUpdate,this);
        EventManager.addListener(EventEnum.OnShareRewardUpdate,this.OnShareRewardUpdate,this);
        
        this.OnPlayerInfoUpdate();
        CacheManager.shop.checkShare();
    }

    protected onDisable(): void {
        EventManager.removeListener(EventEnum.OnBannerAdComplete,this.OnBannerAdComplete,this);
        EventManager.removeListener(EventEnum.OnGridSkinUpdate,this.OnGridSkinUpdate,this);
        EventManager.removeListener(EventEnum.OnPlayerInfoUpdate,this.OnPlayerInfoUpdate,this);
        EventManager.removeListener(EventEnum.OnPlayerMoneyUpdate,this.OnMoneyUpdate,this);
        EventManager.removeListener(EventEnum.OnShareRewardUpdate,this.OnShareRewardUpdate,this);
    }

    private OnShareRewardUpdate(){
        if(!this._btnShare){
            return;
        }
        let hadGet = CacheManager.shop.shareRewardHadGet();
        this._btnShare.active = !hadGet && SDK.isLogin();
    }

    private OnMoneyUpdate(){
        let money = CacheManager.player.getMoney();
        this._txtMoney.string = "我的积分：" + money;
    }

    private OnPlayerInfoUpdate(){
        if(this._showItems){
            this.OnGridSkinUpdate();
        }
        this.OnMoneyUpdate();
    }

    private OnGridSkinUpdate(){
        for(let i = 0; i < this._showItems.length; i++){
            this._showItems[i].updateState();
        }
    }

    private OnBannerAdComplete(rewardId,data){
        if(rewardId != BannerRewardId.GameGridSkin){
            return;
        }
        CacheManager.gameGrid.UpdateSkin(data);
        SDK.showToast("使用成功");
    }

    private getItem():GameShopItem{
        let item:GameShopItem = GameShopView.ITEM_POOL.shift();
        if(!item){
            if(this._firstNode){
                let itemNode = instantiate(this._firstNode);
                this._showContent.addChild(itemNode);
                item = new GameShopItem(itemNode);
                itemNode.active = true;
            }
            else{
                console.log("找不到资源");
            }
        }
        else{
            item.show(this._showContent);
        }
        return item;
    }

    update(deltaTime: number) {
        
    }
}

class GameShopItem {
    private _itemNode:Node;

    private _itemSp:Sprite;
    private _txtPrice:Label;
    private _btnBuy:Node;
    private _btnAdBuy:Node;
    private _btnBuyTxt:Label;

    private _data:any;
    public constructor(node:Node){
        this._itemNode = node;
        
        this.initUI(node);
    }

    private initUI(node:Node){
        this._itemSp = node.getChildByName("img_skin").getComponent(Sprite);
        this._txtPrice = node.getChildByName("txtPrice").getComponent(Label);
        this._btnBuy = node.getChildByName("btnBuy");
        this._btnBuyTxt = this._btnBuy.getChildByName("Label").getComponent(Label);
        this._btnBuy.on(Button.EventType.CLICK,()=>{
            let skinId = this._data.skin_id;
            if(CacheManager.shop.haveBoughtSkin(skinId)){
                if(CacheManager.shop.isUsed(skinId)){
                    //使用中,卸下
                    CacheManager.shop.sendUse(0);
                }else{
                    //使用
                    CacheManager.shop.sendUse(skinId);
                }

            }else{
                //购买
                if(!CacheManager.player.checkMoneyEnough(this._data.price)){
                    SDK.showToast("积分不足");
                }
                else{
                    CacheManager.shop.sendBuy(this._data.skin_id);
                }
            }

        });
        this._btnAdBuy = node.getChildByName("btnAdBuy");
        this._btnAdBuy.on(Button.EventType.CLICK,this.onAdBuy,this);
    }

    private onAdBuy(){
        // EventManager.dispatch(EventEnum.OnBannerAdComplete,2,this._data);
        SDK.ShowRewardBanner(BannerRewardId.GameGridSkin,this._data);
    }

    public show(parent:Node){
        parent.addChild(this._itemNode);
        this._itemNode.active = true;
    }

    public setData(data){
        this._data = data;
        if(!data){
            return;
        }
        this.updateState();
        Mgr.loader.SetSpriteByAtlas(this._itemSp,"animal_square",data.resName);
    }

    public updateState(){
        let skinId = this._data.skin_id
        if(CacheManager.shop.haveBoughtSkin(skinId)){
            if(CacheManager.shop.isUsed(skinId)){
                this._txtPrice.string = "使用中"
                this._btnBuyTxt.string = "还原";
                this._btnBuy.active = true;
            }
            else{
                this._txtPrice.string = "已拥有";
                this._btnBuyTxt.string = "使用";
                this._btnBuy.active = true;
            }
            this._btnAdBuy.active = false;
        }
        else {
            this._btnBuyTxt.string = "兑换";
            if(this._data.type == 1){
                this._txtPrice.string = this._data.price + "积分";
                this._btnBuy.active = true;
                this._btnAdBuy.active = false;
            }
            else {
                this._txtPrice.string = "观看广告即可试用";
                this._btnBuy.active = false;
                this._btnAdBuy.active = true;
            }
        }
    }
}


