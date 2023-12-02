import { utils,Node } from "cc";

export class LayerManager{
    //主界面层
    public static mainLayer:Node;
    //游戏层
    public static gameLayer:Node;
    //弹窗层
    public static popupLayer:Node;
    //layerManager根节点
    public static root:Node;
    public static init(){
        this.root = utils.find("Canvas/LayerManager");
        this.mainLayer = this.root.getChildByName("MainLayer");
        this.gameLayer = this.root.getChildByName("GameLayer");
        this.popupLayer = this.root.getChildByName("PopupLayer");
    }
}