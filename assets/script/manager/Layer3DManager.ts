import { Component, Node, _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export class Layer3DManager extends Component{
    @property(Node)gameLayer:Node = null;
    public static gameLayer:Node;
    protected onLoad(): void {
        Layer3DManager.gameLayer = this.gameLayer;
    }
    // public static get gameLayer():Node{
    //     return this._gameLayer;
    // };
}