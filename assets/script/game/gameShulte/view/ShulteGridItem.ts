import { _decorator, Component, Label, math, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ShulteGridItem')
export class ShulteGridItem extends Component {
    private _index:number;
    private _txtNum:Label;
    onLoad() {
        let r = Math.floor((3 * Math.random() + 5) / 10 * 255);//0.5-0.8
        let g = Math.floor((2 * Math.random() + 7) / 10 * 255);//0.7-0.9
        let b = Math.floor((1.5 * Math.random() + 8) / 10 * 255);//0.8-0.95
        // console.log("itemGrid onAwake=====r:"+r + "  ===g:"+g + "  ===b" + b);
        // gameObject.GetComponent<Image>().color = new Color(r,g,b); 
        let sp:Sprite = this.getComponent(Sprite);
        sp.color = new math.Color(r,g,b);
        this._txtNum = this.node.getChildByName("txtNum").getComponent(Label);
    }

    update(deltaTime: number) {
        
    }

    public setIndex(index:number){
        this._index = index;
        this._txtNum.string = (index+1).toString();
    }
}


