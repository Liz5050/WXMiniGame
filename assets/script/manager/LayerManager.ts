import { utils,Node } from "cc";

export class LayerManager{
    public static HUDLayer:Node;
    //主界面层
    public static mainLayer:Node;
    //游戏层
    public static gameLayer:Node;
    //弹窗层
    public static popupLayer:Node;
    //提示层
    public static tipsLayer:Node;
    //最上层
    public static topLayer:Node;
    //layerManager根节点
    public static root:Node;
    public static init(){
        this.root = utils.find("Canvas/LayerManager");
        this.HUDLayer = this.root.getChildByName("HUDLayer");
        this.mainLayer = this.root.getChildByName("MainLayer");
        this.gameLayer = this.root.getChildByName("GameLayer");
        this.popupLayer = this.root.getChildByName("PopupLayer");
        this.tipsLayer = this.root.getChildByName("TipsLayer");
        this.topLayer = this.root.getChildByName("TopLayer");
    }
}