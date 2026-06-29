import { BoxCollider, Color, gfx, MeshRenderer, Node } from "cc";
import { EntityDisplayComponent } from "../EntityDisplayComponent";
import { GridEntityVo } from "../../vo/GridEntityVo";
import NodeUtils from "../../utils/NodeUtils";

export default class GridPreviewComponent extends EntityDisplayComponent {
    private _bodyNode:Node;
    private _previewNode:Node;
    private _rightNode:Node;
    private _errorNode:Node;
    private _collider:BoxCollider;
    protected onInit(): void {
        
    }

    protected onViewLoaded(node: Node): void {
        this._bodyNode = node.getChildByName("body");
        this._collider = node.getChildByName("collider").getComponent(BoxCollider);
        this._previewNode = node.getChildByPath("preview");
        this._rightNode = this._previewNode.getChildByName("right");
        this._errorNode = this._previewNode.getChildByName("error");
        this.updateEmpty();
        this.updatePreResult();
    }

    protected onEntityVoPropUpdate(evt: { key: OwnKeys<GridEntityVo>; val: any }): void {
        switch(evt.key){
            case "isEmpty":
            case "isBattleGrid":
                this.updateEmpty();
                break;
            case "isPreview":
                this.updatePreResult();
                break;
        }
        super.onEntityVoPropUpdate(evt as any);
    }

    private updateEmpty(){
        if (!this.vo) return;
        const vo = this.vo as GridEntityVo;
        if(vo.isEmpty && !vo.isBattleGrid) {
            //空
            this._collider.node.setPosition(0,-1,0);
            this._bodyNode.active = false;
        }
        else {
            //非空
            this._collider.node.setPosition(0,0,0);
            this._bodyNode.active = true;
        }
    }

    private updatePreResult(){
        if (!this.vo) return;
        const vo = this.vo as GridEntityVo;
        const isPreview = vo.isPreview;
        this._previewNode.active = isPreview;
        if(isPreview) {
            const isRight = vo.isEmpty;//是否可以放置
            if(!isRight) this._bodyNode.active = false;
            this._rightNode.active = isRight;
            this._errorNode.active = !isRight;
        }
        else {
            if(!vo.isEmpty) this._bodyNode.active = true;
        }
    }
}