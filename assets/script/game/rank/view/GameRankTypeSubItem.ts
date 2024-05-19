import { Label, Sprite, Texture2D, math, Node } from "cc";
import { GameGridRankData } from "../../../cache/GameGridCache";
import Mgr from "../../../manager/Mgr";
import { CacheManager } from "../../../manager/CacheManager";

export class GameWorldRankItem {
    private _bg:Sprite;
    private _imgHead:Sprite;
    private _txtName:Label;
    private _txtRank:Label;
    private _txtValue:Label;
    private _node:Node;
    private _headTexture:Texture2D;
    private _bgColor:math.Color;

    private _rankData:any;
    private _isPlayTimeRank:boolean = false;
    private _isMine:boolean = false;
    public constructor(node:Node){
        this.initUI(node);
    }

    private initUI(node:Node){
        this._node = node;
        this._bgColor = new math.Color();
        this._bg = node.getChildByName("bg").getComponent(Sprite);
        this._imgHead = node.getChildByName("imgHead").getComponent(Sprite);
        this._txtRank = node.getChildByName("txtRank").getComponent(Label);
        this._txtValue = node.getChildByName("txtValue").getComponent(Label);
        this._txtName = node.getChildByName("txtName").getComponent(Label);
    }

    public Show(parentNode:Node){
        parentNode.addChild(this._node);
        this._node.active = true;
    }

    public SetData(rankData:GameGridRankData,index:number){
        this._rankData = rankData;
        if(index >= 0){
            if(index % 2 == 0){
                this._bgColor.r = 199;
                this._bgColor.g = 230;
                this._bgColor.b = 235;
            }else{
                this._bgColor.r = 197;
                this._bgColor.g = 221;
                this._bgColor.b = 224;
            }
            this._bg.color = this._bgColor;
        }
        if(rankData){
            this._txtRank.string = rankData.rank.toString();
            this._txtValue.string = rankData.valueStr;
            this._txtName.string = rankData.name;
            if(rankData.avatarUrl != ""){
                Mgr.loader.SetSpriteFrame(this._imgHead,rankData.avatarUrl);
            }
            else {
                let skinRes = CacheManager.shop.getRandomRes();
                if(skinRes){
                    Mgr.loader.SetSpriteByAtlas(this._imgHead,"animal_square",skinRes);
                }
            }
        }
        else {
            this._txtRank.string = "-";
            this._txtValue.string = "未上榜";
            let user = CacheManager.player.userInfo;
            if(user){
                this._txtName.string = user.nickName;
                Mgr.loader.SetSpriteFrame(this._imgHead,user.avatarUrl);
            }
            else {
                let skinRes = CacheManager.shop.getRandomRes();
                this._txtName.string = "神秘人";
                if(skinRes){
                    Mgr.loader.SetSpriteByAtlas(this._imgHead,"animal_square",skinRes);
                }
            }
        }
    }

    public Clear(){
        // if(this._rankData){
        //     Mgr.loader.DecRefSpriteFrame(this._rankData.avatarUrl)
        // }
        this._node.active = false;
        this._node.removeFromParent();
        this._rankData = null;
    }
}