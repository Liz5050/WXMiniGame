import { _decorator, Button, Label, math, Node, Sprite, Toggle } from 'cc';
import { EventManager } from '../manager/EventManager';
import { EventEnum } from '../enum/EventEnum';
import { GameDefine, GameType } from '../enum/GameType';
import Mgr from '../manager/Mgr';
import { BaseUISubView } from './base/BaseUISubView';
import { CacheManager } from '../manager/CacheManager';
import { SDK } from '../SDK/SDK';

export class MainMenu extends BaseUISubView {
    private _imgAvatar:Sprite;
    private _tabItems:MenuTabItem[];
    private _tabData:{title:string}[];
    private _subViews:Node[];
    private _curIndex:number = -1;
    private _btnSideBar:Node;
    public constructor(node:Node){
        super(node);
    }

    protected initUI(){
        let self = this;
        let tabBar = this.getChildByName("tabBar");
        this._tabItems = [];
        this._tabData = [{title:"商店"},{title:"主页"},];
        for(let i = 0; i < this._tabData.length; i++){
            let tabNode:Node = tabBar.getChildByName("item" + i);
            tabNode.on(Button.EventType.CLICK,function(){
                self.SetTabIdx(i);
            });
            let tabItem = new MenuTabItem(tabNode);
            tabItem.setData(this._tabData[i]);
            this._tabItems.push(tabItem);
        }
        let container = this.getChildByName("Container");
        this._subViews = [];
        this._subViews.push(container.getChildByName("GameShopView"));

        this._imgAvatar = this.getChildByPath("UserInfo/imgAvatar").getComponent(Sprite);

        let muteToggle:Toggle = this.getChildByName("muteToggle").getComponent(Toggle);
        let soundNormal:Node = muteToggle.node.getChildByName("normal");
        muteToggle.node.on(Toggle.EventType.TOGGLE,function(){
            soundNormal.active = !muteToggle.isChecked;
            Mgr.soundMgr.setMute(muteToggle.isChecked);
        });

        let layout = this.getChildByName("Layout");
        let btnShulte = layout.getChildByName("btnShulte");
        btnShulte.on(Button.EventType.CLICK,function(){
            self.OnStartGame(GameType.Shulte);
        });
        let btnGridGame = layout.getChildByName("btnGrid");
        btnGridGame.on(Button.EventType.CLICK,function(){
            self.OnStartGame(GameType.Grid);
            Mgr.soundMgr.play("game_start");
        });

        let btnHit = layout.getChildByName("btnHit");
        btnHit.on(Button.EventType.CLICK,()=>{
            this.OnStartGame(GameType.GameHit);
        });

        let btnNullify = layout.getChildByName("btnNullify");
        let clickCount = 0;
        let targetNum = -1;
        btnNullify.on(Button.EventType.CLICK,function(){
            // self.OnStartGame(GameType.GameBall);
            let showTips:string = "别着急，已经在做了~";
            clickCount++;
            if(targetNum == -1){
                targetNum = 1 + Math.round(Math.random()*10);
            }
            if(clickCount >= targetNum + 20){
                showTips = "有事？vme50（vx：lizhi5050）";
                clickCount = 0;
                targetNum = 1 + Math.round(Math.random()*10);
            }
            else if(clickCount >= targetNum + 12){
                showTips = "休息一会儿吧~已经在加快速度了";
            }
            else if(clickCount >= targetNum + 11){
                self.OnStartGame(GameType.GameBall);
            }
            else if(clickCount >= targetNum + 10){
                showTips = "这么期待？给你看一眼？";
            }
            else if(clickCount >= targetNum){
                showTips = "别着急，已经在做了~";
            }
            SDK.showToast(showTips);
        });
        let openDatacontext = this.getChildByName("openDataContext");
        let btnRank = this.getChildByName("btnRank");
        btnRank.on(Button.EventType.CLICK,function(){
            openDatacontext.active = true;
            SDK.showRank("rank_" + GameType.Shulte);
        });

        let btnWorldRank = this.getChildByName("btnWorldRank");
        btnWorldRank.on(Button.EventType.CLICK,function(){
            if(SDK.isLogin()){
                // SDK.showToast("正在开发接入中...");
                EventManager.dispatch(EventEnum.OnShowWorldRank);
            }
            else{
                SDK.showToast("请先登录授权");
            }
        });
        
        let btnClose = openDatacontext.getChildByName("btnClose");
        btnClose.on(Button.EventType.CLICK,function(){
            openDatacontext.active = false;
        });
        let btnShulteRank = openDatacontext.getChildByName("btnShulteRank");
        btnShulteRank.on(Button.EventType.CLICK,function(){
            SDK.showRank("rank_" + GameType.Shulte);
        });

        let btnGridRank = openDatacontext.getChildByName("btnGridRank");
        btnGridRank.on(Button.EventType.CLICK,function(){
            SDK.showRank("rank_" + GameType.Grid);
        });

        let btnTest = this.getChildByName("btnTest");
        btnTest.on(Button.EventType.CLICK,function(){
            Mgr.sceneMgr.LoadScene("sceneTest");
        });

        this._btnSideBar = this.getChildByName("btnSideBar");
        this._btnSideBar.on(Button.EventType.CLICK,()=>{
            EventManager.dispatch(EventEnum.OnShowSideBarView);
        });

        this.OnUserInfoUpdate();
        this.OnSideBarRewardUpdate();
        this.SetTabIdx(1);
    }

    protected initEvent(){
        EventManager.addListener(EventEnum.OnUserInfoUpdate,this.OnUserInfoUpdate,this);
        EventManager.addListener(EventEnum.OnRankViewClose,this.OnRankViewClose,this);
        EventManager.addListener(EventEnum.OnSideBarRewardUpdate,this.OnSideBarRewardUpdate,this);
    }

    private OnSideBarRewardUpdate(){
        let hadGet = CacheManager.storage.getBoolean("skinId_3");
        this._btnSideBar.active = SDK.isBytedance() && !hadGet;
    }

    private OnRankViewClose(){
        this.SetTabIdx(1);
    }

    private SetTabIdx(index:number){
        if(this._curIndex == index){
            return;
        }
        // if(index != 0 && index != 2 && index != 4){
        //     SDK.showToast("功能暂未开放");
        //     return;
        // }
        if(index == 2){
            if(!SDK.isLogin()){
                SDK.showToast("请先登录授权");
                return;
            }
            else{
                EventManager.dispatch(EventEnum.OnShowWorldRank);
            }
        }

        if(this._curIndex >= 0){
            this._tabItems[this._curIndex].selected = false;
            let view = this._subViews[this._curIndex];
            if(view){
                view.active = false;
            }
        }
        this._curIndex = index;
        this._tabItems[this._curIndex].selected = true;
        let view = this._subViews[index];
        if(view){
            view.active = true;
        }
    }

    private OnUserInfoUpdate(){
        let user = CacheManager.player.userInfo;
        if(user){
            Mgr.loader.SetSpriteFrame(this._imgAvatar,user.avatarUrl);
        }
        else{
            this._imgAvatar.node.active = false;
        }
    }

    private OnStartGame(type:GameType){
        let resData = GameDefine.getGameRes(type);
        if(resData){
            if(resData.isAllReady){
                EventManager.dispatch(EventEnum.OnGameStart,type);
            }
            else {
                resData.loadRes(()=>{
                    EventManager.dispatch(EventEnum.OnGameStart,type);
                });
            }
        }
        else {
            EventManager.dispatch(EventEnum.OnGameStart,type);
        }
    }
}

class MenuTabItem {
    private _itemNode:Node;
    private _normal:Node;
    private _selected:Node;
    private _txtTitle:Label;
    private _txtColor:math.Color;

    private _isSelected:boolean;
    public constructor(itemNode:Node){
        this._itemNode = itemNode;
        this.initUI(itemNode);
    }

    public initUI(node:Node){
        this._txtColor = new math.Color();

        this._normal = node.getChildByName("normal");
        this._selected = node.getChildByName("selected");
        this._txtTitle = node.getChildByName("txtTitle").getComponent(Label);
    }

    public setData(data){
        this._txtTitle.string = data.title;
    }

    public set selected(val:boolean){
        if(this._isSelected == val){
            return;
        }
        this._isSelected = val;
        this._selected.active = val;
        this._normal.active = !val;
        if(val){
            this._txtColor.set(232,106,23);
        }else{
            this._txtColor.set(255,255,255);
        }
        this._txtTitle.color = this._txtColor;
    }
}

