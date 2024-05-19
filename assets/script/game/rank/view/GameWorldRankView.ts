import { _decorator, Button, Game, instantiate, Label, math, Node, Prefab, resources, ScrollView, Sprite, Texture2D } from 'cc';
import { GameDefine, GameSubType, GameType } from '../../../enum/GameType';
import Mgr from '../../../manager/Mgr';
import { EventManager } from '../../../manager/EventManager';
import { EventEnum } from '../../../enum/EventEnum';
import { CacheManager } from '../../../manager/CacheManager';
import { BaseUIView } from '../../base/BaseUIView';
import { UIModuleEnum } from '../../../enum/UIDefine';
import { SDK } from '../../../SDK/SDK';
import { GameGridRankData } from '../../../cache/GameGridCache';
import { DateUtils } from '../../../utils/DateUtils';
import { GameWorldRankItem } from './GameRankTypeSubItem';

export class GameWorldRankView extends BaseUIView {

    private static ITEM_POOL:GameWorldRankItem[] = [];
    
    private _scrollRank:ScrollView;
    private _rankContent:Node;
    private _rankItemList:GameWorldRankItem[];
    private _myRankItem:GameWorldRankItem;
    private _combox:Node;
    private _comboxTitle:Label;
    private _subtypesScroll:Node;
    // private _txtSwitch:Label;
    private _txtTips:Label;
    private _imgArrow:Node;
    private _subtypeItemList:Node[];
    private _subtypeTitle:Label[];

    private _curIndex:number = -1;
    private _subIdx:number = -1;
    private _btnList:RankBtnItem[];
    private _rankType:GameType[];//排行榜类型
    private _dataList:any[];
    private _txtPage:Label;
    private _curPage:number = -1;
    private _maxPage:number = -1;
    public constructor(){
        super(UIModuleEnum.rank,"GameWorldRankView");
    }

    protected initUI(){
        let self = this;
        this._rankItemList = [];
        // let maskBg = this.getChildByName("maskBg");
        this.addCloseHandler("maskBg");
        // maskBg.on(Button.EventType.CLICK,function(){
        //     self.hide();
        // })
        this._rankType = [GameType.Shulte,GameType.Grid];
        this._btnList = [];
        for (let i = 0; i < 2; i++){
            let btnNode = this.getChildByPath("tabBg/btn"+(i+1));
            btnNode.on(Button.EventType.CLICK,function(){
                self.setIndex(i);
            });
            let btnItem = new RankBtnItem(btnNode);
            this._btnList.push(btnItem);
        }

        this._myRankItem = new GameWorldRankItem(this.getChildByName("myRankItem"));

        let pageNode = this.getChildByName("page");
        let btnSub = pageNode.getChildByName("btnSub");
        btnSub.on(Button.EventType.CLICK,function(){
            self.OnPageChange(-1);
        });
        let btnAdd = pageNode.getChildByName("btnAdd");
        btnAdd.on(Button.EventType.CLICK,function(){
            self.OnPageChange(1);
        });
        this._txtPage = pageNode.getChildByName("txtPage").getComponent(Label);
        this._combox = this.getChildByName("combox");
        this._comboxTitle = this._combox.getChildByName("txtTitle").getComponent(Label);
        this._subtypesScroll = this._combox.getChildByName("scrollView");
        let btnSwitch = this._combox.getChildByName("btnSwitch");
        btnSwitch.on(Button.EventType.CLICK,function(){
            let isShow = !self._subtypesScroll.active;
            self._subtypesScroll.active = isShow;
            let scaleY = isShow ? -1 : 1;
            self._imgArrow.setScale(1,scaleY);
        });
        this._imgArrow = btnSwitch.getChildByName("imgArrow");

        this._subtypeItemList = [];
        this._subtypeTitle = [];
        let subtypes = GameDefine.ShulteSubTypes;
        for(let i = 0; i < subtypes.length; i ++){
            let subItemNode = this._combox.getChildByPath("scrollView/view/content/item" + i);
            subItemNode.on(Button.EventType.CLICK,this.OnSubItemSelected,this);
            this._subtypeItemList.push(subItemNode);

            let txtSubType = subItemNode.getChildByName("txtTitle").getComponent(Label);
            txtSubType.string = subtypes[i] + "X" + subtypes[i];
            this._subtypeTitle.push(txtSubType);
        }
        this._scrollRank = this.getChildByName("scrollRank").getComponent(ScrollView);
        this._rankContent = this.getChildByPath("scrollRank/view/content");
        this._txtTips = this.getChildByName("txtTips").getComponent(Label);
    }
    public onShowAfter(){
        this.setIndex(0);
    }

    protected initEvent(){
        EventManager.addListener(EventEnum.OnGameGridRankUpdate,this.OnRankListUpdate,this);
    }

    private OnPageChange(value){
        let page = this._curPage + value;
        if(page <= 0){
            return;
        }
        if(page > this._maxPage){
            SDK.showToast("已经到底啦~");
            return;
        }
        this.SetPage(page);
    }

    private SetPage(page:number){
        if(page == this._curPage){
            return
        }
        if(page > this._maxPage){
            return;
        }
        if(this._curPage > 0){
            this.clearItem();
        }
        this._curPage = page;
        let maxLen = this._dataList.length;
        let startIdx = (page - 1) * 10;
        let endIdx = Math.min(maxLen,startIdx + 10);
        for(let i = startIdx; i < endIdx; i++){
            let rankItem = this.getRankItem();
            rankItem.SetData(this._dataList[i],i);
            this._rankItemList.push(rankItem);
        }
        this._txtPage.string = page.toString();
        this._scrollRank.scrollToTop();
    }

    private OnRankListUpdate(type:GameType,subtype:number){
        if(this._curIndex >= 0){
            let rankType = this._rankType[this._curIndex];
            let curSubType = 0;
            let subtypeList;
            if(rankType == GameType.Shulte){
                subtypeList = GameDefine.ShulteSubTypes;
            }
            else if(rankType == GameType.Grid) {
                subtypeList = GameDefine.GridSubTypes;
            }
            curSubType = subtypeList[this._subIdx];
            if(rankType == type && subtype == curSubType){
                this.RefreshRankListView(type,curSubType);
            }
            else {
                console.log("排行榜数据更新延迟，当前页面已经切换，请等待当前页面的排行榜更新",type,subtype);
            }
        }
    }

    private RefreshRankListView(type:GameType,subtype:number){
        this._dataList = CacheManager.gameGrid.GetWorldRankDataList(type,subtype);
        if(this._dataList){
            let len = this._dataList.length;
            this._maxPage = Math.ceil(len / 10);
            this.SetPage(1);
        }
        let myData = CacheManager.gameGrid.GetMyRankData(type,subtype);
        this._myRankItem.SetData(myData,-1);
    }

    public setIndex(index:number){
        if(this._curIndex == index){
            return;
        }
        if(this._curIndex >= 0){
            this._btnList[this._curIndex].selected = false;
            this._curPage = -1;
            this.clearItem();
            this.clearSubIdx();
        }
        this._curIndex = index;
        this._btnList[this._curIndex].selected = true;

        let rankType = this._rankType[index];
        let subtypes;
        if(rankType == GameType.Shulte){
            this._combox.active = true;
            subtypes = GameDefine.ShulteSubTypes;
        }
        else if(rankType == GameType.Grid){
            this._combox.active = true;
            subtypes = GameDefine.GridSubTypes;
        }
        else {
            this._combox.active = false;
        }
        for(let i = 0; i < this._subtypeItemList.length; i++){
            let subtype = subtypes[i];
            if(subtype && subtype > 0) {
                this._subtypeItemList[i].active = true;
                this._subtypeTitle[i].string = GameDefine.getSubtypeName(rankType,subtype);
            }
            else {
                this._subtypeItemList[i].active = false;    
            }
        }
        this.setSubIndex(0);
    }

    private OnSubItemSelected(evt){
        let btnNode = evt.node;
        let index = this._subtypeItemList.indexOf(btnNode);
        this._subtypesScroll.active = false;
        this._imgArrow.setScale(1,1);
        this.setSubIndex(index);
    }

    private setSubIndex(index:number){
        if(this._subIdx == index){
            return;
        }
        if(this._subIdx >= 0){
            this._curPage = -1;
            this.clearItem();
        }
        this._subIdx = index;
        let rankType = this._rankType[this._curIndex];
        let subtype = 0;
        let subtypeList = rankType == GameType.Shulte ? GameDefine.ShulteSubTypes : GameDefine.GridSubTypes;
        subtype = subtypeList[this._subIdx];
        this._comboxTitle.string = GameDefine.getSubtypeName(rankType,subtype);
        CacheManager.gameGrid.ReqRankDataList(rankType,subtype);
    }

    private getRankItem():GameWorldRankItem{
        let item:GameWorldRankItem = GameWorldRankView.ITEM_POOL.shift();
        if(!item){
            this.getModuleRes("GameWorldRankItem",(prefab:Prefab)=>{
                let itemNode = instantiate(prefab);
                this._rankContent.addChild(itemNode);
                item = new GameWorldRankItem(itemNode);
            });
        }
        else{
            item.Show(this._rankContent);
        }
        return item;
    }

    private clearItem(){
        for (let i = 0; i < this._rankItemList.length; i++) {
            let item = this._rankItemList[i];
            item.Clear();
            GameWorldRankView.ITEM_POOL.push(item);
        }
        this._rankItemList = [];
    }

    private clearSubIdx(){
        this._subtypesScroll.active = false;
        this._imgArrow.setScale(1,1);
        this._subIdx = -1;
    }

    public onHide(){
        this.clearItem();
        this._maxPage = -1;
        this._curPage = -1;
        this._btnList[this._curIndex].selected = false;
        this._curIndex = -1;
        this.clearSubIdx();
        // this.node.active = false;
        this._dataList = null;
        EventManager.dispatch(EventEnum.OnRankViewClose);
    }
}


class RankBtnItem{
    private _btnNode:Node;
    private _selectedBg:Node;
    private _txtName:Label;
    private _isSelected:boolean;
    private _txtColor:math.Color;
    public constructor(node:Node){
        this._btnNode = node;
        this._txtColor = new math.Color();
        this.initUI();   
    }

    private initUI(){
        this._selectedBg = this._btnNode.getChildByName("selectedBg");
        this._txtName = this._btnNode.getChildByName("txtName").getComponent(Label);
    }

    public set selected(value:boolean){
        if(this._isSelected == value){
            return
        }
        this._isSelected = value;
        this._selectedBg.active = value;
        if(value){
            this._txtColor.set(232,106,23);
        }else{
            this._txtColor.set(255,255,255);
        }
        this._txtName.color = this._txtColor;
    }
}