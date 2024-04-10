import { Component, Label, Tween, UIOpacity, UITransform, Vec3, _decorator, screen, tween} from "cc";
import { LayerManager } from "../../manager/LayerManager";
import { TipRoll } from "./TipRoll";
const {ccclass,property} = _decorator;

@ccclass
export class TipRollItem extends Component {
	@property(Label) txtTips:Label = null;
    @property(UITransform) tf:UITransform = null;
	@property(UIOpacity) alpha:UIOpacity = null;
	public firstFlyPosY:number;
	public lastFlyPosY:number;
    private _pos:Vec3;
    protected onLoad(): void {
        this._pos = this.node.getPosition(this._pos);
    }
	
	public setText(tips:string):void {
		this.txtTips.string = tips;
	}

    public showTween(){
        let posY = 100;
		let endPosY = posY + TipRoll.FLY_HEIGHT;
		this.firstFlyPosY = endPosY;
		this.lastFlyPosY = posY + (TipRoll.FLY_HEIGHT + ((TipRoll.MAX_SHOW_ITEM_COUNT - 1) * TipRoll.ITEM_HEIGHT));
        
		TipRoll.FLYING_ITEM_LIST.unshift(this);
        this.flyTween(endPosY);
    }

    public flyTween(endY:number){
        this.node.setPosition(0,100);
		this.alpha.opacity = 0;

        tween(this.alpha).to(0.3,{opacity:255}).start();
        this._pos.y = endY;
        tween(this.node).to(0.3,{position:this._pos}).start().call(()=>{
            this.onKeepShow();
        }).start();
    }

    public onKeepShow(){
        tween(this.node).delay(1).call(()=>{
            TipRoll.FLYING_ITEM_LIST.splice(TipRoll.FLYING_ITEM_LIST.indexOf(this), 1);
            this.hideTween();
        }).start();
    }

    public hideTween(){
        tween(this.alpha).to(0.3,{opacity:0}).start();
        this._pos.y = this.node.position.y + this.tf.contentSize.height;
        tween(this.node).to(0.3,{position:this._pos}).start().call(()=>{
            this.resetItem();
        }).start();
    }

    public stopTween(){
        Tween.stopAllByTarget(this.alpha);
        Tween.stopAllByTarget(this.node);
    }

	public resetItem():void {
		this.node.removeFromParent();
		this.txtTips.string = "";
        TipRoll.ITEM_POOL.push(this);
	}
}